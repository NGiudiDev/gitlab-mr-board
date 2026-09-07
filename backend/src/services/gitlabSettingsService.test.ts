// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthService, GitLabSettingsService } from '../types.js';
import type { DatabaseSync } from 'node:sqlite';

// 5. Módulos de constantes.
import { TEST_PASSWORD, TEST_TOKEN, TEST_USERNAME } from '../../test/constants.js';

// 6. Utilidades.
import { createSecretCipher } from '../utils/encryption.js';

// 7. Imports relativos restantes.
import { createTestDatabase, createTestGitLabSettingsService } from '../../test/auth.js';
import { createAuthRepository } from './authRepository.js';
import { createAuthService } from './authService.js';
import { createGitLabSettingsRepository } from './gitlabSettingsRepository.js';
import { createGitLabSettingsService } from './gitlabSettingsService.js';

const OTHER_KEY = 'otra-clave-de-cifrado-para-los-test';
const MAX_PROJECT_IDS = 50;

let database: DatabaseSync;
let authService: AuthService;
let settingsService: GitLabSettingsService;
let userId: string;

/** Arma un servicio sobre la misma base pero con otra clave de cifrado. */
function createServiceWithOtherKey(): GitLabSettingsService {
  return createGitLabSettingsService({
    repository: createGitLabSettingsRepository(database),
    cipher: createSecretCipher(OTHER_KEY),
  });
}

beforeEach(async () => {
  database = createTestDatabase();
  authService = createAuthService({ repository: createAuthRepository(database) });
  settingsService = createTestGitLabSettingsService(database);

  const user = await authService.createUser({ username: TEST_USERNAME, password: TEST_PASSWORD });
  userId = user.id;
});

afterEach(() => {
  vi.restoreAllMocks();
  database.close();
});

describe('getSummary', () => {
  it('devuelve null si la persona no configuró nada', () => {
    expect(settingsService.getSummary(userId)).toBeNull();
  });

  it('describe el token con sus últimos caracteres, sin revelarlo', () => {
    const summary = settingsService.save(userId, {
      projectIds: ['101', '202'],
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202']);
    expect(summary.tokenHint).toBe(TEST_TOKEN.slice(-4));
    expect(JSON.stringify(summary)).not.toContain(TEST_TOKEN);
  });
});

describe('save', () => {
  it('acepta los IDs escritos como texto separado por comas', () => {
    const summary = settingsService.save(userId, {
      projectIds: ' 101 , 202 ,,303 ',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202', '303']);
  });

  it('descarta los IDs repetidos', () => {
    const summary = settingsService.save(userId, {
      projectIds: '101,101,202',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202']);
  });

  it('rechaza una lista vacía', () => {
    expect(() => settingsService.save(userId, { projectIds: '  ', accessToken: TEST_TOKEN }))
      .toThrow(/al menos un ID/);
  });

  it('rechaza un ID que no es numérico', () => {
    expect(() => settingsService.save(userId, {
      projectIds: 'grupo/proyecto',
      accessToken: TEST_TOKEN,
    })).toThrow(/sólo números/);
  });

  it('rechaza más proyectos de los permitidos', () => {
    const projectIds = Array.from({ length: MAX_PROJECT_IDS + 1 }, (_, index) => String(index + 1));

    expect(() => settingsService.save(userId, { projectIds, accessToken: TEST_TOKEN }))
      .toThrow(new RegExp(`más de ${MAX_PROJECT_IDS} proyectos`));
  });

  it('exige el token en la primera configuración', () => {
    expect(() => settingsService.save(userId, { projectIds: '101' }))
      .toThrow(/access token/);
  });

  it('rechaza un token demasiado corto', () => {
    expect(() => settingsService.save(userId, { projectIds: '101', accessToken: 'glpat-corto' }))
      .toThrow(/al menos 20 caracteres/);
  });

  it('conserva el token guardado cuando sólo cambian los proyectos', () => {
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });
    settingsService.save(userId, { projectIds: '202' });

    expect(settingsService.getCredentials(userId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['202'],
    });
  });

  it('guarda el token cifrado y no en claro', () => {
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    const row = database
      .prepare('SELECT encrypted_access_token FROM gitlab_settings WHERE user_id = ?')
      .get(userId) as unknown as { encrypted_access_token: string };

    expect(row.encrypted_access_token).not.toContain(TEST_TOKEN);
    expect(row.encrypted_access_token.startsWith('v1.')).toBe(true);
  });

  it('reemplaza la configuración anterior en lugar de duplicarla', () => {
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });
    settingsService.save(userId, { projectIds: '202', accessToken: TEST_TOKEN });

    const row = database
      .prepare('SELECT COUNT(*) AS total FROM gitlab_settings WHERE user_id = ?')
      .get(userId) as unknown as { total: number };

    expect(Number(row.total)).toBe(1);
  });
});

describe('getCredentials', () => {
  it('devuelve el token descifrado para consultar GitLab', () => {
    settingsService.save(userId, { projectIds: '101,202', accessToken: TEST_TOKEN });

    expect(settingsService.getCredentials(userId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['101', '202'],
    });
  });

  it('devuelve null si la persona no configuró nada', () => {
    expect(settingsService.getCredentials(userId)).toBeNull();
  });

  it('devuelve null si la clave de cifrado ya no es la que cifró el token', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(createServiceWithOtherKey().getCredentials(userId)).toBeNull();
  });

  it('no filtra el token en el log del fallo de descifrado', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    createServiceWithOtherKey().getCredentials(userId);

    expect(logged.mock.calls.flat().map(String).join(' ')).not.toContain(TEST_TOKEN);
  });
});

describe('remove', () => {
  it('borra la configuración de la persona', () => {
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    settingsService.remove(userId);

    expect(settingsService.getSummary(userId)).toBeNull();
  });

  it('no falla si no había nada configurado', () => {
    expect(() => settingsService.remove(userId)).not.toThrow();
  });
});

describe('aislamiento entre personas', () => {
  it('cada persona sólo ve su propia configuración', async () => {
    const otherUser = await authService.createUser({ username: 'bruno', password: TEST_PASSWORD });
    settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(settingsService.getSummary(otherUser.id)).toBeNull();
  });
});
