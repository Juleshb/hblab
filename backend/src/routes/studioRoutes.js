const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

function clean(value, max = 2000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, max);
}

function studioTransport() {
  const user = process.env.STUDIO_SMTP_USER || 'studio@hblab.rw';
  const pass = process.env.STUDIO_SMTP_PASSWORD;
  if (!pass) return null;
  const port = Number(process.env.STUDIO_SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.STUDIO_SMTP_HOST || 'smtp.zoho.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
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
    const mailer = studioTransport();
    if (!mailer) return res.status(503).json({ success: false, message: 'Studio email is not configured yet.' });

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
    const from = process.env.STUDIO_SMTP_FROM || 'HB Studio <studio@hblab.rw>';
    const inbox = process.env.STUDIO_INBOX || 'studio@hblab.rw';
    await mailer.sendMail({
      from,
      to: inbox,
      replyTo: email,
      subject: booking ? `Shoot booking from ${name}` : `Studio message from ${name}`,
      text,
    });
    await mailer.sendMail({
      from,
      to: email,
      subject: booking ? 'We received your shoot request' : 'We received your message',
      text: booking
        ? `Hello ${name},\n\nHB Studio received your booking request. We will reply from studio@hblab.rw within one day.\n\n${text}`
        : `Hello ${name},\n\nHB Studio received your message. We will reply from studio@hblab.rw within one day.\n\n${text}`,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Studio email failed:', error?.message || error);
    res.status(502).json({ success: false, message: 'The message could not be sent. Please try again.' });
  }
});

module.exports = router;
