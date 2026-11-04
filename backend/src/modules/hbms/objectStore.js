const fs = require('fs');
const path = require('path');

const OBJECT_ROOT = path.join(__dirname, '../../../object-store');
const PRIVATE_ROOT = path.join(__dirname, '../../../private-files');
const INCOMING_ROOT = path.join(PRIVATE_ROOT, 'incoming');

const MEDIA_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif|mp4|mov|mkv|avi|m4v)$/i;
const OFFICE_EXTENSIONS = /\.(pdf|docx?|txt|pptx?|xlsx?|zip)$/i;
const MEDIA_LIMIT = 200 * 1024 * 1024;
const OFFICE_LIMIT = 8 * 1024 * 1024;

function isMedia(file) {
  const type = file.mimetype || '';
  if (type.startsWith('image/') || type.startsWith('video/')) return true;
  return MEDIA_EXTENSIONS.test(file.originalname || '');
}

function isAllowed(file) {
  return isMedia(file) || OFFICE_EXTENSIONS.test(file.originalname || '');
}

function cloudConfigured() {
  return Boolean(
    process.env.OBJECT_STORAGE_BUCKET
    && process.env.OBJECT_STORAGE_ACCESS_KEY_ID
    && process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
  );
}

function safeJoin(root, key) {
  const full = path.resolve(root, key);
  const base = path.resolve(root);
  if (full !== base && !full.startsWith(`${base}${path.sep}`)) {
    const error = new Error('Invalid storage key');
    error.status = 400;
    throw error;
  }
  return full;
}

function s3Client() {
  let clientModule;
  try {
    clientModule = require('@aws-sdk/client-s3');
  } catch {
    const error = new Error('Cloud object storage is configured, but the S3 client is not installed');
    error.status = 500;
    throw error;
  }
  const client = new clientModule.S3Client({
    region: process.env.OBJECT_STORAGE_REGION || 'auto',
    endpoint: process.env.OBJECT_STORAGE_ENDPOINT || undefined,
    credentials: {
      accessKeyId: process.env.OBJECT_STORAGE_ACCESS_KEY_ID,
      secretAccessKey: process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY,
    },
    forcePathStyle: Boolean(process.env.OBJECT_STORAGE_ENDPOINT),
  });
  return { client, clientModule };
}

async function removePath(filePath) {
  if (!filePath) return;
  await fs.promises.unlink(filePath).catch(() => {});
}

async function storeUploadedFile(file) {
  const media = isMedia(file);
  const limit = media ? MEDIA_LIMIT : OFFICE_LIMIT;
  if (file.size > limit) {
    await removePath(file.path);
    const error = new Error(media
      ? 'Photos and video must be 200 MB or smaller'
      : 'Documents must be 8 MB or smaller');
    error.status = 400;
    throw error;
  }

  const key = `${media ? 'media' : 'documents'}/${new Date().getUTCFullYear()}/${path.basename(file.filename)}`;
  if (media && cloudConfigured()) {
    const { client, clientModule } = s3Client();
    await client.send(new clientModule.PutObjectCommand({
      Bucket: process.env.OBJECT_STORAGE_BUCKET,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentType: file.mimetype || 'application/octet-stream',
    }));
    await removePath(file.path);
    return { storage: 'OBJECT', storageKey: key, provider: 's3' };
  }

  const root = media ? OBJECT_ROOT : PRIVATE_ROOT;
  const destination = safeJoin(root, key);
  await fs.promises.mkdir(path.dirname(destination), { recursive: true });
  await fs.promises.rename(file.path, destination);
  return {
    storage: media ? 'OBJECT' : 'PRIVATE',
    storageKey: key,
    provider: media ? 'object-store' : 'private-files',
  };
}

async function openStoredFile(record) {
  if (record.provider === 's3') {
    const { client, clientModule } = s3Client();
    const result = await client.send(new clientModule.GetObjectCommand({
      Bucket: process.env.OBJECT_STORAGE_BUCKET,
      Key: record.storageKey,
    }));
    return result.Body;
  }
  const root = record.storage === 'OBJECT' ? OBJECT_ROOT : PRIVATE_ROOT;
  const full = safeJoin(root, record.storageKey);
  await fs.promises.access(full);
  return fs.createReadStream(full);
}

async function deleteStoredFile(record) {
  if (record.provider === 's3') {
    const { client, clientModule } = s3Client();
    await client.send(new clientModule.DeleteObjectCommand({
      Bucket: process.env.OBJECT_STORAGE_BUCKET,
      Key: record.storageKey,
    }));
    return;
  }
  const root = record.storage === 'OBJECT' ? OBJECT_ROOT : PRIVATE_ROOT;
  await removePath(safeJoin(root, record.storageKey));
}

module.exports = {
  INCOMING_ROOT,
  isMedia,
  isAllowed,
  storeUploadedFile,
  openStoredFile,
  deleteStoredFile,
  removePath,
};
