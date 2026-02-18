import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Device } from '../../types/device';
import { getDevice } from '../../services/api';
import DeviceInfo from '../../components/device-info';
import ReadingsCard from '../../components/readings-card';
import HistoryChart from '../../components/history-chart';

/**
 * Device Detail screen.
 * Shows device info, current readings, and historical chart.
 */
export default function DeviceDetailScreen() {
  const { mac } = useLocalSearchParams<{ mac: string }>();
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mac) {
      loadDevice();
    }
  }, [mac]);

  async function loadDevice() {
    try {
      setError(null);
      setLoading(true);
      const response = await getDevice(mac as string);
      setDevice(response.device);
    } catch (err: any) {
      setError(err.message || 'Failed to load device');
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Loading...' }} />
        <ActivityIndicator size="large" color="#4cc9f0" />
        <Text style={styles.loadingText}>Loading device data...</Text>
      </View>
    );
  }

  // Error state
  if (error || !device) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Error' }} />
        <Text style={styles.errorText}>Error</Text>
        <Text style={styles.errorMessage}>{error || 'Device not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadDevice}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: device.type }} />

      <DeviceInfo device={device} />
      <ReadingsCard readings={device.readings} />
      <HistoryChart mac={mac as string} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
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