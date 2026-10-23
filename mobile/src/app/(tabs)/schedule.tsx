import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { ActionSheetIOS, Alert, Platform, Pressable, View } from "react-native";
import { Badge, Card, Divider, ErrorNote, Loading, Row, Screen, Text } from "@/components/ui";
import type { Schedule } from "@/lib/api";
import { addDays, dateKey, day, time } from "@/lib/format";
import { useSignedIn } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { radius, space, useTheme } from "@/theme";

type Appt = Schedule["staff"][number]["appointments"][number];

const STATUS: Record<Appt["status"], { label: string; tone: "muted" | "success" | "warning" | "danger" }> = {
  BOOKED: { label: "Booked", tone: "muted" },
  CANCELLED: { label: "Cancelled", tone: "danger" },
  COMPLETED: { label: "Done", tone: "success" },
  NO_SHOW: { label: "No-show", tone: "warning" },
};

export default function ScheduleScreen() {
  const { me } = useSignedIn();
  const t = useTheme();
  const tz = me.location.timezone;
  const today = dateKey(new Date(), tz);
  const [date, setDate] = useState(today);
  const { data, error, refreshing, reload } = useApi<Schedule>(`/schedule?date=${date}`);

  function openAppointment(a: Appt, staff: string) {
    const title = `${a.customer} · ${a.service}`;
    const message = `${time(a.startAt, tz)} with ${staff}`;
    const canRefill = a.status === "BOOKED" || a.status === "CANCELLED";
    if (!canRefill) return;
    const refill = () => router.push({ pathname: "/refill/[id]", params: { id: a.id, label: `${title}, ${message}`, cancelled: a.status === "CANCELLED" ? "1" : "0" } });
    const action = a.status === "CANCELLED" ? "Offer this slot to the waitlist" : "Cancel and refill";
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions({ title, message, options: [action, "Close"], cancelButtonIndex: 1 }, (i) => i === 0 && refill());
    } else {
      Alert.alert(title, message, [{ text: "Close", style: "cancel" }, { text: action, onPress: refill }]);
    }
  }

  const empty = data && data.staff.every((s) => s.appointments.length === 0);

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <Row style={{ justifyContent: "space-between" }}>
        <DayButton icon="chevron-left" label="Previous day" onPress={() => setDate(addDays(date, -1))} />
        <Pressable accessibilityRole="button" accessibilityHint="Jump to today" onPress={() => setDate(today)} style={{ alignItems: "center" }}>
          <Text variant="title">{day(`${date}T12:00:00Z`, "UTC")}</Text>
          <Text tone="muted" variant="small">
            {date === today ? "Today" : "Tap for today"}
          </Text>
        </Pressable>
        <DayButton icon="chevron-right" label="Next day" onPress={() => setDate(addDays(date, 1))} />
      </Row>

      {error ? <ErrorNote message={error} onRetry={reload} /> : null}
      {!data && !error ? <Loading /> : null}
      {data && data.hours.length === 0 ? <Text tone="muted">Closed this day.</Text> : null}
      {empty ? (
        <Card>
          <Text tone="muted">No appointments on this day.</Text>
        </Card>
      ) : null}

      {data?.staff
        .filter((s) => s.appointments.length > 0)
        .map((s) => (
          <Card key={s.id}>
            <Text variant="title">{s.name}</Text>
            {s.appointments.map((a, i) => {
              const st = STATUS[a.status];
              return (
                <View key={a.id}>
                  {i > 0 ? <Divider /> : <View style={{ height: space(3) }} />}
                  <Pressable accessibilityRole="button" accessibilityLabel={`${time(a.startAt, tz)}, ${a.customer}, ${a.service}, ${st.label}`} onPress={() => openAppointment(a, s.name)}>
                    <Row>
                      <View style={{ width: 4, alignSelf: "stretch", borderRadius: 2, backgroundColor: a.recovered ? t.highlight : a.status === "CANCELLED" ? t.danger : t.border }} />
                      <Text style={{ width: 70, fontWeight: "700", textDecorationLine: a.status === "CANCELLED" ? "line-through" : "none" }}>{time(a.startAt, tz)}</Text>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text>{a.customer}</Text>
                        <Text tone="muted" variant="small">
                          {a.service}
                        </Text>
                      </View>
                      {a.recovered ? <Badge label="Recovered" tone="highlight" /> : a.status !== "BOOKED" ? <Badge label={st.label} tone={st.tone} /> : null}
                    </Row>
                  </Pressable>
                </View>
              );
            })}
          </Card>
        ))}
      <Text tone="muted" variant="small" style={{ textAlign: "center" }}>
        Tap a booking to cancel it and offer the slot to your waitlist.
      </Text>
    </Screen>
  );
}

function DayButton({ icon, label, onPress }: { icon: "chevron-left" | "chevron-right"; label: string; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({ width: 44, height: 44, borderRadius: radius.pill, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? t.raised : t.surface, borderWidth: 1, borderColor: t.border })}
    >
      <Feather name={icon} size={22} color={t.text} />
    </Pressable>
  );
}
