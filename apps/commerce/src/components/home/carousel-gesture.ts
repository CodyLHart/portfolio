export const mouseDragIntentThreshold = 10;
export const mouseClickSuppressionThreshold = 10;

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
