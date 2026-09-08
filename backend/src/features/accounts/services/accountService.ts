// 1. Módulos estándar de Node.js.
import { randomUUID } from 'node:crypto';

// 4. Imports exclusivos de tipos de TypeScript.
import type { AccountService, AccountServiceOptions, AccountSummary, StoredAccount } from '../types.js';

import { generateInviteCode as generateRandomInviteCode, normalizeInviteCode } from '../utils/inviteCode.js';

// 6. Utilidades.
import { HttpError } from '../../../shared/httpError.js';

const DEFAULT_ACCOUNT_NAME = 'Mi equipo';
const MAX_ACCOUNT_NAME_LENGTH = 80;

/**
 * Normaliza el nombre de la cuenta.
 *
 * Es opcional: quien se registra sin elegirlo obtiene el nombre por omisión y
 * lo puede cambiar después desde «Mi cuenta».
 *
 * @param value Valor recibido en el cuerpo de la petición.
 * @returns El nombre sin espacios alrededor, o el predeterminado.
 * @throws {HttpError} 400 si supera el largo máximo.
 */
function parseAccountName(value: unknown): string {
  const name = String(value ?? '').trim();

  if (name.length > MAX_ACCOUNT_NAME_LENGTH) {
    throw new HttpError(
      `El nombre de la cuenta no puede superar los ${MAX_ACCOUNT_NAME_LENGTH} caracteres.`,
      400,
    );
  }

  return name || DEFAULT_ACCOUNT_NAME;
}

/**
 * Arma el servicio de cuentas sobre un repositorio ya abierto.
 *
 * @param options Repositorio, reloj y generador de códigos inyectables.
 * @returns Servicio con el alta de cuentas y la gestión de su invitación.
 */
function createAccountService(options: AccountServiceOptions): AccountService {
  const {
    repository,
    now = () => new Date(),
    generateInviteCode = generateRandomInviteCode,
  } = options;

  /**
   * Arma la vista pública de una cuenta.
   *
   * @param account Cuenta leída de la base.
   * @param includeInviteCode Si se expone el código; sólo para administradores.
   * @returns La cuenta con la cantidad de miembros ya contada.
   */
  async function toSummary(
    account: StoredAccount,
    includeInviteCode: boolean,
  ): Promise<AccountSummary> {
    return {
      id: account.id,
      name: account.name,
      createdAt: account.createdAt,
      memberCount: await repository.countMembers(account.id),
      inviteCode: includeInviteCode ? account.inviteCode : null,
    };
  }

  /**
   * Lee una cuenta que tiene que existir.
   *
   * @param accountId Identificador de la cuenta.
   * @returns La cuenta guardada.
   * @throws {HttpError} 404 si la cuenta no existe.
   */
  async function requireAccount(accountId: string): Promise<StoredAccount> {
    const account = await repository.findById(accountId);
    if (!account) throw new HttpError('La cuenta no existe.', 404);

    return account;
  }

  async function create(name: unknown): Promise<StoredAccount> {
    const account: StoredAccount = {
      id: randomUUID(),
      name: parseAccountName(name),
      inviteCode: generateInviteCode(),
      createdAt: now().toISOString(),
    };

    await repository.insert(account);

    return account;
  }

  async function findByInviteCode(inviteCode: unknown): Promise<StoredAccount> {
    const normalizedCode = normalizeInviteCode(inviteCode);

    if (!normalizedCode) {
      throw new HttpError('Indicá el código de invitación.', 400);
    }

    const account = await repository.findByInviteCode(normalizedCode);
    if (!account) {
      throw new HttpError('El código de invitación no es válido. Pedile uno nuevo a quien administra la cuenta.', 404);
    }

    return account;
  }

  async function getSummary(accountId: string, includeInviteCode: boolean): Promise<AccountSummary> {
    return await toSummary(await requireAccount(accountId), includeInviteCode);
  }

  async function list(): Promise<AccountSummary[]> {
    const accounts = await repository.listAll();

    return await Promise.all(accounts.map((account) => toSummary(account, true)));
  }

  async function rename(accountId: string, name: unknown): Promise<AccountSummary> {
    const account = await requireAccount(accountId);
    const newName = parseAccountName(name);

    await repository.updateName(account.id, newName);

    return await toSummary({ ...account, name: newName }, true);
  }

  async function rotateInviteCode(accountId: string): Promise<AccountSummary> {
    const account = await requireAccount(accountId);
    const inviteCode = generateInviteCode();

    await repository.updateInviteCode(account.id, inviteCode);

    return await toSummary({ ...account, inviteCode }, true);
  }

  return { create, findByInviteCode, getSummary, list, rename, rotateInviteCode };
}

export { createAccountService, DEFAULT_ACCOUNT_NAME };
