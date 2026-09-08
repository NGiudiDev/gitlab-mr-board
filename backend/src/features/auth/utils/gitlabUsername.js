// 5. Utilidades.
import { HttpError } from '../../../shared/httpError.js';

// GitLab admite letras, números, guiones, guiones bajos y puntos, y exige que
// el nombre empiece con letra o número.
const GITLAB_USERNAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;
const MAX_GITLAB_USERNAME_LENGTH = 255;

/**
 * Normaliza y valida el nickname de GitLab de una persona.
 *
 * Es dato de cada usuario y no de la cuenta: de él depende la vista personal,
 * que necesita saber cuáles de los merge requests son de quien mira.
 *
 * @param value Valor recibido en el cuerpo de la petición.
 * @returns El nickname sin espacios alrededor.
 * @throws {HttpError} 400 si está vacío o tiene caracteres que GitLab no acepta.
 */
function parseGitlabUsername(value) {
  const gitlabUsername = String(value ?? '').trim();

  if (!gitlabUsername) {
    throw new HttpError('Indicá tu nickname de GitLab.', 400);
  }

  if (gitlabUsername.length > MAX_GITLAB_USERNAME_LENGTH) {
    throw new HttpError(
      `El nickname de GitLab no puede superar los ${MAX_GITLAB_USERNAME_LENGTH} caracteres.`,
      400,
    );
  }

  if (!GITLAB_USERNAME_PATTERN.test(gitlabUsername)) {
    throw new HttpError(
      `«${gitlabUsername}» no es un nickname de GitLab: se esperan letras, números, punto, guion o guion bajo, empezando con letra o número.`,
      400,
    );
  }

  return gitlabUsername;
}

export { MAX_GITLAB_USERNAME_LENGTH, parseGitlabUsername };
