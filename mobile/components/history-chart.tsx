import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getDeviceHistory, getDeviceFields } from '../services/api';
import { formatFieldName } from '../services/format';
import { DataPoint } from '../types/device';

interface HistoryChartProps {
  mac: string;
}

export default function HistoryChart({ mac }: HistoryChartProps) {
  const [fields, setFields] = useState<string[]>([]);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [data, setData] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenWidth = Dimensions.get('window').width;

  // Load available fields when component mounts
  useEffect(() => {
    loadFields();
  }, []);

  // Load chart data when selected field changes
  useEffect(() => {
    if (selectedField) {
      loadHistory(selectedField);
    }
  }, [selectedField]);

  async function loadFields() {
    try {
      const response = await getDeviceFields(mac);
      setFields(response.fields);

      // Auto-select the first temperature field, or just the first field
      const defaultField = response.fields.find(f => f.startsWith('temperature'))
        || response.fields[0];

      if (defaultField) {
        setSelectedField(defaultField);
      }
    } catch (err: any) {
      setError('Failed to load available metrics');
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory(field: string) {
    try {
      setChartLoading(true);
      setError(null);
      const response = await getDeviceHistory(mac, field);
      setData(response.data);
    } catch (err: any) {
      setError('Failed to load chart data');
    } finally {
      setChartLoading(false);
    }
  }

  function handleFieldSelect(field: string) {
    setSelectedField(field);
    setShowDropdown(false);
  }

  // Format timestamps for chart labels
  function getChartLabels(): string[] {
    if (data.length === 0) return [];

    // Show ~5 labels evenly spaced
    const labelCount = 5;
    const step = Math.max(1, Math.floor(data.length / labelCount));

    return data.map((point, index) => {
      if (index % step === 0 || index === data.length - 1) {
        const date = new Date(point.time);
        return `${(date.getMonth() + 1)}/${date.getDate()}`;
      }
      return '';
    });
  }

  // Loading state
  if (loading) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>HISTORY</Text>
        <ActivityIndicator color="#4cc9f0" style={styles.loader} />
      </View>
    );
  }

  // No fields available
  if (fields.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.title}>HISTORY</Text>
        <Text style={styles.noData}>No chartable metrics available</Text>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>HISTORY</Text>
      <View style={styles.divider} />

      {/* Metric Selector */}
      <View style={styles.selectorContainer}>
        <Text style={styles.selectorLabel}>Metric:</Text>
        <TouchableOpacity
          style={styles.selectorButton}
          onPress={() => setShowDropdown(!showDropdown)}
        >
          <Text style={styles.selectorText}>
            {selectedField ? formatFieldName(selectedField) : 'Select...'}
          </Text>
          <Text style={styles.selectorArrow}>{showDropdown ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Dropdown */}
      {showDropdown && (
        <View style={styles.dropdown}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
            {fields.map((field) => (
              <TouchableOpacity
                key={field}
                style={[
                  styles.dropdownItem,
                  field === selectedField && styles.dropdownItemSelected,
                ]}
                onPress={() => handleFieldSelect(field)}
              >
                <Text style={[
                  styles.dropdownText,
                  field === selectedField && styles.dropdownTextSelected,
                ]}>
                  {formatFieldName(field)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Chart */}
      {chartLoading ? (
        <ActivityIndicator color="#4cc9f0" style={styles.loader} />
      ) : data.length > 0 ? (
        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: getChartLabels(),
              datasets: [{
                data: data.map(point => typeof point.value === 'number' ? point.value : 0),
              }],
            }}
            width={screenWidth - 64}
            height={220}
            chartConfig={{
              backgroundColor: '#1a1a2e',
              backgroundGradientFrom: '#1a1a2e',
              backgroundGradientTo: '#1a1a2e',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(76, 201, 240, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
              style: {
                borderRadius: 8,
              },
              propsForDots: {
                r: '3',
                strokeWidth: '1',
                stroke: '#4cc9f0',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#2a2a4a',
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      ) : (
        <Text style={styles.noData}>No data available for this metric</Text>
      )}

      {/* Data point count */}
      {data.length > 0 && (
        <Text style={styles.dataCount}>{data.length} data points</Text>
      )}
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
  loader: {
    marginVertical: 40,
  },

  // Metric Selector
  selectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectorLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  selectorButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#2a2a4a',
  },
  selectorText: {
    fontSize: 14,
    color: '#ffffff',
  },
  selectorArrow: {
    fontSize: 12,
    color: '#4cc9f0',
  },

  // Dropdown
  dropdown: {
    backgroundColor: '#0f0f23',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a4a',
    marginBottom: 12,
    maxHeight: 200,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  dropdownItemSelected: {
    backgroundColor: '#1a1a2e',
  },
  dropdownText: {
    fontSize: 14,
    color: '#9ca3af',
  },
  dropdownTextSelected: {
    color: '#4cc9f0',
    fontWeight: '600',
  },

  // Chart
  chartContainer: {
    alignItems: 'center',
    marginTop: 8,
  },
  chart: {
    borderRadius: 8,
  },
  noData: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginVertical: 40,
  },
  dataCount: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
});