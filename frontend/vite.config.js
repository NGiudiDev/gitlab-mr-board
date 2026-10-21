import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const fileEnvironment = loadEnv(mode, import.meta.dirname, "");
  const sentryRelease = (
    process.env.VITE_SENTRY_RELEASE
    || fileEnvironment.VITE_SENTRY_RELEASE
    || process.env.VERCEL_GIT_COMMIT_SHA
    || process.env.VITE_VERCEL_GIT_COMMIT_SHA
    || ""
  ).trim();

  return {
    define: {
      "import.meta.env.VITE_SENTRY_RELEASE": JSON.stringify(sentryRelease),
    },
    plugins: [react()],
    test: {
      environment: "happy-dom",
      setupFiles: ["./test/setup.js"],
      coverage: {
        provider: "v8",
        reporter: ["text", "html", "lcov"],
        // Incluye los módulos sin test para que la cobertura refleje todo el
        // código de producción, no sólo el que ya está cubierto.
        include: ["src/**/*.{js,jsx}"],
        exclude: ["src/**/*.test.{js,jsx}", "src/main.jsx"],
      },
    },
  };
});
