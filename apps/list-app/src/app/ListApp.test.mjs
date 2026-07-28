import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const component = await readFile(new URL("./ListApp.tsx", import.meta.url), {
  encoding: "utf8",
});
const styles = await readFile(new URL("./globals.css", import.meta.url), {
  encoding: "utf8",
});

test("signed-out landing uses concise product copy and Google CTA", () => {
  assert.match(component, /Keep the things you need in one place\./);
  assert.match(component, /Continue with Google/);
  assert.match(component, /Your lists stay with your account\./);
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
});

test("desktop layout keeps a two-pane app shell", () => {
  assert.match(styles, /grid-template-columns: 300px minmax\(0, 1fr\)/);
  assert.match(styles, /\.sidebar/);
  assert.match(styles, /\.list-detail-panel/);
});
