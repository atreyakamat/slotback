import { describe, expect, it } from "vitest";
import { MESSAGE_TEMPLATES, cancellationPolicy } from "@/lib/resources";

describe("rescue kit templates", () => {
  const offer = MESSAGE_TEMPLATES.find((t) => t.key === "offer")!;

  it("fills in the business and the open slot", () => {
    expect(offer.render({ business: "Glow Studio", slot: "4:30 PM today" })).toContain("Glow Studio: 4:30 PM today");
  });

  it("falls back to neutral wording when fields are empty", () => {
    expect(offer.render({ business: "  ", slot: "" })).toContain("our studio: today");
  });
});

describe("cancellation policy", () => {
  it("states the notice window and the late rule", () => {
    const text = cancellationPolicy({ notice: 12, rule: "half", tone: "firm" });
    expect(text).toContain("at least 12 hours' notice");
    expect(text).toContain("charged 50% of the service");
  });

  it("never mentions a charge when the rule is a request only", () => {
    const text = cancellationPolicy({ notice: 24, rule: "none", tone: "friendly" });
    expect(text).not.toMatch(/charged|deposit/);
  });
});
