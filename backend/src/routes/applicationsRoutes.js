const crypto = require('crypto');
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const pawapay = require('../modules/pawapay');
const { sendInternshipRegistered, sendInternshipStatus, sendInternshipNumber, sendInternshipInvoice } = require('../modules/internshipMail');
const acceptance = require('../modules/acceptanceLetter');

const router = express.Router();
const prisma = new PrismaClient();

const INTERNSHIP_TRACKS = [
  'Software Development',
  'Multimedia',
  'Networking',
  'Computer Systems',
];
const TRAINING_LEVELS = ['Not educated', 'REB', 'RTB/TVET', 'A2', 'A1', 'A0 / Bachelor', 'Other'];
const INTERNSHIP_SITUATIONS = ['I am still in school', 'I finished school', 'I am not in school'];
const TRAINING_SKILLS = ['Unskilled', 'I can write and I am ready'];
const INTERNSHIP_LENGTHS = ['1 month', '2 months', '3 months', '6 months'];
const INTERNSHIP_MODES = ['On-site in Rubavu', 'Remote', 'Either'];

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

function applicationCode(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function publicInternship(application) {
  const labels = {
    awaiting_payment: 'Waiting for payment',
    pending: 'Submitted',
    under_review: 'Under review',
    approved: 'Approved',
    rejected: 'Not approved',
  };
  return {
    code: application.applicationCode,
    fullName: application.fullName,
    track: application.careerDepartment,
    status: application.status,
    statusLabel: labels[application.status] || 'Submitted',
    amount: pawapay.FEE_AMOUNT,
    currency: pawapay.CURRENCY,
    canPay: application.status === 'awaiting_payment',
  };
}

async function newApplicationCode(title) {
  const prefix = title === 'Internship' ? 'IN' : 'HB';
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `${prefix}${crypto.randomInt(10000000, 100000000)}`;
    const existing = await prisma.careerApplication.findUnique({ where: { applicationCode: code } });
    if (!existing) return code;
  }
  throw new Error('Could not create an application number.');
}

function internshipLetter(details, code, title = 'Internship') {
  return [
    `Application number: ${code}`,
    'Application fee: 5,000 RWF waiting for payment',
    title === 'Training'
      ? `Skill level: ${details.skillLevel || 'Not specified'}`
      : `Length: ${details.skillLevel || 'Not specified'}`,
    `Availability: ${details.availability || 'Not specified'}`,
    `Mode: ${details.mode}`,
    details.portfolio ? `Portfolio: ${details.portfolio}` : null,
    '',
    details.motivation,
  ].filter((line) => line !== null).join('\n');
}

function readInternship(body) {
  return {
    fullName: cleanText(body.fullName, 120),
    email: cleanText(body.email, 160).toLowerCase(),
    phone: cleanText(body.phone, 30),
    location: cleanText(body.location, 180),
    school: cleanText(body.school, 160),
    fieldOfStudy: cleanText(body.fieldOfStudy, 160),
    track: cleanText(body.track, 80),
    educationLevel: cleanText(body.educationLevel, 40),
    skillLevel: cleanText(body.skillLevel, 80),
    mode: cleanText(body.mode, 40),
    availability: cleanText(body.availability, 80),
    portfolio: cleanText(body.portfolio, 300),
    motivation: String(body.motivation || '').trim().slice(0, 2000),
  };
}

function internshipError(details, title = 'Internship') {
  const educated = details.educationLevel !== 'Not educated';
  if (!details.fullName || details.fullName.length < 2 || !details.email || !details.phone || !details.location || !details.motivation) {
    return 'Please complete every required field.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email)) return 'Enter a valid email address.';
  if (!/^[\d+\s()-]{8,30}$/.test(details.phone)) return 'Enter a valid phone number.';
  const training = title === 'Training';
  const levels = training ? TRAINING_LEVELS : INTERNSHIP_SITUATIONS;
  const skills = training ? TRAINING_SKILLS : INTERNSHIP_LENGTHS;
  const needsSchool = training ? educated : details.educationLevel !== 'I am not in school';
  if (!INTERNSHIP_TRACKS.includes(details.track) || !levels.includes(details.educationLevel) || !INTERNSHIP_MODES.includes(details.mode) || !skills.includes(details.skillLevel)) {
    return training
      ? 'Choose a training, your education, your skill level, and how you want to learn.'
      : 'Choose where you want to work, your situation, how long you can stay, and where you will work from.';
  }
  if (needsSchool && !details.school) return 'Enter the school or institution.';
  if (needsSchool && !details.fieldOfStudy) return 'Enter the field of study.';
  if (details.availability !== 'Immediately' && !/^\d{4}-\d{2}-\d{2}$/.test(details.availability)) {
    return 'Choose when you can start.';
  }
  if (details.motivation.length < 8) return 'Choose why you want to join, or write a short reason.';
  if (details.portfolio && !/^https?:\/\/\S+$/i.test(details.portfolio)) {
    return 'Portfolio link must start with http:// or https://.';
  }
  return '';
}

function payerError(provider, payerPhone) {
  if (!payerPhone) return 'Enter a Rwandan mobile money number, for example 0788 000 000.';
  if (!pawapay.PROVIDERS[provider]) return 'Choose MTN MoMo or Airtel Money.';
  const detected = pawapay.providerForMsisdn(payerPhone);
  if (detected === provider) return '';
  const expected = provider === 'MTN_MOMO_RWA' ? '078 or 079' : '072 or 073';
  return detected
    ? `That number belongs to ${pawapay.PROVIDERS[detected]}. Choose ${pawapay.PROVIDERS[detected]}, or enter an ${pawapay.PROVIDERS[provider]} number.`
    : `Enter a ${pawapay.PROVIDERS[provider]} number starting with ${expected}.`;
}

// Public internship registration. The application number is issued before payment.
async function createProgramApplication(req, res) {
  try {
    const details = readInternship(req.body);
    const invalid = internshipError(details, req.programTitle);
    if (invalid) return res.status(400).json({ error: invalid });

    const recent = await prisma.careerApplication.findFirst({
      where: {
        email: details.email,
        careerTitle: req.programTitle,
        status: { in: ['awaiting_payment', 'pending', 'under_review'] },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (recent?.applicationCode) {
      return res.status(409).json({
        error: 'You already have an application with this email. Use the application number to pay or check the status.',
        application: publicInternship(recent),
      });
    }

    const code = await newApplicationCode(req.programTitle);
    const application = await prisma.careerApplication.create({
      data: {
        fullName: details.fullName,
        email: details.email,
        phone: details.phone,
        location: details.location || null,
        careerTitle: req.programTitle,
        careerDepartment: details.track,
        experienceLevel: details.fieldOfStudy,
        education: details.school ? `${details.educationLevel} — ${details.school}` : details.educationLevel,
        coverLetter: internshipLetter(details, code, req.programTitle),
        status: 'awaiting_payment',
        applicationCode: code,
      },
    });

    let emailed = false;
    try {
      emailed = await sendInternshipRegistered(application);
    } catch (mailError) {
      console.error('Internship registration email failed:', mailError);
    }

    res.status(201).json({ application: publicInternship(application), emailed: Boolean(emailed) });
  } catch (error) {
    console.error('Error creating internship application:', error);
    res.status(500).json({ error: 'Could not save the application. Please try again.' });
  }
}

function runProgram(title, handler) {
  return (req, res) => {
    req.programTitle = title;
    return handler(req, res);
  };
}

router.post('/internship', runProgram('Internship', createProgramApplication));
router.post('/training', runProgram('Training', createProgramApplication));

const recoverHits = new Map();

function recoverAllowed(key, limit) {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const hits = (recoverHits.get(key) || []).filter((time) => now - time < windowMs);
  if (hits.length >= limit) {
    recoverHits.set(key, hits);
    return false;
  }
  hits.push(now);
  recoverHits.set(key, hits);
  return true;
}

async function recoverProgramApplication(req, res) {
  try {
    const email = cleanText(req.body.email, 160).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter the email you used when you registered.' });
    }
    const ip = req.ip || 'unknown';
    if (!recoverAllowed(`email:${email}`, 3) || !recoverAllowed(`ip:${ip}`, 8)) {
      return res.status(429).json({ error: 'We already sent that email. Wait a few minutes and try again.' });
    }

    const applications = await prisma.careerApplication.findMany({
      where: { email, careerTitle: req.programTitle, applicationCode: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    const message = 'If an application uses that email, we sent the application number. Check your inbox.';
    if (!applications.length) return res.json({ sent: true, message });

    const emailed = await sendInternshipNumber(applications);
    if (!emailed) {
      return res.status(503).json({ error: 'The email could not be sent. Try again in a moment.' });
    }
    res.json({ sent: true, message });
  } catch (error) {
    console.error('Error sending internship application number:', error);
    res.status(500).json({ error: 'Could not send the email. Try again in a moment.' });
  }
}

router.post('/internship/recover', runProgram('Internship', recoverProgramApplication));
router.post('/training/recover', runProgram('Training', recoverProgramApplication));

async function lookupProgramApplication(req, res) {
  try {
    const code = applicationCode(req.params.code);
    const application = await prisma.careerApplication.findFirst({
      where: { applicationCode: code, careerTitle: req.programTitle },
    });
    if (!application) return res.status(404).json({ error: 'No application was found with that number.' });
    res.json({ application: publicInternship(application) });
  } catch (error) {
    console.error('Error looking up internship application:', error);
    res.status(500).json({ error: 'Could not check that application.' });
  }
}

router.get('/internship/applications/:code', runProgram('Internship', lookupProgramApplication));
router.get('/training/applications/:code', runProgram('Training', lookupProgramApplication));

async function payProgramApplication(req, res) {
  try {
    const code = applicationCode(req.params.code);
    const provider = cleanText(req.body.provider, 40);
    const payerPhone = pawapay.rwandaMsisdn(req.body.paymentPhone);
    const invalid = payerError(provider, payerPhone);
    if (invalid) return res.status(400).json({ error: invalid });
    if (!pawapay.configured()) {
      return res.status(503).json({ error: 'Mobile money payments are not configured yet.' });
    }

    const application = await prisma.careerApplication.findFirst({
      where: { applicationCode: code, careerTitle: req.programTitle },
    });
    if (!application) return res.status(404).json({ error: 'No application was found with that number.' });
    if (application.status !== 'awaiting_payment') {
      return res.status(409).json({
        error: 'This application is no longer waiting for payment.',
        application: publicInternship(application),
      });
    }

    let payment = await prisma.internshipPayment.findUnique({ where: { applicationId: application.id } });
    if (payment && !['FAILED', 'REJECTED'].includes(payment.status)) {
      const settled = await pawapay.settleDeposit(payment.depositId);
      const fresh = await prisma.careerApplication.findUnique({ where: { id: application.id } });
      if (settled?.status === 'COMPLETED' || fresh.status !== 'awaiting_payment') {
        return res.json({ paid: true, application: publicInternship(fresh) });
      }
      if (settled?.status !== 'FAILED') {
        return res.status(202).json({
          depositId: payment.depositId,
          status: settled?.status || payment.status,
          amount: pawapay.FEE_AMOUNT,
          currency: pawapay.CURRENCY,
          provider: pawapay.PROVIDERS[payment.provider] || payment.provider,
          payerPhone: payment.payerPhone,
          application: publicInternship(fresh),
        });
      }
      payment = await prisma.internshipPayment.findUnique({ where: { applicationId: application.id } });
    }

    const depositId = pawapay.newDepositId();
    const payload = {
      fullName: application.fullName,
      email: application.email,
      phone: application.phone,
      location: application.location,
      track: application.careerDepartment,
      fieldOfStudy: application.experienceLevel,
      educationLevel: application.education,
      motivation: application.coverLetter,
    };
    if (payment) {
      payment = await prisma.internshipPayment.update({
        where: { id: payment.id },
        data: {
          depositId,
          provider,
          payerPhone,
          status: 'ACCEPTED',
          failureReason: null,
          payload,
        },
      });
    } else {
      payment = await prisma.internshipPayment.create({
        data: {
          depositId,
          amount: pawapay.FEE_AMOUNT,
          currency: pawapay.CURRENCY,
          provider,
          payerPhone,
          status: 'ACCEPTED',
          applicationId: application.id,
          payload,
        },
      });
    }

    const started = await pawapay.initiateDeposit({
      depositId,
      phoneNumber: payerPhone,
      provider,
      label: req.programTitle === 'Training' ? 'HBLab training' : 'HBLab internship',
    });
    if (started.status === 'REJECTED') {
      const reason = pawapay.customerFailureMessage(provider, started.failureReason);
      await prisma.internshipPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: reason },
      });
      return res.status(400).json({ error: reason, application: publicInternship(application) });
    }

    res.status(202).json({
      depositId,
      status: started.status || 'ACCEPTED',
      amount: pawapay.FEE_AMOUNT,
      currency: pawapay.CURRENCY,
      provider: pawapay.PROVIDERS[provider],
      payerPhone,
      application: publicInternship(application),
    });
  } catch (error) {
    console.error('Error starting internship payment:', error);
    res.status(500).json({ error: error.message || 'Failed to start the mobile money payment.' });
  }
}

router.post('/internship/:code/pay', runProgram('Internship', payProgramApplication));
router.post('/training/:code/pay', runProgram('Training', payProgramApplication));

async function programPaymentStatus(req, res) {
  try {
    const result = await pawapay.settleDeposit(req.params.depositId);
    if (!result) return res.status(404).json({ error: 'Payment not found.' });
    res.json({
      depositId: req.params.depositId,
      status: result.status,
      error: result.error || null,
      amount: pawapay.FEE_AMOUNT,
      currency: pawapay.CURRENCY,
    });
  } catch (error) {
    console.error('Error checking internship payment:', error);
    res.status(502).json({ error: 'Could not check the payment yet. Keep this page open and try again.' });
  }
}

router.get('/internship/payments/:depositId', programPaymentStatus);
router.get('/training/payments/:depositId', programPaymentStatus);

// Create a new career application
router.post('/', authMiddleware(), async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      location,
      careerTitle,
      careerDepartment,
      experienceLevel,
      education,
      coverLetter,
      resumeUrl,
      userId
    } = req.body;

    if (!userId || !careerTitle || !fullName || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const application = await prisma.careerApplication.create({
      data: {
        fullName,
        email,
        phone,
        location,
        careerTitle,
        careerDepartment,
        experienceLevel,
        education,
        coverLetter,
        resumeUrl,
        userId: parseInt(userId)
      }
    });
    res.status(201).json({ application });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({ error: 'Failed to create application' });
  }
});

// Get all applications
router.get('/', authMiddleware(), async (req, res) => {
  try {
    const applications = await prisma.careerApplication.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get application by ID
router.get('/letters/:code', async (req, res) => {
  try {
    const code = applicationCode(req.params.code);
    const application = code
      ? await prisma.careerApplication.findUnique({ where: { applicationCode: code } })
      : null;
    if (!acceptance.matches(application, req.query.v)) {
      return res.json({ official: false });
    }
    res.json({
      official: true,
      letterNumber: acceptance.letterNumber(application),
      fullName: application.fullName,
      program: application.careerTitle,
      track: application.careerDepartment || '',
      issuedOn: acceptance.issuedOn(application),
    });
  } catch (error) {
    console.error('Letter check failed:', error);
    res.status(500).json({ official: false });
  }
});

router.get('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.careerApplication.findUnique({
      where: { id: parseInt(id) },
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json(application);
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

router.post('/:id/cash', authMiddleware(['ADMIN']), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const application = await prisma.careerApplication.findUnique({ where: { id } });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (!['Internship', 'Training'].includes(application.careerTitle)) {
      return res.status(400).json({ error: 'Cash payment is only for internship and training applications.' });
    }
    if (application.status !== 'awaiting_payment') {
      return res.status(400).json({ error: 'This application is not waiting for payment.' });
    }

    const feeLine = `Application fee: ${pawapay.FEE_AMOUNT.toLocaleString()} ${pawapay.CURRENCY} paid in cash`;
    const letter = String(application.coverLetter || '');
    const coverLetter = letter.includes('Application fee:')
      ? letter.replace(/Application fee:[^\n]*/, feeLine)
      : `${feeLine}\n\n${letter}`.trim();
    const existing = await prisma.internshipPayment.findUnique({ where: { applicationId: application.id } });
    const paymentData = {
      provider: 'CASH',
      payerPhone: application.phone || 'Cash desk',
      status: 'COMPLETED',
      failureReason: null,
      paidAt: new Date(),
      amount: pawapay.FEE_AMOUNT,
      currency: pawapay.CURRENCY,
      payload: { method: 'CASH', recordedBy: req.userId },
    };
    const payment = existing
      ? await prisma.internshipPayment.update({ where: { id: existing.id }, data: paymentData })
      : await prisma.internshipPayment.create({
        data: {
          ...paymentData,
          depositId: `CASH-${application.id}`,
          applicationId: application.id,
        },
      });
    const updated = await prisma.careerApplication.update({
      where: { id: application.id },
      data: { status: 'pending', coverLetter },
    });
    sendInternshipInvoice(payment).catch((mailError) => {
      console.error('Cash invoice email failed:', mailError);
    });
    res.json(updated);
  } catch (error) {
    console.error('Error recording cash payment:', error);
    res.status(500).json({ error: 'Could not record the cash payment.' });
  }
});

router.post('/:id/letter', authMiddleware(), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const application = await prisma.careerApplication.findUnique({ where: { id } });
    if (!application) return res.status(404).json({ error: 'Application not found' });
    if (!['Internship', 'Training'].includes(application.careerTitle)) {
      return res.status(400).json({ error: 'Acceptance letters are only for internship and training.' });
    }
    if (application.status !== 'approved') {
      return res.status(400).json({ error: 'Approve the application before sending the letter again.' });
    }
    const sent = await sendInternshipStatus(application, { requireLetter: true });
    if (!sent) return res.status(503).json({ error: 'The letter could not be emailed.' });
    res.json({ sent: true });
  } catch (error) {
    console.error('Error resending acceptance letter:', error.message);
    res.status(500).json({ error: 'Could not send the acceptance letter again.' });
  }
});

// Update application status
router.patch('/:id/status', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const current = await prisma.careerApplication.findUnique({ where: { id: parseInt(id) } });
    if (!current) return res.status(404).json({ error: 'Application not found' });
    if (current.status === 'awaiting_payment') {
      return res.status(400).json({ error: 'This application is waiting for payment. It can be accepted after the fee is paid.' });
    }

    const application = await prisma.careerApplication.update({
      where: { id: parseInt(id) },
      data: { status },
    });

    if (['Internship', 'Training'].includes(application.careerTitle) && application.status !== current.status) {
      sendInternshipStatus(application).catch((mailError) => {
        console.error('Internship status email failed:', mailError);
      });
    }

    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Delete application
router.delete('/:id', authMiddleware(), async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.careerApplication.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Application deleted successfully' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: 'Failed to delete application' });
  }
});

// Get applications by status
router.get('/status/:status', authMiddleware(), async (req, res) => {
  try {
    const { status } = req.params;
    const applications = await prisma.careerApplication.findMany({
      where: { status },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(applications);
  } catch (error) {
    console.error('Error fetching applications by status:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get applications statistics
router.get('/stats/overview', authMiddleware(), async (req, res) => {
  try {
    const total = await prisma.careerApplication.count();
    const pending = await prisma.careerApplication.count({
      where: { status: 'pending' }
    });
    const approved = await prisma.careerApplication.count({
      where: { status: 'approved' }
    });
    const rejected = await prisma.careerApplication.count({
      where: { status: 'rejected' }
    });

    res.json({
      total,
      pending,
      approved,
      rejected
    });
  } catch (error) {
    console.error('Error fetching application stats:', error);
    res.status(500).json({ error: 'Failed to fetch application statistics' });
  }
});

// Get applications by userId
router.get('/by-user/:userId', authMiddleware(), async (req, res) => {
  try {
    const { userId } = req.params;
    const applications = await prisma.careerApplication.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user applications' });
  }
});

module.exports = router; 