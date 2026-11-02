const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

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