const fs = require('fs');
const path = require('path');
const { prisma } = require('./utils');
const { publishUsers } = require('./live');

const VOICE_TTL = 7 * 24 * 60 * 60 * 1000;
const EXPIRED_LABEL = 'Voice message expired';
const voiceDir = path.join(__dirname, '../../../uploads');

function voiceExpired(message) {
  if (!message?.audioUrl) return false;
  const sent = new Date(message.createdAt).getTime();
  return Number.isFinite(sent) && Date.now() - sent >= VOICE_TTL;
}

function voiceFilePath(audioUrl) {
  const name = path.basename(String(audioUrl || ''));
  if (!/^voice-[a-z0-9-]+\.(m4a|aac|mp3|wav|webm|ogg|mp4)$/i.test(name)) return null;
  return path.join(voiceDir, name);
}

async function expireVoiceNotes() {
  const cutoff = new Date(Date.now() - VOICE_TTL);
  const expired = await prisma.hbmsConversationMessage.findMany({
    where: { audioUrl: { not: null }, createdAt: { lt: cutoff } },
    select: { id: true, audioUrl: true, body: true, conversationId: true },
  });
  if (!expired.length) return 0;
  const blank = expired.filter((message) => !String(message.body || '').trim()).map((message) => message.id);
  const captioned = expired.filter((message) => String(message.body || '').trim()).map((message) => message.id);
  if (blank.length) {
    await prisma.hbmsConversationMessage.updateMany({
      where: { id: { in: blank } },
      data: { audioUrl: null, audioDuration: null, body: EXPIRED_LABEL },
    });
  }
  if (captioned.length) {
    await prisma.hbmsConversationMessage.updateMany({
      where: { id: { in: captioned } },
      data: { audioUrl: null, audioDuration: null },
    });
  }
  const urls = [...new Set(expired.map((message) => message.audioUrl).filter(Boolean))];
  for (const url of urls) {
    const still = await prisma.hbmsConversationMessage.count({ where: { audioUrl: url } });
    if (still) continue;
    const file = voiceFilePath(url);
    if (file) await fs.promises.unlink(file).catch(() => {});
  }
  const conversationIds = [...new Set(expired.map((message) => message.conversationId))];
  const conversations = await prisma.hbmsConversationMember.findMany({
    where: { conversationId: { in: conversationIds } },
    select: { conversationId: true, userId: true },
  });
  for (const conversationId of conversationIds) {
    publishUsers(
      conversations.filter((member) => member.conversationId === conversationId).map((member) => member.userId),
      { type: 'conversations', conversationId },
    );
  }
  return expired.length;
}

function startVoiceExpiry() {
  const run = () => {
    expireVoiceNotes().catch((error) => {
      console.error('Voice note cleanup failed:', error.message);
    });
  };
  setTimeout(run, 20000);
  setInterval(run, 60 * 60 * 1000);
}

module.exports = { VOICE_TTL, EXPIRED_LABEL, voiceExpired, expireVoiceNotes, startVoiceExpiry };
