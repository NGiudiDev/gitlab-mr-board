// 2. Dependencias externas.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { Database } from '../../../shared/types.js';
import type { AccountService } from '../../accounts/types.js';
import type { GitLabSettingsService } from '../types.js';

// 5. Módulos de constantes.
import { TEST_ACCOUNT_NAME, TEST_TOKEN } from '../../../../test/constants.js';

// 6. Utilidades.
import { createSecretCipher } from '../utils/encryption.js';

// 7. Imports relativos restantes.
import { createTestAccountService, createTestGitLabSettingsService } from '../../../../test/auth.js';
import { createTestDatabase } from '../../../../test/database.js';
import { createGitLabSettingsRepository } from './gitlabSettingsRepository.js';
import { createGitLabSettingsService } from './gitlabSettingsService.js';

const OTHER_KEY = 'otra-clave-de-cifrado-para-los-test';
const MAX_PROJECT_IDS = 50;

let database: Database;
let accountService: AccountService;
let settingsService: GitLabSettingsService;
let accountId: string;

/** Arma un servicio sobre la misma base pero con otra clave de cifrado. */
function createServiceWithOtherKey(): GitLabSettingsService {
  return createGitLabSettingsService({
    repository: createGitLabSettingsRepository(database),
    cipher: createSecretCipher(OTHER_KEY),
  });
}

beforeEach(async () => {
  database = await createTestDatabase();
  accountService = createTestAccountService(database);
  settingsService = createTestGitLabSettingsService(database);

  accountId = (await accountService.create(TEST_ACCOUNT_NAME)).id;
});

afterEach(async () => {
  vi.restoreAllMocks();
  await database.close();
});

describe('getSummary', () => {
  it('devuelve null si en la cuenta no se configuró nada', async () => {
    expect(await settingsService.getSummary(accountId)).toBeNull();
  });

  it('describe el token con sus últimos caracteres, sin revelarlo', async () => {
    const summary = await settingsService.save(accountId, {
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
    const summary = await settingsService.save(accountId, {
      projectIds: ' 101 , 202 ,,303 ',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202', '303']);
  });

  it('descarta los IDs repetidos', async () => {
    const summary = await settingsService.save(accountId, {
      projectIds: '101,101,202',
      accessToken: TEST_TOKEN,
    });

    expect(summary.projectIds).toEqual(['101', '202']);
  });

  it('rechaza una lista vacía', async () => {
    await expect(settingsService.save(accountId, { projectIds: '  ', accessToken: TEST_TOKEN }))
      .rejects.toThrow(/al menos un ID/);
  });

  it('rechaza un ID que no es numérico', async () => {
    await expect(settingsService.save(accountId, {
      projectIds: 'grupo/proyecto',
      accessToken: TEST_TOKEN,
    })).rejects.toThrow(/sólo números/);
  });

  it('rechaza más proyectos de los permitidos', async () => {
    const projectIds = Array.from({ length: MAX_PROJECT_IDS + 1 }, (_, index) => String(index + 1));

    await expect(settingsService.save(accountId, { projectIds, accessToken: TEST_TOKEN }))
      .rejects.toThrow(new RegExp(`más de ${MAX_PROJECT_IDS} proyectos`));
  });

  it('exige el token en la primera configuración', async () => {
    await expect(settingsService.save(accountId, { projectIds: '101' }))
      .rejects.toThrow(/access token/);
  });

  it('rechaza un token demasiado corto', async () => {
    await expect(settingsService.save(accountId, { projectIds: '101', accessToken: 'glpat-corto' }))
      .rejects.toThrow(/al menos 20 caracteres/);
  });

  it('conserva el token guardado cuando sólo cambian los proyectos', async () => {
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });
    await settingsService.save(accountId, { projectIds: '202' });

    expect(await settingsService.getCredentials(accountId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['202'],
    });
  });

  it('guarda el token cifrado y no en claro', async () => {
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ encrypted_access_token: string }>(
      'SELECT encrypted_access_token FROM account_gitlab_settings WHERE account_id = $1',
      [accountId],
    );

    expect(rows[0]?.encrypted_access_token).not.toContain(TEST_TOKEN);
    expect(rows[0]?.encrypted_access_token.startsWith('v1.')).toBe(true);
  });

  it('guarda los proyectos como arreglo de Postgres', async () => {
    await settingsService.save(accountId, { projectIds: '101,202', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ project_ids: string[] }>(
      'SELECT project_ids FROM account_gitlab_settings WHERE account_id = $1',
      [accountId],
    );

    expect(rows[0]?.project_ids).toEqual(['101', '202']);
  });

  it('reemplaza la configuración anterior en lugar de duplicarla', async () => {
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });
    await settingsService.save(accountId, { projectIds: '202', accessToken: TEST_TOKEN });

    const { rows } = await database.query<{ total: string | number }>(
      'SELECT COUNT(*) AS total FROM account_gitlab_settings WHERE account_id = $1',
      [accountId],
    );

    expect(Number(rows[0]?.total)).toBe(1);
  });
});

describe('getCredentials', () => {
  it('devuelve el token descifrado para consultar GitLab', async () => {
    await settingsService.save(accountId, { projectIds: '101,202', accessToken: TEST_TOKEN });

    expect(await settingsService.getCredentials(accountId)).toMatchObject({
      accessToken: TEST_TOKEN,
      projectIds: ['101', '202'],
    });
  });

  it('devuelve null si en la cuenta no se configuró nada', async () => {
    expect(await settingsService.getCredentials(accountId)).toBeNull();
  });

  it('devuelve null si la clave de cifrado ya no es la que cifró el token', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(await createServiceWithOtherKey().getCredentials(accountId)).toBeNull();
  });

  it('no filtra el token en el log del fallo de descifrado', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    await createServiceWithOtherKey().getCredentials(accountId);

    expect(logged.mock.calls.flat().map(String).join(' ')).not.toContain(TEST_TOKEN);
  });
});

describe('remove', () => {
  it('borra la configuración de la cuenta', async () => {
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    await settingsService.remove(accountId);

    expect(await settingsService.getSummary(accountId)).toBeNull();
  });

  it('no falla si no había nada configurado', async () => {
    await expect(settingsService.remove(accountId)).resolves.toBeUndefined();
  });
});

describe('aislamiento entre cuentas', () => {
  it('cada cuenta sólo ve su propia configuración', async () => {
    const otherAccount = await accountService.create('Otro equipo');
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    expect(await settingsService.getSummary(otherAccount.id)).toBeNull();
  });

  it('se borra en cascada al eliminar la cuenta', async () => {
    await settingsService.save(accountId, { projectIds: '101', accessToken: TEST_TOKEN });

    await database.query('DELETE FROM accounts WHERE id = $1', [accountId]);

    expect(await settingsService.getSummary(accountId)).toBeNull();
  });
});
