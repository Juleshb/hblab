require('dotenv').config();
const http = require('http');
const morgan = require('morgan');
const express = require('express');
const userRoutes = require('./routes/userRoutes');
const carrierRoutes = require('./routes/carrierRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const userManagementRoutes = require('./routes/userManagementRoutes');
const applicationsRoutes = require('./routes/applicationsRoutes');
const projectsRoutes = require('./routes/projectsRoutes');
const cors = require("cors")
const careersRoutes = require('./routes/careersRoutes');
const lessonsRoutes = require('./routes/lessonsRoutes');
const path = require('path');
const app = express();
const uploadRoutes = require('./routes/uploadRoutes');
const hbmsRoutes = require('./modules/hbms');
const { ensureHbmsSeed } = require('./modules/hbms/seed');
const { startDeadlineReminders } = require('./modules/hbms/reminders');
const { attachLive } = require('./modules/hbms/live');

// Middleware - MUST come before routes
app.use(cors())
app.use(express.json()); // This is crucial for POST requests
app.use(morgan("dev"));
// Serve the uploads folder (HB-LAB/server/uploads) statically
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
// Routes
app.use('/api/users', userRoutes);
app.use('/api/carriers', carrierRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin/users', userManagementRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/careers', careersRoutes);
app.use('/api/lessons', lessonsRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hbms', hbmsRoutes);
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);
attachLive(server);
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  ensureHbmsSeed().catch((error) => {
    console.error('HBMS seed skipped:', error.message);
  });
  startDeadlineReminders();
});