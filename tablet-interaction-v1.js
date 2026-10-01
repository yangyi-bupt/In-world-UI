(function(){
  function install(){
    if(window.__tabletInteractionInstalled) return;
    window.__tabletInteractionInstalled=true;

    const style=document.createElement('style');
    style.textContent=`
      .tablet-open-motion {
        animation: tabletLiftIn .72s cubic-bezier(.14,.88,.16,1) both,
          tabletFloat 5.8s 1s ease-in-out infinite;
      }
      .tablet-close-motion {
        animation: tabletLowerOut .45s ease-in both;
      }
      @keyframes tabletLiftIn {
        0% { transform:translate(-50%,82%) rotateX(38deg) rotateZ(-2deg) scale(.68); opacity:.1; }
        55% { transform:translate(-50%,-54%) rotateX(-5deg) rotateZ(.8deg) scale(1.03); opacity:1; }
        100% { transform:translate(-50%,-50%) rotateX(-1.4deg) rotateY(.4deg) rotateZ(0) scale(1); opacity:1; }
      }
      @keyframes tabletLowerOut {
        from { transform:translate(-50%,-50%) rotateX(-1.4deg) scale(1); opacity:1; }
        to { transform:translate(-50%,82%) rotateX(38deg) scale(.68); opacity:.1; }
      }
      @keyframes tabletFloat {
        0%,100% { margin-top:0; }
        50% { margin-top:-5px; }
      }
    `;
    document.head.appendChild(style);

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
