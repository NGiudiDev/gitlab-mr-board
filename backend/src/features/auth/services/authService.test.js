import { afterEach, describe, expect, it } from "vitest";

import { createTestDatabase } from "../../../../test/database.js";
import { createAccountRepository } from "../../accounts/services/accountRepository.js";
import { createAccountService } from "../../accounts/services/accountService.js";
import { createUserRepository } from "../../users/services/userRepository.js";
import { createUserService } from "../../users/services/userService.js";
import { createAuthRepository } from "./authRepository.js";
import { createAuthService } from "./authService.js";

const PASSWORD = "contrasena-de-prueba";
const START_DATE = new Date("2026-09-01T10:00:00.000Z");
const openServices = [];

async function createContext(sessionDurationDays) {
  const database = await createTestDatabase();
  const authRepository = createAuthRepository(database);
  let currentTime = START_DATE.getTime();
  const accountService = createAccountService({
    repository: createAccountRepository(database),
    now: () => new Date(currentTime),
  });
  const userRepository = createUserRepository(database);
  const userService = createUserService({
    repository: userRepository,
    now: () => new Date(currentTime),
    invalidateSessions: authRepository.deleteSessionsOfUser,
  });
  const authService = createAuthService({
    repository: authRepository,
    accountService,
    userService,
    now: () => new Date(currentTime),
    ...(sessionDurationDays === undefined ? {} : { sessionDurationDays }),
  });
  const account = await accountService.create("Equipo de prueba");
  openServices.push(authService);

  return {
    accountId: account.id,
    accountService,
    advance: (milliseconds) => { currentTime += milliseconds; },
    authRepository,
    authService,
    inviteCode: account.inviteCode,
    userRepository,
    userService,
  };
}

async function createContextWithUser(sessionDurationDays) {
  const context = await createContext(sessionDurationDays);
  await context.userService.createUser({
    accountId: context.accountId,
    email: "ana@example.com",
    password: PASSWORD,
    displayName: "Ana Prueba",
  });
  return context;
}

afterEach(async () => {
  while (openServices.length > 0) await openServices.pop()?.close();
});

describe("register", () => {
  it("crea una cuenta nueva, deja administrador y abre la sesión", async () => {
    const { accountId, authService } = await createContextWithUser();

    const result = await authService.register({
      email: "zoe@example.com",
      password: PASSWORD,
      accountName: "Equipo de Zoe",
    });

    expect(result.user).toMatchObject({ email: "zoe@example.com", role: "admin" });
    expect(result.user.accountId).not.toBe(accountId);
    expect(await authService.authenticate(result.token)).toMatchObject({ email: "zoe@example.com" });
  });

  it("suma a una cuenta por código sin permitir elegir rol", async () => {
    const { accountId, authService, inviteCode } = await createContextWithUser();

    const result = await authService.register({
      email: "zoe@example.com",
      password: PASSWORD,
      inviteCode: ` ${inviteCode.toLowerCase()} `,
      role: "admin",
    });

    expect(result.user).toMatchObject({ accountId, role: "user" });
  });

  it("valida el usuario antes de crear la cuenta", async () => {
    const { accountService, authService } = await createContextWithUser();

    await expect(authService.register({ email: "ana@example.com", password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
    await expect(authService.register({ email: "zoe@example.com", password: "corta" }))
      .rejects.toMatchObject({ status: 400 });
    expect(await accountService.list()).toHaveLength(1);
  });
});

describe("login", () => {
  it("devuelve identidad, token y vencimiento, y registra el ingreso", async () => {
    const { authService, userRepository } = await createContextWithUser(7);

    const result = await authService.login({ email: " ANA@EXAMPLE.COM ", password: PASSWORD });

    expect(result.user.email).toBe("ana@example.com");
    expect(result.token).toHaveLength(43);
    expect(result.expiresAt.toISOString()).toBe("2026-09-08T10:00:00.000Z");
    expect((await userRepository.findUserByEmail("ana@example.com"))?.lastLoginAt)
      .toBe(START_DATE.toISOString());
  });

  it("no guarda el token en claro", async () => {
    const { authRepository, authService } = await createContextWithUser();
    const { token } = await authService.login({ email: "ana@example.com", password: PASSWORD });

    expect(await authRepository.findSessionByTokenHash(token)).toBeNull();
    expect(await authService.authenticate(token)).not.toBeNull();
  });

  it("usa el mismo error para una contraseña incorrecta y un email inexistente", async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.login({ email: "ana@example.com", password: "incorrecta" }))
      .rejects.toThrow("Email o contraseña incorrectos.");
    await expect(authService.login({ email: "zoe@example.com", password: PASSWORD }))
      .rejects.toThrow("Email o contraseña incorrectos.");
  });

  it("bloquea temporalmente después de cinco intentos fallidos", async () => {
    const { advance, authService } = await createContextWithUser();
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(authService.login({ email: "ana@example.com", password: "incorrecta" }))
        .rejects.toMatchObject({ status: 401 });
    }

    await expect(authService.login({ email: "ana@example.com", password: PASSWORD }))
      .rejects.toMatchObject({ status: 429 });
    advance(15 * 60 * 1000);
    await expect(authService.login({ email: "ana@example.com", password: PASSWORD }))
      .resolves.toBeDefined();
  });

  it("rechaza un usuario deshabilitado", async () => {
    const { authService, userService } = await createContextWithUser();
    await userService.setUserStatus("ana@example.com", "disabled");

    await expect(authService.login({ email: "ana@example.com", password: PASSWORD }))
      .rejects.toMatchObject({ status: 403 });
  });
});

describe("sesiones", () => {
  it("vence e invalida una sesión", async () => {
    const { advance, authService } = await createContextWithUser(1);
    const { token } = await authService.login({ email: "ana@example.com", password: PASSWORD });
    advance(24 * 60 * 60 * 1000 + 1);

    expect(await authService.authenticate(token)).toBeNull();
  });

  it("cierra la sesión indicada sin fallar ante un token ausente", async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ email: "ana@example.com", password: PASSWORD });

    await authService.logout(token);
    expect(await authService.authenticate(token)).toBeNull();
    await expect(authService.logout(undefined)).resolves.toBeUndefined();
  });
});

describe("contraseñas", () => {
  it("cambia la propia contraseña, exige la actual y cierra las sesiones", async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ email: "ana@example.com", password: PASSWORD });

    await expect(authService.changeOwnPassword("ana@example.com", "incorrecta", "contrasena-nueva"))
      .rejects.toMatchObject({ status: 403 });
    await authService.changeOwnPassword("ana@example.com", PASSWORD, "contrasena-nueva");

    expect(await authService.authenticate(token)).toBeNull();
    await expect(authService.login({ email: "ana@example.com", password: "contrasena-nueva" }))
      .resolves.toBeDefined();
  });

  it("permite restablecer una contraseña desde la línea de comandos", async () => {
    const { authService } = await createContextWithUser();

    await authService.changePassword("ANA@EXAMPLE.COM", "contrasena-nueva");

    await expect(authService.login({ email: "ana@example.com", password: "contrasena-nueva" }))
      .resolves.toBeDefined();
    await expect(authService.changePassword("zoe@example.com", "contrasena-nueva"))
      .rejects.toMatchObject({ status: 404 });
    await expect(authService.changePassword("ana@example.com", "corta"))
      .rejects.toMatchObject({ status: 400 });
  });
});
