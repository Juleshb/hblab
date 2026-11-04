import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../api';
import { ErrorText, Notice } from '../components/ui';
import { apiError, formatWhen } from '../format';
import { colors, type } from '../theme';

export default function AnnouncementScreen() {
  const params = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/hbms/announcements')
      .then((response) => {
        if (!active) return;
        const found = (response.data.data || []).find((row) => row.id === params.id);
        setItem(found || null);
      })
      .catch((err) => {
        if (active) setError(apiError(err, 'Could not load this announcement'));
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const title = item?.title || params.title || 'Announcement';
  const body = item?.body || params.body || '';
  const kicker = [item?.businessUnit?.name || 'HBMS', item ? formatWhen(item.createdAt) : ''].filter(Boolean).join(' · ');

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: 'Announcement' }} />
      <Text style={type.kicker}>{kicker}</Text>
      <Text style={type.title}>{title}</Text>
      <ErrorText>{error}</ErrorText>
      {body ? <Text style={styles.body}>{body}</Text> : <Notice>This announcement has no extra text.</Notice>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  body: { marginTop: 12, fontSize: 16, lineHeight: 23, color: colors.text },
});
