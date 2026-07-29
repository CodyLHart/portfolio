import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("./friend-utils.ts", import.meta.url), {
  encoding: "utf8",
});
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  buildFriendSummaries,
  formatSharedListCount,
  roleLabel,
} = await import(
  `data:text/javascript;base64,${Buffer.from(
    transpiled.outputText,
  ).toString("base64")}`
);

test("maps raw roles to textual access labels", () => {
  assert.equal(roleLabel("owner"), "Owner");
  assert.equal(roleLabel("editor"), "Can edit");
  assert.equal(roleLabel("viewer"), "View only");
});

test("formats shared-list counts without exposing raw metadata", () => {
  assert.equal(formatSharedListCount(1), "1 shared list");
  assert.equal(formatSharedListCount(2), "2 shared lists");
});

test("builds owner-first deduplicated participant lists", () => {
  const summaries = buildFriendSummaries({
    collaborators: [
      collaborator("shared", "viewer", "viewer"),
      collaborator("shared", "owner", "owner"),
      collaborator("shared", "user", "editor"),
      collaborator("shared", "viewer", "viewer"),
    ],
    currentUserId: "user",
    lists: [list("shared", "owner", "Shared list")],
  });
  const participants = summaries[0].sharedLists[0].participants;

  assert.deepEqual(
    participants.map((participant) => participant.profile.id),
    ["owner", "viewer", "user"],
  );
  assert.deepEqual(
    participants.map((participant) => participant.accessLabel),
    ["Owner", "View only", "Can edit"],
  );
});

function profile(id) {
  return {
    avatar_url: null,
    created_at: "2026-01-01T00:00:00Z",
    display_name: id === "user" ? "You" : id,
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

function collaborator(listId, userId, role) {
  return {
    created_at: "2026-01-01T00:00:00Z",
    id: `${listId}-${userId}`,
    invited_by: null,
    list_id: listId,
    profile: profile(userId),
    role,
    status: "accepted",
    updated_at: "2026-01-01T00:00:00Z",
    user_id: userId,
  };
}
