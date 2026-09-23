import { beforeEach, describe, expect, it } from "vitest";

import { createTestAccountService, createTestDatabase } from "../../../../test/auth.js";
import { createUserRepository } from "../../users/services/userRepository.js";
import { createAuthRepository } from "./authRepository.js";

let repository;
let userId;

beforeEach(async () => {
  const database = await createTestDatabase();
  const account = await createTestAccountService(database).create("Equipo");
  const users = createUserRepository(database);
  userId = "usuario-1";
  await users.insertUser({
    id: userId,
    accountId: account.id,
    email: "ana@example.com",
    displayName: "Ana",
    passwordHash: "scrypt:hash",
    role: "user",
    status: "active",
    gitlabUsername: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    lastLoginAt: null,
  });
  repository = createAuthRepository(database);
});

describe("repositorio de sesiones", () => {
  it("guarda, recupera y borra sesiones", async () => {
    const session = {
      id: "sesion-1",
      userId,
      tokenHash: "hash",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-08T00:00:00.000Z",
    };
    await repository.insertSession(session);

    expect(await repository.findSessionByTokenHash("hash")).toEqual(session);
    await repository.deleteSessionsOfUser(userId);
    expect(await repository.findSessionByTokenHash("hash")).toBeNull();
  });

  it("borra sólo las sesiones vencidas", async () => {
    await repository.insertSession({
      id: "vencida",
      userId,
      tokenHash: "vieja",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-02T00:00:00.000Z",
    });
    await repository.insertSession({
      id: "vigente",
      userId,
      tokenHash: "nueva",
      createdAt: "2026-01-01T00:00:00.000Z",
      expiresAt: "2026-01-04T00:00:00.000Z",
    });

    expect(await repository.deleteExpiredSessions("2026-01-03T00:00:00.000Z")).toBe(1);
    expect(await repository.findSessionByTokenHash("vieja")).toBeNull();
    expect(await repository.findSessionByTokenHash("nueva")).not.toBeNull();
  });
});
