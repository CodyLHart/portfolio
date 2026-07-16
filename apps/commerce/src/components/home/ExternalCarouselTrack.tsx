"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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

export function ExternalCarouselTrack({
  heading,
  headingId,
  items,
}: {
  heading: string;
  headingId: string;
  items: ExternalCarouselTrackItem[];
}) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollBackward, setCanScrollBackward] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);
  const validatedItems = getValidatedItems(items);

  const updateScrollState = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxScrollLeft = track.scrollWidth - track.clientWidth;

    setCanScrollBackward(track.scrollLeft > 1);
    setCanScrollForward(track.scrollLeft < maxScrollLeft - 1);
  }, []);

  const scrollByPage = (direction: "backward" | "forward") => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({
      left: direction === "forward" ? track.clientWidth : -track.clientWidth,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };

  useEffect(() => {
    updateScrollState();

    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      track.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  if (validatedItems.length === 0) {
    return null;
  }

  return (
    <div className="external-carousel">
      <div className="external-carousel-header">
        <h2 id={headingId}>{heading}</h2>
        <div className="external-carousel-controls" aria-label="Carousel controls">
          <button
            type="button"
            onClick={() => scrollByPage("backward")}
            disabled={!canScrollBackward}
            aria-label="Show previous carousel items"
          >
            Previous
          </button>
          <button
            type="button"
            onClick={() => scrollByPage("forward")}
            disabled={!canScrollForward}
            aria-label="Show next carousel items"
          >
            Next
          </button>
        </div>
      </div>
      <ul
        ref={trackRef}
        className="external-carousel-track"
        aria-labelledby={headingId}
      >
        {validatedItems.map((item) => {
          const newTabProps = item.openInNewTab
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {};

          return (
            <li className="external-carousel-item" key={item._key}>
              <a href={item.href} {...newTabProps}>
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
  );
}
