const prisma = require('../prismaClient');
const path = require('path');

// Get all topics for a lesson
const getTopicsByLesson = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const topics = await prisma.topic.findMany({
      where: { lessonId: parseInt(lessonId) },
      orderBy: { id: 'asc' }
    });
    res.status(200).json(topics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a topic for a lesson (with file upload)
const createTopic = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { title, assignment } = req.body;
    let documentUrl = null;
    if (req.file) {
      documentUrl = `/uploads/${req.file.filename}`;
    }
    const topic = await prisma.topic.create({
      data: {
        title,
        assignment,
        documentUrl,
        lesson: { connect: { id: parseInt(lessonId) } }
      }
    });
    res.status(201).json(topic);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update a topic (with file upload)
const updateTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, assignment } = req.body;
    let documentUrl = undefined;
    if (req.file) {
      documentUrl = `/uploads/${req.file.filename}`;
    }
    const data = { title, assignment };
    if (documentUrl !== undefined) data.documentUrl = documentUrl;
    const topic = await prisma.topic.update({
      where: { id: parseInt(id) },
      data
    });
    res.status(200).json(topic);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a topic
const deleteTopic = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.topic.delete({ where: { id: parseInt(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getTopicsByLesson,
  createTopic,
  updateTopic,
  deleteTopic
}; 