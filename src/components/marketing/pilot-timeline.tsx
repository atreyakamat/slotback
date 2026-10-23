const STEPS = [
  {
    when: "Day 1",
    title: "We set it up with you",
    body: "Your services, staff and hours, plus the waitlist you already have. Clients are asked once, clearly, if they want last-minute offers.",
  },
  {
    when: "Week 1",
    title: "Your first refills",
    body: "Your team uses “Cancel and refill” as cancellations come in. You watch openings fill on the dashboard, live.",
  },
  {
    when: "Week 4",
    title: "Review the numbers together",
    body: "Recovered revenue, fill rate and time to refill, from your own data. Then you decide whether to keep going.",
  },
];

/** What a pilot looks like, from first call to decision. */
export function PilotTimeline() {
  return (
    <ol className="grid gap-4 md:grid-cols-3">
      {STEPS.map((s, i) => (
        <li key={s.when} className="reveal relative rounded-3xl border bg-surface p-6" style={{ animationRangeStart: `entry ${5 + i * 10}%` }}>
          <span className="relative flex size-11 items-center justify-center rounded-full bg-highlight font-display text-highlight-foreground">
            {i + 1}
          </span>
          <p className="mt-5 text-sm font-medium text-accent">{s.when}</p>
          <h3 className="mt-1 text-xl font-semibold">{s.title}</h3>
          <p className="mt-2 text-sm text-muted">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}
