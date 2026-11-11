import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { TextInput, View } from "react-native";
import { Badge, Button, Card, Divider, ErrorNote, Loading, Row, Screen, Text } from "@/components/ui";
import type { Waitlist } from "@/lib/api";
import { DAY_LABELS, minutesLabel } from "@/lib/format";
import { useApi } from "@/lib/use-api";
import { radius, space, useTheme } from "@/theme";

export default function WaitlistScreen() {
  const t = useTheme();
  const { data, error, refreshing, reload } = useApi<Waitlist>("/waitlist");
  const [q, setQ] = useState("");
  if (!data && !error) return <Loading />;
  const entries = (data?.entries ?? []).filter((e) => !q || e.name.toLowerCase().includes(q.toLowerCase()) || e.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "") || "~"));

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Button label="Add a client" icon={<Feather name="user-plus" size={18} color={t.onPrimary} />} onPress={() => router.push("/waitlist-new")} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: space(2), backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: radius.md, paddingHorizontal: space(3) }}>
        <Feather name="search" size={18} color={t.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Search by name or number"
          placeholderTextColor={t.muted}
          accessibilityLabel="Search the waitlist"
          style={{ flex: 1, color: t.text, fontSize: 16, paddingVertical: space(3) }}
        />
      </View>
      {error ? <ErrorNote message={error} onRetry={reload} /> : null}
      {data ? (
        <Card>
          <Text variant="title">
            {data.entries.length} waiting
          </Text>
          {entries.length === 0 ? (
            <Text tone="muted" style={{ marginTop: space(3) }}>
              {q ? "No one matches that search." : "No one is waiting yet. Add clients here, or share your QR code from the website."}
            </Text>
          ) : (
            entries.map((e, i) => (
              <View key={e.id}>
                {i > 0 ? <Divider /> : <View style={{ height: space(3) }} />}
                <Row style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ fontWeight: "600" }}>{e.name}</Text>
                    <Text tone="muted" variant="small">
                      {e.service ?? "Any service"} · {e.days.length ? e.days.map((d) => DAY_LABELS[d]).join(", ") : "Any day"}
                      {e.earliestMinute > 0 || e.latestMinute < 1440 ? ` · ${minutesLabel(e.earliestMinute)}–${minutesLabel(e.latestMinute)}` : ""}
                    </Text>
                  </View>
                  {e.channels.length ? (
                    <Badge label={e.channels.map((c) => (c === "WHATSAPP" ? "WhatsApp" : c === "SMS" ? "SMS" : "Email")).join(" · ")} tone="success" />
                  ) : (
                    <Badge label="No consent" tone="warning" />
                  )}
                </Row>
              </View>
            ))
          )}
        </Card>
      ) : null}
    </Screen>
  );
}
