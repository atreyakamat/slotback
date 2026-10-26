"use client";

import { ArrowRight, Check } from "lucide-react";
import { useState } from "react";

const TYPES = ["Skin or aesthetic clinic", "Physiotherapy", "Nails or lashes", "Dental clinic", "Salon or spa", "Something else"];

type Status = "idle" | "sending" | "sent" | "error";

const field =
  "mt-2 w-full rounded-2xl border border-cream/15 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/30 transition-colors focus:border-lime focus:outline-none";

/** Demo request. Netlify Forms stores the submissions; no database is involved. */
export function DemoForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(data as unknown as Record<string, string>).toString(),
      });
      setStatus(res.ok ? "sent" : "error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div className="flex min-h-[26rem] flex-col items-start justify-center gap-5" role="status">
        <span className="flex size-14 items-center justify-center rounded-full bg-lime text-ink">
          <Check className="size-7" />
        </span>
        <p className="stretch text-4xl leading-none [--wdth:120]">Got it. Talk soon.</p>
        <p className="text-cream/70">We’ll message you on WhatsApp within a day to pick a time.</p>
      </div>
    );
  }

  return (
    <form name="demo" onSubmit={onSubmit} className="grid gap-5">
      <input type="hidden" name="form-name" value="demo" />
      <p className="hidden">
        <label>
          Leave this empty <input name="company_site" tabIndex={-1} autoComplete="off" />
        </label>
      </p>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-cream/70">
          Your name
          <input name="name" required maxLength={80} autoComplete="name" className={field} placeholder="Shilpa Naik" />
        </label>
        <label className="text-sm text-cream/70">
          Business name
          <input name="business" required maxLength={100} autoComplete="organization" className={field} placeholder="Glow Studio" />
        </label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm text-cream/70">
          WhatsApp number
          <input name="whatsapp" required type="tel" inputMode="tel" maxLength={20} autoComplete="tel" pattern="[0-9+\s\-]{8,20}" className={field} placeholder="+91 98xxx xxxxx" />
        </label>
        <label className="text-sm text-cream/70">
          City
          <input name="city" maxLength={60} autoComplete="address-level2" className={field} placeholder="Panjim" />
        </label>
      </div>
      <label className="text-sm text-cream/70">
        What kind of business?
        <select name="type" required defaultValue="" className={field}>
          <option value="" disabled>
            Pick one
          </option>
          {TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        disabled={status === "sending"}
        className="group mt-2 inline-flex h-14 items-center justify-center gap-2 rounded-full bg-lime px-8 font-semibold text-ink transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
      >
        {status === "sending" ? "Sending…" : "Book my demo"}
        <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
      </button>
      {status === "error" ? (
        <p className="text-sm text-coral" role="alert">
          That didn’t send. Please try again, or DM us on Instagram at @slotback.app.
        </p>
      ) : null}
    </form>
  );
}
