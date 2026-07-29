"use client";

import type { User } from "@supabase/supabase-js";
import { useCallback, useMemo, useRef, useState } from "react";
import { AppShell as Shell } from "../components/layout/AppShell";
import {
  useAppRouteController,
  type AppSection,
} from "../features/app/hooks/useAppRouteController";
import { useAppStatus } from "../features/app/hooks/useAppStatus";
import { FriendsPage } from "../features/friends/components/FriendsPage";
import {
  FriendDetailLoadingPanel,
  FriendsIndexLoadingPanel,
} from "../features/friends/components/FriendsLoadingRegion";
import { useFriendsController } from "../features/friends/hooks/useFriendsController";
import { LandingPage } from "../features/landing/components/LandingPage";
import { ListDetailLoadingPanel } from "../features/lists/components/ListDetailLoadingPanel";
import {
  ListsWorkspace,
  ListsWorkspaceLoadingView,
} from "../features/lists/components/ListsWorkspace";
import { CollaborationModal } from "../features/lists/components/modals/CollaborationModal";
import { CreateListModal } from "../features/lists/components/modals/CreateListModal";
import { EditItemModal } from "../features/lists/components/modals/EditItemModal";
import { ListHistoryModal } from "../features/lists/components/modals/ListHistoryModal";
import { ListSettingsModal } from "../features/lists/components/modals/ListSettingsModal";
import { RestoreListModal } from "../features/lists/components/modals/RestoreListModal";
import {
  loadAccessibleLists,
  loadSharedCandidateLists,
} from "../features/lists/lib/list-api";
import { loadListWorkspaceData } from "../features/lists/lib/item-api";
import {
  useListModalState,
  type ActiveListModal,
} from "../features/lists/hooks/useListModalState";
import { useCreateListAction } from "../features/lists/hooks/useCreateListAction";
import { useListFilters } from "../features/lists/hooks/useListFilters";
import { useListItemReordering } from "../features/lists/hooks/useListItemReordering";
import { useListItemMutations } from "../features/lists/hooks/useListItemMutations";
import { useListHistoryController } from "../features/lists/hooks/useListHistoryController";
import { useListOrderController } from "../features/lists/hooks/useListOrderController";
import { useListSettingsController } from "../features/lists/hooks/useListSettingsController";
import {
  normalizeItemFields,
  sortListsByPreference,
} from "../features/lists/lib/list-utils";
import { useNotificationsController } from "../features/notifications/hooks/useNotificationsController";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { signInWithGoogle, signOutUser } from "../features/profile/lib/auth-api";
import { useAuthSession } from "../features/profile/hooks/useAuthSession";
import { useProfileController } from "../features/profile/hooks/useProfileController";
import { useAppRealtimeSubscriptions } from "../features/realtime/hooks/useAppRealtimeSubscriptions";
import { useListSharingController } from "../features/sharing/hooks/useListSharingController";
import { useShareLinkAcceptance } from "../features/sharing/hooks/useShareLinkAcceptance";
import {
  Collaborator,
  emptyItemDraft,
  ItemDraft,
  List,
  ListItemFields,
  ListItem,
  ListRole,
  ListSnapshot,
  Profile,
  Suggestion,
} from "../lib/types";
import { getErrorMessage } from "../lib/errors";

export function ListApp({
  initialFriendId = null,
  initialSection = "lists",
}: {
  initialFriendId?: string | null;
  initialSection?: AppSection;
} = {}) {
  const [lists, setLists] = useState<List[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [allListCollaborators, setAllListCollaborators] = useState<
    Collaborator[]
  >([]);
  const [snapshots, setSnapshots] = useState<ListSnapshot[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [presenceUsers, setPresenceUsers] = useState<Profile[]>([]);
  const [draft, setDraft] = useState<ItemDraft>(emptyItemDraft);
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
  const { setStatusMessage, statusMessage } = useAppStatus();
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [listNameDraft, setListNameDraft] = useState("");
  const [deleteListConfirmation, setDeleteListConfirmation] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const authenticatedUserRef = useRef<User | null>(null);
  const { clearProfile, loadProfile, profile } = useProfileController({
    supabase,
  });

  const activeList = lists.find((list) => list.id === activeListId) ?? null;
  const itemFields = useMemo(
    () => normalizeItemFields(activeList?.item_fields),
    [activeList?.item_fields],
  );
  const {
    categoryOptions,
    clearFilters,
    hasFilterOptions,
    matchingCategoryOptions,
    priorityFilterOptions,
    selectedCategories,
    selectedPriorities,
    setSelectedCategories,
    setSelectedPriorities,
    toggleCategoryFilter,
    togglePriorityFilter,
    visibleItemGroups,
  } = useListFilters({
    draftCategory: draft.category,
    itemFields,
    items,
    suggestions,
  });

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

  const refreshListsForCurrentUser = useCallback(() => {
    if (authenticatedUserRef.current) {
      void loadLists(authenticatedUserRef.current.id);
    }
  }, [loadLists]);
  const {
    appSection,
    mobileView,
    openFriend,
    openSharedList,
    resetToLists,
    selectedFriendId,
    selectActiveList,
    showFriendsIndex,
    showLists,
    showMobileListIndex,
  } = useAppRouteController({
    clearFilters,
    initialFriendId,
    initialSection,
    refreshLists: refreshListsForCurrentUser,
    setActiveListId,
    setDeleteListConfirmation,
  });

  const handleAuthenticated = useCallback(
    (authUser: User) => {
      void loadUserData(authUser);
    },
    [loadUserData],
  );
  const handleUnauthenticated = useCallback(() => {
    setIsLoading(false);
    clearProfile();
    setLists([]);
    setAllListCollaborators([]);
    setActiveListId(null);
    setItems([]);
    resetToLists();
  }, [clearProfile, resetToLists]);
  const { authStatus, session, user } = useAuthSession({
    onAuthenticated: handleAuthenticated,
    onUnauthenticated: handleUnauthenticated,
    supabase,
  });
  authenticatedUserRef.current = user;
  const {
    acceptFriendRequest,
    acceptListInvite,
    friends,
    ignoreNotification,
    loadFriendsAndNotifications,
    notifications,
  } = useNotificationsController({
    loadLists,
    setStatusMessage,
    supabase,
    user,
  });
  const { createList, newListDraft, setNewListDraft } = useCreateListAction({
    lists,
    loadLists,
    setActiveListId,
    setIsCreateListOpen,
    setStatusMessage,
    supabase,
    user,
  });
  const {
    draggedListId,
    listDropIndicator,
    reorderListByDrop,
    setDraggedListId,
    setListDropIndicator,
  } = useListOrderController({
    lists,
    loadLists,
    setLists,
    setStatusMessage,
    supabase,
    user,
  });

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
  const {
    friendEmail,
    inviteCollaborator,
    inviteEmail,
    inviteRole,
    sendFriendRequest,
    setFriendEmail,
    setInviteEmail,
    setInviteRole,
    setShareRole,
    shareRole,
    updateCollaboratorRole,
  } = useListSharingController({
    activeList,
    isOwner,
    setStatusMessage,
    supabase,
    user,
  });
  const appOrigin = typeof window === "undefined" ? "" : window.location.origin;

  const matchingSuggestions = useMemo(() => {
    const query = draft.title.trim().toLowerCase();
    if (query.length < 2 || !activeList) {
      return [];
    }

    return suggestions
      .filter((suggestion) => suggestion.title.toLowerCase().includes(query))
      .slice(0, 6);
  }, [activeList, draft.title, suggestions]);

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
  const clearListDetail = useCallback(() => {
    setItems([]);
    setCollaborators([]);
  }, []);

  useAppRealtimeSubscriptions({
    activeListId,
    clearListDetail,
    loadFriendsAndNotifications,
    loadListData,
    loadLists,
    profile,
    setPresenceUsers,
    supabase,
    user,
  });
  useShareLinkAcceptance({
    loadLists,
    setActiveListId,
    setStatusMessage,
    supabase,
    user,
  });

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
          onClearFilters={clearFilters}
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
