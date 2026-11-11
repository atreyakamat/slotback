import { ExternalLink, FlaskConical, QrCode } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClaimQr } from "./claim-qr";
import { CHANNEL_LABEL } from "./labels";
import type { Channel, MessageStatus } from "@/generated/prisma/enums";

type Message = { id: string; body: string; status: MessageStatus; channel: Channel; offer: { customer: { name: string } } | null };

/** Demo workspaces only: the simulated messages, with their claim links, so anyone can play the customer. */
export function DemoInbox({ messages }: { messages: Message[] }) {
  if (messages.length === 0) return null;
  return (
    <Card className="border-dashed">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-4" aria-hidden /> Demo inbox
          </CardTitle>
          <CardDescription className="mt-1">Simulated messages. Nothing was sent to a real phone. Open a link to act as that customer.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3">
        {messages.map((m) => {
          const link = m.body.match(/https?:\/\/\S+\/c\/[A-Za-z0-9_-]{43}/)?.[0];
          return (
            <div key={m.id} className="rounded-lg border bg-surface-raised p-3 text-sm">
              <div className="mb-1 flex items-center justify-between text-xs text-muted">
                <span className="font-medium text-foreground">{m.offer?.customer.name}</span>
                <span>
                  {CHANNEL_LABEL[m.channel]} · {m.status.toLowerCase()}
                </span>
              </div>
              {link ? (
                <>
                  <a
                    href={new URL(link).pathname}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent"
                    aria-label={`Open claim link as ${m.offer?.customer.name}`}
                  >
                    Open claim link <ExternalLink className="size-3.5" aria-hidden />
                  </a>
                  <details className="group mt-1">
                    <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-muted hover:text-foreground">
                      <QrCode className="size-3.5" aria-hidden /> Open on a phone
                    </summary>
                    <ClaimQr url={link} name={m.offer?.customer.name ?? "the customer"} />
                  </details>
                </>
              ) : null}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
