/**
 * Password-reset flow against Aurex-backend: /auth/forgot-password emails a
 * token link, /auth/reset-password/validate checks that token before the
 * form is shown, /auth/reset-password consumes it.
 */

import { apiFetch } from "@/lib/api/client";

export async function requestPasswordReset(email: string): Promise<void> {
  await apiFetch("/auth/forgot-password", { method: "POST", body: { email } });
}

/** Resolves true when the token is still usable; any API error means it isn't. */
export async function validateResetToken(token: string): Promise<boolean> {
  try {
    const { data } = await apiFetch<{ valid?: boolean } | null>("/auth/reset-password/validate", {
      method: "POST",
      body: { token },
    });
    return data?.valid !== false;
  } catch {
    return false;
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiFetch("/auth/reset-password", { method: "POST", body: { token, newPassword } });
}
