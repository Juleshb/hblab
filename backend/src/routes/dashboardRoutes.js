const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getUserGrowthData,
  getCertificateStatusData,
  getRecentActivities,
  getTopCourses
} = require('../controllers/dashboardController');

// All dashboard routes require admin authentication
router.use(authenticate(['ADMIN']));

// Get dashboard statistics
router.get('/stats', getDashboardStats);

// Get user growth data for charts
router.get('/user-growth', getUserGrowthData);

// Get certificate status data
router.get('/certificate-status', getCertificateStatusData);

// Get recent activities
router.get('/recent-activities', getRecentActivities);

// Get top courses
router.get('/top-courses', getTopCourses);

module.exports = router; 