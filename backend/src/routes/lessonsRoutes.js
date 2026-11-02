const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const topicsController = require('../controllers/topicsController');
const multer = require('multer');
const path = require('path');
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});
const assignmentsController = require('../controllers/assignmentsController');

// Get lessons for a user
router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ error: 'Missing userId' });
  try {
    // Get all lessons
    const lessons = await prisma.lesson.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Get user's lesson progress
    const progressList = await prisma.lessonProgress.findMany({
      where: { userId },
    });
    // Get user's enrolled courses (using lessonId as courseId)
    const enrolledList = await prisma.enrolledCourse.findMany({
      where: { userId },
    });
    const enrolledLessonIds = new Set(enrolledList.map(e => e.courseId));
    // Map progress by lessonId
    const progressMap = {};
    progressList.forEach(p => {
      progressMap[p.lessonId] = p;
    });
    // Build response
    const lessonsWithProgress = lessons.map(lesson => {
      const progress = progressMap[lesson.id] || { progress: 0, completed: false };
      return {
        ...lesson,
        progress: progress.progress,
        completed: progress.completed,
        enrolled: enrolledLessonIds.has(lesson.id),
      };
    });
    res.json({ lessons: lessonsWithProgress });
  } catch (err) {
    console.error('Failed to fetch lessons:', err);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Get all lessons (admin)
router.get('/all', async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ lessons });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Add a lesson
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const lesson = await prisma.lesson.create({
      data: { title, description }
    });
    res.status(201).json(lesson);
  } catch (err) {
    console.error('Failed to add lesson:', err); // Add this line for debugging
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

// Update a lesson
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    const lesson = await prisma.lesson.update({
      where: { id: Number(id) },
      data: { title, description }
    });
    res.json(lesson);
  } catch (err) {
    console.error('Failed to update lesson:', err);
    res.status(500).json({ error: 'Failed to update lesson' });
  }
});

// Delete a lesson
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.lesson.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    console.error('Failed to delete lesson:', err);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Get lesson details with topics
router.get('/:id/details', async (req, res) => {
  try {
    const { id } = req.params;
    const lesson = await prisma.lesson.findUnique({
      where: { id: Number(id) },
      include: { topics: true }
    });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lesson details' });
  }
});

// Get all topics for a lesson
router.get('/:lessonId/topics', topicsController.getTopicsByLesson);
// Create a topic for a lesson (with file upload)
router.post('/:lessonId/topics', upload.single('document'), topicsController.createTopic);
// Update a topic (with file upload)
router.put('/topics/:id', upload.single('document'), topicsController.updateTopic);
// Delete a topic
router.delete('/topics/:id', topicsController.deleteTopic);

// Assignment endpoints
router.get('/topics/:topicId/assignments', assignmentsController.getAssignmentsByTopic);
router.post('/topics/:topicId/assignments', assignmentsController.createAssignment);
router.put('/assignments/:id', assignmentsController.updateAssignment);
router.delete('/assignments/:id', assignmentsController.deleteAssignment);
// Multiple choice option endpoints
router.post('/assignments/:assignmentId/options', assignmentsController.addOption);
router.delete('/options/:id', assignmentsController.deleteOption);

module.exports = router; 