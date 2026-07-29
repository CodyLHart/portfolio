"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell as Shell } from "../components/layout/AppShell";
import { FriendsPage } from "../features/friends/components/FriendsPage";
import {
  FriendDetailLoadingPanel,
  FriendsIndexLoadingPanel,
} from "../features/friends/components/FriendsLoadingRegion";
import { useFriendsController } from "../features/friends/hooks/useFriendsController";
import { sendFriendRequestByEmail } from "../features/friends/lib/friends-api";
import { getFriendsRouteState } from "../features/friends/lib/friend-routes";
import { LandingPage } from "../features/landing/components/LandingPage";
import { ListDetailLoadingPanel } from "../features/lists/components/ListDetailLoadingPanel";
import {
  ListsWorkspace,
  ListsWorkspaceLoadingView,
} from "../features/lists/components/ListsWorkspace";
import { CollaborationModal } from "../features/lists/components/modals/CollaborationModal";
import {
  CreateListModal,
  type NewListDraft,
} from "../features/lists/components/modals/CreateListModal";
import { EditItemModal } from "../features/lists/components/modals/EditItemModal";
import { ListHistoryModal } from "../features/lists/components/modals/ListHistoryModal";
import { ListSettingsModal } from "../features/lists/components/modals/ListSettingsModal";
import { RestoreListModal } from "../features/lists/components/modals/RestoreListModal";
import {
  createListWithOwner,
  isMissingListOrderPreferencesError,
  loadAccessibleLists,
  loadSharedCandidateLists,
  saveListOrderPreferences,
} from "../features/lists/lib/list-api";
import {
  loadListWorkspaceData,
} from "../features/lists/lib/item-api";
import {
  useListModalState,
  type ActiveListModal,
} from "../features/lists/hooks/useListModalState";
import { useListItemReordering } from "../features/lists/hooks/useListItemReordering";
import { useListItemMutations } from "../features/lists/hooks/useListItemMutations";
import { useListHistoryController } from "../features/lists/hooks/useListHistoryController";
import { useListSettingsController } from "../features/lists/hooks/useListSettingsController";
import {
  acceptShareLink,
  inviteListCollaborator,
  updateListCollaboratorRole,
} from "../features/lists/lib/sharing-api";
import {
  buildVisibleItemGroups,
  emptyNewListDraft,
  getCategoryOptions,
  getPriorityFilterOptions,
  normalizeItemFields,
  sortListsByPreference,
} from "../features/lists/lib/list-utils";
import type {
  DropPlacement,
  ListDropIndicator,
  MobileView,
} from "../features/lists/types";
import {
  acceptFriendRequestNotification,
  acceptListInviteNotification,
  ignoreAccountNotification,
  loadAccountInboxData,
} from "../features/notifications/lib/notifications-api";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { signInWithGoogle, signOutUser } from "../features/profile/lib/auth-api";
import { loadProfileForUser } from "../features/profile/lib/profile-api";
import {
  Collaborator,
  emptyItemDraft,
  FriendRequest,
  ItemDraft,
  List,
  ListItemFields,
  ListItem,
  ListRole,
  ListSnapshot,
  Notification,
  Priority,
  Profile,
  Suggestion,
} from "../lib/types";
import { getErrorMessage } from "../lib/errors";

type AppSection = "lists" | "friends";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

export function ListApp({
  initialFriendId = null,
  initialSection = "lists",
}: {
  initialFriendId?: string | null;
  initialSection?: AppSection;
} = {}) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allListCollaborators, setAllListCollaborators] = useState<
    Collaborator[]
  >([]);
  const [friends, setFriends] = useState<FriendRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [snapshots, setSnapshots] = useState<ListSnapshot[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<Profile[]>([]);
  const [draft, setDraft] = useState<ItemDraft>(emptyItemDraft);
  const [newListDraft, setNewListDraft] =
    useState<NewListDraft>(emptyNewListDraft);
  const {
    activeListModal,
    editingItem,
    isCreateListOpen,
    restoreSnapshot,
    setActiveListModal,
    setEditingItem,
    setIsCreateListOpen,
    setRestoreSnapshot,
  } = useListModalState();
  const [friendEmail, setFriendEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ListRole>("editor");
  const [shareRole, setShareRole] = useState<ListRole>("viewer");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [listNameDraft, setListNameDraft] = useState("");
  const [deleteListConfirmation, setDeleteListConfirmation] = useState("");
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [listDropIndicator, setListDropIndicator] =
    useState<ListDropIndicator>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [isLoading, setIsLoading] = useState(true);
  const mobileDetailHistoryRef = useRef(false);
  const [mobileView, setMobileView] = useState<MobileView>("lists");
  const [appSection, setAppSection] = useState<AppSection>(initialSection);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(
    initialFriendId,
  );

  const user = session?.user ?? null;
  const activeList = lists.find((list) => list.id === activeListId) ?? null;
  const acceptedFriendProfiles = useMemo(
    () =>
      friends
        .filter((friend) => friend.status === "accepted")
        .map((friend) =>
          friend.requester_id === user?.id
            ? friend.addressee
            : friend.requester,
        )
        .filter((friend): friend is Profile => Boolean(friend))
        .sort((first, second) =>
          first.display_name.localeCompare(second.display_name),
        ),
    [friends, user?.id],
  );
  const { friendSummaries, selectedFriend } = useFriendsController({
    allListCollaborators,
    currentUserId: user?.id ?? null,
    lists,
    selectedFriendId,
  });
  const currentRole = getCurrentRole(
    activeList,
    collaborators,
    user?.id ?? null,
  );
  const canEdit = currentRole === "owner" || currentRole === "editor";
  const isOwner = currentRole === "owner";
  const itemFields = useMemo(
    () => normalizeItemFields(activeList?.item_fields),
    [activeList?.item_fields],
  );
  const appOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const visibleItemGroups = useMemo(
    () =>
      buildVisibleItemGroups({
        items,
        selectedCategories,
        selectedPriorities,
      }),
    [items, selectedCategories, selectedPriorities],
  );

  const matchingSuggestions = useMemo(() => {
    const query = draft.title.trim().toLowerCase();
    if (query.length < 2 || !activeList) {
      return [];
    }

    return suggestions
      .filter((suggestion) => suggestion.title.toLowerCase().includes(query))
      .slice(0, 6);
  }, [activeList, draft.title, suggestions]);

  const categoryOptions = useMemo(
    () => getCategoryOptions({ itemFields, items, suggestions }),
    [itemFields, items, suggestions],
  );

  const priorityFilterOptions = useMemo(
    () => getPriorityFilterOptions({ itemFields, items }),
    [itemFields, items],
  );
  const hasFilterOptions =
    categoryOptions.length > 0 ||
    priorityFilterOptions.length > 0 ||
    selectedCategories.length > 0 ||
    selectedPriorities.length > 0;

  const matchingCategoryOptions = useMemo(() => {
    const query = draft.category.trim().toLowerCase();

    if (!query) {
      return categoryOptions;
    }

    return categoryOptions.filter((category) =>
      category.toLowerCase().includes(query),
    );
  }, [categoryOptions, draft.category]);

  const loadLists = useCallback(async (userId: string) => {
    const { allCollaborators, lists } = await loadAccessibleLists(
      supabase,
      userId,
    );

    setLists(lists);
    setActiveListId((current) => current ?? lists[0]?.id ?? null);
    setAllListCollaborators(allCollaborators);
  }, []);

  const loadFriendsWorkspaceData = useCallback(async (userId: string) => {
    const { allCollaborators, lists } = await loadSharedCandidateLists(
      supabase,
      userId,
    );

    setLists(lists);
    setAllListCollaborators(allCollaborators);
  }, []);

  const loadProfile = useCallback(async (authUser: User) => {
    setProfile(await loadProfileForUser(supabase, authUser));
  }, []);

  const loadUserData = useCallback(
    async (authUser: User) => {
      setIsLoading(true);
      try {
        await loadProfile(authUser);
        if (initialSection === "friends") {
          await loadFriendsWorkspaceData(authUser.id);
        } else {
          await loadLists(authUser.id);
        }
      } catch (error) {
        setStatusMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [initialSection, loadFriendsWorkspaceData, loadLists, loadProfile],
  );

  const loadFriendsAndNotifications = useCallback(async (userId: string) => {
    const data = await loadAccountInboxData(supabase, userId);

    if (data.friends) {
      setFriends(data.friends);
    }

    if (data.notifications) {
      setNotifications(data.notifications);
    }
  }, []);

  const loadListData = useCallback(async (listId: string) => {
    const data = await loadListWorkspaceData(supabase, listId);

    if (data.items) {
      setItems(data.items);
    }

    if (data.collaborators) {
      setCollaborators(data.collaborators);
    }

    if (data.snapshots) {
      setSnapshots(data.snapshots);
    }

    if (data.suggestions) {
      setSuggestions(data.suggestions);
    }
  }, []);

  const {
    beginItemDrag,
    completeItemDrop,
    draggedItemId,
    dropIndicator,
    finishItemDrag,
    setDropIndicator,
  } = useListItemReordering({
    activeListId,
    canEdit,
    items,
    loadListData,
    setItems,
    setStatusMessage,
    supabase,
  });
  const {
    addItem,
    deleteItem,
    saveItemDetails,
    toggleItem,
    upsertSuggestion,
  } = useListItemMutations({
    activeList,
    canEdit,
    draft,
    editingItem,
    items,
    setDraft,
    setEditingItem,
    setIsAddItemOpen,
    setItems,
    setStatusMessage,
    suggestions,
    supabase,
    user,
  });
  const { clearAll, removeCompleted, restoreList } = useListHistoryController({
    activeList,
    isOwner,
    items,
    loadListData,
    setItems,
    setRestoreSnapshot,
    setStatusMessage,
    supabase,
    upsertSuggestion,
    user,
  });
  const {
    deleteActiveList,
    openOwnerSettings,
    updateItemFieldSetting,
    updateListName,
  } = useListSettingsController({
    activeList,
    deleteListConfirmation,
    isOwner,
    itemFields,
    lists,
    listNameDraft,
    setActiveListId,
    setActiveListModal,
    setCollaborators,
    setDeleteListConfirmation,
    setItems,
    setListNameDraft,
    setLists,
    setSelectedCategories,
    setSelectedPriorities,
    setSnapshots,
    setStatusMessage,
    setSuggestions,
    supabase,
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setSession(data.session);
        setAuthStatus("authenticated");
        void loadUserData(data.session.user);
      } else {
        setSession(null);
        setAuthStatus("unauthenticated");
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (nextSession?.user) {
          setSession(nextSession);
          setAuthStatus("authenticated");
          void loadUserData(nextSession.user);
        } else {
          setSession(null);
          setAuthStatus("unauthenticated");
          setIsLoading(false);
          setProfile(null);
          setLists([]);
          setAllListCollaborators([]);
          setActiveListId(null);
          setItems([]);
          setAppSection("lists");
          setSelectedFriendId(null);
        }
      },
    );

    return () => subscription.subscription.unsubscribe();
  }, [loadUserData]);

  useEffect(() => {
    if (!user || typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const joinToken = params.get("join");
    const requestedRole = params.get("role") === "editor" ? "editor" : "viewer";

    if (!joinToken) {
      return;
    }

    const acceptShareLinkFromUrl = async () => {
      const { data, error } = await acceptShareLink(supabase, {
        requestedRole,
        token: joinToken,
      });

      if (error) {
        setStatusMessage(error.message);
        return;
      }

      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.delete("join");
      nextUrl.searchParams.delete("role");
      window.history.replaceState({}, "", nextUrl.toString());

      await loadLists(user.id);
      setActiveListId(data as string);
      setStatusMessage("You joined the shared list.");
    };

    void acceptShareLinkFromUrl();
  }, [loadLists, user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    queueMicrotask(() => {
      void loadFriendsAndNotifications(user.id);
    });

    const channel = supabase
      .channel(`user:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `recipient_id=eq.${user.id}`,
        },
        () => void loadFriendsAndNotifications(user.id),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => void loadFriendsAndNotifications(user.id),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [loadFriendsAndNotifications, user]);

  useEffect(() => {
    if (!activeListId || !user) {
      queueMicrotask(() => {
        setItems([]);
        setCollaborators([]);
      });
      return;
    }

    queueMicrotask(() => {
      void loadListData(activeListId);
    });

    const channel = supabase.channel(`list:${activeListId}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_items",
          filter: `list_id=eq.${activeListId}`,
        },
        () => void loadListData(activeListId),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "lists",
          filter: `id=eq.${activeListId}`,
        },
        () => void loadLists(user.id),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "list_collaborators",
          filter: `list_id=eq.${activeListId}`,
        },
        () => {
          void loadListData(activeListId);
          void loadLists(user.id);
        },
      )
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ profile: Profile }>();
        setPresenceUsers(
          Object.values(state)
            .flat()
            .map((presence) => presence.profile)
            .filter((presenceProfile) => presenceProfile.id !== user.id),
        );
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED" && profile) {
          await channel.track({ profile });
        }
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [activeListId, loadListData, loadLists, profile, user]);

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

  const selectActiveList = (listId: string, skipMobileHistory = false) => {
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
  };

  const showMobileListIndex = () => {
    if (mobileDetailHistoryRef.current) {
      window.history.back();
      return;
    }

    setMobileView("lists");
  };

  const showLists = () => {
    setAppSection("lists");
    setSelectedFriendId(null);
    setMobileView("lists");

    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({ listAppView: "lists" }, "", "/");
    }
  };

  const showFriendsIndex = () => {
    setAppSection("friends");
    setSelectedFriendId(null);

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== "/friends"
    ) {
      window.history.pushState({ listAppView: "friends" }, "", "/friends");
    }
  };

  const openFriend = (friendId: string) => {
    setAppSection("friends");
    setSelectedFriendId(friendId);
    window.history.pushState(
      { listAppView: "friend", friendId },
      "",
      `/friends/${friendId}`,
    );
  };

  const openSharedList = (listId: string) => {
    if (typeof window !== "undefined" && window.location.pathname !== "/") {
      window.history.pushState({ listAppView: "detail", listId }, "", "/");
    }

    if (user) {
      void loadLists(user.id);
    }

    selectActiveList(listId, true);
  };

  const signIn = async () => {
    if (!isSupabaseConfigured) {
      setStatusMessage("Supabase environment variables are missing.");
      return;
    }

    const { data, error } = await signInWithGoogle(supabase);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (data.url) {
      window.location.assign(data.url);
      return;
    }

    setStatusMessage("Unable to start Google sign-in.");
  };

  const signOut = async () => {
    await signOutUser(supabase);
  };

  const createList = async () => {
    if (!user || !newListDraft.title.trim()) {
      return;
    }

    let data: List;
    let orderError: unknown = null;

    try {
      const result = await createListWithOwner(supabase, {
        collaboratorEmail: newListDraft.collaboratorEmail,
        collaboratorRole: newListDraft.collaboratorRole,
        itemFields: newListDraft.itemFields,
        lists,
        ownerId: user.id,
        title: newListDraft.title.trim(),
      });

      data = result.list;
      orderError = result.orderError;

      if (result.collaboratorLookupFailed) {
        setStatusMessage(
          "List created, but no account was found for that collaborator email.",
        );
      }
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    if (orderError && !isMissingListOrderPreferencesError(orderError)) {
      setStatusMessage(getErrorMessage(orderError));
    }

    setNewListDraft(emptyNewListDraft);
    setIsCreateListOpen(false);
    await loadLists(user.id);
    setActiveListId(data.id);
  };

  const sendFriendRequest = async () => {
    if (!user || !friendEmail.trim()) {
      return;
    }

    try {
      await sendFriendRequestByEmail(supabase, {
        email: friendEmail,
        userId: user.id,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    setFriendEmail("");
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user) {
      return;
    }

    let error: unknown = null;

    try {
      const result = await acceptFriendRequestNotification(supabase, {
        friendshipId,
        userId: user.id,
      });
      error = result.error;
    } catch (requestError) {
      error = requestError;
    }

    if (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    await loadFriendsAndNotifications(user.id);
  };

  const inviteCollaborator = async () => {
    if (!activeList || !user || !isOwner || !inviteEmail.trim()) {
      return;
    }

    try {
      await inviteListCollaborator(supabase, {
        invitedBy: user.id,
        listId: activeList.id,
        listTitle: activeList.title,
        role: inviteRole,
        targetEmail: inviteEmail,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    setInviteEmail("");
  };

  const acceptListInvite = async (collaboratorId: string) => {
    if (!user) {
      return;
    }

    let error: unknown = null;

    try {
      const result = await acceptListInviteNotification(supabase, {
        collaboratorId,
        userId: user.id,
      });
      error = result.error;
    } catch (requestError) {
      error = requestError;
    }

    if (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    await loadLists(user.id);
    await loadFriendsAndNotifications(user.id);
  };

  const ignoreNotification = async (notification: Notification) => {
    if (!user) {
      return;
    }

    let error: unknown = null;

    try {
      const result = await ignoreAccountNotification(supabase, {
        notification,
        userId: user.id,
      });
      error = result.error;
    } catch (requestError) {
      error = requestError;
    }

    if (error) {
      setStatusMessage(getErrorMessage(error));
      return;
    }

    await loadFriendsAndNotifications(user.id);
    await loadLists(user.id);
  };

  const updateCollaboratorRole = async (
    collaboratorId: string,
    role: ListRole,
  ) => {
    if (!isOwner) {
      return;
    }

    const { error } = await updateListCollaboratorRole(supabase, {
      collaboratorId,
      role,
    });

    if (error) {
      setStatusMessage(error.message);
    }
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories((current) =>
      current.some(
        (selectedCategory) =>
          selectedCategory.toLowerCase() === category.toLowerCase(),
      )
        ? current.filter(
            (selectedCategory) =>
              selectedCategory.toLowerCase() !== category.toLowerCase(),
          )
        : [...current, category],
    );
  };

  const togglePriorityFilter = (priority: Priority) => {
    setSelectedPriorities((current) =>
      current.includes(priority)
        ? current.filter((selectedPriority) => selectedPriority !== priority)
        : [...current, priority],
    );
  };

  const persistListOrder = async (orderedLists: List[]) => {
    if (!user) {
      return;
    }

    let error: unknown = null;

    try {
      const { error: orderError } = await saveListOrderPreferences(supabase, {
        lists: orderedLists,
        userId: user.id,
      });

      error = orderError;
    } catch (orderError) {
      error = orderError;
    }

    if (error) {
      if (isMissingListOrderPreferencesError(error)) {
        setStatusMessage(
          "List ordering is unavailable until the latest Supabase schema is applied.",
        );
        return;
      }

      setStatusMessage(getErrorMessage(error));
      void loadLists(user.id);
    }
  };

  const reorderListByDrop = (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => {
    if (draggedId === targetId) {
      return;
    }

    const draggedIndex = lists.findIndex((list) => list.id === draggedId);
    const targetIndex = lists.findIndex((list) => list.id === targetId);

    if (draggedIndex < 0 || targetIndex < 0) {
      return;
    }

    const orderedLists = [...lists];
    const [movedList] = orderedLists.splice(draggedIndex, 1);
    const nextTargetIndex = orderedLists.findIndex(
      (list) => list.id === targetId,
    );
    const insertionIndex =
      placement === "after" ? nextTargetIndex + 1 : nextTargetIndex;

    orderedLists.splice(insertionIndex, 0, movedList);
    setLists(orderedLists);
    void persistListOrder(orderedLists);
  };

  if (authStatus === "loading") {
    return (
      <Shell isAccountLoading onSignOut={null} profile={null}>
        <main
          className={`app-main ${
            initialSection === "friends" ? "friends-main" : "signed-in-main"
          }`}
        >
          {initialSection === "friends" ? (
            initialFriendId ? (
              <FriendDetailLoadingPanel />
            ) : (
              <FriendsIndexLoadingPanel showLists={null} />
            )
          ) : (
            <ListsWorkspaceLoadingView
              canCreate={false}
              mobileView={mobileView}
              onCreateList={null}
              onShowMobileListIndex={null}
            />
          )}
        </main>
      </Shell>
    );
  }

  if (authStatus === "unauthenticated" || !session) {
    return (
      <Shell
        headerAction={
          <button className="secondary-button" onClick={signIn} type="button">
            Continue with Google
          </button>
        }
        onSignOut={null}
        profile={null}
      >
        <LandingPage onSignIn={signIn} statusMessage={statusMessage} />
      </Shell>
    );
  }

  if (appSection === "friends") {
    return (
      <Shell
        acceptFriendRequest={acceptFriendRequest}
        acceptListInvite={acceptListInvite}
        ignoreNotification={ignoreNotification}
        notifications={notifications}
        onSignOut={signOut}
        profile={profile}
      >
        <main className="app-main friends-main">
          <FriendsPage
            friendSummaries={friendSummaries}
            isLoading={isLoading}
            onBackToFriends={showFriendsIndex}
            onOpenFriend={openFriend}
            onOpenList={openSharedList}
            selectedFriendId={selectedFriendId}
            selectedFriend={selectedFriend}
            showLists={showLists}
          />
          {statusMessage ? (
            <p className="status-message" role="status">
              {statusMessage}
            </p>
          ) : null}
        </main>
      </Shell>
    );
  }

  return (
    <Shell
      acceptFriendRequest={acceptFriendRequest}
      acceptListInvite={acceptListInvite}
      ignoreNotification={ignoreNotification}
      notifications={notifications}
      onSignOut={signOut}
      profile={profile}
    >
      <main className="app-main signed-in-main">
        <ListsWorkspace
          activeList={activeList}
          activeListId={activeListId}
          beginItemDrag={beginItemDrag}
          canCreate
          canEdit={canEdit}
          categoryOptions={categoryOptions}
          collaborators={collaborators}
          completeItemDrop={completeItemDrop}
          deleteItem={deleteItem}
          draggedItemId={draggedItemId}
          draggedListId={draggedListId}
          draft={draft}
          dropIndicator={dropIndicator}
          finishItemDrag={finishItemDrag}
          hasFilterOptions={hasFilterOptions}
          isAddItemOpen={isAddItemOpen}
          isLoading={isLoading}
          itemFields={itemFields}
          items={items}
          listDropIndicator={listDropIndicator}
          lists={lists}
          matchingCategoryOptions={matchingCategoryOptions}
          matchingSuggestions={matchingSuggestions}
          mobileView={mobileView}
          onAddItem={addItem}
          onClearFilters={() => {
            setSelectedCategories([]);
            setSelectedPriorities([]);
          }}
          onCreateList={() => setIsCreateListOpen(true)}
          onOpenCollaboration={() => setActiveListModal("collaboration")}
          onOpenHistory={() => setActiveListModal("history")}
          onOpenOwnerSettings={openOwnerSettings}
          onReorderListByDrop={reorderListByDrop}
          onSelectActiveList={selectActiveList}
          onShowMobileListIndex={showMobileListIndex}
          presenceUsers={presenceUsers}
          priorityFilterOptions={priorityFilterOptions}
          selectedCategories={selectedCategories}
          selectedPriorities={selectedPriorities}
          setDraggedListId={setDraggedListId}
          setDraft={setDraft}
          setDropIndicator={setDropIndicator}
          setEditingItem={setEditingItem}
          setIsAddItemOpen={setIsAddItemOpen}
          setListDropIndicator={setListDropIndicator}
          statusMessage={statusMessage}
          toggleCategoryFilter={toggleCategoryFilter}
          toggleItem={toggleItem}
          togglePriorityFilter={togglePriorityFilter}
          visibleItemGroups={visibleItemGroups}
        />
      </main>

      {editingItem ? (
        <EditItemModal
          categoryOptions={categoryOptions}
          collaborators={collaborators}
          itemFields={itemFields}
          item={editingItem}
          listId={activeList?.id ?? null}
          saveItemDetails={saveItemDetails}
          setEditingItem={setEditingItem}
        />
      ) : null}

      {restoreSnapshot ? (
        <RestoreListModal
          currentHasItems={items.length > 0}
          restoreList={restoreList}
          setRestoreSnapshot={setRestoreSnapshot}
          snapshot={restoreSnapshot}
        />
      ) : null}

      {activeList && activeListModal === "collaboration" ? (
        <CollaborationModal
          acceptedFriendProfiles={acceptedFriendProfiles}
          activeList={activeList}
          appOrigin={appOrigin}
          collaborators={collaborators}
          friendEmail={friendEmail}
          friends={friends}
          inviteCollaborator={inviteCollaborator}
          inviteEmail={inviteEmail}
          inviteRole={inviteRole}
          isOwner={isOwner}
          onClose={() => setActiveListModal(null)}
          sendFriendRequest={sendFriendRequest}
          setFriendEmail={setFriendEmail}
          setInviteEmail={setInviteEmail}
          setInviteRole={setInviteRole}
          setShareRole={setShareRole}
          shareRole={shareRole}
          updateCollaboratorRole={updateCollaboratorRole}
          userId={session.user.id}
        />
      ) : null}

      {activeList && activeListModal === "owner" ? (
        <ListSettingsModal
          activeList={activeList}
          clearAll={clearAll}
          deleteActiveList={deleteActiveList}
          deleteListConfirmation={deleteListConfirmation}
          isOwner={isOwner}
          itemFields={itemFields}
          listNameDraft={listNameDraft}
          onClose={() => setActiveListModal(null)}
          removeCompleted={removeCompleted}
          setDeleteListConfirmation={setDeleteListConfirmation}
          setListNameDraft={setListNameDraft}
          updateItemFieldSetting={updateItemFieldSetting}
          updateListName={updateListName}
        />
      ) : null}

      {activeList && activeListModal === "history" ? (
        <ListHistoryModal
          isOwner={isOwner}
          onClose={() => setActiveListModal(null)}
          openRestoreSnapshot={(snapshot) => {
            setActiveListModal(null);
            setRestoreSnapshot(snapshot);
          }}
          snapshots={snapshots}
        />
      ) : null}

      {isCreateListOpen ? (
        <CreateListModal
          acceptedFriendProfiles={acceptedFriendProfiles}
          createList={createList}
          newListDraft={newListDraft}
          onClose={() => setIsCreateListOpen(false)}
          setNewListDraft={setNewListDraft}
        />
      ) : null}
    </Shell>
  );
}

const getCurrentRole = (
  activeList: List | null,
  collaborators: Collaborator[],
  userId: string | null,
): ListRole | null => {
  if (!activeList || !userId) {
    return null;
  }

  if (activeList.owner_id === userId) {
    return "owner";
  }

  return (
    collaborators.find((collaborator) => collaborator.user_id === userId)
      ?.role ?? null
  );
};
