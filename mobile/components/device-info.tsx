import { View, Text, StyleSheet } from 'react-native';
import { Device } from '../types/device';
import { formatTimestamp } from '../services/format';

interface DeviceInfoProps {
  device: Device;
}

export default function DeviceInfo({ device }: DeviceInfoProps) {
  const hasFault = device.readings.fault_status !== undefined
    && device.readings.fault_status !== 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.deviceType}>{device.type}</Text>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, hasFault ? styles.fault : styles.ok]} />
          <Text style={[styles.statusText, hasFault ? styles.faultText : styles.okText]}>
            {hasFault ? 'Fault' : 'Online'}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoGrid}>
        <InfoRow label="Category" value={device.category === 'gateway' ? 'Gateway' : 'Sensor'} />
        <InfoRow label="MAC" value={device.mac} />
        <InfoRow label="Gateway" value={device.gatewayId} />
        <InfoRow label="Group" value={device.groupId} />
        <InfoRow label="Last Seen" value={formatTimestamp(device.lastSeen)} />
      </View>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  deviceType: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  ok: {
    backgroundColor: '#4ade80',
  },
  fault: {
    backgroundColor: '#f72585',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  okText: {
    color: '#4ade80',
  },
  faultText: {
    color: '#f72585',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a4a',
    marginBottom: 12,
  },
  infoGrid: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500',
  },
});