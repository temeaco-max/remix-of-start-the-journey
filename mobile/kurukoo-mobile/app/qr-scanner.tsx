import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { SurfaceHeader, StatusPill } from "@/components/kurukoo-ui";
import { useColors } from "@/hooks/use-colors";
import { haptic } from "@/lib/haptics";
import { parseKurukooQrUrl } from "@/lib/qr-context";

export default function QrScannerScreen() {
  const colors = useColors();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const [error, setError] = useState<string>();

  const handleBarcode = useCallback(async ({ data, type }: { data: string; type: string }) => {
    if (handled || type !== "qr") return;
    const context = parseKurukooQrUrl(data);
    if (!context) {
      haptic.error();
      setError("That QR code is not a valid Kurukoo context link.");
      return;
    }
    setHandled(true);
    setError(undefined);
    haptic.success();
    await Linking.openURL(context.url);
    router.back();
  }, [handled, router]);

  return (
    <ScreenContainer className="px-4 pt-3" edges={["top", "left", "right"]}>
      <View style={styles.body}>
        <SurfaceHeader eyebrow="Context entry" title="Scan a Kurukoo QR code" right={<StatusPill label="Camera" tone="neutral" />} />
        <Text style={[styles.detail, { color: colors.muted }]}>Point your camera at a Kurukoo QR code. Only signed, expiring <Text style={{ fontWeight: "700" }}>/start?qr=</Text> context links are accepted.</Text>
        {!permission?.granted ? (
          <View style={[styles.permissionCard, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            {permission?.canAskAgain !== false ? <>
              <Text style={[styles.title, { color: colors.foreground }]}>Camera access is required</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>Kurukoo uses the camera only to read QR context links. Your camera feed is not uploaded.</Text>
              <Pressable accessibilityRole="button" onPress={() => { haptic.light(); void requestPermission(); }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Allow camera access</Text></Pressable>
            </> : <>
              <Text style={[styles.title, { color: colors.foreground }]}>Camera access is blocked</Text>
              <Text style={[styles.detail, { color: colors.muted }]}>Enable camera access in system settings, then return to Kurukoo.</Text>
              <Pressable accessibilityRole="button" onPress={() => { haptic.light(); void Linking.openSettings(); }} style={[styles.primaryButton, { backgroundColor: colors.primary }]}><Text style={styles.primaryText}>Open settings</Text></Pressable>
            </>}
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView style={styles.camera} facing="back" onBarcodeScanned={handled ? undefined : handleBarcode} barcodeScannerSettings={{ barcodeTypes: ["qr"] }} />
            <View pointerEvents="none" style={styles.overlay}><View style={[styles.scanFrame, { borderColor: colors.primary }]} /><Text style={styles.overlayText}>Align the QR inside the frame</Text></View>
            {handled ? <View style={styles.processing}><ActivityIndicator color="#fff" /><Text style={styles.processingText}>Opening context…</Text></View> : null}
          </View>
        )}
        {error ? <Text accessibilityRole="alert" style={[styles.error, { color: colors.error }]}>{error}</Text> : null}
        <Pressable accessibilityRole="button" onPress={() => { haptic.selection(); router.back(); }} style={[styles.secondaryButton, { borderColor: colors.border }]}><Text style={[styles.secondaryText, { color: colors.foreground }]}>Cancel</Text></Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: 14 }, detail: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 21 }, permissionCard: { borderWidth: 1, borderRadius: 18, padding: 16, gap: 9 }, title: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 18, lineHeight: 24 }, cameraWrap: { flex: 1, minHeight: 420, borderRadius: 22, overflow: "hidden", position: "relative", backgroundColor: "#111" }, camera: { flex: 1 }, overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 14 }, scanFrame: { width: 230, height: 230, borderWidth: 2, borderRadius: 24, backgroundColor: "transparent" }, overlayText: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13, backgroundColor: "#0008", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }, processing: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "#0008", gap: 8 }, processingText: { color: "#fff", fontFamily: "Inter_600SemiBold" }, primaryButton: { minHeight: 46, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, primaryText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 }, secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 }, secondaryText: { fontFamily: "Inter_600SemiBold", fontSize: 14 }, error: { fontFamily: "Inter_600SemiBold", fontSize: 13, lineHeight: 19 },
});
