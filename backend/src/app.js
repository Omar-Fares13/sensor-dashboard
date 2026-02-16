require('dotenv').config();

// DEBUG: Check env vars
console.log('--- DEBUG: Environment Variables ---');
console.log('INFLUX_URL:', process.env.INFLUX_URL);
console.log('INFLUX_TOKEN:', process.env.INFLUX_TOKEN ? 'SET (hidden)' : 'NOT SET');
console.log('INFLUX_ORG:', process.env.INFLUX_ORG);
console.log('INFLUX_BUCKET:', process.env.INFLUX_BUCKET);
console.log('PORT:', process.env.PORT);
console.log('-----------------------------------');

const express = require('express');
const cors = require('cors');
const devicesRouter = require('./routes/devices');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/devices', devicesRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Endpoints:`);
  console.log(`  GET /api/health`);
  console.log(`  GET /api/devices`);
  console.log(`  GET /api/devices/:mac`);
  console.log(`  GET /api/devices/:mac/fields`);
  console.log(`  GET /api/devices/:mac/history?field=<fieldName>`);
});