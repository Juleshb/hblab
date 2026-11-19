const prisma = require('../prismaClient');
const { letter, sendMail } = require('./hbms/mail');
const { buildAcceptancePdf, verifyUrl } = require('./acceptanceLetter');

const FEE = '5,000 RWF';

function siteUrl() {
  const configured = String(process.env.PUBLIC_SITE_URL || process.env.APP_URL || '').replace(/\/$/, '');
  if (configured && !/localhost|127\.0\.0\.1/.test(configured)) return configured;
  return 'https://hblab.rw';
}

function statusLabel(status) {
  return {
    awaiting_payment: 'Waiting for payment',
    pending: 'Submitted',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Not approved',
  }[status] || 'Submitted';
}

function isTraining(application) {
  return application?.careerTitle === 'Training';
}

function programWord(application) {
  return isTraining(application) ? 'training' : 'internship';
}

function feeName(application) {
  return isTraining(application) ? 'training registration fee' : 'internship application fee';
}

function trackLink(code, application) {
  const path = isTraining(application) ? '/get-started' : '/internship';
  return `${siteUrl()}${path}?code=${encodeURIComponent(code)}`;
}

function money(amount, currency) {
  const value = Number(amount || 5000).toLocaleString('en-US');
  return `${value} ${currency || 'RWF'}`;
}

function paidOn(value) {
  return new Date(value || Date.now()).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Kigali',
  });
}

async function sendInternshipRegistered(application) {
  const code = application.applicationCode;
  const link = trackLink(code, application);
  const word = programWord(application);
  const first = String(application.fullName || '').split(' ')[0] || 'there';
  const text = [
    `Hello ${first},`,
    '',
    `Your HBLab ${word} application is saved.`,
    `Application number: ${code}`,
    `Status: ${statusLabel(application.status)}`,
    `${isTraining(application) ? 'Training' : 'Placement'}: ${application.careerDepartment || ''}`,
    `Fee: ${FEE}`,
    '',
    'Action required: pay the application fee when your wallet has the money.',
    'Open your application, choose MTN MoMo if the number starts with 078 or 079, or Airtel Money if it starts with 072 or 073, enter the wallet number, and approve the prompt on your phone.',
    'If the prompt does not appear, dial *182*7*1# to open the pending approval and enter your PIN. On Airtel Money you can also dial *500#.',
    '',
    link,
  ].join('\n');
  const html = letter({
    eyebrow: isTraining(application) ? 'Training registration' : 'Internship application',
    title: 'Your application number',
    intro: `Hello ${first},\nYour application is saved. Pay the fee when your wallet has the money, then HBLab can review it.`,
    details: [
      { label: 'Application number', value: code, mono: true },
      { label: 'Status', value: statusLabel(application.status) },
      { label: isTraining(application) ? 'Training' : 'Placement', value: application.careerDepartment },
      { label: 'Fee', value: FEE },
      { label: 'Action required', value: 'Pay 5,000 RWF with MTN MoMo or Airtel Money' },
    ],
    actionLabel: 'Pay or check status',
    actionUrl: link,
    note: 'How to pay: open the link, choose MTN MoMo for numbers starting with 078 or 079, or Airtel Money for numbers starting with 072 or 073. Enter the wallet number and approve the prompt. If the prompt does not appear, dial *182*7*1# to open the pending approval and enter your PIN. On Airtel Money you can also dial *500#. You can pay later. Keep this application number.',
  });
  return sendMail({
    to: application.email,
    subject: `HBLab ${word} application ${code}`,
    text,
    html,
  });
}

async function sendInternshipInvoice(payment) {
  if (!payment?.applicationId) return false;
  const application = await prisma.careerApplication.findUnique({ where: { id: payment.applicationId } });
  if (!application?.email || !application.applicationCode) return false;
  const code = application.applicationCode;
  const invoiceNumber = `INV-${code}`;
  const provider = payment.provider === 'AIRTEL_RWA' ? 'Airtel Money' : payment.provider === 'MTN_MOMO_RWA' ? 'MTN MoMo' : payment.provider === 'CASH' ? 'Cash' : (payment.provider || 'Mobile money');
  const amount = money(payment.amount, payment.currency);
  const first = String(application.fullName || '').split(' ')[0] || 'there';
  const fee = feeName(application);
  const text = [
    `Hello ${first},`,
    '',
    `Payment received. This is your invoice for the HBLab ${fee}.`,
    `Invoice: ${invoiceNumber}`,
    `Application number: ${code}`,
    `Status: ${statusLabel('pending')}`,
    `Amount: ${amount}`,
    `Paid with: ${provider}`,
    payment.provider === 'CASH' ? 'Received at HBLab' : `Wallet: ${payment.payerPhone || ''}`,
    `Payment reference: ${payment.depositId}`,
    `Date: ${paidOn(payment.paidAt)}`,
    '',
    trackLink(code, application),
  ].join('\n');
  const html = letter({
    eyebrow: 'Invoice',
    accent: '#166534',
    title: 'Payment received',
    intro: `Hello ${first},\nWe received your ${fee}. HBLab will now review the application.`,
    details: [
      { label: 'Invoice', value: invoiceNumber, mono: true },
      { label: 'Application number', value: code, mono: true },
      { label: 'Billed to', value: application.fullName },
      { label: 'Description', value: fee.charAt(0).toUpperCase() + fee.slice(1) },
      { label: 'Amount', value: amount },
      { label: 'Paid with', value: provider },
      { label: payment.provider === 'CASH' ? 'Received' : 'Wallet', value: payment.provider === 'CASH' ? 'Cash at HBLab' : payment.payerPhone },
      { label: 'Payment reference', value: payment.depositId, mono: true },
      { label: 'Date', value: paidOn(payment.paidAt) },
      { label: 'Status', value: 'Paid. Application submitted for review.' },
    ],
    actionLabel: 'Check application status',
    actionUrl: trackLink(code, application),
    note: 'Keep this email as your receipt. The application number is how you check the status.',
  });
  return sendMail({
    to: application.email,
    subject: `Invoice ${invoiceNumber} for your HBLab ${programWord(application)}`,
    text,
    html,
  });
}

async function sendInternshipStatus(application, options = {}) {
  if (!application?.email || !application.applicationCode) return false;
  if (application.status !== 'approved' && application.status !== 'rejected') return false;
  const code = application.applicationCode;
  const label = statusLabel(application.status);
  const approved = application.status === 'approved';
  const first = String(application.fullName || '').split(' ')[0] || 'there';
  const word = programWord(application);
  let letterLink = '';
  let attachments = [];
  if (approved) {
    try {
      letterLink = verifyUrl(application);
      const pdf = await buildAcceptancePdf(application);
      attachments = [{
        filename: `HBLab-acceptance-${code}.pdf`,
        content: pdf,
        contentType: 'application/pdf',
      }];
    } catch (error) {
      console.error('Acceptance letter failed:', error.message);
      if (options.requireLetter) throw error;
    }
    if (options.requireLetter && !attachments.length) {
      throw new Error('Could not prepare the acceptance letter.');
    }
  }
  const text = [
    `Hello ${first},`,
    '',
    `Your HBLab ${word} application ${code} is now ${label}.`,
    approved
      ? 'Your signed acceptance letter is attached as a PDF. Scan the code on the letter to confirm it is an official HBLab letter.'
      : 'This application was not approved.',
    '',
    trackLink(code, application),
  ].filter(Boolean).join('\n');
  const html = letter({
    eyebrow: 'Application status',
    accent: approved ? '#166534' : '#b91c1c',
    title: approved ? 'You are accepted' : label,
    intro: approved
      ? `Hello ${first},\nYour ${word} application ${code} is approved. The signed acceptance letter is attached to this email.`
      : `Hello ${first},\nYour ${word} application ${code} is now ${label}.`,
    details: [
      { label: 'Application number', value: code, mono: true },
      { label: 'Status', value: label },
      { label: isTraining(application) ? 'Training' : 'Placement', value: application.careerDepartment },
    ],
    actionLabel: approved && letterLink ? 'Confirm this letter' : 'View status',
    actionUrl: approved && letterLink ? letterLink : trackLink(code, application),
    note: approved
      ? 'Open the attached PDF. The stamp and signature are on the letter. Scan the code, or use the button, to confirm it was issued by HBLab.'
      : 'You can apply again with a new registration if you still want to join.',
  });
  return sendMail({
    to: application.email,
    subject: approved ? `Your HBLab acceptance letter ${code}` : `HBLab ${word} ${code} is ${label}`,
    text,
    html,
    attachments,
  });
}

async function sendInternshipNumber(applications) {
  const list = (Array.isArray(applications) ? applications : [applications]).filter((item) => item?.applicationCode && item.email);
  if (!list.length) return false;
  const latest = list[0];
  const first = String(latest.fullName || '').split(' ')[0] || 'there';
  const text = [
    `Hello ${first},`,
    '',
    `You asked us to send your HBLab ${programWord(latest)} application number again.`,
    ...list.map((item) => `Application number: ${item.applicationCode} — ${statusLabel(item.status)}`),
    '',
    'Open the link to pay or check the status.',
    ...list.map((item) => `${item.applicationCode}: ${trackLink(item.applicationCode, item)}`),
  ].join('\n');
  const html = letter({
    eyebrow: 'Application number',
    title: 'Your application number',
    intro: `Hello ${first},\nYou asked us to send the application number again. Use it to pay the fee or check the status.`,
    details: list.flatMap((item) => [
      { label: 'Application number', value: item.applicationCode, mono: true },
      { label: 'Status', value: statusLabel(item.status) },
      { label: isTraining(item) ? 'Training' : 'Placement', value: item.careerDepartment },
    ]),
    actionLabel: 'Open application',
    actionUrl: trackLink(latest.applicationCode, latest),
    note: list.length > 1
      ? `This email lists the ${programWord(latest)} applications on this address. Open the number you need.`
      : 'Keep this number. It is how you pay the fee and check the status.',
  });
  return sendMail({
    to: latest.email,
    subject: list.length > 1
      ? `Your HBLab ${programWord(latest)} application numbers`
      : `Your HBLab ${programWord(latest)} application number ${latest.applicationCode}`,
    text,
    html,
  });
}

module.exports = {
  sendInternshipRegistered,
  sendInternshipInvoice,
  sendInternshipStatus,
  sendInternshipNumber,
};
