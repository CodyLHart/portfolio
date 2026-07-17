"use client";

import Image from "next/image";
import {
  type DragEvent as ReactDragEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  type TransitionEvent as ReactTransitionEvent,
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

const dragClickThreshold = 12;
const arrowBoundaryToleranceRatio = 0.15;
const transitionFallbackMs = 320;

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
  const dragStartXRef = useRef<number | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragStartTranslateRef = useRef(0);
  const currentTranslateRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);
  const hasDraggedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const isDraggingRef = useRef(false);
  const transitionFallbackRef = useRef<number | null>(null);
  const realIndexRef = useRef(0);
  const itemStepRef = useRef(0);
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  const [itemStep, setItemStep] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [trackTranslate, setTrackTranslate] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const validatedItems = getValidatedItems(items);
  const itemCount = validatedItems.length;
  const cloneCount =
    itemCount > visibleItemCount ? Math.min(visibleItemCount, itemCount) : 0;
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

    const beforeClones = validatedItems
      .slice(-cloneCount)
      .map((item) => ({
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

  const setTrackTranslateValue = useCallback((nextTranslate: number) => {
    currentTranslateRef.current = nextTranslate;
    setTrackTranslate(nextTranslate);
  }, []);

  const clearTransitionFallback = useCallback(() => {
    if (transitionFallbackRef.current === null) {
      return;
    }

    window.clearTimeout(transitionFallbackRef.current);
    transitionFallbackRef.current = null;
  }, []);

  const getMaxRenderedIndex = useCallback(
    () => Math.max(renderedItems.length - visibleItemCount, 0),
    [renderedItems.length, visibleItemCount],
  );

  const getBoundedTranslate = useCallback(
    (translate: number, step = itemStepRef.current) => {
      if (step <= 0) {
        return translate;
      }

      const minTranslate = -getMaxRenderedIndex() * step;

      return Math.min(0, Math.max(minTranslate, translate));
    },
    [getMaxRenderedIndex],
  );

  const getRealIndexForRenderedIndex = useCallback(
    (nextRenderedIndex: number) => {
      if (!shouldRenderLoop || itemCount === 0) {
        return Math.min(nextRenderedIndex, Math.max(itemCount - 1, 0));
      }

      return (nextRenderedIndex - cloneCount + itemCount) % itemCount;
    },
    [cloneCount, itemCount, shouldRenderLoop],
  );

  const updateRealIndexFromTranslate = useCallback(
    (translate: number, step = itemStepRef.current) => {
      if (itemCount === 0 || step <= 0) {
        realIndexRef.current = 0;
        setRealIndex(0);
        return;
      }

      const nextRenderedIndex = Math.floor(-translate / step + 0.0001);
      const nextRealIndex = getRealIndexForRenderedIndex(nextRenderedIndex);

      realIndexRef.current = nextRealIndex;
      setRealIndex(nextRealIndex);
    },
    [getRealIndexForRenderedIndex, itemCount],
  );

  const getNormalizedLoopTranslate = useCallback(
    (translate: number, step = itemStepRef.current) => {
      if (!shouldRenderLoop || itemCount === 0 || step <= 0) {
        return getBoundedTranslate(translate, step);
      }

      let floatingIndex = -translate / step;
      const realRegionStart = cloneCount;
      const realRegionEnd = cloneCount + itemCount;

      while (floatingIndex < realRegionStart) {
        floatingIndex += itemCount;
      }

      while (floatingIndex >= realRegionEnd) {
        floatingIndex -= itemCount;
      }

      return getBoundedTranslate(-floatingIndex * step, step);
    },
    [cloneCount, getBoundedTranslate, itemCount, shouldRenderLoop],
  );

  const normalizeToRealRegion = useCallback(() => {
    const nextTranslate = getNormalizedLoopTranslate(currentTranslateRef.current);

    if (nextTranslate !== currentTranslateRef.current) {
      setIsTransitionEnabled(false);
      setTrackTranslateValue(nextTranslate);
    }

    updateRealIndexFromTranslate(nextTranslate);
  }, [
    getNormalizedLoopTranslate,
    setTrackTranslateValue,
    updateRealIndexFromTranslate,
  ]);

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
    const gap = Number.parseFloat(trackStyles.columnGap || trackStyles.gap) || 0;

    if (firstItem) {
      const nextItemStep = firstItem.getBoundingClientRect().width + gap;
      const nextCloneCount =
        itemCount > nextVisibleItemCount
          ? Math.min(nextVisibleItemCount, itemCount)
          : 0;
      const previousItemStep = itemStepRef.current;
      const previousCloneCount = cloneCount;
      const previousTranslate = currentTranslateRef.current;

      itemStepRef.current = nextItemStep;
      setItemStep(nextItemStep);

      if (nextItemStep > 0) {
        const nextMaxRenderedIndex =
          nextCloneCount > 0
            ? itemCount + nextCloneCount
            : Math.max(itemCount - nextVisibleItemCount, 0);
        const nextFloatingIndex =
          previousItemStep > 0
            ? nextCloneCount +
              (-previousTranslate / previousItemStep - previousCloneCount)
            : nextCloneCount + realIndexRef.current;
        const minTranslate = -nextMaxRenderedIndex * nextItemStep;
        const nextTranslate = Math.min(
          0,
          Math.max(minTranslate, -nextFloatingIndex * nextItemStep),
        );

        currentTranslateRef.current = nextTranslate;
        setTrackTranslate(nextTranslate);
        updateRealIndexFromTranslate(nextTranslate, nextItemStep);
      }
    }

    setVisibleItemCount(nextVisibleItemCount);
  }, [cloneCount, itemCount, updateRealIndexFromTranslate]);

  const completeTrackAnimation = useCallback(() => {
    clearTransitionFallback();
    isTransitioningRef.current = false;
    normalizeToRealRegion();
  }, [clearTransitionFallback, normalizeToRealRegion]);

  const startTransitionFallback = useCallback(() => {
    clearTransitionFallback();
    transitionFallbackRef.current = window.setTimeout(() => {
      completeTrackAnimation();
    }, transitionFallbackMs);
  }, [clearTransitionFallback, completeTrackAnimation]);

  const moveByItem = (direction: "backward" | "forward") => {
    if (!shouldShowControls || isTransitioningRef.current || isDraggingRef.current) {
      return;
    }

    const step = itemStepRef.current || itemStep;

    if (step <= 0) {
      return;
    }

    const currentTranslate = currentTranslateRef.current;
    const boundaryTolerance = step * arrowBoundaryToleranceRatio;
    const floatingIndex = -currentTranslate / step;
    let targetRenderedIndex =
      direction === "forward" ? Math.ceil(floatingIndex) : Math.floor(floatingIndex);
    const candidateTranslate = -targetRenderedIndex * step;
    const distanceToCandidate = Math.abs(currentTranslate - candidateTranslate);

    if (distanceToCandidate <= boundaryTolerance) {
      targetRenderedIndex += direction === "forward" ? 1 : -1;
    }

    targetRenderedIndex = Math.max(
      0,
      Math.min(targetRenderedIndex, getMaxRenderedIndex()),
    );

    const nextTranslate = -targetRenderedIndex * step;
    const shouldAnimate = getMotionBehavior() === "smooth";

    updateRealIndexFromTranslate(nextTranslate, step);

    if (shouldAnimate && nextTranslate !== currentTranslate) {
      isTransitioningRef.current = true;
      setIsTransitionEnabled(true);
      setTrackTranslateValue(nextTranslate);
      startTransitionFallback();
      return;
    }

    setIsTransitionEnabled(false);
    setTrackTranslateValue(nextTranslate);
    normalizeToRealRegion();
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

  useEffect(() => {
    isTransitioningRef.current = false;
  }, [itemCount, visibleItemCount]);

  useEffect(
    () => () => {
      clearTransitionFallback();
      activePointerIdRef.current = null;
      dragStartXRef.current = null;
      dragStartYRef.current = null;
      hasDraggedRef.current = false;
      isDraggingRef.current = false;
    },
    [clearTransitionFallback],
  );

  const handleTransitionEnd = (event: ReactTransitionEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }

    completeTrackAnimation();
  };

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
    if (!shouldShowControls || isTransitioningRef.current || event.button !== 0) {
      return;
    }

    activePointerIdRef.current = event.pointerId;
    dragStartXRef.current = event.clientX;
    dragStartYRef.current = event.clientY;
    dragStartTranslateRef.current = currentTranslateRef.current;
    hasDraggedRef.current = false;
    suppressClickRef.current = false;
    setIsTransitionEnabled(false);
    isDraggingRef.current = false;
    setIsDragging(false);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (
      activePointerIdRef.current !== event.pointerId ||
      dragStartXRef.current === null ||
      dragStartYRef.current === null ||
      !shouldShowControls
    ) {
      return;
    }

    const deltaX = event.clientX - dragStartXRef.current;
    const deltaY = event.clientY - dragStartYRef.current;
    const hasHorizontalDragIntent =
      Math.abs(deltaX) >= dragClickThreshold && Math.abs(deltaX) > Math.abs(deltaY);

    if (!hasDraggedRef.current && !hasHorizontalDragIntent) {
      return;
    }

    if (!hasDraggedRef.current) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Pointer capture is only needed after a real drag starts.
      }

      hasDraggedRef.current = true;
      suppressClickRef.current = true;
      isDraggingRef.current = true;
      setIsDragging(true);
    }

    const nextTranslate = getBoundedTranslate(
      dragStartTranslateRef.current + deltaX,
    );

    event.preventDefault();

    setTrackTranslateValue(nextTranslate);
    updateRealIndexFromTranslate(nextTranslate);
  };

  const finishPointerDrag = (
    event: ReactPointerEvent<HTMLDivElement>,
    shouldSnap: boolean,
  ) => {
    const dragStartX = dragStartXRef.current;

    if (
      activePointerIdRef.current !== event.pointerId ||
      dragStartX === null ||
      !shouldShowControls
    ) {
      return;
    }

    cleanupPointerInteraction(event);
    const shouldAnimate = getMotionBehavior() === "smooth";

    if (!shouldSnap || !hasDraggedRef.current) {
      setIsTransitionEnabled(shouldAnimate);
      hasDraggedRef.current = false;
      suppressClickRef.current = false;
      return;
    }

    setIsTransitionEnabled(false);
    suppressClickRef.current = true;
    hasDraggedRef.current = false;
    normalizeToRealRegion();
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
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onLostPointerCapture={handlePointerCancel}
      >
        <ul
          ref={trackRef}
          className={[
            "external-carousel-track",
            isTransitionEnabled ? "is-transitioning" : "",
            isDragging ? "is-dragging" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-labelledby={headingId}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(${trackTranslate}px, 0, 0)`,
          }}
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
                    <span className="external-carousel-title">{item.title}</span>
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
