import { describe, expect, it, vi } from "vitest";

import { createTestDatabase } from "../../../../test/database.js";
import { createAccountRepository } from "../../accounts/services/accountRepository.js";
import { createAccountService } from "../../accounts/services/accountService.js";
import { createUserRepository } from "./userRepository.js";
import { createUserService, normalizeEmail } from "./userService.js";

const PASSWORD = "contrasena-de-prueba";

async function createContext() {
  const database = await createTestDatabase();
  const accountService = createAccountService({ repository: createAccountRepository(database) });
  const account = await accountService.create("Equipo");
  const invalidateSessions = vi.fn();
  const userService = createUserService({
    repository: createUserRepository(database),
    invalidateSessions,
    now: () => new Date("2026-09-01T10:00:00.000Z"),
  });

  return { account, accountService, invalidateSessions, userService };
}

async function createContextWithUser() {
  const context = await createContext();
  const user = await context.userService.createUser({
    accountId: context.account.id,
    email: "ana@example.com",
    password: PASSWORD,
    displayName: "Ana",
  });
  return { ...context, user };
}

describe("normalizeEmail", () => {
  it("recorta espacios y pasa a minúsculas", () => {
    expect(normalizeEmail("  Ana.Perez@Example.com  ")).toBe("ana.perez@example.com");
  });
});

describe("alta de usuarios", () => {
  it("crea un usuario activo sin exponer la contraseña", async () => {
    const { account, userService } = await createContext();

    const user = await userService.createUser({
      accountId: account.id,
      email: " ANA@example.com ",
      password: PASSWORD,
    });

    expect(user).toMatchObject({ accountId: account.id, email: "ana@example.com", role: "user" });
    expect(JSON.stringify(user)).not.toContain("scrypt");
  });

  it("valida email, contraseña y unicidad global", async () => {
    const { account, accountService, userService } = await createContextWithUser();
    const otherAccount = await accountService.create("Otro equipo");

    await expect(userService.createUser({ accountId: account.id, email: "a", password: PASSWORD }))
      .rejects.toMatchObject({ status: 400 });
    await expect(userService.createUser({ accountId: account.id, email: "zoe@example.com", password: "corta" }))
      .rejects.toMatchObject({ status: 400 });
    await expect(userService.createUser({ accountId: otherAccount.id, email: "ANA@EXAMPLE.COM", password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
  });
});

describe("perfil propio", () => {
  it("actualiza el nombre, el email y el nickname de GitLab", async () => {
    const { user, userService } = await createContextWithUser();

    const profile = await userService.changeOwnProfile(user.id, {
      email: " Anita@example.com ",
      displayName: " Anita ",
    });
    const withGitlab = await userService.changeGitlabUsername(user.id, " anita-gitlab ");

    expect(profile).toMatchObject({ email: "anita@example.com", displayName: "Anita" });
    expect(withGitlab.gitlabUsername).toBe("anita-gitlab");
  });

  it("rechaza datos inválidos, duplicados o un usuario inexistente", async () => {
    const { account, user, userService } = await createContextWithUser();
    await userService.createUser({ accountId: account.id, email: "beto@example.com", password: PASSWORD });

    await expect(userService.changeOwnProfile(user.id, { email: "a" }))
      .rejects.toMatchObject({ status: 400 });
    await expect(userService.changeOwnProfile(user.id, { email: "beto@example.com" }))
      .rejects.toMatchObject({ status: 409 });
    await expect(userService.changeGitlabUsername(user.id, "-anita"))
      .rejects.toMatchObject({ status: 400 });
    await expect(userService.changeOwnProfile("inexistente", { displayName: "Ana" }))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe("administración", () => {
  it("lista sólo la cuenta indicada y valida la pertenencia", async () => {
    const { account, accountService, userService } = await createContextWithUser();
    const otherAccount = await accountService.create("Otro equipo");
    await userService.createUser({
      accountId: otherAccount.id,
      email: "beto@example.com",
      password: PASSWORD,
    });

    expect((await userService.listUsers(account.id)).map(({ email }) => email))
      .toEqual(["ana@example.com"]);
    await expect(userService.requireAccountMember(account.id, "beto@example.com"))
      .rejects.toMatchObject({ status: 404 });
  });

  it("deshabilita, invalida sesiones y vuelve a habilitar", async () => {
    const { invalidateSessions, userService } = await createContextWithUser();

    expect((await userService.setUserStatus("ANA@EXAMPLE.COM", "disabled")).status)
      .toBe("disabled");
    expect(invalidateSessions).toHaveBeenCalledOnce();
    expect((await userService.setUserStatus("ana@example.com", "active")).status)
      .toBe("active");
  });

  it("borra y lista usuarios sin datos sensibles", async () => {
    const { userService } = await createContextWithUser();

    expect(JSON.stringify(await userService.listAllUsers())).not.toContain("scrypt");
    expect(await userService.deleteUser("ana@example.com")).toBe(true);
    expect(await userService.deleteUser("ana@example.com")).toBe(false);
  });
});
