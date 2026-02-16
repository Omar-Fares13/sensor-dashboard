/**
 * Formatting utilities for sensor data display.
 * Converts raw field names and values into human-readable text.
 */

/**
 * Convert a raw field name into a readable label.
 * "temperature_chip" → "Temperature (Chip)"
 * "acceleration_0"   → "Acceleration (X)"
 * "vibration_x_3"    → "Vibration X (Band 4)"
 */
export function formatFieldName(field: string): string {
  // Special mappings for known fields
  const specialMappings: Record<string, string> = {
    temperature_chip: 'Temperature (Chip)',
    temperature_ntc: 'Temperature (NTC)',
    temperature_rtd: 'Temperature (RTD)',
    humidity: 'Humidity',
    voltage: 'Voltage',
    fault_status: 'Fault Status',
    signal_quality: 'Signal Quality',
    battery_voltage: 'Battery Voltage',
    battery_capacity: 'Battery Capacity',
    charge_percentage: 'Charge',
    state_of_charge: 'State of Charge',
    bat_charging_status: 'Charging Status',
    ble_buffer_status: 'BLE Buffer',
    gtw_host_status: 'Gateway Host Status',
    device_angle: 'Device Angle',
    coulomb_count: 'Coulomb Count',
    charge_status: 'Charge Status',
    wgr_fault_status: 'Gauge Fault Status',
  };

  if (specialMappings[field]) {
    return specialMappings[field];
  }

  // Handle acceleration axes: acceleration_0 → Acceleration (X)
  const accelMatch = field.match(/^acceleration_(\d)$/);
  if (accelMatch) {
    const axes = ['X', 'Y', 'Z'];
    return `Acceleration (${axes[parseInt(accelMatch[1])] || accelMatch[1]})`;
  }

  // Handle vibration bands: vibration_x_3 → Vibration X (Band 4)
  const vibMatch = field.match(/^vibration_([xyz])_(\d)$/);
  if (vibMatch) {
    return `Vibration ${vibMatch[1].toUpperCase()} (Band ${parseInt(vibMatch[2]) + 1})`;
  }

  // Handle temperature RTD channels: temperature_rtd_0 → Temperature RTD (Ch 1)
  const rtdMatch = field.match(/^temperature_rtd_(\d)$/);
  if (rtdMatch) {
    return `Temperature RTD (Ch ${parseInt(rtdMatch[1]) + 1})`;
  }

  // Handle voltage channels: voltage_0 → Voltage (Ch 1)
  const voltMatch = field.match(/^voltage_(\d+)$/);
  if (voltMatch) {
    return `Voltage (Ch ${parseInt(voltMatch[1]) + 1})`;
  }

  // Handle current channels: current_0 → Current (Ch 1)
  const currMatch = field.match(/^current_(\d+)$/);
  if (currMatch) {
    return `Current (Ch ${parseInt(currMatch[1]) + 1})`;
  }

  // Handle gauge report: wgr_gauge_report_0 → Gauge Report (1)
  const gaugeMatch = field.match(/^wgr_gauge_report_(\d)$/);
  if (gaugeMatch) {
    return `Gauge Report (${parseInt(gaugeMatch[1]) + 1})`;
  }

  // Fallback: capitalize and clean up
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format a field value with appropriate units.
 * temperature_chip: 223 → "22.3 °C"
 * humidity: 8 → "8 %"
 * voltage: 3025 → "3025 mV"
 */
export function formatFieldValue(field: string, value: number | string): string {
  if (typeof value === 'string') return value;

  // Temperature fields (stored as 0.1°C)
  if (field.startsWith('temperature_') || field.startsWith('battery_ntc')) {
    return `${(value / 10).toFixed(1)} °C`;
  }

  // Humidity
  if (field === 'humidity') {
    return `${value} %`;
  }

  // Voltage fields
  if (field.startsWith('voltage') || field.startsWith('battery_voltage')) {
    return `${value} mV`;
  }

  // Acceleration
  if (field.startsWith('acceleration')) {
    return `${value} mG`;
  }

  // Vibration
  if (field.startsWith('vibration')) {
    return `${value} mm/s`;
  }

  // Signal quality
  if (field === 'signal_quality') {
    return `${value} dBm`;
  }

  // Battery capacity
  if (field.startsWith('battery_capacity') || field.startsWith('state_of_charge')) {
    return `${value} mAh`;
  }

  // Percentage fields
  if (field.startsWith('charge_percentage') || field.startsWith('ble_buffer_status')) {
    return `${value} %`;
  }

  // Angle
  if (field === 'device_angle') {
    return `${value}°`;
  }

  // Current
  if (field.startsWith('current')) {
    return `${value} uA`;
  }

  // Gauge report (float values)
  if (field.startsWith('wgr_gauge_report')) {
    return `${value.toFixed(3)}`;
  }

  // Fault status
  if (field === 'fault_status' || field === 'wgr_fault_status') {
    return value === 0 ? 'No Faults' : `Fault (${value})`;
  }

  // Default: just the number
  return `${value}`;
}

/**
 * Format a timestamp into a readable string.
 * "2026-02-09T22:10:55.438Z" → "Feb 9, 22:10"
 */
export function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const month = months[date.getMonth()];
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');

  return `${month} ${day}, ${hours}:${minutes}`;
}

/**
 * Get a relative time string.
 * "2 minutes ago", "3 hours ago", etc.
 */
export function timeAgo(isoString: string): string {
  const now = new Date();
  const then = new Date(isoString);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}