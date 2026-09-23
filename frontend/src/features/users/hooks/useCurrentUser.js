import { useState } from "react";

import { config } from "../../../config.js";

import { updateSessionUser } from "../../auth/hooks/useSession.js";

const NETWORK_ERROR_MESSAGE = "No se pudo conectar al backend.";

async function readErrorMessage(response) {
  const body = await response.json().catch(() => ({}));
  return body.error || `Error ${response.status}`;
}

/** Administra los datos editables de la persona conectada. */
function useCurrentUser() {
  const [submitting, setSubmitting] = useState(false);

  async function save(path, method, body) {
    setSubmitting(true);

    try {
      const response = await fetch(`${config.apiBaseUrl}/api/users/me/${path}`, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) return await readErrorMessage(response);

      const { user } = await response.json();
      updateSessionUser(user);
      return null;
    } catch {
      return NETWORK_ERROR_MESSAGE;
    } finally {
      setSubmitting(false);
    }
  }

  return {
    saveGitlabUsername: (gitlabUsername) => save(
      "gitlab-username",
      "PUT",
      { gitlabUsername },
    ),
    saveProfile: (profile) => save("profile", "PATCH", profile),
    submitting,
  };
}

export { useCurrentUser };
