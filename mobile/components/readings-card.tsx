import { View, Text, StyleSheet } from 'react-native';
import { formatFieldName, formatFieldValue } from '../services/format';

interface ReadingsCardProps {
  readings: Record<string, number | string>;
}

export default function ReadingsCard({ readings }: ReadingsCardProps) {
  // Sort readings: important ones first, then alphabetical
  const sortedEntries = Object.entries(readings).sort((a, b) => {
    const priority = [
      'temperature_chip', 'temperature_ntc', 'temperature_rtd',
      'humidity', 'voltage', 'fault_status',
    ];
    const aIndex = priority.indexOf(a[0]);
    const bIndex = priority.indexOf(b[0]);

    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  return (
    <View style={styles.card}>
      <Text style={styles.title}>CURRENT READINGS</Text>
      <View style={styles.divider} />
      {sortedEntries.map(([field, value]) => (
        <View key={field} style={styles.readingRow}>
          <Text style={styles.fieldName} numberOfLines={1}>
            {formatFieldName(field)}
          </Text>
          <Text style={styles.fieldValue}>
            {formatFieldValue(field, value)}
          </Text>
        </View>
      ))}
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
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4cc9f0',
    letterSpacing: 2,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a4a',
    marginBottom: 12,
  },
  readingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f3a',
  },
  fieldName: {
    fontSize: 14,
    color: '#9ca3af',
    flex: 1,
    marginRight: 12,
  },
  fieldValue: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600',
  },
});