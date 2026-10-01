(function(){
  window.createTabletScreenTexture=function(width=1024,height=720){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;

    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;

    function roundedRect(x,y,w,h,r){
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      ctx.fill();
    }

    function draw(state={}){
      ctx.clearRect(0,0,width,height);

      // dark glass-like UI background
      ctx.fillStyle='#090d16';
      ctx.fillRect(0,0,width,height);

      ctx.fillStyle='#151d2c';
      roundedRect(30,30,width-60,100,28);

      ctx.fillStyle='#ffffff';
      ctx.font='bold 48px sans-serif';
      ctx.fillText('NOVA PAD',70,95);

      const apps=[
        ['Messages','💬'],
        ['Tasks','✓'],
        ['Map','⌖'],
        ['Scanner','◉']
      ];

      apps.forEach((app,i)=>{
        const x=80+(i%2)*430;
        const y=190+Math.floor(i/2)*220;

        ctx.fillStyle='rgba(255,255,255,.08)';
        roundedRect(x,y,340,150,28);

        ctx.fillStyle='#8fc5ff';
        ctx.font='46px sans-serif';
        ctx.fillText(app[1],x+35,y+75);

        ctx.fillStyle='#ffffff';
        ctx.font='32px sans-serif';
        ctx.fillText(app[0],x+110,y+80);
      });

      // subtle glass reflection
      const gradient=ctx.createLinearGradient(0,0,width,0);
      gradient.addColorStop(0,'rgba(255,255,255,0)');
      gradient.addColorStop(.5,'rgba(255,255,255,.12)');
      gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,width,height);

      texture.needsUpdate=true;
    }

    draw();

    return {
      canvas,
      ctx,
      texture,
      draw
    };
  };
})();
