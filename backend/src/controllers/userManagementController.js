const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Get all users with pagination and search
const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 5, search = '', role = '', status = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (role) {
      where.role = role;
    }

    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Add status based on last activity (mock for now)
    const usersWithStatus = users.map(user => ({
      ...user,
      status: 'Active', // In a real app, you'd check last login time
      lastActive: getLastActiveTime(user.updatedAt)
    }));

    res.json({
      users: usersWithStatus,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ...user,
      status: 'Active',
      lastActive: getLastActiveTime(user.updatedAt)
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

// Create new user
const createUser = async (req, res) => {
  try {
    const { name, email, password, role = 'STUDENT', specialization, bio, status } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        specialization,
        bio,
        status
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json({
      ...newUser,
      lastActive: getLastActiveTime(newUser.updatedAt)
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, password } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email }
      });

      if (emailExists) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      ...updatedUser,
      status: 'Active',
      lastActive: getLastActiveTime(updatedUser.updatedAt)
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent deleting admin users (optional security measure)
    if (existingUser.role === 'ADMIN') {
      return res.status(400).json({ error: 'Cannot delete admin users' });
    }

    // Delete user
    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });

    const adminCount = usersByRole.find(u => u.role === 'ADMIN')?._count.role || 0;
    const studentCount = usersByRole.find(u => u.role === 'STUDENT')?._count.role || 0;
    const applicantCount = usersByRole.find(u => u.role === 'APPLICANT')?._count.role || 0;

    // Get recent users (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    res.json({
      totalUsers,
      adminCount,
      studentCount,
      applicantCount,
      recentUsers
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
};

// Helper function to get last active time
const getLastActiveTime = (updatedAt) => {
  const now = new Date();
  const updated = new Date(updatedAt);
  const diffInHours = Math.floor((now - updated) / (1000 * 60 * 60));
  
  if (diffInHours < 1) return 'Just now';
  if (diffInHours < 24) return `${diffInHours} hours ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} days ago`;
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks} weeks ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths} months ago`;
};

// Get trainers specifically
const getTrainers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {
      role: 'ADMIN' // Assuming trainers are stored as ADMIN role
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalTrainers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalTrainers / limit);

    // Get trainers with pagination
    const trainers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        specialization: true,
        bio: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Add trainer-specific fields
    const trainersWithDetails = trainers.map(trainer => ({
      ...trainer,
      courses: Math.floor(Math.random() * 15) + 1, // Mock data
      rating: (Math.random() * 2 + 3).toFixed(1), // Mock rating between 3-5
      status: trainer.status || 'Active',
      lastActive: getLastActiveTime(trainer.updatedAt)
    }));

    res.json({
      trainers: trainersWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTrainers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ error: 'Failed to fetch trainers' });
  }
};

// Get students specifically
const getStudents = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build where clause for filtering
    const where = {
      role: 'STUDENT'
    };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count for pagination
    const totalStudents = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalStudents / limit);

    // Get students with pagination
    const students = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      skip: parseInt(skip),
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Add student-specific fields
    const studentsWithDetails = students.map(student => ({
      ...student,
      enrolledCourses: Math.floor(Math.random() * 8) + 1, // Mock data
      completion: `${Math.floor(Math.random() * 100)}%`, // Mock completion
      status: 'Active',
      enrollmentDate: student.createdAt.toISOString().split('T')[0],
      lastActive: getLastActiveTime(student.updatedAt)
    }));

    res.json({
      students: studentsWithDetails,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

// Helper function to get random specialization
const getRandomSpecialization = () => {
  const specializations = [
    'Frontend Development',
    'Backend Development',
    'Data Science',
    'DevOps',
    'UI/UX Design',
    'Mobile Development',
    'Cybersecurity',
    'Cloud Computing'
  ];
  return specializations[Math.floor(Math.random() * specializations.length)];
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getTrainers,
  getStudents
}; 