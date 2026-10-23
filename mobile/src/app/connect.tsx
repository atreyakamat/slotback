import { CameraView, useCameraPermissions } from "expo-camera";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icon from "../../assets/icon.png";
import { Button, Card, ErrorNote, FadeIn, Text } from "@/components/ui";
import { getToken, parsePairingCode } from "@/lib/api";
import { useSession } from "@/lib/session";
import { brand, radius, space, useTheme } from "@/theme";

const DEFAULT_SERVER = (Constants.expoConfig?.extra?.defaultServer as string | undefined) ?? "https://slotback.atreyakamat.dev";

export default function Connect() {
  const t = useTheme();
  const { signIn } = useSession();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState<"scan" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [server, setServer] = useState(DEFAULT_SERVER);
  const [showServer, setShowServer] = useState(false);
  const handled = useRef(false);

  async function startScan() {
    setError(null);
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) return setError("Allow camera access to scan the code, in your phone's settings.");
    }
    handled.current = false;
    setScanning(true);
  }

  async function onScanned(data: string) {
    if (handled.current) return;
    handled.current = true;
    setScanning(false);
    const parsed = parsePairingCode(data);
    if (!parsed) return setError("That isn't a SlotBack code. Open Settings, Phone app on the SlotBack website and scan the code there.");
    setBusy("scan");
    try {
      const token = await getToken(parsed.server, "/pair", { code: parsed.code, deviceName: Device.deviceName ?? Device.modelName ?? null });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await signIn({ server: parsed.server, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect.");
    } finally {
      setBusy(null);
    }
  }

  async function tryDemo() {
    setError(null);
    setBusy("demo");
    const base = server.trim().replace(/\/+$/, "");
    try {
      const token = await getToken(base, "/demo");
      await signIn({ server: base, token });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't open the demo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: brand.green }}>
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ padding: space(6), gap: space(6), flexGrow: 1, justifyContent: "flex-end" }}>
            <FadeIn>
              <View style={{ gap: space(3) }}>
                <Image source={icon} style={styles.mark} alt="SlotBack" />
                <Text variant="display" style={{ color: brand.cream, fontSize: 40, lineHeight: 44 }}>
                  Fill every{"\n"}cancelled slot.
                </Text>
                <Text style={{ color: brand.muted }}>
                  Cancel, offer and refill from your phone. Your clients get a WhatsApp message and claim the slot in one tap.
                </Text>
              </View>
            </FadeIn>

            {scanning ? (
              <View style={styles.scanner}>
                <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={(r) => onScanned(r.data)} />
                <View pointerEvents="none" style={[styles.frame, { borderColor: brand.lime }]} />
                <Pressable accessibilityRole="button" onPress={() => setScanning(false)} style={styles.cancelScan}>
                  <Text style={{ color: brand.cream, fontWeight: "700" }}>Cancel</Text>
                </Pressable>
              </View>
            ) : null}

            {error ? <ErrorNote message={error} /> : null}

            {!scanning ? (
              <View style={{ gap: space(3) }}>
                <Button label="Scan to connect" variant="highlight" onPress={startScan} loading={busy === "scan"} />
                <Text variant="small" style={{ color: brand.muted, textAlign: "center" }}>
                  On a computer, open SlotBack, then Settings, Phone app, and show the QR code.
                </Text>
                <Button label="Try the demo salon" variant="ghost" onPress={tryDemo} loading={busy === "demo"} />
                <Pressable accessibilityRole="button" onPress={() => setShowServer((s) => !s)}>
                  <Text variant="small" style={{ color: brand.muted, textAlign: "center", textDecorationLine: "underline" }}>
                    {showServer ? "Hide server" : "Testing? Change server"}
                  </Text>
                </Pressable>
                {showServer ? (
                  <Card style={{ backgroundColor: t.surface }}>
                    <Text variant="label" tone="muted">
                      Server for the demo
                    </Text>
                    <TextInput
                      value={server}
                      onChangeText={setServer}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      accessibilityLabel="Server address"
                      style={[styles.input, { color: t.text, borderColor: t.border }]}
                    />
                  </Card>
                ) : null}
              </View>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { width: 56, height: 56, borderRadius: 16 },
  scanner: { height: 320, borderRadius: radius.lg, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  frame: { width: 220, height: 220, borderWidth: 3, borderRadius: radius.lg },
  cancelScan: { position: "absolute", bottom: space(4), paddingHorizontal: space(5), paddingVertical: space(2), borderRadius: radius.pill, backgroundColor: "rgba(7,20,15,0.7)" },
  input: { marginTop: space(2), borderWidth: 1, borderRadius: radius.sm, paddingHorizontal: space(3), paddingVertical: space(3), fontSize: 15 },
});
