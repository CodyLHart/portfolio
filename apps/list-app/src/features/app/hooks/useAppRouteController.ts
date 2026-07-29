import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Priority } from "../../../lib/types";
import { getFriendsRouteState } from "../../friends/lib/friend-routes";
import type { MobileView } from "../../lists/types";

export type AppSection = "lists" | "friends";

export function useAppRouteController({
  initialFriendId,
  initialSection,
  refreshLists,
  setActiveListId,
  setDeleteListConfirmation,
  setSelectedCategories,
  setSelectedPriorities,
}: {
  initialFriendId: string | null;
  initialSection: AppSection;
  refreshLists: () => void;
  setActiveListId: Dispatch<SetStateAction<string | null>>;
  setDeleteListConfirmation: Dispatch<SetStateAction<string>>;
  setSelectedCategories: Dispatch<SetStateAction<string[]>>;
  setSelectedPriorities: Dispatch<SetStateAction<Priority[]>>;
}) {
  const mobileDetailHistoryRef = useRef(false);
  const [appSection, setAppSection] = useState<AppSection>(initialSection);
  const [mobileView, setMobileView] = useState<MobileView>("lists");
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(
    initialFriendId,
  );

  useEffect(() => {
    const handlePopState = () => {
      const routeState = getFriendsRouteState();

      if (routeState.section === "friends") {
        setAppSection("friends");
        setSelectedFriendId(routeState.friendId);
        setMobileView("lists");
        mobileDetailHistoryRef.current = false;
        return;
      }

      setAppSection("lists");
      setSelectedFriendId(null);
      mobileDetailHistoryRef.current = false;
      setMobileView("lists");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const resetToLists = useCallback(() => {
    setAppSection("lists");
    setSelectedFriendId(null);
    setMobileView("lists");
    mobileDetailHistoryRef.current = false;
  }, []);

  const selectActiveList = useCallback(
    (listId: string, skipMobileHistory = false) => {
      setSelectedCategories([]);
      setSelectedPriorities([]);
      setDeleteListConfirmation("");
      setAppSection("lists");
      setSelectedFriendId(null);
      setActiveListId(listId);
      setMobileView("detail");

      if (
        typeof window !== "undefined" &&
        window.matchMedia("(max-width: 860px)").matches &&
        !skipMobileHistory &&
        !mobileDetailHistoryRef.current
      ) {
        window.history.pushState({ listAppView: "detail", listId }, "", "");
        mobileDetailHistoryRef.current = true;
      }
    },
    [
      setActiveListId,
      setDeleteListConfirmation,
      setSelectedCategories,
      setSelectedPriorities,
    ],
  );

  const showMobileListIndex = useCallback(() => {
    if (mobileDetailHistoryRef.current) {
      window.history.back();
      return;
    }

    setMobileView("lists");
  }, []);

  const showLists = useCallback(() => {
    setAppSection("lists");
    setSelectedFriendId(null);
    setMobileView("lists");

    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({ listAppView: "lists" }, "", "/");
    }
  }, []);

  const showFriendsIndex = useCallback(() => {
    setAppSection("friends");
    setSelectedFriendId(null);

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/friends"
    ) {
      window.history.pushState({ listAppView: "friends" }, "", "/friends");
    }
  }, []);

  const openFriend = useCallback((friendId: string) => {
    setAppSection("friends");
    setSelectedFriendId(friendId);
    window.history.pushState(
      { listAppView: "friend", friendId },
      "",
      `/friends/${friendId}`,
    );
  }, []);

  const openSharedList = useCallback(
    (listId: string) => {
      if (typeof window !== "undefined" && window.location.pathname !== "/") {
        window.history.pushState({ listAppView: "detail", listId }, "", "/");
      }

      refreshLists();

      selectActiveList(listId, true);
    },
    [refreshLists, selectActiveList],
  );

  return {
    appSection,
    mobileView,
    openFriend,
    openSharedList,
    resetToLists,
    selectedFriendId,
    selectActiveList,
    setMobileView,
    setSelectedFriendId,
    showFriendsIndex,
    showLists,
    showMobileListIndex,
  };
}
