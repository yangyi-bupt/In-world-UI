// Reliable tablet DOM interaction bridge
// Temporary bridge before moving to Three.js raycast input.
(function(){
  function activate(name){
    document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
    const target=document.getElementById(name);
    if(target) target.classList.add('active-view');
    console.log('[tablet] open:', name);
  }

  document.addEventListener('pointerdown', function(e){
    const app=e.target.closest && e.target.closest('.app');
    if(!app) return;
    e.preventDefault();
    e.stopPropagation();
    activate(app.dataset.app);
  }, true);

  console.log('[tablet] working click bridge loaded');
})();
