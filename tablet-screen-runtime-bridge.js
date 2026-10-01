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

        if(screen){
          screen.position.z=.102;
          screen.material.emissive=new THREE.Color(0xffffff);
          screen.material.emissiveMap=textureController.texture;
          screen.material.emissiveIntensity=.55;
          screen.material.needsUpdate=true;

          const glareCanvas=document.createElement('canvas');
          glareCanvas.width=512;
          glareCanvas.height=256;
          const glareCtx=glareCanvas.getContext('2d');
          const glareGradient=glareCtx.createLinearGradient(0,256,512,0);
          glareGradient.addColorStop(0,'rgba(255,255,255,0)');
          glareGradient.addColorStop(.34,'rgba(255,255,255,0)');
          glareGradient.addColorStop(.47,'rgba(255,255,255,.22)');
          glareGradient.addColorStop(.54,'rgba(180,220,255,.08)');
          glareGradient.addColorStop(.66,'rgba(255,255,255,0)');
          glareGradient.addColorStop(1,'rgba(255,255,255,0)');
          glareCtx.fillStyle=glareGradient;
          glareCtx.fillRect(0,0,512,256);

          const glareTexture=new THREE.CanvasTexture(glareCanvas);
          glareTexture.colorSpace=THREE.SRGBColorSpace;
          const glareMaterial=new THREE.MeshBasicMaterial({
            map:glareTexture,
            transparent:true,
            opacity:.62,
            depthWrite:false,
            toneMapped:false,
            blending:THREE.AdditiveBlending
          });
          glare=new THREE.Mesh(new THREE.PlaneGeometry(2.45,1.63),glareMaterial);
          glare.position.z=.116;
          glare.renderOrder=12;
          glare.raycast=()=>{};
          capturedRig.add(glare);
        }

        controller.screenTexture=textureController;
        controller.screenMesh=screen || null;
        controller.screenGlare=glare;

        const pointerCanvas=controller.renderer?.domElement ||
          (canvas && typeof canvas.getContext==='function' ? canvas : canvas?.querySelector?.('canvas'));
        const camera=controller.camera;

        if(screen){
          let glassTargetX=0;
          let glassTargetY=0;
          let glassX=0;
          let glassY=0;
          let glassPressed=0;
          let screenLight=.36;

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
              glassX=THREE.MathUtils.lerp(glassX,glassTargetX,.11);
              glassY=THREE.MathUtils.lerp(glassY,glassTargetY,.11);
              screenLight=THREE.MathUtils.lerp(screenLight,open?.62:.30,.10);

              screen.material.emissiveIntensity=screenLight-glassPressed*.05;

              if(glare){
                glare.position.x=glassX*.055;
                glare.position.y=glassY*.032;
                glare.rotation.z=-.035+glassX*.012;
                glare.material.opacity=(open?.62:.18)*(1-glassPressed*.16);
              }

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
          };
        }
      }

      return controller;
    };

    window.__tabletRuntimeBridgeInstalled=true;
  }

  install();
})();
