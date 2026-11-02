const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const multer = require('multer');
const path = require('path');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../../uploads/')); // Store in server/uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Get all careers
router.get('/', async (req, res) => {
  try {
    const careers = await prisma.carrier.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ careers });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch careers' });
  }
});

// Add a new career (with image upload)
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title, type, location, description, startDate, endDate, applicationLink
    } = req.body;
    let requirements = req.body.requirements || [];
    // Handle requirements as array (from FormData)
    if (!Array.isArray(requirements)) {
      // If sent as requirements[0], requirements[1], ...
      requirements = Object.keys(req.body)
        .filter(key => key.startsWith('requirements['))
        .sort()
        .map(key => req.body[key]);
    }

    // Save the file path or URL
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const career = await prisma.carrier.create({
      data: {
        title,
        type,
        location,
        description,
        requirements,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicationLink,
        imageUrl
      }
    });
    res.status(201).json({ career });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add career', details: err.message });
  }
});

// Update a career (with image upload)
router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const {
      title, type, location, description, startDate, endDate, applicationLink
    } = req.body;
    let requirements = req.body.requirements || [];
    if (!Array.isArray(requirements)) {
      requirements = Object.keys(req.body)
        .filter(key => key.startsWith('requirements['))
        .sort()
        .map(key => req.body[key]);
    }

    // Find the existing career
    const existing = await prisma.carrier.findUnique({ where: { id: Number(req.params.id) } });
    if (!existing) return res.status(404).json({ error: 'Career not found' });

    // If a new image is uploaded, use it; otherwise, keep the old one
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : existing.imageUrl;

    const updatedCareer = await prisma.carrier.update({
      where: { id: Number(req.params.id) },
      data: {
        title,
        type,
        location,
        description,
        requirements,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        applicationLink,
        imageUrl
      }
    });
    if (!updatedCareer) {
      return res.status(404).json({ error: 'Career not found' });
    }
    // Correctly wrap the response object in a 'career' property
    res.json({ career: updatedCareer });
  } catch (error) {
    console.error('Error updating career:', error);
    res.status(500).json({ error: 'Failed to update career', details: error.message });
  }
});

// Delete a career
router.delete('/:id', async (req, res) => {
  try {
    await prisma.carrier.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete career' });
  }
});

module.exports = router; 