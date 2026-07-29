import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const component = await readFile(new URL("./ListApp.tsx", import.meta.url), {
  encoding: "utf8",
});
const styles = await readFile(new URL("./globals.css", import.meta.url), {
  encoding: "utf8",
});
const appShellComponent = await readFile(
  new URL("../components/layout/AppShell.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const appShellStyles = await readFile(
  new URL("../components/layout/AppShell.module.css", import.meta.url),
  {
    encoding: "utf8",
  },
);
const avatarComponent = await readFile(
  new URL("../components/ui/Avatar.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const avatarStyles = await readFile(
  new URL("../components/ui/Avatar.module.css", import.meta.url),
  {
    encoding: "utf8",
  },
);
const loadingSpinnerComponent = await readFile(
  new URL("../components/ui/LoadingSpinner.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const loadingSpinnerStyles = await readFile(
  new URL("../components/ui/LoadingSpinner.module.css", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsPageComponent = await readFile(
  new URL("../features/friends/components/FriendsPage.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsIndexComponent = await readFile(
  new URL("../features/friends/components/FriendsIndex.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendRowComponent = await readFile(
  new URL("../features/friends/components/FriendRow.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendDetailComponent = await readFile(
  new URL("../features/friends/components/FriendDetail.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const sharedListRowComponent = await readFile(
  new URL("../features/friends/components/SharedListRow.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const participantListComponent = await readFile(
  new URL("../features/friends/components/ParticipantList.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsLoadingComponent = await readFile(
  new URL(
    "../features/friends/components/FriendsLoadingRegion.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const friendsPageStyles = await readFile(
  new URL(
    "../features/friends/components/FriendsPage.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const friendRowStyles = await readFile(
  new URL(
    "../features/friends/components/FriendRow.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const sharedListRowStyles = await readFile(
  new URL(
    "../features/friends/components/SharedListRow.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const participantListStyles = await readFile(
  new URL(
    "../features/friends/components/ParticipantList.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const friendsApiSource = await readFile(
  new URL("../features/friends/lib/friends-api.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsControllerSource = await readFile(
  new URL("../features/friends/hooks/useFriendsController.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const notificationMenuComponent = await readFile(
  new URL(
    "../features/notifications/components/NotificationsMenu.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const notificationRowComponent = await readFile(
  new URL(
    "../features/notifications/components/NotificationRow.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const notificationMenuStyles = await readFile(
  new URL(
    "../features/notifications/components/NotificationsMenu.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const notificationsApiSource = await readFile(
  new URL(
    "../features/notifications/lib/notifications-api.ts",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const notificationUtilsSource = await readFile(
  new URL(
    "../features/notifications/lib/notification-utils.ts",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const landingComponent = await readFile(
  new URL("../features/landing/components/LandingPage.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const landingStyles = await readFile(
  new URL(
    "../features/landing/components/LandingPage.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listsWorkspaceComponent = await readFile(
  new URL("../features/lists/components/ListsWorkspace.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listsWorkspaceStyles = await readFile(
  new URL(
    "../features/lists/components/ListsWorkspace.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listsIndexComponent = await readFile(
  new URL("../features/lists/components/ListsIndex.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listDetailComponent = await readFile(
  new URL("../features/lists/components/ListDetail.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listDetailLoadingComponent = await readFile(
  new URL(
    "../features/lists/components/ListDetailLoadingPanel.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listItemsComponent = await readFile(
  new URL("../features/lists/components/ListItems.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listItemRowComponent = await readFile(
  new URL("../features/lists/components/ListItemRow.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listUtilsSource = await readFile(
  new URL("../features/lists/lib/list-utils.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listApiSource = await readFile(
  new URL("../features/lists/lib/list-api.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const itemApiSource = await readFile(
  new URL("../features/lists/lib/item-api.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const historyApiSource = await readFile(
  new URL("../features/lists/lib/history-api.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const listModalStateHook = await readFile(
  new URL("../features/lists/hooks/useListModalState.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const modalStyles = await readFile(
  new URL(
    "../features/lists/components/modals/ListModals.module.css",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const collaborationModal = await readFile(
  new URL(
    "../features/lists/components/modals/CollaborationModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const createListModal = await readFile(
  new URL(
    "../features/lists/components/modals/CreateListModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const editItemModal = await readFile(
  new URL(
    "../features/lists/components/modals/EditItemModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listHistoryModal = await readFile(
  new URL(
    "../features/lists/components/modals/ListHistoryModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listSettingsModal = await readFile(
  new URL(
    "../features/lists/components/modals/ListSettingsModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const restoreListModal = await readFile(
  new URL(
    "../features/lists/components/modals/RestoreListModal.tsx",
    import.meta.url,
  ),
  {
    encoding: "utf8",
  },
);
const listTypesSource = await readFile(
  new URL("../features/lists/types.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsSource = await readFile(
  new URL("../features/friends/lib/friend-utils.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsQuerySource = await readFile(
  new URL("../lib/friends-query.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const friendsRoute = await readFile(new URL("./friends/page.tsx", import.meta.url), {
  encoding: "utf8",
});
const friendDetailRoute = await readFile(
  new URL("./friends/[friendId]/page.tsx", import.meta.url),
  {
    encoding: "utf8",
  },
);
const transpiledFriends = ts.transpileModule(friendsSource, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { buildFriendSummaries } = await import(
  `data:text/javascript;base64,${Buffer.from(
    transpiledFriends.outputText,
  ).toString("base64")}`
);

test("signed-out landing uses concise product copy and Google CTA", () => {
  assert.match(
    component,
    /<LandingPage onSignIn=\{signIn\} statusMessage=\{statusMessage\} \/>/,
  );
  assert.match(landingComponent, /Keep the things you need in one place\./);
  assert.match(landingComponent, /Continue with Google/);
  assert.match(landingComponent, /Your lists stay with your account\./);
  assert.match(landingStyles, /\.landing/);
  assert.doesNotMatch(styles, /\.landing/);
});

test("auth loading state does not render the signed-out landing", () => {
  assert.match(
    component,
    /type AuthStatus = "loading" \| "authenticated" \| "unauthenticated"/,
  );
  assert.match(component, /authStatus === "loading"/);
  assert.match(component, /isAccountLoading/);
  assert.match(component, /ListsWorkspaceLoadingView/);
  assert.match(component, /FriendsIndexLoadingPanel/);
  assert.match(component, /FriendDetailLoadingPanel/);
  assert.doesNotMatch(component, /Loading your lists\.\.\./);
  assert.doesNotMatch(component, /Loading friends\.\.\./);
  assert.doesNotMatch(styles, /\.auth-loading-shell/);
});

test("loading lists renders static workspace UI with localized spinners", () => {
  assert.match(listsWorkspaceComponent, /function ListsWorkspaceLoadingView/);
  assert.match(listsIndexComponent, /<h2>Your lists<\/h2>/);
  assert.match(listsIndexComponent, /aria-label="Create list"/);
  assert.match(listsIndexComponent, /<LoadingSpinner label="Loading lists" \/>/);
  assert.match(
    listDetailLoadingComponent,
    /<LoadingSpinner label="Loading list details" \/>/,
  );
  assert.match(loadingSpinnerComponent, /role="status"/);
  assert.match(loadingSpinnerStyles, /\.loadingRegion/);
  assert.match(loadingSpinnerStyles, /\.spinner/);
  assert.doesNotMatch(component, /ListsWorkspaceSkeleton/);
});

test("loading lists keeps existing content during background refreshes", () => {
  assert.match(listsIndexComponent, /isLoading && lists\.length === 0/);
  assert.match(
    friendsPageComponent,
    /selectedFriendId \? !selectedFriend : friendSummaries\.length === 0/,
  );
  assert.doesNotMatch(component, /setLists\(\[\]\);\n\s*setIsLoading\(true\)/);
});

test("loading Friends uses static Friends UI with localized spinners", () => {
  assert.match(component, /<FriendsIndexLoadingPanel showLists=\{null\} \/>/);
  assert.match(component, /<FriendDetailLoadingPanel \/>/);
  assert.match(friendsLoadingComponent, /<h1>Friends<\/h1>/);
  assert.match(friendsLoadingComponent, /<h2>Shared lists<\/h2>/);
  assert.match(
    friendsLoadingComponent,
    /<LoadingSpinner label="Loading friends" \/>/,
  );
  assert.match(
    friendsLoadingComponent,
    /<LoadingSpinner label="Loading shared lists" \/>/,
  );
  assert.doesNotMatch(component, /FriendsIndexSkeleton/);
  assert.doesNotMatch(component, /FriendDetailSkeleton/);
  assert.doesNotMatch(component, /Loading shared lists\.\.\./);
  assert.doesNotMatch(styles, /skeleton/);
  assert.doesNotMatch(styles, /\.loading-region/);
});

test("signed-in app exposes list index and useful empty states", () => {
  assert.match(listsIndexComponent, /Your lists/);
  assert.match(listsIndexComponent, /No lists yet/);
  assert.match(
    listsIndexComponent,
    /Create your first list to start keeping things organized\./,
  );
  assert.match(listItemsComponent, /This list is empty/);
});

test("mobile navigation hides the permanent sidebar and provides back flow", () => {
  assert.match(listTypesSource, /type MobileView = "lists" \| "detail"/);
  assert.match(component, /showMobileListIndex/);
  assert.match(
    listsWorkspaceStyles,
    /\.scope:global\(\.mobile-view-lists\) :global\(\.list-detail-panel\)/,
  );
  assert.match(
    listsWorkspaceStyles,
    /\.scope:global\(\.mobile-view-detail\) :global\(\.sidebar\)/,
  );
  assert.match(listsWorkspaceStyles, /\.mobile-back-button/);
  assert.match(listsWorkspaceComponent, /<ListDetailLoadingPanel/);
});

test("desktop layout keeps a two-pane app shell", () => {
  assert.match(
    listsWorkspaceStyles,
    /grid-template-columns: 300px minmax\(0, 1fr\)/,
  );
  assert.match(listsWorkspaceStyles, /\.sidebar/);
  assert.match(listsWorkspaceStyles, /\.list-detail-panel/);
});

test("friends query model returns users after one accepted shared list", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("groceries", "user", "owner"),
      collaborator("groceries", "alex", "editor"),
      collaborator("private", "user", "owner"),
    ],
    currentUserId: "user",
    lists: [
      list("groceries", "user", "Groceries"),
      list("private", "user", "Private notes"),
    ],
  });

  assert.deepEqual(
    summaries.map((summary) => summary.profile.display_name),
    ["Alex"],
  );
  assert.deepEqual(
    summaries[0].sharedLists.map((sharedList) => sharedList.list.title),
    ["Groceries"],
  );
});

test("friends query model deduplicates users and counts shared lists", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("groceries", "user", "owner"),
      collaborator("groceries", "alex", "editor"),
      collaborator("packing", "user", "owner"),
      collaborator("packing", "alex", "viewer"),
    ],
    currentUserId: "user",
    lists: [
      list("groceries", "user", "Groceries"),
      list("packing", "user", "Packing"),
    ],
  });

  assert.equal(summaries.length, 1);
  assert.equal(summaries[0].sharedLists.length, 2);
});

test("friends query model excludes pending, revoked, current, and unrelated users", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("accepted", "user", "owner"),
      collaborator("accepted", "alex", "editor"),
      collaborator("pending", "user", "owner"),
      collaborator("pending", "casey", "viewer", "pending"),
      collaborator("revoked", "user", "owner"),
      collaborator("revoked", "riley", "viewer", "declined"),
      collaborator("unrelated", "morgan", "owner"),
      collaborator("unrelated", "taylor", "viewer"),
    ],
    currentUserId: "user",
    lists: [
      list("accepted", "user", "Accepted"),
      list("pending", "user", "Pending"),
      list("revoked", "user", "Revoked"),
      list("unrelated", "morgan", "Unrelated"),
    ],
  });

  assert.deepEqual(
    summaries.map((summary) => summary.profile.id),
    ["alex"],
  );
});

test("deleting the final shared list removes the friend", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("deleted", "user", "owner"),
      collaborator("deleted", "alex", "editor"),
    ],
    currentUserId: "user",
    lists: [],
  });

  assert.deepEqual(summaries, []);
});

test("friend detail model distinguishes ownership and ignores revoked membership", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("owned-by-user", "user", "owner"),
      collaborator("owned-by-user", "alex", "viewer"),
      collaborator("owned-by-alex", "alex", "owner"),
      collaborator("owned-by-alex", "user", "editor"),
      collaborator("revoked", "alex", "viewer", "declined"),
    ],
    currentUserId: "user",
    lists: [
      list("owned-by-user", "user", "Packing"),
      list("owned-by-alex", "alex", "Trip plan"),
      list("revoked", "user", "Old list"),
    ],
  });

  assert.deepEqual(
    summaries[0].sharedLists.map((sharedList) => sharedList.ownerLabel),
    ["Owned by you", "Owned by Alex"],
  );
  assert.deepEqual(
    summaries[0].sharedLists.map((sharedList) => sharedList.friendRole),
    ["viewer", "owner"],
  );
});

test("shared list participant model renders owner first with text access labels", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("shared", "jamie", "viewer"),
      collaborator("shared", "alex", "owner"),
      collaborator("shared", "user", "editor"),
      collaborator("shared", "pending", "viewer", "pending"),
      collaborator("shared", "jamie", "viewer"),
    ],
    currentUserId: "user",
    lists: [list("shared", "alex", "Shared project")],
  });
  const participants = summaries[0].sharedLists[0].participants;

  assert.deepEqual(
    participants.map((participant) => participant.profile.id),
    ["alex", "jamie", "user"],
  );
  assert.deepEqual(
    participants.map((participant) => participant.accessLabel),
    ["Owner", "View only", "Can edit"],
  );
});

test("friends navigation and empty states are present in the app UI", () => {
  assert.match(component, /<FriendsPage/);
  assert.match(friendsIndexComponent, /No friends yet/);
  assert.match(friendDetailComponent, /No shared lists/);
  assert.match(friendDetailComponent, /Lists shared with/);
  assert.ok(appShellComponent.includes('href="/friends"'));
  assert.match(friendRowStyles, /\.row/);
  assert.match(sharedListRowStyles, /\.row/);
  assert.match(participantListStyles, /\.participants/);
  assert.match(participantListStyles, /\.access/);
  assert.doesNotMatch(
    sharedListRowComponent,
    /Updated/,
  );
  assert.doesNotMatch(component, /permission-pills/);
  assert.doesNotMatch(styles, /permission-pills/);
  assert.doesNotMatch(component, /app-section-nav/);
  assert.doesNotMatch(styles, /app-section-nav/);
});

test("friends routes render outside the list workspace", () => {
  assert.match(component, /appSection === "friends"/);
  assert.match(component, /className="app-main friends-main"/);
  assert.match(component, /loadFriendsWorkspaceData/);
  assert.match(friendsPageComponent, /function FriendsPage/);
  assert.match(friendsPageStyles, /\.screen/);
  assert.doesNotMatch(friendsRoute, /app-grid|sidebar|Your lists/);
  assert.doesNotMatch(friendDetailRoute, /app-grid|sidebar|Your lists/);
  assert.match(styles, /\.friends-main/);
});

test("avatar menu is structured as an account menu", () => {
  assert.match(appShellComponent, /aria-label="Open account menu"/);
  assert.match(appShellComponent, /aria-expanded=\{isOpen\}/);
  assert.match(appShellComponent, /aria-haspopup="menu"/);
  assert.match(appShellComponent, /styles\.accountIdentity/);
  assert.match(appShellComponent, /styles\.divider/);
  assert.match(appShellComponent, /styles\.menuItem/);
  assert.match(appShellComponent, /styles\.signOutItem/);
  assert.match(appShellComponent, /event.key === "Escape"/);
  assert.match(appShellStyles, /\.menuItem/);
  assert.match(appShellStyles, /\.accountText strong/);
  assert.doesNotMatch(styles, /\.account-menu-item/);
  assert.doesNotMatch(styles, /\.avatar-menu/);
});

test("shared shell, avatar, spinner, and landing live outside the app controller", () => {
  assert.match(component, /import \{ AppShell as Shell \}/);
  assert.doesNotMatch(component, /import \{ Avatar \}/);
  assert.doesNotMatch(component, /import \{ LoadingSpinner \}/);
  assert.match(component, /import \{ LandingPage \}/);
  assert.match(appShellStyles, /\.appShell/);
  assert.match(appShellComponent, /<NotificationsMenu/);
  assert.match(notificationMenuStyles, /\.button/);
  assert.match(avatarComponent, /size\?: "default" \| "large"/);
  assert.match(avatarStyles, /\.large/);
  assert.doesNotMatch(styles, /\.app-shell/);
  assert.doesNotMatch(styles, /\.notification-button/);
});

test("lists feature UI and pure helpers live outside the app controller", () => {
  assert.match(component, /<ListsWorkspace/);
  assert.match(listsWorkspaceComponent, /<ListsSidebar/);
  assert.match(listsWorkspaceComponent, /<ListDetail/);
  assert.match(listsIndexComponent, /<ListRow/);
  assert.match(listDetailComponent, /<AddItemForm/);
  assert.match(listDetailComponent, /<ListItems/);
  assert.match(listItemsComponent, /<ListItemRow/);
  assert.match(listItemRowComponent, /Open actions for/);
  assert.match(listUtilsSource, /export const sortListsByPreference/);
  assert.doesNotMatch(component, /function ItemCard/);
  assert.doesNotMatch(component, /function DropZone/);
  assert.doesNotMatch(styles, /\.item-card/);
  assert.doesNotMatch(styles, /\.app-grid/);
});

test("list modals live in feature components with modal CSS modules", () => {
  assert.match(component, /<EditItemModal/);
  assert.match(component, /<RestoreListModal/);
  assert.match(component, /<CollaborationModal/);
  assert.match(component, /<ListSettingsModal/);
  assert.match(component, /<ListHistoryModal/);
  assert.match(component, /<CreateListModal/);
  assert.doesNotMatch(component, /function ListToolModal/);
  assert.doesNotMatch(component, /function ItemModal/);
  assert.doesNotMatch(component, /function RestoreModal/);
  assert.doesNotMatch(component, /function FriendList/);
  assert.doesNotMatch(component, /function CollaboratorList/);
  assert.match(modalStyles, /\.backdrop/);
  assert.match(modalStyles, /\.toolModal/);
  assert.match(modalStyles, /\.dangerZone/);
  assert.match(modalStyles, /\.fieldToggleGrid/);
  assert.match(modalStyles, /\.historyList/);
  assert.doesNotMatch(styles, /\.modal-backdrop/);
  assert.doesNotMatch(styles, /\.modal-header/);
  assert.doesNotMatch(styles, /\.tool-modal/);
  assert.doesNotMatch(styles, /\.danger-zone/);
  assert.doesNotMatch(styles, /\.field-toggle-grid/);
  assert.doesNotMatch(styles, /\.history-list/);
  assert.doesNotMatch(styles, /\.friend-list/);
  assert.doesNotMatch(styles, /\.collaborator-list/);
});

test("extracted modals preserve list tools and accessibility hooks", () => {
  assert.match(createListModal, /export type NewListDraft/);
  assert.match(createListModal, /autoFocus/);
  assert.match(createListModal, /event\.key === "Enter"/);
  assert.match(createListModal, /Create list/);
  assert.match(createListModal, /Select existing friend/);
  assert.match(collaborationModal, /Share role/);
  assert.match(collaborationModal, /Invite to list/);
  assert.match(collaborationModal, /Collaborators/);
  assert.match(listSettingsModal, /Save name/);
  assert.match(listSettingsModal, /Remove completed/);
  assert.match(listSettingsModal, /Clear all/);
  assert.match(listSettingsModal, /Delete list/);
  assert.match(listSettingsModal, /deleteListConfirmation/);
  assert.match(listHistoryModal, /No saved history yet/);
  assert.match(listHistoryModal, /formatDateTime/);
  assert.match(editItemModal, /Edit item/);
  assert.match(editItemModal, /saveItemDetails/);
  assert.match(editItemModal, /priorityOptions/);
  assert.match(editItemModal, /categoryOptions/);
  assert.match(restoreListModal, /Restoring this snapshot/);
  assert.match(
    editItemModal,
    /onMouseDown=\{\(event\) => event\.stopPropagation\(\)\}/,
  );
});

test("list API modules and modal state hook keep orchestration out of the app", () => {
  assert.match(component, /loadAccessibleLists\(\s*supabase,\s*userId,\s*\)/);
  assert.match(component, /loadSharedCandidateLists\(/);
  assert.match(component, /loadListWorkspaceData\(supabase, listId\)/);
  assert.match(component, /createListWithOwner\(supabase/);
  assert.match(component, /createListSnapshot\(supabase/);
  assert.match(component, /buildSnapshotRestoreRows/);
  assert.match(component, /useListModalState\(\)/);
  assert.match(listApiSource, /export async function loadAccessibleLists/);
  assert.match(listApiSource, /export async function createListWithOwner/);
  assert.match(itemApiSource, /export async function loadListWorkspaceData/);
  assert.match(historyApiSource, /export async function createListSnapshot/);
  assert.match(listModalStateHook, /export function useListModalState/);
  assert.match(listModalStateHook, /type ActiveListModal/);
});

test("friends feature components own friends UI outside the app controller", () => {
  assert.match(component, /useFriendsController/);
  assert.match(component, /<FriendsPage/);
  assert.doesNotMatch(component, /function FriendsPanel/);
  assert.doesNotMatch(component, /function FriendsIndexLoadingPanel/);
  assert.doesNotMatch(component, /function FriendDetailLoadingPanel/);
  assert.match(friendsControllerSource, /buildFriendSummaries/);
  assert.ok(friendRowComponent.includes('href={`/friends/${friend.profile.id}`}'));
  assert.match(sharedListRowComponent, /onOpenList\(sharedList\.list\.id\)/);
  assert.match(participantListComponent, /participant\.accessLabel/);
  assert.match(friendsApiSource, /sendFriendRequestByEmail/);
  assert.match(friendsPageStyles, /\.emptyState/);
  assert.doesNotMatch(styles, /\.friends-screen/);
  assert.doesNotMatch(styles, /\.friend-row/);
  assert.doesNotMatch(styles, /\.shared-list-row/);
  assert.doesNotMatch(styles, /\.shared-list-participants/);
  assert.doesNotMatch(styles, /\.participant-access/);
});

test("notifications feature owns notification menu UI and API helpers", () => {
  assert.match(appShellComponent, /from "\.\.\/\.\.\/features\/notifications/);
  assert.match(notificationMenuComponent, /aria-label="Notifications"/);
  assert.match(notificationMenuComponent, /event\.key === "Escape"/);
  assert.match(notificationMenuComponent, /getUnreadNotificationCount/);
  assert.match(notificationRowComponent, /Accept Friend/);
  assert.match(notificationRowComponent, /Accept List/);
  assert.match(notificationRowComponent, /ignoreNotification/);
  assert.match(notificationUtilsSource, /getNotificationLabel/);
  assert.match(notificationsApiSource, /loadAccountInboxData/);
  assert.match(notificationsApiSource, /acceptFriendRequestNotification/);
  assert.match(notificationsApiSource, /acceptListInviteNotification/);
  assert.match(notificationsApiSource, /ignoreAccountNotification/);
  assert.match(notificationMenuStyles, /\.panel/);
  assert.doesNotMatch(appShellComponent, /function NotificationsMenu/);
  assert.doesNotMatch(styles, /\.notification-list/);
  assert.doesNotMatch(styles, /\.popover-panel/);
});

test("friends routes and server query hooks are present", () => {
  assert.match(friendsRoute, /initialSection="friends"/);
  assert.match(friendDetailRoute, /initialFriendId=\{friendId\}/);
  assert.match(friendsQuerySource, /loadSharedFriends/);
  assert.match(friendsQuerySource, /loadSharedFriend/);
  assert.match(friendsQuerySource, /Authorization: authorization/);
  assert.match(friendsQuerySource, /buildFriendSummaries/);
});

function profile(id, displayName) {
  return {
    avatar_url: null,
    created_at: "2026-01-01T00:00:00Z",
    display_name: displayName,
    email: `${id}@example.com`,
    id,
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function list(id, ownerId, title) {
  return {
    created_at: "2026-01-01T00:00:00Z",
    id,
    item_fields: null,
    owner_id: ownerId,
    share_token: `${id}-token`,
    sort_mode: "manual",
    title,
    updated_at: "2026-01-01T00:00:00Z",
  };
}

function collaborator(listId, userId, role, status = "accepted") {
  return {
    created_at: "2026-01-01T00:00:00Z",
    id: `${listId}-${userId}`,
    invited_by: null,
    list_id: listId,
    profile: profile(userId, userId === "alex" ? "Alex" : "You"),
    role,
    status,
    updated_at: "2026-01-01T00:00:00Z",
    user_id: userId,
  };
}
