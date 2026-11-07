import { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import {
  addFavourite,
  createSession,
  getCompletedSteps,
  getSessionById,
  isFavourite,
  removeFavourite,
  saveStepCompletion,
  updateSessionCurrentStep,
  updateSessionStatus,
} from '../database/storage';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function GuideDetailsScreen({ route }) {
  const insets = useSafeAreaInsets();
  const guideId = route.params?.guideId;
  const resumedSessionId = route.params?.sessionId || null;
  const guide = guides.find((item) => item.id === guideId);
  const category = guide && categories.find((item) => item.id === guide.categoryId);
  const db = useSQLiteContext();

  const [guidedModeVisible, setGuidedModeVisible] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedStepIds, setCompletedStepIds] = useState([]);
  const [sessionOutcome, setSessionOutcome] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(resumedSessionId));
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [isStepSaving, setIsStepSaving] = useState(false);
  const [isStepMoving, setIsStepMoving] = useState(false);
  const [isOutcomeSaving, setIsOutcomeSaving] = useState(false);
  const [isFavouriteSaved, setIsFavouriteSaved] = useState(false);
  const [isFavouriteBusy, setIsFavouriteBusy] = useState(false);
  const [databaseError, setDatabaseError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadGuideState() {
      setGuidedModeVisible(false);
      setCurrentStepIndex(0);
      setCompletedStepIds([]);
      setSessionOutcome(null);
      setSessionId(null);
      setIsStartingSession(false);
      setIsStepSaving(false);
      setIsStepMoving(false);
      setIsOutcomeSaving(false);
      setIsFavouriteSaved(false);
      setDatabaseError('');
      setSessionLoading(Boolean(resumedSessionId));

      if (!guide) {
        setSessionLoading(false);
        return;
      }

      try {
        const saved = await isFavourite(db, guide.id);
        if (isActive) setIsFavouriteSaved(saved);

        if (resumedSessionId) {
          const session = await getSessionById(db, resumedSessionId);
          if (!session || session.guideId !== guide.id) {
            throw new Error('This troubleshooting session could not be found.');
          }
          const completedSteps = await getCompletedSteps(db, resumedSessionId);
          if (isActive) {
            setSessionId(session.sessionId);
            setCompletedStepIds(completedSteps.map((step) => step.stepId));
            setCurrentStepIndex(Math.min(Math.max(session.currentStepNumber - 1, 0), Math.max(guide.steps.length - 1, 0)));
            setSessionOutcome(session.status === 'in_progress' ? null : session.status);
            setGuidedModeVisible(session.status === 'in_progress');
          }
        }
      } catch (error) {
        if (isActive) setDatabaseError(error.message || 'Could not load saved progress.');
      } finally {
        if (isActive) setSessionLoading(false);
      }
    }

    loadGuideState();
    return () => { isActive = false; };
  }, [db, guideId, resumedSessionId]);

  if (!guide) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.title}>Guide unavailable</Text>
            <Text style={styles.body}>This guide could not be found. Return to the Library and choose a guide.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const steps = guide.steps || [];
  const currentStep = steps[currentStepIndex];
  const completedCount = completedStepIds.length;
  const progressPercent = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;
  const difficultyLabel = guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1);

  async function startTroubleshooting() {
    setDatabaseError('');
    setIsStartingSession(true);
    try {
      if (sessionId && sessionOutcome === null) {
        setGuidedModeVisible(true);
        return;
      }

      const session = await createSession(db, guide.id);
      setSessionId(session.sessionId);
      setCurrentStepIndex(0);
      setCompletedStepIds([]);
      setSessionOutcome(null);
      setGuidedModeVisible(true);
    } catch (error) {
      setDatabaseError(error.message || 'Could not start troubleshooting.');
    } finally {
      setIsStartingSession(false);
    }
  }

  async function toggleCurrentStepCompleted() {
    if (!currentStep || !sessionId) return;
    const isCurrentlyCompleted = completedStepIds.includes(currentStep.id);
    setDatabaseError('');
    setIsStepSaving(true);
    try {
      await saveStepCompletion(db, sessionId, currentStep.id, currentStep.order, !isCurrentlyCompleted);
      setCompletedStepIds((previousIds) => (
        isCurrentlyCompleted
          ? previousIds.filter((stepId) => stepId !== currentStep.id)
          : [...previousIds, currentStep.id]
      ));
    } catch (error) {
      setDatabaseError(error.message || 'Could not save this step.');
    } finally {
      setIsStepSaving(false);
    }
  }

  async function moveToStep(nextIndex) {
    if (nextIndex < 0 || nextIndex >= steps.length || nextIndex === currentStepIndex) return;
    setDatabaseError('');
    setIsStepMoving(true);
    try {
      if (sessionId) await updateSessionCurrentStep(db, sessionId, nextIndex + 1);
      setCurrentStepIndex(nextIndex);
    } catch (error) {
      setDatabaseError(error.message || 'Could not update session progress.');
    } finally {
      setIsStepMoving(false);
    }
  }

  function goToPreviousStep() {
    moveToStep(currentStepIndex - 1);
  }

  function goToNextStep() {
    moveToStep(currentStepIndex + 1);
  }

  async function reportOutcome(outcome) {
    if (!sessionId) return;
    setDatabaseError('');
    setIsOutcomeSaving(true);
    try {
      await updateSessionStatus(db, sessionId, outcome);
      setSessionOutcome(outcome);
    } catch (error) {
      setDatabaseError(error.message || 'Could not save the session outcome.');
    } finally {
      setIsOutcomeSaving(false);
    }
  }

  async function toggleFavourite() {
    setDatabaseError('');
    setIsFavouriteBusy(true);
    try {
      if (isFavouriteSaved) {
        await removeFavourite(db, guide.id);
        setIsFavouriteSaved(false);
      } else {
        await addFavourite(db, guide.id);
        setIsFavouriteSaved(true);
      }
    } catch (error) {
      setDatabaseError(error.message || 'Could not update saved guides.');
    } finally {
      setIsFavouriteBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, !guidedModeVisible && styles.overviewContent, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]}>
        {databaseError ? <Text accessibilityRole="alert" style={styles.error}>{databaseError}</Text> : null}
        {!guidedModeVisible ? (
          <>
            <View style={styles.overviewHero}>
              <Text style={styles.overviewEyebrow}>{category ? category.name.toUpperCase() : 'TROUBLESHOOTING GUIDE'}</Text>
              <Text style={styles.overviewTitle}>{guide.title}</Text>
              <Text style={styles.overviewDescription}>{guide.description}</Text>
              <View style={styles.overviewMetaRow}>
                <View style={styles.difficultyBadge}><Text style={styles.difficultyBadgeText}>{difficultyLabel}</Text></View>
                <View style={styles.durationBadge}><Text style={styles.durationIcon}>◷</Text><Text style={styles.durationText}>About {guide.estimatedMinutes} min</Text></View>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: isFavouriteBusy, selected: isFavouriteSaved }}
              disabled={isFavouriteBusy}
              onPress={toggleFavourite}
              style={({ pressed }) => [styles.overviewFavourite, isFavouriteSaved && styles.overviewFavouriteSaved, pressed && styles.overviewPressed]}
            >
              <Text style={[styles.overviewFavouriteIcon, isFavouriteSaved && styles.overviewFavouriteIconSaved]}>{isFavouriteSaved ? '♥' : '♡'}</Text>
              <Text style={[styles.favouriteButtonText, isFavouriteSaved && styles.favouriteButtonSavedText]}>
                {isFavouriteBusy ? 'Saving…' : isFavouriteSaved ? 'Saved to your guides' : 'Save this guide'}
              </Text>
            </Pressable>

            <View style={styles.overviewSection}>
              <Text style={styles.overviewSectionTitle}>Possible causes</Text>
              <View style={styles.overviewInfoCard}>
              {guide.possibleCauses.map((cause, index) => (
                <View key={`${guide.id}-cause-${index}`} style={[styles.overviewListRow, index > 0 && styles.overviewListRowBorder]}>
                  <View style={styles.causeMarker}><Text style={styles.causeMarkerText}>{String(index + 1).padStart(2, '0')}</Text></View>
                  <Text style={styles.overviewListText}>{cause}</Text>
                </View>
              ))}
              </View>
            </View>

            {guide.safetyWarning ? (
              <View accessibilityRole="alert" style={styles.overviewWarningCard}>
                <View style={styles.warningIcon}><Text style={styles.warningIconText}>!</Text></View>
                <View style={styles.warningCopy}><Text style={styles.warningTitle}>Safety first</Text>
                <Text style={styles.warningText}>{guide.safetyWarning}</Text></View>
              </View>
            ) : null}

            {guide.requiredTools.length > 0 ? (
              <View style={styles.overviewSection}>
                <Text style={styles.overviewSectionTitle}>You may need</Text>
                <View style={styles.overviewInfoCard}>
                {guide.requiredTools.map((tool, index) => (
                  <View key={`${guide.id}-tool-${index}`} style={[styles.overviewListRow, index > 0 && styles.overviewListRowBorder]}>
                    <View style={styles.toolMarker}><Text style={styles.toolMarkerText}>✓</Text></View>
                    <Text style={styles.overviewListText}>{tool}</Text>
                  </View>
                ))}
                </View>
              </View>
            ) : null}

            <View style={styles.overviewSection}>
              <Text style={styles.overviewSectionTitle}>Troubleshooting steps</Text>
              <View style={styles.overviewInfoCard}>
              {steps.map((step) => (
                <View key={step.id} style={[styles.overviewListRow, step.order > 1 && styles.overviewListRowBorder]}>
                  <View style={styles.overviewStepNumber}>
                    <Text style={styles.overviewStepNumberText}>{step.order}</Text>
                  </View>
                  <Text style={styles.overviewListText}>{step.instruction}</Text>
                </View>
              ))}
              </View>
            </View>

            {sessionOutcome ? (
              <View style={sessionOutcome === 'solved' ? styles.solvedCard : styles.unresolvedCard}>
                <Text style={styles.outcomeTitle}>
                  {sessionOutcome === 'solved' ? 'You reported the issue as solved' : 'You reported the issue is not solved'}
                </Text>
                <Text style={styles.outcomeText}>
                  {sessionOutcome === 'solved'
                    ? 'You can review the guide again if the problem returns.'
                    : 'Consider contacting your IT support person or the device manufacturer for help.'}
                </Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: sessionLoading || isStartingSession }}
              disabled={sessionLoading || isStartingSession}
              onPress={startTroubleshooting}
              style={({ pressed }) => [styles.overviewPrimaryButton, (pressed || sessionLoading || isStartingSession) && styles.buttonPressed]}
            >
              <Text style={styles.overviewPrimaryButtonText}>
                {sessionLoading ? 'Loading session…' : isStartingSession ? 'Starting…' : sessionOutcome ? 'Start a New Session' : completedCount > 0 ? 'Resume Troubleshooting' : 'Start Troubleshooting'}
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.guidedHeader}>
              <View style={styles.guidedHeaderCopy}>
                <Text style={styles.eyebrow}>GUIDED TROUBLESHOOTING</Text>
                <Text style={styles.title}>{guide.title}</Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setGuidedModeVisible(false)}>
                <Text style={styles.backToGuideText}>Guide details</Text>
              </Pressable>
            </View>

            {sessionOutcome ? (
              <View style={sessionOutcome === 'solved' ? styles.guidedSolvedCard : styles.guidedUnresolvedCard}>
                <View style={styles.completionMark}><Text style={styles.completionMarkText}>{sessionOutcome === 'solved' ? '✓' : '!'}</Text></View>
                <Text style={styles.outcomeTitle}>
                  {sessionOutcome === 'solved' ? 'You reported the issue as solved' : 'You reported the issue is not solved'}
                </Text>
                <Text style={styles.outcomeText}>
                  {sessionOutcome === 'solved'
                    ? 'The steps being completed does not determine this result; this is your report. You can review the guide again if the problem returns.'
                    : 'The troubleshooting steps did not resolve the issue for you. Consider contacting your IT support person or the device manufacturer.'}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: isStartingSession }}
                  disabled={isStartingSession}
                  onPress={startTroubleshooting}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>{isStartingSession ? 'Starting…' : 'Start a new session'}</Text>
                </Pressable>
              </View>
            ) : currentStep ? (
              <>
                <View style={styles.progressCard}>
                  <View style={styles.progressLabels}>
                    <View><Text style={styles.progressOverline}>YOUR PROGRESS</Text><Text style={styles.progressStep}>Step {currentStepIndex + 1} of {steps.length}</Text></View>
                    <View style={styles.progressStatus}><View style={styles.progressStatusDot} /><Text style={styles.progressCount}>In progress</Text></View>
                  </View>
                  <View style={styles.progressSummary}><Text style={styles.progressSummaryText}>{completedCount} of {steps.length} steps completed</Text><Text style={styles.progressPercent}>{Math.round(progressPercent)}%</Text></View>
                  <View
                    accessibilityRole="progressbar"
                    accessibilityValue={{ min: 0, max: steps.length, now: completedCount }}
                    style={styles.progressTrack}
                  >
                    <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                  </View>
                </View>

                <View style={styles.currentStepCard}>
                  <View style={styles.stepNumberLarge}>
                    <Text style={styles.stepNumberLargeText}>{currentStep.order}</Text>
                  </View>
                  <Text style={styles.currentStepEyebrow}>STEP {String(currentStepIndex + 1).padStart(2, '0')}</Text>
                  <Text style={styles.currentStepTitle}>Try this step</Text>
                  <Text style={styles.currentStepInstruction}>{currentStep.instruction}</Text>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: completedStepIds.includes(currentStep.id) }}
                    disabled={isStepSaving}
                    onPress={toggleCurrentStepCompleted}
                    style={({ pressed }) => [
                      styles.completeStepButton,
                      completedStepIds.includes(currentStep.id) && styles.completedStepButton,
                      isStepSaving && styles.buttonPressed,
                      pressed && styles.buttonPressed,
                    ]}
                  >
                    <Text style={[
                      styles.completeStepText,
                      completedStepIds.includes(currentStep.id) && styles.completedStepText,
                    ]}>
                      {isStepSaving ? 'Saving…' : completedStepIds.includes(currentStep.id) ? '✓ Step completed' : 'Mark step as completed'}
                    </Text>
                  </Pressable>
                </View>

                <View style={styles.navigationRow}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: currentStepIndex === 0 }}
                    disabled={currentStepIndex === 0 || isStepMoving}
                    onPress={goToPreviousStep}
                    style={({ pressed }) => [styles.stepNavButton, currentStepIndex === 0 && styles.disabledButton, pressed && currentStepIndex > 0 && styles.buttonPressed]}
                  >
                    <Text style={[styles.stepNavText, currentStepIndex === 0 && styles.disabledButtonText]}>Previous</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: currentStepIndex === steps.length - 1 }}
                    disabled={currentStepIndex === steps.length - 1 || isStepMoving}
                    onPress={goToNextStep}
                    style={({ pressed }) => [styles.stepNavButton, styles.nextButton, currentStepIndex === steps.length - 1 && styles.disabledNextButton, pressed && currentStepIndex < steps.length - 1 && styles.buttonPressed]}
                  >
                    <Text style={[styles.nextButtonText, currentStepIndex === steps.length - 1 && styles.disabledButtonText]}>{isStepMoving ? 'Saving…' : 'Next'}</Text>
                  </Pressable>
                </View>

                <View style={styles.outcomePrompt}>
                  <View style={styles.outcomePromptHeader}><View style={styles.outcomePromptIcon}><Text style={styles.outcomePromptIconText}>?</Text></View><Text style={styles.outcomePromptTitle}>
                    {completedCount === steps.length ? 'You marked every step complete. Is the issue solved?' : 'How did it go?'}
                  </Text></View>
                  <Text style={styles.outcomePromptText}>
                    Completing steps does not confirm a repair. Choose the result that matches what happened.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isOutcomeSaving }}
                    disabled={isOutcomeSaving}
                    onPress={() => reportOutcome('solved')}
                    style={({ pressed }) => [styles.solvedButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.outcomeButtonText}>{isOutcomeSaving ? 'Saving…' : 'The issue is solved'}</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ disabled: isOutcomeSaving }}
                    disabled={isOutcomeSaving}
                    onPress={() => reportOutcome('not_solved')}
                    style={({ pressed }) => [styles.unresolvedButton, pressed && styles.buttonPressed]}
                  >
                    <Text style={styles.unresolvedButtonText}>{isOutcomeSaving ? 'Saving…' : 'The issue is not solved'}</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <Text style={styles.title}>No steps available</Text>
                <Text style={styles.body}>This guide does not currently contain troubleshooting steps.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  overviewContent: { paddingTop: spacing.md, paddingBottom: spacing.xxl },
  overviewHero: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, marginBottom: spacing.md, shadowColor: colors.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 8, elevation: 2 },
  overviewEyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.sm },
  overviewTitle: { color: colors.navy, fontSize: typography.title, lineHeight: 34, fontWeight: '800', letterSpacing: -0.4 },
  overviewDescription: { color: colors.textSecondary, fontSize: typography.body, lineHeight: 23, marginTop: spacing.sm },
  overviewMetaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  difficultyBadge: { backgroundColor: colors.blueLight, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  difficultyBadgeText: { color: colors.info, fontSize: typography.caption, fontWeight: '700', textTransform: 'capitalize' },
  durationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  durationIcon: { color: colors.textMuted, fontSize: typography.body, marginRight: spacing.xs },
  durationText: { color: colors.textSecondary, fontSize: typography.caption, fontWeight: '600' },
  overviewFavourite: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg },
  overviewFavouriteSaved: { backgroundColor: colors.blueLight, borderColor: colors.blueLight },
  overviewFavouriteIcon: { color: colors.primary, fontSize: 20, marginRight: spacing.sm },
  overviewFavouriteIconSaved: { color: colors.info },
  overviewPressed: { opacity: 0.78 },
  overviewSection: { marginBottom: spacing.lg },
  overviewSectionTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '700', marginBottom: spacing.sm },
  overviewInfoCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  overviewListRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing.md },
  overviewListRowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  overviewListText: { flex: 1, color: colors.text, fontSize: typography.body, lineHeight: 22, paddingTop: 1 },
  causeMarker: { width: 28, height: 28, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, marginRight: spacing.sm },
  causeMarkerText: { color: colors.primary, fontSize: typography.overline, fontWeight: '700' },
  toolMarker: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.successLight, marginRight: spacing.sm },
  toolMarkerText: { color: colors.success, fontSize: typography.caption, fontWeight: '700' },
  overviewStepNumber: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, marginRight: spacing.sm },
  overviewStepNumberText: { color: colors.primary, fontSize: typography.caption, fontWeight: '700' },
  overviewWarningCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.warningLight, borderColor: '#F3D38A', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg },
  warningIcon: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FDE68A', marginRight: spacing.sm },
  warningIconText: { color: colors.warning, fontSize: typography.body, fontWeight: '800' },
  warningCopy: { flex: 1 },
  overviewPrimaryButton: { minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md, marginTop: spacing.sm, marginBottom: spacing.md, shadowColor: colors.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 3 },
  overviewPrimaryButtonText: { color: colors.white, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  progressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  progressOverline: { color: colors.textMuted, fontSize: typography.overline, fontWeight: '700', letterSpacing: 0.9, marginBottom: 2 },
  progressStep: { color: colors.navy, fontSize: typography.heading, fontWeight: '800' },
  progressStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.infoLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  progressStatusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary, marginRight: 6 },
  progressCount: { color: colors.info, fontSize: typography.overline, fontWeight: '700' },
  progressSummary: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  progressSummaryText: { color: colors.textMuted, fontSize: typography.caption },
  progressPercent: { color: colors.primary, fontSize: typography.caption, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: radius.pill },
  currentStepCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'flex-start', shadowColor: colors.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 9, elevation: 3 },
  stepNumberLarge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  stepNumberLargeText: { color: colors.primary, fontSize: typography.heading, fontWeight: '800' },
  currentStepEyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1, marginBottom: spacing.xs },
  currentStepTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '800', marginBottom: spacing.sm },
  currentStepInstruction: { color: colors.text, fontSize: typography.subtitle, lineHeight: 27 },
  completeStepButton: { minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderColor: colors.primary, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, backgroundColor: colors.surface },
  completedStepButton: { backgroundColor: colors.successLight, borderColor: colors.success },
  completeStepText: { color: colors.primary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  completedStepText: { color: '#047857' },
  navigationRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  stepNavButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  nextButton: { backgroundColor: colors.primary, borderColor: colors.primary, marginLeft: 0 },
  stepNavText: { color: colors.navy, fontSize: typography.body, fontWeight: '700' },
  nextButtonText: { color: colors.white, fontSize: typography.body, fontWeight: '700' },
  disabledButton: { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 },
  disabledNextButton: { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 },
  disabledButtonText: { color: colors.textMuted },
  outcomePrompt: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  outcomePromptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  outcomePromptIcon: { width: 30, height: 30, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, marginRight: spacing.sm },
  outcomePromptIconText: { color: colors.primary, fontWeight: '800' },
  outcomePromptTitle: { flex: 1, color: colors.navy, fontSize: typography.body, lineHeight: 21, fontWeight: '700' },
  outcomePromptText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.md },
  solvedButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.success },
  unresolvedButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, padding: spacing.md, borderColor: colors.border, borderWidth: 1, marginTop: spacing.sm },
  guidedSolvedCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', backgroundColor: colors.successLight, borderColor: '#A7E6CD', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  guidedUnresolvedCard: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'flex-start', backgroundColor: colors.warningLight, borderColor: '#F3D38A', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  completionMark: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  completionMarkText: { color: colors.success, fontSize: typography.heading, fontWeight: '800' },
  outcomeTitle: { flex: 1, color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', marginBottom: spacing.xs },
  outcomeText: { flexBasis: '100%', color: colors.text, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  eyebrow: { color: colors.blue, fontSize: typography.caption, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.sm },
  title: { color: colors.navy, fontSize: typography.heading, fontWeight: '700', lineHeight: 27, marginBottom: spacing.sm },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  meta: { color: colors.blue, fontSize: typography.caption, fontWeight: '700', textTransform: 'capitalize', marginTop: spacing.sm },
  favouriteButton: { alignSelf: 'flex-start', borderColor: colors.blue, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  favouriteButtonSaved: { backgroundColor: colors.blueLight },
  favouriteButtonText: { color: colors.blue, fontSize: typography.caption, fontWeight: '700' },
  favouriteButtonSavedText: { color: colors.navy },
  error: { color: '#A12929', backgroundColor: '#FFF0F0', borderRadius: radius.sm, padding: spacing.md, fontSize: typography.caption, lineHeight: 19, marginBottom: spacing.md },
  section: { marginTop: spacing.xl },
  sectionTitle: { color: colors.navy, fontSize: typography.body, fontWeight: '700', marginBottom: spacing.md },
  listRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  bullet: { color: colors.blue, fontSize: typography.body, lineHeight: 23, marginRight: spacing.sm },
  listText: { flex: 1, color: colors.text, fontSize: typography.body, lineHeight: 23 },
  warningCard: { backgroundColor: '#FFF7E8', borderColor: '#F1D39B', borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg },
  warningTitle: { color: '#835507', fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  warningText: { color: '#694B18', fontSize: typography.body, lineHeight: 22 },
  detailStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  stepNumberSmall: { width: 28, height: 28, borderRadius: radius.pill, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
  stepNumberSmallText: { color: colors.blue, fontSize: typography.caption, fontWeight: '700' },
  primaryButton: { alignItems: 'center', padding: spacing.md, backgroundColor: colors.blue, borderRadius: radius.md, marginTop: spacing.xl },
  primaryButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: '700' },
  buttonPressed: { opacity: 0.8 },
  guidedHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.lg },
  guidedHeaderCopy: { flex: 1, paddingRight: spacing.sm },
  backToGuideText: { color: colors.blue, fontSize: typography.caption, fontWeight: '700', paddingTop: spacing.xs },
  progressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  progressLabels: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  progressStep: { color: colors.navy, fontSize: typography.heading, fontWeight: '800' },
  progressCount: { color: colors.info, fontSize: typography.overline, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.blue, borderRadius: radius.pill },
  currentStepCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'flex-start', shadowColor: colors.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.07, shadowRadius: 9, elevation: 3 },
  stepNumberLarge: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  stepNumberLargeText: { color: colors.primary, fontSize: typography.heading, fontWeight: '800' },
  currentStepTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '800', marginBottom: spacing.sm },
  currentStepInstruction: { color: colors.text, fontSize: typography.subtitle, lineHeight: 27 },
  completeStepButton: { minHeight: 48, alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', borderColor: colors.primary, borderWidth: 1.5, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, backgroundColor: colors.surface },
  completedStepButton: { backgroundColor: colors.successLight, borderColor: colors.success },
  completeStepText: { color: colors.primary, fontSize: typography.body, fontWeight: '700', textAlign: 'center' },
  completedStepText: { color: '#047857' },
  navigationRow: { flexDirection: 'row', marginTop: spacing.md, gap: spacing.sm },
  stepNavButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.surface },
  nextButton: { backgroundColor: colors.primary, borderColor: colors.primary, marginLeft: 0 },
  stepNavText: { color: colors.navy, fontSize: typography.body, fontWeight: '700' },
  nextButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: '700' },
  disabledButton: { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 },
  disabledNextButton: { backgroundColor: colors.background, borderColor: colors.border, opacity: 0.6 },
  disabledButtonText: { color: colors.textMuted },
  outcomePrompt: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
  outcomePromptTitle: { flex: 1, color: colors.navy, fontSize: typography.body, lineHeight: 21, fontWeight: '700' },
  outcomePromptText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 20, marginTop: spacing.xs, marginBottom: spacing.md },
  solvedButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.success },
  outcomeButtonText: { color: colors.surface, fontSize: typography.body, fontWeight: '700' },
  unresolvedButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, padding: spacing.md, borderColor: colors.border, borderWidth: 1, marginTop: spacing.sm },
  unresolvedButtonText: { color: colors.navy, fontSize: typography.body, fontWeight: '700' },
  solvedCard: { backgroundColor: '#EAF7F1', borderColor: '#B8E0CF', borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg },
  unresolvedCard: { backgroundColor: '#FFF7E8', borderColor: '#F1D39B', borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg },
  outcomeTitle: { flex: 1, color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', marginBottom: spacing.xs },
  outcomeText: { flexBasis: '100%', color: colors.text, fontSize: typography.body, lineHeight: 23, marginTop: spacing.xs },
  secondaryButton: { alignItems: 'center', borderColor: colors.navy, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  secondaryButtonText: { color: colors.navy, fontSize: typography.body, fontWeight: '700' },
  // Guided mode visual refinements (kept separate from the approved overview styles).
  guidedProgressCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, shadowColor: colors.navy, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 7, elevation: 2 },
});
