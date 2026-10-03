import path from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const environmentFilePath = path.resolve(currentDirectory, "..", ".env");

dotenv.config({ path: environmentFilePath });

const isProduction = process.env.NODE_ENV === "production";
const requiredEnvironmentVariables = [
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  ...(isProduction ? ["FRONTEND_BASE_URL", "MAIL_FROM", "SMTP_HOST"] : []),
];

const missingEnvironmentVariables = requiredEnvironmentVariables.filter((key) => !process.env[key]);

if (missingEnvironmentVariables.length > 0) {
  console.error(`Faltan variables de entorno obligatorias: ${missingEnvironmentVariables.join(", ")}`);
  console.error("Copiá .env.example como .env y completá los valores.");

  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
const encryptionKey = process.env.ENCRYPTION_KEY;

if (!databaseUrl || !encryptionKey) {
  throw new Error("La configuración obligatoria no está disponible.");
}

/**
 * Convierte una variable numérica y conserva el valor predeterminado cuando
 * está vacía, no es un número o vale cero.
 */
function parseIntegerOrDefault(value, defaultValue) {
  return Number.parseInt(value ?? "", 10) || defaultValue;
}

/** Valida una URL pública HTTP(S) y elimina sus barras finales. */
function parseHttpUrl(value, variableName) {
  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    return url.toString().replace(/\/+$/, "");
  } catch {
    throw new Error(`${variableName} debe ser una URL HTTP(S) válida.`);
  }
}

const smtpUser = process.env.SMTP_USER || "";
const smtpPassword = process.env.SMTP_PASSWORD || "";

if (Boolean(smtpUser) !== Boolean(smtpPassword)) {
  throw new Error("SMTP_USER y SMTP_PASSWORD deben configurarse juntos.");
}

const config = {
  // La instancia de GitLab es una sola para todo el tablero; el token y los
  // proyectos, en cambio, los configura cada persona desde «Mi cuenta».
  gitlabBaseUrl: (process.env.GITLAB_BASE_URL || "https://gitlab.com").replace(/\/+$/, ""),
  port: parseIntegerOrDefault(process.env.PORT, 3001),
  cacheTtlMs: parseIntegerOrDefault(process.env.POLL_CACHE_TTL_MS, 60_000),
  teamLeadUsername: process.env.TEAM_LEAD_USERNAME || "NGiudi",
  minApprovals: parseIntegerOrDefault(process.env.MIN_APPROVALS, 2),
  // Cadena de conexión de Neon. Conviene la del pooler: el backend abre un
  // pool propio y las conexiones directas de Postgres son un recurso escaso.
  databaseUrl,
  sessionDurationDays: parseIntegerOrDefault(process.env.SESSION_DURATION_DAYS, 7),
  passwordResetDurationMinutes: parseIntegerOrDefault(process.env.PASSWORD_RESET_DURATION_MINUTES, 30),
  frontendBaseUrl: parseHttpUrl(
    process.env.FRONTEND_BASE_URL || "http://localhost:5173",
    "FRONTEND_BASE_URL",
  ),
  // La cookie de sesión sólo puede exigir HTTPS donde efectivamente lo hay.
  cookieSecure: (process.env.COOKIE_SECURE || String(isProduction)) === "true",
  mail: {
    deliveryEnabled: isProduction,
    from: process.env.MAIL_FROM || "GitLab MR Board <no-reply@localhost>",
    host: process.env.SMTP_HOST || "",
    port: parseIntegerOrDefault(process.env.SMTP_PORT, 587),
    secure: process.env.SMTP_SECURE === "true",
    user: smtpUser,
    password: smtpPassword,
  },
  // Cifra los access token de GitLab guardados en la base. Cambiarla vuelve
  // ilegibles los tokens ya guardados: hay que cargarlos de nuevo.
  encryptionKey,
};

export default config;
