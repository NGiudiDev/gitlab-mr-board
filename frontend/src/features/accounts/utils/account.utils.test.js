import { describe, expect, it } from "vitest";

import { isAdmin } from "./account.utils.js";

describe("isAdmin", () => {
  it("reconoce el rol de administrador", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
  });

  it("rechaza otros roles y personas ausentes", () => {
    expect(isAdmin({ role: "user" })).toBe(false);
    expect(isAdmin({})).toBe(false);
    expect(isAdmin(null)).toBe(false);
    expect(isAdmin()).toBe(false);
  });
});
