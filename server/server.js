const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize } = require('./config/database');
const planRoutes = require('./routes/plans');
const mapsRoutes = require('./routes/maps');
const checklistRoutes = require('./routes/checklist');
const notificationRoutes = require('./routes/notifications');
const weatherRoutes = require('./routes/weather');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/plans', planRoutes);
app.use('/api/maps', mapsRoutes);
app.use('/api/checklist', checklistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/weather', weatherRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Emergency Preparedness API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      plans: '/api/plans',
      maps: {
        shelters: '/api/maps/shelters/:zipCode',
        route: '/api/maps/route',
        evacuationRoute: '/api/maps/evacuation-route',
        geocode: '/api/maps/geocode',
        distanceMatrix: '/api/maps/distance-matrix'
      },
      checklist: {
        userChecklist: '/api/checklist/:userId',
        generateCustom: '/api/checklist/generate'
      },
      notifications: {
        hazardAlert: '/api/notifications/hazard-alert',
        checklistReminder: '/api/notifications/checklist-reminder',
        testEmail: '/api/notifications/test-email',
        testPush: '/api/notifications/test-push',
        subscribe: '/api/notifications/subscribe',
        configStatus: '/api/notifications/config-status',
        vapidPublicKey: '/api/notifications/vapid-public-key'
      },
      weather: {
        analyze: '/api/weather/analyze',
        current: '/api/weather/current',
        forecast: '/api/weather/forecast',
        alerts: '/api/weather/alerts',
        monitor: '/api/weather/monitor'
      }
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
    
    // Sync models (create tables if they don't exist)
    // Use { alter: true } in development to update existing tables
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Database models synced');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`💾 Database: SQLite`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  await sequelize.close();
  process.exit(0);
});

startServer();
