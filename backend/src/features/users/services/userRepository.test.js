import { beforeEach, describe, expect, it } from "vitest";

import { createTestAccountService, createTestDatabase } from "../../../../test/auth.js";
import { createUserRepository } from "./userRepository.js";

let database;
let repository;
let accountId;

function buildUser(overrides = {}) {
  return {
    id: "usuario-1",
    accountId,
    email: "ana@example.com",
    displayName: "Ana",
    passwordHash: "scrypt:hash",
    role: "user",
    status: "active",
    gitlabUsername: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
    ...overrides,
  };
}

beforeEach(async () => {
  database = await createTestDatabase();
  repository = createUserRepository(database);
  accountId = (await createTestAccountService(database).create("Equipo")).id;
});

describe("repositorio de usuarios", () => {
  it("guarda y recupera un usuario por id y email", async () => {
    const user = buildUser();
    await repository.insertUser(user);

    expect(await repository.findUserById(user.id)).toEqual(user);
    expect(await repository.findUserByEmail(user.email)).toEqual(user);
  });

  it("lista por cuenta y también todos los usuarios", async () => {
    const otherAccount = await createTestAccountService(database).create("Otro equipo");
    await repository.insertUser(buildUser());
    await repository.insertUser(buildUser({
      id: "usuario-2",
      accountId: otherAccount.id,
      email: "beto@example.com",
    }));

    expect((await repository.listUsersOfAccount(accountId)).map(({ email }) => email))
      .toEqual(["ana@example.com"]);
    expect((await repository.listAllUsers()).map(({ email }) => email))
      .toEqual(["ana@example.com", "beto@example.com"]);
  });

  it("actualiza los campos administrables", async () => {
    await repository.insertUser(buildUser());
    await repository.updateLastLogin("usuario-1", "2026-02-01T00:00:00.000Z");
    await repository.updatePasswordHash("usuario-1", "scrypt:nuevo");
    await repository.updateProfile("usuario-1", "anita@example.com", "Anita");
    await repository.updateStatus("usuario-1", "disabled");
    await repository.updateGitlabUsername("usuario-1", "anita-gitlab");

    expect(await repository.findUserById("usuario-1")).toMatchObject({
      email: "anita@example.com",
      displayName: "Anita",
      passwordHash: "scrypt:nuevo",
      status: "disabled",
      gitlabUsername: "anita-gitlab",
      lastLoginAt: "2026-02-01T00:00:00.000Z",
    });
  });

  it("borra el usuario indicado", async () => {
    await repository.insertUser(buildUser());

    expect(await repository.deleteUser("usuario-1")).toBe(true);
    expect(await repository.deleteUser("usuario-1")).toBe(false);
  });
});
