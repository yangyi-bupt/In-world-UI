(function(){
  function install(){
    if(window.__tabletInteractionInstalled) return;
    window.__tabletInteractionInstalled=true;

    const style=document.createElement('style');
    style.textContent=`
      #tablet { transform-origin:50% 88%; }

      .tablet-layer.closing {
        pointer-events:none !important;
      }

      .tablet-layer.open .tablet.tablet-open-motion {
        animation:
          tabletRaiseHeld .68s cubic-bezier(.16,.78,.18,1) both,
          tabletHeldBreath 6.4s .82s ease-in-out infinite !important;
      }

      .tablet-layer.open .tablet.tablet-close-motion,
      .tablet-layer.closing .tablet.tablet-close-motion {
        animation:tabletLowerHeld .46s cubic-bezier(.42,0,.62,.3) both !important;
      }

      @keyframes tabletRaiseHeld {
        0% {
          transform:translate(-50%,30%) rotateX(17deg) rotateY(-1.2deg) rotateZ(-.7deg) scale(.958);
          opacity:.18;
          filter:none;
        }
        42% {
          transform:translate(-50%,-29%) rotateX(4.6deg) rotateY(-.55deg) rotateZ(-.30deg) scale(.990);
          opacity:.93;
          filter:none;
        }
        76% {
          transform:translate(-50%,-50.7%) rotateX(-1.7deg) rotateY(.28deg) rotateZ(.06deg) scale(1.001);
          opacity:1;
          filter:none;
        }
        100% {
          transform:translate(-50%,-50%) rotateX(-1.4deg) rotateY(.4deg) rotateZ(0) scale(1);
          opacity:1;
          filter:none;
        }
      }

      @keyframes tabletLowerHeld {
        0% {
          transform:translate(-50%,-50%) rotateX(-1.4deg) rotateY(.4deg) rotateZ(0) scale(1);
          opacity:1;
          filter:none;
        }
        32% {
          transform:translate(-50%,-45%) rotateX(1.2deg) rotateY(-.12deg) rotateZ(-.08deg) scale(.996);
          opacity:1;
          filter:none;
        }
        68% {
          transform:translate(-50%,-14%) rotateX(9.5deg) rotateY(-.65deg) rotateZ(-.34deg) scale(.978);
          opacity:.86;
          filter:none;
        }
        100% {
          transform:translate(-50%,34%) rotateX(18deg) rotateY(-1.15deg) rotateZ(-.7deg) scale(.955);
          opacity:.12;
          filter:none;
        }
      }

      @keyframes tabletHeldBreath {
        0%,100% { margin-top:0; }
        50% { margin-top:-.7px; }
      }

      .app.active {
        transform:translateY(-2px) scale(1.015);
        filter:brightness(1.06);
      }

      @media (prefers-reduced-motion:reduce) {
        .tablet-layer.open .tablet.tablet-open-motion,
        .tablet-layer.open .tablet.tablet-close-motion,
        .tablet-layer.closing .tablet.tablet-close-motion {
          animation-duration:.01ms !important;
          animation-iteration-count:1 !important;
        }
      }
    `;
    document.head.appendChild(style);

    window.addEventListener('tablet-open',function(){
      const tablet=document.querySelector('#tablet');
      if(!tablet) return;
      tablet.classList.remove('tablet-close-motion');
      void tablet.offsetWidth;
      tablet.classList.add('tablet-open-motion');
    });

    window.addEventListener('tablet-close',function(){
      const tablet=document.querySelector('#tablet');
      if(!tablet) return;
      tablet.classList.remove('tablet-open-motion');
      void tablet.offsetWidth;
      tablet.classList.add('tablet-close-motion');
    });

    // Legacy DOM buttons remain available for fallback/debug layouts.
    document.querySelectorAll('.app').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const app=btn.dataset.app;
        document.querySelectorAll('.app').forEach(x=>x.classList.remove('active'));
        btn.classList.add('active');
        document.querySelectorAll('.view').forEach(v=>v.classList.remove('active-view'));
        const view=document.getElementById(app);
        if(view) view.classList.add('active-view');
        window.dispatchEvent(new CustomEvent('tablet-app-open',{detail:{app}}));
      });
    });
  }

  install();
})();
