export const mouseDragIntentThreshold = 10;
export const mouseClickSuppressionThreshold = 10;
export const carouselPositionEpsilon = 0.5;

const getPositiveModulo = (value: number, modulus: number) =>
  ((value % modulus) + modulus) % modulus;

export const hasCarouselHorizontalDragIntent = ({
  deltaX,
  deltaY,
  threshold = mouseDragIntentThreshold,
}: {
  deltaX: number;
  deltaY: number;
  threshold?: number;
}) => Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY);

export const shouldSuppressCarouselClickAfterDrag = ({
  completedDrag,
  dragDistance,
  threshold = mouseClickSuppressionThreshold,
}: {
  completedDrag: boolean;
  dragDistance: number;
  threshold?: number;
}) => completedDrag && dragDistance >= threshold;

export const resolveCarouselClickSuppression = ({
  eventDetail,
  suppressNextClick,
}: {
  eventDetail: number;
  suppressNextClick: boolean;
}) => {
  if (eventDetail === 0) {
    return {
      shouldPreventDefault: false,
      suppressNextClick: false,
    };
  }

  if (!suppressNextClick) {
    return {
      shouldPreventDefault: false,
      suppressNextClick,
    };
  }

  return {
    shouldPreventDefault: true,
    suppressNextClick: false,
  };
};

export const getCarouselPhysicalIndex = ({
  scrollLeft,
  itemStep,
}: {
  scrollLeft: number;
  itemStep: number;
}) => (itemStep > 0 ? Math.round(scrollLeft / itemStep) : 0);

export const getCarouselCloneCount = ({
  itemCount,
  visibleItemCount,
  maxMomentumDistanceItems,
}: {
  itemCount: number;
  visibleItemCount: number;
  maxMomentumDistanceItems: number;
}) =>
  itemCount > visibleItemCount
    ? visibleItemCount + maxMomentumDistanceItems + 1
    : 0;

export const getCarouselLogicalIndex = ({
  scrollLeft,
  itemStep,
  itemCount,
  cloneCount,
  shouldLoop,
}: {
  scrollLeft: number;
  itemStep: number;
  itemCount: number;
  cloneCount: number;
  shouldLoop: boolean;
}) => {
  if (itemCount <= 0 || itemStep <= 0) {
    return 0;
  }

  const physicalIndex = getCarouselPhysicalIndex({ scrollLeft, itemStep });

  if (!shouldLoop) {
    return Math.max(0, Math.min(physicalIndex, itemCount - 1));
  }

  return getPositiveModulo(physicalIndex - cloneCount, itemCount);
};

export const getCarouselCentralScrollLeft = ({
  logicalIndex,
  itemStep,
  itemCount,
  cloneCount,
}: {
  logicalIndex: number;
  itemStep: number;
  itemCount: number;
  cloneCount: number;
}) => {
  if (itemCount <= 0 || itemStep <= 0) {
    return 0;
  }

  return (
    (cloneCount + getPositiveModulo(logicalIndex, itemCount)) * itemStep
  );
};

export const getCarouselCentralPhysicalRange = ({
  itemCount,
  cloneCount,
}: {
  itemCount: number;
  cloneCount: number;
}) => ({
  start: cloneCount,
  end: cloneCount + Math.max(0, itemCount - 1),
});

export const getCarouselArrowTarget = ({
  direction,
  scrollLeft,
  itemStep,
  itemCount,
  cloneCount,
  maxScrollLeft,
  shouldLoop,
  boundaryEpsilon = carouselPositionEpsilon,
}: {
  direction: "backward" | "forward";
  scrollLeft: number;
  itemStep: number;
  itemCount: number;
  cloneCount: number;
  maxScrollLeft: number;
  shouldLoop: boolean;
  boundaryEpsilon?: number;
}) => {
  const directionDelta = direction === "forward" ? 1 : -1;
  const currentLogicalIndex = getCarouselLogicalIndex({
    scrollLeft,
    itemStep,
    itemCount,
    cloneCount,
    shouldLoop,
  });

  if (itemCount <= 0 || itemStep <= 0) {
    return {
      currentLogicalIndex,
      nextLogicalIndex: currentLogicalIndex,
      targetScrollLeft: Math.max(0, scrollLeft),
      requiresNormalization: false,
    };
  }

  const nextLogicalIndex = shouldLoop
    ? getPositiveModulo(currentLogicalIndex + directionDelta, itemCount)
    : Math.max(0, Math.min(currentLogicalIndex + directionDelta, itemCount - 1));

  if (!shouldLoop) {
    return {
      currentLogicalIndex,
      nextLogicalIndex,
      targetScrollLeft: Math.max(
        0,
        Math.min(nextLogicalIndex * itemStep, maxScrollLeft),
      ),
      requiresNormalization: false,
    };
  }

  const currentPhysicalIndex = getCarouselPhysicalIndex({
    scrollLeft,
    itemStep,
  });
  const adjacentPhysicalIndex = currentPhysicalIndex + directionDelta;
  const centralPhysicalIndex = cloneCount + nextLogicalIndex;
  const targetPhysicalIndex =
    adjacentPhysicalIndex >= 0 &&
    adjacentPhysicalIndex * itemStep <= maxScrollLeft
      ? adjacentPhysicalIndex
      : centralPhysicalIndex;
  const targetScrollLeft = targetPhysicalIndex * itemStep;
  const requiresNormalization =
    targetPhysicalIndex < cloneCount ||
    targetPhysicalIndex >= cloneCount + itemCount ||
    targetScrollLeft > maxScrollLeft - boundaryEpsilon ||
    targetScrollLeft < boundaryEpsilon;

  return {
    currentLogicalIndex,
    nextLogicalIndex,
    targetScrollLeft,
    requiresNormalization,
  };
};
