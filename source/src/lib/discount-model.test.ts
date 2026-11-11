import { describe, expect, it } from "vitest";
import { calculatePackage, parsePrice } from "./discount-model";

const all = (months: number) =>
  calculatePackage({
    services: [
      { id: "diagnostics", price: "15 000" },
      { id: "strategy", price: "45 000" },
      { id: "support", price: "80 000" },
    ],
    months,
  });

describe("discount model (ТЗ §06 control examples)", () => {
  it("diagnostics + strategy: 60 000 ₽, 5%, minimum 57 000 ₽", () => {
    const r = calculatePackage({ services: [{ id: "diagnostics", price: 15000 }, { id: "strategy", price: 45000 }], months: 12 });
    expect(r.ok && [r.baseTotal, r.discountPercent, r.minimumPrice]).toEqual([60000, 5, 57000]);
  });
  it("all services, 3 months: 300 000 ₽, 15%, 255 000 ₽", () => {
    const r = all(3);
    expect(r.ok && [r.baseTotal, r.discountPercent, r.minimumPrice]).toEqual([300000, 15, 255000]);
  });
  it("all services, 6 months: 540 000 ₽, 20%, 432 000 ₽", () => {
    const r = all(6);
    expect(r.ok && [r.baseTotal, r.discountPercent, r.minimumPrice]).toEqual([540000, 20, 432000]);
  });
  it("all services, 12 months: 1 020 000 ₽, capped 25%, 765 000 ₽", () => {
    const r = all(12);
    expect(r.ok && [r.baseTotal, r.discountPercent, r.minimumPrice]).toEqual([1020000, 25, 765000]);
  });
  it("duration bonus only applies with support selected", () => {
    const r = calculatePackage({ services: [{ id: "strategy", price: 45000 }], months: 12 });
    expect(r.ok && r.discountPercent).toBe(0);
  });
  it("duplicate service does not raise the discount", () => {
    const r = calculatePackage({ services: [{ id: "strategy", price: 1 }, { id: "strategy", price: 1 }] });
    expect(r.ok).toBe(false);
  });
  it("price must be an integer from 1 to 10 000 000", () => {
    expect(parsePrice("0")).toBeNull();
    expect(parsePrice("-5")).toBeNull();
    expect(parsePrice("10 000 001")).toBeNull();
    expect(parsePrice("10 000 000")).toBe(10000000);
  });
});
