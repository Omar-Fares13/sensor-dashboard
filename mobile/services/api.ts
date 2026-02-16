/**
 * API Service
 * Handles all communication with the Express.js backend.
 *
 * IMPORTANT: Update API_BASE_URL with your machine's local IP.
 * On the phone, "localhost" refers to the phone itself, not your PC.
 */

import { DevicesResponse, DeviceDetailResponse, FieldsResponse, HistoryResponse } from '../types/device';


const API_BASE_URL = 'http://10.156.5.148:5000/api';

/**
 * Generic fetch wrapper with error handling.
 */
async function fetchJson<T>(endpoint: string): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    // Network error (server unreachable) vs HTTP error
    if (error instanceof TypeError && error.message === 'Network request failed') {
      throw new Error(
        'Cannot reach the server. Make sure the backend is running '
        + 'and your phone is on the same WiFi network.'
      );
    }
    throw error;
  }
}

/**
 * GET /api/devices
 * Fetch all devices with their latest readings.
 */
export async function getDevices(): Promise<DevicesResponse> {
  return fetchJson<DevicesResponse>('/devices');
}

/**
 * GET /api/devices/:mac
 * Fetch a single device with all its current readings.
 */
export async function getDevice(mac: string): Promise<DeviceDetailResponse> {
  return fetchJson<DeviceDetailResponse>(`/devices/${mac}`);
}

/**
 * GET /api/devices/:mac/fields
 * Fetch available chartable fields for a device.
 */
export async function getDeviceFields(mac: string): Promise<FieldsResponse> {
  return fetchJson<FieldsResponse>(`/devices/${mac}/fields`);
}

/**
 * GET /api/devices/:mac/history
 * Fetch historical time-series data for a specific field.
 */
export async function getDeviceHistory(
  mac: string,
  field: string,
  start?: string,
  stop?: string
): Promise<HistoryResponse> {
  let endpoint = `/devices/${mac}/history?field=${field}`;

  if (start) endpoint += `&start=${start}`;
  if (stop) endpoint += `&stop=${stop}`;

  return fetchJson<HistoryResponse>(endpoint);
}

/**
 * GET /api/health
 * Check if the backend server is reachable.
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}