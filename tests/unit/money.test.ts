import { describe, expect, it } from "vitest";
import { formatPaise, rupeesToPaise } from "@/lib/money";

describe("money", () => {
  it("formats paise as Indian rupees with lakh grouping", () => {
    expect(formatPaise(250000)).toBe("₹2,500");
    expect(formatPaise(12345600)).toBe("₹1,23,456");
  });

  it("converts rupees to integer paise", () => {
    expect(rupeesToPaise(1199.5)).toBe(119950);
  });
});
