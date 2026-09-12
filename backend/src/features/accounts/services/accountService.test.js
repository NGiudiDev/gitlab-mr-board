// 2. Dependencias externas.
import { describe, expect, it } from 'vitest';

// 6. Imports relativos restantes.
import { createTestDatabase } from '../../../../test/database.js';
import { createAuthRepository } from '../../auth/services/authRepository.js';
import { createAccountRepository } from './accountRepository.js';
import { createAccountService } from './accountService.js';

const START_DATE = new Date('2026-09-01T10:00:00.000Z');

/**
 * Arma el servicio sobre una base en memoria, con el reloj y los códigos de
 * invitación bajo control.
 */
async function createContext() {
  const database = await createTestDatabase();
  const users = createAuthRepository(database);
  let codeNumber = 0;

  return {
    accountService: createAccountService({
      repository: createAccountRepository(database),
      now: () => START_DATE,
      // Un código fijo rompería la unicidad al crear dos cuentas en un test.
      generateInviteCode: () => `CODIGO${(codeNumber += 1)}`,
    }),
    addMember: async (accountId, email) => {
      await users.insertUser({
        id: `usuario-${email}`,
        accountId,
        email,
        displayName: email,
        passwordHash: 'scrypt$16384$8$1$aa$bb',
        role: 'user',
        status: 'active',
        gitlabUsername: null,
        createdAt: START_DATE.toISOString(),
        lastLoginAt: null,
      });
    },
  };
}

describe('create', () => {
  it('crea la cuenta con su código de invitación y la fecha del reloj', async () => {
    const { accountService } = await createContext();

    const account = await accountService.create('Equipo de prueba');

    expect(account).toEqual({
      id: expect.any(String),
      name: 'Equipo de prueba',
      inviteCode: 'CODIGO1',
      createdAt: START_DATE.toISOString(),
    });
  });

  it('recorta el nombre y usa el predeterminado cuando no viene', async () => {
    const { accountService } = await createContext();

    expect((await accountService.create('  Equipo  ')).name).toBe('Equipo');
    expect((await accountService.create('')).name).toBe('Mi equipo');
    expect((await accountService.create(undefined)).name).toBe('Mi equipo');
  });

  it('rechaza un nombre más largo que el máximo', async () => {
    const { accountService } = await createContext();

    await expect(accountService.create('x'.repeat(81))).rejects.toMatchObject({ status: 400 });
  });
});

describe('findByInviteCode', () => {
  it('resuelve el código sin distinguir mayúsculas ni espacios', async () => {
    const { accountService } = await createContext();
    const account = await accountService.create('Equipo de prueba');

    expect((await accountService.findByInviteCode(' codigo1 ')).id).toBe(account.id);
  });

  it('responde 400 sin código y 404 con uno desconocido', async () => {
    const { accountService } = await createContext();
    await accountService.create('Equipo de prueba');

    await expect(accountService.findByInviteCode('')).rejects.toMatchObject({ status: 400 });
    await expect(accountService.findByInviteCode('OTROCODIGO')).rejects.toMatchObject({ status: 404 });
  });
});

describe('getSummary', () => {
  it('cuenta los miembros y expone el código sólo si se lo pide', async () => {
    const { accountService, addMember } = await createContext();
    const account = await accountService.create('Equipo de prueba');
    await addMember(account.id, 'ana@example.com');
    await addMember(account.id, 'zoe@example.com');

    const forAdmin = await accountService.getSummary(account.id, true);
    const forMember = await accountService.getSummary(account.id, false);

    expect(forAdmin).toEqual({
      id: account.id,
      name: 'Equipo de prueba',
      createdAt: START_DATE.toISOString(),
      memberCount: 2,
      inviteCode: 'CODIGO1',
    });
    expect(forMember.inviteCode).toBeNull();
  });

  it('no cuenta los miembros de otra cuenta', async () => {
    const { accountService, addMember } = await createContext();
    const account = await accountService.create('Equipo de prueba');
    const other = await accountService.create('Otro equipo');
    await addMember(account.id, 'ana@example.com');
    await addMember(other.id, 'beto@example.com');

    expect((await accountService.getSummary(account.id, false)).memberCount).toBe(1);
  });

  it('responde 404 cuando la cuenta no existe', async () => {
    const { accountService } = await createContext();

    await expect(accountService.getSummary('cuenta-inexistente', false))
      .rejects.toMatchObject({ status: 404 });
  });
});

describe('rename', () => {
  it('cambia el nombre y devuelve la cuenta actualizada', async () => {
    const { accountService } = await createContext();
    const account = await accountService.create('Equipo de prueba');

    expect((await accountService.rename(account.id, 'Plataforma')).name).toBe('Plataforma');
    expect((await accountService.getSummary(account.id, false)).name).toBe('Plataforma');
  });

  it('rechaza un nombre más largo que el máximo', async () => {
    const { accountService } = await createContext();
    const account = await accountService.create('Equipo de prueba');

    await expect(accountService.rename(account.id, 'x'.repeat(81)))
      .rejects.toMatchObject({ status: 400 });
  });
});

describe('rotateInviteCode', () => {
  it('deja sin efecto el código anterior', async () => {
    const { accountService } = await createContext();
    const account = await accountService.create('Equipo de prueba');

    const rotated = await accountService.rotateInviteCode(account.id);

    expect(rotated.inviteCode).toBe('CODIGO2');
    await expect(accountService.findByInviteCode('CODIGO1')).rejects.toMatchObject({ status: 404 });
    expect((await accountService.findByInviteCode('CODIGO2')).id).toBe(account.id);
  });
});

describe('list', () => {
  it('devuelve todas las cuentas con su código, en orden de creación', async () => {
    const { accountService } = await createContext();
    await accountService.create('Equipo de prueba');
    await accountService.create('Otro equipo');

    const accounts = await accountService.list();

    expect(accounts.map((account) => account.name)).toEqual(['Equipo de prueba', 'Otro equipo']);
    expect(accounts.map((account) => account.inviteCode)).toEqual(['CODIGO1', 'CODIGO2']);
  });
});
