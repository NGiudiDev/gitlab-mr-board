import { beforeEach, describe, expect, it } from "vitest";

import { createTestAccountService } from "../../../../test/auth.js";
import { createTestDatabase } from "../../../../test/database.js";
import { createMergeRequestUploadDateRepository } from "./mergeRequestUploadDateRepository.js";
import { createMergeRequestUploadDateService } from "./mergeRequestUploadDateService.js";

let accountService;
let service;
let accountId;

beforeEach(async () => {
  const database = await createTestDatabase();
  accountService = createTestAccountService(database);
  service = createMergeRequestUploadDateService({
    repository: createMergeRequestUploadDateRepository(database),
    now: () => new Date("2026-10-04T12:00:00.000Z"),
  });
  accountId = (await accountService.create("Equipo de test")).id;
});

describe("fechas de subida", () => {
  it("guarda y lista una fecha por proyecto y merge request", async () => {
    await service.save(accountId, "101", 7, "2026-10-15");

    expect(await service.list(accountId)).toEqual([{
      projectId: "101",
      mergeRequestIid: 7,
      uploadDate: "2026-10-15",
    }]);
  });

  it("reemplaza la fecha existente", async () => {
    await service.save(accountId, "101", 7, "2026-10-15");
    await service.save(accountId, "101", 7, "2026-10-20");

    expect(await service.list(accountId)).toEqual([{
      projectId: "101",
      mergeRequestIid: 7,
      uploadDate: "2026-10-20",
    }]);
  });

  it("quita la fecha cuando recibe un valor vacío", async () => {
    await service.save(accountId, "101", 7, "2026-10-15");
    await service.save(accountId, "101", 7, "");

    expect(await service.list(accountId)).toEqual([]);
  });

  it("aísla las fechas entre cuentas", async () => {
    const otherAccountId = (await accountService.create("Otro equipo")).id;
    await service.save(accountId, "101", 7, "2026-10-15");

    expect(await service.list(otherAccountId)).toEqual([]);
  });

  it.each([undefined, 123, "15/10/2026", "2026-02-30"])(
    "rechaza la fecha inválida %s",
    async (uploadDate) => {
      await expect(service.save(accountId, "101", 7, uploadDate))
        .rejects.toMatchObject({ status: 400 });
    },
  );
});
