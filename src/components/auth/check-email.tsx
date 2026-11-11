import { MailCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";

/** Shown after a sign-in link is requested. On localhost without email, the link is offered directly. */
export function CheckEmail({ message, devLink, onRetry }: { message?: string; devLink?: string; onRetry: () => void }) {
  return (
    <div role="status" className="grid gap-5">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-highlight text-highlight-foreground">
        <MailCheck className="size-6" aria-hidden />
      </span>
      <div>
        <h2 className="font-display text-2xl">Check your email</h2>
        <p className="mt-2 text-muted">{message}</p>
      </div>
      {devLink ? (
        <div className="rounded-xl border border-dashed p-4 text-sm">
          <p className="text-muted">Local development: emails aren&apos;t sent, so here is the link.</p>
          <a href={devLink} className={buttonVariants({ className: "mt-3 w-full" })}>
            Open sign-in link
          </a>
        </div>
      ) : null}
      <button type="button" onClick={onRetry} className="justify-self-start text-sm text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent">
        Use a different email
      </button>
    </div>
  );
}
