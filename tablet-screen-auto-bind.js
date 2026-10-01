(function(){
  function attach(){
    if(!window.THREE || !window.createTabletScreenTexture || !window.attachTabletScreenMesh) return;
    if(window.__tabletScreenBound) return;

    const textureController = window.createTabletScreenTexture(1024,720);
    window.__tabletScreenTextureController = textureController;

    const old = window.createTablet3DController;
    if(!old) return;

    window.createTablet3DController = function(canvas){
      const controller = old(canvas);
      if(controller && controller.scene && controller.rig){
        window.attachTabletScreenMesh(controller.rig, textureController);
      }
      return controller;
    };

    window.__tabletScreenBound = true;
  }

  window.bindTabletScreen = attach;
  attach();
})();
