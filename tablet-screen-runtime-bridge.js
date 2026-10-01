(function(){
  function install(){
    if(window.__tabletRuntimeBridgeInstalled) return;
    if(!window.THREE || !window.createTablet3DController || !window.createTabletScreenTexture || !window.attachTabletScreenMesh) return;

    const original=window.createTablet3DController;
    const textureController=window.createTabletScreenTexture(1024,720);

    window.createTablet3DController=function(canvas){
      let capturedRig=null;

      const originalSceneAdd=THREE.Scene.prototype.add;
      THREE.Scene.prototype.add=function(...objects){
        for(const obj of objects){
          if(obj && obj.isGroup && !capturedRig && obj.children && obj.children.length===0){
            capturedRig=obj;
          }
        }
        return originalSceneAdd.apply(this,objects);
      };

      let controller=null;
      try{
        controller=original(canvas);
      }finally{
        THREE.Scene.prototype.add=originalSceneAdd;
      }

      if(controller && capturedRig){
        const screen=window.attachTabletScreenMesh(capturedRig,textureController);
        let glare=null;
        let edgeGlow=null;
        let chassisGlow=null;

        if(screen){
          screen.position.z=.102;
          screen.material.toneMapped=false;
          screen.material.needsUpdate=true;

          const glareCanvas=document.createElement('canvas');
          glareCanvas.width=512;
          glareCanvas.height=256;
          const glareCtx=glareCanvas.getContext('2d');
          const glareGradient=glareCtx.createLinearGradient(0,256,512,0);
          glareGradient.addColorStop(0.00,'rgba(255,255,255,0)');
          glareGradient.addColorStop(0.32,'rgba(255,255,255,0)');
          glareGradient.addColorStop(0.44,'rgba(214,235,255,.015)');
          glareGradient.addColorStop(0.50,'rgba(214,235,255,.08)');
          glareGradient.addColorStop(0.56,'rgba(214,235,255,.025)');
          glareGradient.addColorStop(0.68,'rgba(255,255,255,0)');
          glareGradient.addColorStop(1.00,'rgba(255,255,255,0)');
          glareCtx.fillStyle=glareGradient;
          glareCtx.fillRect(0,0,512,256);

          const glareTexture=new THREE.CanvasTexture(glareCanvas);
          glareTexture.colorSpace=THREE.SRGBColorSpace;
          const glareMaterial=new THREE.MeshBasicMaterial({
            map:glareTexture,
            transparent:true,
            opacity:.16,
            depthWrite:false,
            toneMapped:false,
            blending:THREE.NormalBlending
          });
          glare=new THREE.Mesh(new THREE.PlaneGeometry(2.45,1.63),glareMaterial);
          glare.position.z=.116;
          glare.renderOrder=12;
          glare.raycast=()=>{};
          capturedRig.add(glare);

          const edgeMaterial=()=>new THREE.MeshBasicMaterial({
            color:0x8fcfff,
            transparent:true,
            opacity:0,
            depthWrite:false,
            toneMapped:false,
            blending:THREE.AdditiveBlending
          });

          edgeGlow={
            top:new THREE.Mesh(new THREE.PlaneGeometry(2.50,.018),edgeMaterial()),
            bottom:new THREE.Mesh(new THREE.PlaneGeometry(2.50,.018),edgeMaterial()),
            left:new THREE.Mesh(new THREE.PlaneGeometry(.018,1.66),edgeMaterial()),
            right:new THREE.Mesh(new THREE.PlaneGeometry(.018,1.66),edgeMaterial())
          };

          edgeGlow.top.position.set(0,.838,.119);
          edgeGlow.bottom.position.set(0,-.838,.119);
          edgeGlow.left.position.set(-1.258,0,.119);
          edgeGlow.right.position.set(1.258,0,.119);

          Object.values(edgeGlow).forEach(part=>{
            part.renderOrder=13;
            part.raycast=()=>{};
            capturedRig.add(part);
          });

          // A second highlight ring sits on the physical chassis, outside the
          // display. It behaves like a cheap Fresnel approximation and makes
          // the aluminum frame read as metal even in the dark room.
          const chassisMaterial=()=>new THREE.MeshBasicMaterial({
            color:0xd9efff,
            transparent:true,
            opacity:0,
            depthWrite:false,
            toneMapped:false,
            blending:THREE.AdditiveBlending
          });

          chassisGlow={
            top:new THREE.Mesh(new THREE.PlaneGeometry(2.69,.012),chassisMaterial()),
            bottom:new THREE.Mesh(new THREE.PlaneGeometry(2.69,.012),chassisMaterial()),
            left:new THREE.Mesh(new THREE.PlaneGeometry(.012,1.87),chassisMaterial()),
            right:new THREE.Mesh(new THREE.PlaneGeometry(.012,1.87),chassisMaterial())
          };

          chassisGlow.top.position.set(0,.963,.105);
          chassisGlow.bottom.position.set(0,-.963,.105);
          chassisGlow.left.position.set(-1.363,0,.105);
          chassisGlow.right.position.set(1.363,0,.105);

          Object.values(chassisGlow).forEach(part=>{
            part.renderOrder=11;
            part.raycast=()=>{};
            capturedRig.add(part);
          });
        }

        controller.screenTexture=textureController;
        controller.screenMesh=screen || null;
        controller.screenGlare=glare;
        controller.screenEdgeGlow=edgeGlow;
        controller.chassisGlow=chassisGlow;

        const pointerCanvas=controller.renderer?.domElement ||
          (canvas && typeof canvas.getContext==='function' ? canvas : canvas?.querySelector?.('canvas'));
        const camera=controller.camera;

        if(screen){
          let glassTargetX=0;
          let glassTargetY=0;
          let glassX=0;
          let glassY=0;
          let glassPressed=0;
          let powerSweepUntil=0;
          let screenPress=0;
          let screenPressVelocity=0;
          let refractionX=0;
          let refractionY=0;
          let lastFxTime=0;

          const onTabletOpenFx=()=>{
            powerSweepUntil=performance.now()+920;
          };
          window.addEventListener('tablet-open',onTabletOpenFx);

          const baseSetPointer=controller.setInteractionPointer?.bind(controller);
          const baseClearPointer=controller.clearInteractionPointer?.bind(controller);
          const baseRender=controller.render?.bind(controller);

          controller.setInteractionPointer=(x=0,y=0,pressed=false)=>{
            baseSetPointer?.(x,y,pressed);
            glassTargetX=THREE.MathUtils.clamp(x,-1,1);
            glassTargetY=THREE.MathUtils.clamp(y,-1,1);
            glassPressed=pressed?1:0;
          };

          controller.clearInteractionPointer=()=>{
            baseClearPointer?.();
            glassTargetX=0;
            glassTargetY=0;
            glassPressed=0;
          };

          if(baseRender){
            controller.render=(t,open)=>{
              const dt=Math.min(.05,Math.max(.001,lastFxTime?t-lastFxTime:.016));
              lastFxTime=t;

              glassX=THREE.MathUtils.lerp(glassX,glassTargetX,.11);
              glassY=THREE.MathUtils.lerp(glassY,glassTargetY,.11);

              // The LCD layer appears to sit under the cover glass: content
              // drifts a few millimeters with pointer angle, while press uses
              // a spring so release carries a visible but restrained overshoot.
              refractionX=THREE.MathUtils.lerp(refractionX,glassX*.0065,1-Math.pow(.0005,dt));
              refractionY=THREE.MathUtils.lerp(refractionY,glassY*.0042,1-Math.pow(.0005,dt));

              screenPressVelocity+=((glassPressed?1:0)-screenPress)*235*dt;
              screenPressVelocity*=Math.exp(-17*dt);
              screenPress+=screenPressVelocity*dt;
              screenPress=THREE.MathUtils.clamp(screenPress,-.08,1.06);

              const pressScale=1-screenPress*.0042;
              screen.position.x=refractionX;
              screen.position.y=refractionY;
              screen.position.z=.102-screenPress*.0055;
              screen.scale.set(pressScale,pressScale,1);

              const now=performance.now();
              const sweepRemaining=Math.max(0,powerSweepUntil-now);
              const sweepProgress=sweepRemaining>0 ? 1-sweepRemaining/920 : 1;
              const sweepEnvelope=sweepRemaining>0 ? Math.sin(Math.PI*sweepProgress) : 0;

              if(glare){
                // Keep the idle reflection off the reading area. The brighter
                // sweep only crosses the display briefly when the tablet wakes.
                const idleBiasX=-.34;
                const sweepOffset=sweepRemaining>0
                  ? (-.78+1.56*sweepProgress)
                  : idleBiasX;

                glare.position.x=sweepOffset+glassX*.018;
                glare.position.y=glassY*.012;
                glare.rotation.z=-.16+glassX*.006;

                const baseOpacity=open?.07:.015;
                const sweepOpacity=sweepEnvelope*.10;
                glare.material.opacity=(baseOpacity+sweepOpacity)*(1-Math.max(0,screenPress)*.10);
                glare.scale.x=.86+sweepEnvelope*.08;
              }

              if(edgeGlow){
                const base=open?.055:.008;
                const clickBoost=Math.max(0,screenPress)*.12;
                const sweepBoost=sweepEnvelope*.22;
                edgeGlow.left.material.opacity=base+Math.max(0,-glassX)*.065+clickBoost+sweepBoost*(1-sweepProgress);
                edgeGlow.right.material.opacity=base+Math.max(0,glassX)*.065+clickBoost+sweepBoost*sweepProgress;
                edgeGlow.top.material.opacity=base+Math.max(0,glassY)*.045+clickBoost*.65+sweepBoost*.55;
                edgeGlow.bottom.material.opacity=base+Math.max(0,-glassY)*.045+clickBoost*.65+sweepBoost*.35;
              }

              if(chassisGlow){
                const metalBase=open?.018:.003;
                const pressFlash=Math.max(0,screenPress)*.035;
                const angleX=Math.abs(glassX);
                const angleY=Math.abs(glassY);

                chassisGlow.left.material.opacity=metalBase+Math.max(0,-glassX)*.11+angleY*.025+pressFlash+sweepEnvelope*.07*(1-sweepProgress);
                chassisGlow.right.material.opacity=metalBase+Math.max(0,glassX)*.11+angleY*.025+pressFlash+sweepEnvelope*.07*sweepProgress;
                chassisGlow.top.material.opacity=metalBase+Math.max(0,glassY)*.075+angleX*.028+pressFlash*.7+sweepEnvelope*.045;
                chassisGlow.bottom.material.opacity=metalBase+Math.max(0,-glassY)*.075+angleX*.028+pressFlash*.7+sweepEnvelope*.035;
              }

              textureController.update?.(t,open);
              baseRender(t,open);
            };
          }
        }

        if(pointerCanvas && camera && screen){
          const raycaster=new THREE.Raycaster();
          const pointer=new THREE.Vector2();
          let pressedKey=null;

          pointerCanvas.style.pointerEvents='auto';
          pointerCanvas.style.cursor='default';
          pointerCanvas.style.touchAction='none';

          const raycast=(event)=>{
            const rect=pointerCanvas.getBoundingClientRect();
            if(!rect.width || !rect.height) return null;

            pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
            pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;

            camera.updateMatrixWorld(true);
            screen.updateMatrixWorld(true);
            raycaster.setFromCamera(pointer,camera);

            const hit=raycaster.intersectObject(screen,false)[0];
            return hit?.uv || null;
          };

          const onPointerMove=(event)=>{
            const rect=pointerCanvas.getBoundingClientRect();
            const nx=rect.width?((event.clientX-rect.left)/rect.width)*2-1:0;
            const ny=rect.height?-(((event.clientY-rect.top)/rect.height)*2-1):0;
            controller.setInteractionPointer?.(nx,ny,pressedKey!==null);

            const uv=raycast(event);
            const target=textureController.setPointerUv?.(uv);
            pointerCanvas.style.cursor=target?'pointer':'default';
          };

          const onPointerDown=(event)=>{
            if(event.button!==0 && event.pointerType!=='touch') return;
            const rect=pointerCanvas.getBoundingClientRect();
            const nx=rect.width?((event.clientX-rect.left)/rect.width)*2-1:0;
            const ny=rect.height?-(((event.clientY-rect.top)/rect.height)*2-1):0;

            const uv=raycast(event);
            const target=textureController.setPressedUv?.(uv);
            pressedKey=target?.key || null;
            controller.setInteractionPointer?.(nx,ny,Boolean(target));

            if(target){
              textureController.pulseUv?.(uv);
              pointerCanvas.setPointerCapture?.(event.pointerId);
              event.preventDefault();
              event.stopPropagation();
            }
          };

          const onPointerUp=(event)=>{
            const uv=raycast(event);
            const target=textureController.hitTestUv?.(uv);
            const sameTarget=target && target.key===pressedKey;
            textureController.clearPressed?.();
            pressedKey=null;

            const rect=pointerCanvas.getBoundingClientRect();
            const nx=rect.width?((event.clientX-rect.left)/rect.width)*2-1:0;
            const ny=rect.height?-(((event.clientY-rect.top)/rect.height)*2-1):0;
            controller.setInteractionPointer?.(nx,ny,false);

            if(sameTarget){
              const action=textureController.handleUv?.(uv);
              if(action){
                event.preventDefault();
                event.stopPropagation();
              }
            }

            pointerCanvas.releasePointerCapture?.(event.pointerId);
            const hover=textureController.setPointerUv?.(uv);
            pointerCanvas.style.cursor=hover?'pointer':'default';
          };

          const onPointerLeave=()=>{
            pressedKey=null;
            textureController.clearPressed?.();
            textureController.setPointerUv?.(null);
            controller.clearInteractionPointer?.();
            pointerCanvas.style.cursor='default';
          };

          pointerCanvas.addEventListener('pointermove',onPointerMove);
          pointerCanvas.addEventListener('pointerdown',onPointerDown);
          pointerCanvas.addEventListener('pointerup',onPointerUp);
          pointerCanvas.addEventListener('pointerleave',onPointerLeave);
          pointerCanvas.addEventListener('pointercancel',onPointerLeave);

          controller.disposeTabletPointer=()=>{
            pointerCanvas.removeEventListener('pointermove',onPointerMove);
            pointerCanvas.removeEventListener('pointerdown',onPointerDown);
            pointerCanvas.removeEventListener('pointerup',onPointerUp);
            pointerCanvas.removeEventListener('pointerleave',onPointerLeave);
            pointerCanvas.removeEventListener('pointercancel',onPointerLeave);
            window.removeEventListener('tablet-open',onTabletOpenFx);
          };
        }
      }

      return controller;
    };

    window.__tabletRuntimeBridgeInstalled=true;
  }

  install();
})();
