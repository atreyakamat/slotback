import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useState } from "react";
import { Switch, TextInput, View } from "react-native";
import { Button, Card, Chip, ErrorNote, Row, Screen, Text } from "@/components/ui";
import { call, type Waitlist } from "@/lib/api";
import { DAY_LABELS } from "@/lib/format";
import { useSignedIn } from "@/lib/session";
import { useApi } from "@/lib/use-api";
import { radius, space, useTheme } from "@/theme";

const WINDOWS = [
  { key: "any", label: "Any time", from: "00:00", to: "23:59" },
  { key: "morning", label: "Mornings", from: "00:00", to: "12:00" },
  { key: "afternoon", label: "Afternoons", from: "12:00", to: "17:00" },
  { key: "evening", label: "Evenings", from: "17:00", to: "23:59" },
] as const;

export default function NewWaitlistEntry() {
  const t = useTheme();
  const { session } = useSignedIn();
  const { data } = useApi<Waitlist>("/waitlist");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [days, setDays] = useState<number[]>([]);
  const [win, setWin] = useState<(typeof WINDOWS)[number]["key"]>("any");
  const [whatsapp, setWhatsapp] = useState(false);
  const [sms, setSms] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const w = WINDOWS.find((x) => x.key === win)!;
    try {
      await call(session, "/waitlist", {
        method: "POST",
        body: { name, phone, serviceId, days, from: w.from, to: w.to, channels: [...(whatsapp ? ["WHATSAPP"] : []), ...(sms ? ["SMS"] : [])] },
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add them.");
      setBusy(false);
    }
  }

  const input = { color: t.text, borderColor: t.border, backgroundColor: t.surface, borderWidth: 1, borderRadius: radius.md, padding: space(3), fontSize: 16 } as const;

  return (
    <Screen>
      <Field label="Name">
        <TextInput value={name} onChangeText={setName} placeholder="Asha Naik" placeholderTextColor={t.muted} autoCapitalize="words" accessibilityLabel="Name" style={input} />
      </Field>
      <Field label="Mobile number">
        <TextInput value={phone} onChangeText={setPhone} placeholder="98765 43210" placeholderTextColor={t.muted} keyboardType="phone-pad" accessibilityLabel="Mobile number" style={input} />
      </Field>
      {data?.services.length ? (
        <Field label="What would they like?">
          <Wrap>
            <Chip label="Anything" selected={serviceId === null} onPress={() => setServiceId(null)} />
            {data.services.map((s) => (
              <Chip key={s.id} label={s.name} selected={serviceId === s.id} onPress={() => setServiceId(s.id)} />
            ))}
          </Wrap>
        </Field>
      ) : null}
      <Field label="Which days? Leave empty for any day.">
        <Wrap>
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <Chip key={d} label={DAY_LABELS[d]} selected={days.includes(d)} onPress={() => setDays(days.includes(d) ? days.filter((x) => x !== d) : [...days, d])} />
          ))}
        </Wrap>
      </Field>
      <Field label="What time of day?">
        <Wrap>
          {WINDOWS.map((w) => (
            <Chip key={w.key} label={w.label} selected={win === w.key} onPress={() => setWin(w.key)} />
          ))}
        </Wrap>
      </Field>
      <Card>
        <Text style={{ fontWeight: "700" }}>Did they agree to messages?</Text>
        <Text tone="muted" variant="small" style={{ marginTop: 2 }}>
          Only tick what they said yes to. You&apos;re recorded as the person who asked.
        </Text>
        <Toggle label="WhatsApp" value={whatsapp} onChange={setWhatsapp} />
        <Toggle label="SMS" value={sms} onChange={setSms} />
      </Card>
      {error ? <ErrorNote message={error} /> : null}
      <Button label="Add to waitlist" onPress={save} loading={busy} disabled={name.trim().length < 2 || phone.replace(/\D/g, "").length < 10} />
    </Screen>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space(2) }}>
      <Text style={{ fontWeight: "700" }}>{label}</Text>
      {children}
    </View>
  );
}

function Wrap({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space(2) }}>{children}</View>;
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const t = useTheme();
  return (
    <Row style={{ justifyContent: "space-between", marginTop: space(3) }}>
      <Text>{label}</Text>
      <Switch value={value} onValueChange={onChange} accessibilityLabel={`Agreed to ${label}`} trackColor={{ true: t.primary, false: t.raised }} />
    </Row>
  );
}
