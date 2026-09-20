import { describe, expect, it } from "vitest";
import {
  addMicro,
  currencyDecimals,
  formatMoney,
  fromMicro,
  mulMicro,
  percentOfMicro,
  roundHalfAwayFromZero,
  taxIncludedInMicro,
  toMicro,
} from "../money";

describe("roundHalfAwayFromZero", () => {
  it("rounds positive halves up", () => {
    expect(roundHalfAwayFromZero(0.5)).toBe(1);
    expect(roundHalfAwayFromZero(2.5)).toBe(3);
  });
  it("rounds negative halves symmetrically (away from zero, not toward +Infinity)", () => {
    expect(roundHalfAwayFromZero(-0.5)).toBe(-1);
    expect(roundHalfAwayFromZero(-2.5)).toBe(-3);
  });
});

describe("toMicro / fromMicro round-trip", () => {
  it("classic float traps resolve exactly", () => {
    expect(fromMicro(addMicro(toMicro(0.1), toMicro(0.2)))).toBe(0.3);
    expect(fromMicro(toMicro(1.005))).toBe(1.005);
  });
  it("clamps absurd magnitudes instead of overflowing", () => {
    expect(fromMicro(toMicro(1e15))).toBe(1e9);
  });
  it("treats non-finite input as zero", () => {
    expect(toMicro(NaN)).toBe(0);
    expect(toMicro(undefined)).toBe(0);
    expect(toMicro("not a number")).toBe(0);
  });
});

describe("mulMicro", () => {
  it("multiplies rate by a decimal quantity without float drift", () => {
    // 3 x 0.1 in raw floats is 0.30000000000000004
    const total = mulMicro(toMicro(3), 0.1);
    expect(fromMicro(total)).toBe(0.3);
  });
  it("handles large quantities", () => {
    const total = mulMicro(toMicro(19.99), 1000);
    expect(fromMicro(total)).toBe(19990);
  });
});

describe("percentOfMicro", () => {
  it("computes a simple percentage", () => {
    expect(fromMicro(percentOfMicro(toMicro(200), 18))).toBe(36);
  });
  it("handles fractional percentages", () => {
    expect(fromMicro(percentOfMicro(toMicro(1000), 7.25))).toBe(72.5);
  });
  it("returns zero for zero base", () => {
    expect(fromMicro(percentOfMicro(0, 50))).toBe(0);
  });
});

describe("taxIncludedInMicro", () => {
  it("extracts tax so net + tax === gross exactly", () => {
    const gross = toMicro(118);
    const tax = taxIncludedInMicro(gross, 18);
    const net = gross - tax;
    expect(net + tax).toBe(gross);
    expect(fromMicro(net)).toBe(100);
    expect(fromMicro(tax)).toBe(18);
  });
  it("returns zero tax for a zero rate", () => {
    const gross = toMicro(500);
    expect(taxIncludedInMicro(gross, 0)).toBe(0);
  });
});

describe("formatMoney", () => {
  it("formats using Intl for a known currency", () => {
    expect(formatMoney(1234.5, "USD", "en-US")).toBe("$1,234.50");
  });
  it("falls back gracefully for an unknown currency code", () => {
    expect(formatMoney(10, "NOTACODE", "en-US")).toContain("10.00");
  });
});

describe("currencyDecimals", () => {
  it("returns 2 for USD and 0 for JPY", () => {
    expect(currencyDecimals("USD")).toBe(2);
    expect(currencyDecimals("JPY")).toBe(0);
  });
});
