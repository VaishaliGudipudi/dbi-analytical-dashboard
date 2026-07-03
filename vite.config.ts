// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Keep TanStack Start pointed at the custom SSR wrapper, and let Nitro switch
// between Vercel and Cloudflare build targets without changing app code.
const useVercelPreset = process.env.VERCEL === "1" && process.platform !== "win32";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro:
    useVercelPreset
      ? { preset: "vercel" }
      : {
          preset: "cloudflare-module",
          output: {
            dir: "dist",
            serverDir: "dist/server",
            publicDir: "dist/client",
          },
          cloudflare: {
            nodeCompat: true,
            deployConfig: true,
          },
        },
});
