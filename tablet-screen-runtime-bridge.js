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
        if(screen){
          screen.position.z=.102;
          screen.material.emissive=new THREE.Color(0xffffff);
          screen.material.emissiveMap=textureController.texture;
          screen.material.emissiveIntensity=.55;
          screen.material.needsUpdate=true;
        }

        controller.screenTexture=textureController;
        controller.screenMesh=screen || null;

        const pointerCanvas=controller.renderer?.domElement ||
          (canvas && typeof canvas.getContext==='function' ? canvas : canvas?.querySelector?.('canvas'));
        const camera=controller.camera;

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
