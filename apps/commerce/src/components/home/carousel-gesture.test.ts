import { describe, expect, it } from "vitest";
import {
  getCarouselArrowTarget,
  getCarouselCentralPhysicalRange,
  getCarouselCentralScrollLeft,
  getCarouselCloneCount,
  getCarouselLogicalIndex,
  getCarouselPhysicalIndex,
  hasCarouselHorizontalDragIntent,
  resolveCarouselClickSuppression,
  shouldSuppressCarouselClickAfterDrag,
} from "./carousel-gesture";

const normalizeToCentralScrollLeft = ({
  scrollLeft,
  itemStep,
  itemCount,
  cloneCount,
}: {
  scrollLeft: number;
  itemStep: number;
  itemCount: number;
  cloneCount: number;
}) =>
  getCarouselCentralScrollLeft({
    logicalIndex: getCarouselLogicalIndex({
      scrollLeft,
      itemStep,
      itemCount,
      cloneCount,
      shouldLoop: true,
    }),
    itemStep,
    itemCount,
    cloneCount,
  });

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
  it("sizes clone coverage from the visible item count and movement runway", () => {
    expect(
      getCarouselCloneCount({
        itemCount: 8,
        visibleItemCount: 5,
        maxMomentumDistanceItems: 3,
      }),
    ).toBe(9);
    expect(
      getCarouselCloneCount({
        itemCount: 5,
        visibleItemCount: 5,
        maxMomentumDistanceItems: 3,
      }),
    ).toBe(0);
  });

  it("reports the central physical range after the leading clones", () => {
    expect(
      getCarouselCentralPhysicalRange({
        itemCount: 6,
        cloneCount: 9,
      }),
    ).toEqual({
      start: 9,
      end: 14,
    });
  });

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

  it("chooses the next trailing clone for the animated wrap step", () => {
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
      requiresNormalization: true,
    });
  });

  it("keeps forward traversal to one adjacent physical item", () => {
    expect(
      getCarouselArrowTarget({
        direction: "forward",
        scrollLeft: 15 * 120,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
        maxScrollLeft: 2600,
        shouldLoop: true,
      }),
    ).toMatchObject({
      currentLogicalIndex: 0,
      nextLogicalIndex: 1,
      targetScrollLeft: 16 * 120,
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

  it("normalizes a trailing clone target to the central equivalent", () => {
    expect(
      normalizeToCentralScrollLeft({
        scrollLeft: 15 * 120,
        itemStep: 120,
        itemCount: 6,
        cloneCount: 9,
      }),
    ).toBe(9 * 120);
  });

  it("advances one logical item per settled forward arrow click across cycles", () => {
    const itemStep = 100.25;
    const itemCount = 6;
    const cloneCount = 9;
    const maxScrollLeft = 19 * itemStep;
    let scrollLeft = getCarouselCentralScrollLeft({
      logicalIndex: 0,
      itemStep,
      itemCount,
      cloneCount,
    });
    const visited: number[] = [];
    const physicalTargets: number[] = [];

    for (let stepIndex = 0; stepIndex < itemCount * 2 + 3; stepIndex += 1) {
      const target = getCarouselArrowTarget({
        direction: "forward",
        scrollLeft,
        itemStep,
        itemCount,
        cloneCount,
        maxScrollLeft,
        shouldLoop: true,
      });

      visited.push(target.nextLogicalIndex);
      physicalTargets.push(getCarouselPhysicalIndex({
        scrollLeft: target.targetScrollLeft,
        itemStep,
      }));
      scrollLeft = target.requiresNormalization
        ? normalizeToCentralScrollLeft({
            scrollLeft: target.targetScrollLeft,
            itemStep,
            itemCount,
            cloneCount,
          })
        : target.targetScrollLeft;
    }

    expect(visited).toEqual([1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0, 1, 2, 3]);
    expect(physicalTargets).toEqual([10, 11, 12, 13, 14, 15, 10, 11, 12, 13, 14, 15, 10, 11, 12]);
  });

  it("keeps backward traversal symmetrical across the leading clone boundary", () => {
    const itemStep = 98.5;
    const itemCount = 6;
    const cloneCount = 9;
    const maxScrollLeft = 19 * itemStep;
    let scrollLeft = getCarouselCentralScrollLeft({
      logicalIndex: 0,
      itemStep,
      itemCount,
      cloneCount,
    });
    const visited: number[] = [];
    const physicalTargets: number[] = [];

    for (let stepIndex = 0; stepIndex < itemCount + 2; stepIndex += 1) {
      const target = getCarouselArrowTarget({
        direction: "backward",
        scrollLeft,
        itemStep,
        itemCount,
        cloneCount,
        maxScrollLeft,
        shouldLoop: true,
      });

      visited.push(target.nextLogicalIndex);
      physicalTargets.push(getCarouselPhysicalIndex({
        scrollLeft: target.targetScrollLeft,
        itemStep,
      }));
      scrollLeft = target.requiresNormalization
        ? normalizeToCentralScrollLeft({
            scrollLeft: target.targetScrollLeft,
            itemStep,
            itemCount,
            cloneCount,
          })
        : target.targetScrollLeft;
    }

    expect(visited).toEqual([5, 4, 3, 2, 1, 0, 5, 4]);
    expect(physicalTargets).toEqual([8, 13, 12, 11, 10, 9, 8, 13]);
  });
});
