import { HttpError } from "../../../shared/httpError.js";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Valida y normaliza una fecha calendario sin aplicarle zona horaria. */
function parseUploadDate(value) {
  if (value === "" || value === null) return null;
  if (typeof value !== "string") {
    throw new HttpError("La fecha de subida debe tener el formato AAAA-MM-DD.", 400);
  }

  const match = DATE_PATTERN.exec(value);
  if (!match) {
    throw new HttpError("La fecha de subida debe tener el formato AAAA-MM-DD.", 400);
  }

  const [, year, month, day] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (parsed.toISOString().slice(0, 10) !== value) {
    throw new HttpError("La fecha de subida no es válida.", 400);
  }

  return value;
}

/**
 * Arma el servicio que administra fechas de subida compartidas por cuenta.
 *
 * @param options Repositorio y reloj inyectables.
 * @returns Servicio para consultar y actualizar fechas.
 */
function createMergeRequestUploadDateService(options) {
  const { repository, now = () => new Date() } = options;

  async function list(accountId) {
    return repository.findByAccountId(accountId);
  }

  async function save(accountId, projectId, mergeRequestIid, value) {
    const uploadDate = parseUploadDate(value);
    const entry = { accountId, projectId, mergeRequestIid };

    if (!uploadDate) {
      await repository.delete(entry);
      return { uploadDate: null };
    }

    await repository.save({
      ...entry,
      uploadDate,
      updatedAt: now().toISOString(),
    });

    return { uploadDate };
  }

  return { list, save };
}

export { createMergeRequestUploadDateService, parseUploadDate };
