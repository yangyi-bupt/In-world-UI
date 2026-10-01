// Final tablet click bridge
// Uses event delegation because the tablet UI is layered with WebGL/3D elements.
(() => {
  function openApp(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    const target=document.getElementById(name);
    if(target) target.classList.add('active-view');
    console.log('[tablet] open app:', name);
  }

  document.addEventListener('pointerdown', (e)=>{
    const app=e.target.closest?.('.app');
    if(!app) return;
    e.preventDefault();
    e.stopPropagation();
    openApp(app.dataset.app);
  }, true);

  window.addEventListener('load',()=>{
    console.log('[tablet] final click bridge ready');
  });
})();
