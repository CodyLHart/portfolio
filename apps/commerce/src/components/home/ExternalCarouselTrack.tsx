"use client";

import Image from "next/image";
import {
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
  const suppressClickRef = useRef(false);
  const isTransitioningRef = useRef(false);
  const realIndexRef = useRef(0);
  const [visibleItemCount, setVisibleItemCount] = useState(5);
  const [itemStep, setItemStep] = useState(0);
  const [realIndex, setRealIndex] = useState(0);
  const [renderedIndex, setRenderedIndex] = useState(0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(false);
  const validatedItems = getValidatedItems(items);
  const itemCount = validatedItems.length;
  const cloneCount =
    itemCount > visibleItemCount ? Math.min(visibleItemCount, itemCount) : 0;
  const shouldLoop = cloneCount > 0;
  const shouldShowControls = itemCount > visibleItemCount;
  const renderedItems = useMemo<RenderedCarouselItem[]>(() => {
    if (!shouldLoop) {
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
  }, [cloneCount, shouldLoop, validatedItems]);

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
      setItemStep(firstItem.getBoundingClientRect().width + gap);
    }

    setVisibleItemCount(nextVisibleItemCount);
  }, []);

  const resetToRealIndex = useCallback(
    (nextRealIndex: number) => {
      if (!shouldLoop) {
        setRenderedIndex(nextRealIndex);
        return;
      }

      setIsTransitionEnabled(false);
      setRenderedIndex(cloneCount + nextRealIndex);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          setIsTransitionEnabled(getMotionBehavior() === "smooth");
        });
      });
    },
    [cloneCount, shouldLoop],
  );

  const moveByItem = (direction: "backward" | "forward") => {
    if (!shouldShowControls || isTransitioningRef.current) {
      return;
    }

    const nextRealIndex =
      direction === "forward"
        ? (realIndex + 1) % itemCount
        : (realIndex - 1 + itemCount) % itemCount;
    const nextRenderedIndex =
      direction === "forward" ? renderedIndex + 1 : renderedIndex - 1;
    const shouldAnimate = getMotionBehavior() === "smooth";

    realIndexRef.current = nextRealIndex;
    setRealIndex(nextRealIndex);

    if (shouldAnimate) {
      isTransitioningRef.current = true;
      setIsTransitionEnabled(true);
      setRenderedIndex(nextRenderedIndex);
      return;
    }

    resetToRealIndex(nextRealIndex);
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
    resetToRealIndex(realIndexRef.current);
  }, [itemCount, resetToRealIndex, visibleItemCount]);

  const handleTransitionEnd = (event: ReactTransitionEvent<HTMLUListElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform") {
      return;
    }

    isTransitioningRef.current = false;
    resetToRealIndex(realIndexRef.current);
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!shouldShowControls) {
      return;
    }

    dragStartXRef.current = event.clientX;
    suppressClickRef.current = false;
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStartX = dragStartXRef.current;

    if (dragStartX === null || !shouldShowControls) {
      return;
    }

    dragStartXRef.current = null;
    const deltaX = event.clientX - dragStartX;
    const swipeThreshold = Math.max(32, Math.min(itemStep * 0.2, 80));

    if (Math.abs(deltaX) < swipeThreshold) {
      return;
    }

    suppressClickRef.current = true;
    moveByItem(deltaX < 0 ? "forward" : "backward");
  };

  const handleClickCapture = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    suppressClickRef.current = false;
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
        className="external-carousel-viewport"
        onClickCapture={handleClickCapture}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <ul
          ref={trackRef}
          className={
            isTransitionEnabled
              ? "external-carousel-track is-transitioning"
              : "external-carousel-track"
          }
          aria-labelledby={headingId}
          onTransitionEnd={handleTransitionEnd}
          style={{
            transform: `translate3d(-${renderedIndex * itemStep}px, 0, 0)`,
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
