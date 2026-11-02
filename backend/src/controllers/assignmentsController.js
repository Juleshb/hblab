const prisma = require('../prismaClient');

// Get all assignments for a topic
const getAssignmentsByTopic = async (req, res) => {
  try {
    const { topicId } = req.params;
    const assignments = await prisma.assignment.findMany({
      where: { topicId: parseInt(topicId) },
      include: { options: true }
    });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create an assignment for a topic
const createAssignment = async (req, res) => {
  try {
    const { topicId } = req.params;
    const { question, type, mark, options, correctOption } = req.body;
    let assignmentData = {
      question,
      type,
      mark: parseInt(mark),
      topic: { connect: { id: parseInt(topicId) } },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    if (type === 'MULTIPLE_CHOICE' && Array.isArray(options)) {
      assignmentData.options = {
        create: options.map((text) => ({ text }))
      };
      if (correctOption !== undefined) assignmentData.correctOption = correctOption;
    }
    const assignment = await prisma.assignment.create({
      data: assignmentData,
      include: { options: true }
    });
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update an assignment
const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, type, mark, options, correctOption } = req.body;
    let updateData = {
      question,
      type,
      mark: parseInt(mark),
      updatedAt: new Date()
    };
    if (type === 'MULTIPLE_CHOICE' && Array.isArray(options)) {
      // Remove existing options and add new ones
      await prisma.multipleChoiceOption.deleteMany({ where: { assignmentId: parseInt(id) } });
      updateData.options = {
        create: options.map((text) => ({ text }))
      };
      if (correctOption !== undefined) updateData.correctOption = correctOption;
    }
    const assignment = await prisma.assignment.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { options: true }
    });
    res.status(200).json(assignment);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete an assignment
const deleteAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.assignment.delete({ where: { id: parseInt(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Add a multiple choice option to an assignment
const addOption = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { text } = req.body;
    const option = await prisma.multipleChoiceOption.create({
      data: {
        text,
        assignment: { connect: { id: parseInt(assignmentId) } }
      }
    });
    res.status(201).json(option);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a multiple choice option
const deleteOption = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.multipleChoiceOption.delete({ where: { id: parseInt(id) } });
    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  getAssignmentsByTopic,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  addOption,
  deleteOption
}; 