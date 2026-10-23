"use client";

import { QrCode, Smartphone } from "lucide-react";
import { useActionState, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormMessage, SubmitButton } from "@/components/ui/form";
import { formatDate } from "@/lib/time";
import { createPairingAction, revokeDeviceAction, type PairingState } from "@/server/actions/devices";
import { idle } from "@/server/actions/result-client";

type Device = { id: string; deviceName: string | null; pairedAt: Date | null; lastUsedAt: Date | null };

function useSecondsLeft(until: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!until) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [until]);
  return until ? Math.max(0, Math.round((new Date(until).getTime() - now) / 1000)) : 0;
}

export function PhoneApp({ devices, timezone }: { devices: Device[]; timezone: string }) {
  const [pairing, setPairing] = useState<PairingState | null>(null);
  const [pending, start] = useTransition();
  const [revokeState, revoke] = useActionState(revokeDeviceAction, idle);
  const left = useSecondsLeft(pairing?.expiresAt);
  const show = () => start(async () => setPairing(await createPairingAction()));

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <Card className="grid content-start gap-4 p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-highlight text-highlight-foreground">
            <Smartphone className="size-5" aria-hidden />
          </span>
          <h2 className="font-display text-lg">Connect your phone</h2>
        </div>
        <ol className="grid list-decimal gap-2 pl-5 text-sm text-muted">
          <li>Open the SlotBack app on your phone. While it&apos;s in testing, open it in Expo Go.</li>
          <li>Tap <span className="font-medium text-foreground">Scan to connect</span>.</li>
          <li>Show the QR code below and point your phone at it.</li>
        </ol>
        <p className="text-sm text-muted">The phone signs in as you. The code works once, for 10 minutes.</p>
        {pairing?.svg && left > 0 ? (
          <div className="grid justify-items-center gap-2">
            <div
              className="w-56 rounded-2xl border bg-white p-3 [&_svg]:h-auto [&_svg]:w-full"
              role="img"
              aria-label="QR code to connect the SlotBack app"
              dangerouslySetInnerHTML={{ __html: pairing.svg }}
            />
            <p className="text-xs text-muted" aria-live="polite">
              Works for {Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}
            </p>
          </div>
        ) : (
          <Button onClick={show} disabled={pending} className="justify-self-start">
            <QrCode /> {pending ? "Making a code…" : pairing ? "Show a new code" : "Show QR code"}
          </Button>
        )}
      </Card>

      <section aria-labelledby="devices" className="grid content-start gap-3">
        <h2 id="devices" className="text-sm font-medium">
          Your connected phones
        </h2>
        <FormMessage state={revokeState} />
        {devices.length === 0 ? (
          <Card className="p-6 text-sm text-muted">No phones yet.</Card>
        ) : (
          <Card className="divide-y">
            {devices.map((d) => (
              <div key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{d.deviceName ?? "Phone"}</p>
                  <p className="text-sm text-muted">
                    Connected {d.pairedAt ? formatDate(d.pairedAt, timezone) : ""}
                    {d.lastUsedAt ? ` · last used ${formatDate(d.lastUsedAt, timezone)}` : ""}
                  </p>
                </div>
                <form action={revoke}>
                  <input type="hidden" name="id" value={d.id} />
                  <SubmitButton variant="ghost" size="sm" pendingLabel="Signing out…">
                    Sign out
                  </SubmitButton>
                </form>
              </div>
            ))}
          </Card>
        )}
        <p className="text-xs text-muted">Lost a phone? Sign it out here. Removing someone from the team signs out their phones too.</p>
      </section>
    </div>
  );
}
