import { describe, expect, it } from "vitest";
import { maskPhone, normalizeIndianMobile } from "@/lib/phone";

describe("normalizeIndianMobile", () => {
  it.each([
    ["9876543210", "+91 98765 43210"],
    ["98765 43210", "+91 98765 43210"],
    ["+91 98765-43210", "+91 98765 43210"],
    ["919876543210", "+91 98765 43210"],
    ["09876543210", "+91 98765 43210"],
    ["+91 90000 00001", "+91 90000 00001"],
  ])("normalises %s", (input, expected) => {
    expect(normalizeIndianMobile(input)).toBe(expected);
  });

  it.each(["", "12345", "5876543210", "98765432101", "+44 7911 123456", "98765abcde"])("rejects %s", (input) => {
    expect(normalizeIndianMobile(input)).toBeNull();
  });
});

describe("maskPhone", () => {
  it("keeps only the last four digits", () => {
    expect(maskPhone("+91 98765 43210")).toBe("+91 ••••• •3210");
  });
});
