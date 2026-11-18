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

function initiateDeposit({ depositId, phoneNumber, provider }) {
  return pawapay('/v2/deposits', {
    method: 'POST',
    body: JSON.stringify({
      depositId,
      amount: String(FEE_AMOUNT),
      currency: CURRENCY,
      customerMessage: 'HBLab internship',
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

async function createPaidApplication(payment) {
  const claimed = await prisma.internshipPayment.updateMany({
    where: { id: payment.id, applicationId: null, status: { notIn: ['COMPLETED', 'COMPLETING'] } },
    data: { status: 'COMPLETING' },
  });
  if (claimed.count === 0) {
    return prisma.internshipPayment.findUnique({ where: { id: payment.id } });
  }

  const details = payment.payload;
  const providerName = PROVIDERS[payment.provider] || payment.provider;
  const coverLetter = [
    `Application fee: ${payment.amount.toLocaleString()} ${payment.currency} paid with ${providerName}`,
    `Payer: ${payment.payerPhone}`,
    `PawaPay deposit: ${payment.depositId}`,
    `Availability: ${details.availability || 'Not specified'}`,
    `Mode: ${details.mode}`,
    details.portfolio ? `Portfolio: ${details.portfolio}` : null,
    '',
    details.motivation,
  ].filter((line) => line !== null).join('\n');

  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.internshipPayment.findUnique({ where: { id: payment.id } });
      if (current?.applicationId) return current;
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
      return tx.internshipPayment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          applicationId: application.id,
          paidAt: new Date(),
          failureReason: null,
        },
      });
    });
  } catch (error) {
    await prisma.internshipPayment.updateMany({
      where: { id: payment.id, applicationId: null, status: 'COMPLETING' },
      data: { status: 'ACCEPTED' },
    });
    throw error;
  }
}

async function settleDeposit(depositId) {
  const payment = await prisma.internshipPayment.findUnique({ where: { depositId } });
  if (!payment) return null;
  if (payment.applicationId || payment.status === 'COMPLETED') {
    return { status: 'COMPLETED', applicationId: payment.applicationId };
  }
  if (payment.status === 'FAILED') {
    return { status: 'FAILED', error: payment.failureReason || 'The payment was not completed.' };
  }

  const remote = await depositStatus(depositId);
  const data = remote.status === 'FOUND' ? remote.data || {} : {};
  const status = data.status || 'ACCEPTED';

  if (status === 'COMPLETED') {
    const saved = await createPaidApplication(payment);
    return { status: 'COMPLETED', applicationId: saved.applicationId };
  }

  if (status === 'FAILED') {
    const reason = data.failureReason?.failureMessage || 'The mobile money payment was not approved.';
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
  initiateDeposit,
  settleDeposit,
  recordRefund,
  newDepositId: () => crypto.randomUUID(),
};
