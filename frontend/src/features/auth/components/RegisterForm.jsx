// 2. Dependencias externas.
import { useState } from "react";

const FIELD_CLASSES = "block w-full mt-1 rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";
const LABEL_CLASSES = "block text-[12px] font-semibold text-text-muted mb-3";
const CHOICE_CLASSES = "flex-1 rounded-md border px-3 py-2 text-[12.5px] cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Formulario de alta de cuenta.
 *
 * Hay dos caminos y son excluyentes: sumarse a una cuenta que ya existe con su
 * código de invitación, o abrir una cuenta nueva y quedar su administrador.
 * Quien se suma no configura nada de GitLab: eso ya está en la cuenta.
 *
 * Valida en el navegador lo mismo que el backend para avisar antes de enviar,
 * pero la regla que manda es la del backend.
 */
export function RegisterForm({ error = null, onShowLogin = () => {}, onSubmit = () => {}, submitting = false }) {
  const [joinExisting, setJoinExisting] = useState(true);
  const [inviteCode, setInviteCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [localError, setLocalError] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();

    if (password !== confirmation) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    setLocalError(null);
    onSubmit({
      email: email.trim(),
      password,
      displayName: displayName.trim(),
      // Sólo viaja el dato del camino elegido: con código el backend ignora el
      // nombre, y sin código no hay cuenta a la que sumarse.
      ...(joinExisting ? { inviteCode: inviteCode.trim() } : { accountName: accountName.trim() }),
    });
  }

  const visibleError = localError ?? error;

  /** Clases del botón que elige el camino, según esté activo o no. */
  function choiceClasses(isActive) {
    return `${CHOICE_CLASSES} ${isActive
      ? "border-accent bg-surface-raised font-semibold text-text-primary"
      : "border-control text-text-muted hover:text-text-primary"}`;
  }

  return (
    <form
      aria-labelledby="registro-heading"
      className="w-full max-w-sm mx-auto mt-16 rounded-lg border border-border bg-surface p-6"
      onSubmit={handleSubmit}
    >
      <h1 className="text-lg font-semibold text-text-primary mb-1" id="registro-heading">
        Crear una cuenta
      </h1>
      <p className="text-[12.5px] text-text-muted mb-5">
        Ingresá tu email y una contraseña de al menos {MINIMUM_PASSWORD_LENGTH} caracteres.
      </p>

      {visibleError ? (
        <p className="mb-4 rounded-md border border-conflict bg-conflict-soft px-3 py-2 text-[12.5px] text-text-primary" role="alert">
          {visibleError}
        </p>
      ) : null}

      <fieldset className="mb-4">
        <legend className="text-[12px] font-semibold text-text-muted mb-2">
          ¿Cómo querés entrar?
        </legend>
        <div className="flex gap-2">
          <button
            aria-pressed={joinExisting}
            className={choiceClasses(joinExisting)}
            onClick={() => setJoinExisting(true)}
            type="button"
          >
            Sumarme a un equipo
          </button>
          <button
            aria-pressed={!joinExisting}
            className={choiceClasses(!joinExisting)}
            onClick={() => setJoinExisting(false)}
            type="button"
          >
            Crear un equipo
          </button>
        </div>
      </fieldset>

      {joinExisting ? (
        <>
          <label className={LABEL_CLASSES} htmlFor="registro-invitacion">
            Código de invitación
            <input
              aria-describedby="registro-invitacion-ayuda"
              autoCapitalize="characters"
              className={FIELD_CLASSES}
              id="registro-invitacion"
              name="inviteCode"
              onChange={(event) => setInviteCode(event.target.value)}
              required
              spellCheck="false"
              type="text"
              value={inviteCode}
            />
          </label>
          <p className="-mt-2 mb-3 text-[11.5px] font-normal text-text-faint" id="registro-invitacion-ayuda">
            Te lo da quien administra el tablero de tu equipo. Con él ves los mismos proyectos, sin cargar credenciales de GitLab.
          </p>
        </>
      ) : (
        <>
          <label className={LABEL_CLASSES} htmlFor="registro-cuenta">
            Nombre del equipo (opcional)
            <input
              aria-describedby="registro-cuenta-ayuda"
              className={FIELD_CLASSES}
              id="registro-cuenta"
              maxLength={80}
              name="accountName"
              onChange={(event) => setAccountName(event.target.value)}
              type="text"
              value={accountName}
            />
          </label>
          <p className="-mt-2 mb-3 text-[11.5px] font-normal text-text-faint" id="registro-cuenta-ayuda">
            Vas a quedar administrador: cargás una vez los proyectos y el access token de GitLab, y el resto del equipo se suma con un código.
          </p>
        </>
      )}

      <label className={LABEL_CLASSES} htmlFor="registro-email">
        Email
        <input
          autoCapitalize="none"
          autoComplete="email"
          className={FIELD_CLASSES}
          id="registro-email"
          maxLength={254}
          name="email"
          onChange={(event) => setEmail(event.target.value)}
          required
          spellCheck="false"
          type="email"
          value={email}
        />
      </label>
      <label className={LABEL_CLASSES} htmlFor="registro-nombre">
        Nombre visible (opcional)
        <input
          autoComplete="name"
          className={FIELD_CLASSES}
          id="registro-nombre"
          maxLength={80}
          name="displayName"
          onChange={(event) => setDisplayName(event.target.value)}
          type="text"
          value={displayName}
        />
      </label>

      <label className={LABEL_CLASSES} htmlFor="registro-password">
        Contraseña
        <input
          autoComplete="new-password"
          className={FIELD_CLASSES}
          id="registro-password"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="password"
          onChange={(event) => setPassword(event.target.value)}
          required
          type="password"
          value={password}
        />
      </label>

      <label className={LABEL_CLASSES} htmlFor="registro-confirmacion">
        Repetí la contraseña
        <input
          autoComplete="new-password"
          className={FIELD_CLASSES}
          id="registro-confirmacion"
          minLength={MINIMUM_PASSWORD_LENGTH}
          name="passwordConfirmation"
          onChange={(event) => setConfirmation(event.target.value)}
          required
          type="password"
          value={confirmation}
        />
      </label>

      <button
        className="w-full mt-2 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Creando la cuenta..." : "Crear cuenta"}
      </button>

      <p className="mt-4 text-center text-[12.5px] text-text-muted">
        ¿Ya tenés cuenta?{" "}
        <button
          className="text-accent underline cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          onClick={onShowLogin}
          type="button"
        >
          Ingresar
        </button>
      </p>
    </form>
  );
}
