const express = require('express');
const { prisma, handlePrismaError } = require('./utils');
const { attachAccess } = require('./access');

const router = express.Router();
router.use(attachAccess);

router.post('/devices', async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    if (!token.startsWith('ExponentPushToken') && !token.startsWith('ExpoPushToken')) {
      return res.status(400).json({ error: 'Invalid notification token' });
    }
    await prisma.hbmsPushToken.upsert({
      where: { token },
      update: { userId: req.userId, platform: String(req.body.platform || 'unknown') },
      create: { token, userId: req.userId, platform: String(req.body.platform || 'unknown') },
    });
    res.json({ data: { saved: true } });
  } catch (error) {
    handlePrismaError(res, error, 'Could not save the notification token');
  }
});

module.exports = router;
