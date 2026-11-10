import { useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import diagnosticRules from '../data/diagnosticRules';
import guides from '../data/guides.json';
import { colors, radius, spacing, typography, shadows } from '../styles/theme';

export default function DiagnosticWizardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) || null;
  const validRules = useMemo(() => (
    Array.isArray(diagnosticRules)
      ? diagnosticRules.filter((rule) => (
        rule && typeof rule.categoryId === 'string' && typeof rule.symptom === 'string' &&
        typeof rule.guideId === 'string' && guides.some((guide) => guide.id === rule.guideId) &&
        categories.some((category) => category.id === rule.categoryId)
      ))
      : []
  ), []);
  const categoryRules = validRules.filter((rule) => rule.categoryId === selectedCategoryId);
  const recommendedGuide = showRecommendation && selectedRule
    ? guides.find((guide) => guide.id === selectedRule.guideId) || null
    : null;

  function chooseCategory(categoryId) {
    setSelectedCategoryId(categoryId);
    setSelectedRule(null);
    setShowRecommendation(false);
  }

  function resetWizard() {
    setSelectedCategoryId(null);
    setSelectedRule(null);
    setShowRecommendation(false);
  }

  function openLibrary() {
    navigation.navigate('Library', { categoryId: selectedCategory ? selectedCategory.id : null });
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.eyebrow}>OFFLINE GUIDE FINDER</Text>
          <Text style={styles.title}>Find a guide for your problem</Text>
          <Text style={styles.subtitle}>Choose a topic and symptom to find a relevant troubleshooting guide.</Text>
        </View>

        <View style={styles.stepRow}>
          <StepLabel number="1" label="Category" active={!selectedCategoryId} complete={Boolean(selectedCategoryId)} />
          <View style={styles.stepConnector} />
          <StepLabel number="2" label="Symptom" active={Boolean(selectedCategoryId) && !showRecommendation} complete={showRecommendation} />
          <View style={styles.stepConnector} />
          <StepLabel number="3" label="Guide" active={showRecommendation} complete={false} />
        </View>

        {!selectedCategoryId ? (
          <View>
            <Text style={styles.sectionTitle}>What area needs help?</Text>
            {categories.map((category) => (
              <Pressable key={category.id} accessibilityRole="button" onPress={() => chooseCategory(category.id)} style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
                <View style={styles.categoryIcon}><Text style={styles.categoryIconText}>{category.name.slice(0, 1)}</Text></View>
                <View style={styles.categoryCopy}><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryDescription}>{category.description}</Text></View>
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            ))}
          </View>
        ) : !showRecommendation ? (
          <View>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeadingCopy}><Text style={styles.sectionTitle}>What best describes it?</Text><Text style={styles.selectedCategory}>{selectedCategory?.name || 'Selected category'}</Text></View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={resetWizard}><Text style={styles.textAction}>Change category</Text></Pressable>
            </View>
            {categoryRules.length > 0 ? categoryRules.map((rule) => (
              <Pressable key={rule.guideId} accessibilityRole="button" onPress={() => { setSelectedRule(rule); setShowRecommendation(true); }} style={({ pressed }) => [styles.symptomCard, pressed && styles.pressed]}>
                <Text style={styles.symptomText}>{rule.symptom}</Text><Text style={styles.chevron}>›</Text>
              </Pressable>
            )) : (
              <View style={styles.noMatchCard}>
                <Text style={styles.noMatchTitle}>No guided matches for this category yet</Text>
                <Text style={styles.noMatchText}>Browse the full library to find a guide that fits your situation.</Text>
                <Pressable accessibilityRole="button" onPress={openLibrary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Browse this category</Text><Text style={styles.buttonArrow}>›</Text>
                </Pressable>
              </View>
            )}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>A guide to try</Text><Text style={styles.selectedCategory}>{selectedCategory?.name}</Text></View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setShowRecommendation(false)}><Text style={styles.textAction}>Change symptom</Text></Pressable>
            </View>

            {recommendedGuide ? (
              <View style={styles.recommendationCard}>
                <View style={styles.recommendationBadge}><Text style={styles.recommendationBadgeText}>SUGGESTED GUIDE</Text></View>
                <Text style={styles.guideTitle}>{recommendedGuide.title}</Text>
                <Text style={styles.guideDescription}>{recommendedGuide.description}</Text>
                <View style={styles.matchBox}>
                  <Text style={styles.matchLabel}>YOU SELECTED</Text>
                  <Text style={styles.matchSymptom}>{selectedRule?.symptom}</Text>
                  <Text style={styles.matchExplanation}>This guide was suggested because its topic matches the symptom you selected. It is a starting point, not a confirmed diagnosis.</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => navigation.navigate('GuideDetails', { guideId: recommendedGuide.id })} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Open Guide</Text><Text style={styles.buttonArrow}>›</Text>
                </Pressable>
                {recommendedGuide.safetyWarning ? <Text style={styles.safetyNote}>Safety guidance is available on the Guide Details screen.</Text> : null}
              </View>
            ) : (
              <View style={styles.noMatchCard}>
                <Text style={styles.noMatchTitle}>No suitable guide was found</Text>
                <Text style={styles.noMatchText}>Browse the library to review all available guides.</Text>
                <Pressable accessibilityRole="button" onPress={openLibrary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                  <Text style={styles.primaryButtonText}>Browse the Library</Text><Text style={styles.buttonArrow}>›</Text>
                </Pressable>
              </View>
            )}
          </View>
        )}

        {(selectedCategoryId || showRecommendation) ? (
          <Pressable accessibilityRole="button" onPress={() => {
            if (showRecommendation) setShowRecommendation(false);
            else resetWizard();
          }} style={styles.backButton}>
            <Text style={styles.backButtonText}>{showRecommendation ? '‹  Back to symptoms' : '‹  All categories'}</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function StepLabel({ number, label, active, complete }) {
  return (
    <View style={styles.stepLabel}>
      <View style={[styles.stepNumber, active && styles.stepNumberActive, complete && styles.stepNumberComplete]}><Text style={[styles.stepNumberText, (active || complete) && styles.stepNumberTextActive]}>{complete ? '✓' : number}</Text></View>
      <Text style={[styles.stepName, active && styles.stepNameActive]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  intro: { marginBottom: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.xs },
  title: { color: colors.navy, fontSize: typography.title, lineHeight: 34, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  stepLabel: { alignItems: 'center', minWidth: 58 },
  stepNumber: { width: 28, height: 28, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border, marginBottom: spacing.xs },
  stepNumberActive: { backgroundColor: colors.primary },
  stepNumberComplete: { backgroundColor: colors.successLight },
  stepNumberText: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '700' },
  stepNumberTextActive: { color: colors.white },
  stepName: { color: colors.textMuted, fontSize: 10, fontWeight: '600' },
  stepNameActive: { color: colors.primary, fontWeight: '700' },
  stepConnector: { height: 1, flex: 1, backgroundColor: colors.border, marginHorizontal: spacing.xs, marginBottom: 18 },
  sectionTitle: { color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', marginBottom: spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionHeadingCopy: { flex: 1, paddingRight: spacing.xs },
  selectedCategory: { color: colors.textMuted, fontSize: typography.caption, marginTop: -spacing.xs },
  textAction: { color: colors.primary, fontSize: typography.overline, fontWeight: '700' },
  categoryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  categoryIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, marginRight: spacing.md },
  categoryIconText: { color: colors.primary, fontSize: typography.heading, fontWeight: '800' },
  categoryCopy: { flex: 1 },
  categoryName: { color: colors.navy, fontSize: typography.body, lineHeight: 21, fontWeight: '700' },
  categoryDescription: { color: colors.textMuted, fontSize: typography.overline, lineHeight: 16, marginTop: 2 },
  chevron: { color: colors.textMuted, fontSize: 26, marginLeft: spacing.sm },
  symptomCard: { minHeight: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginBottom: spacing.sm, ...shadows.sm },
  symptomText: { flex: 1, color: colors.text, fontSize: typography.body, lineHeight: 22, fontWeight: '600', paddingRight: spacing.sm },
  recommendationCard: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm },
  recommendationBadge: { alignSelf: 'flex-start', backgroundColor: colors.blueLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, marginBottom: spacing.sm },
  recommendationBadgeText: { color: colors.info, fontSize: typography.overline, fontWeight: '700', letterSpacing: 0.6 },
  guideTitle: { color: colors.navy, fontSize: typography.heading, lineHeight: 27, fontWeight: '800' },
  guideDescription: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.xs },
  matchBox: { backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.md },
  matchLabel: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 0.7 },
  matchSymptom: { color: colors.navy, fontSize: typography.body, lineHeight: 22, fontWeight: '700', marginTop: spacing.xs },
  matchExplanation: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.xs },
  primaryButton: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.md },
  primaryButtonText: { color: colors.white, fontSize: typography.body, fontWeight: '700' },
  buttonArrow: { color: colors.white, fontSize: 22, marginLeft: spacing.sm },
  safetyNote: { color: colors.textMuted, fontSize: typography.overline, lineHeight: 16, textAlign: 'center', marginTop: spacing.sm },
  noMatchCard: { backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, ...shadows.sm },
  noMatchTitle: { color: colors.navy, fontSize: typography.body, lineHeight: 22, fontWeight: '700' },
  noMatchText: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.xs },
  backButton: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginTop: spacing.md, paddingRight: spacing.md },
  backButtonText: { color: colors.primary, fontSize: typography.caption, fontWeight: '700' },
  pressed: { opacity: 0.78 },
});
