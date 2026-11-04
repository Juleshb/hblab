const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { sendPasswordReset } = require('../modules/hbms/mail');
const prisma = new PrismaClient();

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Validate role
    if (role && !['APPLICANT', 'STUDENT', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: role || 'APPLICANT'
      }
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

const ADMIN_CONTACT = 'info@hblab.rw';

const checkEmail = async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true },
    });
    res.json({ exists: Boolean(user), contact: ADMIN_CONTACT });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({ error: 'Could not check that email' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // Omit password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

const forgotPassword = async (req, res) => {
  const generic = { message: 'If an account uses that email, a reset link is on its way.' };
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } },
      select: { id: true, email: true, name: true },
    });
    if (!user) return res.json(generic);
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetHash: hashToken(token),
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await sendPasswordReset({ to: user.email, name: user.name, token });
    res.json(generic);
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Could not send the reset email' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const token = String(req.body?.token || '');
    const password = String(req.body?.password || '');
    if (!token) return res.status(400).json({ error: 'This reset link is not valid' });
    if (password.length < 8) return res.status(400).json({ error: 'Use at least 8 characters for the password' });
    const user = await prisma.user.findFirst({
      where: {
        passwordResetHash: hashToken(token),
        passwordResetExpires: { gt: new Date() },
      },
      select: { id: true },
    });
    if (!user) return res.status(400).json({ error: 'This reset link has expired. Ask for a new one.' });
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await bcrypt.hash(password, 12),
        passwordResetHash: null,
        passwordResetExpires: null,
      },
    });
    res.json({ message: 'Password updated. You can sign in.' });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: 'Could not update the password' });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

module.exports = {
  register,
  checkEmail,
  login,
  forgotPassword,
  resetPassword,
  getCurrentUser
};