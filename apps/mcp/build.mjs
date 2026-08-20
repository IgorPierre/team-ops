import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  external: ["@modelcontextprotocol/sdk", "zod"],
  banner: {
    js: "#!/usr/bin/env node",
  },
  logLevel: "info",
});
