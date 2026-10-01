// Direct tablet UI click bridge.
// The current tablet has both WebGL and DOM layers. This bridges clicks
// from the visible tablet screen to the existing view switcher.
(function(){
  function install(){
    const screen = document.querySelector('#screen');
    if(!screen) return;

    screen.addEventListener('pointerdown', function(e){
      const app = e.target.closest && e.target.closest('.app');
      if(!app) return;
      e.preventDefault();
      e.stopPropagation();
      const id = app.dataset.app;
      document.querySelectorAll('#screen .view').forEach(v=>{
        v.classList.toggle('active-view', v.id === id);
      });
      console.log('[tablet] open app:', id);
    }, true);

    screen.style.zIndex = '50';
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', install);
  } else {
    install();
  }
})();
