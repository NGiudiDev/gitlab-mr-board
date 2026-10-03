import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TEST_DISPLAY_NAME, TEST_EMAIL, TEST_PASSWORD } from "../../../../test/constants.js";

import { createEmptyServices, createTestServicesWithUser } from "../../../../test/auth.js";
import { readSetCookie, requestApp } from "../../../../test/httpClient.js";
import { createApp } from "../../../app.js";
import { SESSION_COOKIE_NAME } from "./auth.js";

let services;

/**
 * Levanta la app con los servicios del test.
 *
 * Se pasan los tres siempre: si faltara alguno, `createApp` armaría el resto
 * contra la base configurada en lugar de la de memoria.
 */
function appFor() {
  return createApp(services);
}

/** Envía credenciales a `POST /api/auth/login`. */
function login(email, password) {
  return requestApp(appFor(), "/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

beforeEach(async () => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  services = await createTestServicesWithUser();
});

afterEach(async () => {
  await services.authService.close();
  vi.restoreAllMocks();
});

describe("POST /api/auth/register", () => {
  /** Envía un alta a `POST /api/auth/register`. */
  function register(body, app = appFor()) {
    return requestApp(app, "/api/auth/register", { method: "POST", body });
  }

  it("crea una cuenta nueva, deja administrador a quien la abre y abre la sesión", async () => {
    const response = await register({
      email: "zoe@example.com",
      password: TEST_PASSWORD,
      accountName: "Equipo de Zoe",
    });
    const { user } = response.json();

    expect(response.status).toBe(201);
    expect(user).toMatchObject({ email: "zoe@example.com", role: "admin" });
    expect(user.accountId).not.toBe(services.account.id);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).not.toBeNull();
  });

  it("suma a la cuenta del código de invitación, con rol user", async () => {
    const response = await register({
      email: "zoe@example.com",
      password: TEST_PASSWORD,
      inviteCode: services.account.inviteCode,
    });
    const { user } = response.json();

    expect(user.role).toBe("user");
    expect(user.accountId).toBe(services.account.id);
  });

  it("responde 404 cuando el código de invitación no existe", async () => {
    const response = await register({
      email: "zoe@example.com",
      password: TEST_PASSWORD,
      inviteCode: "CODIGOMALO",
    });

    expect(response.status).toBe(404);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it("conserva el nombre visible recibido", async () => {
    const response = await register({
      email: "zoe@example.com",
      password: TEST_PASSWORD,
      displayName: "Zoe Ruiz",
    });

    expect(response.json().user.displayName).toBe("Zoe Ruiz");
  });

  it("responde 409 cuando el email ya está registrado", async () => {
    const response = await register({ email: TEST_EMAIL, password: TEST_PASSWORD });

    expect(response.status).toBe(409);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it("responde 400 cuando el email o la contraseña no cumplen las reglas", async () => {
    const shortName = await register({ email: "an", password: TEST_PASSWORD });
    const shortPassword = await register({ email: "zoe@example.com", password: "corta" });

    expect(shortName.status).toBe(400);
    expect(shortPassword.status).toBe(400);
  });

  it("corta con 429 después de varios registros seguidos del mismo origen", async () => {
    const empty = await createEmptyServices();
    // El límite se cuenta por router, así que la app se reutiliza entre altas.
    const app = createApp(empty);

    for (const email of ["uno@example.com", "dos@example.com", "tres@example.com", "cuatro@example.com", "cinco@example.com"]) {
      expect((await register({ email, password: TEST_PASSWORD }, app)).status).toBe(201);
    }

    expect((await register({ email: "seis@example.com", password: TEST_PASSWORD }, app)).status).toBe(429);
    await empty.authService.close();
  });
});

describe("POST /api/auth/login", () => {
  it("devuelve el usuario y entrega la cookie de sesión", async () => {
    const response = await login(TEST_EMAIL, TEST_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.json().user).toEqual({
      id: expect.any(String),
      accountId: services.account.id,
      email: TEST_EMAIL,
      displayName: TEST_DISPLAY_NAME,
      role: "user",
      gitlabUsername: null,
    });
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).not.toBeNull();
  });

  it("protege la cookie con HttpOnly, SameSite y vencimiento", async () => {
    const response = await login(TEST_EMAIL, TEST_PASSWORD);
    const [cookie] = response.headers["set-cookie"] ?? [];

    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Expires=");
  });

  it("no incluye el token de sesión en el cuerpo de la respuesta", async () => {
    const response = await login(TEST_EMAIL, TEST_PASSWORD);
    const token = readSetCookie(response, SESSION_COOKIE_NAME)?.split("=")[1] ?? "";

    expect(token).not.toBe("");
    expect(response.body).not.toContain(token);
  });

  it("responde 401 y sin cookie ante credenciales incorrectas", async () => {
    const response = await login(TEST_EMAIL, "contrasena-incorrecta");

    expect(response.status).toBe(401);
    expect(response.json().error).toBe("Email o contraseña incorrectos.");
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it("responde 400 cuando faltan las credenciales", async () => {
    const response = await requestApp(appFor(), "/api/auth/login", {
      method: "POST",
      body: {},
    });

    expect(response.status).toBe(400);
    expect(response.json().error).toBe("Ingresá tu email y tu contraseña.");
  });

  it("responde 403 cuando el usuario está deshabilitado", async () => {
    await services.userService.setUserStatus(TEST_EMAIL, "disabled");

    const response = await login(TEST_EMAIL, TEST_PASSWORD);

    expect(response.status).toBe(403);
  });

  it("traduce a 500 un fallo inesperado del servicio", async () => {
    vi.spyOn(services.authService, "login").mockRejectedValue(new Error("la base no responde"));

    const response = await login(TEST_EMAIL, TEST_PASSWORD);

    expect(response.status).toBe(500);
    expect(response.json().error).toBe("Error interno del servidor.");
  });
});

describe("POST /api/auth/password-reset-requests", () => {
  function requestReset(email, app = appFor()) {
    return requestApp(app, "/api/auth/password-reset-requests", {
      method: "POST",
      body: { email },
    });
  }

  it("responde el mismo mensaje para un email registrado y uno inexistente", async () => {
    const registered = await requestReset(TEST_EMAIL);
    const unknown = await requestReset("nadie@example.com");

    expect(registered.status).toBe(202);
    expect(unknown.status).toBe(202);
    expect(registered.json()).toEqual(unknown.json());
    expect(registered.json().message).toContain("Si el email está registrado");
  });

  it("valida el formato del email", async () => {
    const response = await requestReset("email-invalido");

    expect(response.status).toBe(400);
    expect(response.json().error).toBe("Ingresá un email válido.");
  });

  it("limita los pedidos consecutivos del mismo origen", async () => {
    const app = appFor();

    for (let request = 0; request < 5; request++) {
      expect((await requestReset("nadie@example.com", app)).status).toBe(202);
    }

    expect((await requestReset("nadie@example.com", app)).status).toBe(429);
  });
});

describe("POST /api/auth/password-resets", () => {
  it("aplica un token sin exigir una sesión", async () => {
    const resetPassword = vi.spyOn(services.authService, "resetPassword").mockResolvedValue();

    const response = await requestApp(appFor(), "/api/auth/password-resets", {
      method: "POST",
      body: { token: "token", newPassword: "contrasena-nueva" },
    });

    expect(response.status).toBe(204);
    expect(resetPassword).toHaveBeenCalledWith("token", "contrasena-nueva");
  });

  it("rechaza un token ausente o vencido", async () => {
    const response = await requestApp(appFor(), "/api/auth/password-resets", {
      method: "POST",
      body: { token: "invalido", newPassword: "contrasena-nueva" },
    });

    expect(response.status).toBe(400);
    expect(response.json().error).toContain("inválido o venció");
  });
});

describe("GET /api/auth/me", () => {
  it("devuelve el usuario de la sesión vigente", async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_EMAIL, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? "";

    const response = await requestApp(app, "/api/auth/me", { headers: { cookie } });

    expect(response.status).toBe(200);
    expect(response.json().user.email).toBe(TEST_EMAIL);
  });

  it("responde 401 sin cookie", async () => {
    const response = await requestApp(appFor(), "/api/auth/me");

    expect(response.status).toBe(401);
    expect(response.json().error).toBe("Iniciá sesión para ver el tablero.");
  });

  it("responde 401 con una cookie que no corresponde a ninguna sesión", async () => {
    const response = await requestApp(appFor(), "/api/auth/me", {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-inventado` },
    });

    expect(response.status).toBe(401);
  });
});

describe("PUT /api/auth/password", () => {
  /** Cambia la contraseña propia reenviando la cookie de sesión. */
  function changePassword(app, cookie, body) {
    return requestApp(app, "/api/auth/password", { method: "PUT", headers: { cookie }, body });
  }

  it("cambia la contraseña, borra la cookie y cierra la sesión", async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_EMAIL, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? "";

    const response = await changePassword(app, cookie, {
      currentPassword: TEST_PASSWORD,
      newPassword: "contrasena-nueva",
    });
    const afterChange = await requestApp(app, "/api/auth/me", { headers: { cookie } });

    expect(response.status).toBe(204);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBe(`${SESSION_COOKIE_NAME}=`);
    expect(afterChange.status).toBe(401);
  });

  it("responde 403 cuando la contraseña actual no coincide", async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_EMAIL, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? "";

    const response = await changePassword(app, cookie, {
      currentPassword: "incorrecta",
      newPassword: "contrasena-nueva",
    });

    expect(response.status).toBe(403);
    expect(response.json().error).toBe("La contraseña actual no coincide.");
  });

  it("responde 400 cuando la contraseña nueva es demasiado corta", async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_EMAIL, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? "";

    const response = await changePassword(app, cookie, {
      currentPassword: TEST_PASSWORD,
      newPassword: "corta",
    });

    expect(response.status).toBe(400);
  });

  it("responde 401 sin sesión", async () => {
    const response = await requestApp(appFor(), "/api/auth/password", {
      method: "PUT",
      body: { currentPassword: TEST_PASSWORD, newPassword: "contrasena-nueva" },
    });

    expect(response.status).toBe(401);
  });
});

describe("POST /api/auth/logout", () => {
  it("invalida la sesión y borra la cookie", async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_EMAIL, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? "";

    const logout = await requestApp(app, "/api/auth/logout", { method: "POST", headers: { cookie } });
    const afterLogout = await requestApp(app, "/api/auth/me", { headers: { cookie } });

    expect(logout.status).toBe(204);
    expect(readSetCookie(logout, SESSION_COOKIE_NAME)).toBe(`${SESSION_COOKIE_NAME}=`);
    expect(afterLogout.status).toBe(401);
  });

  it("responde 204 aunque no haya sesión activa", async () => {
    const response = await requestApp(appFor(), "/api/auth/logout", { method: "POST" });

    expect(response.status).toBe(204);
  });
});
