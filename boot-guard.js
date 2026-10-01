// Startup guard: expose initialization failures without leaving a black screen.
(function(){
  function showError(title, detail){
    console.error(title, detail);
    window.__WORLD_BOOT_ERROR__ = detail;

    const old = document.querySelector('#bootErrorPanel');
    if(old) old.remove();

    const panel = document.createElement('div');
    panel.id='bootErrorPanel';
    panel.style.cssText='position:fixed;left:20px;bottom:20px;z-index:9999;max-width:80vw;padding:16px;border-radius:12px;background:#220b0b;color:#ffcccc;font:13px monospace;white-space:pre-wrap;';
    panel.textContent='[BOOT ERROR]\n'+title+'\n'+detail;
    document.body.appendChild(panel);
  }

  window.addEventListener('error', (event) => {
    const detail = [
      'message: '+(event.message || 'unknown'),
      'file: '+(event.filename || 'unknown'),
      'line: '+(event.lineno || '?')+':'+(event.colno || '?'),
      event.error?.stack || '',
      'target: '+(event.target?.src || event.target?.href || '')
    ].join('\n');

    showError('runtime error', detail);
  }, true);

  window.addEventListener('unhandledrejection', (event)=>{
    showError('promise rejection', event.reason?.stack || String(event.reason));
  });

  window.addEventListener('DOMContentLoaded', () => {
    const btn = document.querySelector('#startBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      console.log('[In-world UI] enter clicked');
      window.__ENTER_CLICKED__ = true;
    }, { once:true });
  });
})();
