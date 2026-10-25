import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Landing } from "@/routes/index";
import { introBootstrapScript } from "@/lib/intro-bootstrap";
import { AuthProvider } from "@/lib/auth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useNavigate: () => vi.fn(),
}));

const pause = vi.fn();
beforeEach(() => {
  pause.mockClear();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
});
afterEach(() => {
  cleanup();
  window.__landingIntroBootstrap?.dispose();
  delete window.__landingIntroBootstrap;
  document.documentElement.removeAttribute("data-intro-skipped");
  vi.restoreAllMocks();
});

function renderLanding() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <AuthProvider>
        <Landing />
      </AuthProvider>
    </QueryClientProvider>,
  );
}

function expectFinal(container: HTMLElement) {
  expect(container.querySelector("video")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Username" })).toBeVisible();
}

describe("Single intro transition", () => {
  it("captures Enter before React mounts and hands off to the final form", () => {
    window.eval(introBootstrapScript);
    fireEvent.keyDown(window, { key: "Enter" });
    expect(window.__landingIntroBootstrap?.skipped).toBe(true);
    expect(document.documentElement.hasAttribute("data-intro-skipped")).toBe(true);
    const { container } = renderLanding();
    expectFinal(container);
    expect(window.__landingIntroBootstrap).toBeUndefined();
    fireEvent.keyDown(window, { key: "Enter" });
    expect(pause).toHaveBeenCalledTimes(1);
  });
  it.each(["Enter", "a", "Escape", " "])("instantly skips on global %s input", (key) => {
    const { container } = renderLanding();
    fireEvent.keyDown(window, { key });
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
  it("still skips on Enter when another script swallows the keydown", () => {
    const swallow = (e: KeyboardEvent) => e.stopImmediatePropagation();
    document.body.addEventListener("keydown", swallow, true);
    const { container } = renderLanding();
    fireEvent.keyDown(document.body, { key: "Enter" });
    fireEvent.keyUp(document.body, { key: "Enter" });
    document.body.removeEventListener("keydown", swallow, true);
    expectFinal(container);
  });
  it("instantly skips on a global mouse press", () => {
    const { container } = renderLanding();
    fireEvent.mouseDown(window);
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
  it("shows the final screen when the intro naturally ends", () => {
    const { container } = renderLanding();
    const video = container.querySelector("video");
    if (!video) throw new Error("Intro missing");
    fireEvent.ended(video);
    expectFinal(container);
  });
  it("removes skip listeners so final form typing never restarts the transition", () => {
    const { container } = renderLanding();
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Username" }), { key: "a" });
    fireEvent.mouseDown(window);
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
});
