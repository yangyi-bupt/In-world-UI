(function(){
  window.createTabletScreenTexture=function(width=1024,height=720){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;

    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;

    function roundedRect(x,y,w,h,r,fill){
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      if(fill) ctx.fill();
    }

    function text(txt,x,y,size,weight='normal',color='#fff'){
      ctx.fillStyle=color;
      ctx.font=`${weight} ${size}px sans-serif`;
      ctx.fillText(txt,x,y);
    }

    function draw(){
      ctx.clearRect(0,0,width,height);

      // futuristic OLED background
      ctx.fillStyle='#050812';
      ctx.fillRect(0,0,width,height);

      const bg=ctx.createRadialGradient(500,250,30,500,250,600);
      bg.addColorStop(0,'rgba(50,120,220,.25)');
      bg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=bg;
      ctx.fillRect(0,0,width,height);

      // status bar
      ctx.fillStyle='rgba(255,255,255,.08)';
      roundedRect(40,30,944,70,24,true);
      text('09:41',70,78,30,'bold');
      text('NOVA OS',410,78,28,'bold','#8fc5ff');
      text('98%',870,78,28,'bold');

      // center title
      text('NOVA PAD',70,160,52,'bold');
      text('PERSONAL WORLD TERMINAL',74,195,18,'normal','#8ca4c8');

      const apps=[
        ['AI Assistant','AI'],
        ['Messages','MSG'],
        ['World Map','MAP'],
        ['Scanner','SCAN']
      ];

      apps.forEach((app,i)=>{
        const x=70+(i%2)*450;
        const y=240+Math.floor(i/2)*160;

        ctx.fillStyle='rgba(255,255,255,.09)';
        roundedRect(x,y,390,120,28,true);

        ctx.fillStyle='rgba(120,190,255,.18)';
        roundedRect(x+20,y+20,80,80,20,true);

        text(app[1],x+35,y+70,22,'bold','#8fc5ff');
        text(app[0],x+125,y+70,30,'bold');
      });

      // bottom dock
      ctx.fillStyle='rgba(255,255,255,.06)';
      roundedRect(260,650,504,48,24,true);
      text('◉   ◌   ◇   ◎',400,684,26,'bold','#8fc5ff');

      // glass reflection
      const gradient=ctx.createLinearGradient(0,0,width,0);
      gradient.addColorStop(0,'rgba(255,255,255,0)');
      gradient.addColorStop(.45,'rgba(255,255,255,.10)');
      gradient.addColorStop(.55,'rgba(255,255,255,0)');
      gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,width,height);

      texture.needsUpdate=true;
    }

    draw();

    return {canvas,ctx,texture,draw};
  };
})();
