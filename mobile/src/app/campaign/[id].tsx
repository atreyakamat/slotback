import Feather from "@expo/vector-icons/Feather";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Animated, Pressable, View } from "react-native";
import { Badge, Button, Card, Divider, ErrorNote, Loading, PulseDot, Row, Screen, Text } from "@/components/ui";
import { call, type Campaign } from "@/lib/api";
import { countdown, day, rupees, time } from "@/lib/format";
import { useSignedIn } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { space, useTheme } from "@/theme";

const OFFER: Record<string, { label: string; tone: "muted" | "success" | "warning" | "danger" | "highlight" }> = {
  QUEUED: { label: "Queued", tone: "muted" },
  SENT: { label: "Sent", tone: "muted" },
  DELIVERED: { label: "Delivered", tone: "muted" },
  OPENED: { label: "Opened", tone: "warning" },
  CLAIMED: { label: "Claimed", tone: "highlight" },
  LOST: { label: "Too late", tone: "muted" },
  EXPIRED: { label: "Expired", tone: "muted" },
  FAILED: { label: "Failed", tone: "danger" },
  SUPPRESSED: { label: "Opted out", tone: "muted" },
};

export default function CampaignScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, me } = useSignedIn();
  const t = useTheme();
  const tz = me.location.timezone;
  const { data, error, refreshing, reload } = useApi<Campaign>(`/campaigns/${id}`, { pollMs: 4000 });
  const [busy, setBusy] = useState<"send" | "stop" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const wasClaimed = useRef<boolean | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Celebrate the moment a slot gets claimed while the screen is open.
  useEffect(() => {
    if (!data) return;
    const claimed = data.status === "CLAIMED";
    if (wasClaimed.current === false && claimed) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    wasClaimed.current = claimed;
  }, [data]);

  if (!data) return error ? <Screen><ErrorNote message={error} onRetry={reload} /></Screen> : <Loading />;

  const running = data.status === "DRAFT" || data.status === "ACTIVE";
  const openOffers = data.offers.filter((o) => ["QUEUED", "SENT", "DELIVERED", "OPENED"].includes(o.status));
  const roundEndsAt = openOffers.length ? openOffers.reduce((a, o) => (o.expiresAt > a ? o.expiresAt : a), openOffers[0].expiresAt) : null;
  const canSend = running && data.nextUp.length > 0 && openOffers.length === 0;

  async function act(kind: "send" | "stop") {
    setBusy(kind);
    setActionError(null);
    try {
      await call(session, `/campaigns/${id}/${kind === "send" ? "round" : "stop"}`, { method: "POST" });
      if (kind === "send") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Couldn't do that.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      {data.status === "CLAIMED" ? <Claimed name={data.claimedBy ?? "A client"} value={rupees(data.valuePaise)} /> : null}

      <Card>
        <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text variant="title">{data.service}</Text>
            <Text tone="muted">
              {day(data.startAt, tz)}, {time(data.startAt, tz)} with {data.staff}
            </Text>
          </View>
          <Text variant="title">{rupees(data.valuePaise)}</Text>
        </Row>
        {data.status === "ACTIVE" && roundEndsAt ? (
          <Row style={{ marginTop: space(4) }}>
            <PulseDot />
            <Text style={{ fontWeight: "700" }}>Offered to {openOffers.length}. Links close in {countdown(roundEndsAt, now)}</Text>
          </Row>
        ) : null}
        {data.status === "EXPIRED" ? <Text tone="muted" style={{ marginTop: space(3) }}>Nobody claimed it before the slot got too close.</Text> : null}
        {data.status === "CANCELLED" ? <Text tone="muted" style={{ marginTop: space(3) }}>You stopped offering this slot.</Text> : null}
      </Card>

      {running ? (
        <Card>
          <Text variant="title">{data.offers.length ? "Next in line" : "Who fits this slot"}</Text>
          {data.nextUp.length ? (
            <>
              <Text tone="muted" style={{ marginTop: space(1) }}>
                {data.nextUp.join(", ")}
              </Text>
              <Text tone="muted" variant="small" style={{ marginTop: space(2) }}>
                {data.eligibleCount} on your waitlist fit. The first {data.batchSize} get the message; the first to tap gets the slot.
              </Text>
            </>
          ) : (
            <Text tone="muted" style={{ marginTop: space(1) }}>
              No one else on your waitlist fits this slot.
            </Text>
          )}
          {data.quietUntil ? (
            <Text tone="muted" variant="small" style={{ marginTop: space(2) }}>
              It&apos;s quiet hours, so messages go out at {time(data.quietUntil, tz)}.
            </Text>
          ) : null}
        </Card>
      ) : null}

      {actionError ? <ErrorNote message={actionError} /> : null}
      {canSend ? (
        <Button
          label={`Send to ${data.nextUp.length} ${data.nextUp.length === 1 ? "person" : "people"}`}
          variant="highlight"
          icon={<Feather name="send" size={18} color={t.onHighlight} />}
          loading={busy === "send"}
          onPress={() => act("send")}
        />
      ) : null}

      {data.offers.length > 0 ? (
        <Card>
          <Text variant="title">Offers</Text>
          {data.offers.map((o, i) => {
            const s = OFFER[o.status] ?? { label: o.status, tone: "muted" as const };
            return (
              <View key={o.id}>
                {i > 0 ? <Divider /> : <View style={{ height: space(3) }} />}
                <Row style={{ justifyContent: "space-between" }}>
                  <View>
                    <Text>{o.customer}</Text>
                    <Text tone="muted" variant="small">
                      {o.channel === "WHATSAPP" ? "WhatsApp" : o.channel === "SMS" ? "SMS" : "Email"}
                    </Text>
                  </View>
                  <Badge label={s.label} tone={s.tone} />
                </Row>
              </View>
            );
          })}
        </Card>
      ) : null}

      {data.excluded.length > 0 && running ? <Excluded items={data.excluded} /> : null}

      {running ? (
        <Button
          label="Stop offering this slot"
          variant="danger"
          loading={busy === "stop"}
          onPress={() =>
            Alert.alert("Stop offering?", "Open links stop working. You can't undo this.", [
              { text: "Keep going", style: "cancel" },
              { text: "Stop", style: "destructive", onPress: () => act("stop") },
            ])
          }
        />
      ) : null}
    </Screen>
  );
}

function Excluded({ items }: { items: { name: string; reason: string }[] }) {
  const [open, setOpen] = useState(false);
  const t = useTheme();
  return (
    <Card>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)}>
        <Row style={{ justifyContent: "space-between" }}>
          <Text style={{ fontWeight: "700" }}>Not offered ({items.length})</Text>
          <Feather name={open ? "chevron-up" : "chevron-down"} size={20} color={t.muted} />
        </Row>
      </Pressable>
      {open
        ? items.map((e, i) => (
            <View key={`${e.name}-${i}`} style={{ marginTop: space(3) }}>
              <Text>{e.name}</Text>
              <Text tone="muted" variant="small">
                {e.reason}
              </Text>
            </View>
          ))
        : null}
    </Card>
  );
}

function Claimed({ name, value }: { name: string; value: string }) {
  const [scale] = useState(() => new Animated.Value(0.6));
  useEffect(() => {
    Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }).start();
  }, [scale]);
  const t = useTheme();
  return (
    <Card tone="highlight" style={{ alignItems: "center", gap: space(2), paddingVertical: space(6) }}>
      <Animated.View style={{ transform: [{ scale }] }}>
        <Feather name="check-circle" size={52} color={t.onHighlight} />
      </Animated.View>
      <Text variant="display" tone="onHighlight" style={{ fontSize: 28, lineHeight: 32, textAlign: "center" }}>
        Slot refilled
      </Text>
      <Text tone="onHighlight" style={{ textAlign: "center" }}>
        {name} claimed it. {value} back on the books.
      </Text>
    </Card>
  );
}
