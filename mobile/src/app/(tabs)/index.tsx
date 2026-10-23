import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { Badge, Card, Divider, ErrorNote, FadeIn, Loading, PulseDot, Row, Screen, Text } from "@/components/ui";
import type { Today } from "@/lib/api";
import { day, rupees, time } from "@/lib/format";
import { useSignedIn } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { space, useTheme } from "@/theme";

export default function TodayScreen() {
  const { me } = useSignedIn();
  const t = useTheme();
  const { data, error, refreshing, reload } = useApi<Today>("/today", { pollMs: 20_000 });
  const tz = me.location.timezone;
  if (!data && !error) return <Loading />;

  return (
    <Screen refreshing={refreshing} onRefresh={reload}>
      <View style={{ gap: space(1) }}>
        <Text tone="muted">{me.business.name}</Text>
        <Text variant="display">Hello, {me.user.name.split(" ")[0]}</Text>
      </View>
      {error ? <ErrorNote message={error} onRetry={reload} /> : null}
      {data ? (
        <>
          <Card tone="highlight">
            <Text variant="label" tone="onHighlight" style={{ opacity: 0.7 }}>
              Recovered this week
            </Text>
            <Text variant="display" tone="onHighlight" style={{ fontSize: 44, lineHeight: 50, marginTop: space(1) }}>
              {rupees(data.week.recoveredPaise)}
            </Text>
            <Row style={{ marginTop: space(2), gap: space(5) }}>
              <Stat label="slots refilled" value={String(data.week.claimed)} />
              <Stat label="fill rate" value={data.week.fillRate === null ? "–" : `${Math.round(data.week.fillRate * 100)}%`} />
              <Stat label="to refill" value={data.week.medianMinutesToFill === null ? "–" : `${data.week.medianMinutesToFill} min`} />
            </Row>
          </Card>

          {data.live.length > 0 ? (
            <View style={{ gap: space(2) }}>
              <Row>
                <PulseDot />
                <Text variant="title">Being offered now</Text>
              </Row>
              {data.live.map((c, i) => (
                <FadeIn key={c.id} delay={i * 60}>
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/campaign/${c.id}`)}>
                    <Card>
                      <Row style={{ justifyContent: "space-between" }}>
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontWeight: "700" }}>
                            {c.service} · {time(c.startAt, tz)}
                          </Text>
                          <Text tone="muted" variant="small">
                            with {c.staff} · {c.offers} offer{c.offers === 1 ? "" : "s"} sent
                          </Text>
                        </View>
                        <Feather name="chevron-right" size={20} color={t.muted} />
                      </Row>
                    </Card>
                  </Pressable>
                </FadeIn>
              ))}
            </View>
          ) : null}

          <Row style={{ gap: space(3) }}>
            <MiniStat label="Booked today" value={data.stats.bookedToday} />
            <MiniStat label="On the waitlist" value={data.stats.activeWaitlist} />
          </Row>

          <Card>
            <Row style={{ justifyContent: "space-between" }}>
              <Text variant="title">Coming up</Text>
              <Pressable accessibilityRole="link" onPress={() => router.push("/schedule")}>
                <Text tone="muted" variant="small">
                  Schedule
                </Text>
              </Pressable>
            </Row>
            {data.next.length === 0 ? (
              <Text tone="muted" style={{ marginTop: space(3) }}>
                Nothing else booked today.
              </Text>
            ) : (
              data.next.map((a, i) => (
                <View key={a.id}>
                  {i > 0 ? <Divider /> : <View style={{ height: space(3) }} />}
                  <Row>
                    <Text style={{ width: 72, fontWeight: "700" }}>{time(a.startAt, tz)}</Text>
                    <View style={{ flex: 1 }}>
                      <Text>{a.customer}</Text>
                      <Text tone="muted" variant="small">
                        {a.service} · {a.staff}
                      </Text>
                    </View>
                  </Row>
                </View>
              ))
            )}
          </Card>

          {data.recent.length > 0 ? (
            <Card>
              <Text variant="title">Recent refills</Text>
              {data.recent.map((r, i) => (
                <View key={r.id}>
                  {i > 0 ? <Divider /> : <View style={{ height: space(3) }} />}
                  <Row style={{ justifyContent: "space-between" }}>
                    <View style={{ flex: 1 }}>
                      <Text>{r.customerName}</Text>
                      <Text tone="muted" variant="small">
                        {r.serviceName} · {day(r.startAt, tz)}
                      </Text>
                    </View>
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text style={{ fontWeight: "700" }}>{rupees(r.valuePaise)}</Text>
                      <Badge label={`${r.minutesToFill} min`} tone="success" />
                    </View>
                  </Row>
                </View>
              ))}
            </Card>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text tone="onHighlight" style={{ fontWeight: "800", fontSize: 18 }}>
        {value}
      </Text>
      <Text tone="onHighlight" variant="small" style={{ opacity: 0.7 }}>
        {label}
      </Text>
    </View>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={{ flex: 1 }}>
      <Card>
        <Text variant="display" style={{ fontSize: 28, lineHeight: 32 }}>
          {value}
        </Text>
        <Text tone="muted" variant="small">
          {label}
        </Text>
      </Card>
    </View>
  );
}
