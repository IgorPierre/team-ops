import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

// Everything (prompts included) is bundled, so `npm create team-ops` downloads one file and no deps.
await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "esm",
  outfile: "dist/index.js",
  define: { __VERSION__: JSON.stringify(pkg.version) },
  banner: { js: "#!/usr/bin/env node" },
  logLevel: "info",
});
