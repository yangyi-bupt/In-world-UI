(function(){
  // Lightweight bridge for migrating the tablet display from DOM overlay
  // toward a real Three.js screen texture.
  window.createTabletScreenTexture=function(width=1024,height=720){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#080b12';
    ctx.fillRect(0,0,width,height);

    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.needsUpdate=true;

    function draw(renderer){
      if(!ctx) return;
      ctx.clearRect(0,0,width,height);
      ctx.fillStyle='#101522';
      ctx.fillRect(0,0,width,height);
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.font='42px sans-serif';
      ctx.fillText('NOVA PAD',60,90);
      texture.needsUpdate=true;
    }

    return {canvas,ctx,texture,draw};
  };
})();
