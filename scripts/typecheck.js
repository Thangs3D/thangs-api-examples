// Type checks every sample that has a tsconfig.json.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const samplesDir = "samples";
const projects = readdirSync(samplesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(samplesDir, entry.name))
  .filter((dir) => existsSync(join(dir, "tsconfig.json")));

if (projects.length === 0) {
  console.log("No samples to type check yet.");
}

let failed = false;
for (const project of projects) {
  console.log(`Type checking ${project}`);
  const result = spawnSync("npx", ["tsc", "--noEmit", "-p", project], {
    stdio: "inherit",
  });
  if (result.status !== 0) failed = true;
}

process.exit(failed ? 1 : 0);
