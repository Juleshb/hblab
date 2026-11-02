const express = require('express');
const router = express.Router();
const {
  createCertificate,
  getAllCertificates,
  getCertificate,
  getCertificatesByEmail,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  checkCertificateByEmail
} = require('../controllers/certificateController');

// CRUD Routes
router.post('/', createCertificate);
router.get('/', getAllCertificates);
router.get('/:id', getCertificate);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

// Special Routes
router.get('/email/:email', getCertificatesByEmail);
router.get('/verify/:certificateId', getCertificateById);

// Student certificate retrieval
router.post('/check', checkCertificateByEmail);

module.exports = router;