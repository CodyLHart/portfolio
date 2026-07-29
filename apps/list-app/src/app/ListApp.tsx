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
} from "../features/lists/lib/list-api";
import {
  deleteListItems,
  insertSnapshotItems,
  loadListWorkspaceData,
} from "../features/lists/lib/item-api";
import {
  buildSnapshotRestoreRows,
  createListSnapshot,
} from "../features/lists/lib/history-api";
import {
  useListModalState,
  type ActiveListModal,
} from "../features/lists/hooks/useListModalState";
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

type AppSection = "lists" | "friends";
type AuthStatus = "loading" | "authenticated" | "unauthenticated";

const getOAuthRedirectUrl = () => {
  if (typeof window === "undefined") {
    return undefined;
  }

  const url = new URL(window.location.href);

  if (url.hostname === "127.0.0.1" && url.port === "3001") {
    url.hostname = "localhost";
  }

  return url.toString();
};

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
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [dropIndicator, setDropIndicator] = useState<{
    itemId: string;
    placement: DropPlacement;
  } | null>(null);
  const [draggedListId, setDraggedListId] = useState<string | null>(null);
  const [listDropIndicator, setListDropIndicator] =
    useState<ListDropIndicator>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [isLoading, setIsLoading] = useState(true);
  const dropHandledRef = useRef(false);
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
    const metadata = authUser.user_metadata;
    const nextProfile = {
      avatar_url: (metadata.avatar_url as string | undefined) ?? null,
      display_name:
        (metadata.full_name as string | undefined) ??
        (metadata.name as string | undefined) ??
        authUser.email ??
        "List App User",
      email: authUser.email ?? "",
      id: authUser.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("profiles").upsert(nextProfile, {
      onConflict: "id",
    });

    if (error) {
      throw error;
    }

    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    setProfile(data as Profile);
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

    const acceptShareLink = async () => {
      const { data, error } = await supabase.rpc("accept_share_link", {
        requested_role: requestedRole,
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

    void acceptShareLink();
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

  const openOwnerSettings = () => {
    setListNameDraft(activeList?.title ?? "");
    setActiveListModal("owner");
  };

  const signIn = async () => {
    if (!isSupabaseConfigured) {
      setStatusMessage("Supabase environment variables are missing.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: getOAuthRedirectUrl(),
        skipBrowserRedirect: true,
      },
      provider: "google",
    });

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
    await supabase.auth.signOut();
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

  const addItem = async () => {
    if (!activeList || !user || !draft.title.trim() || !canEdit) {
      return;
    }

    const nextPosition =
      Math.max(0, ...items.map((item) => Number(item.position))) + 1;
    const { data, error } = await supabase
      .from("list_items")
      .insert({
        assigned_to: draft.assigned_to || null,
        category: draft.category.trim() || null,
        created_by: user.id,
        due_date: draft.due_date || null,
        list_id: activeList.id,
        notes: draft.notes.trim() || null,
        position: nextPosition,
        priority: draft.priority || null,
        quantity: draft.quantity.trim() || null,
        title: draft.title.trim(),
      })
      .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
      .single();

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) => [...current, data as ListItem]);
    await upsertSuggestion(activeList.id, draft.title, draft.category);
    setDraft(emptyItemDraft);
    setIsAddItemOpen(false);
  };

  const updateItem = async (item: ListItem, patch: Partial<ListItem>) => {
    if (!canEdit) {
      return;
    }

    const { data, error } = await supabase
      .from("list_items")
      .update({
        ...patch,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
      .single();

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id ? (data as ListItem) : currentItem,
      ),
    );
  };

  const deleteItem = async (item: ListItem) => {
    if (!canEdit) {
      return;
    }

    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("id", item.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) =>
      current.filter((currentItem) => currentItem.id !== item.id),
    );
  };

  const toggleItem = async (item: ListItem) => {
    await updateItem(item, {
      completed: !item.completed,
      completed_at: item.completed ? null : new Date().toISOString(),
      position: item.completed
        ? item.position
        : Math.max(0, ...items.map((entry) => Number(entry.position))) + 1,
    });
  };

  const reorderItem = async (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => {
    if (!canEdit || draggedId === targetId) {
      return;
    }

    const draggedItem = items.find((item) => item.id === draggedId);
    const targetItem = items.find((item) => item.id === targetId);

    if (!draggedItem || !targetItem) {
      return;
    }

    const orderedItems = items
      .filter((entry) => entry.completed === draggedItem.completed)
      .sort((first, second) => first.position - second.position);
    const fromIndex = orderedItems.findIndex((entry) => entry.id === draggedId);

    if (fromIndex < 0) {
      return;
    }

    const nextOrderedItems = [...orderedItems];
    const [movedItem] = nextOrderedItems.splice(fromIndex, 1);
    const targetIndexAfterRemoval = nextOrderedItems.findIndex(
      (entry) => entry.id === targetId,
    );

    if (
      targetIndexAfterRemoval < 0 &&
      draggedItem.completed === targetItem.completed
    ) {
      return;
    }

    const insertionIndex =
      targetIndexAfterRemoval < 0
        ? nextOrderedItems.length
        : placement === "after"
          ? targetIndexAfterRemoval + 1
          : targetIndexAfterRemoval;
    nextOrderedItems.splice(insertionIndex, 0, movedItem);

    const updatedItems = nextOrderedItems.map((item, index) => ({
      ...item,
      position: index + 1,
    }));

    setItems((current) =>
      current.map(
        (item) =>
          updatedItems.find((updatedItem) => updatedItem.id === item.id) ??
          item,
      ),
    );

    const results = await Promise.all(
      updatedItems.map((item) =>
        supabase
          .from("list_items")
          .update({ position: item.position })
          .eq("id", item.id),
      ),
    );

    const failedResult = results.find((result) => result.error);
    if (failedResult?.error) {
      setStatusMessage(failedResult.error.message);
      void loadListData(activeListId ?? "");
      return;
    }
  };

  const beginItemDrag = (itemId: string) => {
    dropHandledRef.current = false;
    setDraggedItemId(itemId);
  };

  const finishItemDrag = () => {
    if (!dropHandledRef.current && draggedItemId && dropIndicator) {
      void reorderItem(
        draggedItemId,
        dropIndicator.itemId,
        dropIndicator.placement,
      );
    }

    dropHandledRef.current = false;
    setDraggedItemId(null);
    setDropIndicator(null);
  };

  const completeItemDrop = (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => {
    dropHandledRef.current = true;
    setDraggedItemId(null);
    setDropIndicator(null);
    void reorderItem(draggedId, targetId, placement);
  };

  const saveItemDetails = async () => {
    if (!editingItem) {
      return;
    }

    await updateItem(editingItem, {
      assigned_to: editingItem.assigned_to || null,
      category: editingItem.category?.trim() || null,
      due_date: editingItem.due_date || null,
      notes: editingItem.notes?.trim() || null,
      priority: editingItem.priority || null,
      quantity: editingItem.quantity?.trim() || null,
      title: editingItem.title.trim(),
    });
    setEditingItem(null);
  };

  const removeCompleted = async () => {
    if (!activeList || !isOwner) {
      return;
    }

    await createSnapshot("Before removing completed");
    const completed = items.filter((item) => item.completed);
    await Promise.all(
      completed.map((item) =>
        upsertSuggestion(activeList.id, item.title, item.category ?? ""),
      ),
    );
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", activeList.id)
      .eq("completed", true);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems((current) => current.filter((item) => !item.completed));
  };

  const clearAll = async () => {
    if (!activeList || !isOwner) {
      return;
    }

    await createSnapshot("Before clearing all");
    await Promise.all(
      items.map((item) =>
        upsertSuggestion(activeList.id, item.title, item.category ?? ""),
      ),
    );
    const { error } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setItems([]);
  };

  const deleteActiveList = async () => {
    if (
      !activeList ||
      !isOwner ||
      deleteListConfirmation !== activeList.title
    ) {
      return;
    }

    const { error } = await supabase
      .from("lists")
      .delete()
      .eq("id", activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    const remainingLists = lists.filter((list) => list.id !== activeList.id);
    setLists(remainingLists);
    setActiveListId(remainingLists[0]?.id ?? null);
    setItems([]);
    setCollaborators([]);
    setSnapshots([]);
    setSuggestions([]);
    setDeleteListConfirmation("");
    setActiveListModal(null);
  };

  const createSnapshot = async (label: string) => {
    if (!activeList || !user || items.length === 0) {
      return null;
    }

    try {
      return await createListSnapshot(supabase, {
        createdBy: user.id,
        items,
        label,
        listId: activeList.id,
      });
    } catch (error) {
      setStatusMessage(getErrorMessage(error));
      return null;
    }
  };

  const restoreList = async (snapshot: ListSnapshot) => {
    if (!activeList || !user || !isOwner) {
      return;
    }

    if (items.length > 0) {
      await createSnapshot("Before restoring snapshot");
    }

    await deleteListItems(supabase, activeList.id);
    const rows = buildSnapshotRestoreRows({
      createdBy: user.id,
      listId: activeList.id,
      snapshot,
    });

    if (rows.length > 0) {
      const { error } = await insertSnapshotItems(supabase, rows);

      if (error) {
        setStatusMessage(error.message);
        return;
      }
    }

    setRestoreSnapshot(null);
    void loadListData(activeList.id);
  };

  const upsertSuggestion = async (
    listId: string,
    title: string,
    category: string,
  ) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    const existing = suggestions.find(
      (suggestion) =>
        suggestion.title.toLowerCase() === cleanTitle.toLowerCase(),
    );

    if (existing) {
      await supabase
        .from("list_item_suggestions")
        .update({
          category: category.trim() || existing.category,
          last_used_at: new Date().toISOString(),
          usage_count: existing.usage_count + 1,
        })
        .eq("id", existing.id);
      return;
    }

    await supabase.from("list_item_suggestions").insert({
      category: category.trim() || null,
      list_id: listId,
      title: cleanTitle,
    });
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

    const { data: target } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", inviteEmail.trim().toLowerCase())
      .maybeSingle();

    if (!target) {
      setStatusMessage("No account found for that exact email.");
      return;
    }

    const { data, error } = await supabase
      .from("list_collaborators")
      .upsert(
        {
          invited_by: user.id,
          list_id: activeList.id,
          role: inviteRole,
          status: "pending",
          user_id: target.id,
        },
        { onConflict: "list_id,user_id" },
      )
      .select("*")
      .single();

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await supabase.from("notifications").insert({
      actor_id: user.id,
      payload: {
        collaboratorId: data.id,
        listId: activeList.id,
        listTitle: activeList.title,
      },
      recipient_id: target.id,
      type: "list_invite",
    });
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

    const { error } = await supabase
      .from("list_collaborators")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("id", collaboratorId);

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

    const timestamp = new Date().toISOString();
    let error: unknown = null;

    try {
      const { error: orderError } = await supabase
        .from("list_order_preferences")
        .upsert(
          orderedLists.map((list, index) => ({
            list_id: list.id,
            position: index + 1,
            updated_at: timestamp,
            user_id: user.id,
          })),
          { onConflict: "user_id,list_id" },
        );

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

  const updateListName = async () => {
    if (!activeList || !isOwner || !listNameDraft.trim()) {
      return;
    }

    const nextTitle = listNameDraft.trim();
    const { error } = await supabase
      .from("lists")
      .update({ title: nextTitle, updated_at: new Date().toISOString() })
      .eq("id", activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id ? { ...list, title: nextTitle } : list,
      ),
    );
    setDeleteListConfirmation("");
  };

  const updateItemFieldSetting = async (
    field: keyof ListItemFields,
    value: boolean,
  ) => {
    if (!activeList || !isOwner) {
      return;
    }

    const nextFields = {
      ...itemFields,
      [field]: value,
    };

    const { error } = await supabase
      .from("lists")
      .update({ item_fields: nextFields, updated_at: new Date().toISOString() })
      .eq("id", activeList.id);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setLists((current) =>
      current.map((list) =>
        list.id === activeList.id ? { ...list, item_fields: nextFields } : list,
      ),
    );

    if (field === "category" && !value) {
      setSelectedCategories([]);
    }

    if (field === "priority" && !value) {
      setSelectedPriorities([]);
    }
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

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  const maybeError = error as { message?: unknown };
  if (typeof maybeError?.message === "string") {
    return maybeError.message;
  }

  return "Something went wrong.";
};
