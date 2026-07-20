import { describe, expect, it } from "vitest";
import {
  hasCarouselHorizontalDragIntent,
  resolveCarouselClickSuppression,
  shouldSuppressCarouselClickAfterDrag,
} from "./carousel-gesture";

describe("carousel gesture helpers", () => {
  it("keeps incidental movement as a click candidate", () => {
    expect(hasCarouselHorizontalDragIntent({ deltaX: 9, deltaY: 0 })).toBe(false);
    expect(hasCarouselHorizontalDragIntent({ deltaX: 10, deltaY: 12 })).toBe(false);
  });

  it("classifies deliberate horizontal movement as drag intent", () => {
    expect(hasCarouselHorizontalDragIntent({ deltaX: 10, deltaY: 1 })).toBe(true);
    expect(hasCarouselHorizontalDragIntent({ deltaX: -14, deltaY: 2 })).toBe(true);
  });

  it("suppresses only completed drags above the click threshold", () => {
    expect(
      shouldSuppressCarouselClickAfterDrag({
        completedDrag: true,
        dragDistance: 10,
      }),
    ).toBe(true);
    expect(
      shouldSuppressCarouselClickAfterDrag({
        completedDrag: true,
        dragDistance: 9,
      }),
    ).toBe(false);
    expect(
      shouldSuppressCarouselClickAfterDrag({
        completedDrag: false,
        dragDistance: 20,
      }),
    ).toBe(false);
  });

  it("clears one-shot suppression after the next pointer click", () => {
    expect(
      resolveCarouselClickSuppression({
        eventDetail: 1,
        suppressNextClick: true,
      }),
    ).toEqual({
      shouldPreventDefault: true,
      suppressNextClick: false,
    });

    expect(
      resolveCarouselClickSuppression({
        eventDetail: 1,
        suppressNextClick: false,
      }),
    ).toEqual({
      shouldPreventDefault: false,
      suppressNextClick: false,
    });
  });

  it("never suppresses keyboard activation", () => {
    expect(
      resolveCarouselClickSuppression({
        eventDetail: 0,
        suppressNextClick: true,
      }),
    ).toEqual({
      shouldPreventDefault: false,
      suppressNextClick: false,
    });
  });
});
