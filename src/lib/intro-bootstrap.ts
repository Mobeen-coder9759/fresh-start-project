// Runs inline before application modules load; contains no server-side effects.
export const introBootstrapScript = `(() => {
  if (window.location.pathname !== '/') return;
  const state = { skipped: false, dispose };
  function dispose() {
    window.removeEventListener('keydown', skip, true);
    window.removeEventListener('mousedown', skip, true);
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
  window.addEventListener('keydown', skip, true);
  window.addEventListener('mousedown', skip, true);
})();`;

declare global {
  interface Window {
    __landingIntroBootstrap?: { skipped: boolean; dispose: () => void };
  }
}