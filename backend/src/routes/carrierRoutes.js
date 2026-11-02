const express = require('express');
const router = express.Router();
const {
  createCarrier,
  getAllCarriers,
  getCarrierById,
  updateCarrier,
  deleteCarrier
} = require('../controllers/carrierController'); // Fixed path

// Your routes here
router.post('/', createCarrier);
router.get('/', getAllCarriers);
router.get('/:id', getCarrierById);
router.put('/:id', updateCarrier);
router.delete('/:id', deleteCarrier);

module.exports = router;