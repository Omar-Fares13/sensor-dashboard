/**
 * Represents a device (gateway or sensor) as returned by the API.
 */
export interface Device {
  mac: string;
  type: string;
  category: 'gateway' | 'sensor';
  gatewayId: string;
  groupId: string;
  lastSeen: string;
  readings: Record<string, number | string>;
}

/**
 * Response from GET /api/devices
 */
export interface DevicesResponse {
  devices: Device[];
  count: number;
}

/**
 * Response from GET /api/devices/:mac
 */
export interface DeviceDetailResponse {
  device: Device;
}

/**
 * Response from GET /api/devices/:mac/fields
 */
export interface FieldsResponse {
  mac: string;
  fields: string[];
}

/**
 * A single data point in a time series.
 */
export interface DataPoint {
  time: string;
  value: number;
}

/**
 * Response from GET /api/devices/:mac/history
 */
export interface HistoryResponse {
  mac: string;
  field: string;
  count: number;
  data: DataPoint[];
}