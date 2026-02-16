import { Stack } from 'expo-router';

/**
 * Root layout — defines the navigation structure.
 * We only configure screen OPTIONS here.
 * Expo Router auto-discovers the actual screens from the file structure.
 */
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1a1a2e',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
}