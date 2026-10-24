import { describe, expect, it } from "vitest";
import { visibleStampCount } from "@/lib/loyalty-progress";

describe("stamp-card display of real loyalty progress", () => {
  it("shows the verified partial progress without awarding imaginary stamps", () => {
    expect(
      visibleStampCount({
        totalSlots: 6,
        stampedCount: 3,
        availableRewards: 0,
      }),
    ).toBe(3);
    expect(
      visibleStampCount({
        totalSlots: 6,
        stampedCount: 0,
        availableRewards: 0,
      }),
    ).toBe(0);
  });

  it("keeps an earned reward visually complete until it is redeemed", () => {
    expect(
      visibleStampCount({
        totalSlots: 6,
        stampedCount: 0,
        availableRewards: 1,
      }),
    ).toBe(6);
    expect(
      visibleStampCount({
        totalSlots: 6,
        stampedCount: 2,
        availableRewards: 2,
      }),
    ).toBe(6);
  });

  it("does not invent a card when no rule has been configured", () => {
    expect(visibleStampCount(null)).toBe(0);
    expect(
      visibleStampCount({
        totalSlots: 0,
        stampedCount: 0,
        availableRewards: 0,
      }),
    ).toBe(0);
  });
});
