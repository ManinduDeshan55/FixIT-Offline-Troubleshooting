import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import { getAllFavourites, removeFavourite } from '../database/storage';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function SavedGuidesScreen({ navigation }) {
  const db = useSQLiteContext();
  const [savedGuides, setSavedGuides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

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
    setErrorMessage('');
    try {
      await removeFavourite(db, guideId);
      setSavedGuides((currentGuides) => currentGuides.filter((guide) => guide.id !== guideId));
    } catch (error) {
      setErrorMessage(error.message || 'Could not remove this saved guide.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        {errorMessage ? <Text accessibilityRole="alert" style={styles.error}>{errorMessage}</Text> : null}
        {loading ? (
          <Text style={styles.body}>Loading saved guides…</Text>
        ) : savedGuides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.title}>No saved guides yet</Text>
            <Text style={styles.body}>Save a guide from its details page and it will appear here.</Text>
          </View>
        ) : (
          savedGuides.map((guide) => (
            <View key={guide.id} style={styles.guideCard}>
              <Text style={styles.category}>{guide.categoryName}</Text>
              <Text style={styles.title}>{guide.title}</Text>
              <Text style={styles.body}>{guide.description}</Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
                  style={styles.openButton}
                >
                  <Text style={styles.openButtonText}>Open guide</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleRemoveFavourite(guide.id)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  emptyCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg },
  guideCard: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  category: { color: colors.blue, fontSize: typography.caption, fontWeight: '700', marginBottom: spacing.xs },
  title: { color: colors.navy, fontSize: typography.heading, fontWeight: '700', marginBottom: spacing.sm },
  body: { color: colors.textMuted, fontSize: typography.body, lineHeight: 23 },
  actions: { flexDirection: 'row', marginTop: spacing.md },
  openButton: { alignItems: 'center', backgroundColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  openButtonText: { color: colors.surface, fontSize: typography.caption, fontWeight: '700' },
  removeButton: { alignItems: 'center', borderColor: colors.border, borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginLeft: spacing.sm },
  removeButtonText: { color: colors.navy, fontSize: typography.caption, fontWeight: '700' },
  error: { color: '#A12929', fontSize: typography.caption, marginBottom: spacing.md },
});
