import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
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

export function Landing() {
  const [stage, setStage] = useState<Stage>("intro");
  const navigate = useNavigate();
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
    window.addEventListener("keydown", finishIntro);
    window.addEventListener("mousedown", finishIntro);
    return () => {
      window.removeEventListener("keydown", finishIntro);
      window.removeEventListener("mousedown", finishIntro);
    };
  }, [stage, finishIntro]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  const inputCls = "signin-input w-full rounded-2xl px-4 py-3 outline-none transition-[border-color,box-shadow]";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-photo outline-none">
      <img
        src={toothFinal.url}
        alt=""
        aria-hidden="true"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover object-center"
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

            <div className="mt-6 space-y-4">
              <input type="email" aria-label="Email" autoComplete="email" required placeholder="Email" className={inputCls} />
              <input type="password" aria-label="Password" autoComplete="current-password" required placeholder="Password" className={inputCls} />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-ink">
                <input type="checkbox" className="size-4 accent-signin-neon" /> Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-ink hover:text-ink">
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              variant="signin"
              className="mt-6 w-full"
            >
              Sign In
            </Button>

            <div className="my-6 flex items-center gap-3 text-xs text-ink">
              <span className="h-px flex-1 bg-ink/25" /> Or continue with <span className="h-px flex-1 bg-ink/25" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button type="button" variant="signinSocial" className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                <GoogleIcon /> Google
              </Button>
              <Button type="button" variant="signinSocial" className="w-full" onClick={() => navigate({ to: "/dashboard" })}>
                <KeyRound className="size-4 text-signin-soft" /> SSO
              </Button>
            </div>
          </form>
        </div>
    </div>
  );
}
