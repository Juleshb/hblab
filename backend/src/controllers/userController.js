const prisma = require('../prismaClient');

// Create a user
const createUser = async (req, res) => {
  const {
    email, password, name, specialization, bio, phone, avatar, cover, status, sex, address, dateOfBirth, nationality
  } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        email, password, name, specialization, bio, phone, avatar, cover, status, sex, address, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, nationality
      },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all users
const getAllUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

// Get one user
const getUserById = async (req, res) => {
  const id = parseInt(req.params.id);
  const user = await prisma.user.findUnique({ where: { id } });
  user ? res.json(user) : res.status(404).json({ error: 'Not found' });
};

// Update user
const updateUser = async (req, res) => {
  const id = parseInt(req.params.id);
  const {
    email, password, name, specialization, bio, phone, avatar, cover, status, sex, address, dateOfBirth, nationality
  } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        email, password, name, specialization, bio, phone, avatar, cover, status, sex, address, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined, nationality
      },
    });
    res.json(user);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Delete failed' });
  }
};

// Get student progress
const getStudentProgress = async (req, res) => {
  try {
    const userId = parseInt(req.query.userId);
    if (!userId) {
      return res.status(400).json({ error: 'Missing userId parameter' });
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: `User with id ${userId} not found` });
    }

    // Get all lessons
    const lessons = await prisma.lesson.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        lessonProgress: {
          where: { userId },
          select: { progress: true, completed: true, updatedAt: true }
        }
      }
    });

    if (!lessons || lessons.length === 0) {
      return res.json([]); // No lessons, return empty array
    }

    // Format response: flatten lessonProgress
    const progressData = lessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      progress: lesson.lessonProgress[0]?.progress || 0,
      completed: lesson.lessonProgress[0]?.completed || false,
      updatedAt: lesson.lessonProgress[0]?.updatedAt || null
    }));

    res.json(progressData);
  } catch (err) {
    console.error('Error in getStudentProgress for userId:', req.query.userId, err);
    res.status(500).json({ error: err.message });
  }
};

// Get current student's profile
const getStudentProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userId = req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Construct image URL
    const imageUrl = user.image ? `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${user.image}` : null;
    res.json({ ...user, imageUrl });
  } catch (err) {
    console.error('getStudentProfile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

// Update current student's profile (with image upload)
const updateStudentProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, specialization, bio, phone, sex, address, dateOfBirth, nationality } = req.body;
    let image;
    if (req.file) {
      image = req.file.filename;
    }
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        email,
        specialization,
        bio,
        phone,
        sex,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        nationality,
        ...(image && { image }),
      },
    });
    const imageUrl = updatedUser.image ? `${process.env.BASE_URL || 'http://localhost:3001'}/uploads/${updatedUser.image}` : null;
    res.json({ ...updatedUser, imageUrl });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudentProgress,
  getStudentProfile,
  updateStudentProfile
};