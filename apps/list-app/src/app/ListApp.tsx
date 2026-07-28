"use client";

import type { Session, User } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell as Shell } from "../components/layout/AppShell";
import { Avatar } from "../components/ui/Avatar";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { LandingPage } from "../features/landing/components/LandingPage";
import { ListDetailLoadingPanel } from "../features/lists/components/ListDetailLoadingPanel";
import {
  ListsWorkspace,
  ListsWorkspaceLoadingView,
} from "../features/lists/components/ListsWorkspace";
import {
  buildVisibleItemGroups,
  emptyNewListDraft,
  getCategoryOptions,
  getCategoryStyle,
  getPriorityFilterOptions,
  itemFieldOptions,
  normalizeItemFields,
  priorityOptions,
  sortListsByPreference,
} from "../features/lists/lib/list-utils";
import type {
  DropPlacement,
  ListDropIndicator,
  MobileView,
} from "../features/lists/types";
import { formatDateTime } from "../lib/format";
import {
  buildFriendSummaries,
  findFriendSummary,
  getRoleForList,
  type FriendSummary,
} from "../lib/friends";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import {
  Collaborator,
  emptyItemDraft,
  FriendRequest,
  ItemDraft,
  List,
  ListItemFields,
  ListItem,
  ListOrderPreference,
  ListRole,
  ListSnapshot,
  Notification,
  Priority,
  Profile,
  SnapshotItem,
  Suggestion,
} from "../lib/types";

type ActiveListModal = "collaboration" | "owner" | "history" | null;
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
  const [newListDraft, setNewListDraft] = useState(emptyNewListDraft);
  const [isCreateListOpen, setIsCreateListOpen] = useState(false);
  const [friendEmail, setFriendEmail] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ListRole>("editor");
  const [shareRole, setShareRole] = useState<ListRole>("viewer");
  const [editingItem, setEditingItem] = useState<ListItem | null>(null);
  const [restoreSnapshot, setRestoreSnapshot] = useState<ListSnapshot | null>(
    null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriorities, setSelectedPriorities] = useState<Priority[]>([]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [activeListModal, setActiveListModal] = useState<ActiveListModal>(null);
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
  const friendSummaries = useMemo<FriendSummary[]>(
    () =>
      buildFriendSummaries({
        collaborators: allListCollaborators,
        currentUserId: user?.id ?? null,
        lists,
      }),
    [allListCollaborators, lists, user?.id],
  );
  const selectedFriend = findFriendSummary(friendSummaries, selectedFriendId);
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
    const [ownedResult, collabResult, orderResult] = await Promise.all([
      supabase
        .from("lists")
        .select("*")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("list_collaborators")
        .select("list_id, lists(*)")
        .eq("user_id", userId)
        .eq("status", "accepted"),
      supabase.from("list_order_preferences").select("*").eq("user_id", userId),
    ]);

    if (ownedResult.error) {
      throw ownedResult.error;
    }

    if (collabResult.error) {
      throw collabResult.error;
    }

    if (
      orderResult.error &&
      !isMissingListOrderPreferencesError(orderResult.error)
    ) {
      throw orderResult.error;
    }

    const ownedLists = (ownedResult.data ?? []) as List[];
    const collaboratorLists = (collabResult.data ?? [])
      .map((row) => row.lists as unknown as List | null)
      .filter(Boolean) as List[];
    const uniqueLists = Array.from(
      new Map(
        [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
      ).values(),
    );
    const orderPreferences = orderResult.error
      ? []
      : ((orderResult.data ?? []) as ListOrderPreference[]);
    const sortedLists = sortListsByPreference(uniqueLists, orderPreferences);
    const listIds = sortedLists.map((list) => list.id);

    setLists(sortedLists);
    setActiveListId((current) => current ?? sortedLists[0]?.id ?? null);

    if (listIds.length === 0) {
      setAllListCollaborators([]);
      return;
    }

    const { data: allCollaboratorsData, error: allCollaboratorsError } =
      await supabase
        .from("list_collaborators")
        .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
        .in("list_id", listIds);

    if (allCollaboratorsError) {
      throw allCollaboratorsError;
    }

    setAllListCollaborators((allCollaboratorsData ?? []) as Collaborator[]);
  }, []);

  const loadFriendsWorkspaceData = useCallback(async (userId: string) => {
    const [ownedResult, collabResult] = await Promise.all([
      supabase
        .from("lists")
        .select("*")
        .eq("owner_id", userId)
        .order("updated_at", { ascending: false }),
      supabase
        .from("list_collaborators")
        .select("list_id, lists(*)")
        .eq("user_id", userId)
        .eq("status", "accepted"),
    ]);

    if (ownedResult.error) {
      throw ownedResult.error;
    }

    if (collabResult.error) {
      throw collabResult.error;
    }

    const ownedLists = (ownedResult.data ?? []) as List[];
    const collaboratorLists = (collabResult.data ?? [])
      .map((row) => row.lists as unknown as List | null)
      .filter(Boolean) as List[];
    const sharedCandidateLists = Array.from(
      new Map(
        [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
      ).values(),
    );
    const listIds = sharedCandidateLists.map((list) => list.id);

    if (listIds.length === 0) {
      setLists([]);
      setAllListCollaborators([]);
      return;
    }

    const { data, error } = await supabase
      .from("list_collaborators")
      .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
      .in("list_id", listIds)
      .eq("status", "accepted");

    if (error) {
      throw error;
    }

    const acceptedCollaborators = (data ?? []) as Collaborator[];
    const sharedListIds = new Set(
      acceptedCollaborators
        .filter(
          (collaborator) =>
            collaborator.user_id !== userId &&
            listIds.includes(collaborator.list_id),
        )
        .map((collaborator) => collaborator.list_id),
    );

    setLists(sharedCandidateLists.filter((list) => sharedListIds.has(list.id)));
    setAllListCollaborators(
      acceptedCollaborators.filter((collaborator) =>
        sharedListIds.has(collaborator.list_id),
      ),
    );
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
    const [friendsResult, notificationsResult] = await Promise.all([
      supabase
        .from("friendships")
        .select(
          "*, requester:profiles!friendships_requester_id_fkey(*), addressee:profiles!friendships_addressee_id_fkey(*)",
        )
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .order("updated_at", { ascending: false }),
      supabase
        .from("notifications")
        .select("*, actor:profiles!notifications_actor_id_fkey(*)")
        .eq("recipient_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (!friendsResult.error) {
      setFriends((friendsResult.data ?? []) as FriendRequest[]);
    }

    if (!notificationsResult.error) {
      setNotifications((notificationsResult.data ?? []) as Notification[]);
    }
  }, []);

  const loadListData = useCallback(async (listId: string) => {
    const [
      itemsResult,
      collaboratorsResult,
      snapshotsResult,
      suggestionsResult,
    ] = await Promise.all([
      supabase
        .from("list_items")
        .select("*, assignee:profiles!list_items_assigned_to_fkey(*)")
        .eq("list_id", listId)
        .order("position", { ascending: true }),
      supabase
        .from("list_collaborators")
        .select("*, profile:profiles!list_collaborators_user_id_fkey(*)")
        .eq("list_id", listId),
      supabase
        .from("list_snapshots")
        .select("*")
        .eq("list_id", listId)
        .order("created_at", { ascending: false }),
      supabase
        .from("list_item_suggestions")
        .select("*")
        .eq("list_id", listId)
        .order("usage_count", { ascending: false }),
    ]);

    if (!itemsResult.error) {
      setItems((itemsResult.data ?? []) as ListItem[]);
    }

    if (!collaboratorsResult.error) {
      setCollaborators((collaboratorsResult.data ?? []) as Collaborator[]);
    }

    if (!snapshotsResult.error) {
      setSnapshots((snapshotsResult.data ?? []) as ListSnapshot[]);
    }

    if (!suggestionsResult.error) {
      setSuggestions((suggestionsResult.data ?? []) as Suggestion[]);
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

    const { data, error } = await supabase
      .from("lists")
      .insert({
        item_fields: newListDraft.itemFields,
        owner_id: user.id,
        title: newListDraft.title.trim(),
      })
      .select("*")
      .single();

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await supabase.from("list_collaborators").insert({
      list_id: data.id,
      role: "owner",
      status: "accepted",
      user_id: user.id,
    });

    const collaboratorEmail = newListDraft.collaboratorEmail
      .trim()
      .toLowerCase();
    if (collaboratorEmail) {
      const { data: target } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", collaboratorEmail)
        .maybeSingle();

      if (target && target.id !== user.id) {
        const { data: collaborator } = await supabase
          .from("list_collaborators")
          .upsert(
            {
              invited_by: user.id,
              list_id: data.id,
              role: newListDraft.collaboratorRole,
              status: "pending",
              user_id: target.id,
            },
            { onConflict: "list_id,user_id" },
          )
          .select("*")
          .single();

        if (collaborator) {
          await supabase.from("notifications").insert({
            actor_id: user.id,
            payload: {
              collaboratorId: collaborator.id,
              listId: data.id,
              listTitle: data.title,
            },
            recipient_id: target.id,
            type: "list_invite",
          });
        }
      } else {
        setStatusMessage(
          "List created, but no account was found for that collaborator email.",
        );
      }
    }

    const timestamp = new Date().toISOString();
    let orderError: unknown = null;

    try {
      const { error } = await supabase.from("list_order_preferences").upsert(
        [data as List, ...lists].map((list, index) => ({
          list_id: list.id,
          position: index + 1,
          updated_at: timestamp,
          user_id: user.id,
        })),
        { onConflict: "user_id,list_id" },
      );

      orderError = error;
    } catch (error) {
      orderError = error;
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

    const snapshotItems: SnapshotItem[] = items.map((item) => ({
      assigned_to: item.assigned_to,
      category: item.category,
      completed: item.completed,
      due_date: item.due_date,
      notes: item.notes,
      position: item.position,
      priority: item.priority,
      quantity: item.quantity,
      title: item.title,
    }));

    const { data, error } = await supabase
      .from("list_snapshots")
      .insert({
        created_by: user.id,
        items: snapshotItems,
        label,
        list_id: activeList.id,
      })
      .select("*")
      .single();

    if (error) {
      setStatusMessage(error.message);
      return null;
    }

    return data as ListSnapshot;
  };

  const restoreList = async (snapshot: ListSnapshot) => {
    if (!activeList || !user || !isOwner) {
      return;
    }

    if (items.length > 0) {
      await createSnapshot("Before restoring snapshot");
    }

    await supabase.from("list_items").delete().eq("list_id", activeList.id);
    const rows = snapshot.items.map((item, index) => ({
      ...item,
      assigned_to: item.assigned_to || null,
      completed_at: item.completed ? new Date().toISOString() : null,
      created_by: user.id,
      list_id: activeList.id,
      position: index + 1,
    }));

    if (rows.length > 0) {
      const { error } = await supabase.from("list_items").insert(rows);

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

    const { data: target, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("email", friendEmail.trim().toLowerCase())
      .maybeSingle();

    if (error || !target) {
      setStatusMessage("No account found for that exact email.");
      return;
    }

    if (target.id === user.id) {
      setStatusMessage("You cannot add yourself as a friend.");
      return;
    }

    const { data: friendship, error: friendshipError } = await supabase
      .from("friendships")
      .insert({
        addressee_id: target.id,
        requester_id: user.id,
        status: "pending",
      })
      .select("*")
      .single();

    if (friendshipError) {
      setStatusMessage(friendshipError.message);
      return;
    }

    await supabase.from("notifications").insert({
      actor_id: user.id,
      payload: { friendshipId: friendship.id },
      recipient_id: target.id,
      type: "friend_request",
    });
    setFriendEmail("");
  };

  const acceptFriendRequest = async (friendshipId: string) => {
    if (!user) {
      return;
    }

    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("type", "friend_request")
      .contains("payload", { friendshipId });

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

    const { error } = await supabase
      .from("list_collaborators")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", collaboratorId);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("recipient_id", user.id)
      .eq("type", "list_invite")
      .contains("payload", { collaboratorId });

    await loadLists(user.id);
    await loadFriendsAndNotifications(user.id);
  };

  const ignoreNotification = async (notification: Notification) => {
    if (!user) {
      return;
    }

    if (notification.type === "friend_request") {
      const friendshipId = String(notification.payload.friendshipId ?? "");
      if (friendshipId) {
        const { error } = await supabase
          .from("friendships")
          .update({ status: "blocked", updated_at: new Date().toISOString() })
          .eq("id", friendshipId)
          .eq("status", "pending");

        if (error) {
          setStatusMessage(error.message);
          return;
        }
      }
    }

    if (notification.type === "list_invite") {
      const collaboratorId = String(notification.payload.collaboratorId ?? "");
      if (collaboratorId) {
        const { error } = await supabase
          .from("list_collaborators")
          .update({ status: "declined", updated_at: new Date().toISOString() })
          .eq("id", collaboratorId)
          .eq("status", "pending");

        if (error) {
          setStatusMessage(error.message);
          return;
        }
      }
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", notification.id)
      .eq("recipient_id", user.id);

    if (error) {
      setStatusMessage(error.message);
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
          <FriendsPanel
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
        <ItemModal
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
        <RestoreModal
          currentHasItems={items.length > 0}
          restoreList={restoreList}
          setRestoreSnapshot={setRestoreSnapshot}
          snapshot={restoreSnapshot}
        />
      ) : null}

      {activeList && activeListModal === "collaboration" ? (
        <ListToolModal
          title="Collaboration"
          onClose={() => setActiveListModal(null)}
        >
          <p className="eyebrow">Friends</p>
          <div className="field-grid">
            <input
              onChange={(event) => setFriendEmail(event.target.value)}
              placeholder="Friend email"
              value={friendEmail}
            />
            <button
              className="secondary-button"
              onClick={sendFriendRequest}
              type="button"
            >
              Add Friend
            </button>
          </div>
          <FriendList friends={friends} userId={session.user.id} />
          <p className="eyebrow">Invite To List</p>
          <div className="field-grid">
            {acceptedFriendProfiles.length > 0 ? (
              <select
                disabled={!isOwner}
                onChange={(event) => {
                  if (event.target.value) {
                    setInviteEmail(event.target.value);
                  }
                }}
                value=""
              >
                <option value="">Select existing friend</option>
                {acceptedFriendProfiles.map((friend) => (
                  <option key={friend.id} value={friend.email}>
                    {friend.display_name} ({friend.email})
                  </option>
                ))}
              </select>
            ) : null}
            <input
              disabled={!isOwner}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="Invite exact email"
              value={inviteEmail}
            />
            <select
              disabled={!isOwner}
              onChange={(event) =>
                setInviteRole(event.target.value as ListRole)
              }
              value={inviteRole}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
            <button
              className="secondary-button"
              disabled={!isOwner}
              onClick={inviteCollaborator}
              type="button"
            >
              Invite to list
            </button>
          </div>
          <div className="field-grid">
            <label>
              Share role
              <select
                onChange={(event) =>
                  setShareRole(event.target.value as ListRole)
                }
                value={shareRole}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
            </label>
            <input
              readOnly
              value={`${appOrigin}?join=${activeList.share_token}&role=${shareRole}`}
            />
          </div>
          <CollaboratorList
            collaborators={collaborators}
            isOwner={isOwner}
            updateCollaboratorRole={updateCollaboratorRole}
          />
        </ListToolModal>
      ) : null}

      {activeList && activeListModal === "owner" ? (
        <ListToolModal
          title="List settings"
          onClose={() => setActiveListModal(null)}
        >
          <p className="muted">
            These actions change the current list for every collaborator.
          </p>
          <p className="eyebrow">List Name</p>
          <div className="field-grid">
            <input
              disabled={!isOwner}
              onChange={(event) => setListNameDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void updateListName();
                }
              }}
              value={listNameDraft}
            />
            <button
              className="secondary-button"
              disabled={
                !isOwner ||
                !listNameDraft.trim() ||
                listNameDraft.trim() === activeList.title
              }
              onClick={updateListName}
              type="button"
            >
              Save name
            </button>
          </div>
          <p className="eyebrow">Item Fields</p>
          <div className="field-toggle-grid">
            {itemFieldOptions.map((fieldOption) => (
              <label className="field-toggle" key={fieldOption.key}>
                <input
                  checked={itemFields[fieldOption.key]}
                  disabled={!isOwner}
                  onChange={(event) =>
                    updateItemFieldSetting(
                      fieldOption.key,
                      event.target.checked,
                    )
                  }
                  type="checkbox"
                />
                <span>{fieldOption.label}</span>
              </label>
            ))}
          </div>
          <p className="eyebrow">List Actions</p>
          <div className="inline-actions">
            <button
              className="danger-button"
              disabled={!isOwner}
              onClick={removeCompleted}
              type="button"
            >
              Remove completed
            </button>
            <button
              className="danger-button"
              disabled={!isOwner}
              onClick={clearAll}
              type="button"
            >
              Clear all
            </button>
          </div>
          <p className="eyebrow">Delete list</p>
          <div className="danger-zone">
            <p className="muted">
              Type <strong>{activeList.title}</strong> to permanently delete
              this list.
            </p>
            <input
              disabled={!isOwner}
              onChange={(event) =>
                setDeleteListConfirmation(event.target.value)
              }
              value={deleteListConfirmation}
            />
            <button
              className="danger-button"
              disabled={!isOwner || deleteListConfirmation !== activeList.title}
              onClick={deleteActiveList}
              type="button"
            >
              Delete list
            </button>
          </div>
        </ListToolModal>
      ) : null}

      {activeList && activeListModal === "history" ? (
        <ListToolModal title="History" onClose={() => setActiveListModal(null)}>
          <div className="history-list">
            {snapshots.length === 0 ? (
              <p className="muted">No saved history yet.</p>
            ) : null}
            {snapshots.map((snapshot) => (
              <div className="small-card" key={snapshot.id}>
                <strong>{snapshot.label}</strong>
                <span className="muted">
                  {formatDateTime(snapshot.created_at)}
                </span>
                <button
                  className="secondary-button"
                  disabled={!isOwner}
                  onClick={() => {
                    setActiveListModal(null);
                    setRestoreSnapshot(snapshot);
                  }}
                  type="button"
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </ListToolModal>
      ) : null}

      {isCreateListOpen ? (
        <ListToolModal
          title="Create list"
          onClose={() => setIsCreateListOpen(false)}
        >
          <div className="field-grid">
            <label>
              List name
              <input
                autoFocus
                onChange={(event) =>
                  setNewListDraft((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void createList();
                  }
                }}
                value={newListDraft.title}
              />
            </label>
          </div>
          <p className="eyebrow">Item Fields</p>
          <div className="field-toggle-grid">
            {itemFieldOptions.map((fieldOption) => (
              <label className="field-toggle" key={fieldOption.key}>
                <input
                  checked={newListDraft.itemFields[fieldOption.key]}
                  onChange={(event) =>
                    setNewListDraft((current) => ({
                      ...current,
                      itemFields: {
                        ...current.itemFields,
                        [fieldOption.key]: event.target.checked,
                      },
                    }))
                  }
                  type="checkbox"
                />
                <span>{fieldOption.label}</span>
              </label>
            ))}
          </div>
          <p className="eyebrow">Optional Collaborator</p>
          <div className="field-grid">
            {acceptedFriendProfiles.length > 0 ? (
              <select
                onChange={(event) => {
                  if (event.target.value) {
                    setNewListDraft((current) => ({
                      ...current,
                      collaboratorEmail: event.target.value,
                    }));
                  }
                }}
                value=""
              >
                <option value="">Select existing friend</option>
                {acceptedFriendProfiles.map((friend) => (
                  <option key={friend.id} value={friend.email}>
                    {friend.display_name} ({friend.email})
                  </option>
                ))}
              </select>
            ) : null}
            <input
              onChange={(event) =>
                setNewListDraft((current) => ({
                  ...current,
                  collaboratorEmail: event.target.value,
                }))
              }
              placeholder="Exact email"
              value={newListDraft.collaboratorEmail}
            />
            <select
              onChange={(event) =>
                setNewListDraft((current) => ({
                  ...current,
                  collaboratorRole: event.target.value as ListRole,
                }))
              }
              value={newListDraft.collaboratorRole}
            >
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div className="inline-actions">
            <button
              className="primary-button"
              onClick={createList}
              type="button"
            >
              Create list
            </button>
            <button
              className="secondary-button"
              onClick={() => setIsCreateListOpen(false)}
              type="button"
            >
              Cancel
            </button>
          </div>
        </ListToolModal>
      ) : null}
    </Shell>
  );
}

function FriendsPanel({
  friendSummaries,
  isLoading,
  onBackToFriends,
  onOpenFriend,
  onOpenList,
  selectedFriendId,
  selectedFriend,
  showLists,
}: {
  friendSummaries: FriendSummary[];
  isLoading: boolean;
  onBackToFriends: () => void;
  onOpenFriend: (friendId: string) => void;
  onOpenList: (listId: string) => void;
  selectedFriendId: string | null;
  selectedFriend: FriendSummary | null;
  showLists: () => void;
}) {
  const shouldShowLoading =
    isLoading &&
    (selectedFriendId ? !selectedFriend : friendSummaries.length === 0);

  if (shouldShowLoading) {
    return selectedFriendId ? (
      <FriendDetailLoadingPanel onBackToFriends={onBackToFriends} />
    ) : (
      <FriendsIndexLoadingPanel showLists={showLists} />
    );
  }

  if (selectedFriendId && !selectedFriend) {
    return (
      <div className="friends-screen">
        <button
          aria-label="Back to friends"
          className="mobile-back-button friends-back-button"
          onClick={onBackToFriends}
          type="button"
        >
          &larr; Friends
        </button>
        <div className="empty-state">
          <h2>No shared lists</h2>
          <p>You no longer share any lists with this person.</p>
          <button
            className="secondary-button"
            onClick={onBackToFriends}
            type="button"
          >
            Back to friends
          </button>
        </div>
      </div>
    );
  }

  if (selectedFriend) {
    return (
      <div className="friends-screen friend-detail-screen">
        <div className="friends-screen-header">
          <button
            aria-label="Back to friends"
            className="mobile-back-button friends-back-button"
            onClick={onBackToFriends}
            type="button"
          >
            &larr; Friends
          </button>
          <div className="friend-heading">
            <Avatar profile={selectedFriend.profile} size="large" />
            <div>
              <p className="eyebrow">Friend</p>
              <h1>{selectedFriend.profile.display_name}</h1>
              <p className="muted">{selectedFriend.profile.email}</p>
            </div>
          </div>
        </div>
        <div className="friends-section">
          <div>
            <h2>Lists shared with {selectedFriend.profile.display_name}</h2>
            <p className="muted">
              Open a shared list to manage it with the existing list tools.
            </p>
          </div>
          {selectedFriend.sharedLists.length === 0 ? (
            <div className="empty-state">
              <h2>No shared lists</h2>
              <p>
                You don&apos;t currently have any lists shared with this person.
              </p>
            </div>
          ) : (
            <div className="shared-list-rows">
              {selectedFriend.sharedLists.map((sharedList) => (
                <button
                  className="shared-list-row"
                  key={sharedList.list.id}
                  onClick={() => onOpenList(sharedList.list.id)}
                  type="button"
                >
                  <span className="shared-list-main">
                    <strong>{sharedList.list.title}</strong>
                    <span className="shared-list-participants">
                      {sharedList.participants.map((participant) => (
                        <span
                          className="shared-list-participant"
                          key={participant.profile.id}
                        >
                          <span className="participant-name">
                            {participant.profile.display_name}
                          </span>
                          <span className="participant-access">
                            {participant.accessLabel}
                          </span>
                        </span>
                      ))}
                    </span>
                  </span>
                  <span aria-hidden="true" className="list-row-chevron">
                    &rsaquo;
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="friends-screen">
      <div className="friends-screen-header">
        <button
          className="mobile-back-button friends-back-button"
          onClick={showLists}
          type="button"
        >
          &larr; Your lists
        </button>
        <div>
          <p className="eyebrow">People</p>
          <h1>Friends</h1>
        </div>
      </div>
      {friendSummaries.length === 0 ? (
        <div className="empty-state">
          <h2>No friends yet</h2>
          <p>People you share lists with will appear here.</p>
        </div>
      ) : (
        <div className="friend-rows">
          {friendSummaries.map((friend) => {
            const sharedListCount = friend.sharedLists.length;

            return (
              <button
                className="friend-row"
                key={friend.profile.id}
                onClick={() => onOpenFriend(friend.profile.id)}
                type="button"
              >
                <Avatar profile={friend.profile} />
                <span className="friend-row-main">
                  <strong>{friend.profile.display_name}</strong>
                  <span>
                    {sharedListCount} shared list
                    {sharedListCount === 1 ? "" : "s"}
                  </span>
                </span>
                <span aria-hidden="true" className="list-row-chevron">
                  &rsaquo;
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FriendsIndexLoadingPanel({
  showLists,
}: {
  showLists: (() => void) | null;
}) {
  return (
    <div className="friends-screen">
      <div className="friends-screen-header">
        <button
          className="mobile-back-button friends-back-button"
          disabled={!showLists}
          onClick={showLists ?? undefined}
          type="button"
        >
          &larr; Your lists
        </button>
        <div>
          <p className="eyebrow">People</p>
          <h1>Friends</h1>
        </div>
      </div>
      <div className="friend-rows">
        <LoadingSpinner label="Loading friends" />
      </div>
    </div>
  );
}

function FriendDetailLoadingPanel({
  onBackToFriends,
}: {
  onBackToFriends?: () => void;
}) {
  return (
    <div className="friends-screen friend-detail-screen">
      <div className="friends-screen-header">
        <button
          aria-label="Back to friends"
          className="mobile-back-button friends-back-button"
          disabled={!onBackToFriends}
          onClick={onBackToFriends}
          type="button"
        >
          &larr; Friends
        </button>
        <div>
          <p className="eyebrow">Friend</p>
          <h1>Friend details</h1>
        </div>
      </div>
      <div className="friends-section">
        <div>
          <h2>Shared lists</h2>
          <p className="muted">
            Open a shared list to manage it with the existing list tools.
          </p>
        </div>
        <div className="shared-list-rows">
          <LoadingSpinner label="Loading shared lists" />
        </div>
      </div>
    </div>
  );
}

function ListToolModal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal tool-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} type="button">
            x
          </button>
        </div>
        <div className="tool-modal-content">{children}</div>
      </div>
    </div>
  );
}

function ItemModal({
  categoryOptions,
  collaborators,
  itemFields,
  item,
  listId,
  saveItemDetails,
  setEditingItem,
}: {
  categoryOptions: string[];
  collaborators: Collaborator[];
  itemFields: ListItemFields;
  item: ListItem;
  listId: string | null;
  saveItemDetails: () => void;
  setEditingItem: (item: ListItem | null) => void;
}) {
  const categoryQuery = item.category?.trim().toLowerCase() ?? "";
  const matchingCategories = categoryQuery
    ? categoryOptions.filter((category) =>
        category.toLowerCase().includes(categoryQuery),
      )
    : categoryOptions;

  return (
    <div className="modal-backdrop" onMouseDown={() => setEditingItem(null)}>
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Edit item</h2>
        <div className="field-grid">
          <label>
            Title
            <input
              onChange={(event) =>
                setEditingItem({ ...item, title: event.target.value })
              }
              value={item.title}
            />
          </label>
          {itemFields.quantity || itemFields.category ? (
            <div className="field-grid two">
              {itemFields.quantity ? (
                <label>
                  Quantity
                  <input
                    onChange={(event) =>
                      setEditingItem({ ...item, quantity: event.target.value })
                    }
                    value={item.quantity ?? ""}
                  />
                </label>
              ) : null}
              {itemFields.category ? (
                <label>
                  Category
                  <input
                    list="edit-item-categories"
                    onChange={(event) =>
                      setEditingItem({ ...item, category: event.target.value })
                    }
                    value={item.category ?? ""}
                  />
                </label>
              ) : null}
            </div>
          ) : null}
          {itemFields.category ? (
            <datalist id="edit-item-categories">
              {categoryOptions.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          ) : null}
          {itemFields.category && matchingCategories.length > 0 ? (
            <div className="category-options">
              {matchingCategories.slice(0, 8).map((category) => (
                <button
                  key={category}
                  onClick={() => setEditingItem({ ...item, category })}
                  style={getCategoryStyle(listId, category)}
                  type="button"
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}
          {itemFields.dueDate || itemFields.priority ? (
            <div className="field-grid two">
              {itemFields.dueDate ? (
                <label>
                  Due date
                  <input
                    onChange={(event) =>
                      setEditingItem({ ...item, due_date: event.target.value })
                    }
                    type="date"
                    value={item.due_date ?? ""}
                  />
                </label>
              ) : null}
              {itemFields.priority ? (
                <label>
                  Priority
                  <select
                    onChange={(event) =>
                      setEditingItem({
                        ...item,
                        priority: event.target.value
                          ? (event.target.value as Priority)
                          : null,
                      })
                    }
                    value={item.priority ?? ""}
                  >
                    <option value="">None</option>
                    {priorityOptions.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          ) : null}
          {itemFields.assignee ? (
            <label>
              Assignee
              <select
                onChange={(event) =>
                  setEditingItem({ ...item, assigned_to: event.target.value })
                }
                value={item.assigned_to ?? ""}
              >
                <option value="">Unassigned</option>
                {collaborators
                  .filter((collaborator) => collaborator.status === "accepted")
                  .map((collaborator) => (
                    <option
                      key={collaborator.user_id}
                      value={collaborator.user_id}
                    >
                      {collaborator.profile?.display_name ??
                        collaborator.user_id}
                    </option>
                  ))}
              </select>
            </label>
          ) : null}
          {itemFields.notes ? (
            <label>
              Notes
              <textarea
                onChange={(event) =>
                  setEditingItem({ ...item, notes: event.target.value })
                }
                value={item.notes ?? ""}
              />
            </label>
          ) : null}
        </div>
        <div className="inline-actions">
          <button
            className="primary-button"
            onClick={saveItemDetails}
            type="button"
          >
            Save
          </button>
          <button
            className="secondary-button"
            onClick={() => setEditingItem(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function RestoreModal({
  currentHasItems,
  restoreList,
  setRestoreSnapshot,
  snapshot,
}: {
  currentHasItems: boolean;
  restoreList: (snapshot: ListSnapshot) => void;
  setRestoreSnapshot: (snapshot: ListSnapshot | null) => void;
  snapshot: ListSnapshot;
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={() => setRestoreSnapshot(null)}
    >
      <div className="modal" onMouseDown={(event) => event.stopPropagation()}>
        <h2>Restore list</h2>
        <p>
          {currentHasItems
            ? "Restoring this snapshot will overwrite the current list. A snapshot of the current list will be saved first."
            : "Restoring this snapshot will refill the empty list."}
        </p>
        <div className="inline-actions">
          <button
            className="danger-button"
            onClick={() => restoreList(snapshot)}
            type="button"
          >
            Restore
          </button>
          <button
            className="secondary-button"
            onClick={() => setRestoreSnapshot(null)}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function FriendList({
  friends,
  userId,
}: {
  friends: FriendRequest[];
  userId: string;
}) {
  const accepted = friends.filter((friend) => friend.status === "accepted");

  return (
    <div className="friend-list">
      <p className="eyebrow">Friends</p>
      {accepted.length === 0 ? (
        <p className="muted">No accepted friends yet.</p>
      ) : null}
      {accepted.map((friend) => {
        const other =
          friend.requester_id === userId ? friend.addressee : friend.requester;
        return (
          <div className="small-card" key={friend.id}>
            <strong>{other?.display_name ?? "Friend"}</strong>
            <span className="muted">{other?.email}</span>
          </div>
        );
      })}
    </div>
  );
}

function CollaboratorList({
  collaborators,
  isOwner,
  updateCollaboratorRole,
}: {
  collaborators: Collaborator[];
  isOwner: boolean;
  updateCollaboratorRole: (collaboratorId: string, role: ListRole) => void;
}) {
  return (
    <div className="collaborator-list">
      <p className="eyebrow">Collaborators</p>
      {collaborators.map((collaborator) => (
        <div className="small-card" key={collaborator.id}>
          <strong>
            {collaborator.profile?.display_name ?? collaborator.user_id}
          </strong>
          <span className="muted">{collaborator.status}</span>
          <select
            disabled={!isOwner || collaborator.role === "owner"}
            onChange={(event) =>
              updateCollaboratorRole(
                collaborator.id,
                event.target.value as ListRole,
              )
            }
            value={collaborator.role}
          >
            <option value="owner">Owner</option>
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
        </div>
      ))}
    </div>
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

const getFriendsRouteState = (): {
  friendId: string | null;
  section: AppSection;
} => {
  if (typeof window === "undefined") {
    return { friendId: null, section: "lists" };
  }

  const [, segment, friendId] = window.location.pathname.split("/");

  if (segment !== "friends") {
    return { friendId: null, section: "lists" };
  }

  return {
    friendId: friendId ? decodeURIComponent(friendId) : null,
    section: "friends",
  };
};

const isMissingListOrderPreferencesError = (error: unknown) => {
  const maybeError = error as { code?: unknown; message?: unknown };

  return (
    maybeError?.code === "PGRST205" &&
    typeof maybeError.message === "string" &&
    maybeError.message.includes("list_order_preferences")
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
