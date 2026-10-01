// Last-resort tablet input bridge
// Uses screen-local hit testing instead of relying on bubbling through WebGL layers.
(() => {
  function activate(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    const target=document.getElementById(name);
    if(target) target.classList.add('active-view');
    console.log('[tablet] activate:', name);
  }

  const screen = document.getElementById('screen');
  if(!screen) return;

  screen.addEventListener('pointerdown', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    const hit = document.elementFromPoint(x,y);
    const app = hit && hit.closest('.app');
    if(app){
      activate(app.dataset.app);
      e.preventDefault();
      e.stopPropagation();
    }
  }, false);

  console.log('[tablet] emergency bridge ready');
})();
