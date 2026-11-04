import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../api';
import { ErrorText, ListRow, Notice, ProjectIcon } from '../components/ui';
import { apiError } from '../format';
import { useLive } from '../live';
import { ConnectLoader, onSynced, useOffline } from '../offline';
import { colors } from '../theme';

export default function ProjectGroupScreen() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const { online } = useOffline();

  const load = useCallback(async () => {
    setError('');
    try {
      const response = await api.get('/hbms/conversations');
      setProjects(response.data.data?.projects || []);
    } catch (err) {
      setError(apiError(err, 'Could not load your projects'));
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
  }, [load]));

  useEffect(() => onSynced(() => load()), [load]);

  useLive(useCallback((event) => {
    if (event.type === 'conversations') load();
  }, [load]));

  async function open(project) {
    if (busyId) return;
    if (project.conversationId && !project.joined) {
      setError('This group already exists. Ask the admin to update the members.');
      return;
    }
    if (project.conversationId && project.joined) {
      router.replace(`/thread/${project.conversationId}`);
      return;
    }
    setBusyId(project.id);
    setError('');
    try {
      const response = await api.post('/hbms/conversations', { projectId: project.id });
      router.replace(`/thread/${response.data.data.id}`);
    } catch (err) {
      setError(apiError(err, 'Could not create the project group'));
      setBusyId(null);
    }
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Choose a project. Everyone working on it is added to the group.</Text>
      <ErrorText>{error}</ErrorText>
      {projects.map((project) => (
        <ListRow
          key={project.id}
          title={project.name}
          meta={project.conversationId
            ? (project.joined ? 'Open the existing group' : 'Waiting for the admin to add you')
            : `${project.code || 'Project'} · ${project.memberCount === 1 ? '1 person' : `${project.memberCount} people`}`}
          mark={<ProjectIcon name={project.name} />}
          onPress={() => open(project)}
        />
      ))}
      {!error && projects.length === 0 ? (online ? <Notice>You are not on a project team yet.</Notice> : <ConnectLoader />) : null}
      {busyId ? <Text style={styles.opening}>Creating the group…</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  opening: { color: colors.muted, marginTop: 8 },
});
