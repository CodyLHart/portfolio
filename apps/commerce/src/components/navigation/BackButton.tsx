"use client";

import { useRouter } from "next/navigation";

type NavigationHistoryEntryLike = {
  index: number;
  url: string | null;
};

type NavigationLike = {
  currentEntry?: NavigationHistoryEntryLike | null;
  entries?: () => NavigationHistoryEntryLike[];
};

const isSameOriginUrl = (url: string | null | undefined) => {
  if (!url) {
    return false;
  }

  try {
    return new URL(url).origin === window.location.origin;
  } catch {
    return false;
  }
};

export function BackButton() {
  const router = useRouter();

  const handleClick = () => {
    const navigation = "navigation" in window
      ? (window.navigation as NavigationLike)
      : null;
    const currentEntryIndex = navigation?.currentEntry?.index;
    const previousEntry =
      typeof currentEntryIndex === "number" && currentEntryIndex > 0
        ? navigation?.entries?.()[currentEntryIndex - 1]
        : null;
    const hasSameOriginPreviousEntry = isSameOriginUrl(previousEntry?.url);
    const hasSameOriginReferrer = isSameOriginUrl(document.referrer);

    if (
      window.history.length > 1 &&
      (hasSameOriginPreviousEntry || hasSameOriginReferrer)
    ) {
      router.back();
      return;
    }

    router.push("/store");
  };

  return (
    <button
      className="back-button"
      type="button"
      aria-label="Go back"
      onClick={handleClick}
    >
      <span aria-hidden="true">←</span>
      <span>Back</span>
    </button>
  );
}
