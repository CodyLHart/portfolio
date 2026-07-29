import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readFile } from "node:fs/promises";

const source = await readFile(
  new URL("./notification-utils.ts", import.meta.url),
  {
    encoding: "utf8",
  },
);
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  getNotificationLabel,
  getUnreadNotificationCount,
  getUnreadNotifications,
} = await import(
  `data:text/javascript;base64,${Buffer.from(
    transpiled.outputText,
  ).toString("base64")}`
);

test("counts unread notifications only", () => {
  const notifications = [
    notification("first", null),
    notification("second", "2026-01-01T00:00:00Z"),
  ];

  assert.equal(getUnreadNotificationCount(notifications), 1);
  assert.deepEqual(
    getUnreadNotifications(notifications).map((item) => item.id),
    ["first"],
  );
});

test("formats notification labels with sender and list fallbacks", () => {
  assert.equal(
    getNotificationLabel({
      ...notification("friend", null),
      actor: { display_name: "Alex" },
      type: "friend_request",
    }),
    "Alex sent a friend request.",
  );
  assert.equal(
    getNotificationLabel({
      ...notification("list", null),
      actor: null,
      payload: {},
      type: "list_invite",
    }),
    "Someone invited you to a list.",
  );
});

function notification(id, readAt) {
  return {
    actor: null,
    actor_id: null,
    created_at: "2026-01-01T00:00:00Z",
    id,
    payload: { listTitle: "Packing" },
    read_at: readAt,
    recipient_id: "user",
    type: "role_change",
  };
}
