import { Tabs, useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useColors } from "@/hooks/use-colors";

const tabIcons = {
  index: "bubble.left.and.bubble.right.fill",
  discover: "map.fill",
  requests: "list.bullet.rectangle.fill",
  tasks: "checklist",
  connect: "link.circle.fill",
} as const;

export default function TabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
          tabBarButton: HapticTab,
          tabBarLabelStyle: { fontFamily: "Inter_600SemiBold", fontSize: 11, marginBottom: 2 },
          tabBarStyle: {
            height: 64 + bottomPadding,
            paddingTop: 8,
            paddingBottom: bottomPadding,
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarIcon: ({ color, size }) => <IconSymbol name={tabIcons[route.name as keyof typeof tabIcons]} size={size} color={color} />,
        })}
      >
        <Tabs.Screen name="index" options={{ title: "Agent" }} />
        <Tabs.Screen name="discover" options={{ title: "Discover" }} />
        <Tabs.Screen name="requests" options={{ title: "Requests" }} />
        <Tabs.Screen name="tasks" options={{ title: "Tasks" }} />
        <Tabs.Screen name="connect" options={{ title: "Connect" }} />
      </Tabs>
      <Pressable accessibilityRole="button" accessibilityLabel="Explore all Kurukoo features" onPress={() => router.push('/feature-compass')} style={({ pressed }) => [styles.compass, { backgroundColor: colors.primary }, pressed && styles.pressed]}>
        <Text style={styles.compassIcon}>✦</Text>
        <Text style={styles.compassLabel}>Explore</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 }, compass: { position: 'absolute', right: 14, bottom: 80, minWidth: 76, height: 38, borderRadius: 19, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, elevation: 4, shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, compassIcon: { color: '#fff', fontFamily: 'SpaceGrotesk_700Bold', fontSize: 15 }, compassLabel: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 11 }, pressed: { opacity: 0.82 }, });
