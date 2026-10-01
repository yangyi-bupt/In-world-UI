// Fix tablet app interactions after 3D screen integration.
// The 3D tablet layer can sit above the original DOM UI, so make the
// interactive screen area explicitly receive pointer events.
(function(){
  function install(){
    const screen = document.querySelector('#screen');
    if(!screen) return;

    screen.style.pointerEvents = 'auto';
    screen.style.cursor = 'pointer';

    document.querySelectorAll('#screen .app').forEach(btn=>{
      btn.style.pointerEvents = 'auto';
      btn.addEventListener('pointerdown', e=>{
        e.stopPropagation();
      });
      btn.addEventListener('click', e=>{
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.app;
        document.querySelectorAll('.view').forEach(v=>{
          v.classList.toggle('active-view', v.id === id);
        });
        document.querySelectorAll('#screen .app').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
      });
    });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', install);
  }else{
    install();
  }
})();
