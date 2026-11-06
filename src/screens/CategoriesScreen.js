import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import { colors, radius, spacing, typography, shadows } from '../styles/theme';

export default function CategoriesScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>FIND THE RIGHT FIX</Text>
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>Choose a topic to browse clear, step-by-step troubleshooting guides.</Text>
        </View>

        <View style={styles.grid}>
          {categories.map((category, index) => {
            const guideCount = guides.filter((guide) => guide.categoryId === category.id).length;
            return (
              <Pressable
                key={category.id}
                accessibilityRole="button"
                accessibilityLabel={`Browse ${category.name}, ${guideCount} ${guideCount === 1 ? 'guide' : 'guides'}`}
                onPress={() => navigation.navigate('Library', { categoryId: category.id })}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.iconBox, index % 2 === 1 && styles.iconBoxAlternate]}><CategoryIcon index={index} /></View>
                  <Text style={styles.chevron}>›</Text>
                </View>
                <Text style={styles.cardTitle}>{category.name}</Text>
                <Text style={styles.description}>{category.description}</Text>
                <Text style={styles.count}>{guideCount} {guideCount === 1 ? 'guide' : 'guides'}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryIcon({ index }) {
  if (index === 0) return <View style={styles.wifiIcon}><View style={[styles.arc, styles.arcOuter]} /><View style={[styles.arc, styles.arcInner]} /><View style={styles.wifiDot} /></View>;
  if (index === 1) return <View style={styles.barsIcon}><View style={[styles.bar, { height: 9 }]} /><View style={[styles.bar, { height: 14 }]} /><View style={[styles.bar, { height: 11 }]} /><View style={[styles.bar, { height: 18 }]} /></View>;
  if (index === 2) return <View style={styles.noteIcon}><View style={styles.noteStem} /><View style={styles.noteHead} /><View style={styles.noteFlag} /></View>;
  if (index === 3) return <View style={styles.usbIcon}><View style={styles.usbTop} /><View style={styles.usbBody}><View style={styles.usbSlot} /></View></View>;
  if (index === 4) return <View style={styles.deviceIcon}><View style={styles.deviceScreen}><View style={styles.deviceLine} /></View><View style={styles.deviceStand} /></View>;
  return <View style={styles.appsIcon}>{[0, 1, 2, 3].map((cell) => <View key={cell} style={styles.appCell} />)}</View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  header: { marginBottom: spacing.lg },
  eyebrow: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.xs },
  title: { color: colors.navy, fontSize: typography.largeTitle, lineHeight: 38, fontWeight: '800', letterSpacing: -0.7 },
  subtitle: { color: colors.textMuted, fontSize: typography.body, lineHeight: 22, marginTop: spacing.xs, maxWidth: 360 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', minHeight: 192, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md, ...shadows.sm },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  iconBox: { width: 42, height: 42, borderRadius: radius.sm, backgroundColor: colors.blueLight, alignItems: 'center', justifyContent: 'center' },
  iconBoxAlternate: { backgroundColor: colors.infoLight },
  cardTitle: { color: colors.navy, fontSize: typography.body, lineHeight: 21, fontWeight: '700', minHeight: 42 },
  description: { color: colors.textMuted, fontSize: typography.caption, lineHeight: 18, marginTop: spacing.xs, flexGrow: 1 },
  count: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', marginTop: spacing.sm },
  chevron: { color: colors.textMuted, fontSize: 26, lineHeight: 28 },
  wifiIcon: { width: 26, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  arc: { position: 'absolute', borderColor: colors.primary, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  arcOuter: { top: 1, width: 24, height: 17 }, arcInner: { top: 7, width: 14, height: 11 }, wifiDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginBottom: 1 },
  barsIcon: { height: 22, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  bar: { width: 3, borderRadius: 2, backgroundColor: colors.primary },
  noteIcon: { width: 21, height: 22 }, noteStem: { position: 'absolute', left: 10, top: 1, width: 3, height: 14, borderRadius: 2, backgroundColor: colors.primary }, noteHead: { position: 'absolute', left: 4, top: 11, width: 10, height: 7, borderRadius: 6, backgroundColor: colors.primary, transform: [{ rotate: '-20deg' }] }, noteFlag: { position: 'absolute', left: 11, top: 1, width: 8, height: 5, borderTopWidth: 2.5, borderColor: colors.primary },
  usbIcon: { width: 23, height: 22, alignItems: 'center', justifyContent: 'flex-end' }, usbTop: { position: 'absolute', top: 1, width: 13, height: 4, borderWidth: 2, borderColor: colors.primary, borderRadius: 2 }, usbBody: { width: 21, height: 14, borderWidth: 2, borderColor: colors.primary, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, usbSlot: { width: 8, height: 2, borderRadius: 1, backgroundColor: colors.primary },
  deviceIcon: { width: 25, height: 24, alignItems: 'center' }, deviceScreen: { width: 23, height: 16, borderWidth: 2, borderColor: colors.primary, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, deviceLine: { width: 10, height: 2, borderRadius: 1, backgroundColor: colors.primary }, deviceStand: { width: 11, height: 3, borderBottomWidth: 2, borderColor: colors.primary },
  appsIcon: { width: 22, height: 22, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }, appCell: { width: 9, height: 9, borderRadius: 2, borderWidth: 2, borderColor: colors.primary },
});
