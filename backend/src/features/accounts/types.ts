// Contratos de la feature de cuentas: el grupo de personas que comparte un
// tablero y, con él, las credenciales de GitLab.

/** Fila de `accounts` tal como se guarda en Postgres. */
export interface StoredAccount {
  id: string;
  name: string;
  /** Código con el que alguien se suma a la cuenta al registrarse. */
  inviteCode: string;
  createdAt: string;
}

/** Vista de la cuenta que se expone al frontend. */
export interface AccountSummary {
  id: string;
  name: string;
  createdAt: string;
  /** Cantidad de personas que pertenecen a la cuenta. */
  memberCount: number;
  /**
   * Código de invitación vigente. Sólo se completa para un administrador:
   * quien lo tiene puede sumarse a la cuenta y ver el tablero.
   */
  inviteCode: string | null;
}

/** Acceso persistente a las cuentas. */
export interface AccountRepository {
  insert: (account: StoredAccount) => Promise<void>;
  findById: (id: string) => Promise<StoredAccount | null>;
  listAll: () => Promise<StoredAccount[]>;
  /** Busca sin distinguir mayúsculas: el código se copia y se pega a mano. */
  findByInviteCode: (inviteCode: string) => Promise<StoredAccount | null>;
  updateName: (id: string, name: string) => Promise<void>;
  updateInviteCode: (id: string, inviteCode: string) => Promise<void>;
  countMembers: (id: string) => Promise<number>;
}

export interface AccountServiceOptions {
  repository: AccountRepository;
  /** Reloj inyectable para fijar `createdAt` en los test. */
  now?: () => Date;
  /** Generador del código de invitación; inyectable para fijarlo en los test. */
  generateInviteCode?: () => string;
}

export interface AccountService {
  /**
   * Crea una cuenta con su código de invitación ya generado.
   *
   * @param name Nombre elegido, o vacío para usar el predeterminado.
   */
  create: (name: unknown) => Promise<StoredAccount>;
  /** Resuelve el código que alguien escribió al registrarse. */
  findByInviteCode: (inviteCode: unknown) => Promise<StoredAccount>;
  getSummary: (accountId: string, includeInviteCode: boolean) => Promise<AccountSummary>;
  /** Todas las cuentas con su código; sólo para la línea de comandos. */
  list: () => Promise<AccountSummary[]>;
  rename: (accountId: string, name: unknown) => Promise<AccountSummary>;
  /** Deja sin efecto el código anterior y devuelve la cuenta con el nuevo. */
  rotateInviteCode: (accountId: string) => Promise<AccountSummary>;
}
