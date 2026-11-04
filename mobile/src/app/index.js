import { Redirect } from 'expo-router';
import { useAuth } from '../auth';
import { Boot } from '../components/ui';

export default function Index() {
  const { ready, token } = useAuth();
  if (!ready) return <Boot />;
  if (token) return <Redirect href="/(app)/(tabs)/messages" />;
  return <Redirect href="/login" />;
}
