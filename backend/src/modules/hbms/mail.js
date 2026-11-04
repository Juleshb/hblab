const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const EMAILED_KINDS = new Set(['TASK_ASSIGNED', 'TASK_UPDATED', 'DEADLINE', 'MEETING', 'ANNOUNCEMENT']);
const GREEN = '#2e6b57';
const LEAF = '#2e6b57';
const PAPER = '#f4f7f5';

const KIND_STYLE = {
  TASK_ASSIGNED: { label: 'Task assigned', color: LEAF },
  TASK_UPDATED: { label: 'Task update', color: '#0f766e' },
  DEADLINE: { label: 'Deadline', color: '#b45309' },
  MEETING: { label: 'Meeting', color: '#7c3aed' },
  ANNOUNCEMENT: { label: 'Announcement', color: LEAF },
};

function appUrl() {
  return (process.env.APP_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');
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

function logoFile() {
  return path.join(__dirname, '../../../..', 'Frontend/src/assets/logo-icon-white.png');
}

function transport() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT || 465);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.zoho.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function letter({ eyebrow, accent = LEAF, title, intro, details = [], actionLabel, actionUrl, note }) {
  const rows = details.filter((item) => item && item.value).map((item, index) => `
    <tr>
      <td style="padding:10px 16px;${index ? 'border-top:1px solid #e7eeea;' : ''}">
        <div style="font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#64748b;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(item.label)}</div>
        <div style="margin-top:3px;font-size:15px;line-height:22px;color:#0f172a;font-family:${item.mono ? 'Consolas,Monaco,monospace' : 'Arial,Helvetica,sans-serif'};">${escapeHtml(item.value)}</div>
      </td>
    </tr>
  `).join('');
  const button = actionUrl ? `
    <tr>
      <td style="padding:8px 32px 4px;">
        <table role="presentation" cellpadding="0" cellspacing="0">
          <tr>
            <td bgcolor="${accent}" style="border-radius:10px;">
              <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:12px 22px;font-size:14px;font-weight:bold;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(actionLabel || 'Open HBMS')}</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  ` : '';
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:${PAPER};">
  <div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:560px;max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;">
          <tr>
            <td bgcolor="${GREEN}" style="padding:22px 28px 18px;background:${GREEN};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="52" valign="middle">
                    <img src="cid:hblab-mark" width="44" height="44" alt="HBLab" style="display:block;border:0;border-radius:10px;" />
                  </td>
                  <td valign="middle" style="padding-left:12px;">
                    <div style="font-size:18px;line-height:20px;font-weight:bold;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">HBLab</div>
                    <div style="margin-top:3px;font-size:12px;line-height:16px;color:#b7e4c7;font-family:Arial,Helvetica,sans-serif;">HBStudio · Empowering digital dreams</div>
                  </td>
                  <td align="right" valign="middle" style="font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#d1fae5;font-family:Arial,Helvetica,sans-serif;">HBMS</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td bgcolor="${accent}" style="height:4px;line-height:4px;font-size:0;background:${accent};">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:28px 32px 8px;">
              <div style="font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:${accent};font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(eyebrow)}</div>
              <h1 style="margin:8px 0 0;font-size:24px;line-height:30px;color:#0f172a;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(title)}</h1>
            </td>
          </tr>
          ${intro ? `<tr><td style="padding:12px 32px 4px;font-size:15px;line-height:24px;color:#334155;font-family:Arial,Helvetica,sans-serif;">${intro.split('\n').map((line) => escapeHtml(line)).join('<br>')}</td></tr>` : ''}
          ${rows ? `<tr><td style="padding:16px 32px 4px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8faf9;border:1px solid #e7eeea;border-radius:12px;">${rows}</table></td></tr>` : ''}
          ${button}
          ${note ? `<tr><td style="padding:14px 32px 8px;font-size:13px;line-height:20px;color:#64748b;font-family:Arial,Helvetica,sans-serif;">${escapeHtml(note)}</td></tr>` : ''}
          <tr>
            <td style="padding:22px 32px 26px;">
              <div style="border-top:1px solid #e7eeea;padding-top:16px;font-size:12px;line-height:18px;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;">
                HBLab and HBStudio<br>
                Sent by HBMS from info@hblab.rw
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendMail({ to, subject, text, html }) {
  const mailer = transport();
  if (!mailer) return false;
  const recipients = [...new Set((Array.isArray(to) ? to : [to])
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => item.includes('@')))];
  if (!recipients.length) return false;
  const logo = logoFile();
  const attachments = fs.existsSync(logo)
    ? [{ filename: 'hblab.png', path: logo, cid: 'hblab-mark' }]
    : [];
  await mailer.sendMail({
    from: process.env.SMTP_FROM || `HBLab <${process.env.SMTP_USER}>`,
    to: recipients,
    subject,
    text,
    html: html || letter({ eyebrow: 'HBLab', title: subject, intro: text }),
    attachments,
  });
  return true;
}

function noticeLink(notice) {
  if (notice.entityType === 'HbmsTask') return `${appUrl()}/admin/hbms/tasks`;
  if (notice.entityType === 'HbmsMeeting' || notice.entityType === 'HbmsAnnouncement') return `${appUrl()}/admin/hbms/messages`;
  return `${appUrl()}/admin/hbms`;
}

function noticeCopy(notice) {
  const style = KIND_STYLE[notice.kind] || { label: 'HBMS', color: LEAF };
  const overdue = notice.kind === 'DEADLINE' && /^overdue/i.test(notice.title || '');
  const accent = overdue ? '#b91c1c' : style.color;
  const eyebrow = overdue ? 'Overdue' : style.label;
  const action = notice.entityType === 'HbmsTask'
    ? 'Open the task'
    : notice.entityType === 'HbmsMeeting'
      ? 'Open the meeting'
      : 'Open HBMS';
  return { eyebrow, accent, action };
}

async function emailWorkers(employeeIds, notice) {
  if (!EMAILED_KINDS.has(notice.kind)) return 0;
  const ids = [...new Set((employeeIds || []).filter(Boolean))];
  if (!ids.length) return 0;
  const { prisma } = require('./utils');
  const workers = await prisma.employee.findMany({
    where: { id: { in: ids }, status: { not: 'INACTIVE' } },
    select: { email: true, user: { select: { email: true } } },
  });
  const addresses = workers.map((worker) => worker.user?.email || worker.email).filter(Boolean);
  if (!addresses.length) return 0;
  const link = noticeLink(notice);
  const copy = noticeCopy(notice);
  const text = [copy.eyebrow, notice.title, notice.body, `${copy.action}: ${link}`].filter(Boolean).join('\n\n');
  const html = letter({
    eyebrow: copy.eyebrow,
    accent: copy.accent,
    title: notice.title,
    intro: notice.body || '',
    actionLabel: copy.action,
    actionUrl: link,
  });
  let sent = 0;
  for (const address of addresses) {
    try {
      const ok = await sendMail({ to: address, subject: notice.title, text, html });
      if (ok) sent += 1;
    } catch (error) {
      console.error('Notification email failed:', error.message);
    }
  }
  return sent;
}

async function sendPasswordReset({ to, name, token }) {
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}\n\nChoose a new password for your HBLab account. This link expires in one hour.\n\n${link}\n\nIf you did not ask for this, you can ignore the email.`;
  const html = letter({
    eyebrow: 'Account',
    title: 'Reset your password',
    intro: `${greeting}\nChoose a new password for your HBLab account. The link expires in one hour.`,
    actionLabel: 'Choose a new password',
    actionUrl: link,
    note: 'If you did not ask for this, you can ignore the email. Your current password will stay the same.',
  });
  return sendMail({ to, subject: 'Reset your HBLab password', text, html });
}

async function sendTemporaryPassword({ to, name, password }) {
  const link = `${appUrl()}/LoginForm`;
  const greeting = name ? `Hello ${name},` : 'Hello,';
  const text = `${greeting}\n\nA login was prepared for you at HBLab.\n\nEmail: ${to}\nTemporary password: ${password}\n\nSign in: ${link}\nThen change the password from Settings.`;
  const html = letter({
    eyebrow: 'Your login',
    title: 'Your HBLab account is ready',
    intro: `${greeting}\nUse these details to sign in. Change the password from Settings after you arrive.`,
    details: [
      { label: 'Email', value: to },
      { label: 'Temporary password', value: password, mono: true },
    ],
    actionLabel: 'Sign in',
    actionUrl: link,
    note: 'This password is shown in this email only. Do not forward it.',
  });
  return sendMail({ to, subject: 'Your HBLab login', text, html });
}

module.exports = {
  sendMail,
  emailWorkers,
  sendPasswordReset,
  sendTemporaryPassword,
  letter,
};
