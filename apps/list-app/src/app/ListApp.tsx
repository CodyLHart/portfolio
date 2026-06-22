"use client";

import type { Session, User } from "@supabase/supabase-js";
import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDate, formatDateTime } from "../lib/format";
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
  SnapshotItem,
  Suggestion,
} from "../lib/types";

const portfolioUrl =
  process.env.NEXT_PUBLIC_PORTFOLIO_URL ?? "http://127.0.0.1:3000";
const priorityOptions: Priority[] = ["low", "medium", "high", "urgent"];
type DropPlacement = "before" | "after";
type ActiveListModal = "collaboration" | "owner" | "history" | null;
const defaultItemFields: ListItemFields = {
  assignee: true,
  category: true,
  dueDate: true,
  notes: true,
  priority: true,
  quantity: true,
};
const emptyNewListDraft = {
  collaboratorEmail: "",
  collaboratorRole: "editor" as ListRole,
  itemFields: defaultItemFields,
  title: "",
};
const itemFieldOptions: Array<{ key: keyof ListItemFields; label: string }> = [
  { key: "quantity", label: "Quantity" },
  { key: "category", label: "Category" },
  { key: "dueDate", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "assignee", label: "Assignee" },
  { key: "notes", label: "Notes" },
];
const categoryPalette = [
  { background: "#dbeafe", color: "#1e3a8a" },
  { background: "#dcfce7", color: "#14532d" },
  { background: "#fef3c7", color: "#78350f" },
  { background: "#fce7f3", color: "#831843" },
  { background: "#ede9fe", color: "#4c1d95" },
  { background: "#ccfbf1", color: "#134e4a" },
  { background: "#fee2e2", color: "#7f1d1d" },
  { background: "#e0e7ff", color: "#312e81" },
];

const getDropPlacement = (clientY: number, rect: DOMRect): DropPlacement =>
  clientY > rect.top + rect.height / 2 ? "after" : "before";

const getCategoryStyle = (
  listId: string | null | undefined,
  category: string,
): CSSProperties => {
  const seed = `${listId ?? "list"}:${category.trim().toLowerCase()}`;
  const index = Array.from(seed).reduce(
    (hash, character) =>
      (hash * 31 + character.charCodeAt(0)) % categoryPalette.length,
    0,
  );

  return categoryPalette[index];
};

const normalizeItemFields = (
  fields: Partial<ListItemFields> | null | undefined,
): ListItemFields => ({
  ...defaultItemFields,
  ...(fields ?? {}),
});

export function ListApp() {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
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
  const [isLoading, setIsLoading] = useState(true);
  const dropHandledRef = useRef(false);

  const user = session?.user ?? null;
  const activeList = lists.find((list) => list.id === activeListId) ?? null;
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

  const visibleItemGroups = useMemo(() => {
    const next = [...items].sort((first, second) => {
      if (first.completed !== second.completed) {
        return first.completed ? 1 : -1;
      }

      return first.position - second.position;
    });

    const selectedCategorySet = new Set(
      selectedCategories.map((category) => category.toLowerCase()),
    );
    const selectedPrioritySet = new Set(selectedPriorities);
    const filteredItems = next.filter(
      (item) =>
        (selectedCategorySet.size === 0 ||
          selectedCategorySet.has(
            (item.category?.trim() || "Uncategorized").toLowerCase(),
          )) &&
        (selectedPrioritySet.size === 0 ||
          (item.priority && selectedPrioritySet.has(item.priority))),
    );

    if (selectedCategories.length <= 1) {
      return [{ category: null, items: filteredItems }];
    }

    const groups = new Map<string, ListItem[]>();
    filteredItems.forEach((item) => {
      const category = item.category?.trim() || "Uncategorized";
      groups.set(category, [...(groups.get(category) ?? []), item]);
    });

    return selectedCategories
      .map((category) => ({
        category,
        items: groups.get(category) ?? [],
      }))
      .filter((group) => group.items.length > 0);
  }, [items, selectedCategories, selectedPriorities]);

  const matchingSuggestions = useMemo(() => {
    const query = draft.title.trim().toLowerCase();
    if (query.length < 2 || !activeList) {
      return [];
    }

    return suggestions
      .filter((suggestion) => suggestion.title.toLowerCase().includes(query))
      .slice(0, 6);
  }, [activeList, draft.title, suggestions]);

  const categoryOptions = useMemo(() => {
    if (!itemFields.category) {
      return [];
    }

    const categories = new Map<string, string>();

    items.forEach((item) => {
      const category = item.category?.trim();
      if (category) {
        categories.set(category.toLowerCase(), category);
      } else {
        categories.set("uncategorized", "Uncategorized");
      }
    });

    suggestions.forEach((suggestion) => {
      const category = suggestion.category?.trim();
      if (category) {
        categories.set(category.toLowerCase(), category);
      }
    });

    return Array.from(categories.values()).sort((first, second) =>
      first.localeCompare(second),
    );
  }, [itemFields.category, items, suggestions]);

  const priorityFilterOptions = useMemo(() => {
    if (!itemFields.priority) {
      return [];
    }

    const availablePriorities = new Set(
      items.map((item) => item.priority).filter(Boolean) as Priority[],
    );
    return priorityOptions.filter((priority) =>
      availablePriorities.has(priority),
    );
  }, [itemFields.priority, items]);
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
    const uniqueLists = Array.from(
      new Map(
        [...ownedLists, ...collaboratorLists].map((list) => [list.id, list]),
      ).values(),
    ).sort((first, second) =>
      second.updated_at.localeCompare(first.updated_at),
    );

    setLists(uniqueLists);
    setActiveListId((current) => current ?? uniqueLists[0]?.id ?? null);
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
        await loadLists(authUser.id);
      } catch (error) {
        setStatusMessage(getErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [loadLists, loadProfile],
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
      setSession(data.session);
      if (data.session?.user) {
        void loadUserData(data.session.user);
      } else {
        setIsLoading(false);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        if (nextSession?.user) {
          void loadUserData(nextSession.user);
        } else {
          setProfile(null);
          setLists([]);
          setActiveListId(null);
          setItems([]);
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
        () => void loadListData(activeListId),
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
    setSelectedCategories([]);
    setSelectedPriorities([]);
    setDeleteListConfirmation("");
  }, [activeListId]);

  useEffect(() => {
    setListNameDraft(activeList?.title ?? "");
  }, [activeList?.title]);

  const signIn = async () => {
    if (!isSupabaseConfigured) {
      setStatusMessage("Supabase environment variables are missing.");
      return;
    }

    await supabase.auth.signInWithOAuth({
      options: {
        redirectTo:
          typeof window === "undefined" ? undefined : window.location.href,
      },
      provider: "google",
    });
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
    if (!activeList || !isOwner || deleteListConfirmation !== activeList.title) {
      return;
    }

    const { error } = await supabase.from("lists").delete().eq("id", activeList.id);

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
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (error) {
      setStatusMessage(error.message);
    }
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
    const { error } = await supabase
      .from("list_collaborators")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", collaboratorId);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    if (user) {
      await loadLists(user.id);
    }
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
      current.map((list) => (list.id === activeList.id ? { ...list, title: nextTitle } : list)),
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

  if (!session) {
    return (
      <Shell onSignOut={null} profile={null}>
        <main className="app-main">
          <section className="landing">
            <div className="panel">
              <p className="eyebrow">List App</p>
              <h1>Shared lists with memory.</h1>
            </div>
            <div className="panel">
              <p>
                Sign in with Google to create collaborative lists, add friends,
                assign items, restore old versions, and reuse suggestions from
                each list&apos;s history.
              </p>
              <div className="inline-actions" style={{ marginTop: 16 }}>
                <button
                  className="primary-button"
                  onClick={signIn}
                  type="button"
                >
                  Sign in with Google
                </button>
              </div>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  return (
    <Shell
      acceptFriendRequest={acceptFriendRequest}
      acceptListInvite={acceptListInvite}
      notifications={notifications}
      onSignOut={signOut}
      profile={profile}
    >
      <main className="app-main">
        <div className="app-grid">
          <aside className="sidebar panel">
            <div className="toolbar">
              <div>
                <p className="eyebrow">Lists</p>
              </div>
              <button
                aria-label="Create list"
                className="icon-button"
                onClick={() => setIsCreateListOpen(true)}
                type="button"
              >
                +
              </button>
            </div>
            <nav className="list-nav" aria-label="Lists">
              {lists.map((list) => (
                <button
                  className={list.id === activeListId ? "active" : ""}
                  key={list.id}
                  onClick={() => setActiveListId(list.id)}
                  type="button"
                >
                  <strong>{list.title}</strong>
                </button>
              ))}
            </nav>
          </aside>

          <section className="panel">
            {!activeList ? (
              <div className="empty-state">
                {isLoading
                  ? "Loading lists..."
                  : "Create a list to get started."}
              </div>
            ) : (
              <>
                <div className="toolbar">
                  <div>
                    <p className="eyebrow">Active List</p>
                    <h1 className="list-title">{activeList.title}</h1>
                    <div className="presence">
                      {presenceUsers.map((presenceUser) => (
                        <span key={presenceUser.id}>
                          {presenceUser.display_name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="list-management-actions">
                    <button
                      aria-label="Collaboration"
                      className="list-tool-button"
                      onClick={() => setActiveListModal("collaboration")}
                      title="Collaboration"
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path
                          d="M19 14a1.4 1.4 0 0 0-1.4 1.4V18H6V6h2.6A1.4 1.4 0 0 0 10 4.6 1.4 1.4 0 0 0 8.6 3.2H5.4A2.2 2.2 0 0 0 3.2 5.4v13.2a2.2 2.2 0 0 0 2.2 2.2h13.2a2.2 2.2 0 0 0 2.2-2.2v-3.2A1.4 1.4 0 0 0 19.4 14H19Z"
                          fill="currentColor"
                        />
                        <path
                          d="M20.5 9.9 14.4 3.8A1.5 1.5 0 0 0 11.8 5v2.5C7.5 8.1 5.1 10.6 4.4 15c-.2 1.2 1.3 1.8 2 .8 1.4-2 3.1-2.9 5.4-3.1V15a1.5 1.5 0 0 0 2.6 1.1l6.1-6.1Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      aria-label="History"
                      className="list-tool-button"
                      onClick={() => setActiveListModal("history")}
                      title="History"
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path
                          d="M12 2a10 10 0 0 1 7 17.1 1.55 1.55 0 0 1-2.2-2.2A6.9 6.9 0 1 0 5.3 10h1.1a1.4 1.4 0 0 1 1 2.4l-3 3a1.4 1.4 0 0 1-2 0l-3-3A1.4 1.4 0 0 1 .4 10h1.8A10 10 0 0 1 12 2Z"
                          fill="currentColor"
                        />
                        <path
                          d="M10.4 7.2A1.6 1.6 0 0 1 12 5.6a1.6 1.6 0 0 1 1.6 1.6v4l3 1.5a1.6 1.6 0 1 1-1.4 2.8l-3.9-2A1.6 1.6 0 0 1 10.4 12V7.2Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                    <button
                      aria-label="Settings"
                      className="list-tool-button"
                      onClick={() => setActiveListModal("owner")}
                      title="Settings"
                      type="button"
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24">
                        <path
                          d="M13.6 1.5a1.4 1.4 0 0 1 1.3 1l.5 1.9c.5.2.9.4 1.3.7l1.9-1a1.4 1.4 0 0 1 1.6.3l1.4 1.4a1.4 1.4 0 0 1 .3 1.6l-1 1.9c.3.4.5.8.7 1.3l1.9.5a1.4 1.4 0 0 1 1 1.3v2a1.4 1.4 0 0 1-1 1.3l-1.9.5c-.2.5-.4.9-.7 1.3l1 1.9a1.4 1.4 0 0 1-.3 1.6l-1.4 1.4a1.4 1.4 0 0 1-1.6.3l-1.9-1c-.4.3-.8.5-1.3.7l-.5 1.9a1.4 1.4 0 0 1-1.3 1h-2a1.4 1.4 0 0 1-1.3-1l-.5-1.9a8.5 8.5 0 0 1-1.3-.7l-1.9 1a1.4 1.4 0 0 1-1.6-.3l-1.4-1.4a1.4 1.4 0 0 1-.3-1.6l1-1.9a8.5 8.5 0 0 1-.7-1.3l-1.9-.5a1.4 1.4 0 0 1-1-1.3v-2a1.4 1.4 0 0 1 1-1.3l1.9-.5c.2-.5.4-.9.7-1.3l-1-1.9a1.4 1.4 0 0 1 .3-1.6l1.4-1.4a1.4 1.4 0 0 1 1.6-.3l1.9 1c.4-.3.8-.5 1.3-.7l.5-1.9a1.4 1.4 0 0 1 1.3-1h2Zm-1 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z"
                          fill="currentColor"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="list-action-bar">
                  <button
                    aria-expanded={isAddItemOpen}
                    aria-label="Add item"
                    className="add-item-toggle"
                    disabled={!canEdit}
                    onClick={() => setIsAddItemOpen((open) => !open)}
                    type="button"
                  >
                    +
                  </button>
                  {hasFilterOptions ? (
                    <div className="filter-box">
                      <span className="filter-label">Filter</span>
                      <div className="filter-groups">
                        {itemFields.category && categoryOptions.length > 0 ? (
                          <div className="filter-group">
                            <span>Category</span>
                            <div
                              className="category-filter-bar"
                              aria-label="Category filters"
                            >
                              {categoryOptions.map((category) => {
                                const isSelected = selectedCategories.some(
                                  (selectedCategory) =>
                                    selectedCategory.toLowerCase() ===
                                    category.toLowerCase(),
                                );

                                return (
                                  <button
                                    className={isSelected ? "selected" : ""}
                                    key={category}
                                    onClick={() =>
                                      toggleCategoryFilter(category)
                                    }
                                    style={getCategoryStyle(
                                      activeList.id,
                                      category,
                                    )}
                                    type="button"
                                  >
                                    {category}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : null}
                        {itemFields.priority &&
                        priorityFilterOptions.length > 0 ? (
                          <div className="filter-group">
                            <span>Priority</span>
                            <div
                              className="priority-filter-bar"
                              aria-label="Priority filters"
                            >
                              {priorityFilterOptions.map((priority) => (
                                <button
                                  className={
                                    selectedPriorities.includes(priority)
                                      ? "selected"
                                      : ""
                                  }
                                  key={priority}
                                  onClick={() => togglePriorityFilter(priority)}
                                  type="button"
                                >
                                  {priority}
                                </button>
                              ))}
                            </div>
                          </div>
                        ) : null}
                        {selectedCategories.length > 0 ||
                        selectedPriorities.length > 0 ? (
                          <button
                            className="clear-filter-button"
                            onClick={() => {
                              setSelectedCategories([]);
                              setSelectedPriorities([]);
                            }}
                            type="button"
                          >
                            Clear
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </div>

                {isAddItemOpen ? (
                  <div className="panel add-item-panel">
                    <p className="eyebrow">Add Item</p>
                    <div className="item-form">
                      <input
                        disabled={!canEdit}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            title: event.target.value,
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            void addItem();
                          }
                        }}
                        placeholder="Add an item"
                        value={draft.title}
                      />
                      {matchingSuggestions.length > 0 ? (
                        <div className="suggestions">
                          {matchingSuggestions.map((suggestion) => (
                            <button
                              key={suggestion.id}
                              onClick={() =>
                                setDraft((current) => ({
                                  ...current,
                                  category: suggestion.category ?? "",
                                  title: suggestion.title,
                                }))
                              }
                              type="button"
                            >
                              {suggestion.title}
                            </button>
                          ))}
                        </div>
                      ) : null}
                      {itemFields.quantity || itemFields.category ? (
                        <div className="field-grid two">
                          {itemFields.quantity ? (
                            <input
                              disabled={!canEdit}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  quantity: event.target.value,
                                }))
                              }
                              placeholder="Quantity"
                              value={draft.quantity}
                            />
                          ) : null}
                          {itemFields.category ? (
                            <input
                              disabled={!canEdit}
                              list="add-item-categories"
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  category: event.target.value,
                                }))
                              }
                              placeholder="Category"
                              value={draft.category}
                            />
                          ) : null}
                        </div>
                      ) : null}
                      {itemFields.category ? (
                        <datalist id="add-item-categories">
                          {categoryOptions.map((category) => (
                            <option key={category} value={category} />
                          ))}
                        </datalist>
                      ) : null}
                      {itemFields.category &&
                      matchingCategoryOptions.length > 0 ? (
                        <div className="category-options">
                          {matchingCategoryOptions
                            .slice(0, 8)
                            .map((category) => (
                              <button
                                key={category}
                                onClick={() =>
                                  setDraft((current) => ({
                                    ...current,
                                    category,
                                  }))
                                }
                                style={getCategoryStyle(
                                  activeList.id,
                                  category,
                                )}
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
                            <input
                              disabled={!canEdit}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  due_date: event.target.value,
                                }))
                              }
                              type="date"
                              value={draft.due_date}
                            />
                          ) : null}
                          {itemFields.priority ? (
                            <select
                              disabled={!canEdit}
                              onChange={(event) =>
                                setDraft((current) => ({
                                  ...current,
                                  priority: event.target.value as "" | Priority,
                                }))
                              }
                              value={draft.priority}
                            >
                              <option value="">Priority</option>
                              {priorityOptions.map((priority) => (
                                <option key={priority} value={priority}>
                                  {priority}
                                </option>
                              ))}
                            </select>
                          ) : null}
                        </div>
                      ) : null}
                      {itemFields.assignee ? (
                        <select
                          disabled={!canEdit}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              assigned_to: event.target.value,
                            }))
                          }
                          value={draft.assigned_to}
                        >
                          <option value="">Unassigned</option>
                          {collaborators
                            .filter((collaborator) => collaborator.status === "accepted")
                            .map((collaborator) => (
                              <option key={collaborator.user_id} value={collaborator.user_id}>
                                {collaborator.profile?.display_name ?? collaborator.user_id}
                              </option>
                            ))}
                        </select>
                      ) : null}
                      {itemFields.notes ? (
                        <textarea
                          disabled={!canEdit}
                          onChange={(event) =>
                            setDraft((current) => ({
                              ...current,
                              notes: event.target.value,
                            }))
                          }
                          placeholder="Notes"
                          value={draft.notes}
                        />
                      ) : null}
                      <button
                        className="primary-button"
                        disabled={!canEdit}
                        onClick={addItem}
                        type="button"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="items">
                  {items.length === 0 ? (
                    <div className="empty-state">This list is empty.</div>
                  ) : (
                    visibleItemGroups.map((group) => (
                      <div
                        className="category-group"
                        key={group.category ?? "manual"}
                      >
                        {group.category ? (
                          <h2 className="category-heading">
                            <span
                              style={getCategoryStyle(
                                activeList.id,
                                group.category,
                              )}
                            >
                              {group.category}
                            </span>
                          </h2>
                        ) : null}
                        {group.items.length > 0 &&
                        selectedCategories.length === 0 ? (
                          <DropZone
                            canDrop={canEdit}
                            completeItemDrop={completeItemDrop}
                            draggedItemId={draggedItemId}
                            itemId={group.items[0].id}
                            label="top"
                            placement="before"
                            setDropIndicator={setDropIndicator}
                          />
                        ) : null}
                        {group.items.map((item) => (
                          <ItemCard
                            beginItemDrag={beginItemDrag}
                            canEdit={canEdit}
                            collaborators={collaborators}
                            completeItemDrop={completeItemDrop}
                            deleteItem={deleteItem}
                            draggedItemId={draggedItemId}
                            dropIndicator={dropIndicator}
                            finishItemDrag={finishItemDrag}
                            itemFields={itemFields}
                            item={item}
                            key={item.id}
                            listId={activeList.id}
                            setDropIndicator={setDropIndicator}
                            setEditingItem={setEditingItem}
                            toggleCategoryFilter={toggleCategoryFilter}
                            canDrag={selectedCategories.length === 0}
                            toggleItem={toggleItem}
                          />
                        ))}
                        {group.items.length > 0 &&
                        selectedCategories.length === 0 ? (
                          <DropZone
                            canDrop={canEdit}
                            completeItemDrop={completeItemDrop}
                            draggedItemId={draggedItemId}
                            itemId={group.items[group.items.length - 1].id}
                            label="bottom"
                            placement="after"
                            setDropIndicator={setDropIndicator}
                          />
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
                {statusMessage ? (
                  <p className="status-message">{statusMessage}</p>
                ) : null}
              </>
            )}
          </section>
        </div>
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
              Invite to List
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
          title="List Settings"
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
              disabled={!isOwner || !listNameDraft.trim() || listNameDraft.trim() === activeList.title}
              onClick={updateListName}
              type="button"
            >
              Save Name
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
              Remove Completed
            </button>
            <button
              className="danger-button"
              disabled={!isOwner}
              onClick={clearAll}
              type="button"
            >
              Clear All
            </button>
          </div>
          <p className="eyebrow">Delete List</p>
          <div className="danger-zone">
            <p className="muted">
              Type <strong>{activeList.title}</strong> to permanently delete this list.
            </p>
            <input
              disabled={!isOwner}
              onChange={(event) => setDeleteListConfirmation(event.target.value)}
              value={deleteListConfirmation}
            />
            <button
              className="danger-button"
              disabled={!isOwner || deleteListConfirmation !== activeList.title}
              onClick={deleteActiveList}
              type="button"
            >
              Delete List
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
          title="Create List"
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
              Create List
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

type ShellProps = {
  acceptFriendRequest?: (friendshipId: string) => void;
  acceptListInvite?: (collaboratorId: string) => void;
  children: React.ReactNode;
  notifications?: Notification[];
  onSignOut: (() => void) | null;
  profile: Profile | null;
};

function Shell({
  acceptFriendRequest,
  acceptListInvite,
  children,
  notifications = [],
  onSignOut,
  profile,
}: ShellProps) {
  return (
    <div className="app-shell">
      <header className="portfolio-header">
        <a
          className="header-logo"
          href={portfolioUrl}
          aria-label="Cody Hart home"
        >
          <span>CODY</span>
          <span>HART</span>
        </a>
        <nav className="header-nav" aria-label="Navigation">
          <a className="text-link" href={portfolioUrl}>
            Portfolio
          </a>
          {profile ? (
            <div className="avatar-row">
              {acceptFriendRequest && acceptListInvite ? (
                <NotificationsMenu
                  acceptFriendRequest={acceptFriendRequest}
                  acceptListInvite={acceptListInvite}
                  notifications={notifications}
                />
              ) : null}
              <AvatarMenu onSignOut={onSignOut} profile={profile} />
            </div>
          ) : null}
        </nav>
      </header>
      {children}
    </div>
  );
}

function AvatarMenu({
  onSignOut,
  profile,
}: {
  onSignOut: (() => void) | null;
  profile: Profile;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="avatar-menu">
      <button
        aria-label="Account menu"
        className="avatar-button"
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <Avatar profile={profile} />
      </button>
      {isOpen ? (
        <div className="avatar-menu-panel">
          <strong>{profile.display_name}</strong>
          <span className="muted">{profile.email}</span>
          <button onClick={onSignOut ?? undefined} type="button">
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}

function Avatar({ profile }: { profile: Profile }) {
  return (
    <span
      className="avatar"
      style={
        profile.avatar_url
          ? { backgroundImage: `url(${profile.avatar_url})` }
          : undefined
      }
      title={profile.email}
    >
      {profile.avatar_url
        ? null
        : profile.display_name.slice(0, 2).toUpperCase()}
    </span>
  );
}

type NotificationsMenuProps = {
  acceptFriendRequest: (friendshipId: string) => void;
  acceptListInvite: (collaboratorId: string) => void;
  notifications: Notification[];
};

function NotificationsMenu({
  acceptFriendRequest,
  acceptListInvite,
  notifications,
}: NotificationsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const unreadCount = notifications.filter(
    (notification) => !notification.read_at,
  ).length;

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!popoverRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  return (
    <div className="popover notification-popover" ref={popoverRef}>
      <button
        aria-label="Notifications"
        className="notification-button"
        onClick={() => setIsOpen((open) => !open)}
        type="button"
      >
        <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
          <path
            d="M6.5 10.5a5.5 5.5 0 0 1 11 0v4.1l1.6 2.4H4.9l1.6-2.4v-4.1Z"
            stroke="currentColor"
            strokeLinejoin="round"
            strokeWidth="2"
          />
          <path
            d="M9.5 19a2.8 2.8 0 0 0 5 0"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="2"
          />
        </svg>
        {unreadCount > 0 ? (
          <span className="notification-badge">{unreadCount}</span>
        ) : null}
      </button>
      {isOpen ? (
        <div className="popover-panel">
          <p className="eyebrow">Inbox</p>
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="muted">No notifications.</p>
            ) : null}
            {notifications.map((notification) => (
              <div className="small-card" key={notification.id}>
                <strong>{notificationLabel(notification)}</strong>
                <span className="muted">
                  {formatDateTime(notification.created_at)}
                </span>
                {notification.type === "friend_request" ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      acceptFriendRequest(
                        String(notification.payload.friendshipId),
                      )
                    }
                    type="button"
                  >
                    Accept Friend
                  </button>
                ) : null}
                {notification.type === "list_invite" ? (
                  <button
                    className="secondary-button"
                    onClick={() =>
                      acceptListInvite(
                        String(notification.payload.collaboratorId),
                      )
                    }
                    type="button"
                  >
                    Accept List
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ItemCard({
  beginItemDrag,
  canDrag,
  canEdit,
  collaborators,
  completeItemDrop,
  deleteItem,
  draggedItemId,
  dropIndicator,
  finishItemDrag,
  item,
  itemFields,
  listId,
  setDropIndicator,
  setEditingItem,
  toggleCategoryFilter,
  toggleItem,
}: {
  beginItemDrag: (itemId: string) => void;
  canDrag: boolean;
  canEdit: boolean;
  collaborators: Collaborator[];
  completeItemDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  deleteItem: (item: ListItem) => void;
  draggedItemId: string | null;
  dropIndicator: { itemId: string; placement: DropPlacement } | null;
  finishItemDrag: () => void;
  item: ListItem;
  itemFields: ListItemFields;
  listId: string;
  setDropIndicator: (
    indicator: { itemId: string; placement: DropPlacement } | null,
  ) => void;
  setEditingItem: (item: ListItem) => void;
  toggleCategoryFilter: (category: string) => void;
  toggleItem: (item: ListItem) => void;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const assignee = collaborators.find(
    (collaborator) => collaborator.user_id === item.assigned_to,
  )?.profile;
  const isDraggable = canEdit && canDrag;
  const isDropTarget = dropIndicator?.itemId === item.id;

  return (
    <>
      {isDropTarget && dropIndicator.placement === "before" ? (
        <div className="drop-indicator" />
      ) : null}
      <article
        className={`item-card ${item.completed ? "completed" : ""} ${
          itemFields.notes && item.notes ? "has-note" : ""
        } ${draggedItemId === item.id ? "dragging" : ""}`}
        draggable={isDraggable}
        onDragEnd={finishItemDrag}
        onDragOver={(event) => {
          if (isDraggable && draggedItemId && draggedItemId !== item.id) {
            const rect = event.currentTarget.getBoundingClientRect();
            const placement = getDropPlacement(event.clientY, rect);
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
            setDropIndicator({ itemId: item.id, placement });
          }
        }}
        onDragStart={(event) => {
          if (!isDraggable) {
            return;
          }

          beginItemDrag(item.id);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", item.id);
        }}
        onDrop={(event) => {
          event.preventDefault();
          const droppedId =
            event.dataTransfer.getData("text/plain") || draggedItemId;
          const placement = getDropPlacement(
            event.clientY,
            event.currentTarget.getBoundingClientRect(),
          );

          if (droppedId) {
            completeItemDrop(droppedId, item.id, placement);
          }
        }}
      >
        <span
          aria-hidden="true"
          className={`drag-handle ${isDraggable ? "" : "disabled"}`}
        >
          ::
        </span>
        <input
          checked={item.completed}
          disabled={!canEdit}
          onChange={() => toggleItem(item)}
          type="checkbox"
        />
        <div className="item-main">
          <div className="item-title">
            <span>{item.title}</span>
            {itemFields.quantity && item.quantity ? (
              <span className="quantity-pill">Qty {item.quantity}</span>
            ) : null}
          </div>
          {itemFields.notes && item.notes ? (
            <p className="item-note">{item.notes}</p>
          ) : null}
        </div>
        <div className="item-right">
          <div className="item-meta">
            {itemFields.category && item.category ? (
              <button
                className="category-pill"
                onClick={() => toggleCategoryFilter(item.category ?? "")}
                style={getCategoryStyle(listId, item.category)}
                type="button"
              >
                {item.category}
              </button>
            ) : null}
            {itemFields.priority && item.priority ? (
              <span>{item.priority}</span>
            ) : null}
            {itemFields.dueDate && item.due_date ? (
              <span>{formatDate(item.due_date)}</span>
            ) : null}
            {itemFields.assignee && assignee ? (
              <span>{assignee.display_name}</span>
            ) : null}
          </div>
          <div className="item-menu">
            <button
              aria-label={`Open actions for ${item.title}`}
              className="icon-button"
              disabled={!canEdit}
              onBlur={() => window.setTimeout(() => setIsMenuOpen(false), 120)}
              onClick={() => setIsMenuOpen((open) => !open)}
              type="button"
            >
              ...
            </button>
            {isMenuOpen ? (
              <div className="item-menu-panel">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setEditingItem(item);
                  }}
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="danger-menu-item"
                  onClick={() => {
                    setIsMenuOpen(false);
                    void deleteItem(item);
                  }}
                  type="button"
                >
                  Delete
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </article>
      {isDropTarget && dropIndicator.placement === "after" ? (
        <div className="drop-indicator" />
      ) : null}
    </>
  );
}

function DropZone({
  canDrop,
  completeItemDrop,
  draggedItemId,
  itemId,
  label,
  placement,
  setDropIndicator,
}: {
  canDrop: boolean;
  completeItemDrop: (
    draggedId: string,
    targetId: string,
    placement: DropPlacement,
  ) => void;
  draggedItemId: string | null;
  itemId: string;
  label: string;
  placement: DropPlacement;
  setDropIndicator: (
    indicator: { itemId: string; placement: DropPlacement } | null,
  ) => void;
}) {
  const [isActive, setIsActive] = useState(false);

  if (!canDrop) {
    return null;
  }

  return (
    <div
      aria-label={`Drop item at ${label}`}
      className={`edge-drop-zone ${isActive && draggedItemId ? "active" : ""}`}
      onDragLeave={() => setIsActive(false)}
      onDragOver={(event) => {
        if (draggedItemId && draggedItemId !== itemId) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setIsActive(true);
          setDropIndicator({ itemId, placement });
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const droppedId =
          event.dataTransfer.getData("text/plain") || draggedItemId;
        setIsActive(false);

        if (droppedId) {
          completeItemDrop(droppedId, itemId, placement);
        }
      }}
    />
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
      <div className="modal tool-modal" onMouseDown={(event) => event.stopPropagation()}>
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
    <div className="modal-backdrop" onMouseDown={() => setRestoreSnapshot(null)}>
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

const notificationLabel = (notification: Notification) => {
  if (notification.type === "friend_request") {
    return `${notification.actor?.display_name ?? "Someone"} sent a friend request.`;
  }

  if (notification.type === "list_invite") {
    return `${notification.actor?.display_name ?? "Someone"} invited you to a list.`;
  }

  return "Your role changed.";
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong.";
