const express = require('express');
const nodemailer = require('nodemailer');
const prisma = require('../prismaClient');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

function clean(value, max = 4000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, max);
}

function mailbox(value) {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function companyMailboxes() {
  const boxes = [];
  const add = ({ email, label, from, host, port, user, pass }) => {
    if (!email || !pass || boxes.some((item) => item.email === email)) return;
    boxes.push({
      email,
      label,
      from: from && from.toLowerCase().includes(email) ? from : `${label} <${email}>`,
      host: host || 'smtp.zoho.com',
      port: Number(port) || 465,
      user: email,
      pass,
    });
  };
  add({
    email: mailbox(process.env.SMTP_USER),
    label: 'HBLab',
    from: process.env.SMTP_FROM,
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    pass: String(process.env.SMTP_PASSWORD || '').trim(),
  });
  add({
    email: mailbox(process.env.STUDIO_SMTP_USER),
    label: 'HB Studio',
    from: process.env.STUDIO_SMTP_FROM,
    host: process.env.STUDIO_SMTP_HOST,
    port: process.env.STUDIO_SMTP_PORT,
    pass: String(process.env.STUDIO_SMTP_PASSWORD || '').trim(),
  });
  return boxes;
}

function publicMailboxes() {
  return companyMailboxes().map(({ email, label }) => ({ email, label }));
}

function preview(message) {
  return {
    id: message.id,
    name: message.name,
    email: message.email,
    phone: message.phone,
    excerpt: message.message.slice(0, 160),
    status: message.status,
    read: Boolean(message.readAt),
    replyCount: message._count?.replies ?? message.replies?.length ?? 0,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

async function sendFrom(box, { to, subject, text, html }) {
  const port = box.port;
  const mailer = nodemailer.createTransport({
    host: box.host,
    port,
    secure: port === 465,
    auth: { user: box.user, pass: box.pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  });
  await mailer.sendMail({
    from: box.from,
    to,
    replyTo: box.email,
    subject,
    text,
    html,
  });
}

router.post('/', async (req, res) => {
  try {
    const name = clean(req.body.name, 120);
    const email = clean(req.body.email, 160).toLowerCase();
    const phone = clean(req.body.phone, 40);
    const message = clean(req.body.message, 4000);
    if (!name || !email.includes('@') || email.includes(' ') || !phone || !message) {
      return res.status(400).json({ success: false, message: 'Enter your name, email, phone, and message.' });
    }
    const saved = await prisma.contactMessage.create({
      data: { name, email, phone, message },
    });
    res.status(201).json({ success: true, id: saved.id });
  } catch (error) {
    console.error('Contact message save failed:', error.message);
    res.status(500).json({ success: false, message: 'The message could not be saved. Please try again.' });
  }
});

router.get('/', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { replies: true } } },
    });
    res.json({ messages: messages.map(preview), mailboxes: publicMailboxes() });
  } catch (error) {
    console.error('Contact list failed:', error.message);
    res.status(500).json({ error: 'Could not load messages' });
  }
});

router.get('/:id', authMiddleware(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Unknown message' });
  try {
    const message = await prisma.contactMessage.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: 'asc' } } },
    });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (!message.readAt) {
      await prisma.contactMessage.update({ where: { id }, data: { readAt: new Date() } });
      message.readAt = new Date();
    }
    res.json({
      message: {
        id: message.id,
        name: message.name,
        email: message.email,
        phone: message.phone,
        message: message.message,
        status: message.status,
        read: true,
        createdAt: message.createdAt,
      },
      replies: message.replies.map((reply) => ({
        id: reply.id,
        fromEmail: reply.fromEmail,
        subject: reply.subject,
        body: reply.body,
        createdAt: reply.createdAt,
      })),
      mailboxes: publicMailboxes(),
    });
  } catch (error) {
    console.error('Contact detail failed:', error.message);
    res.status(500).json({ error: 'Could not open this message' });
  }
});

router.post('/:id/reply', authMiddleware(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Unknown message' });
  const fromEmail = mailbox(req.body.from);
  const subject = clean(req.body.subject, 180);
  const body = clean(req.body.body, 8000);
  const box = companyMailboxes().find((item) => item.email === fromEmail);
  if (!box) return res.status(400).json({ error: 'Choose a company email the system can send from.' });
  if (!subject || !body) return res.status(400).json({ error: 'Write a subject and a reply.' });

  try {
    const message = await prisma.contactMessage.findUnique({ where: { id } });
    if (!message) return res.status(404).json({ error: 'Message not found' });
    const text = [
      body,
      '',
      '—',
      `${message.name} wrote:`,
      message.message,
    ].join('\n');
    const html = `<div style="font-family:Arial,Helvetica,sans-serif;color:#1a3d31;line-height:1.55;">
      <p style="white-space:pre-wrap;margin:0 0 16px;">${escapeHtml(body)}</p>
      <p style="margin:24px 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#548675;">Earlier message</p>
      <blockquote style="margin:0;padding:12px 14px;border-left:3px solid #2e6b57;background:#eef3f2;white-space:pre-wrap;">${escapeHtml(message.message)}</blockquote>
      <p style="margin:20px 0 0;font-size:12px;color:#548675;">Sent by ${escapeHtml(box.label)} from ${escapeHtml(box.email)}</p>
    </div>`;
    await sendFrom(box, { to: message.email, subject, text, html });
    const reply = await prisma.contactReply.create({
      data: {
        messageId: message.id,
        fromEmail: box.email,
        subject,
        body,
        sentById: req.userId || null,
      },
    });
    await prisma.contactMessage.update({
      where: { id: message.id },
      data: { status: 'replied', readAt: new Date() },
    });
    res.json({
      reply: {
        id: reply.id,
        fromEmail: reply.fromEmail,
        subject: reply.subject,
        body: reply.body,
        createdAt: reply.createdAt,
      },
    });
  } catch (error) {
    const reason = String(error?.response || error?.message || 'The email could not be sent').replace(/\s+/g, ' ').slice(0, 180);
    console.error('Contact reply failed:', reason);
    res.status(503).json({ error: 'The reply was not sent. Check the company mailbox and try again.' });
  }
});

module.exports = router;
