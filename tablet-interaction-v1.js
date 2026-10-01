(function(){
  function install(){
    if(window.__tabletInteractionInstalled) return;
    window.__tabletInteractionInstalled=true;

    window.addEventListener('tablet-open',function(){
      const tablet=document.querySelector('#tablet');
      if(!tablet) return;
      tablet.classList.remove('tablet-close-motion');
      tablet.classList.add('tablet-open-motion');
    });

    window.addEventListener('tablet-close',function(){
      const tablet=document.querySelector('#tablet');
      if(!tablet) return;
      tablet.classList.remove('tablet-open-motion');
      tablet.classList.add('tablet-close-motion');
    });
  }
  install();
})();
