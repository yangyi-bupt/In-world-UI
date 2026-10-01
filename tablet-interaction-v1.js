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
        38% {
          transform:translate(-50%,-35%) rotateX(8deg) rotateY(-1.2deg) rotateZ(-.8deg) scale(.972);
          opacity:.84;
          filter:blur(.45px);
        }
        66% {
          transform:translate(-50%,-52.2%) rotateX(-2.8deg) rotateY(.7deg) rotateZ(.25deg) scale(1.008);
          opacity:1;
          filter:none;
        }
        82% {
          transform:translate(-50%,-49.35%) rotateX(-.7deg) rotateY(.25deg) rotateZ(-.08deg) scale(.9975);
          opacity:1;
          filter:none;
        }
        93% {
          transform:translate(-50%,-50.25%) rotateX(-1.55deg) rotateY(.44deg) rotateZ(.035deg) scale(1.001);
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
        28% {
          transform:translate(-50%,-47.5%) rotateX(1.5deg) rotateY(-.25deg) rotateZ(-.16deg) scale(.994);
          opacity:.98;
        }
        62% {
          transform:translate(-50%,-21%) rotateX(14deg) rotateY(-1.15deg) rotateZ(-.75deg) scale(.952);
          opacity:.72;
          filter:blur(.45px);
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
