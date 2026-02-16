const { InfluxDB, Point } = require('@influxdata/influxdb-client');
const fs = require('fs');
const path = require('path');

// ═══════════════════════════════════════════════════════
// Configuration
// ═══════════════════════════════════════════════════════
const CONFIG = {
  influxUrl: 'http://localhost:8086',
  influxToken: process.env.INFLUX_TOKEN,
  influxOrg: 'e4a',
  influxBucket: 'sensor_data',
  dataDir: path.join(__dirname, '..', 'data'),
};

// ═══════════════════════════════════════════════════════
// Fields to SKIP — metadata we don't need as measurements
// ═══════════════════════════════════════════════════════
const SKIP_FIELDS = new Set([
  'Prefix',
  'NumberOfAttributes',
  'measure_name',
  'MacAddress',
  'GatewayID',
  'GroupID',
  'time',
  'SignalTimestamp',
  'Capture_Timestamp',
  'Received_Signal_Quality',
  'Recieved_Signal_Quality',  // typo in TP-400R8 data
]);

// ═══════════════════════════════════════════════════════
// Helper: Clean field names
// "Temperature_CHIP-0.1°C" → "temperature_chip"
// "Vibration_X-mm/s"       → "vibration_x"
// "Humidity-RH%"           → "humidity"
// ═══════════════════════════════════════════════════════
function cleanFieldName(name) {
  return name
    .replace(/-[0-9.]*[°%a-zA-Z/]+$/, '')  // remove unit suffixes like -0.1°C, -mV, -RH%
    .replace(/[^a-zA-Z0-9_]/g, '_')         // replace special chars with underscore
    .replace(/_+/g, '_')                     // collapse multiple underscores
    .replace(/_$/, '')                       // remove trailing underscore
    .toLowerCase();
}

// ═══════════════════════════════════════════════════════
// Helper: Flatten a field value into key-value pairs
// Handles both simple values and multi-value objects
// ═══════════════════════════════════════════════════════
function flattenField(key, value) {
  const cleanKey = cleanFieldName(key);
  const result = {};

  if (value === null || value === undefined) {
    return result;
  }

  if (typeof value === 'object') {
    // Multi-value field like { value0: 1, value1: 2, value2: 3 }
    for (const [subKey, subVal] of Object.entries(value)) {
      const index = subKey.replace('value', '');
      if (typeof subVal === 'number') {
        result[`${cleanKey}_${index}`] = subVal;
      } else if (typeof subVal === 'string') {
        result[`${cleanKey}_str_${index}`] = subVal;
      }
    }
  } else if (typeof value === 'number') {
    result[cleanKey] = value;
  } else if (typeof value === 'string') {
    result[`${cleanKey}_str`] = value;
  }

  return result;
}

// ═══════════════════════════════════════════════════════
// Helper: Parse timestamp string to Date
// "2026-02-09 22:04:45.521000000" → Date object
// ═══════════════════════════════════════════════════════
function parseTimestamp(timeStr) {
  // Trim nanoseconds to milliseconds (JS Date only supports ms)
  const trimmed = timeStr.substring(0, 23);  // "2026-02-09 22:04:45.521"
  return new Date(trimmed.replace(' ', 'T') + 'Z');
}

// ═══════════════════════════════════════════════════════
// Main Import Function
// ═══════════════════════════════════════════════════════
async function importData() {
  console.log('Starting data import to InfluxDB...\n');

  // Connect to InfluxDB
  const client = new InfluxDB({
    url: CONFIG.influxUrl,
    token: CONFIG.influxToken,
  });

  const writeApi = client.getWriteApi(CONFIG.influxOrg, CONFIG.influxBucket, 'ns');

  // Define our two data categories
  const categories = [
    { folder: 'gateways', category: 'gateway' },
    { folder: 'sensors', category: 'sensor' },
  ];

  let totalPoints = 0;
  let totalFiles = 0;

  for (const { folder, category } of categories) {
    const folderPath = path.join(CONFIG.dataDir, folder);

    // Check if folder exists
    if (!fs.existsSync(folderPath)) {
      console.error(`Folder not found: ${folderPath}`);
      continue;
    }

    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));

    console.log(` Processing ${folder}/ (${files.length} files)`);
    console.log('─'.repeat(50));

    for (const file of files) {
      const deviceType = file.replace('.json', '');  // "GTW-100", "AT-105", etc.
      const filePath = path.join(folderPath, file);

      // Read and parse JSON
      const rawData = fs.readFileSync(filePath, 'utf-8');
      const records = JSON.parse(rawData);

      let filePoints = 0;

      for (const record of records) {
        // Parse the timestamp
        const timestamp = parseTimestamp(record.time);

        // Get device MAC (used as unique identifier)
        const deviceMac = record.measure_name || 'unknown';

        // Create the data point
        const point = new Point('device_readings')
          .tag('device_mac', deviceMac)
          .tag('device_type', deviceType)
          .tag('device_category', category)
          .tag('gateway_id', record.GatewayID || 'unknown')
          .tag('group_id', record.GroupID || 'unknown')
          .timestamp(timestamp);

        // Add signal quality as a dedicated field (handling both spellings)
        const signalQuality = record.Received_Signal_Quality ?? record.Recieved_Signal_Quality;
        if (signalQuality !== undefined) {
          point.intField('signal_quality', typeof signalQuality === 'number' ? signalQuality : 0);
        }

        // Process all remaining fields
        for (const [key, value] of Object.entries(record)) {
          if (SKIP_FIELDS.has(key)) continue;

          const flattened = flattenField(key, value);

          for (const [fieldName, fieldValue] of Object.entries(flattened)) {
            if (typeof fieldValue === 'number') {
              if (Number.isInteger(fieldValue)) {
                point.intField(fieldName, fieldValue);
              } else {
                point.floatField(fieldName, fieldValue);
              }
            } else if (typeof fieldValue === 'string') {
              point.stringField(fieldName, fieldValue);
            }
          }
        }

        writeApi.writePoint(point);
        filePoints++;
      }

      console.log(`${file.padEnd(20)} → ${filePoints} points written`);
      totalPoints += filePoints;
      totalFiles++;
    }

    console.log('');
  }

  // Flush all pending writes to InfluxDB
  console.log('Flushing data to InfluxDB...');
  await writeApi.flush();
  await writeApi.close();

  console.log('');
  console.log('═'.repeat(50));
  console.log(`Import complete!`);
  console.log(`Files processed: ${totalFiles}`);
  console.log(`Total points:    ${totalPoints}`);
  console.log('═'.repeat(50));
}

// Run the import
importData().catch(err => {
  console.error('\nImport failed:', err.message);
  process.exit(1);
});