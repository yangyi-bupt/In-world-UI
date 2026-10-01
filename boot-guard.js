// Startup guard: keep the demo recoverable when a later script throws.
window.addEventListener('error', (event) => {
  console.error('[In-world UI boot error]', event.error || event.message);
  window.__WORLD_BOOT_ERROR__ = event.error || event.message;
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('#startBtn');
  const overlay = document.querySelector('#startOverlay');

  if (!btn) return;

  btn.addEventListener('click', () => {
    console.log('[In-world UI] enter clicked');
    window.__ENTER_CLICKED__ = true;

    // Let app.js handle the real transition if it initialized correctly.
    // This fallback only removes the blocking overlay.
    setTimeout(() => {
      if (window.__WORLD_READY__ !== true && overlay) {
        console.warn('[In-world UI] world init not completed');
      }
    }, 500);
  }, { once: true });
});
