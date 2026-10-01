(function(){
  function install(){
    if(window.__tabletRuntimeBridgeInstalled) return;
    if(!window.THREE || !window.createTablet3DController || !window.createTabletScreenTexture || !window.attachTabletScreenMesh) return;

    const original = window.createTablet3DController;
    const textureController = window.createTabletScreenTexture(1024,720);

    window.createTablet3DController = function(canvas){
      let capturedRig = null;

      const originalSceneAdd = THREE.Scene.prototype.add;
      THREE.Scene.prototype.add = function(...objects){
        for(const obj of objects){
          if(obj && obj.isGroup && !capturedRig && obj.children && obj.children.length === 0){
            capturedRig = obj;
          }
        }
        return originalSceneAdd.apply(this, objects);
      };

      const controller = original(canvas);

      THREE.Scene.prototype.add = originalSceneAdd;

      if(controller && capturedRig){
        const screen = window.attachTabletScreenMesh(capturedRig, textureController);
        if(screen){
          screen.position.z = 0.102;
          screen.material.emissive = new THREE.Color(0xffffff);
          screen.material.emissiveMap = textureController.texture;
          screen.material.emissiveIntensity = 0.55;
          screen.material.needsUpdate = true;
        }
        controller.screenTexture = textureController;
      }

      return controller;
    };

    window.__tabletRuntimeBridgeInstalled = true;
  }

  install();
})();
