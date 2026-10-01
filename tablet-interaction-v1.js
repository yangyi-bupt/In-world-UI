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
          transform:translate(-50%,38%) rotateX(25deg) rotateY(-2.4deg) rotateZ(-1.8deg) scale(.90);
          opacity:.08;
          filter:blur(2px);
        }
        42% {
          transform:translate(-50%,-38%) rotateX(7deg) rotateY(-1deg) rotateZ(-.7deg) scale(.975);
          opacity:.86;
          filter:blur(.35px);
        }
        72% {
          transform:translate(-50%,-51.5%) rotateX(-2.2deg) rotateY(.55deg) rotateZ(.2deg) scale(1.006);
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
        36% {
          transform:translate(-50%,-45%) rotateX(3deg) rotateY(-.6deg) rotateZ(-.3deg) scale(.985);
          opacity:.95;
        }
        100% {
          transform:translate(-50%,42%) rotateX(28deg) rotateY(-2deg) rotateZ(-1.5deg) scale(.90);
          opacity:.05;
          filter:blur(2px);
        }
      }

      @keyframes tabletHeldBreath {
        0%,100% { margin-top:0; }
        50% { margin-top:-2px; }
      }

      .app.active {
        transform:translateY(-4px) scale(1.04);
        filter:brightness(1.25);
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
