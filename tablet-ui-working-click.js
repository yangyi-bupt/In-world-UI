// Reliable tablet interaction bridge
// Combined fallback: works even when WebGL layers capture pointer events.
(function(){
  function activate(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    const target=document.getElementById(name);
    if(target) target.classList.add('active-view');
    console.log('[tablet] open:', name);
  }

  function handle(e){
    const hit = document.elementFromPoint(e.clientX, e.clientY);
    const app = hit && hit.closest && hit.closest('.app');
    if(!app) return;
    activate(app.dataset.app);
    e.preventDefault();
    e.stopPropagation();
  }

  // Capture at document level. Do not rely on screen bubbling.
  document.addEventListener('pointerdown', handle, true);

  console.log('[tablet] working click bridge loaded');
})();
