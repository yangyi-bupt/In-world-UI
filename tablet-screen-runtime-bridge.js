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

          pointerCanvas.style.pointerEvents='auto';
          pointerCanvas.style.cursor='pointer';
          pointerCanvas.style.touchAction='none';

          const onPointerUp=(event)=>{
            const rect=pointerCanvas.getBoundingClientRect();
            if(!rect.width || !rect.height) return;

            pointer.x=((event.clientX-rect.left)/rect.width)*2-1;
            pointer.y=-((event.clientY-rect.top)/rect.height)*2+1;

            camera.updateMatrixWorld(true);
            screen.updateMatrixWorld(true);
            raycaster.setFromCamera(pointer,camera);

            const hit=raycaster.intersectObject(screen,false)[0];
            if(!hit || !hit.uv) return;

            const action=textureController.handleUv?.(hit.uv);
            if(action){
              event.preventDefault();
              event.stopPropagation();
            }
          };

          pointerCanvas.addEventListener('pointerup',onPointerUp);
          controller.disposeTabletPointer=()=>pointerCanvas.removeEventListener('pointerup',onPointerUp);
        }
      }

      return controller;
    };

    window.__tabletRuntimeBridgeInstalled=true;
  }

  install();
})();
