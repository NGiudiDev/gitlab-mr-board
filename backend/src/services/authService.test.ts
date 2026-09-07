// 2. Dependencias externas.
import { afterEach, describe, expect, it } from 'vitest';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AuthRepository, AuthService } from '../types.js';

// 7. Imports relativos restantes.
import { IN_MEMORY_LOCATION, openAuthDatabase } from './authRepository.js';
import { AuthError, createAuthService, normalizeUsername } from './authService.js';

const PASSWORD = 'contrasena-de-prueba';
const START_DATE = new Date('2026-09-01T10:00:00.000Z');

const openRepositories: AuthRepository[] = [];

interface TestContext {
  authService: AuthService;
  repository: AuthRepository;
  /** Corre el reloj del servicio sin esperar en tiempo real. */
  advance: (milliseconds: number) => void;
}

/** Arma el servicio sobre una base en memoria y con el reloj bajo control. */
function createContext(sessionDurationDays?: number): TestContext {
  const repository = openAuthDatabase(IN_MEMORY_LOCATION);
  openRepositories.push(repository);

  let currentTime = START_DATE.getTime();

  return {
    repository,
    authService: createAuthService({
      repository,
      now: () => new Date(currentTime),
      ...(sessionDurationDays === undefined ? {} : { sessionDurationDays }),
    }),
    advance: (milliseconds: number) => { currentTime += milliseconds; },
  };
}

/** Contexto con el usuario `ana` ya dado de alta. */
async function createContextWithUser(sessionDurationDays?: number): Promise<TestContext> {
  const context = createContext(sessionDurationDays);
  await context.authService.createUser({ username: 'ana', password: PASSWORD, displayName: 'Ana Prueba' });

  return context;
}

afterEach(() => {
  while (openRepositories.length > 0) openRepositories.pop()?.close();
});

describe('normalizeUsername', () => {
  it('recorta los espacios y pasa a minúsculas', () => {
    expect(normalizeUsername('  Ana.Perez  ')).toBe('ana.perez');
  });
});

describe('createUser', () => {
  it('da de alta un usuario activo con rol user', async () => {
    const { authService, repository } = createContext();

    const user = await authService.createUser({ username: 'Ana', password: PASSWORD });

    expect(user).toEqual({
      id: expect.any(String),
      username: 'ana',
      displayName: 'ana',
      role: 'user',
    });
    expect(repository.findUserByUsername('ana')?.status).toBe('active');
  });

  it('conserva el nombre visible y el rol indicados', async () => {
    const { authService } = createContext();

    const user = await authService.createUser({
      username: 'lider',
      password: PASSWORD,
      displayName: 'Nicolás Giudice',
      role: 'admin',
    });

    expect(user.displayName).toBe('Nicolás Giudice');
    expect(user.role).toBe('admin');
  });

  it('nunca expone el hash de la contraseña', async () => {
    const { authService } = createContext();

    const user = await authService.createUser({ username: 'ana', password: PASSWORD });

    expect(JSON.stringify(user)).not.toContain('scrypt');
  });

  it('rechaza un nombre de usuario con caracteres no permitidos', async () => {
    const { authService } = createContext();

    await expect(authService.createUser({ username: 'ana perez', password: PASSWORD }))
      .rejects.toThrow(AuthError);
  });

  it('rechaza un nombre de usuario demasiado corto', async () => {
    const { authService } = createContext();

    await expect(authService.createUser({ username: 'an', password: PASSWORD }))
      .rejects.toThrow(/entre 3 y 32 caracteres/);
  });

  it('rechaza un nombre ya usado, sin importar las mayúsculas', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.createUser({ username: 'ANA', password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('rechaza una contraseña más corta que el mínimo', async () => {
    const { authService } = createContext();

    await expect(authService.createUser({ username: 'ana', password: 'corta' }))
      .rejects.toMatchObject({ status: 400 });
  });
});

describe('register', () => {
  it('deja administrador al primer usuario del sistema', async () => {
    const { authService } = createContext();

    const result = await authService.register({ username: 'ana', password: PASSWORD });

    expect(result.user.role).toBe('admin');
  });

  it('da rol user a los registros siguientes', async () => {
    const { authService } = await createContextWithUser();

    const result = await authService.register({ username: 'zoe', password: PASSWORD });

    expect(result.user.role).toBe('user');
  });

  it('abre la sesión en el mismo paso', async () => {
    const { authService } = createContext();

    const { token, user } = await authService.register({ username: 'ana', password: PASSWORD });

    expect(authService.authenticate(token)?.username).toBe(user.username);
  });

  it('conserva el nombre visible indicado', async () => {
    const { authService } = createContext();

    const result = await authService.register({
      username: 'ana',
      password: PASSWORD,
      displayName: 'Ana Prueba',
    });

    expect(result.user.displayName).toBe('Ana Prueba');
  });

  it('rechaza un nombre ya tomado', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.register({ username: 'ana', password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('aplica las mismas reglas de nombre y contraseña que el alta administrada', async () => {
    const { authService } = createContext();

    await expect(authService.register({ username: 'an', password: PASSWORD }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.register({ username: 'ana', password: 'corta' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('no permite elegir el rol desde el registro', async () => {
    const { authService } = await createContextWithUser();

    const result = await authService.register(
      { username: 'zoe', password: PASSWORD, role: 'admin' } as never,
    );

    expect(result.user.role).toBe('user');
  });
});

describe('login', () => {
  it('devuelve el usuario, un token y el vencimiento', async () => {
    const { authService } = await createContextWithUser(7);

    const result = await authService.login({ username: 'ana', password: PASSWORD });

    expect(result.user.username).toBe('ana');
    expect(result.token).toHaveLength(43);
    expect(result.expiresAt.toISOString()).toBe('2026-09-08T10:00:00.000Z');
  });

  it('acepta el nombre de usuario con otras mayúsculas', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.login({ username: '  ANA ', password: PASSWORD })).resolves.toBeDefined();
  });

  it('emite un token distinto en cada ingreso', async () => {
    const { authService } = await createContextWithUser();

    const first = await authService.login({ username: 'ana', password: PASSWORD });
    const second = await authService.login({ username: 'ana', password: PASSWORD });

    expect(first.token).not.toBe(second.token);
  });

  it('guarda la sesión con el token hasheado', async () => {
    const { authService, repository } = await createContextWithUser();

    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    expect(repository.findSessionByTokenHash(token)).toBeNull();
    expect(authService.authenticate(token)).not.toBeNull();
  });

  it('registra el último ingreso', async () => {
    const { authService, repository } = await createContextWithUser();

    await authService.login({ username: 'ana', password: PASSWORD });

    expect(repository.findUserByUsername('ana')?.lastLoginAt).toBe(START_DATE.toISOString());
  });

  it('rechaza la contraseña incorrecta con el mismo mensaje que un usuario inexistente', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.login({ username: 'ana', password: 'otra-contrasena' }))
      .rejects.toThrow('Usuario o contraseña incorrectos.');
    await expect(authService.login({ username: 'zoe', password: PASSWORD }))
      .rejects.toThrow('Usuario o contraseña incorrectos.');
  });

  it('pide usuario y contraseña cuando falta alguno', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.login({ username: '', password: PASSWORD }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.login({ username: 'ana', password: '' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('bloquea el usuario tras cinco intentos fallidos', async () => {
    const { authService } = await createContextWithUser();

    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(authService.login({ username: 'ana', password: 'incorrecta' })).rejects.toThrow();
    }

    await expect(authService.login({ username: 'ana', password: PASSWORD }))
      .rejects.toMatchObject({ status: 429 });
  });

  it('levanta el bloqueo cuando pasa la espera', async () => {
    const { authService, advance } = await createContextWithUser();
    for (let attempt = 0; attempt < 5; attempt++) {
      await expect(authService.login({ username: 'ana', password: 'incorrecta' })).rejects.toThrow();
    }

    advance(15 * 60 * 1000);

    await expect(authService.login({ username: 'ana', password: PASSWORD })).resolves.toBeDefined();
  });

  it('reinicia el contador de fallos tras un ingreso exitoso', async () => {
    const { authService } = await createContextWithUser();
    for (let attempt = 0; attempt < 4; attempt++) {
      await expect(authService.login({ username: 'ana', password: 'incorrecta' })).rejects.toThrow();
    }

    await authService.login({ username: 'ana', password: PASSWORD });
    await expect(authService.login({ username: 'ana', password: 'incorrecta' })).rejects.toMatchObject({ status: 401 });
  });

  it('limpia las sesiones vencidas al ingresar', async () => {
    const { authService, repository, advance } = await createContextWithUser(1);
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    advance(2 * 24 * 60 * 60 * 1000);
    await authService.login({ username: 'ana', password: PASSWORD });

    expect(repository.listUsers()).toHaveLength(1);
    expect(authService.authenticate(token)).toBeNull();
  });
});

describe('authenticate', () => {
  it('devuelve el usuario de una sesión vigente', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    expect(authService.authenticate(token)?.username).toBe('ana');
  });

  it('devuelve null sin token o con un token desconocido', async () => {
    const { authService } = await createContextWithUser();

    expect(authService.authenticate(undefined)).toBeNull();
    expect(authService.authenticate('')).toBeNull();
    expect(authService.authenticate('token-inventado')).toBeNull();
  });

  it('descarta la sesión vencida en lugar de dejarla en la base', async () => {
    const { authService, repository, advance } = await createContextWithUser(1);
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    advance(24 * 60 * 60 * 1000 + 1);

    expect(authService.authenticate(token)).toBeNull();
    expect(repository.findUserByUsername('ana')).not.toBeNull();
  });

  it('deja de aceptar la sesión de un usuario deshabilitado', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    authService.setUserStatus('ana', 'disabled');

    expect(authService.authenticate(token)).toBeNull();
  });
});

describe('changeOwnPassword', () => {
  it('cambia la contraseña cuando la actual coincide', async () => {
    const { authService } = await createContextWithUser();

    await authService.changeOwnPassword('ana', PASSWORD, 'contrasena-nueva');

    await expect(authService.login({ username: 'ana', password: 'contrasena-nueva' })).resolves.toBeDefined();
  });

  it('cierra las sesiones abiertas', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    await authService.changeOwnPassword('ana', PASSWORD, 'contrasena-nueva');

    expect(authService.authenticate(token)).toBeNull();
  });

  it('rechaza el cambio si la contraseña actual no coincide', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changeOwnPassword('ana', 'incorrecta', 'contrasena-nueva'))
      .rejects.toMatchObject({ status: 403 });
    await expect(authService.login({ username: 'ana', password: PASSWORD })).resolves.toBeDefined();
  });

  it('rechaza una contraseña nueva más corta que el mínimo', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changeOwnPassword('ana', PASSWORD, 'corta'))
      .rejects.toMatchObject({ status: 400 });
  });

  it('falla cuando el usuario no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changeOwnPassword('zoe', PASSWORD, 'contrasena-nueva'))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('setUserStatus', () => {
  it('deshabilita al usuario y le impide volver a ingresar', async () => {
    const { authService } = await createContextWithUser();

    const user = authService.setUserStatus('ANA', 'disabled');

    expect(user.username).toBe('ana');
    await expect(authService.login({ username: 'ana', password: PASSWORD }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('vuelve a habilitar al usuario', async () => {
    const { authService } = await createContextWithUser();
    authService.setUserStatus('ana', 'disabled');

    authService.setUserStatus('ana', 'active');

    await expect(authService.login({ username: 'ana', password: PASSWORD })).resolves.toBeDefined();
  });

  it('falla cuando el usuario no existe', async () => {
    const { authService } = await createContextWithUser();

    expect(() => authService.setUserStatus('zoe', 'disabled')).toThrow(AuthError);
  });
});

describe('logout', () => {
  it('invalida la sesión indicada', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    authService.logout(token);

    expect(authService.authenticate(token)).toBeNull();
  });

  it('no falla con un token ausente o desconocido', async () => {
    const { authService } = await createContextWithUser();

    expect(() => authService.logout(undefined)).not.toThrow();
    expect(() => authService.logout('token-inventado')).not.toThrow();
  });
});

describe('changePassword', () => {
  it('cambia la contraseña y cierra las sesiones abiertas', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    await authService.changePassword('ANA', 'contrasena-nueva');

    expect(authService.authenticate(token)).toBeNull();
    await expect(authService.login({ username: 'ana', password: 'contrasena-nueva' })).resolves.toBeDefined();
    await expect(authService.login({ username: 'ana', password: PASSWORD })).rejects.toThrow();
  });

  it('falla cuando el usuario no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changePassword('zoe', 'contrasena-nueva'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('rechaza una contraseña más corta que el mínimo', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changePassword('ana', 'corta')).rejects.toMatchObject({ status: 400 });
  });
});

describe('listUsers', () => {
  it('devuelve los usuarios sin sus credenciales', async () => {
    const { authService } = await createContextWithUser();
    await authService.createUser({ username: 'zoe', password: PASSWORD });

    const users = authService.listUsers();

    expect(users.map((user) => user.username)).toEqual(['ana', 'zoe']);
    expect(JSON.stringify(users)).not.toContain('scrypt');
  });

  it('incluye los datos que necesita la pantalla de administración', async () => {
    const { authService } = await createContextWithUser();
    await authService.login({ username: 'ana', password: PASSWORD });

    const [user] = authService.listUsers();

    expect(user).toEqual({
      id: expect.any(String),
      username: 'ana',
      displayName: 'Ana Prueba',
      role: 'user',
      status: 'active',
      createdAt: START_DATE.toISOString(),
      lastLoginAt: START_DATE.toISOString(),
    });
  });
});
