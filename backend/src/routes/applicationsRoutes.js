const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');
const pawapay = require('../modules/pawapay');

const router = express.Router();
const prisma = new PrismaClient();

const INTERNSHIP_TRACKS = [
  'Software Development',
  'Multimedia',
  'Networking',
  'Computer Systems',
];
const EDUCATION_LEVELS = ['RTB/TVET', 'A2', 'A1', 'A0 / Bachelor', 'Other'];
const INTERNSHIP_MODES = ['On-site in Rubavu', 'Remote', 'Either'];

function cleanText(value, max) {
  return String(value || '').replace(/\s+/g, ' ').trim().slice(0, max);
}

// Public internship registration. No account is required.
router.post('/internship', async (req, res) => {
  try {
    const fullName = cleanText(req.body.fullName, 120);
    const email = cleanText(req.body.email, 160).toLowerCase();
    const phone = cleanText(req.body.phone, 30);
    const location = cleanText(req.body.location, 120);
    const school = cleanText(req.body.school, 160);
    const fieldOfStudy = cleanText(req.body.fieldOfStudy, 160);
    const track = cleanText(req.body.track, 80);
    const educationLevel = cleanText(req.body.educationLevel, 40);
    const mode = cleanText(req.body.mode, 40);
    const availability = cleanText(req.body.availability, 80);
    const portfolio = cleanText(req.body.portfolio, 300);
    const motivation = String(req.body.motivation || '').trim().slice(0, 2000);
    const provider = cleanText(req.body.provider, 40);
    const payerPhone = pawapay.rwandaMsisdn(req.body.paymentPhone || phone);

    if (!fullName || fullName.length < 2 || !email || !phone || !school || !fieldOfStudy || !motivation) {
      return res.status(400).json({ error: 'Please complete every required field.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (!/^[\d+\s()-]{8,30}$/.test(phone)) {
      return res.status(400).json({ error: 'Enter a valid phone number.' });
    }
    if (!payerPhone) {
      return res.status(400).json({ error: 'Enter a Rwandan mobile money number, for example 0788 000 000.' });
    }
    if (!pawapay.PROVIDERS[provider]) {
      return res.status(400).json({ error: 'Choose MTN MoMo or Airtel Money.' });
    }
    if (!pawapay.configured()) {
      return res.status(503).json({ error: 'Mobile money payments are not configured yet.' });
    }
    if (!INTERNSHIP_TRACKS.includes(track) || !EDUCATION_LEVELS.includes(educationLevel) || !INTERNSHIP_MODES.includes(mode)) {
      return res.status(400).json({ error: 'Choose a track, education level, and how you want to join.' });
    }
    if (motivation.length < 20) {
      return res.status(400).json({ error: 'Tell us a little more about why you want this internship.' });
    }
    if (portfolio && !/^https?:\/\/\S+$/i.test(portfolio)) {
      return res.status(400).json({ error: 'Portfolio link must start with http:// or https://.' });
    }

    const recent = await prisma.careerApplication.findFirst({
      where: {
        email,
        careerTitle: 'Internship',
        status: 'pending',
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recent) {
      return res.status(409).json({ error: 'You already have a pending internship registration with this email.' });
    }

    const depositId = pawapay.newDepositId();
    const payment = await prisma.internshipPayment.create({
      data: {
        depositId,
        amount: pawapay.FEE_AMOUNT,
        currency: pawapay.CURRENCY,
        provider,
        payerPhone,
        status: 'ACCEPTED',
        payload: {
          fullName,
          email,
          phone,
          location,
          school,
          fieldOfStudy,
          track,
          educationLevel,
          mode,
          availability,
          portfolio,
          motivation,
        },
      },
    });

    const started = await pawapay.initiateDeposit({ depositId, phoneNumber: payerPhone, provider });
    if (started.status === 'REJECTED') {
      const reason = started.failureReason?.failureMessage || 'PawaPay rejected this payment.';
      await prisma.internshipPayment.update({
        where: { id: payment.id },
        data: { status: 'FAILED', failureReason: reason },
      });
      return res.status(400).json({ error: reason });
    }

    res.status(202).json({
      depositId,
      status: started.status || 'ACCEPTED',
      amount: pawapay.FEE_AMOUNT,
      currency: pawapay.CURRENCY,
      provider: pawapay.PROVIDERS[provider],
      payerPhone,
    });
  } catch (error) {
    console.error('Error starting internship payment:', error);
    res.status(500).json({ error: error.message || 'Failed to start the mobile money payment.' });
  }
});

router.get('/internship/payments/:depositId', async (req, res) => {
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
});

// Create a new career application
router.post('/', authMiddleware, async (req, res) => {
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
router.get('/', authMiddleware, async (req, res) => {
  try {
    const applications = await prisma.careerApplication.findMany({
      include: {
        career: true
      },
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
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const application = await prisma.careerApplication.findUnique({
      where: { id: parseInt(id) },
      include: {
        career: true
      }
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

// Update application status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'approved', 'rejected', 'under_review'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await prisma.careerApplication.update({
      where: { id: parseInt(id) },
      data: { status },
      include: {
        career: true
      }
    });

    res.json(application);
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Delete application
router.delete('/:id', authMiddleware, async (req, res) => {
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
router.get('/status/:status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    const applications = await prisma.careerApplication.findMany({
      where: { status },
      include: {
        career: true
      },
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
router.get('/stats/overview', authMiddleware, async (req, res) => {
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
router.get('/by-user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const applications = await prisma.careerApplication.findMany({
      where: { userId: parseInt(userId) },
      include: { career: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ applications });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user applications' });
  }
});

module.exports = router; 