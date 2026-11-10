import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../styles/theme';
import CategoriesScreen from '../screens/CategoriesScreen';
import DiagnosticWizardScreen from '../screens/DiagnosticWizardScreen';
import GuideDetailsScreen from '../screens/GuideDetailsScreen';
import HistoryScreen from '../screens/HistoryScreen';
import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SavedGuidesScreen from '../screens/SavedGuidesScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabIcon({ name, color, focused }) {
  const stroke = focused ? 2.5 : 2;
  if (name === 'Home') {
    return <View style={styles.iconBox}><View style={[styles.homeRoof, { borderColor: color, borderBottomWidth: 0, borderRightWidth: 0, borderWidth: stroke }]} /><View style={[styles.homeBase, { borderColor: color, borderWidth: stroke }]} /></View>;
  }
  if (name === 'Categories') {
    return <View style={styles.gridIcon}>{[0, 1, 2, 3].map((item) => <View key={item} style={[styles.gridCell, { borderColor: color, borderWidth: stroke }]} />)}</View>;
  }
  if (name === 'Saved') {
    return <View style={[styles.savedIcon, { borderColor: color, borderWidth: stroke }]}><View style={[styles.savedCutout, { borderColor: color, borderTopWidth: stroke, borderLeftWidth: stroke }]} /></View>;
  }
  return <View style={[styles.clockIcon, { borderColor: color, borderWidth: stroke }]}><View style={[styles.clockHandVertical, { backgroundColor: color }]} /><View style={[styles.clockHandHorizontal, { backgroundColor: color }]} /></View>;
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '700' },
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 58 + insets.bottom,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
        },
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '600', marginBottom: 2 },
        tabBarItemStyle: { minHeight: 48, paddingVertical: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerShown: false, tabBarLabel: 'Home', tabBarIcon: ({ color, focused }) => <TabIcon name="Home" color={color} focused={focused} /> }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoriesScreen}
        options={{ title: 'Categories', tabBarLabel: 'Categories', tabBarIcon: ({ color, focused }) => <TabIcon name="Categories" color={color} focused={focused} /> }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedGuidesScreen}
        options={{ title: 'Saved Guides', tabBarLabel: 'Saved', tabBarIcon: ({ color, focused }) => <TabIcon name="Saved" color={color} focused={focused} /> }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ title: 'Troubleshooting History', tabBarLabel: 'History', tabBarIcon: ({ color, focused }) => <TabIcon name="History" color={color} focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconBox: { width: 24, height: 24, alignItems: 'center', justifyContent: 'flex-end' },
  homeRoof: { position: 'absolute', top: 3, width: 13, height: 13, transform: [{ rotate: '45deg' }] },
  homeBase: { width: 16, height: 12, borderBottomWidth: 0, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  gridIcon: { width: 21, height: 21, flexDirection: 'row', flexWrap: 'wrap', gap: 3 },
  gridCell: { width: 9, height: 9, borderRadius: 2 },
  savedIcon: { width: 17, height: 21, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, alignItems: 'center', justifyContent: 'center' },
  savedCutout: { width: 7, height: 7, transform: [{ rotate: '45deg' }], borderRightWidth: 0, borderBottomWidth: 0, marginTop: 8 },
  clockIcon: { width: 21, height: 21, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  clockHandVertical: { position: 'absolute', width: 2, height: 6, top: 4, left: 9 },
  clockHandHorizontal: { position: 'absolute', width: 5, height: 2, top: 9, left: 9 },
});

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainTabs"
        screenOptions={{
          headerStyle: { backgroundColor: colors.navy },
          headerTintColor: colors.surface,
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Library"
          component={LibraryScreen}
          options={{ title: 'Troubleshooting Library' }}
        />
        <Stack.Screen
          name="DiagnosticWizard"
          component={DiagnosticWizardScreen}
          options={{ title: 'Find My Problem' }}
        />
        <Stack.Screen
          name="GuideDetails"
          component={GuideDetailsScreen}
          options={{ title: 'Guide Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
