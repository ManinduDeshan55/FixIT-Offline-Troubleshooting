import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function FilterChip({ label, selected, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      hitSlop={{ top: 4, bottom: 4, left: 2, right: 2 }}
      onPress={onPress}
      style={[styles.chip, selected && styles.selectedChip]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, backgroundColor: colors.surface },
  selectedChip: { backgroundColor: colors.navy, borderColor: colors.navy },
  label: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '600' },
  selectedLabel: { color: colors.surface },
});
