const express = require('express');
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudentProgress,
  getStudentProfile,
  updateStudentProfile
} = require('../controllers/userController');
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
});
const authMiddleware = require('../middleware/authMiddleware');

// Create a user
router.post('/', createUser);

// Get all users
router.get('/', getAllUsers);

// Get one user
router.get('/:id', getUserById);

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

// Avatar upload endpoint
router.post('/:id/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the URL to the uploaded file
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Resume upload endpoint (generic)
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the URL to the uploaded file
  const url = `/uploads/${req.file.filename}`;
  res.json({ url });
});

// Get student progress
router.get('/student/progress', getStudentProgress);

// Student profile endpoints
router.get('/profile', authMiddleware(), getStudentProfile);
router.put('/profile', authMiddleware(), upload.single('image'), updateStudentProfile);

module.exports = router;
// Add these to your existing routes

// User routes
router.get('/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email status');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Certificate routes
router.get('/count', async (req, res) => {
  try {
    const count = await Certificate.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats', async (req, res) => {
  try {
    // This is a simplified example - you'd need to implement proper aggregation
    const stats = await Certificate.aggregate([
      {
        $group: {
          _id: { $month: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          month: "$_id",
          count: 1,
          _id: 0
        }
      },
      { $sort: { month: 1 } }
    ]);
    
    // Map to month names for better display
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedStats = stats.map(stat => ({
      month: monthNames[stat.month - 1],
      count: stat.count
    }));
    
    res.json(formattedStats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Carrier routes
router.get('/count', async (req, res) => {
  try {
    const count = await Carrier.countDocuments();
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const carriers = await Carrier.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email mcNumber dotNumber status');
    res.json({ carriers });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});