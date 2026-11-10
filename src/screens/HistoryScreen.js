import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import guides from '../data/guides.json';
import { getAllSessions } from '../database/storage';
import { colors, radius, spacing, typography, shadows } from '../styles/theme';

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

function summarizeSessions(rows) {
  const sessions = Array.isArray(rows) ? rows : [];
  const solved = sessions.filter((session) => session?.status === 'solved').length;
  const notSolved = sessions.filter((session) => session?.status === 'not_solved').length;
  const inProgress = sessions.filter((session) => session?.status === 'in_progress').length;
  const completedOutcomes = solved + notSolved;

  return {
    total: sessions.length,
    solved,
    notSolved,
    inProgress,
    resolutionRate: completedOutcomes === 0 ? null : Math.round((solved / completedOutcomes) * 100),
  };
}

export default function HistoryScreen({ navigation }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const insights = summarizeSessions(sessions);

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
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.introIcon}><Text style={styles.introIconText}>↻</Text></View>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>YOUR RECENT ACTIVITY</Text>
            <Text style={styles.subtitle}>Revisit a past fix or pick up where you left off.</Text>
          </View>
        </View>

        {!loading && !errorMessage ? (
          <View style={styles.insightsCard}>
            <View style={styles.insightsHeader}>
              <View style={styles.insightsTitleGroup}>
                <Text style={styles.insightsTitle}>Troubleshooting Insights</Text>
                <Text style={styles.insightsSubtitle}>A snapshot of your session outcomes</Text>
              </View>
              <View style={styles.rateBadge}>
                <Text style={styles.rateValue}>{insights.resolutionRate === null ? 'N/A' : `${insights.resolutionRate}%`}</Text>
                <Text style={styles.rateLabel}>RESOLUTION</Text>
              </View>
            </View>

            <View style={styles.metricGrid}>
              <Metric label="Total Sessions" value={insights.total} tone="neutral" />
              <Metric label="Solved" value={insights.solved} tone="success" />
              <Metric label="Not Solved" value={insights.notSolved} tone="warning" />
              <Metric label="In Progress" value={insights.inProgress} tone="info" />
            </View>

            {insights.resolutionRate !== null ? (
              <View style={styles.rateTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: insights.resolutionRate }}>
                <View style={[styles.rateFill, { width: `${insights.resolutionRate}%` }]} />
              </View>
            ) : null}
            <Text style={styles.rateExplanation}>Based on sessions with a recorded solved or not solved outcome. In-progress sessions are excluded.</Text>
          </View>
        ) : null}

        {!loading ? (
          <View style={styles.summaryRow}>
            <Text style={styles.sectionTitle}>Sessions</Text>
            <View style={styles.countBadge}><Text style={styles.countText}>{sessions.length} {sessions.length === 1 ? 'record' : 'records'}</Text></View>
          </View>
        ) : null}

        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
        {loading ? (
          <View style={styles.loadingCard}><Text style={styles.loadingTitle}>Loading your history</Text><Text style={styles.body}>Your troubleshooting sessions will appear here.</Text></View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>◷</Text></View>
            <Text style={styles.emptyTitle}>Your history starts with a fix</Text>
            <Text style={styles.body}>Previous troubleshooting sessions will appear here, ready to revisit whenever you need them.</Text>
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Library', { categoryId: null })} style={({ pressed }) => [styles.browseButton, pressed && styles.pressed]}>
              <Text style={styles.browseButtonText}>Browse guides</Text><Text style={styles.browseArrow}>›</Text>
            </Pressable>
          </View>
        ) : (
          sessions.map((session) => {
            const guide = guides.find((item) => item.id === session.guideId);
            const stepTotal = guide?.steps.length || 0;
            const statusLabel = getStatusLabel(session.status);
            const isInProgress = session.status === 'in_progress';
            const isSolved = session.status === 'solved';
            const progress = stepTotal > 0 ? Math.min(session.completedStepCount / stepTotal, 1) : 0;
            return (
              <View key={session.sessionId} style={styles.sessionCard}>
                <View style={styles.cardTop}>
                  <View style={styles.statusRow}>
                    <View style={[styles.statusDot, isInProgress ? styles.inProgressDot : isSolved ? styles.solvedDot : styles.unresolvedDot]} />
                    <View style={[styles.statusBadge, isInProgress ? styles.inProgressBadge : isSolved ? styles.solvedBadge : styles.unresolvedBadge]}>
                      <Text style={[styles.statusText, isInProgress ? styles.inProgressText : isSolved ? styles.solvedText : styles.unresolvedText]}>{statusLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.date}>{formatDate(session.updatedAt)}</Text>
                </View>

                <Text style={styles.guideTitle}>{guide ? guide.title : 'Guide unavailable'}</Text>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Steps completed</Text>
                  <Text style={styles.progressValue}>{session.completedStepCount}{stepTotal ? ` of ${stepTotal}` : ''}</Text>
                </View>
                {stepTotal > 0 ? <View style={styles.progressTrack}><View style={[styles.progressFill, isSolved && styles.solvedFill, { width: `${progress * 100}%` }]} /></View> : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${isInProgress ? 'Resume' : 'Review'} ${guide ? guide.title : 'troubleshooting guide'}`}
                  accessibilityState={{ disabled: !guide }}
                  disabled={!guide}
                  onPress={() => navigation.navigate('GuideDetails', {
                    guideId: session.guideId,
                    ...(session.status === 'in_progress' ? { sessionId: session.sessionId } : {}),
                  })}
                  style={({ pressed }) => [styles.actionButton, !guide && styles.disabledButton, pressed && guide && styles.pressed]}
                >
                  <Text style={styles.actionButtonText}>{isInProgress ? 'Resume session' : 'Review guide'}</Text>
                  <Text style={styles.actionArrow}>›</Text>
                </Pressable>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value, tone }) {
  return (
    <View style={styles.metricCell}>
      <Text style={[styles.metricValue, styles[`metricValue${tone}`]]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  intro: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  introIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  introIconText: { color: colors.primary, fontSize: 28 },
  introCopy: { flex: 1 },
  eyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '800' },
  countBadge: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  countText: { color: colors.textSecondary, fontSize: typography.overline, fontWeight: '700' },
  insightsCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg, ...shadows.sm },
  insightsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  insightsTitleGroup: { flex: 1, paddingRight: spacing.sm },
  insightsTitle: { color: colors.navy, fontSize: typography.body, lineHeight: 21, fontWeight: '800' },
  insightsSubtitle: { color: colors.textMuted, fontSize: typography.overline, lineHeight: 16, marginTop: 3 },
  rateBadge: { minWidth: 70, alignItems: 'center', backgroundColor: colors.blueLight, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  rateValue: { color: colors.primary, fontSize: typography.heading, lineHeight: 24, fontWeight: '800' },
  rateLabel: { color: colors.info, fontSize: 8, fontWeight: '700', letterSpacing: 0.5, marginTop: 1 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  metricCell: { width: '48.5%', minHeight: 58, justifyContent: 'center', backgroundColor: colors.background, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  metricValue: { color: colors.navy, fontSize: typography.heading, lineHeight: 24, fontWeight: '800' },
  metricValueneutral: { color: colors.navy },
  metricValuesuccess: { color: '#047857' },
  metricValuewarning: { color: colors.warning },
  metricValueinfo: { color: colors.info },
  metricLabel: { color: colors.textMuted, fontSize: typography.overline, lineHeight: 15, fontWeight: '600', marginTop: 2 },
  rateTrack: { height: 7, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing.md },
  rateFill: { height: '100%', backgroundColor: colors.success, borderRadius: radius.pill },
  rateExplanation: { color: colors.textMuted, fontSize: typography.overline, lineHeight: 16, marginTop: spacing.sm },
  sessionCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  inProgressDot: { backgroundColor: colors.primary },
  solvedDot: { backgroundColor: colors.success },
  unresolvedDot: { backgroundColor: colors.warning },
  statusBadge: { borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  inProgressBadge: { backgroundColor: colors.infoLight },
  solvedBadge: { backgroundColor: colors.successLight },
  unresolvedBadge: { backgroundColor: colors.warningLight },
  statusText: { fontSize: typography.overline, fontWeight: '700' },
  inProgressText: { color: colors.info },
  solvedText: { color: '#047857' },
  unresolvedText: { color: colors.warning },
  date: { color: colors.textMuted, fontSize: typography.overline },
  guideTitle: { color: colors.navy, fontSize: typography.body, lineHeight: 23, fontWeight: '800', marginBottom: spacing.md },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressLabel: { color: colors.textMuted, fontSize: typography.caption },
  progressValue: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '700' },
  progressTrack: { height: 7, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden', marginBottom: spacing.md },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  solvedFill: { backgroundColor: colors.success },
  actionButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.md },
  actionButtonText: { color: colors.white, fontSize: typography.caption, fontWeight: '700' },
  actionArrow: { color: colors.white, fontSize: 22, marginLeft: spacing.sm },
  disabledButton: { opacity: 0.5 },
  loadingCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.xl, ...shadows.sm },
  loadingTitle: { color: colors.navy, fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm },
  emptyIcon: { width: 64, height: 64, borderRadius: radius.lg, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  emptyIconText: { color: colors.primary, fontSize: 34 },
  emptyTitle: { color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23, textAlign: 'center' },
  browseButton: { minHeight: 48, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.lg },
  browseButtonText: { color: colors.white, fontSize: typography.caption, fontWeight: '700' },
  browseArrow: { color: colors.white, fontSize: 22, marginLeft: spacing.sm },
  error: { color: colors.danger, backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: spacing.md, fontSize: typography.caption, lineHeight: 19, marginBottom: spacing.md },
  pressed: { opacity: 0.78 },
});
