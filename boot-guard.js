// Startup guard: expose initialization failures without leaving a black screen.
window.addEventListener('error', (event) => {
  const err = event.error || event.message;
  console.error('[In-world UI boot error]', err);
  window.__WORLD_BOOT_ERROR__ = err;

  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:9999;max-width:80vw;padding:16px;border-radius:12px;background:#220b0b;color:#ffcccc;font:13px monospace;white-space:pre-wrap;';
  panel.textContent = '[BOOT ERROR]\n' + (err?.stack || err);
  document.body.appendChild(panel);
});

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.querySelector('#startBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    console.log('[In-world UI] enter clicked');
    window.__ENTER_CLICKED__ = true;
  }, { once: true });
});
