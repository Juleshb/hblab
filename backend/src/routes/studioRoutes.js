const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

function clean(value, max = 2000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, max);
}

function env(name) {
  return String(process.env[name] || '').trim().replace(/^['"]|['"]$/g, '');
}

function mailbox(value) {
  const match = String(value || '').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : '';
}

function makeTransport({ host, port, user, pass }) {
  const chosen = Number(port) || 465;
  return nodemailer.createTransport({
    host: host || 'smtp.zoho.com',
    port: chosen,
    secure: chosen === 465,
    auth: { user, pass },
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  });
}

function connectionFailure(error) {
  const code = String(error?.code || '');
  return ['ECONNREFUSED', 'ETIMEDOUT', 'ESOCKET', 'ECONNECTION', 'ENETUNREACH', 'EHOSTUNREACH', 'EDNS'].includes(code);
}

function mailAttempts() {
  const attempts = [];
  const studioUser = mailbox(env('STUDIO_SMTP_USER')) || 'studio@hblab.rw';
  const studioPass = env('STUDIO_SMTP_PASSWORD');
  const studioHost = env('STUDIO_SMTP_HOST') || 'smtp.zoho.com';
  if (studioPass) {
    const port = Number(env('STUDIO_SMTP_PORT') || 465);
    attempts.push({
      user: studioUser,
      from: `HB Studio <${studioUser}>`,
      mailer: makeTransport({ host: studioHost, port, user: studioUser, pass: studioPass }),
    });
    if (port === 465) {
      attempts.push({
        user: studioUser,
        from: `HB Studio <${studioUser}>`,
        mailer: makeTransport({ host: studioHost, port: 587, user: studioUser, pass: studioPass }),
        backupPort: true,
      });
    }
  }
  const legacyUser = mailbox(env('SMTP_USER'));
  const legacyPass = env('SMTP_PASSWORD');
  if (legacyUser && legacyPass && legacyUser !== studioUser) {
    const from = env('SMTP_FROM');
    attempts.push({
      user: legacyUser,
      from: from.includes(legacyUser) ? from : `HBLab <${legacyUser}>`,
      mailer: makeTransport({
        host: env('SMTP_HOST') || 'smtp.zoho.com',
        port: env('SMTP_PORT') || 465,
        user: legacyUser,
        pass: legacyPass,
      }),
    });
  }
  return attempts;
}

function mailError(error) {
  const response = String(error?.response || error?.message || 'Mail server rejected the message')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
  return response;
}

async function sendWithAttempts(message, attempts) {
  let lastError;
  for (const attempt of attempts) {
    if (attempt.backupPort && lastError && !connectionFailure(lastError)) continue;
    try {
      await attempt.mailer.sendMail({ ...message, from: attempt.from });
      return attempt.user;
    } catch (error) {
      lastError = error;
      console.error('Studio email attempt failed:', attempt.user, mailError(error));
    }
  }
  throw lastError || new Error('Studio email is not configured');
}

function linesOf(fields) {
  return fields
    .filter((item) => item.value)
    .map((item) => `${item.label}: ${item.value}`)
    .join('\n');
}

router.post('/inquiries', async (req, res) => {
  try {
    const source = clean(req.body.source, 40);
    const name = clean(req.body.name, 120);
    const email = clean(req.body.email, 160).toLowerCase();
    const phone = clean(req.body.phone, 40);
    if (!name || !email.includes('@') || email.includes(' ')) {
      return res.status(400).json({ success: false, message: 'Enter your name and a valid email.' });
    }
    if (source !== 'studio-contact' && source !== 'studio-booking') {
      return res.status(400).json({ success: false, message: 'This form cannot be sent.' });
    }
    const attempts = mailAttempts();
    if (!attempts.length) return res.status(503).json({ success: false, message: 'Studio email is not configured yet.' });

    const booking = source === 'studio-booking';
    const details = booking
      ? [
          { label: 'Name', value: name },
          { label: 'Email', value: email },
          { label: 'Phone', value: phone },
          { label: 'Event', value: clean(req.body.eventType, 80) },
          { label: 'Package', value: clean(req.body.package, 80) },
          { label: 'Date', value: clean(req.body.eventDate, 40) },
          { label: 'Location', value: clean(req.body.eventLocation, 160) },
          { label: 'Guests', value: clean(req.body.guestCount, 20) },
          { label: 'Notes', value: clean(req.body.specialRequests, 4000) },
        ]
      : [
          { label: 'Name', value: name },
          { label: 'Email', value: email },
          { label: 'Phone', value: phone },
          { label: 'Service', value: clean(req.body.service, 80) },
          { label: 'Message', value: clean(req.body.message, 4000) },
        ];
    const text = linesOf(details);
    const inbox = mailbox(env('STUDIO_INBOX')) || 'studio@hblab.rw';
    await sendWithAttempts({
      to: inbox,
      replyTo: email,
      subject: booking ? `Shoot booking from ${name}` : `Studio message from ${name}`,
      text,
    }, attempts);
    try {
      await sendWithAttempts({
        to: email,
        subject: booking ? 'We received your shoot request' : 'We received your message',
        text: booking
          ? `Hello ${name},\n\nHB Studio received your booking request. We will reply from studio@hblab.rw within one day.\n\n${text}`
          : `Hello ${name},\n\nHB Studio received your message. We will reply from studio@hblab.rw within one day.\n\n${text}`,
      }, attempts);
    } catch (error) {
      console.error('Studio acknowledgement failed:', mailError(error));
    }
    res.json({ success: true });
  } catch (error) {
    const detail = mailError(error);
    console.error('Studio email failed:', detail);
    res.status(502).json({ success: false, message: `The message could not be sent. ${detail}` });
  }
});

module.exports = router;
