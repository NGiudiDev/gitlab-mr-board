import { afterEach, describe, expect, it } from "vitest";

import viteConfig from "./vite.config.js";

const originalSentryRelease = process.env.VITE_SENTRY_RELEASE;
const originalVercelCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
const originalViteVercelCommitSha = process.env.VITE_VERCEL_GIT_COMMIT_SHA;

afterEach(() => {
  if (originalSentryRelease === undefined) delete process.env.VITE_SENTRY_RELEASE;
  else process.env.VITE_SENTRY_RELEASE = originalSentryRelease;

  if (originalVercelCommitSha === undefined) delete process.env.VERCEL_GIT_COMMIT_SHA;
  else process.env.VERCEL_GIT_COMMIT_SHA = originalVercelCommitSha;

  if (originalViteVercelCommitSha === undefined) delete process.env.VITE_VERCEL_GIT_COMMIT_SHA;
  else process.env.VITE_VERCEL_GIT_COMMIT_SHA = originalViteVercelCommitSha;
});

describe("configuración de build", () => {
  it("usa el SHA de Vercel como release de Sentry", () => {
    delete process.env.VITE_SENTRY_RELEASE;
    process.env.VERCEL_GIT_COMMIT_SHA = "abc123";

    const config = viteConfig({ mode: "test" });

    expect(config.define["import.meta.env.VITE_SENTRY_RELEASE"]).toBe("\"abc123\"");
  });

  it("admite el SHA con prefijo que Vercel expone para Vite", () => {
    delete process.env.VITE_SENTRY_RELEASE;
    delete process.env.VERCEL_GIT_COMMIT_SHA;
    process.env.VITE_VERCEL_GIT_COMMIT_SHA = "def456";

    const config = viteConfig({ mode: "test" });

    expect(config.define["import.meta.env.VITE_SENTRY_RELEASE"]).toBe("\"def456\"");
  });

  it("prioriza el release configurado explícitamente", () => {
    process.env.VITE_SENTRY_RELEASE = "gitlab-mr-board@release";
    process.env.VERCEL_GIT_COMMIT_SHA = "abc123";

    const config = viteConfig({ mode: "test" });

    expect(config.define["import.meta.env.VITE_SENTRY_RELEASE"]).toBe(
      "\"gitlab-mr-board@release\"",
    );
  });
});
