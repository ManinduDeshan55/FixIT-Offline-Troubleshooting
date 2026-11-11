import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import { getAllFavourites, removeFavourite } from '../database/storage';
import { colors, radius, spacing, typography, shadows } from '../styles/theme';

export default function SavedGuidesScreen({ navigation }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [savedGuides, setSavedGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [removingGuideId, setRemovingGuideId] = useState(null);

  useFocusEffect(useCallback(() => {
    let isActive = true;

    async function loadSavedGuides() {
      setLoading(true);
      setErrorMessage('');
      try {
        const favourites = await getAllFavourites(db);
        const guideRows = favourites.map((favourite) => {
          const guide = guides.find((item) => item.id === favourite.guideId);
          const category = guide && categories.find((item) => item.id === guide.categoryId);
          return guide ? { ...guide, categoryName: category?.name || 'Category unavailable' } : null;
        }).filter(Boolean);
        if (isActive) setSavedGuides(guideRows);
      } catch (error) {
        if (isActive) setErrorMessage(error.message || 'Could not load saved guides.');
      } finally {
        if (isActive) setLoading(false);
      }
    }

    loadSavedGuides();
    return () => { isActive = false; };
  }, [db]));

  async function handleRemoveFavourite(guideId) {
    if (removingGuideId) return;
    setErrorMessage('');
    setRemovingGuideId(guideId);
    try {
      await removeFavourite(db, guideId);
      setSavedGuides((currentGuides) => currentGuides.filter((guide) => guide.id !== guideId));
    } catch (error) {
      setErrorMessage(error.message || 'Could not remove this saved guide.');
    } finally {
      setRemovingGuideId(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <View style={styles.introCopy}>
            <Text style={styles.eyebrow}>YOUR PERSONAL COLLECTION</Text>
            <Text style={styles.subtitle}>Keep useful fixes close at hand for whenever you need them.</Text>
          </View>
          {!loading && (!errorMessage || savedGuides.length > 0) ? (
            <View style={styles.countBadge} accessibilityLabel={`${savedGuides.length} saved ${savedGuides.length === 1 ? 'guide' : 'guides'}`}>
              <Text style={styles.countNumber}>{savedGuides.length}</Text>
              <Text style={styles.countLabel}>{savedGuides.length === 1 ? 'SAVED GUIDE' : 'SAVED GUIDES'}</Text>
            </View>
          ) : null}
        </View>

        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>♡</Text></View>
            <Text style={styles.loadingTitle}>Loading your saved guides</Text>
            <Text style={styles.body}>Your collection will be ready in a moment.</Text>
          </View>
        ) : savedGuides.length === 0 ? (
          errorMessage ? null : (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>♡</Text></View>
              <Text style={styles.emptyTitle}>Your collection starts here</Text>
              <Text style={styles.body}>Save troubleshooting guides for quick access later. Your saved guides stay on this device.</Text>
              <Pressable accessibilityRole="button" onPress={() => navigation.navigate('Library', { categoryId: null })} style={({ pressed }) => [styles.browseButton, pressed && styles.pressed]}>
                <Text style={styles.browseButtonText}>Browse troubleshooting guides</Text><Text style={styles.browseArrow}>›</Text>
              </Pressable>
            </View>
          )
        ) : (
          savedGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              <View style={styles.cardTop}>
                <View style={styles.categoryPill}><Text style={styles.category}>{guide.categoryName}</Text></View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${guide.title} from saved guides`}
                  accessibilityState={{ disabled: removingGuideId !== null }}
                  disabled={removingGuideId !== null}
                  hitSlop={8}
                  onPress={() => handleRemoveFavourite(guide.id)}
                  style={({ pressed }) => [styles.removeButton, pressed && styles.pressed]}
                >
                  <Text style={styles.removeIcon}>{removingGuideId === guide.id ? '…' : '♥'}</Text>
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open guide: ${guide.title}`}
                onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
                style={({ pressed }) => [styles.openArea, pressed && styles.pressed]}
              >
                <Text style={styles.title}>{guide.title}</Text>
                <Text numberOfLines={3} style={styles.body}>{guide.description}</Text>
                <View style={styles.metaRow}>
                  {guide.difficulty ? <View style={styles.difficultyBadge}><Text style={styles.difficultyText}>{guide.difficulty}</Text></View> : null}
                  {guide.estimatedMinutes ? <Text style={styles.duration}>◷  {guide.estimatedMinutes} min</Text> : null}
                  <Text style={styles.openLabel}>Open guide ›</Text>
                </View>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  intro: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  introCopy: { flex: 1, paddingRight: spacing.sm },
  eyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.1, marginBottom: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  countBadge: { minWidth: 76, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, borderRadius: radius.md, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  countNumber: { color: colors.primary, fontSize: typography.heading, lineHeight: 24, fontWeight: '800' },
  countLabel: { color: colors.info, fontSize: 9, fontWeight: '700', letterSpacing: 0.45, marginTop: 2 },
  guideCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  categoryPill: { alignSelf: 'flex-start', maxWidth: '82%', backgroundColor: colors.blueLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  category: { color: colors.info, fontSize: typography.overline, fontWeight: '700' },
  removeButton: { width: 44, height: 44, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  removeIcon: { color: colors.primary, fontSize: 19 },
  openArea: { borderRadius: radius.sm },
  title: { color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', marginBottom: spacing.xs },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: spacing.md, gap: spacing.sm },
  difficultyBadge: { backgroundColor: colors.background, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  difficultyText: { color: colors.textSecondary, fontSize: typography.overline, fontWeight: '700', textTransform: 'capitalize' },
  duration: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '600' },
  openLabel: { color: colors.primary, fontSize: typography.caption, fontWeight: '700', marginLeft: 'auto' },
  loadingCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.xl, ...shadows.sm },
  loadingMark: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, borderRadius: radius.md, marginBottom: spacing.md },
  loadingMarkText: { color: colors.primary, fontSize: 30 },
  loadingTitle: { color: colors.navy, fontSize: typography.body, fontWeight: '700', marginBottom: spacing.xs },
  emptyCard: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.lg, padding: spacing.lg, ...shadows.sm },
  emptyIcon: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueLight, borderRadius: radius.lg, marginBottom: spacing.md },
  emptyIconText: { color: colors.primary, fontSize: 38 },
  emptyTitle: { color: colors.navy, fontSize: typography.heading, lineHeight: 26, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  browseButton: { minHeight: 48, alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.md, marginTop: spacing.lg },
  browseButtonText: { color: colors.white, fontSize: typography.caption, fontWeight: '700' },
  browseArrow: { color: colors.white, fontSize: 22, marginLeft: spacing.sm },
  error: { color: colors.danger, backgroundColor: colors.dangerLight, borderRadius: radius.sm, padding: spacing.md, fontSize: typography.caption, lineHeight: 19, marginBottom: spacing.md },
  pressed: { opacity: 0.78 },
});
