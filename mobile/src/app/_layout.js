import { Stack } from 'expo-router';
import { Alerts } from '../alerts';
import { AuthProvider } from '../auth';
import { colors } from '../theme';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Alerts />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerShadowVisible: false,
          headerTintColor: colors.text,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
