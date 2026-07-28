import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("./list-utils.ts", import.meta.url), {
  encoding: "utf8",
});
const transpiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const {
  buildVisibleItemGroups,
  getCategoryOptions,
  getPriorityFilterOptions,
  normalizeItemFields,
  sortListsByPreference,
} = await import(
  `data:text/javascript;base64,${Buffer.from(
    transpiled.outputText,
  ).toString("base64")}`
);

test("normalizes list item fields with enabled defaults", () => {
  assert.deepEqual(normalizeItemFields({ notes: false }), {
    assignee: true,
    category: true,
    dueDate: true,
    notes: false,
    priority: true,
    quantity: true,
  });
});

test("sorts lists by saved preference before updated timestamp", () => {
  const lists = [
    list("later", "2026-02-01T00:00:00Z"),
    list("first", "2026-01-01T00:00:00Z"),
    list("second", "2026-03-01T00:00:00Z"),
  ];

  assert.deepEqual(
    sortListsByPreference(lists, [
      { list_id: "first", position: 1 },
      { list_id: "second", position: 2 },
    ]).map((entry) => entry.id),
    ["first", "second", "later"],
  );
});

test("builds visible item groups from active category filters", () => {
  const groups = buildVisibleItemGroups({
    items: [
      item("one", "Produce", "high", false, 2),
      item("two", "Pantry", "low", false, 1),
      item("three", null, "high", true, 3),
    ],
    selectedCategories: ["Produce", "Uncategorized"],
    selectedPriorities: ["high"],
  });

  assert.deepEqual(
    groups.map((group) => ({
      category: group.category,
      items: group.items.map((entry) => entry.id),
    })),
    [
      { category: "Produce", items: ["one"] },
      { category: "Uncategorized", items: ["three"] },
    ],
  );
});

test("derives category and priority filter options from list content", () => {
  const fields = normalizeItemFields(null);
  const items = [
    item("one", "Produce", "high", false, 1),
    item("two", null, "low", false, 2),
  ];

  assert.deepEqual(
    getCategoryOptions({
      itemFields: fields,
      items,
      suggestions: [{ category: "Bakery", title: "Bread" }],
    }),
    ["Bakery", "Produce", "Uncategorized"],
  );
  assert.deepEqual(getPriorityFilterOptions({ itemFields: fields, items }), [
    "low",
    "high",
  ]);
});

function list(id, updatedAt) {
  return {
    id,
    item_fields: null,
    owner_id: "user",
    share_token: `${id}-token`,
    sort_mode: "manual",
    title: id,
    updated_at: updatedAt,
    created_at: updatedAt,
  };
}

function item(id, category, priority, completed, position) {
  return {
    assigned_to: null,
    assignee: null,
    category,
    completed,
    completed_at: completed ? "2026-01-01T00:00:00Z" : null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: "user",
    due_date: null,
    id,
    list_id: "list",
    notes: null,
    position,
    priority,
    quantity: null,
    title: id,
    updated_at: "2026-01-01T00:00:00Z",
  };
}
