"use client";

import Image from "next/image";
import {
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getSafeCmsHref, isExternalHref } from "../../lib/content";

export type ExternalCarouselTrackItem = {
  _key: string;
  title: string;
  subtitle: string | null;
  href: string;
  openInNewTab: boolean | null;
  image: {
    alt: string;
    src: string;
    width: number;
    height: number;
    blurDataURL: string | null;
  };
};

const getValidatedItems = (items: ExternalCarouselTrackItem[]) =>
  items
    .map((item) => {
      const safeHref = getSafeCmsHref(item.href);

      return safeHref && isExternalHref(safeHref)
        ? {
            ...item,
            href: safeHref,
          }
        : null;
    })
    .filter((item): item is ExternalCarouselTrackItem => Boolean(item));

type RenderedCarouselItem = ExternalCarouselTrackItem & {
  renderKey: string;
  isClone: boolean;
};

const getVisibleItemCount = (width: number) => {
  if (width <= 360) {
    return 1;
  }

  if (width <= 640) {
    return 2;
  }

  if (width <= 900) {
    return 3;
  }

  if (width <= 1199) {
    return 4;
  }

  return 5;
};

const getMotionBehavior = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";

const mouseDragIntentThreshold = 10;
const mouseClickSuppressionThreshold = 10;
const arrowBoundaryToleranceRatio = 0.15;

const getPositiveModulo = (value: number, modulus: number) =>
  ((value % modulus) + modulus) % modulus;

export function ExternalCarouselTrack({
  heading,
  headingId,
  items,
}: {
  heading: string;
  headingId: string;
  items: ExternalCarouselTrackItem[];
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLUListElement>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartScrollLeftRef = useRef(0);
  const hasDraggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const isDraggingRef = useRef(false);
  const normalizeScrollFrameRef = useRef<number | null>(null);
  const realIndexRef = useRef(0);
  const itemStepRef = useRef(0);
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  const [itemStep, setItemStep] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const validatedItems = getValidatedItems(items);
  const itemCount = validatedItems.length;
  const cloneCount =
    itemCount > visibleItemCount
      ? Math.min(visibleItemCount + 1, itemCount)
      : 0;
  const shouldLoop = cloneCount > 0;
  const shouldRenderLoop = shouldLoop && itemStep > 0;
  const shouldShowControls = itemCount > visibleItemCount;
  const renderedItems = useMemo<RenderedCarouselItem[]>(() => {
    if (!shouldRenderLoop) {
      return validatedItems.map((item) => ({
        ...item,
        renderKey: `real-${item._key}`,
        isClone: false,
      }));
    }

    const beforeClones = validatedItems.slice(-cloneCount).map((item) => ({
      ...item,
      renderKey: `before-${item._key}`,
      isClone: true,
    }));
    const realItems = validatedItems.map((item) => ({
      ...item,
      renderKey: `real-${item._key}`,
      isClone: false,
    }));
    const afterClones = validatedItems.slice(0, cloneCount).map((item) => ({
      ...item,
      renderKey: `after-${item._key}`,
      isClone: true,
    }));

    return [...beforeClones, ...realItems, ...afterClones];
  }, [cloneCount, shouldRenderLoop, validatedItems]);

  const getRealContentWidth = useCallback(
    (step = itemStepRef.current) => itemCount * step,
    [itemCount],
  );

  const getRealRegionStart = useCallback(
    (step = itemStepRef.current) => cloneCount * step,
    [cloneCount],
  );

  const updateRealIndexFromScroll = useCallback(
    (scrollLeft: number, step = itemStepRef.current) => {
      if (itemCount === 0 || step <= 0) {
        realIndexRef.current = 0;
        setRealIndex(0);
        return;
      }

      const logicalScroll = shouldRenderLoop
        ? getPositiveModulo(
            scrollLeft - getRealRegionStart(step),
            itemCount * step,
          )
        : Math.max(0, scrollLeft);
      const nextRealIndex = Math.min(
        Math.floor(logicalScroll / step + 0.0001),
        itemCount - 1,
      );

      realIndexRef.current = nextRealIndex;
      setRealIndex(nextRealIndex);
    },
    [getRealRegionStart, itemCount, shouldRenderLoop],
  );

  const normalizeScrollLeft = useCallback(() => {
    const viewport = viewportRef.current;
    const step = itemStepRef.current;
    const realContentWidth = getRealContentWidth(step);

    if (
      !viewport ||
      !shouldRenderLoop ||
      itemCount === 0 ||
      step <= 0 ||
      realContentWidth <= 0
    ) {
      if (viewport) {
        updateRealIndexFromScroll(viewport.scrollLeft, step);
      }
      return 0;
    }

    const realRegionStart = getRealRegionStart(step);
    const realRegionEnd = realRegionStart + realContentWidth;
    const cloneRunwayBeyondViewport = Math.max(
      0,
      cloneCount * step - viewport.clientWidth,
    );
    const normalizationThreshold = Math.max(
      1,
      Math.min(step * 0.25, cloneRunwayBeyondViewport || step * 0.25),
    );
    let nextScrollLeft = viewport.scrollLeft;

    while (nextScrollLeft <= realRegionStart - normalizationThreshold) {
      nextScrollLeft += realContentWidth;
    }

    while (nextScrollLeft >= realRegionEnd + normalizationThreshold) {
      nextScrollLeft -= realContentWidth;
    }

    const scrollAdjustment = nextScrollLeft - viewport.scrollLeft;

    if (nextScrollLeft !== viewport.scrollLeft) {
      viewport.scrollLeft = nextScrollLeft;
    }

    if (scrollAdjustment !== 0 && isDraggingRef.current) {
      dragStartScrollLeftRef.current += scrollAdjustment;
    }

    updateRealIndexFromScroll(nextScrollLeft, step);
    return scrollAdjustment;
  }, [
    getRealContentWidth,
    getRealRegionStart,
    cloneCount,
    itemCount,
    shouldRenderLoop,
    updateRealIndexFromScroll,
  ]);

  const scheduleScrollNormalization = useCallback(() => {
    if (normalizeScrollFrameRef.current !== null) {
      return;
    }

    normalizeScrollFrameRef.current = window.requestAnimationFrame(() => {
      normalizeScrollFrameRef.current = null;
      normalizeScrollLeft();
    });
  }, [normalizeScrollLeft]);

  const measureCarousel = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;

    if (!viewport || !track) {
      return;
    }

    const nextVisibleItemCount = getVisibleItemCount(viewport.clientWidth);
    const firstItem = track.querySelector<HTMLElement>(
      ".external-carousel-item",
    );
    const trackStyles = window.getComputedStyle(track);
    const gap =
      Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    if (firstItem) {
      const nextItemStep = firstItem.getBoundingClientRect().width + gap;
      const nextCloneCount =
        itemCount > nextVisibleItemCount
          ? Math.min(nextVisibleItemCount + 1, itemCount)
          : 0;
      const previousItemStep = itemStepRef.current;
      const previousCloneCount = cloneCount;
      const previousScrollLeft = viewport.scrollLeft;

      itemStepRef.current = nextItemStep;
      setItemStep(nextItemStep);

      if (nextItemStep > 0) {
        const previousLogicalIndex =
          previousItemStep > 0
            ? (previousScrollLeft - previousCloneCount * previousItemStep) /
              previousItemStep
            : realIndexRef.current;
        const nextScrollLeft =
          nextCloneCount * nextItemStep +
          Math.max(0, previousLogicalIndex) * nextItemStep;

        viewport.scrollLeft = Math.max(0, nextScrollLeft);
        updateRealIndexFromScroll(viewport.scrollLeft, nextItemStep);
      }
    }

    setVisibleItemCount(nextVisibleItemCount);
  }, [cloneCount, itemCount, updateRealIndexFromScroll]);

  const moveByItem = (direction: "backward" | "forward") => {
    const viewport = viewportRef.current;

    if (!viewport || !shouldShowControls || isDraggingRef.current) {
      return;
    }

    const step = itemStepRef.current || itemStep;

    if (step <= 0) {
      return;
    }

    normalizeScrollLeft();

    const currentScrollLeft = viewport.scrollLeft;
    const boundaryTolerance = step * arrowBoundaryToleranceRatio;
    const floatingIndex = currentScrollLeft / step;
    let targetRenderedIndex =
      direction === "forward"
        ? Math.ceil(floatingIndex)
        : Math.floor(floatingIndex);
    const candidateScrollLeft = targetRenderedIndex * step;
    const distanceToCandidate = Math.abs(
      currentScrollLeft - candidateScrollLeft,
    );

    if (distanceToCandidate <= boundaryTolerance) {
      targetRenderedIndex += direction === "forward" ? 1 : -1;
    }

    let targetScrollLeft = Math.max(0, targetRenderedIndex * step);

    if (shouldRenderLoop) {
      const realRegionStart = getRealRegionStart(step);
      const realRegionEnd = realRegionStart + getRealContentWidth(step);

      if (targetScrollLeft >= realRegionEnd) {
        viewport.scrollLeft = currentScrollLeft - getRealContentWidth(step);
        targetScrollLeft -= getRealContentWidth(step);
      } else if (targetScrollLeft < realRegionStart) {
        viewport.scrollLeft = currentScrollLeft + getRealContentWidth(step);
        targetScrollLeft += getRealContentWidth(step);
      }
    }

    viewport.scrollTo({
      left: targetScrollLeft,
      behavior: getMotionBehavior() === "smooth" ? "smooth" : "auto",
    });
  };

  useEffect(() => {
    const viewport = viewportRef.current;

    if (!viewport) {
      return;
    }

    measureCarousel();
    const observer = new ResizeObserver(measureCarousel);

    observer.observe(viewport);

    return () => {
      observer.disconnect();
    };
  }, [measureCarousel, renderedItems.length]);

  useEffect(() => {
    setRealIndex((index) => {
      const nextIndex = Math.min(index, Math.max(itemCount - 1, 0));

      realIndexRef.current = nextIndex;

      return nextIndex;
    });
  }, [itemCount]);

  useEffect(
    () => () => {
      if (normalizeScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(normalizeScrollFrameRef.current);
        normalizeScrollFrameRef.current = null;
      }
      activePointerIdRef.current = null;
      dragStartXRef.current = null;
      dragStartYRef.current = null;
      hasDraggedRef.current = false;
      isDraggingRef.current = false;
    },
    [],
  );

  const cleanupPointerInteraction = (
    event?: ReactPointerEvent<HTMLDivElement>,
  ) => {
    if (
      event &&
      activePointerIdRef.current === event.pointerId &&
      event.currentTarget.hasPointerCapture(event.pointerId)
    ) {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer capture can already be gone after cancellation/lost capture.
      }
    }

    activePointerIdRef.current = null;
    dragStartXRef.current = null;
    dragStartYRef.current = null;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      !event.isPrimary ||
      event.pointerType !== "mouse" ||
      !shouldShowControls ||
      event.button !== 0
    ) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartScrollLeftRef.current = event.currentTarget.scrollLeft;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      activePointerIdRef.current !== event.pointerId ||
      dragStartXRef.current === null ||
      dragStartYRef.current === null ||
      event.pointerType !== "mouse" ||
      !shouldShowControls
    ) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const hasHorizontalDragIntent =
      Math.abs(deltaX) >= mouseDragIntentThreshold &&
      Math.abs(deltaX) > Math.abs(deltaY);

    if (!hasDraggedRef.current && !hasHorizontalDragIntent) {
      return;
    }

    if (!hasDraggedRef.current) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is only needed for mouse drag scrolling.
      }

      hasDraggedRef.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    event.preventDefault();
    event.currentTarget.scrollLeft = dragStartScrollLeftRef.current - deltaX;
    normalizeScrollLeft();
  };

  const finishPointerDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    shouldSuppressClick: boolean,
  ) => {
    if (activePointerIdRef.current !== event.pointerId) {
      return;
    }

    const completedDrag = hasDraggedRef.current;
    const dragDistance =
      dragStartXRef.current === null
        ? 0
        : Math.abs(event.clientX - dragStartXRef.current);

    cleanupPointerInteraction(event);

    suppressClickRef.current =
      shouldSuppressClick &&
      completedDrag &&
      dragDistance >= mouseClickSuppressionThreshold;
    hasDraggedRef.current = false;
    scheduleScrollNormalization();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    finishPointerDrag(event, true);
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLDivElement>) => {
    finishPointerDrag(event, false);
  };

  const handleLinkClick = (event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (event.detail === 0) {
      suppressClickRef.current = false;
      return;
    }

    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
  };

  const handleDragStart = (event: ReactDragEvent<HTMLAnchorElement>) => {
    event.preventDefault();
  };

  if (validatedItems.length === 0) {
    return null;
  }

  return (
    <div className="external-carousel">
      <div className="external-carousel-header">
        <button
          type="button"
          onClick={() => moveByItem("backward")}
          disabled={!shouldShowControls}
          aria-label="Previous item"
        >
          ←
        </button>
        <h2 id={headingId}>{heading}</h2>
        <button
          type="button"
          onClick={() => moveByItem("forward")}
          disabled={!shouldShowControls}
          aria-label="Next item"
        >
          →
        </button>
      </div>
      <p className="external-carousel-status" aria-live="polite">
        Item {realIndex + 1} of {itemCount}
      </p>
      <div
        ref={viewportRef}
        className={[
          "external-carousel-viewport",
          shouldShowControls ? "is-draggable" : "",
          isDragging ? "is-dragging" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        onScroll={scheduleScrollNormalization}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
      >
        <ul
          ref={trackRef}
          className="external-carousel-track"
          aria-labelledby={headingId}
        >
          {renderedItems.map((item) => {
            const newTabProps = item.openInNewTab
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {};

            return (
              <li
                className="external-carousel-item"
                key={item.renderKey}
                aria-hidden={item.isClone}
              >
                <a
                  href={item.href}
                  tabIndex={item.isClone ? -1 : undefined}
                  draggable={false}
                  onClick={handleLinkClick}
                  onDragStart={handleDragStart}
                  {...newTabProps}
                >
                  <span className="external-carousel-image">
                    <Image
                      src={item.image.src}
                      alt={item.image.alt}
                      width={item.image.width}
                      height={item.image.height}
                      sizes="(max-width: 520px) 78vw, (max-width: 900px) 42vw, 20vw"
                      placeholder={item.image.blurDataURL ? "blur" : "empty"}
                      blurDataURL={item.image.blurDataURL ?? undefined}
                      draggable={false}
                    />
                  </span>
                  <span className="external-carousel-copy">
                    <span className="external-carousel-title">
                      {item.title}
                    </span>
                    {item.subtitle ? (
                      <span className="external-carousel-subtitle">
                        {item.subtitle}
                      </span>
                    ) : null}
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
