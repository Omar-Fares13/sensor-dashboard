import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Device } from '../types/device';
import { getDevices } from '../services/api';
import { formatFieldValue, formatTimestamp } from '../services/format';

/**
 * Home screen — displays a list of all devices (gateways + sensors).
 * Tapping a device navigates to the detail screen.
 */
export default function DeviceListScreen() {
  const router = useRouter();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch devices when screen loads
  useEffect(() => {
    loadDevices();
  }, []);

  async function loadDevices() {
    try {
      setError(null);
      const response = await getDevices();
      setDevices(response.devices);
    } catch (err: any) {
      setError(err.message || 'Failed to load devices');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Pull-to-refresh handler
  function handleRefresh() {
    setRefreshing(true);
    loadDevices();
  }

  // Navigate to device detail
  function handleDevicePress(device: Device) {
    router.push(`/device/${device.mac}`);
  }

  // Get the primary reading to show on the card (temperature preferred)
  function getPrimaryReading(device: Device): string {
    const readings = device.readings;

    if (readings.temperature_chip !== undefined) {
      return formatFieldValue('temperature_chip', readings.temperature_chip);
    }
    if (readings.temperature_ntc !== undefined) {
      return formatFieldValue('temperature_ntc', readings.temperature_ntc);
    }

    // Fallback: show the first numeric reading
    for (const [key, value] of Object.entries(readings)) {
      if (typeof value === 'number' && key !== 'fault_status' && key !== 'signal_quality') {
        return formatFieldValue(key, value);
      }
    }

    return 'No data';
  }

  // Render a section header (GATEWAYS / SENSORS)
  function renderSectionHeader(category: string) {
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>
          {category === 'gateway' ? 'GATEWAYS' : 'SENSORS'}
        </Text>
      </View>
    );
  }

  // Render a single device card
  function renderDevice({ item, index }: { item: Device; index: number }) {
    const hasFault = item.readings.fault_status !== undefined && item.readings.fault_status !== 0;

    // Show section header when category changes
    const prevDevice = index > 0 ? devices[index - 1] : null;
    const showHeader = !prevDevice || prevDevice.category !== item.category;

    return (
      <View>
        {showHeader && renderSectionHeader(item.category)}
        <TouchableOpacity
          style={[styles.card, hasFault && styles.cardFault]}
          onPress={() => handleDevicePress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.deviceType}>{item.type}</Text>
              <View style={[styles.statusDot, hasFault ? styles.statusFault : styles.statusOk]} />
            </View>
            <Text style={styles.primaryReading}>{getPrimaryReading(item)}</Text>
          </View>

          <View style={styles.cardFooter}>
            <Text style={styles.metaText}>GW: {item.gatewayId}</Text>
            <Text style={styles.metaText}>MAC: {item.mac.substring(0, 11)}...</Text>
            <Text style={styles.metaText}>{formatTimestamp(item.lastSeen)}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

    // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Sensor Dashboard' }} />
        <ActivityIndicator size="large" color="#4cc9f0" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Sensor Dashboard' }} />
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDevices}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }


  // Main list
  return (
    <View style={styles.container}>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.mac}
        renderItem={renderDevice}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#4cc9f0"
          />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ============================================================
// Styles
// ============================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Section Headers
  sectionHeader: {
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4cc9f0',
    letterSpacing: 2,
  },

  // Device Cards
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4cc9f0',
  },
  cardFault: {
    borderLeftColor: '#f72585',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceType: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  primaryReading: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4cc9f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusOk: {
    backgroundColor: '#4ade80',
  },
  statusFault: {
    backgroundColor: '#f72585',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },

  // Loading state
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },

  // Error state
  errorText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f72585',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4cc9f0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#0f0f23',
    fontWeight: '700',
    fontSize: 16,
  },
});