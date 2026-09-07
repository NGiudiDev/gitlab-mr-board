// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from '../../../shared/types.js';
import type { AuthService } from '../../auth/types.js';
import type { GitLabSettingsService } from '../types.js';

// 5. Módulos de constantes.
import { TEST_PASSWORD, TEST_TOKEN, TEST_USERNAME } from '../../../../test/constants.js';

// 6. Utilidades.
import { createSecretCipher } from '../utils/encryption.js';

// 7. Imports relativos restantes.
import { createTestGitLabSettingsService } from '../../../../test/auth.js';
import { createTestDatabase } from '../../../../test/database.js';
import { createAuthRepository } from '../../auth/services/authRepository.js';
import { createAuthService } from '../../auth/services/authService.js';
import { createGitLabSettingsRepository } from './gitlabSettingsRepository.js';
import { createGitLabSettingsService } from './gitlabSettingsService.js';

const OTHER_KEY = 'otra-clave-de-cifrado-para-los-test';
const MAX_PROJECT_IDS = 50;

let database: Database;
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
  database = await createTestDatabase();
  authService = createAuthService({ repository: createAuthRepository(database) });
  settingsService = createTestGitLabSettingsService(database);

  const user = await authService.createUser({ username: TEST_USERNAME, password: TEST_PASSWORD });
  userId = user.id;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await database.close();
});

describe('getSummary', () => {
  it('devuelve null si la persona no configuró nada', async () => {
    expect(await settingsService.getSummary(userId)).toBeNull();
  });

  it('describe el token con sus últimos caracteres, sin revelarlo', async () => {
    const summary = await settingsService.save(userId, {
      projectIds: ['101', '202'],
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202']);
    expect(summary.tokenHint).toBe(TEST_TOKEN.slice(-4));
    expect(JSON.stringify(summary)).not.toContain(TEST_TOKEN);
  });
});

describe('save', () => {
  it('acepta los IDs escritos como texto separado por comas', async () => {
    const summary = await settingsService.save(userId, {
      projectIds: ' 101 , 202 ,,303 ',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202', '303']);
  });

  it('descarta los IDs repetidos', async () => {
    const summary = await settingsService.save(userId, {
      projectIds: '101,101,202',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202']);
  });

  it('rechaza una lista vacía', async () => {
    await expect(settingsService.save(userId, { projectIds: '  ', accessToken: TEST_TOKEN }))
      .rejects.toThrow(/al menos un ID/);
  });

  it('rechaza un ID que no es numérico', async () => {
    await expect(settingsService.save(userId, {
      projectIds: 'grupo/proyecto',
      accessToken: TEST_TOKEN,
    })).rejects.toThrow(/sólo números/);
  });

  it('rechaza más proyectos de los permitidos', async () => {
    const projectIds = Array.from({ length: MAX_PROJECT_IDS + 1 }, (_, index) => String(index + 1));

    await expect(settingsService.save(userId, { projectIds, accessToken: TEST_TOKEN }))
      .rejects.toThrow(new RegExp(`más de ${MAX_PROJECT_IDS} proyectos`));
  });

  it('exige el token en la primera configuración', async () => {
    await expect(settingsService.save(userId, { projectIds: '101' }))
      .rejects.toThrow(/access token/);
  });

  it('rechaza un token demasiado corto', async () => {
    await expect(settingsService.save(userId, { projectIds: '101', accessToken: 'glpat-corto' }))
      .rejects.toThrow(/al menos 20 caracteres/);
  });

  it('conserva el token guardado cuando sólo cambian los proyectos', async () => {
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });
    await settingsService.save(userId, { projectIds: '202' });

    expect(await settingsService.getCredentials(userId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['202'],
    });
  });

  it('guarda el token cifrado y no en claro', async () => {
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ encrypted_access_token: string }>(
      'SELECT encrypted_access_token FROM gitlab_settings WHERE user_id = $1',
      [userId],
    );

    expect(rows[0]?.encrypted_access_token).not.toContain(TEST_TOKEN);
    expect(rows[0]?.encrypted_access_token.startsWith('v1.')).toBe(true);
  });

  it('guarda los proyectos como arreglo de Postgres', async () => {
    await settingsService.save(userId, { projectIds: '101,202', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ project_ids: string[] }>(
      'SELECT project_ids FROM gitlab_settings WHERE user_id = $1',
      [userId],
    );

    expect(rows[0]?.project_ids).toEqual(['101', '202']);
  });

  it('reemplaza la configuración anterior en lugar de duplicarla', async () => {
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });
    await settingsService.save(userId, { projectIds: '202', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ total: string | number }>(
      'SELECT COUNT(*) AS total FROM gitlab_settings WHERE user_id = $1',
      [userId],
    );

    expect(Number(rows[0]?.total)).toBe(1);
  });
});

describe('getCredentials', () => {
  it('devuelve el token descifrado para consultar GitLab', async () => {
    await settingsService.save(userId, { projectIds: '101,202', accessToken: TEST_TOKEN });

    expect(await settingsService.getCredentials(userId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['101', '202'],
    });
  });

  it('devuelve null si la persona no configuró nada', async () => {
    expect(await settingsService.getCredentials(userId)).toBeNull();
  });

  it('devuelve null si la clave de cifrado ya no es la que cifró el token', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(await createServiceWithOtherKey().getCredentials(userId)).toBeNull();
  });

  it('no filtra el token en el log del fallo de descifrado', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    await createServiceWithOtherKey().getCredentials(userId);

    expect(logged.mock.calls.flat().map(String).join(' ')).not.toContain(TEST_TOKEN);
  });
});

describe('remove', () => {
  it('borra la configuración de la persona', async () => {
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    await settingsService.remove(userId);

    expect(await settingsService.getSummary(userId)).toBeNull();
  });

  it('no falla si no había nada configurado', async () => {
    await expect(settingsService.remove(userId)).resolves.toBeUndefined();
  });
});

describe('aislamiento entre personas', () => {
  it('cada persona sólo ve su propia configuración', async () => {
    const otherUser = await authService.createUser({ username: 'bruno', password: TEST_PASSWORD });
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(await settingsService.getSummary(otherUser.id)).toBeNull();
  });

  it('se borra en cascada al eliminar el usuario', async () => {
    await settingsService.save(userId, { projectIds: '101', accessToken: TEST_TOKEN });

    await database.query('DELETE FROM users WHERE id = $1', [userId]);

    expect(await settingsService.getSummary(userId)).toBeNull();
  });
});
