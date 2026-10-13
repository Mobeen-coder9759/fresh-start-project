import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { KeyRound } from "lucide-react";
import toothFinal from "@/assets/tooth-final.png.asset.json";

const LOOP_URL = "https://res.cloudinary.com/r3pb56d2/video/upload/v1791873918/Tooth_Rotation.mp4";
const ZOOM_URL = "https://res.cloudinary.com/r3pb56d2/video/upload/v1791873855/Tooth_Zoom_in.mp4";

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

type Stage = 1 | 2 | 3;

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

function Landing() {
  const [stage, setStage] = useState<Stage>(1);
  const navigate = useNavigate();

  const advance = useCallback(() => setStage((s) => (s === 1 ? 2 : s)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") advance();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate({ to: "/dashboard" });
  };

  const inputCls =
    "w-full rounded-2xl bg-[#262626] border border-purple-500/40 shadow-[0_0_12px_rgba(168,85,247,0.35)] focus:border-purple-400 focus:shadow-[0_0_18px_rgba(168,85,247,0.6)] text-white placeholder:text-zinc-400 outline-none px-4 py-3 transition-[border-color,box-shadow]";
  const socialCls =
    "w-full bg-zinc-700/60 hover:bg-zinc-700/80 border border-zinc-500/30 text-white rounded-2xl py-2.5 flex items-center justify-center gap-2 transition-colors text-sm";

  return (
    <div
      className="relative h-screen w-full overflow-hidden bg-black"
      onClick={stage === 1 ? advance : undefined}
    >
      {/* Stage 3 background */}
      <div
        className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${stage === 3 ? "opacity-100" : "opacity-0"}`}
        style={{ backgroundImage: `url(${toothFinal.url})` }}
      />

      {/* Stage 1 loop */}
      <video
        src={LOOP_URL}
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${stage === 1 ? "opacity-100" : "opacity-0"}`}
      />

      {/* Stage 2 zoom (once) */}
      {stage >= 2 && (
        <video
          src={ZOOM_URL}
          autoPlay
          muted
          playsInline
          onEnded={() => setStage(3)}
          onError={() => setStage(3)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${stage === 2 ? "opacity-100" : "opacity-0"}`}
        />
      )}

      {stage === 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-12 flex justify-center">
          <p className="animate-pulse rounded-full bg-black/40 px-5 py-2 text-sm tracking-wide text-purple-100/90 backdrop-blur-sm">
            Press <kbd className="mx-1 rounded border border-purple-300/50 px-1.5 font-mono text-xs">Enter</kbd> or Click anywhere to continue
          </p>
        </div>
      )}

      {stage === 3 && (
        <div className="absolute inset-0 flex items-center justify-center px-4 animate-rise">
          {/* Soft halo so the white text stays readable over the light image */}
          <div
            aria-hidden
            className="pointer-events-none absolute h-[560px] w-[560px] max-w-[92vw] rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, rgba(9,9,11,0.7) 0%, rgba(9,9,11,0.34) 46%, rgba(9,9,11,0) 72%)",
            }}
          />
          <form
            onSubmit={onSubmit}
            className="relative w-full max-w-md rounded-3xl bg-zinc-900/10 p-8 text-white backdrop-blur-sm"
          >
            <h1 className="text-center font-display text-2xl font-bold">Welcome back</h1>
            <p className="mt-1 text-center text-sm text-purple-200/70">Sign in to your dental dashboard</p>

            <div className="mt-6 space-y-4">
              <input type="email" required placeholder="Email" className={inputCls} />
              <input type="password" required placeholder="Password" className={inputCls} />
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-purple-200/70">
                <input type="checkbox" className="size-4 accent-purple-500" /> Remember me
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-purple-200/70 hover:text-purple-200">
                Forgot Password?
              </a>
            </div>

            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-purple-600/30 hover:opacity-95"
            >
              Sign In
            </button>

            <div className="my-6 flex items-center gap-3 text-xs text-purple-200/70">
              <span className="h-px flex-1 bg-purple-200/25" /> Or continue with <span className="h-px flex-1 bg-purple-200/25" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => navigate({ to: "/dashboard" })} className={socialCls}>
                <GoogleIcon /> Google
              </button>
              <button type="button" onClick={() => navigate({ to: "/dashboard" })} className={socialCls}>
                <KeyRound className="size-4 text-purple-300" /> SSO
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
