/** Traduce una fila de fechas de subida al contrato del dominio. */
function toUploadDate(row) {
  return {
    projectId: row.project_id,
    mergeRequestIid: Number(row.merge_request_iid),
    uploadDate: row.upload_date instanceof Date
      ? row.upload_date.toISOString().slice(0, 10)
      : String(row.upload_date).slice(0, 10),
  };
}

/**
 * Arma el acceso a las fechas de subida sobre una base ya abierta.
 *
 * @param database Base devuelta por `createNeonDatabase`, o su equivalente en test.
 * @returns Repositorio para listar, guardar y quitar fechas de una cuenta.
 */
function createMergeRequestUploadDateRepository(database) {
  return {
    async findByAccountId(accountId) {
      const { rows } = await database.query(
        "SELECT project_id, merge_request_iid, upload_date FROM merge_request_upload_dates WHERE account_id = $1",
        [accountId],
      );

      return rows.map(toUploadDate);
    },

    async save(entry) {
      await database.query(
        `INSERT INTO merge_request_upload_dates (
           account_id, project_id, merge_request_iid, upload_date, updated_at
         ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (account_id, project_id, merge_request_iid) DO UPDATE SET
           upload_date = EXCLUDED.upload_date,
           updated_at = EXCLUDED.updated_at`,
        [
          entry.accountId,
          entry.projectId,
          entry.mergeRequestIid,
          entry.uploadDate,
          entry.updatedAt,
        ],
      );
    },

    async delete(entry) {
      await database.query(
        `DELETE FROM merge_request_upload_dates
         WHERE account_id = $1 AND project_id = $2 AND merge_request_iid = $3`,
        [entry.accountId, entry.projectId, entry.mergeRequestIid],
      );
    },
  };
}

export { createMergeRequestUploadDateRepository };
