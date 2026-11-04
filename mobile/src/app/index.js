import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../auth';
import { Boot } from '../components/ui';
import { loadWelcomeSeen } from '../session';

export default function Index() {
  const { ready, token } = useAuth();
  const [seen, setSeen] = useState(null);

  useEffect(() => {
    loadWelcomeSeen().then(setSeen).catch(() => setSeen(true));
  }, []);

  if (!ready || seen === null) return <Boot />;
  if (token) return <Redirect href="/(app)/(tabs)/messages" />;
  if (!seen) return <Redirect href="/welcome" />;
  return <Redirect href="/login" />;
}
