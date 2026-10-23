import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { Button, Card, Chip, ErrorNote, Screen, Text } from "@/components/ui";
import { call } from "@/lib/api";
import { useSignedIn } from "@/lib/session";
import { space } from "@/theme";

const REASONS = ["Client cancelled", "Feeling unwell", "Running late", "Clashed with work", "No reason given"];

export default function Refill() {
  const { id, label, cancelled } = useLocalSearchParams<{ id: string; label?: string; cancelled?: string }>();
  const { session } = useSignedIn();
  const [reason, setReason] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alreadyCancelled = cancelled === "1";

  async function go() {
    setBusy(true);
    setError(null);
    try {
      const { campaignId } = await call<{ campaignId: string }>(session, `/appointments/${id}/refill`, { method: "POST", body: { reason } });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.dismiss();
      router.push(`/campaign/${campaignId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't do that.");
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Card>
        <Text variant="label" tone="muted">
          {alreadyCancelled ? "Cancelled slot" : "Booking"}
        </Text>
        <Text variant="title" style={{ marginTop: space(1) }}>
          {label}
        </Text>
      </Card>
      {!alreadyCancelled ? (
        <View style={{ gap: space(2) }}>
          <Text style={{ fontWeight: "700" }}>Why did they cancel? (optional)</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>
            {REASONS.map((r) => (
              <Chip key={r} label={r} selected={reason === r} onPress={() => setReason(reason === r ? null : r)} />
            ))}
          </View>
        </View>
      ) : null}
      <Text tone="muted">
        Next you&apos;ll see who on your waitlist fits this slot and why. Nothing is sent until you tap Send.
      </Text>
      {error ? <ErrorNote message={error} /> : null}
      <Button label={alreadyCancelled ? "Find a replacement" : "Cancel and find a replacement"} onPress={go} loading={busy} />
      <Button label="Keep the booking" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
