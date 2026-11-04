import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBadges } from '../../../badges';
import { colors } from '../../../theme';

const glass = Platform.OS === 'ios';
const badge = { backgroundColor: colors.accent, color: colors.onAccent };

function BarIcon({ focused, color, name, outline }) {
  return (
    <View style={[styles.slot, !glass && styles.slotAndroid, focused && (glass ? styles.slotGlass : styles.slotOn)]}>
      <Ionicons name={focused ? name : outline} size={22} color={color} />
    </View>
  );
}

function GlassBackground() {
  return (
    <BlurView intensity={80} tint="systemChromeMaterialLight" style={styles.glass}>
      <View pointerEvents="none" style={styles.sheen} />
    </BlurView>
  );
}

export default function TabLayout() {
  const badges = useBadges();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      initialRouteName="messages"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: glass ? '#3c4c57' : '#1b2830',
        tabBarLabelPosition: 'below-icon',
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: glass ? styles.labelGlass : styles.label,
        tabBarStyle: glass ? {
          position: 'absolute',
          start: 16,
          end: 16,
          marginBottom: Math.max(insets.bottom, 10),
          height: 64,
          paddingTop: 0,
          paddingBottom: 0,
          borderTopWidth: 0,
          backgroundColor: 'transparent',
          borderRadius: 32,
          shadowColor: '#193a2f',
          shadowOpacity: 0.18,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 10 },
        } : {
          backgroundColor: '#ffffff',
          borderTopColor: '#b7c3cb',
          borderTopWidth: 1,
          elevation: 12,
          height: 58 + Math.max(insets.bottom, 6),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
        },
        tabBarBackground: glass ? () => <GlassBackground /> : undefined,
        tabBarBadgeStyle: badge,
      }}
    >
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Chats',
          tabBarBadge: badges.messages || undefined,
          tabBarIcon: ({ color, focused }) => (
            <BarIcon focused={focused} color={color} name="chatbubbles" outline="chatbubbles-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarBadge: badges.teams || undefined,
          tabBarIcon: ({ color, focused }) => (
            <BarIcon focused={focused} color={color} name="business" outline="business-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Work',
          tabBarIcon: ({ color, focused }) => (
            <BarIcon focused={focused} color={color} name="briefcase" outline="briefcase-outline" />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: 'Updates',
          tabBarBadge: badges.inbox || undefined,
          tabBarIcon: ({ color, focused }) => (
            <BarIcon focused={focused} color={color} name="notifications" outline="notifications-outline" />
          ),
        }}
      />
      <Tabs.Screen name="today" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    lineHeight: 14,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 2,
    includeFontPadding: false,
  },
  labelGlass: { fontSize: 11, fontWeight: '600', marginTop: 0 },
  slot: {
    minWidth: 56,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  slotAndroid: { minWidth: 48, height: 26, paddingHorizontal: 10 },
  slotOn: { backgroundColor: colors.accentMuted },
  slotGlass: { backgroundColor: 'rgba(255,255,255,0.72)' },
  glass: { flex: 1, borderRadius: 32, overflow: 'hidden' },
  sheen: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
});
