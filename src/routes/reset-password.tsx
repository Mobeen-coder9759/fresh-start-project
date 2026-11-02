import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { authApi, errorText } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s["token"] === "string" ? s["token"] : "",
  }),
  head: () => ({ meta: [{ title: "Reset Password — Dental Dashboard" }] }),
  component: ResetPassword,
});

function ResetPassword() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate({ to: "/" }), 2500);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const inputCls =
    "w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

  if (!token) {
    return (
      <div className="flex h-dvh items-center justify-center px-4">
        <div className="max-w-sm text-center">
          <p className="text-lg font-semibold text-gray-700">Invalid reset link.</p>
          <p className="mt-2 text-sm text-gray-500">This link is missing a token. Please request a new one.</p>
          <Button className="mt-6" onClick={() => navigate({ to: "/" })}>Back to sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-photo px-4">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-gray-800">
        <h1 className="text-xl font-bold">Set a new password</h1>

        {done ? (
          <p className="mt-4 text-sm text-green-700 font-medium">
            ✓ Password updated! Redirecting you to sign in…
          </p>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            {error && (
              <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</p>
            )}
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">New password (min 10 chars)</label>
              <input
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-500">Confirm new password</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={inputCls}
              />
            </div>
            <Button type="submit" disabled={busy} className="w-full mt-2">
              {busy ? "Updating…" : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
