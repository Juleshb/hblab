const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { register, login, getCurrentUser } = require('../controllers/authController');
const authenticate = require('../middleware/authMiddleware');

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authenticate(), getCurrentUser);

// Admin-only route example
router.get('/admin', authenticate(['ADMIN']), (req, res) => {
  res.json({ message: 'Welcome admin!' });
});

// Admin routes
router.get('/admin/stats', authenticate(['ADMIN']), async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const newApplicants = await prisma.user.count({ 
      where: { 
        role: 'APPLICANT',
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    
    res.json({
      totalUsers,
      totalStudents,
      newApplicants,
      activeToday: Math.floor(totalUsers * 0.15),
      userGrowth: 12.5,
      studentGrowth: 8.2,
      applicantGrowth: 24.7,
      activeChange: 3.1
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

router.get('/admin/users/recent', authenticate(['ADMIN']), async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    res.json(users);
  } catch (error) {
    console.error('Recent users error:', error);
    res.status(500).json({ error: 'Failed to load recent users' });
  }
});

router.get('/admin/activities', authenticate(['ADMIN']), async (req, res) => {
  try {
    const activities = [
      { id: 1, action: 'User registered', user: 'John Doe', time: '2 minutes ago' },
      { id: 2, action: 'Application submitted', user: 'Alice Smith', time: '15 minutes ago' },
      { id: 3, action: 'Profile updated', user: 'Bob Johnson', time: '1 hour ago' },
      { id: 4, action: 'Account verified', user: 'Emma Wilson', time: '3 hours ago' },
      { id: 5, action: 'Password changed', user: 'Michael Brown', time: '5 hours ago' }
    ];
    res.json(activities);
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ error: 'Failed to load activities' });
  }
});

// Student-only route example
router.get('/student', authenticate(['STUDENT']), (req, res) => {
  res.json({ message: 'Welcome student!' });
});

module.exports = router;