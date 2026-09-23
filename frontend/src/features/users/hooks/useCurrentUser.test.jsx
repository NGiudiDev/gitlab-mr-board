import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  jsonResponse,
  resetSharedState,
  signInTestUser,
  TEST_USER,
} from "../../../../test/sharedState.js";
import { getState } from "../../auth/hooks/useSession.js";
import { useCurrentUser } from "./useCurrentUser.js";

let fetchMock;

beforeEach(() => {
  resetSharedState();
  signInTestUser();
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useCurrentUser", () => {
  it("guarda el perfil y sincroniza la identidad de la sesión", async () => {
    const updated = { ...TEST_USER, email: "anita@example.com", displayName: "Anita" };
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: updated }));
    const { result } = renderHook(() => useCurrentUser());

    let failure;
    await act(async () => {
      failure = await result.current.saveProfile({
        email: "anita@example.com",
        displayName: "Anita",
      });
    });

    expect(failure).toBeNull();
    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/api/users/me/profile", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "anita@example.com", displayName: "Anita" }),
    });
    expect(getState().user).toEqual(updated);
    expect(result.current.submitting).toBe(false);
  });

  it("guarda el nickname de GitLab", async () => {
    const updated = { ...TEST_USER, gitlabUsername: "otro-nick" };
    fetchMock.mockResolvedValueOnce(jsonResponse({ user: updated }));
    const { result } = renderHook(() => useCurrentUser());

    await act(async () => {
      expect(await result.current.saveGitlabUsername("otro-nick")).toBeNull();
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/api/users/me/gitlab-username", {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gitlabUsername: "otro-nick" }),
    });
    expect(getState().user).toEqual(updated);
  });

  it("devuelve errores del backend y de red", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "El email ya existe." }, 409))
      .mockRejectedValueOnce(new Error("sin red"));
    const { result } = renderHook(() => useCurrentUser());

    await act(async () => {
      expect(await result.current.saveProfile(TEST_USER)).toBe("El email ya existe.");
      expect(await result.current.saveGitlabUsername("otro-nick"))
        .toBe("No se pudo conectar al backend.");
    });
  });
});
