import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Landing } from "@/routes/index";

vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: unknown) => options,
  useNavigate: () => vi.fn(),
}));

const pause = vi.fn();
beforeEach(() => {
  pause.mockClear();
  vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(pause);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function expectFinal(container: HTMLElement) {
  expect(container.querySelector("video")).toBeNull();
  expect(screen.getByRole("textbox", { name: "Email" })).toBeVisible();
}

describe("Single intro transition", () => {
  it.each(["Enter", "a", "Escape", " "])("instantly skips on global %s input", (key) => {
    const { container } = render(<Landing />);
    fireEvent.keyDown(window, { key });
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
  it("instantly skips on a global mouse press", () => {
    const { container } = render(<Landing />);
    fireEvent.mouseDown(window);
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
  it("shows the final screen when the intro naturally ends", () => {
    const { container } = render(<Landing />);
    const video = container.querySelector("video");
    if (!video) throw new Error("Intro missing");
    fireEvent.ended(video);
    expectFinal(container);
  });
  it("removes skip listeners so final form typing never restarts the transition", () => {
    const { container } = render(<Landing />);
    fireEvent.keyDown(window, { key: "Enter" });
    fireEvent.keyDown(screen.getByRole("textbox", { name: "Email" }), { key: "a" });
    fireEvent.mouseDown(window);
    expect(pause).toHaveBeenCalledTimes(1);
    expectFinal(container);
  });
});
