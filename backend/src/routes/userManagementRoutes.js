const express = require('express');
const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getTrainers,
  getStudents
} = require('../controllers/userManagementController');

// All user management routes require admin authentication
router.use(authenticate(['ADMIN']));

// Get all users with pagination and search
router.get('/', getAllUsers);

// Get trainers specifically
router.get('/trainers', getTrainers);

// Get students specifically
router.get('/students', getStudents);

// Get user statistics
router.get('/stats', getUserStats);

// Get user by ID
router.get('/:id', getUserById);

// Create new user
router.post('/', createUser);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router; 