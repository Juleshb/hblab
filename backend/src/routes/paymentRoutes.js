const express = require('express');
const { recordRefund, settleDeposit } = require('../modules/pawapay');

const router = express.Router();

async function receiveCallback(req, res) {
  const depositId = String(req.body?.depositId || '');
  if (!depositId) return res.json({ received: true });
  try {
    await settleDeposit(depositId);
    res.json({ received: true });
  } catch (error) {
    console.error('PawaPay callback failed:', error.message);
    res.status(500).json({ error: 'Could not record the payment' });
  }
}

router.post('/pawapay/deposits', receiveCallback);
router.post('/pawapay/checkouts', receiveCallback);
router.post('/pawapay/refunds', async (req, res) => {
  try {
    await recordRefund(req.body || {});
    res.json({ received: true });
  } catch (error) {
    console.error('PawaPay refund callback failed:', error.message);
    res.status(500).json({ error: 'Could not record the refund' });
  }
});

module.exports = router;
