import { describe, expect, it } from "vitest";
import { parseCsv } from "@/lib/csv";
import { mapImportRows } from "@/server/domain/waitlist-growth";

describe("parseCsv", () => {
  it("handles quotes, embedded commas and newlines, CRLF and a BOM", () => {
    const text = '﻿Name,Phone,Notes\r\n"Naik, Asha",98765 43210,"likes ""early"" slots\nand Saturdays"\r\n\r\nRohan,91234 56789,';
    expect(parseCsv(text)).toEqual([
      ["Name", "Phone", "Notes"],
      ["Naik, Asha", "98765 43210", 'likes "early" slots\nand Saturdays'],
      ["Rohan", "91234 56789", ""],
    ]);
  });

  it("detects semicolon and tab separators", () => {
    expect(parseCsv("Name;Phone\nAsha;9876543210")).toEqual([["Name", "Phone"], ["Asha", "9876543210"]]);
    expect(parseCsv("Name\tPhone\nAsha\t9876543210")).toEqual([["Name", "Phone"], ["Asha", "9876543210"]]);
  });
});

describe("mapImportRows", () => {
  it("finds columns by common header names, in any order", () => {
    const rows = mapImportRows([["Mobile", "Client Name", "Treatment"], ["9876543210", "Asha", "Facial"]]);
    expect(rows).toEqual([{ line: 2, name: "Asha", phone: "9876543210", email: "", service: "Facial" }]);
  });

  it("needs a name and a phone column", () => {
    expect(() => mapImportRows([["Name", "Email"]])).toThrow(/Phone/);
  });
});
