// 4. Imports exclusivos de tipos de TypeScript.
import type { AccountService } from '../accounts/types.js';

// Contratos de la feature de autenticación: usuarios y sesiones. Cada usuario
// pertenece a una cuenta, que es la que comparte el tablero.

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

/** Fila de `users` tal como se guarda en Postgres. */
export interface StoredUser {
  id: string;
  accountId: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
  /** Nickname de GitLab de la persona; `null` hasta que lo carga. */
  gitlabUsername: string | null;
  createdAt: string;
  lastLoginAt: string | null;
}

/** Fila de `sessions`; el token viaja hasheado para que un volcado de la base no permita suplantar. */
export interface StoredSession {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

/** Identidad que el backend expone al frontend, sin credenciales. */
export interface AuthenticatedUser {
  id: string;
  /** Cuenta a la que pertenece: define qué tablero ve. */
  accountId: string;
  username: string;
  displayName: string;
  role: UserRole;
  gitlabUsername: string | null;
}

/** Alta hecha por quien administra: elige el rol, dentro de su propia cuenta. */
export interface CreateUserInput {
  accountId: string;
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

/**
 * Alta hecha por la propia persona: no puede elegir su rol.
 *
 * Con `inviteCode` se suma a una cuenta que ya existe; sin él crea una nueva y
 * queda como su administrador.
 */
export interface RegisterUserInput {
  username: string;
  password: string;
  displayName?: string;
  accountName?: string;
  inviteCode?: string;
}

/** Vista de un usuario para la pantalla de administración. */
export interface UserSummary extends AuthenticatedUser {
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface LoginResult {
  user: AuthenticatedUser;
  token: string;
  expiresAt: Date;
}

/** Acceso persistente a usuarios y sesiones. */
export interface AuthRepository {
  insertUser: (user: StoredUser) => Promise<void>;
  findUserById: (id: string) => Promise<StoredUser | null>;
  findUserByUsername: (username: string) => Promise<StoredUser | null>;
  /** Lista los usuarios de una cuenta; el resto no es asunto de esa cuenta. */
  listUsersOfAccount: (accountId: string) => Promise<StoredUser[]>;
  /** Lista todos los usuarios de la base; sólo para la línea de comandos. */
  listAllUsers: () => Promise<StoredUser[]>;
  updateLastLogin: (userId: string, lastLoginAt: string) => Promise<void>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  updateStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateGitlabUsername: (userId: string, gitlabUsername: string | null) => Promise<void>;
  /** Devuelve si borró algo; las sesiones caen en cascada. */
  deleteUser: (userId: string) => Promise<boolean>;
  insertSession: (session: StoredSession) => Promise<void>;
  findSessionByTokenHash: (tokenHash: string) => Promise<StoredSession | null>;
  deleteSession: (sessionId: string) => Promise<void>;
  deleteSessionsOfUser: (userId: string) => Promise<void>;
  deleteExpiredSessions: (nowIso: string) => Promise<number>;
  close: () => Promise<void>;
}

export interface AuthServiceOptions {
  repository: AuthRepository;
  /** Resuelve la cuenta al registrarse: la crea o la busca por invitación. */
  accountService: AccountService;
  /** Reloj inyectable para fijar vencimientos en los test. */
  now?: () => Date;
  sessionDurationDays?: number;
}

export interface AuthService {
  createUser: (input: CreateUserInput) => Promise<AuthenticatedUser>;
  register: (input: RegisterUserInput) => Promise<LoginResult>;
  login: (credentials: { username: string; password: string }) => Promise<LoginResult>;
  authenticate: (token: string | undefined) => Promise<AuthenticatedUser | null>;
  logout: (token: string | undefined) => Promise<void>;
  changePassword: (username: string, newPassword: string) => Promise<void>;
  changeOwnPassword: (
    username: string,
    currentPassword: string,
    newPassword: string,
  ) => Promise<void>;
  /** Guarda el nickname de GitLab de la propia persona, para la vista personal. */
  changeGitlabUsername: (userId: string, gitlabUsername: unknown) => Promise<AuthenticatedUser>;
  /** Comprueba que un usuario pertenezca a una cuenta antes de administrarlo. */
  requireAccountMember: (accountId: string, username: string) => Promise<UserSummary>;
  setUserStatus: (username: string, status: UserStatus) => Promise<UserSummary>;
  /** Devuelve si el usuario existía; borrarlo arrastra sus sesiones. */
  deleteUser: (username: string) => Promise<boolean>;
  listUsers: (accountId: string) => Promise<UserSummary[]>;
  /** Todos los usuarios de la base; sólo para la línea de comandos. */
  listAllUsers: () => Promise<UserSummary[]>;
  close: () => Promise<void>;
}
