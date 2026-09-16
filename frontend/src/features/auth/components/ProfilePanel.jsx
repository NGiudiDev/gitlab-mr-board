import { useEffect, useState } from "react";

/**
 * Permite editar el nombre visible y el email de la propia persona.
 */
export function ProfilePanel({
  onSave = async () => null,
  submitting = false,
  user = null,
}) {
  const [profile, setProfile] = useState({ displayName: "", email: "" });
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    setProfile({
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
    });
  }, [user?.displayName, user?.email]);

  if (!user) return null;

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const failure = await onSave({
      displayName: profile.displayName.trim(),
      email: profile.email.trim(),
    });

    if (failure) {
      setError(failure);
      return;
    }

    setNotice("Perfil actualizado.");
  }

  return (
    <section aria-labelledby="perfil-heading">
      <h2 className="mb-1 text-base font-semibold text-text-primary" id="perfil-heading">
        Mi perfil
      </h2>
      <p className="mb-4 text-[12.5px] text-text-muted">
        Estos datos identifican tu sesión. Si cambiás el email, usá el nuevo la próxima vez que ingreses.
      </p>

      <form onSubmit={handleSubmit}>
        <label className="mb-3 block text-[12px] font-semibold text-text-muted" htmlFor="perfil-email">
          Email
          <input
            autoCapitalize="none"
            autoComplete="email"
            className="mt-1 block w-full rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            disabled={submitting}
            id="perfil-email"
            maxLength={254}
            name="email"
            onChange={(event) => setProfile((current) => ({ ...current, email: event.target.value }))}
            required
            spellCheck="false"
            type="email"
            value={profile.email}
          />
        </label>

        <label className="mb-1 block text-[12px] font-semibold text-text-muted" htmlFor="perfil-display-name">
          Nombre visible
          <input
            autoComplete="name"
            className="mt-1 block w-full rounded-md border border-control bg-surface-raised px-3 py-2 text-[13px] font-normal text-text-primary disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            disabled={submitting}
            id="perfil-display-name"
            name="displayName"
            onChange={(event) => setProfile((current) => ({ ...current, displayName: event.target.value }))}
            type="text"
            value={profile.displayName}
          />
        </label>

        {error ? <p className="mt-3 text-xs text-conflict" role="alert">{error}</p> : null}
        
        {notice ? <p className="mt-3 text-xs text-ready" role="status">{notice}</p> : null}

        <button
          className="mt-4 rounded-md bg-accent px-3 py-2 text-[13px] font-semibold text-bg disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Guardando…" : "Guardar perfil"}
        </button>
      </form>
    </section>
  );
}
