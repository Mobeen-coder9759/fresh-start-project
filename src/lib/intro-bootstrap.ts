// Runs inline before application modules load; contains no server-side effects.
// Listens in the capture phase on both window and document, for keydown, keyup and keypress,
// so Enter still skips even if another script swallows one of those events first.
export const introBootstrapScript = `(() => {
  if (window.location.pathname !== '/') return;
  const events = ['keydown', 'keyup', 'keypress', 'mousedown', 'pointerdown'];
  const targets = [window, document];
  const state = { skipped: false, dispose };
  function dispose() {
    targets.forEach((t) => events.forEach((e) => t.removeEventListener(e, skip, true)));
  }
  function skip(event) {
    if (state.skipped) return;
    state.skipped = true;
    dispose();
    event.preventDefault();
    document.documentElement.setAttribute('data-intro-skipped', '');
    const video = document.querySelector('[data-intro-video]');
    if (video) video.pause();
  }
  window.__landingIntroBootstrap = state;
  targets.forEach((t) => events.forEach((e) => t.addEventListener(e, skip, true)));
})();`;

declare global {
  interface Window {
    __landingIntroBootstrap?: { skipped: boolean; dispose: () => void };
  }
}
