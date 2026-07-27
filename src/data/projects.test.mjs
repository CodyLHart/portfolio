import assert from "node:assert/strict";
import test from "node:test";

const { allProjects, getProject, projects } = await import("./projects.ts");

test("visible portfolio projects are ordered and scoped", () => {
  assert.deepEqual(
    projects.map((project) => project.name),
    ["Store", "Design Portfolio", "List App", "Shell"],
  );
  assert.equal(projects.length, 4);
  assert.equal(projects[0].href, "https://shop.codyhartdesign.com/");
  assert.equal(projects.some((project) => project.name === "Habit Tracker"), false);
  assert.equal(projects.some((project) => project.name === "Games"), false);
});

test("hidden projects remain registered for direct detail routes", () => {
  assert.ok(allProjects.some((project) => project.slug === "habit-tracker"));
  assert.ok(allProjects.some((project) => project.slug === "games"));
  assert.equal(getProject("habit-tracker")?.name, "Habit Tracker");
  assert.equal(getProject("games")?.name, "Games");
});
