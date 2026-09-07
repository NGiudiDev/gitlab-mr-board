// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthenticatedTestApp, HttpTestResponse } from '../../../../test/types.js';
import type { UserRole, UserSummary } from '../types.js';

// 5. Módulos de constantes.
import { TEST_PASSWORD, TEST_USERNAME } from '../../../../test/constants.js';

// 7. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { requestApp } from '../../../../test/httpClient.js';

interface UsersResponseBody {
  users: UserSummary[];
}

interface UserResponseBody {
  user: UserSummary;
}

interface ErrorResponseBody {
  error: string;
}

let session: AuthenticatedTestApp;

/**
 * Levanta la app con una sesión del rol indicado y devuelve un cliente que ya
 * reenvía la cookie.
 */
async function createClient(role: UserRole) {
  session = await createAuthenticatedApp({}, role);
  const { app, cookie } = session;

  return {
    app,
    cookie,
    request: (path: string, options: Parameters<typeof requestApp>[2] = {}): Promise<HttpTestResponse> =>
      requestApp(app, path, { ...options, headers: { cookie, ...options.headers } }),
  };
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(async () => {
  await session?.authService.close();
  vi.restoreAllMocks();
});

describe('permisos de /api/users', () => {
  it('responde 401 sin sesión', async () => {
    const { app } = await createClient('admin');

    const response = await requestApp(app, '/api/users');

    expect(response.status).toBe(401);
  });

  it('responde 403 a una sesión sin rol admin', async () => {
    const { request } = await createClient('user');

    const response = await request('/api/users');

    expect(response.status).toBe(403);
    expect(response.json<ErrorResponseBody>().error).toBe('Necesitás permisos de administrador.');
  });

  it('no deja crear usuarios a quien no es admin', async () => {
    const { request } = await createClient('user');

    const response = await request('/api/users', {
      method: 'POST',
      body: { username: 'zoe', password: TEST_PASSWORD },
    });

    expect(response.status).toBe(403);
  });
});

describe('GET /api/users', () => {
  it('lista los usuarios con su rol y estado, sin credenciales', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users');
    const { users } = response.json<UsersResponseBody>();

    expect(response.status).toBe(200);
    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({ username: TEST_USERNAME, role: 'admin', status: 'active' });
    expect(response.body).not.toContain('scrypt');
  });
});

describe('POST /api/users', () => {
  it('crea un usuario con el rol indicado', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users', {
      method: 'POST',
      body: { username: 'zoe', password: TEST_PASSWORD, displayName: 'Zoe Ruiz', role: 'admin' },
    });

    expect(response.status).toBe(201);
    expect(response.json<UserResponseBody>().user).toMatchObject({
      username: 'zoe',
      displayName: 'Zoe Ruiz',
      role: 'admin',
    });
  });

  it('usa el rol user ante cualquier valor desconocido', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users', {
      method: 'POST',
      body: { username: 'zoe', password: TEST_PASSWORD, role: 'root' },
    });

    expect(response.json<UserResponseBody>().user.role).toBe('user');
  });

  it('responde 409 cuando el nombre ya está tomado', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users', {
      method: 'POST',
      body: { username: TEST_USERNAME, password: TEST_PASSWORD },
    });

    expect(response.status).toBe(409);
  });

  it('responde 400 cuando los datos no cumplen las reglas', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users', {
      method: 'POST',
      body: { username: 'zoe', password: 'corta' },
    });

    expect(response.status).toBe(400);
  });
});

describe('PATCH /api/users/:username/status', () => {
  it('deshabilita a otro usuario y le cierra las sesiones', async () => {
    const { request } = await createClient('admin');
    await request('/api/users', { method: 'POST', body: { username: 'zoe', password: TEST_PASSWORD } });
    const { token } = await session.authService.login({ username: 'zoe', password: TEST_PASSWORD });

    const response = await request('/api/users/zoe/status', {
      method: 'PATCH',
      body: { status: 'disabled' },
    });

    expect(response.status).toBe(200);
    expect(response.json<UserResponseBody>().user.status).toBe('disabled');
    expect(await session.authService.authenticate(token)).toBeNull();
  });

  it('vuelve a habilitar a un usuario', async () => {
    const { request } = await createClient('admin');
    await request('/api/users', { method: 'POST', body: { username: 'zoe', password: TEST_PASSWORD } });
    await request('/api/users/zoe/status', { method: 'PATCH', body: { status: 'disabled' } });

    const response = await request('/api/users/zoe/status', {
      method: 'PATCH',
      body: { status: 'active' },
    });

    expect(response.json<UserResponseBody>().user.status).toBe('active');
  });

  it('impide cambiar el estado de la propia cuenta', async () => {
    const { request } = await createClient('admin');

    const response = await request(`/api/users/${TEST_USERNAME}/status`, {
      method: 'PATCH',
      body: { status: 'disabled' },
    });

    expect(response.status).toBe(409);
    expect(response.json<ErrorResponseBody>().error).toBe('No podés cambiar el estado de tu propio usuario.');
  });

  it('responde 400 ante un estado fuera del contrato', async () => {
    const { request } = await createClient('admin');
    await request('/api/users', { method: 'POST', body: { username: 'zoe', password: TEST_PASSWORD } });

    const response = await request('/api/users/zoe/status', {
      method: 'PATCH',
      body: { status: 'vacaciones' },
    });

    expect(response.status).toBe(400);
  });

  it('responde 404 cuando el usuario no existe', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users/fantasma/status', {
      method: 'PATCH',
      body: { status: 'disabled' },
    });

    expect(response.status).toBe(404);
  });
});

describe('PUT /api/users/:username/password', () => {
  it('restablece la contraseña y cierra las sesiones de esa persona', async () => {
    const { request } = await createClient('admin');
    await request('/api/users', { method: 'POST', body: { username: 'zoe', password: TEST_PASSWORD } });
    const { token } = await session.authService.login({ username: 'zoe', password: TEST_PASSWORD });

    const response = await request('/api/users/zoe/password', {
      method: 'PUT',
      body: { password: 'contrasena-restablecida' },
    });

    expect(response.status).toBe(204);
    expect(await session.authService.authenticate(token)).toBeNull();
    await expect(session.authService.login({ username: 'zoe', password: 'contrasena-restablecida' }))
      .resolves.toBeDefined();
  });

  it('responde 400 cuando la contraseña nueva es demasiado corta', async () => {
    const { request } = await createClient('admin');
    await request('/api/users', { method: 'POST', body: { username: 'zoe', password: TEST_PASSWORD } });

    const response = await request('/api/users/zoe/password', {
      method: 'PUT',
      body: { password: 'corta' },
    });

    expect(response.status).toBe(400);
  });

  it('responde 404 cuando el usuario no existe', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/users/fantasma/password', {
      method: 'PUT',
      body: { password: 'contrasena-restablecida' },
    });

    expect(response.status).toBe(404);
  });
});
