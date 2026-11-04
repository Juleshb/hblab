import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../auth';
import { Boot } from '../../components/ui';
import { colors } from '../../theme';

export default function AppLayout() {
  const { ready, token } = useAuth();
  if (!ready) return <Boot />;
  if (!token) return <Redirect href="/login" />;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '600' },
        headerBackButtonDisplayMode: 'minimal',
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false, title: 'Back' }} />
      <Stack.Screen name="task/[id]" options={{ title: 'Task' }} />
      <Stack.Screen name="thread/[id]" options={{ title: 'Message' }} />
      <Stack.Screen name="meeting/[id]" options={{ title: 'Meeting' }} />
      <Stack.Screen name="announcement/[id]" options={{ title: 'Announcement' }} />
      <Stack.Screen name="updates/[id]" options={{ title: 'Updates' }} />
      <Stack.Screen name="people" options={{ title: 'New message' }} />
      <Stack.Screen name="project-group" options={{ title: 'Project group' }} />
      <Stack.Screen name="group/[id]" options={{ title: 'Manage group' }} />
      <Stack.Screen name="person/[id]" options={{ title: 'Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      <Stack.Screen name="calls" options={{ title: 'Calls' }} />
    </Stack>
  );
}
