import { describe, expect, it, vi } from "vitest";

import { createPasswordResetMailer, createPasswordResetMessage } from "./passwordResetMailer.js";

const RESET_URL = "http://localhost:5173/reset-password?token=token-de-prueba";

describe("createPasswordResetMessage", () => {
  it("genera el asunto y el contenido en español", () => {
    const message = createPasswordResetMessage({
      from: "Tablero <no-reply@example.com>",
      to: "ana@example.com",
      resetUrl: RESET_URL,
      expiresInMinutes: 30,
    });

    expect(message.subject).toContain("Restablecé tu contraseña");
    expect(message.text).toContain(RESET_URL);
    expect(message.text).toContain("30 minutos");
    expect(message.html).toContain(RESET_URL);
  });
});

describe("createPasswordResetMailer", () => {
  it("usa SMTP en producción", async () => {
    const sendMail = vi.fn(async () => ({}));
    const createTransport = vi.fn(() => ({ sendMail }));
    const mailer = createPasswordResetMailer({
      deliveryEnabled: true,
      from: "Tablero <no-reply@example.com>",
      host: "smtp.example.com",
      port: 465,
      secure: true,
      user: "smtp-user",
      password: "smtp-password",
      createTransport,
    });

    await mailer.send({ to: "ana@example.com", resetUrl: RESET_URL, expiresInMinutes: 30 });

    expect(createTransport).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 465,
      secure: true,
      auth: { user: "smtp-user", pass: "smtp-password" },
    });
    expect(sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: "ana@example.com" }));
  });

  it("en desarrollo genera el mensaje sin enviarlo por SMTP", async () => {
    const sendMail = vi.fn(async () => ({}));
    const createTransport = vi.fn(() => ({ sendMail }));
    const logger = { info: vi.fn() };
    const mailer = createPasswordResetMailer({
      deliveryEnabled: false,
      from: "GitLab MR Board <no-reply@localhost>",
      host: "",
      port: 587,
      secure: false,
      user: "",
      password: "",
      createTransport,
      logger,
    });

    await mailer.send({ to: "ana@example.com", resetUrl: RESET_URL, expiresInMinutes: 30 });

    expect(createTransport).toHaveBeenCalledWith({ jsonTransport: true });
    expect(sendMail).toHaveBeenCalledTimes(1);
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("correo no enviado"));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining(RESET_URL));
  });
});
