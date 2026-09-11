// 2. Dependencias externas.
import { afterEach, describe, expect, it } from 'vitest';

// 6. Imports relativos restantes.
import { createTestDatabase } from '../../../../test/database.js';
import { HttpError } from '../../../shared/httpError.js';
import { createAccountRepository } from '../../accounts/services/accountRepository.js';
import { createAccountService } from '../../accounts/services/accountService.js';
import { createAuthRepository } from './authRepository.js';
import { createAuthService, normalizeUsername } from './authService.js';

const PASSWORD = 'contrasena-de-prueba';
const START_DATE = new Date('2026-09-01T10:00:00.000Z');

const openRepositories = [];

/**
 * Arma el servicio sobre una base en memoria, con el reloj bajo control y una
 * cuenta ya creada: todo usuario pertenece a una, así que sin ella no hay alta
 * posible.
 */
async function createContext(sessionDurationDays) {
  const database = await createTestDatabase();
  const repository = createAuthRepository(database);
  openRepositories.push(repository);

  let currentTime = START_DATE.getTime();

  const accountService = createAccountService({
    repository: createAccountRepository(database),
    now: () => new Date(currentTime),
  });
  const account = await accountService.create('Equipo de prueba');

  return {
    repository,
    accountService,
    accountId: account.id,
    inviteCode: account.inviteCode,
    authService: createAuthService({
      repository,
      accountService,
      now: () => new Date(currentTime),
      ...(sessionDurationDays === undefined ? {} : { sessionDurationDays }),
    }),
    advance: (milliseconds) => { currentTime += milliseconds; },
  };
}

/** Contexto con el usuario `ana` ya dado de alta en la cuenta de prueba. */
async function createContextWithUser(sessionDurationDays) {
  const context = await createContext(sessionDurationDays);
  await context.authService.createUser({
    accountId: context.accountId,
    username: 'ana',
    password: PASSWORD,
    displayName: 'Ana Prueba',
  });

  return context;
}

afterEach(async () => {
  while (openRepositories.length > 0) await openRepositories.pop()?.close();
});

describe('normalizeUsername', () => {
  it('recorta los espacios y pasa a minúsculas', () => {
    expect(normalizeUsername('  Ana.Perez  ')).toBe('ana.perez');
  });
});

describe('createUser', () => {
  it('da de alta un usuario activo con rol user en la cuenta indicada', async () => {
    const { authService, accountId, repository } = await createContext();

    const user = await authService.createUser({ accountId, username: 'Ana', password: PASSWORD });

    expect(user).toEqual({
      id: expect.any(String),
      accountId,
      username: 'ana',
      displayName: 'ana',
      role: 'user',
      gitlabUsername: null,
    });
    expect((await repository.findUserByUsername('ana'))?.status).toBe('active');
  });

  it('conserva el nombre visible y el rol indicados', async () => {
    const { authService, accountId } = await createContext();

    const user = await authService.createUser({
      accountId,
      username: 'lider',
      password: PASSWORD,
      displayName: 'Nicolás Giudice',
      role: 'admin',
    });

    expect(user.displayName).toBe('Nicolás Giudice');
    expect(user.role).toBe('admin');
  });

  it('nunca expone el hash de la contraseña', async () => {
    const { authService, accountId } = await createContext();

    const user = await authService.createUser({ accountId, username: 'ana', password: PASSWORD });

    expect(JSON.stringify(user)).not.toContain('scrypt');
  });

  it('rechaza un nombre de usuario con caracteres no permitidos', async () => {
    const { authService, accountId } = await createContext();

    await expect(authService.createUser({ accountId, username: 'ana perez', password: PASSWORD }))
      .rejects.toThrow(HttpError);
  });

  it('rechaza un nombre de usuario demasiado corto', async () => {
    const { authService, accountId } = await createContext();

    await expect(authService.createUser({ accountId, username: 'an', password: PASSWORD }))
      .rejects.toThrow(/entre 3 y 32 caracteres/);
  });

  it('rechaza un nombre ya usado, sin importar las mayúsculas', async () => {
    const { authService, accountId } = await createContextWithUser();

    await expect(authService.createUser({ accountId, username: 'ANA', password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('rechaza un nombre ya usado en otra cuenta', async () => {
    const { authService, accountService } = await createContextWithUser();
    const otherAccount = await accountService.create('Otro equipo');

    await expect(authService.createUser({
      accountId: otherAccount.id,
      username: 'ana',
      password: PASSWORD,
    })).rejects.toMatchObject({ status: 409 });
  });

  it('rechaza una contraseña más corta que el mínimo', async () => {
    const { authService, accountId } = await createContext();

    await expect(authService.createUser({ accountId, username: 'ana', password: 'corta' }))
      .rejects.toMatchObject({ status: 400 });
  });
});

describe('register', () => {
  it('crea una cuenta nueva y deja administrador a quien la abre', async () => {
    const { authService, accountId } = await createContextWithUser();

    const result = await authService.register({
      username: 'zoe',
      password: PASSWORD,
      accountName: 'Equipo de Zoe',
    });

    expect(result.user.role).toBe('admin');
    expect(result.user.accountId).not.toBe(accountId);
  });

  it('usa el nombre de cuenta indicado', async () => {
    const { authService, accountService } = await createContext();

    const result = await authService.register({
      username: 'zoe',
      password: PASSWORD,
      accountName: 'Equipo de Zoe',
    });

    const account = await accountService.getSummary(result.user.accountId, false);
    expect(account.name).toBe('Equipo de Zoe');
  });

  it('suma a la cuenta del código de invitación, con rol user', async () => {
    const { authService, accountId, inviteCode } = await createContextWithUser();

    const result = await authService.register({ username: 'zoe', password: PASSWORD, inviteCode });

    expect(result.user.accountId).toBe(accountId);
    expect(result.user.role).toBe('user');
  });

  it('acepta el código de invitación en minúsculas y con espacios', async () => {
    const { authService, accountId, inviteCode } = await createContextWithUser();

    const result = await authService.register({
      username: 'zoe',
      password: PASSWORD,
      inviteCode: ` ${inviteCode.toLowerCase()} `,
    });

    expect(result.user.accountId).toBe(accountId);
  });

  it('rechaza un código de invitación que no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.register({
      username: 'zoe',
      password: PASSWORD,
      inviteCode: 'CODIGOMALO',
    })).rejects.toMatchObject({ status: 404 });
  });

  it('no deja una cuenta vacía cuando el alta del usuario falla', async () => {
    const { authService, accountService } = await createContextWithUser();

    await expect(authService.register({ username: 'ana', password: PASSWORD }))
      .rejects.toMatchObject({ status: 409 });
    await expect(authService.register({ username: 'zoe', password: 'corta' }))
      .rejects.toMatchObject({ status: 400 });

    expect(await accountService.list()).toHaveLength(1);
  });

  it('abre la sesión en el mismo paso', async () => {
    const { authService } = await createContext();

    const { token, user } = await authService.register({ username: 'ana', password: PASSWORD });

    expect((await authService.authenticate(token))?.username).toBe(user.username);
  });

  it('conserva el nombre visible indicado', async () => {
    const { authService } = await createContext();

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
    const { authService } = await createContext();

    await expect(authService.register({ username: 'an', password: PASSWORD }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.register({ username: 'ana', password: 'corta' }))
      .rejects.toMatchObject({ status: 400 });
  });

  it('no permite elegir el rol desde el registro', async () => {
    const { authService, inviteCode } = await createContextWithUser();

    const result = await authService.register(
      { username: 'zoe', password: PASSWORD, inviteCode, role: 'admin' },
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

    expect(await repository.findSessionByTokenHash(token)).toBeNull();
    expect(await authService.authenticate(token)).not.toBeNull();
  });

  it('registra el último ingreso', async () => {
    const { authService, repository } = await createContextWithUser();

    await authService.login({ username: 'ana', password: PASSWORD });

    expect((await repository.findUserByUsername('ana'))?.lastLoginAt).toBe(START_DATE.toISOString());
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
    const { authService, repository, accountId, advance } = await createContextWithUser(1);
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    advance(2 * 24 * 60 * 60 * 1000);
    await authService.login({ username: 'ana', password: PASSWORD });

    expect(await repository.listUsersOfAccount(accountId)).toHaveLength(1);
    expect(await authService.authenticate(token)).toBeNull();
  });
});

describe('authenticate', () => {
  it('devuelve el usuario de una sesión vigente, con su cuenta', async () => {
    const { authService, accountId } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    const user = await authService.authenticate(token);

    expect(user?.username).toBe('ana');
    expect(user?.accountId).toBe(accountId);
  });

  it('devuelve null sin token o con un token desconocido', async () => {
    const { authService } = await createContextWithUser();

    expect(await authService.authenticate(undefined)).toBeNull();
    expect(await authService.authenticate('')).toBeNull();
    expect(await authService.authenticate('token-inventado')).toBeNull();
  });

  it('descarta la sesión vencida en lugar de dejarla en la base', async () => {
    const { authService, repository, advance } = await createContextWithUser(1);
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    advance(24 * 60 * 60 * 1000 + 1);

    expect(await authService.authenticate(token)).toBeNull();
    expect(await repository.findUserByUsername('ana')).not.toBeNull();
  });

  it('deja de aceptar la sesión de un usuario deshabilitado', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    await authService.setUserStatus('ana', 'disabled');

    expect(await authService.authenticate(token)).toBeNull();
  });
});

describe('changeGitlabUsername', () => {
  it('guarda el nickname y lo devuelve en la identidad', async () => {
    const { authService, accountId } = await createContextWithUser();
    const { user } = await authService.login({ username: 'ana', password: PASSWORD });

    const updated = await authService.changeGitlabUsername(user.id, '  ana-gitlab  ');

    expect(updated.gitlabUsername).toBe('ana-gitlab');
    expect(updated.accountId).toBe(accountId);
    expect((await authService.listUsers(accountId))[0]?.gitlabUsername).toBe('ana-gitlab');
  });

  it('rechaza un nickname vacío o con caracteres que GitLab no acepta', async () => {
    const { authService } = await createContextWithUser();
    const { user } = await authService.login({ username: 'ana', password: PASSWORD });

    await expect(authService.changeGitlabUsername(user.id, '  ')).rejects.toMatchObject({ status: 400 });
    await expect(authService.changeGitlabUsername(user.id, '-ana')).rejects.toMatchObject({ status: 400 });
  });

  it('falla cuando el usuario de la sesión ya no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changeGitlabUsername('usuario-inexistente', 'ana-gitlab'))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('changeOwnProfile', () => {
  it('normaliza y guarda el nombre visible y el identificador sin cerrar la sesión', async () => {
    const { authService } = await createContextWithUser();
    const { token, user } = await authService.login({ username: 'ana', password: PASSWORD });

    const updated = await authService.changeOwnProfile(user.id, {
      username: '  Anita  ',
      displayName: '  Ana Pérez  ',
    });

    expect(updated).toMatchObject({ username: 'anita', displayName: 'Ana Pérez' });
    expect(await authService.authenticate(token)).toMatchObject({
      username: 'anita',
      displayName: 'Ana Pérez',
    });
    await expect(authService.login({ username: 'anita', password: PASSWORD })).resolves.toBeDefined();
  });

  it('usa el identificador como nombre visible cuando se lo deja vacío', async () => {
    const { authService } = await createContextWithUser();
    const { user } = await authService.login({ username: 'ana', password: PASSWORD });

    const updated = await authService.changeOwnProfile(user.id, { displayName: '  ' });

    expect(updated.displayName).toBe('ana');
  });

  it('rechaza un identificador inválido o ya ocupado', async () => {
    const { authService, accountId } = await createContextWithUser();
    const { user } = await authService.login({ username: 'ana', password: PASSWORD });
    await authService.createUser({ accountId, username: 'beto', password: PASSWORD });

    await expect(authService.changeOwnProfile(user.id, { username: 'a' }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.changeOwnProfile(user.id, { username: 123 }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.changeOwnProfile(user.id, { displayName: 123 }))
      .rejects.toMatchObject({ status: 400 });
    await expect(authService.changeOwnProfile(user.id, { username: 'beto' }))
      .rejects.toMatchObject({ status: 409 });
  });

  it('falla cuando el usuario de la sesión ya no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.changeOwnProfile('usuario-inexistente', { displayName: 'Ana' }))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('requireAccountMember', () => {
  it('devuelve el usuario cuando pertenece a la cuenta', async () => {
    const { authService, accountId } = await createContextWithUser();

    expect((await authService.requireAccountMember(accountId, 'ANA')).username).toBe('ana');
  });

  it('falla cuando el usuario es de otra cuenta', async () => {
    const { authService, accountService } = await createContextWithUser();
    const otherAccount = await accountService.create('Otro equipo');

    await expect(authService.requireAccountMember(otherAccount.id, 'ana'))
      .rejects.toMatchObject({ status: 404 });
  });

  it('falla cuando el usuario no existe', async () => {
    const { authService, accountId } = await createContextWithUser();

    await expect(authService.requireAccountMember(accountId, 'zoe'))
      .rejects.toMatchObject({ status: 404 });
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

    expect(await authService.authenticate(token)).toBeNull();
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

    const user = await authService.setUserStatus('ANA', 'disabled');

    expect(user.username).toBe('ana');
    await expect(authService.login({ username: 'ana', password: PASSWORD }))
      .rejects.toMatchObject({ status: 403 });
  });

  it('vuelve a habilitar al usuario', async () => {
    const { authService } = await createContextWithUser();
    await authService.setUserStatus('ana', 'disabled');

    await authService.setUserStatus('ana', 'active');

    await expect(authService.login({ username: 'ana', password: PASSWORD })).resolves.toBeDefined();
  });

  it('falla cuando el usuario no existe', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.setUserStatus('zoe', 'disabled')).rejects.toThrow(HttpError);
  });
});

describe('logout', () => {
  it('invalida la sesión indicada', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    await authService.logout(token);

    expect(await authService.authenticate(token)).toBeNull();
  });

  it('no falla con un token ausente o desconocido', async () => {
    const { authService } = await createContextWithUser();

    await expect(authService.logout(undefined)).resolves.toBeUndefined();
    await expect(authService.logout('token-inventado')).resolves.toBeUndefined();
  });
});

describe('changePassword', () => {
  it('cambia la contraseña y cierra las sesiones abiertas', async () => {
    const { authService } = await createContextWithUser();
    const { token } = await authService.login({ username: 'ana', password: PASSWORD });

    await authService.changePassword('ANA', 'contrasena-nueva');

    expect(await authService.authenticate(token)).toBeNull();
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
  it('devuelve los usuarios de la cuenta sin sus credenciales', async () => {
    const { authService, accountId } = await createContextWithUser();
    await authService.createUser({ accountId, username: 'zoe', password: PASSWORD });

    const users = await authService.listUsers(accountId);

    expect(users.map((user) => user.username)).toEqual(['ana', 'zoe']);
    expect(JSON.stringify(users)).not.toContain('scrypt');
  });

  it('no incluye los usuarios de otra cuenta', async () => {
    const { authService, accountId, accountService } = await createContextWithUser();
    const otherAccount = await accountService.create('Otro equipo');
    await authService.createUser({
      accountId: otherAccount.id,
      username: 'beto',
      password: PASSWORD,
    });

    expect((await authService.listUsers(accountId)).map((user) => user.username)).toEqual(['ana']);
    expect((await authService.listAllUsers()).map((user) => user.username)).toEqual(['ana', 'beto']);
  });

  it('incluye los datos que necesita la pantalla de administración', async () => {
    const { authService, accountId } = await createContextWithUser();
    await authService.login({ username: 'ana', password: PASSWORD });

    const [user] = await authService.listUsers(accountId);

    expect(user).toEqual({
      id: expect.any(String),
      accountId,
      username: 'ana',
      displayName: 'Ana Prueba',
      role: 'user',
      status: 'active',
      gitlabUsername: null,
      createdAt: START_DATE.toISOString(),
      lastLoginAt: START_DATE.toISOString(),
    });
  });
});
