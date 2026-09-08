// 6. Imports relativos restantes.
import { HttpError } from '../../../shared/httpError.js';

// Los IDs viajan dentro de la ruta de la API de GitLab: aceptar sólo números
// evita además que un valor arbitrario altere la URL consultada.
const PROJECT_ID_PATTERN = /^\d+$/;
const MAX_PROJECT_IDS = 50;

// Un PAT de GitLab tiene al menos veinte caracteres. No se exige el prefijo
// `glpat-` porque los tokens de proyecto y de grupo usan otros.
const MINIMUM_TOKEN_LENGTH = 20;
const TOKEN_HINT_LENGTH = 4;

/**
 * Normaliza los IDs de proyecto vengan como lista o como texto separado.
 *
 * @param value Valor recibido en el cuerpo de la petición.
 * @returns IDs numéricos, sin repetidos y en el orden ingresado.
 * @throws {HttpError} 400 si la lista está vacía, excede el máximo o
 * contiene un valor que no es un ID numérico.
 */
function parseProjectIds(value) {
  const rawValues = Array.isArray(value)
    ? value.map((item) => String(item))
    : String(value ?? '').split(/[\s,;]+/);
  const projectIds = [...new Set(rawValues.map((item) => item.trim()).filter(Boolean))];

  if (projectIds.length === 0) {
    throw new HttpError('Indicá al menos un ID de proyecto.', 400);
  }

  if (projectIds.length > MAX_PROJECT_IDS) {
    throw new HttpError(`No se pueden configurar más de ${MAX_PROJECT_IDS} proyectos.`, 400);
  }

  const invalidProjectId = projectIds.find((projectId) => !PROJECT_ID_PATTERN.test(projectId));
  if (invalidProjectId) {
    throw new HttpError(
      `«${invalidProjectId}» no es un ID de proyecto: se esperan sólo números, separados por comas.`,
      400,
    );
  }

  return projectIds;
}

/**
 * Valida el access token recibido.
 *
 * @param value Token en texto plano.
 * @returns El token sin espacios alrededor.
 * @throws {HttpError} 400 si está vacío o es demasiado corto.
 */
function parseAccessToken(value) {
  const accessToken = value.trim();

  if (accessToken.length < MINIMUM_TOKEN_LENGTH) {
    throw new HttpError(
      `El access token debe tener al menos ${MINIMUM_TOKEN_LENGTH} caracteres.`,
      400,
    );
  }

  return accessToken;
}

/**
 * Arma el servicio de configuración de GitLab sobre un repositorio ya abierto.
 *
 * @param options Repositorio, cifrador y reloj inyectables.
 * @returns Servicio con la lectura y el guardado de la configuración.
 */
function createGitLabSettingsService(options) {
  const { repository, cipher, now = () => new Date() } = options;

  /**
   * Descifra el access token guardado.
   *
   * @param settings Configuración leída de la base.
   * @returns El token en claro, o `null` si no se puede descifrar.
   */
  function decryptAccessToken(settings) {
    try {
      return cipher.decrypt(settings.encryptedAccessToken);
    } catch (error) {
      // Pasa si cambió `ENCRYPTION_KEY`: el token guardado quedó ilegible y hay
      // que cargarlo de nuevo.
      console.error(`No se pudo descifrar el token de GitLab de la cuenta ${settings.accountId}:`, error);
      return null;
    }
  }

  /** Arma la vista pública, que describe el token sin revelarlo. */
  function toSummary(settings) {
    const accessToken = decryptAccessToken(settings);

    return {
      projectIds: settings.projectIds,
      tokenHint: accessToken ? accessToken.slice(-TOKEN_HINT_LENGTH) : '',
      updatedAt: settings.updatedAt,
    };
  }

  async function getSummary(accountId) {
    const settings = await repository.findByAccountId(accountId);

    return settings ? toSummary(settings) : null;
  }

  async function getCredentials(accountId) {
    const settings = await repository.findByAccountId(accountId);
    if (!settings) return null;

    const accessToken = decryptAccessToken(settings);
    if (!accessToken) return null;

    return {
      accessToken,
      projectIds: settings.projectIds,
      updatedAt: settings.updatedAt,
    };
  }

  /**
   * Guarda la configuración de una cuenta.
   *
   * Omitir el token conserva el que ya estaba guardado, así se pueden cambiar
   * los proyectos sin volver a escribirlo.
   *
   * @param accountId Cuenta de la sesión en curso.
   * @param input Proyectos y, opcionalmente, un token nuevo.
   * @returns La configuración guardada, sin el token.
   * @throws {HttpError} 400 si los datos no son válidos.
   */
  async function save(accountId, input) {
    const projectIds = parseProjectIds(input.projectIds);
    const existingSettings = await repository.findByAccountId(accountId);
    const receivedToken = input.accessToken?.trim() ?? '';

    if (!receivedToken && !existingSettings) {
      throw new HttpError('Indicá el access token de GitLab.', 400);
    }

    const encryptedAccessToken = receivedToken
      ? cipher.encrypt(parseAccessToken(receivedToken))
      : (existingSettings).encryptedAccessToken;

    const settings = {
      accountId,
      projectIds,
      encryptedAccessToken,
      updatedAt: now().toISOString(),
    };

    await repository.save(settings);

    return toSummary(settings);
  }

  async function remove(accountId) {
    await repository.deleteByAccountId(accountId);
  }

  return { getCredentials, getSummary, remove, save };
}

export { createGitLabSettingsService };
