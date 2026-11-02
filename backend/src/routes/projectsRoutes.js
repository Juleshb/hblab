const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();
const prisma = new PrismaClient();

// Get all projects
router.get('/', authMiddleware, async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get project by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id: parseInt(id) }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Create new project
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      description,
      manager,
      teamSize,
      status,
      progress,
      startDate,
      endDate,
      budget,
      client,
      priority
    } = req.body;

    const project = await prisma.project.create({
      data: {
        name,
        description,
        manager,
        teamSize: parseInt(teamSize) || 0,
        status: status || 'planning',
        progress: parseInt(progress) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: parseFloat(budget) || 0,
        client,
        priority: priority || 'medium'
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// Update project
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      manager,
      teamSize,
      status,
      progress,
      startDate,
      endDate,
      budget,
      client,
      priority
    } = req.body;

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: {
        name,
        description,
        manager,
        teamSize: parseInt(teamSize) || 0,
        status,
        progress: parseInt(progress) || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        budget: parseFloat(budget) || 0,
        client,
        priority
      }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// Update project status
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['planning', 'active', 'on_hold', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const project = await prisma.project.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    res.json(project);
  } catch (error) {
    console.error('Error updating project status:', error);
    res.status(500).json({ error: 'Failed to update project status' });
  }
});

// Delete project
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.project.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

// Get projects by status
router.get('/status/:status', authMiddleware, async (req, res) => {
  try {
    const { status } = req.params;
    const projects = await prisma.project.findMany({
      where: { status },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects by status:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get projects statistics
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    const total = await prisma.project.count();
    const active = await prisma.project.count({
      where: { status: 'active' }
    });
    const completed = await prisma.project.count({
      where: { status: 'completed' }
    });
    const onHold = await prisma.project.count({
      where: { status: 'on_hold' }
    });

    res.json({
      total,
      active,
      completed,
      onHold
    });
  } catch (error) {
    console.error('Error fetching project stats:', error);
    res.status(500).json({ error: 'Failed to fetch project statistics' });
  }
});

module.exports = router; 