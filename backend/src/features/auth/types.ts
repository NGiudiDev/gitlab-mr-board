// Contratos de la feature de autenticación: usuarios y sesiones.

export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

/** Fila de `users` tal como se guarda en Postgres. */
export interface StoredUser {
  id: string;
  username: string;
  displayName: string;
  passwordHash: string;
  role: UserRole;
  status: UserStatus;
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
  username: string;
  displayName: string;
  role: UserRole;
}

export interface CreateUserInput {
  username: string;
  password: string;
  displayName?: string;
  role?: UserRole;
}

/** Alta hecha por la propia persona: no puede elegir su rol. */
export interface RegisterUserInput {
  username: string;
  password: string;
  displayName?: string;
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
  listUsers: () => Promise<StoredUser[]>;
  countUsers: () => Promise<number>;
  updateLastLogin: (userId: string, lastLoginAt: string) => Promise<void>;
  updatePasswordHash: (userId: string, passwordHash: string) => Promise<void>;
  updateStatus: (userId: string, status: UserStatus) => Promise<void>;
  /** Devuelve si borró algo; sesiones y configuración caen en cascada. */
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
  setUserStatus: (username: string, status: UserStatus) => Promise<UserSummary>;
  /** Devuelve si el usuario existía; borrarlo arrastra sesiones y configuración. */
  deleteUser: (username: string) => Promise<boolean>;
  listUsers: () => Promise<UserSummary[]>;
  close: () => Promise<void>;
}
