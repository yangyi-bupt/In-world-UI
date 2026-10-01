(function(){
  // V4.2.3 bridge: keeps the screen pipeline isolated while the 3D iPad
  // material migration is being completed.
  window.bindTabletScreenPipeline=function(tabletTexture){
    if(!tabletTexture) return null;

    return {
      texture: tabletTexture,
      ready:true,
      attach(material){
        if(!material) return;
        material.map = tabletTexture.texture || tabletTexture;
        material.needsUpdate = true;
      }
    };
  };
})();
