(function(){
  function install(){
    if(window.__tabletRuntimeBridgeInstalled) return;
    if(!window.THREE || !window.createTablet3DController || !window.createTabletScreenTexture || !window.attachTabletScreenMesh) return;

    const original = window.createTablet3DController;
    const textureController = window.createTabletScreenTexture(1024,720);

    window.createTablet3DController = function(canvas){
      const controller = original(canvas);
      if(controller && controller.rig){
        const screen = window.attachTabletScreenMesh(controller.rig, textureController);
        if(screen){
          screen.position.z = 0.118;
          screen.material.emissive = new THREE.Color(0xffffff);
          screen.material.emissiveMap = textureController.texture;
          screen.material.emissiveIntensity = 0.35;
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
