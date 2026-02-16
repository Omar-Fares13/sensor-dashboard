const express = require('express');
const router = express.Router();
const influxService = require('../services/influx.service');

/**
 * GET /api/devices
 * List all devices with latest readings.
 */
router.get('/', async (req, res) => {
  try {
    const devices = await influxService.getAllDevices();
    res.json({ devices, count: devices.length });
  } catch (error) {
    console.error('Error fetching devices:', error.message);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

/**
 * GET /api/devices/:mac
 * Get a single device with its latest readings.
 */
router.get('/:mac', async (req, res) => {
  try {
    const device = await influxService.getDeviceByMac(req.params.mac);

    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    res.json({ device });
  } catch (error) {
    console.error('Error fetching device:', error.message);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

/**
 * GET /api/devices/:mac/fields
 * Get available chartable fields for a device.
 */
router.get('/:mac/fields', async (req, res) => {
  try {
    const fields = await influxService.getDeviceFields(req.params.mac);
    res.json({ mac: req.params.mac, fields });
  } catch (error) {
    console.error('Error fetching fields:', error.message);
    res.status(500).json({ error: 'Failed to fetch fields' });
  }
});

/**
 * GET /api/devices/:mac/history
 * Get historical data for a specific field.
 *
 * Query params:
 *   field (required) - The field name to get history for
 *   start (optional) - Start time, default "0" (all data)
 *   stop  (optional) - Stop time, default "now()"
 */
router.get('/:mac/history', async (req, res) => {
  try {
    const { field, start, stop } = req.query;

    if (!field) {
      return res.status(400).json({ error: 'Query parameter "field" is required' });
    }

    const data = await influxService.getDeviceHistory(
      req.params.mac,
      field,
      start || '0',
      stop || 'now()'
    );

    res.json({
      mac: req.params.mac,
      field,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('Error fetching history:', error.message);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;