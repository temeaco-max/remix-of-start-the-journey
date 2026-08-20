import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useColors } from '@/hooks/use-colors';
import { ScreenContainer } from '@/components/screen-container';
import { SurfaceHeader, SectionCard, StatusPill } from '@/components/kurukoo-ui';
import { MOBILE_PLATFORM_CONTRACTS } from '@/lib/platform-contract';

const descriptions: Record<string,string> = {
  discover: 'Discover Daily Picks, Topics, Opportunities, Products and nearby activity.',
  'chat-routing': 'Start and continue conversations; routing stays server-owned.',
  notifications: 'Receive reminders, request updates, watches and continuation notices.',
  agents: 'Create and control first-class AI agents within bounded policies and budgets.',
  'economic-requests': 'Track requests, quotes, payment, fulfilment, evidence and recovery.',
  memory: 'Review the owner-scoped context Kurukoo can use when it is relevant.',
  'commerce-network': 'Points, POS agents, provider lead charges and commission events.',
  catalogue: 'Discover provider, business, WhatsApp, store and affiliate inventory.',
  'provider-communications': 'Open the active provider session for messaging, tracking and voice/video when available.',
  'ai-runtime': 'Protected AI routing, health, quotas and telemetry remain server/admin owned.',
  safety: 'Safety, check-ins and trusted-contact controls.',
  'provider-credentials': 'Admin-only credential lifecycle; never exposed to consumer mobile UI.',
  'admin-convergence': 'Operator controls remain in the Admin Control Room.',
};

export default function FeatureCompassScreen() {
  const colors = useColors();
  return (
    <ScreenContainer className="px-4 pt-3" edges={["top", "left", "right"]}>
      <SurfaceHeader eyebrow="Kurukoo" title="Explore everything" />
      <SectionCard style={styles.intro}>
        <Text style={[styles.introTitle, { color: colors.foreground }]}>Every platform capability has a place.</Text>
        <Text style={[styles.introCopy, { color: colors.muted }]}>Primary tabs stay focused. This compass exposes the full feature map so capabilities are discoverable without turning navigation into a wall of icons.</Text>
      </SectionCard>
      <FlatList
        data={MOBILE_PLATFORM_CONTRACTS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}. ${descriptions[item.id] || item.notes}`} onPress={() => item.nativeRoute ? router.push(item.nativeRoute as never) : undefined} style={({ pressed }) => [styles.row, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.icon, { backgroundColor: `${colors.primary}16` }]}><Text style={[styles.iconText, { color: colors.primary }]}>{item.title.slice(0, 1)}</Text></View>
            <View style={styles.copy}><Text style={[styles.title, { color: colors.foreground }]}>{item.title}</Text><Text style={[styles.detail, { color: colors.muted }]}>{descriptions[item.id] || item.notes}</Text><View style={styles.meta}><StatusPill label={item.status.replace('_', ' ')} tone={item.status === 'implemented' ? 'success' : item.status === 'external_required' ? 'warning' : 'neutral'} /></View></View>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  intro: { marginBottom: 14 }, introTitle: { fontFamily: 'Inter_700Bold', fontSize: 17 }, introCopy: { marginTop: 7, lineHeight: 20, fontFamily: 'Inter_400Regular', fontSize: 13 }, list: { gap: 10, paddingBottom: 32 }, row: { borderWidth: 1, borderRadius: 16, padding: 12, flexDirection: 'row', gap: 12 }, icon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, iconText: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 15 }, copy: { flex: 1 }, title: { fontFamily: 'Inter_650SemiBold', fontSize: 14 }, detail: { marginTop: 4, fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17 }, meta: { marginTop: 8 }, pressed: { opacity: 0.78 },
});