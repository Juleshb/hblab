const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate unique certificate ID
const generateCertificateId = () => 
  `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

// Check certificate by email (for student retrieval)
const checkCertificateByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const certificate = await prisma.certificate.findFirst({
      where: { email },
      orderBy: { createdAt: 'desc' } // Get the most recent certificate
    });

    if (!certificate) {
      return res.status(404).json({ 
        exists: false,
        message: 'No certificate found for this email address'
      });
    }

    res.json({
      exists: true,
      certificate: {
        recipientName: certificate.recipientName,
        email: certificate.email,
        courseName: certificate.courseName,
        duration: certificate.duration,
        completionDate: certificate.completionDate,
        certificateId: certificate.certificateId,
        skills: certificate.skills
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'An error occurred while checking for your certificate'
    });
  }
};

// CREATE
const createCertificate = async (req, res) => {
  try {
    const { recipientName, email, courseName, duration, dateRange, completionDate, skills } = req.body;

    if (!recipientName || !email || !courseName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const certificate = await prisma.certificate.create({
      data: {
        recipientName,
        email,
        courseName,
        duration,
        dateRange,
        completionDate: new Date(completionDate || Date.now()),
        skills: skills || [],
        certificateId: generateCertificateId()
      }
    });

    res.status(201).json(certificate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// READ (All)
const getAllCertificates = async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ (Single)
const getCertificate = async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ (By Email)
const getCertificatesByEmail = async (req, res) => {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { email: req.params.email },
      orderBy: { createdAt: 'desc' }
    });
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// READ (By Certificate ID)
const getCertificateById = async (req, res) => {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { certificateId: req.params.certificateId }
    });
    
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// UPDATE
const updateCertificate = async (req, res) => {
  try {
    const { recipientName, email, courseName, duration, dateRange, completionDate, skills } = req.body;

    // Validate required fields
    if (!recipientName || !email || !courseName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Prepare update data
    const updateData = {
      recipientName,
      email,
      courseName,
      duration: duration || '',
      dateRange: dateRange || '',
      completionDate: completionDate ? new Date(completionDate) : new Date(),
      skills: skills || []
    };

    const certificate = await prisma.certificate.update({
      where: { id: parseInt(req.params.id) },
      data: updateData
    });
    
    res.json(certificate);
  } catch (error) {
    console.error('Update certificate error:', error);
    res.status(400).json({ error: error.message });
  }
};

// DELETE
const deleteCertificate = async (req, res) => {
  try {
    await prisma.certificate.delete({
      where: { id: parseInt(req.params.id) }
    });
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createCertificate,
  getAllCertificates,
  getCertificate,
  getCertificatesByEmail,
  getCertificateById,
  updateCertificate,
  deleteCertificate,
  checkCertificateByEmail
};