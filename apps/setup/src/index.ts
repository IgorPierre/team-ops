import { runSetup } from "./run.js";

try {
  await runSetup(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`team-ops-setup: ${message}`);
  process.exit(1);
}
