import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import { filterGuides } from '../data/guideFilters';
import FilterChip from '../components/FilterChip';
import GuideCard from '../components/GuideCard';
import SearchBar from '../components/SearchBar';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function LibraryScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(route.params?.categoryId || 'all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    setSelectedCategory(route.params?.categoryId || 'all');
    setSearchText('');
    setSelectedDifficulty('all');
  }, [route.params?.categoryId]);

  const matchingGuides = useMemo(
    () => filterGuides(guides, {
      searchText,
      categoryId: selectedCategory,
      difficulty: selectedDifficulty,
    }),
    [searchText, selectedCategory, selectedDifficulty],
  );

  const clearFilters = useCallback(() => {
    setSearchText('');
    setSelectedCategory('all');
    setSelectedDifficulty('all');
    navigation.setParams({ categoryId: null });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.headingBlock}>
          <Text style={styles.eyebrow}>OFFLINE GUIDE LIBRARY</Text>
          <Text style={styles.pageHeading}>Find a fix</Text>
          <Text style={styles.intro}>Search practical, step-by-step help for common computer problems.</Text>
        </View>
        <View style={styles.searchShell}>
          <SearchBar value={searchText} onChangeText={setSearchText} />
        </View>

        <View style={styles.filterHeading}>
          <Text style={styles.filterTitle}>Category</Text>
          <Pressable accessibilityRole="button" hitSlop={8} onPress={clearFilters}>
            <Text style={styles.clearText}>Clear filters</Text>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroller}>
          <FilterChip
            label="All categories"
            selected={selectedCategory === 'all'}
            onPress={() => setSelectedCategory('all')}
          />
          {categories.map((category) => (
            <FilterChip
              key={category.id}
              label={category.name}
              selected={selectedCategory === category.id}
              onPress={() => setSelectedCategory(category.id)}
            />
          ))}
        </ScrollView>

        <Text style={[styles.filterTitle, styles.difficultyHeading]}>Difficulty</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.difficultyScroller} contentContainerStyle={styles.difficultyRow}>
          <FilterChip
            label="Any"
            selected={selectedDifficulty === 'all'}
            onPress={() => setSelectedDifficulty('all')}
          />
          <FilterChip
            label="Easy"
            selected={selectedDifficulty === 'easy'}
            onPress={() => setSelectedDifficulty('easy')}
          />
          <FilterChip
            label="Moderate"
            selected={selectedDifficulty === 'moderate'}
            onPress={() => setSelectedDifficulty('moderate')}
          />
        </ScrollView>

        <Text accessibilityLiveRegion="polite" style={styles.resultCount}>
          {matchingGuides.length} {matchingGuides.length === 1 ? 'guide' : 'guides'} found
        </Text>

        {matchingGuides.length > 0 ? (
          matchingGuides.map((guide) => {
            const category = categories.find((item) => item.id === guide.categoryId);
            return (
              <GuideCard
                key={guide.id}
                guide={guide}
                categoryName={category ? category.name : 'Other'}
                onPress={() => navigation.navigate('GuideDetails', { guideId: guide.id })}
              />
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>⌕</Text></View>
            <Text style={styles.emptyTitle}>No guides match</Text>
            <Text style={styles.emptyText}>Try another search or clear your filters to see all guides.</Text>
            <Pressable accessibilityRole="button" onPress={clearFilters} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Clear search and filters</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.md },
  headingBlock: { marginBottom: spacing.md },
  eyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.xs },
  pageHeading: { color: colors.navy, fontSize: typography.largeTitle, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7 },
  intro: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.xs },
  searchShell: { borderRadius: radius.md, marginBottom: spacing.sm, ...({ shadowColor: '#10243A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 }) },
  filterHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  filterTitle: { color: colors.navy, fontSize: typography.caption, fontWeight: '700', letterSpacing: 0.2 },
  clearText: { color: colors.blue, fontSize: typography.caption, fontWeight: '700' },
  chipScroller: { flexGrow: 0, marginBottom: spacing.md, marginHorizontal: -spacing.lg, paddingHorizontal: spacing.lg },
  difficultyHeading: { marginBottom: spacing.sm },
  difficultyScroller: { flexGrow: 0, marginBottom: spacing.sm, marginHorizontal: -spacing.lg },
  difficultyRow: { flexDirection: 'row', paddingHorizontal: spacing.lg },
  resultCount: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '600', marginTop: spacing.xs, marginBottom: spacing.md },
  emptyState: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.sm, shadowColor: '#10243A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  emptyIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  emptyIconText: { color: colors.primary, fontSize: 28 },
  emptyTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '700', textAlign: 'center' },
  emptyText: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, textAlign: 'center', marginTop: spacing.sm },
  emptyButton: { backgroundColor: colors.blue, borderRadius: radius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginTop: spacing.md },
  emptyButtonText: { color: colors.surface, fontSize: typography.caption, fontWeight: '700' },
});
