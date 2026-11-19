const crypto = require('crypto');
const prisma = require('../prismaClient');

const FEE_AMOUNT = Number(process.env.PAWAPAY_FEE_AMOUNT || 5000);
const CURRENCY = process.env.PAWAPAY_CURRENCY || 'RWF';
const PROVIDERS = {
  MTN_MOMO_RWA: 'MTN MoMo',
  AIRTEL_RWA: 'Airtel Money',
};

function baseUrl() {
  return String(process.env.PAWAPAY_BASE_URL || 'https://api.pawapay.io').replace(/\/$/, '');
}

function configured() {
  return Boolean(process.env.PAWAPAY_API_TOKEN);
}

function rwandaMsisdn(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (/^2507\d{8}$/.test(digits)) return digits;
  if (/^07\d{8}$/.test(digits)) return `250${digits.slice(1)}`;
  if (/^7\d{8}$/.test(digits)) return `250${digits}`;
  return '';
}

function providerForMsisdn(msisdn) {
  const prefix = String(msisdn || '').slice(3, 5);
  if (prefix === '78' || prefix === '79') return 'MTN_MOMO_RWA';
  if (prefix === '72' || prefix === '73') return 'AIRTEL_RWA';
  return '';
}

async function pawapay(path, options = {}) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${process.env.PAWAPAY_API_TOKEN}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.failureReason?.failureMessage || 'PawaPay could not start this payment.');
    error.body = data;
    throw error;
  }
  return data;
}

function initiateDeposit({ depositId, phoneNumber, provider, label = 'HBLab internship' }) {
  return pawapay('/v2/deposits', {
    method: 'POST',
    body: JSON.stringify({
      depositId,
      amount: String(FEE_AMOUNT),
      currency: CURRENCY,
      customerMessage: label,
      clientReferenceId: depositId,
      payer: {
        type: 'MMO',
        accountDetails: { phoneNumber, provider },
      },
      metadata: [{ purpose: 'internship-fee' }],
    }),
  });
}

function depositStatus(depositId) {
  return pawapay(`/v2/deposits/${depositId}`);
}

function customerFailureMessage(provider, failure) {
  const code = String(failure?.failureCode || '');
  const raw = String(failure?.failureMessage || (typeof failure === 'string' ? failure : ''));
  const brand = PROVIDERS[provider] || (String(provider).includes('AIRTEL') || /airtel/i.test(raw) ? 'Airtel Money' : 'MTN MoMo');
  const amount = `${Number(FEE_AMOUNT).toLocaleString('en-US')} ${CURRENCY}`;
  const activate = `This ${brand} number could not pay. Activate the mobile money account and make sure the wallet has at least ${amount}, then try again.`;
  if (
    code === 'INSUFFICIENT_BALANCE'
    || code === 'UNSPECIFIED_FAILURE'
    || code === 'PAYER_NOT_FOUND'
    || /did not specify a reason|insufficient|not enough funds|payer was not found|unspecified/i.test(raw)
  ) {
    return activate;
  }
  if (code === 'PAYMENT_NOT_APPROVED') return `The ${brand} prompt was not approved. Request it again and enter your PIN.`;
  if (code === 'PAYER_LIMIT_REACHED' || code === 'WALLET_LIMIT_REACHED') {
    return `This ${brand} wallet has reached its limit. Try again later or use another number.`;
  }
  if (code === 'PAYMENT_IN_PROGRESS') {
    return `A payment is already waiting on this ${brand} number. Approve it, or wait a few minutes and try again.`;
  }
  return raw || 'The mobile money payment was not approved.';
}

function paidFeeLine(payment) {
  const providerName = PROVIDERS[payment.provider] || payment.provider;
  return `Application fee: ${payment.amount.toLocaleString()} ${payment.currency} paid with ${providerName}. Payer ${payment.payerPhone}. Deposit ${payment.depositId}.`;
}

function coverLetterWithPayment(existing, payment) {
  const feeLine = paidFeeLine(payment);
  const letter = String(existing || '');
  if (letter.includes('Application fee:')) return letter.replace(/Application fee:[^\n]*/, feeLine);
  return `${feeLine}\n\n${letter}`.trim();
}

async function createPaidApplication(payment) {
  const claimed = await prisma.internshipPayment.updateMany({
    where: { id: payment.id, status: { not: 'COMPLETED' } },
    data: { status: 'COMPLETING' },
  });
  if (claimed.count === 0) {
    return { record: await prisma.internshipPayment.findUnique({ where: { id: payment.id } }), issued: false };
  }

  const details = payment.payload || {};
  const coverLetter = [
    paidFeeLine(payment),
    `Availability: ${details.availability || 'Not specified'}`,
    `Mode: ${details.mode || 'Not specified'}`,
    details.portfolio ? `Portfolio: ${details.portfolio}` : null,
    '',
    details.motivation || '',
  ].filter((line) => line !== null).join('\n');

  try {
    const outcome = await prisma.$transaction(async (tx) => {
      const current = await tx.internshipPayment.findUnique({ where: { id: payment.id } });
      if (current?.status === 'COMPLETED') return { record: current, issued: false };

      if (current?.applicationId) {
        const application = await tx.careerApplication.findUnique({ where: { id: current.applicationId } });
        if (application?.status === 'awaiting_payment') {
          await tx.careerApplication.update({
            where: { id: application.id },
            data: {
              status: 'pending',
              coverLetter: coverLetterWithPayment(application.coverLetter, payment),
            },
          });
        }
        const record = await tx.internshipPayment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED', paidAt: new Date(), failureReason: null },
        });
        return { record, issued: true };
      }

      const application = await tx.careerApplication.create({
        data: {
          fullName: details.fullName,
          email: details.email,
          phone: details.phone,
          location: details.location || null,
          careerTitle: 'Internship',
          careerDepartment: details.track,
          experienceLevel: details.fieldOfStudy,
          education: `${details.educationLevel} — ${details.school}`,
          coverLetter,
        },
      });
      const record = await tx.internshipPayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          applicationId: application.id,
          paidAt: new Date(),
          failureReason: null,
        },
      });
      return { record, issued: true };
    });
    return outcome;
  } catch (error) {
    await prisma.internshipPayment.updateMany({
      where: { id: payment.id, status: 'COMPLETING' },
      data: { status: 'ACCEPTED' },
    });
    throw error;
  }
}

async function settleDeposit(depositId) {
  const payment = await prisma.internshipPayment.findUnique({ where: { depositId } });
  if (!payment) return null;
  if (payment.status === 'COMPLETED') {
    return { status: 'COMPLETED', applicationId: payment.applicationId };
  }
  if (payment.status === 'FAILED') {
    return { status: 'FAILED', error: customerFailureMessage(payment.provider, payment.failureReason) };
  }

  const remote = await depositStatus(depositId);
  const data = remote.status === 'FOUND' ? remote.data || {} : {};
  const status = data.status || 'ACCEPTED';

  if (status === 'COMPLETED') {
    const saved = await createPaidApplication(payment);
    if (saved.issued) {
      const { sendInternshipInvoice } = require('./internshipMail');
      sendInternshipInvoice(saved.record).catch((error) => {
        console.error('Internship invoice email failed:', error);
      });
    }
    return { status: 'COMPLETED', applicationId: saved.record?.applicationId };
  }

  if (status === 'FAILED') {
    const reason = customerFailureMessage(payment.provider, data.failureReason);
    await prisma.internshipPayment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureReason: reason },
    });
    return { status: 'FAILED', error: reason };
  }

  if (status !== payment.status) {
    await prisma.internshipPayment.update({
      where: { id: payment.id },
      data: { status },
    });
  }
  return { status };
}

async function recordRefund(body) {
  const depositId = String(body?.depositId || '');
  const status = String(body?.status || '');
  if (!depositId || status !== 'COMPLETED') return { received: true };
  const payment = await prisma.internshipPayment.findUnique({ where: { depositId } });
  if (!payment) return { received: true };
  await prisma.internshipPayment.update({
    where: { id: payment.id },
    data: {
      status: 'REFUNDED',
      failureReason: 'The 5,000 RWF application fee was refunded.',
    },
  });
  return { received: true, status: 'REFUNDED' };
}

module.exports = {
  FEE_AMOUNT,
  CURRENCY,
  PROVIDERS,
  configured,
  rwandaMsisdn,
  providerForMsisdn,
  initiateDeposit,
  customerFailureMessage,
  settleDeposit,
  recordRefund,
  newDepositId: () => crypto.randomUUID(),
};
