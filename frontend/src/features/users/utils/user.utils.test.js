import { describe, expect, it } from "vitest";

import { getUserInitials, isAdmin } from "./user.utils.js";

describe("getUserInitials", () => {
  it("toma la primera y la última palabra del nombre visible", () => {
    expect(getUserInitials({ displayName: "Ana María Pérez" })).toBe("AP");
  });

  it("recorta a dos letras cuando hay una sola palabra", () => {
    expect(getUserInitials({ displayName: "ana" })).toBe("AN");
  });

  it("cae al email y después a un signo de pregunta", () => {
    expect(getUserInitials({ email: "beto@example.com" })).toBe("BE");
    expect(getUserInitials(null)).toBe("?");
  });
});

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
