import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import guides from '../data/guides.json';
import { getAllSessions } from '../database/storage';
import { colors, radius, spacing, typography } from '../styles/theme';

function getStatusLabel(status) {
  if (status === 'solved') return 'Solved';
  if (status === 'not_solved') return 'Not solved';
  return 'In progress';
}

function formatDate(dateText) {
  if (!dateText) return 'Date unavailable';
  const date = new Date(`${dateText.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return dateText;
  return date.toLocaleString();
}

export default function HistoryScreen({ navigation }) {
  const db = useSQLiteContext();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useFocusEffect(useCallback(() => {
    let isActive = true;

    async function loadHistory() {
      setLoading(true);
      setErrorMessage('');
      try {
        const rows = await getAllSessions(db);
        if (isActive) setSessions(rows);
      } catch (error) {
        if (isActive) setErrorMessage(error.message || 'Could not load troubleshooting history.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadHistory();
    return () => { isActive = false; };
  }, [db]));

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
        {loading ? (
          <Text style={styles.body}>Loading troubleshooting history…</Text>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.title}>No sessions yet</Text>
            <Text style={styles.body}>Start troubleshooting a guide and your sessions will appear here.</Text>
          </View>
        ) : (
          sessions.map((session) => {
            const guide = guides.find((item) => item.id === session.guideId);
            const stepTotal = guide?.steps.length || 0;
            const statusLabel = getStatusLabel(session.status);
            return (
              <View key={session.sessionId} style={styles.sessionCard}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{guide ? guide.title : 'Guide unavailable'}</Text>
                  <View style={[styles.statusBadge, session.status === 'solved' && styles.solvedBadge, session.status === 'not_solved' && styles.unresolvedBadge]}>
                    <Text style={styles.statusText}>{statusLabel}</Text>
                  </View>
                </View>
                <Text style={styles.meta}>Last updated {formatDate(session.updatedAt)}</Text>
                <Text style={styles.meta}>Steps completed: {session.completedStepCount}{stepTotal ? ` of ${stepTotal}` : ''}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={!guide}
                  onPress={() => navigation.navigate('GuideDetails', {
                    guideId: session.guideId,
                    ...(session.status === 'in_progress' ? { sessionId: session.sessionId } : {}),
                  })}
                  style={[styles.actionButton, !guide && styles.disabledButton]}
                >
                  <Text style={styles.actionButtonText}>
                    {session.status === 'in_progress' ? 'Resume session' : 'Review guide'}
                  </Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  emptyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  sessionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  title: { flex: 1, color: colors.navy, fontSize: typography.body, lineHeight: 22, fontWeight: '700', marginRight: spacing.sm },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  meta: { color: colors.textMuted, fontSize: typography.caption, marginTop: spacing.sm },
  statusBadge: { backgroundColor: colors.blueLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  solvedBadge: { backgroundColor: '#EAF7F1' },
  unresolvedBadge: { backgroundColor: '#FFF7E8' },
  statusText: { color: colors.navy, fontSize: 11, fontWeight: '700' },
  actionButton: { alignSelf: 'flex-start', backgroundColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  actionButtonText: { color: colors.surface, fontSize: typography.caption, fontWeight: '700' },
  disabledButton: { opacity: 0.5 },
  error: { color: '#A12929', fontSize: typography.caption, marginBottom: spacing.md },
});
