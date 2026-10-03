import nodemailer from "nodemailer";

const SUBJECT = "Restablecé tu contraseña de GitLab MR Board";

/**
 * Construye el correo de restablecimiento en texto y HTML.
 *
 * @param options Destinatario, enlace y vigencia del enlace.
 * @returns Contenido listo para entregar a Nodemailer.
 */
function createPasswordResetMessage({ from, to, resetUrl, expiresInMinutes }) {
  const expirationText = `El enlace vence en ${expiresInMinutes} minutos y sólo se puede usar una vez.`;

  return {
    from,
    to,
    subject: SUBJECT,
    text: [
      "Recibimos una solicitud para restablecer tu contraseña de GitLab MR Board.",
      "",
      `Abrí este enlace para elegir una nueva: ${resetUrl}`,
      "",
      expirationText,
      "Si no hiciste la solicitud, ignorá este mensaje.",
    ].join("\n"),
    html: `
      <p>Recibimos una solicitud para restablecer tu contraseña de GitLab MR Board.</p>
      <p><a href="${resetUrl}">Elegir una nueva contraseña</a></p>
      <p>${expirationText}</p>
      <p>Si no hiciste la solicitud, ignorá este mensaje.</p>
    `,
  };
}

/**
 * Crea el emisor SMTP de restablecimientos.
 *
 * En desarrollo usa el transporte JSON de Nodemailer: genera el mensaje sin
 * abrir una conexión ni enviar un correo, y deja el enlace en la terminal.
 *
 * @param options Configuración SMTP y dependencias inyectables para los test.
 * @returns Emisor con una operación `send`.
 */
function createPasswordResetMailer(options) {
  const {
    deliveryEnabled,
    from,
    host,
    port,
    secure,
    user,
    password,
    createTransport = nodemailer.createTransport,
    logger = console,
  } = options;

  const transport = deliveryEnabled
    ? createTransport({
        host,
        port,
        secure,
        ...(user ? { auth: { user, pass: password } } : {}),
      })
    : createTransport({ jsonTransport: true });

  return {
    async send({ to, resetUrl, expiresInMinutes }) {
      await transport.sendMail(createPasswordResetMessage({
        from,
        to,
        resetUrl,
        expiresInMinutes,
      }));

      if (!deliveryEnabled) {
        logger.info(`Restablecimiento local para ${to} (correo no enviado): ${resetUrl}`);
      }
    },
  };
}

export { createPasswordResetMailer, createPasswordResetMessage };
