import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { authApi, errorText } from "@/lib/api";
import toothFinal from "@/assets/tooth-final.png.asset.json";

const INTRO_URL = "https://res.cloudinary.com/r3pb56d2/video/upload/v1792228923/Tooth_Final.mp4";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dental Dashboard — Sign In" },
      { name: "description", content: "Sign in to your dental practice dashboard." },
      { property: "og:title", content: "Dental Dashboard — Sign In" },
      { property: "og:description", content: "Sign in to your dental practice dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

type Stage = "intro" | "final";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// ---- Forgot Password dialog ----
function ForgotPasswordDialog({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (e) {
      setErr(errorText(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl text-gray-800">
        <h2 className="text-xl font-bold mb-1">Reset your password</h2>
        {sent ? (
          <>
            <p className="text-sm text-gray-600 mt-2">
              If that account exists, we've sent a reset link to <strong>{email}</strong>. Check your inbox (and spam).
            </p>
            <Button className="mt-6 w-full" onClick={onClose}>Back to sign in</Button>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <p className="text-sm text-gray-500">Enter the email address on your account and we'll send a reset link.</p>
            {err && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-600">{err}</p>}
            <input
              type="email"
              required
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
              <Button type="submit" disabled={busy} className="flex-1">{busy ? "Sending…" : "Send link"}</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function Landing() {
  const [stage, setStage] = useState<Stage>("intro");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [socialToast, setSocialToast] = useState<string | null>(null);

  const navigate = useNavigate();
  const { login } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);

  const finishIntro = useCallback(() => {
    videoRef.current?.pause();
    setStage("final");
  }, []);

  useLayoutEffect(() => {
    const bootstrap = window.__landingIntroBootstrap;
    bootstrap?.dispose();
    delete window.__landingIntroBootstrap;
    if (bootstrap?.skipped) finishIntro();
  }, [finishIntro]);

  useEffect(() => {
    if (stage !== "intro") {
      document.documentElement.removeAttribute("data-intro-skipped");
      return;
    }
    const events = ["keydown", "keyup", "keypress", "mousedown", "pointerdown"] as const;
    const targets: EventTarget[] = [window, document];
    let done = false;
    const onInput = (event: Event) => {
      if (done) return;
      done = true;
      event.preventDefault();
      finishIntro();
    };
    targets.forEach((t) => events.forEach((e) => t.addEventListener(e, onInput, true)));
    return () => {
      targets.forEach((t) => events.forEach((e) => t.removeEventListener(e, onInput, true)));
    };
  }, [stage, finishIntro]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password, remember);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(errorText(err));
    } finally {
      setSubmitting(false);
    }
  };

  const showSocialToast = (provider: string) => {
    setSocialToast(`${provider} sign-in coming soon!`);
    setTimeout(() => setSocialToast(null), 3000);
  };

  const inputCls = "signin-input w-full rounded-2xl px-4 py-3 outline-none transition-[border-color,box-shadow]";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-photo outline-none">
      <img
        src={toothFinal.url}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover"
      />

      {stage === "intro" && (
        <>
          <video
            data-intro-video
            data-intro-layer
            ref={videoRef}
            src={INTRO_URL}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={finishIntro}
            onError={finishIntro}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div data-intro-layer className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center px-4">
            <p className="signin-skip text-center text-sm">Press Enter or click anywhere to skip intro</p>
          </div>
        </>
      )}

      <div data-signin-layer data-intro-active={stage === "intro" ? "true" : undefined} className="absolute inset-0 flex items-center justify-center overflow-y-auto px-4">
        <form
          onSubmit={onSubmit}
          className="relative w-full max-w-md rounded-3xl bg-transparent p-8 text-ink"
        >
          <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
          <p className="mt-1 text-center text-sm text-ink">Sign in to your dental dashboard</p>

          {error && (
            <div className="mt-3 rounded-2xl bg-destructive/20 p-3 text-center text-xs font-medium text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-4">
            <input
              type="text"
              aria-label="Username"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username or email"
              className={inputCls}
            />
            <input
              type="password"
              aria-label="Password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={inputCls}
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="size-4 accent-signin-neon"
              />{" "}
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setShowForgot(true)}
              className="text-ink hover:underline focus:outline-none"
            >
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            variant="signin"
            disabled={submitting}
            className="mt-6 w-full"
          >
            {submitting ? "Signing In..." : "Sign In"}
          </Button>

          <div className="my-6 flex items-center gap-3 text-xs text-ink">
            <span className="h-px flex-1 bg-ink/25" /> Or continue with <span className="h-px flex-1 bg-ink/25" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="signinSocial" className="w-full" onClick={() => showSocialToast("Google")}>
              <GoogleIcon /> Google
            </Button>
            <Button type="button" variant="signinSocial" className="w-full" onClick={() => showSocialToast("SSO")}>
              <KeyRound className="size-4 text-signin-soft" /> SSO
            </Button>
          </div>
        </form>
      </div>

      {showForgot && <ForgotPasswordDialog onClose={() => setShowForgot(false)} />}

      {socialToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-2xl bg-gray-900 px-5 py-3 text-sm text-white shadow-xl z-50">
          {socialToast}
        </div>
      )}
    </div>
  );
}
