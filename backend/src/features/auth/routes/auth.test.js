// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Módulos de constantes.
import { TEST_DISPLAY_NAME, TEST_PASSWORD, TEST_USERNAME } from '../../../../test/constants.js';

// 6. Imports relativos restantes.
import { createEmptyServices, createTestServicesWithUser } from '../../../../test/auth.js';
import { readSetCookie, requestApp } from '../../../../test/httpClient.js';
import { createApp } from '../../../app.js';
import { SESSION_COOKIE_NAME } from './auth.js';

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
function login(username, password) {
  return requestApp(appFor(), '/api/auth/login', {
    method: 'POST',
    body: { username, password },
  });
}

beforeEach(async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  services = await createTestServicesWithUser();
});

afterEach(async () => {
  await services.authService.close();
  vi.restoreAllMocks();
});

describe('POST /api/auth/register', () => {
  /** Envía un alta a `POST /api/auth/register`. */
  function register(body, app = appFor()) {
    return requestApp(app, '/api/auth/register', { method: 'POST', body });
  }

  it('crea una cuenta nueva, deja administrador a quien la abre y abre la sesión', async () => {
    const response = await register({
      username: 'zoe',
      password: TEST_PASSWORD,
      accountName: 'Equipo de Zoe',
    });
    const { user } = response.json();

    expect(response.status).toBe(201);
    expect(user).toMatchObject({ username: 'zoe', role: 'admin' });
    expect(user.accountId).not.toBe(services.account.id);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).not.toBeNull();
  });

  it('suma a la cuenta del código de invitación, con rol user', async () => {
    const response = await register({
      username: 'zoe',
      password: TEST_PASSWORD,
      inviteCode: services.account.inviteCode,
    });
    const { user } = response.json();

    expect(user.role).toBe('user');
    expect(user.accountId).toBe(services.account.id);
  });

  it('responde 404 cuando el código de invitación no existe', async () => {
    const response = await register({
      username: 'zoe',
      password: TEST_PASSWORD,
      inviteCode: 'CODIGOMALO',
    });

    expect(response.status).toBe(404);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it('conserva el nombre visible recibido', async () => {
    const response = await register({
      username: 'zoe',
      password: TEST_PASSWORD,
      displayName: 'Zoe Ruiz',
    });

    expect(response.json().user.displayName).toBe('Zoe Ruiz');
  });

  it('responde 409 cuando el nombre ya está tomado', async () => {
    const response = await register({ username: TEST_USERNAME, password: TEST_PASSWORD });

    expect(response.status).toBe(409);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it('responde 400 cuando el nombre o la contraseña no cumplen las reglas', async () => {
    const shortName = await register({ username: 'an', password: TEST_PASSWORD });
    const shortPassword = await register({ username: 'zoe', password: 'corta' });

    expect(shortName.status).toBe(400);
    expect(shortPassword.status).toBe(400);
  });

  it('corta con 429 después de varios registros seguidos del mismo origen', async () => {
    const empty = await createEmptyServices();
    // El límite se cuenta por router, así que la app se reutiliza entre altas.
    const app = createApp(empty);

    for (const username of ['uno', 'dos', 'tres', 'cuatro', 'cinco']) {
      expect((await register({ username, password: TEST_PASSWORD }, app)).status).toBe(201);
    }

    expect((await register({ username: 'seis', password: TEST_PASSWORD }, app)).status).toBe(429);
    await empty.authService.close();
  });
});

describe('POST /api/auth/login', () => {
  it('devuelve el usuario y entrega la cookie de sesión', async () => {
    const response = await login(TEST_USERNAME, TEST_PASSWORD);

    expect(response.status).toBe(200);
    expect(response.json().user).toEqual({
      id: expect.any(String),
      accountId: services.account.id,
      username: TEST_USERNAME,
      displayName: TEST_DISPLAY_NAME,
      role: 'user',
      gitlabUsername: null,
    });
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).not.toBeNull();
  });

  it('protege la cookie con HttpOnly, SameSite y vencimiento', async () => {
    const response = await login(TEST_USERNAME, TEST_PASSWORD);
    const [cookie] = response.headers['set-cookie'] ?? [];

    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Path=/');
    expect(cookie).toContain('Expires=');
  });

  it('no incluye el token de sesión en el cuerpo de la respuesta', async () => {
    const response = await login(TEST_USERNAME, TEST_PASSWORD);
    const token = readSetCookie(response, SESSION_COOKIE_NAME)?.split('=')[1] ?? '';

    expect(token).not.toBe('');
    expect(response.body).not.toContain(token);
  });

  it('responde 401 y sin cookie ante credenciales incorrectas', async () => {
    const response = await login(TEST_USERNAME, 'contrasena-incorrecta');

    expect(response.status).toBe(401);
    expect(response.json().error).toBe('Usuario o contraseña incorrectos.');
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBeNull();
  });

  it('responde 400 cuando faltan las credenciales', async () => {
    const response = await requestApp(appFor(), '/api/auth/login', {
      method: 'POST',
      body: {},
    });

    expect(response.status).toBe(400);
    expect(response.json().error).toBe('Ingresá tu usuario y tu contraseña.');
  });

  it('responde 403 cuando el usuario está deshabilitado', async () => {
    await services.authService.setUserStatus(TEST_USERNAME, 'disabled');

    const response = await login(TEST_USERNAME, TEST_PASSWORD);

    expect(response.status).toBe(403);
  });

  it('traduce a 500 un fallo inesperado del servicio', async () => {
    vi.spyOn(services.authService, 'login').mockRejectedValue(new Error('la base no responde'));

    const response = await login(TEST_USERNAME, TEST_PASSWORD);

    expect(response.status).toBe(500);
    expect(response.json().error).toBe('Error interno del servidor.');
  });
});

describe('GET /api/auth/me', () => {
  it('devuelve el usuario de la sesión vigente', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const response = await requestApp(app, '/api/auth/me', { headers: { cookie } });

    expect(response.status).toBe(200);
    expect(response.json().user.username).toBe(TEST_USERNAME);
  });

  it('responde 401 sin cookie', async () => {
    const response = await requestApp(appFor(), '/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.json().error).toBe('Iniciá sesión para ver el tablero.');
  });

  it('responde 401 con una cookie que no corresponde a ninguna sesión', async () => {
    const response = await requestApp(appFor(), '/api/auth/me', {
      headers: { cookie: `${SESSION_COOKIE_NAME}=token-inventado` },
    });

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/auth/gitlab-username', () => {
  /** Guarda el nickname propio reenviando la cookie de sesión. */
  function saveGitlabUsername(app, cookie, gitlabUsername) {
    return requestApp(app, '/api/auth/gitlab-username', {
      method: 'PUT',
      headers: { cookie },
      body: { gitlabUsername },
    });
  }

  it('guarda el nickname y devuelve la identidad actualizada', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const response = await saveGitlabUsername(app, cookie, 'ana-gitlab');
    const session = await requestApp(app, '/api/auth/me', { headers: { cookie } });

    expect(response.status).toBe(200);
    expect(response.json().user.gitlabUsername).toBe('ana-gitlab');
    // La sesión sigue abierta: el nickname no es una credencial.
    expect(session.json().user.gitlabUsername).toBe('ana-gitlab');
  });

  it('responde 400 cuando el nickname no es válido', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    expect((await saveGitlabUsername(app, cookie, '')).status).toBe(400);
    expect((await saveGitlabUsername(app, cookie, '-ana')).status).toBe(400);
  });

  it('responde 401 sin sesión', async () => {
    const response = await requestApp(appFor(), '/api/auth/gitlab-username', {
      method: 'PUT',
      body: { gitlabUsername: 'ana-gitlab' },
    });

    expect(response.status).toBe(401);
  });
});

describe('PUT /api/auth/password', () => {
  /** Cambia la contraseña propia reenviando la cookie de sesión. */
  function changePassword(app, cookie, body) {
    return requestApp(app, '/api/auth/password', { method: 'PUT', headers: { cookie }, body });
  }

  it('cambia la contraseña, borra la cookie y cierra la sesión', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const response = await changePassword(app, cookie, {
      currentPassword: TEST_PASSWORD,
      newPassword: 'contrasena-nueva',
    });
    const afterChange = await requestApp(app, '/api/auth/me', { headers: { cookie } });

    expect(response.status).toBe(204);
    expect(readSetCookie(response, SESSION_COOKIE_NAME)).toBe(`${SESSION_COOKIE_NAME}=`);
    expect(afterChange.status).toBe(401);
  });

  it('responde 403 cuando la contraseña actual no coincide', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const response = await changePassword(app, cookie, {
      currentPassword: 'incorrecta',
      newPassword: 'contrasena-nueva',
    });

    expect(response.status).toBe(403);
    expect(response.json().error).toBe('La contraseña actual no coincide.');
  });

  it('responde 400 cuando la contraseña nueva es demasiado corta', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const response = await changePassword(app, cookie, {
      currentPassword: TEST_PASSWORD,
      newPassword: 'corta',
    });

    expect(response.status).toBe(400);
  });

  it('responde 401 sin sesión', async () => {
    const response = await requestApp(appFor(), '/api/auth/password', {
      method: 'PUT',
      body: { currentPassword: TEST_PASSWORD, newPassword: 'contrasena-nueva' },
    });

    expect(response.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('invalida la sesión y borra la cookie', async () => {
    const app = appFor();
    const cookie = readSetCookie(await login(TEST_USERNAME, TEST_PASSWORD), SESSION_COOKIE_NAME) ?? '';

    const logout = await requestApp(app, '/api/auth/logout', { method: 'POST', headers: { cookie } });
    const afterLogout = await requestApp(app, '/api/auth/me', { headers: { cookie } });

    expect(logout.status).toBe(204);
    expect(readSetCookie(logout, SESSION_COOKIE_NAME)).toBe(`${SESSION_COOKIE_NAME}=`);
    expect(afterLogout.status).toBe(401);
  });

  it('responde 204 aunque no haya sesión activa', async () => {
    const response = await requestApp(appFor(), '/api/auth/logout', { method: 'POST' });

    expect(response.status).toBe(204);
  });
});
