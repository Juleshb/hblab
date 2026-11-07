const express = require('express');
const prisma = require('../prismaClient');
const authenticate = require('../middleware/authMiddleware');

const router = express.Router();

function clean(value, max = 2000) {
  return String(value || '').replace(/\0/g, '').trim().slice(0, max);
}

function youtubeId(value) {
  const text = String(value || '').trim();
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|live\/|shorts\/|v\/))([A-Za-z0-9_-]{11})/)
    || text.match(/^[A-Za-z0-9_-]{11}$/);
  return match ? match[1] : '';
}

function flag(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', '1', 'on', 'yes'].includes(String(value).toLowerCase());
}

function readWork(body) {
  const title = clean(body.title, 160);
  const client = clean(body.client, 160);
  const category = clean(body.category, 40);
  const youtubeUrl = clean(body.youtubeUrl, 300);
  if (!title) return { error: 'Enter the title.' };
  if (!client) return { error: 'Enter the client name.' };
  if (!category) return { error: 'Choose a category.' };
  if (!youtubeId(youtubeUrl)) return { error: 'Paste a YouTube link for this film.' };
  const sortOrder = Number(body.sortOrder);
  return {
    data: {
      title,
      client,
      category,
      youtubeUrl,
      description: clean(body.description, 4000),
      year: clean(body.year, 8),
      location: clean(body.location, 160),
      published: flag(body.published, true),
      featured: flag(body.featured, false),
      sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.min(9999, Math.round(sortOrder))) : 0,
    },
  };
}

const order = [{ featured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }];

router.get('/works', async (req, res) => {
  try {
    const works = await prisma.studioWork.findMany({
      where: { published: true },
      orderBy: order,
    });
    res.json({ works });
  } catch (error) {
    if (error?.code === 'P2021') return res.json({ works: [] });
    res.status(500).json({ error: 'Could not load studio work.' });
  }
});

router.get('/works/manage', authenticate(['ADMIN']), async (req, res) => {
  try {
    const works = await prisma.studioWork.findMany({ orderBy: order });
    res.json({ works });
  } catch (error) {
    res.status(500).json({ error: 'Could not load studio work.' });
  }
});

router.post('/works', authenticate(['ADMIN']), async (req, res) => {
  const parsed = readWork(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const work = await prisma.studioWork.create({ data: parsed.data });
    res.status(201).json({ work });
  } catch (error) {
    res.status(500).json({ error: 'Could not add this film.' });
  }
});

router.put('/works/:id', authenticate(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'This film was not found.' });
  const parsed = readWork(req.body || {});
  if (parsed.error) return res.status(400).json({ error: parsed.error });
  try {
    const work = await prisma.studioWork.update({ where: { id }, data: parsed.data });
    res.json({ work });
  } catch (error) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'This film was not found.' });
    res.status(500).json({ error: 'Could not update this film.' });
  }
});

router.delete('/works/:id', authenticate(['ADMIN']), async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'This film was not found.' });
  try {
    await prisma.studioWork.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'This film was not found.' });
    res.status(500).json({ error: 'Could not remove this film.' });
  }
});

module.exports = router;
