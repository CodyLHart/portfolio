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
const friendsSource = await readFile(new URL("../lib/friends.ts", import.meta.url), {
  encoding: "utf8",
});
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
  assert.match(component, /Keep the things you need in one place\./);
  assert.match(component, /Continue with Google/);
  assert.match(component, /Your lists stay with your account\./);
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
  assert.match(component, /function ListsWorkspaceLoadingView/);
  assert.match(component, /<h2>Your lists<\/h2>/);
  assert.match(component, /aria-label="Create list"/);
  assert.match(component, /<LoadingSpinner label="Loading lists" \/>/);
  assert.match(component, /<LoadingSpinner label="Loading list details" \/>/);
  assert.match(styles, /\.loading-region/);
  assert.match(styles, /\.loading-spinner/);
  assert.doesNotMatch(component, /ListsWorkspaceSkeleton/);
});

test("loading lists keeps existing content during background refreshes", () => {
  assert.match(component, /isLoading && lists\.length === 0/);
  assert.match(component, /selectedFriendId \? !selectedFriend : friendSummaries\.length === 0/);
  assert.doesNotMatch(component, /setLists\(\[\]\);\n\s*setIsLoading\(true\)/);
});

test("loading Friends uses static Friends UI with localized spinners", () => {
  assert.match(component, /function FriendsIndexLoadingPanel/);
  assert.match(component, /function FriendDetailLoadingPanel/);
  assert.match(component, /<h1>Friends<\/h1>/);
  assert.match(component, /<h2>Shared lists<\/h2>/);
  assert.match(component, /<LoadingSpinner label="Loading friends" \/>/);
  assert.match(component, /<LoadingSpinner label="Loading shared lists" \/>/);
  assert.doesNotMatch(component, /FriendsIndexSkeleton/);
  assert.doesNotMatch(component, /FriendDetailSkeleton/);
  assert.doesNotMatch(component, /Loading shared lists\.\.\./);
  assert.doesNotMatch(styles, /skeleton/);
});

test("signed-in app exposes list index and useful empty states", () => {
  assert.match(component, /Your lists/);
  assert.match(component, /No lists yet/);
  assert.match(
    component,
    /Create your first list to start keeping things organized\./,
  );
  assert.match(component, /This list is empty/);
});

test("mobile navigation hides the permanent sidebar and provides back flow", () => {
  assert.match(component, /type MobileView = "lists" \| "detail"/);
  assert.match(component, /showMobileListIndex/);
  assert.match(styles, /\.app-grid\.mobile-view-lists \.list-detail-panel/);
  assert.match(styles, /\.app-grid\.mobile-view-detail \.sidebar/);
  assert.match(styles, /\.mobile-back-button/);
  assert.match(component, /<ListDetailLoadingPanel/);
});

test("desktop layout keeps a two-pane app shell", () => {
  assert.match(styles, /grid-template-columns: 300px minmax\(0, 1fr\)/);
  assert.match(styles, /\.sidebar/);
  assert.match(styles, /\.list-detail-panel/);
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
  assert.match(component, /FriendsPanel/);
  assert.match(component, /No friends yet/);
  assert.match(component, /No shared lists/);
  assert.match(component, /Lists shared with/);
  assert.ok(component.includes('href="/friends"'));
  assert.match(styles, /\.friend-row/);
  assert.match(styles, /\.shared-list-row/);
  assert.match(styles, /\.shared-list-participants/);
  assert.match(styles, /\.participant-access/);
  assert.doesNotMatch(
    component,
    /className="shared-list-row"[\s\S]*Updated/,
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
  assert.doesNotMatch(friendsRoute, /app-grid|sidebar|Your lists/);
  assert.doesNotMatch(friendDetailRoute, /app-grid|sidebar|Your lists/);
  assert.match(styles, /\.friends-main/);
});

test("avatar menu is structured as an account menu", () => {
  assert.match(component, /aria-label="Open account menu"/);
  assert.match(component, /aria-expanded=\{isOpen\}/);
  assert.match(component, /aria-haspopup="menu"/);
  assert.match(component, /account-menu-identity/);
  assert.match(component, /account-menu-divider/);
  assert.match(component, /className="account-menu-item"/);
  assert.match(component, /className="account-menu-item sign-out-menu-item"/);
  assert.match(component, /event.key === "Escape"/);
  assert.match(styles, /\.account-menu-item/);
  assert.match(styles, /\.account-menu-text strong/);
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
