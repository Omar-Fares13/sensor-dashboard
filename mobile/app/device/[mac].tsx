import { View, Text, StyleSheet } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';

/**
 * Device Detail screen — placeholder.
 * We'll build this out fully in the next step.
 */
export default function DeviceDetailScreen() {
  const { mac } = useLocalSearchParams<{ mac: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Device Details' }} />
      <Text style={styles.text}>Device Detail</Text>
      <Text style={styles.mac}>{mac}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23',
  },
  text: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '700',
  },
  mac: {
    color: '#4cc9f0',
    fontSize: 16,
    marginTop: 8,
  },
});