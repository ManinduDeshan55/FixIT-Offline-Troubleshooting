import { useMemo } from 'react';
import { useTheme } from '../styles/ThemeContext';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography } from '../styles/theme';

export default function FilterChip({ label, selected, onPress }) {
  const styles = useStyles();
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

function useStyles() {
  const { colors, shadows } = useTheme();
  return useMemo(() => StyleSheet.create({
  chip: { borderColor: colors.border, borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, marginRight: spacing.sm, backgroundColor: colors.surface },
  selectedChip: { backgroundColor: colors.selectedSurface, borderColor: colors.selectedSurface },
  label: { color: colors.textMuted, fontSize: typography.caption, fontWeight: '600' },
  selectedLabel: { color: colors.white },
}), [colors, shadows]);
}
