// Contratos de infraestructura que comparten todas las features.

/** Resultado de una consulta SQL, con la misma forma para todos los drivers. */
export interface SqlResult<T> {
  rows: T[];
  /** Filas afectadas por un `INSERT`, `UPDATE` o `DELETE`. */
  rowCount: number;
}

/**
 * Acceso a Postgres, reducido a lo que necesitan los repositorios.
 *
 * Mantenerlo mínimo es lo que permite que los test corran contra PGlite —un
 * Postgres en memoria— sin que el código de producción sepa de esa diferencia.
 */
export interface Database {
  query: <T>(text: string, params?: unknown[]) => Promise<SqlResult<T>>;
  close: () => Promise<void>;
}
