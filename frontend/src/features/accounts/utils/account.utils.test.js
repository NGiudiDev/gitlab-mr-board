import { describe, expect, it } from "vitest";

import { formatAccountName, formatMemberCount } from "./account.utils.js";

describe("formatAccountName", () => {
  it("usa el nombre de la cuenta cuando ya llegó", () => {
    expect(formatAccountName({ name: "Equipo tablero" }, true)).toBe("Equipo tablero");
  });

  it("distingue la carga en curso de la cuenta ausente", () => {
    expect(formatAccountName(null, true)).toBe("Cargando…");
    expect(formatAccountName(null)).toBe("No disponible");
  });
});

describe("formatMemberCount", () => {
  it("usa el singular con una sola persona", () => {
    expect(formatMemberCount(1)).toBe("1 persona");
  });

  it("usa el plural en el resto de los casos", () => {
    expect(formatMemberCount(0)).toBe("0 personas");
    expect(formatMemberCount(4)).toBe("4 personas");
  });
});
