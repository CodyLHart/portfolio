import { describe, expect, it } from "vitest";
import {
  getCarouselArrowTarget,
  getCarouselCentralScrollLeft,
  getCarouselLogicalIndex,
  getCarouselPhysicalIndex,
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

describe("carousel arrow position helpers", () => {
  it("derives physical and logical indexes from fractional scroll positions", () => {
    expect(
      getCarouselPhysicalIndex({
        scrollLeft: 701.25,
        itemStep: 100.25,
      }),
    ).toBe(7);
    expect(
      getCarouselLogicalIndex({
        scrollLeft: 701.25,
        itemStep: 100.25,
        itemCount: 6,
        cloneCount: 5,
        shouldLoop: true,
      }),
    ).toBe(2);
  });

  it("maps logical carousel positions to the central item range", () => {
    expect(
      getCarouselCentralScrollLeft({
        logicalIndex: 6,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
      }),
    ).toBe(1080);
  });

  it("chooses the next trailing clone when forward progress is reachable", () => {
    expect(
      getCarouselArrowTarget({
        direction: "forward",
        scrollLeft: 14 * 120,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
        maxScrollLeft: 2200,
        shouldLoop: true,
      }),
    ).toMatchObject({
      currentLogicalIndex: 5,
      nextLogicalIndex: 0,
      targetScrollLeft: 15 * 120,
      requiresNormalization: false,
    });
  });

  it("requires central normalization before a forward target that would clamp", () => {
    expect(
      getCarouselArrowTarget({
        direction: "forward",
        scrollLeft: 22 * 120,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
        maxScrollLeft: 2600,
        shouldLoop: true,
      }),
    ).toMatchObject({
      currentLogicalIndex: 1,
      nextLogicalIndex: 2,
      targetScrollLeft: 23 * 120,
      requiresNormalization: true,
    });
  });

  it("keeps backward movement symmetrical near the leading clone boundary", () => {
    expect(
      getCarouselArrowTarget({
        direction: "backward",
        scrollLeft: 120,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
        maxScrollLeft: 2600,
        shouldLoop: true,
      }),
    ).toMatchObject({
      currentLogicalIndex: 4,
      nextLogicalIndex: 3,
      targetScrollLeft: 0,
      requiresNormalization: true,
    });
  });
});
