import { useCallback, useState } from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import categories from '../data/categories.json';
import guides from '../data/guides.json';
import { getAllSessions } from '../database/storage';
import { colors, radius, spacing, typography, shadows } from '../styles/theme';

export default function HomeScreen({ navigation }) {
  const db = useSQLiteContext();
  const insets = useSafeAreaInsets();
  const [recentSession, setRecentSession] = useState(null);

  useFocusEffect(useCallback(() => {
    let active = true;
    getAllSessions(db).then((sessions) => {
      const latest = sessions.find((session) => session.status === 'in_progress');
      if (active) setRecentSession(latest || null);
    }).catch(() => {
      if (active) setRecentSession(null);
    });
    return () => { active = false; };
  }, [db]));

  const recentGuide = recentSession && guides.find((guide) => guide.id === recentSession.guideId);
  const featuredCategories = categories.slice(0, 4);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xl }]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>OFFLINE TECH SUPPORT</Text>
            <Text style={styles.wordmark}>FixIT</Text>
          </View>
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>F</Text><View style={styles.brandDot} /></View>
        </View>

        <View style={styles.hero}>
          <View style={styles.heroOrb} />
          <Text style={styles.heroEyebrow}>YOUR PERSONAL TECH SUPPORT</Text>
          <Text style={styles.heroTitle}>Computer trouble?</Text>
          <Text style={styles.heroCopy}>Clear, step-by-step guidance to get your computer back on track.</Text>
          <View style={styles.heroBottom}>
            <View style={styles.offlineBadge}><View style={styles.onlineDot} /><Text style={styles.offlineText}>Available offline</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Explore troubleshooting guides" onPress={() => navigation.navigate('Library', { categoryId: null })} style={({ pressed }) => [styles.heroButton, pressed && styles.pressed]}>
              <Text style={styles.heroButtonText}>Explore guides</Text><Text style={styles.buttonArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        <Pressable accessibilityRole="button" accessibilityLabel="Search troubleshooting guides in the library" onPress={() => navigation.navigate('Library', { categoryId: null })} style={({ pressed }) => [styles.searchEntry, pressed && styles.pressed]}>
          <Text style={styles.searchIcon}>⌕</Text><Text style={styles.searchPlaceholder}>What can we help you fix?</Text><Text style={styles.searchArrow}>›</Text>
        </Pressable>

        {recentGuide ? (
          <View style={styles.section}>
            <SectionHeading title="Continue troubleshooting" action="View history" onPress={() => navigation.navigate('History')} />
            <Pressable accessibilityRole="button" onPress={() => navigation.navigate('GuideDetails', { guideId: recentSession.guideId, sessionId: recentSession.sessionId })} style={({ pressed }) => [styles.resumeCard, pressed && styles.pressed]}>
              <View style={styles.resumeIcon}><Text style={styles.resumeIconText}>↻</Text></View>
              <View style={styles.resumeCopy}><Text style={styles.resumeLabel}>IN PROGRESS</Text><Text numberOfLines={2} style={styles.resumeTitle}>{recentGuide.title}</Text><Text style={styles.resumeSub}>{recentSession.completedStepCount || 0} steps completed</Text></View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeading title="Browse by category" action="View all" onPress={() => navigation.navigate('Categories')} />
          <View style={styles.categoryGrid}>
            {featuredCategories.map((category, index) => (
              <Pressable key={category.id} accessibilityRole="button" accessibilityLabel={`Browse ${category.name}`} onPress={() => navigation.navigate('Library', { categoryId: category.id })} style={({ pressed }) => [styles.categoryCard, pressed && styles.pressed]}>
                <View style={[styles.categoryIcon, { backgroundColor: index % 2 ? colors.infoLight : colors.blueLight }]}><CategoryMark index={index} /></View>
                <Text numberOfLines={2} style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.categoryArrow}>Explore ›</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={styles.footerNote}>Practical help, right on your device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CategoryMark({ index }) {
  const stroke = styles.markStroke;
  if (index === 0) return <View style={styles.wifiMark}><View style={[styles.wifiArc, styles.wifiArcLarge]} /><View style={[styles.wifiArc, styles.wifiArcSmall]} /><View style={styles.wifiDot} /></View>;
  if (index === 1) return <View style={styles.performanceMark}><View style={[stroke, { height: 10 }]} /><View style={[stroke, { height: 16 }]} /><View style={[stroke, { height: 13 }]} /><View style={[stroke, { height: 19 }]} /></View>;
  if (index === 2) return <View style={styles.audioMark}><View style={styles.audioStem} /><View style={styles.audioNote} /><View style={styles.audioTail} /></View>;
  return <View style={styles.deviceMark}><View style={styles.deviceTop} /><View style={styles.deviceBody}><View style={styles.deviceSlot} /></View></View>;
}

function SectionHeading({ title, action, onPress }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>{title}</Text><Pressable accessibilityRole="button" onPress={onPress} hitSlop={8}><Text style={styles.sectionAction}>{action}</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.lg },
  eyebrow: { color: colors.textMuted, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.5, marginBottom: 2 },
  wordmark: { color: colors.navy, fontSize: typography.title, fontWeight: '800', letterSpacing: -0.7 },
  brandMark: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, ...shadows.sm },
  brandMarkText: { color: colors.white, fontSize: typography.heading, fontWeight: '800' },
  brandDot: { position: 'absolute', right: 7, bottom: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent, borderWidth: 1, borderColor: colors.primary },
  hero: { overflow: 'hidden', position: 'relative', backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, ...shadows.md },
  heroOrb: { position: 'absolute', right: -48, top: -68, width: 180, height: 180, borderRadius: 90, backgroundColor: colors.navyLight, opacity: 0.75 },
  heroEyebrow: { color: colors.accent, fontSize: typography.overline, fontWeight: '700', letterSpacing: 1.2, marginBottom: spacing.xs },
  heroTitle: { color: colors.white, fontSize: typography.title, fontWeight: '800', lineHeight: 34, marginBottom: spacing.xs },
  heroCopy: { color: '#D7E5F2', fontSize: typography.body, lineHeight: 22, marginBottom: spacing.sm, maxWidth: 290 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: spacing.sm },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.navyLight, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: 7 },
  offlineText: { color: colors.white, fontSize: typography.caption, fontWeight: '600' },
  heroButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, borderRadius: radius.sm, paddingHorizontal: spacing.sm },
  heroButtonText: { color: colors.white, fontSize: typography.caption, fontWeight: '700' },
  buttonArrow: { color: colors.white, fontSize: 22, marginLeft: 7, lineHeight: 24 },
  searchEntry: { minHeight: 52, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: spacing.md, marginBottom: spacing.lg, ...shadows.sm },
  searchIcon: { color: colors.primary, fontSize: 26, marginRight: spacing.sm },
  searchPlaceholder: { flex: 1, color: colors.textMuted, fontSize: typography.body },
  searchArrow: { color: colors.textMuted, fontSize: 26 },
  section: { marginBottom: spacing.lg },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { color: colors.navy, fontSize: typography.heading, fontWeight: '700' },
  sectionAction: { color: colors.primary, fontSize: typography.caption, fontWeight: '700' },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  categoryCard: { width: '48%', minHeight: 126, backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm },
  categoryIcon: { width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  markStroke: { width: 3, borderRadius: 2, backgroundColor: colors.primary, alignSelf: 'flex-end' },
  wifiMark: { width: 25, height: 23, alignItems: 'center', justifyContent: 'flex-end' },
  wifiArc: { position: 'absolute', borderColor: colors.primary, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderTopLeftRadius: 18, borderTopRightRadius: 18 },
  wifiArcLarge: { top: 1, width: 24, height: 17 }, wifiArcSmall: { top: 7, width: 14, height: 11 }, wifiDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary, marginBottom: 1 },
  performanceMark: { height: 23, flexDirection: 'row', alignItems: 'flex-end', gap: 3 },
  audioMark: { width: 20, height: 22 }, audioStem: { position: 'absolute', left: 9, top: 1, width: 3, height: 14, backgroundColor: colors.primary, borderRadius: 2 }, audioNote: { position: 'absolute', left: 4, top: 11, width: 10, height: 7, borderRadius: 6, backgroundColor: colors.primary, transform: [{ rotate: '-20deg' }] }, audioTail: { position: 'absolute', left: 10, top: 1, width: 9, height: 5, borderTopWidth: 2.5, borderColor: colors.primary },
  deviceMark: { width: 23, height: 22, alignItems: 'center', justifyContent: 'flex-end' }, deviceTop: { position: 'absolute', top: 1, width: 13, height: 4, borderWidth: 2, borderColor: colors.primary, borderRadius: 2 }, deviceBody: { width: 21, height: 14, borderWidth: 2, borderColor: colors.primary, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }, deviceSlot: { width: 8, height: 2, borderRadius: 1, backgroundColor: colors.primary },
  categoryName: { color: colors.text, fontSize: typography.caption, lineHeight: 18, fontWeight: '700' },
  categoryArrow: { color: colors.textMuted, fontSize: typography.overline, marginTop: spacing.xs },
  resumeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: radius.md, padding: spacing.md, ...shadows.sm },
  resumeIcon: { width: 42, height: 42, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.infoLight, marginRight: spacing.md },
  resumeIconText: { color: colors.primary, fontSize: 25 },
  resumeCopy: { flex: 1 },
  resumeLabel: { color: colors.primary, fontSize: typography.overline, fontWeight: '700', letterSpacing: 0.8, marginBottom: 2 },
  resumeTitle: { color: colors.navy, fontSize: typography.body, fontWeight: '700' },
  resumeSub: { color: colors.textMuted, fontSize: typography.caption, marginTop: 3 },
  chevron: { color: colors.textMuted, fontSize: 27, marginLeft: spacing.sm },
  footerNote: { color: colors.textMuted, fontSize: typography.caption, textAlign: 'center', marginTop: spacing.sm, paddingBottom: spacing.sm },
  pressed: { opacity: 0.78 },
});
