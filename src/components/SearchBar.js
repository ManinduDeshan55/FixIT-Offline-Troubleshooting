import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../styles/theme';

export default function SearchBar({ value, onChangeText }) {
  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        accessibilityLabel="Search troubleshooting guides"
        autoCapitalize="none"
        onChangeText={onChangeText}
        placeholder="Search guides"
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 50,
    marginBottom: spacing.lg,
  },
  searchIcon: { color: colors.blue, fontSize: 24, marginRight: spacing.sm },
  input: { flex: 1, color: colors.text, fontSize: typography.body, paddingVertical: spacing.sm },
});
