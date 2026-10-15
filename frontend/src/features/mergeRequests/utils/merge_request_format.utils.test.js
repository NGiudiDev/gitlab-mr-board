import { describe, expect, it } from "vitest";

import {
  formatMergeRequestDateTime,
  formatRelativeTime,
} from "./merge_request_format.utils.js";

describe("formatMergeRequestDateTime", () => {
  it("presenta la fecha y la hora para Argentina", () => {
    const formattedDate = formatMergeRequestDateTime("2026-10-10T15:30:00");

    expect(formattedDate).toContain("10 oct 2026");
    expect(formattedDate).toMatch(/(?:3|15):30/);
  });
});

describe("formatRelativeTime", () => {
  const currentTime = new Date("2026-10-10T15:00:00Z").getTime();

  it("muestra minutos para una actualización reciente", () => {
    expect(formatRelativeTime("2026-10-10T14:45:00Z", currentTime)).toBe("15m");
  });

  it("muestra horas para una actualización del mismo día", () => {
    expect(formatRelativeTime("2026-10-10T12:00:00Z", currentTime)).toBe("3h");
  });

  it("muestra días para una actualización anterior", () => {
    expect(formatRelativeTime("2026-10-08T15:00:00Z", currentTime)).toBe("2d");
  });
});
