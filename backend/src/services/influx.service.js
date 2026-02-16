const { queryApi } = require('../config/influx');


const bucket = process.env.INFLUX_BUCKET;

console.log('Service loading... Bucket name is:', process.env.INFLUX_BUCKET);

console.log('Service loaded. queryApi type:', typeof queryApi, '| bucket:', bucket);


/**
 * Execute a Flux query and return all rows as an array.
 */
async function executeQuery(query) {
  const results = [];

  return new Promise((resolve, reject) => {
    queryApi.queryRows(query, {
      next(row, tableMeta) {
        const record = tableMeta.toObject(row);
        results.push(record);
      },
      error(error) {
        reject(error);
      },
      complete() {
        resolve(results);
      },
    });
  });
}

/**
 * GET /api/devices
 * Returns all unique devices with their metadata and latest readings.
 */
async function getAllDevices() {
  // Step 1: Get the latest record for each device + field combination
  const query = `
    from(bucket: "${bucket}")
      |> range(start: 0)
      |> filter(fn: (r) => r._measurement == "device_readings")
      |> filter(fn: (r) => r._field != "signal_quality")
      |> group(columns: ["device_mac", "device_type", "device_category", "gateway_id", "group_id", "_field"])
      |> last()
  `;

  const rows = await executeQuery(query);

  // Step 2: Group results by device MAC address
  const devicesMap = {};

  for (const row of rows) {
    const mac = row.device_mac;

    if (!devicesMap[mac]) {
      devicesMap[mac] = {
        mac: row.device_mac,
        type: row.device_type,
        category: row.device_category,
        gatewayId: row.gateway_id,
        groupId: row.group_id,
        lastSeen: row._time,
        readings: {},
      };
    }

    // Track the most recent timestamp as "lastSeen"
    if (new Date(row._time) > new Date(devicesMap[mac].lastSeen)) {
      devicesMap[mac].lastSeen = row._time;
    }

    // Add this field to the device's readings
    devicesMap[mac].readings[row._field] = row._value;
  }

  // Convert map to array and sort by category then type
  const devices = Object.values(devicesMap).sort((a, b) => {
    if (a.category !== b.category) {
      return a.category === 'gateway' ? -1 : 1;  // gateways first
    }
    return a.type.localeCompare(b.type);
  });

  return devices;
}

/**
 * GET /api/devices/:mac
 * Returns a single device with its latest readings.
 */
async function getDeviceByMac(mac) {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: 0)
      |> filter(fn: (r) => r._measurement == "device_readings")
      |> filter(fn: (r) => r.device_mac == "${mac}")
      |> group(columns: ["_field"])
      |> last()
  `;

  const rows = await executeQuery(query);

  if (rows.length === 0) {
    return null;
  }

  const device = {
    mac: rows[0].device_mac,
    type: rows[0].device_type,
    category: rows[0].device_category,
    gatewayId: rows[0].gateway_id,
    groupId: rows[0].group_id,
    lastSeen: null,
    readings: {},
  };

  for (const row of rows) {
    if (!device.lastSeen || new Date(row._time) > new Date(device.lastSeen)) {
      device.lastSeen = row._time;
    }
    device.readings[row._field] = row._value;
  }

  return device;
}

/**
 * GET /api/devices/:mac/fields
 * Returns the list of available fields for a device.
 * Useful for the frontend to know what can be charted.
 */
async function getDeviceFields(mac) {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: 0)
      |> filter(fn: (r) => r._measurement == "device_readings")
      |> filter(fn: (r) => r.device_mac == "${mac}")
      |> group(columns: ["_field"])
      |> last()
      |> keep(columns: ["_field", "_value"])
  `;

  const rows = await executeQuery(query);

  // Only return numeric fields (those are the ones we can chart)
  return rows
    .filter(row => typeof row._value === 'number')
    .map(row => row._field)
    .sort();
}

/**
 * GET /api/devices/:mac/history?field=temperature_chip&start=-7d&stop=now()
 * Returns time-series data for a specific field on a specific device.
 */
async function getDeviceHistory(mac, field, start = '0', stop = 'now()') {
  const query = `
    from(bucket: "${bucket}")
      |> range(start: ${start}, stop: ${stop})
      |> filter(fn: (r) => r._measurement == "device_readings")
      |> filter(fn: (r) => r.device_mac == "${mac}")
      |> filter(fn: (r) => r._field == "${field}")
      |> sort(columns: ["_time"], desc: false)
  `;

  const rows = await executeQuery(query);

  return rows.map(row => ({
    time: row._time,
    value: row._value,
  }));
}

module.exports = {
  getAllDevices,
  getDeviceByMac,
  getDeviceFields,
  getDeviceHistory,
};