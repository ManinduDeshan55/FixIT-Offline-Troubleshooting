import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function GuideCard({ guide, categoryName, onPress }) {
  const difficultyLabel = guide.difficulty.charAt(0).toUpperCase() + guide.difficulty.slice(1);

  return (
    <Pressable
      accessibilityLabel={`Open guide: ${guide.title}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.topRow}>
        <Text style={styles.category}>{categoryName}</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
      <Text style={styles.title}>{guide.title}</Text>
      <Text numberOfLines={2} style={styles.description}>{guide.description}</Text>
      <View style={styles.metaRow}>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{difficultyLabel}</Text>
        </View>
        <Text style={styles.time}>{guide.estimatedMinutes} min</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  pressed: { opacity: 0.78 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  category: { color: colors.blue, fontSize: typography.caption, fontWeight: '700' },
  chevron: { color: colors.textMuted, fontSize: 26, lineHeight: 28 },
  title: { color: colors.navy, fontSize: typography.body, fontWeight: '700', lineHeight: 22, marginTop: spacing.xs },
  description: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 19, marginTop: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  difficultyBadge: { backgroundColor: colors.blueLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  difficultyText: { color: colors.navy, fontSize: 11, fontWeight: '700' },
  time: { color: colors.textMuted, fontSize: typography.caption, marginLeft: spacing.sm },
});
