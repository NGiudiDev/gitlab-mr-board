// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { AuthenticatedTestApp, HttpTestResponse } from '../../../../test/types.js';
import type { UserRole } from '../../auth/types.js';
// 4. Imports exclusivos de tipos de TypeScript.
import type { AccountSummary } from '../types.js';

// 5. Módulos de constantes.
import { TEST_ACCOUNT_NAME } from '../../../../test/constants.js';

// 7. Imports relativos restantes.
import { createAuthenticatedApp } from '../../../../test/auth.js';
import { requestApp } from '../../../../test/httpClient.js';

interface AccountResponseBody {
  account: AccountSummary;
}

interface ErrorResponseBody {
  error: string;
}

let session: AuthenticatedTestApp;

/** Levanta la app con una sesión del rol indicado y su cliente con cookie. */
async function createClient(role: UserRole) {
  session = await createAuthenticatedApp({}, role);
  const { app, cookie } = session;

  return {
    app,
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

describe('GET /api/account', () => {
  it('devuelve la cuenta de la sesión con su código para un admin', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/account');

    expect(response.status).toBe(200);
    expect(response.json<AccountResponseBody>().account).toEqual({
      id: session.account.id,
      name: TEST_ACCOUNT_NAME,
      createdAt: expect.any(String),
      memberCount: 1,
      inviteCode: session.account.inviteCode,
    });
  });

  it('oculta el código de invitación a quien no administra', async () => {
    const { request } = await createClient('user');

    const { account } = (await request('/api/account')).json<AccountResponseBody>();

    expect(account.name).toBe(TEST_ACCOUNT_NAME);
    expect(account.inviteCode).toBeNull();
  });

  it('responde 401 sin sesión', async () => {
    const { app } = await createClient('admin');

    expect((await requestApp(app, '/api/account')).status).toBe(401);
  });
});

describe('PATCH /api/account', () => {
  it('cambia el nombre de la cuenta', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/account', { method: 'PATCH', body: { name: 'Plataforma' } });

    expect(response.status).toBe(200);
    expect(response.json<AccountResponseBody>().account.name).toBe('Plataforma');
    expect((await request('/api/account')).json<AccountResponseBody>().account.name).toBe('Plataforma');
  });

  it('responde 400 ante un nombre demasiado largo', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/account', {
      method: 'PATCH',
      body: { name: 'x'.repeat(81) },
    });

    expect(response.status).toBe(400);
  });

  it('responde 403 a quien no administra', async () => {
    const { request } = await createClient('user');

    const response = await request('/api/account', { method: 'PATCH', body: { name: 'Plataforma' } });

    expect(response.status).toBe(403);
    expect(response.json<ErrorResponseBody>().error).toBe('Necesitás permisos de administrador.');
  });
});

describe('POST /api/account/invite-code', () => {
  it('renueva el código y deja sin efecto el anterior', async () => {
    const { request } = await createClient('admin');

    const response = await request('/api/account/invite-code', { method: 'POST' });
    const { account } = response.json<AccountResponseBody>();

    expect(response.status).toBe(200);
    expect(account.inviteCode).not.toBe(session.account.inviteCode);
    expect(account.inviteCode).toMatch(/^[A-Z2-9]{10}$/);
  });

  it('responde 403 a quien no administra', async () => {
    const { request } = await createClient('user');

    expect((await request('/api/account/invite-code', { method: 'POST' })).status).toBe(403);
  });

  it('responde 401 sin sesión', async () => {
    const { app } = await createClient('admin');

    expect((await requestApp(app, '/api/account/invite-code', { method: 'POST' })).status).toBe(401);
  });
});
