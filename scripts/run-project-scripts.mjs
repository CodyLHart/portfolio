import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const scriptName = process.argv[2];

if (!scriptName) {
  console.error("Usage: node scripts/run-project-scripts.mjs <script>");
  process.exit(1);
}

const roots = ["apps", "packages"];
const runnableProjects = [];

for (const root of roots) {
  if (!existsSync(root)) {
    continue;
  }

  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const projectPath = join(root, entry.name);
    const packageJsonPath = join(projectPath, "package.json");

    if (!existsSync(packageJsonPath)) {
      continue;
    }

    const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    if (manifest.scripts?.[scriptName]) {
      runnableProjects.push({
        name: manifest.name ?? projectPath,
        path: projectPath,
      });
    }
  }
}

if (runnableProjects.length === 0) {
  console.log(`No project packages define a "${scriptName}" script yet.`);
  process.exit(0);
}

for (const project of runnableProjects) {
  console.log(`\n> ${project.name}: npm run ${scriptName}`);

  const result = spawnSync("npm", ["run", scriptName], {
    cwd: project.path,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
