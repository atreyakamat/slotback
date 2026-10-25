import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Check } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { HoursStep, RulesStep, ServicesStep, StaffStep } from "@/components/onboarding/steps";
import { canManage, requireMember } from "@/server/auth/dal";
import { db } from "@/server/db";
import { SUGGESTED_SERVICES, VERTICAL_OPTIONS, type Vertical } from "@/server/domain/verticals";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Set up your business" };

const STEPS = [
  { key: "hours", title: "When are you open?", body: "SlotBack only offers openings inside your hours." },
  { key: "services", title: "What do you offer?", body: "We've suggested a few to start. Untick, rename or reprice anything." },
  { key: "staff", title: "Who takes appointments?", body: "Add your team, or rooms and chairs if that's how you book." },
  { key: "rules", title: "How should openings be offered?", body: "The rules SlotBack follows when a client cancels." },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

export default function OnboardingPage({ searchParams }: PageProps<"/onboarding">) {
  return (
    <Suspense fallback={<AuthShell>{null}</AuthShell>}>
      <Wizard searchParams={searchParams} />
    </Suspense>
  );
}

async function Wizard({ searchParams }: { searchParams: PageProps<"/onboarding">["searchParams"] }) {
  const member = await requireMember();
  if (!canManage(member)) redirect("/app");
  const { step: raw } = await searchParams;
  const index = Math.max(0, STEPS.findIndex((s) => s.key === raw));
  const step = STEPS[index];

  const [org, location, services, staff] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: member.organization.id }, select: { vertical: true, onboardedAt: true } }),
    db.location.findUniqueOrThrow({ where: { id: member.location.id } }),
    db.service.findMany({ where: { locationId: member.location.id }, orderBy: { createdAt: "asc" }, select: { name: true, durationMinutes: true, pricePaise: true } }),
    db.resource.findMany({ where: { locationId: member.location.id }, orderBy: { createdAt: "asc" }, select: { name: true } }),
  ]);
  if (org.onboardedAt) redirect("/app");

  const vertical = (VERTICAL_OPTIONS.find((v) => v.value === org.vertical)?.value ?? "other") as Vertical;
  const have = new Set(services.map((s) => s.name.toLowerCase()));

  return (
    <AuthShell aside={<Progress active={index} />}>
      <p className="text-sm font-medium text-accent">
        Step {index + 1} of {STEPS.length} · {member.organization.name}
      </p>
      <h1 className="mt-2 font-display text-3xl tracking-tight">{step.title}</h1>
      <p className="mt-2 text-muted">{step.body}</p>
      <div className="mt-8">{renderStep(step.key)}</div>
    </AuthShell>
  );

  function renderStep(key: StepKey) {
    switch (key) {
      case "hours":
        return <HoursStep hours={location.businessHours as Record<string, { open: string; close: string }[]>} />;
      case "services":
        return (
          <ServicesStep
            existing={services.map((s) => ({ name: s.name, durationMinutes: s.durationMinutes, priceRupees: s.pricePaise / 100 }))}
            suggested={SUGGESTED_SERVICES[vertical].filter((s) => !have.has(s.name.toLowerCase())).map((s) => ({ ...s, on: true }))}
          />
        );
      case "staff":
        return <StaffStep existing={staff.map((r) => r.name)} initial={staff.length === 0 ? [member.user.name.split(" ")[0]] : []} />;
      case "rules":
        return <RulesStep rules={location} />;
    }
  }
}

function Progress({ active }: { active: number }) {
  return (
    <>
      <p className="font-display text-3xl leading-tight tracking-tight">Ten minutes now, and every cancellation after this has a plan.</p>
      <ol className="mt-10 grid gap-4">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                i < active ? "bg-brand-lime text-brand-ink" : i === active ? "bg-brand-cream text-brand-ink" : "border border-brand-cream/25 text-brand-cream/60",
              )}
            >
              {i < active ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={i === active ? "font-semibold" : "text-brand-cream/70"}>{s.title}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
