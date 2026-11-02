const prisma = require('../prismaClient');

// Create a new carrier
const createCarrier = async (req, res) => {
  try {
    
    const {
      title,
      type,
      location,
      description,
      requirements,
      startDate,
      endDate,
      applicationLink,
      imageUrl
    } = req.body;

    const carrier = await prisma.carrier.create({
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

    res.status(201).json(carrier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get all carriers
const getAllCarriers = async (req, res) => {
  try {
    const carriers = await prisma.carrier.findMany();
    res.status(200).json(carriers);
  } catch (error) {
    console.error("Failed to fetch carriers:", error); // ← show error in console
    res.status(500).json({ error: 'Failed to fetch carriers' });
  }
};


// Get single carrier by ID
const getCarrierById = async (req, res) => {
  try {
    const { id } = req.params;
    const carrier = await prisma.carrier.findUnique({
      where: { id: parseInt(id) }
    });

    if (!carrier) {
      return res.status(404).json({ error: 'Carrier not found' });
    }

    res.status(200).json(carrier);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a carrier
const updateCarrier = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Convert dates if present
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const carrier = await prisma.carrier.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    res.status(200).json(carrier);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a carrier
const deleteCarrier = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.carrier.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).end();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  createCarrier,
  getAllCarriers,
  getCarrierById,
  updateCarrier,
  deleteCarrier
};