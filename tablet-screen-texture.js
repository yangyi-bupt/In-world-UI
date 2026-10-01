(function(){
  window.createTabletScreenTexture=function(width=1024,height=720){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;

    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;

    const state={activeApp:null};
    const apps=[
      {id:'messages',label:'Messages',short:'MSG'},
      {id:'tasks',label:'Tasks',short:'TASK'},
      {id:'map',label:'Map',short:'MAP'},
      {id:'scanner',label:'Scanner',short:'SCAN'}
    ];
    const appRects=[];

    function roundedRect(x,y,w,h,r,fill){
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      if(fill) ctx.fill();
    }

    function text(txt,x,y,size,weight='normal',color='#fff'){
      ctx.fillStyle=color;
      ctx.font=weight+' '+size+'px sans-serif';
      ctx.fillText(txt,x,y);
    }

    function base(){
      ctx.clearRect(0,0,width,height);
      ctx.fillStyle='#050812';
      ctx.fillRect(0,0,width,height);

      const bg=ctx.createRadialGradient(500,250,30,500,250,600);
      bg.addColorStop(0,'rgba(50,120,220,.25)');
      bg.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=bg;
      ctx.fillRect(0,0,width,height);

      ctx.fillStyle='rgba(255,255,255,.08)';
      roundedRect(40,30,944,70,24,true);
      text('09:41',70,78,30,'bold');
      text('NOVA OS',410,78,28,'bold','#8fc5ff');
      text('98%',870,78,28,'bold');
    }

    function drawHome(){
      text('NOVA PAD',70,160,52,'bold');
      text('PERSONAL WORLD TERMINAL',74,195,18,'normal','#8ca4c8');

      appRects.length=0;
      apps.forEach((app,i)=>{
        const x=70+(i%2)*450;
        const y=240+Math.floor(i/2)*160;
        const rect={...app,x,y,w:390,h:120};
        appRects.push(rect);

        ctx.fillStyle='rgba(255,255,255,.09)';
        roundedRect(x,y,390,120,28,true);

        ctx.fillStyle='rgba(120,190,255,.18)';
        roundedRect(x+20,y+20,80,80,20,true);

        text(app.short,x+30,y+70,20,'bold','#8fc5ff');
        text(app.label,x+125,y+70,30,'bold');
      });

      ctx.fillStyle='rgba(255,255,255,.06)';
      roundedRect(260,650,504,48,24,true);
      text('◉   ◌   ◇   ◎',400,684,26,'bold','#8fc5ff');
    }

    function drawBack(){
      ctx.fillStyle='rgba(255,255,255,.08)';
      roundedRect(58,122,154,58,20,true);
      text('‹  Home',82,161,24,'bold','#b9d9ff');
    }

    function drawMessages(){
      text('Messages',70,230,44,'bold');
      text('Mira · online',72,264,18,'normal','#8ca4c8');

      ctx.fillStyle='rgba(255,255,255,.10)';
      roundedRect(70,300,610,78,24,true);
      text('Welcome back. Your world is ready.',96,348,24,'normal');

      ctx.fillStyle='rgba(111,167,255,.22)';
      roundedRect(344,405,610,78,24,true);
      text('I am checking the room now.',372,453,24,'normal','#dceaff');

      ctx.fillStyle='rgba(255,255,255,.07)';
      roundedRect(70,560,884,72,28,true);
      text('Tap Home to return',98,605,20,'normal','#8ca4c8');
    }

    function drawTasks(){
      text('Tasks',70,230,44,'bold');
      const rows=[
        ['Explore the room','ACTIVE'],
        ['Talk with Mira','NEXT'],
        ['Inspect the window','OPTIONAL']
      ];
      rows.forEach((row,i)=>{
        const y=300+i*105;
        ctx.fillStyle='rgba(255,255,255,.08)';
        roundedRect(70,y,884,80,22,true);
        ctx.strokeStyle='rgba(143,197,255,.55)';
        ctx.lineWidth=3;
        ctx.beginPath();
        ctx.arc(110,y+40,15,0,Math.PI*2);
        ctx.stroke();
        text(row[0],150,y+49,25,'bold');
        text(row[1],800,y+47,16,'bold','#8fc5ff');
      });
    }

    function drawMap(){
      text('Map',70,230,44,'bold');
      text('Apartment Zone · Level 01',72,264,18,'normal','#8ca4c8');

      ctx.strokeStyle='rgba(255,255,255,.20)';
      ctx.lineWidth=3;
      ctx.strokeRect(90,300,530,270);
      ctx.strokeRect(620,300,300,130);
      ctx.strokeRect(620,430,145,140);
      ctx.strokeRect(765,430,155,140);

      ctx.fillStyle='#8de5ff';
      ctx.beginPath();ctx.arc(350,500,12,0,Math.PI*2);ctx.fill();
      text('YOU',375,508,18,'bold','#8de5ff');

      ctx.fillStyle='#ff9faf';
      ctx.beginPath();ctx.arc(500,365,12,0,Math.PI*2);ctx.fill();
      text('MIRA',525,373,18,'bold','#ffb1bd');
    }

    function drawScanner(){
      text('Scanner',70,230,44,'bold');
      text('LIVE OBJECT ANALYSIS',72,264,18,'normal','#7cffb4');

      ctx.strokeStyle='rgba(124,255,180,.55)';
      ctx.lineWidth=3;
      ctx.strokeRect(250,300,524,260);

      ctx.beginPath();
      ctx.moveTo(512,320);ctx.lineTo(512,540);
      ctx.moveTo(280,430);ctx.lineTo(744,430);
      ctx.stroke();

      ctx.fillStyle='rgba(124,255,180,.12)';
      roundedRect(300,590,424,60,20,true);
      text('Nearby objects detected',340,628,22,'bold','#a9ffd0');
    }

    function drawApp(){
      drawBack();
      if(state.activeApp==='messages') drawMessages();
      else if(state.activeApp==='tasks') drawTasks();
      else if(state.activeApp==='map') drawMap();
      else if(state.activeApp==='scanner') drawScanner();
    }

    function reflection(){
      const gradient=ctx.createLinearGradient(0,0,width,0);
      gradient.addColorStop(0,'rgba(255,255,255,0)');
      gradient.addColorStop(.45,'rgba(255,255,255,.10)');
      gradient.addColorStop(.55,'rgba(255,255,255,0)');
      gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;
      ctx.fillRect(0,0,width,height);
    }

    function draw(){
      base();
      if(state.activeApp) drawApp();
      else drawHome();
      reflection();
      texture.needsUpdate=true;
    }

    function handleUv(uv){
      if(!uv) return null;
      const x=uv.x*width;
      const y=(1-uv.y)*height;

      if(state.activeApp){
        if(x>=58 && x<=212 && y>=122 && y<=180){
          const previous=state.activeApp;
          state.activeApp=null;
          draw();
          window.dispatchEvent(new CustomEvent('tablet-app-close',{detail:{app:previous}}));
          return {type:'back',app:previous};
        }
        return null;
      }

      const hit=appRects.find(r=>x>=r.x && x<=r.x+r.w && y>=r.y && y<=r.y+r.h);
      if(!hit) return null;

      state.activeApp=hit.id;
      draw();
      window.dispatchEvent(new CustomEvent('tablet-app-open',{detail:{app:hit.id}}));
      return {type:'open',app:hit.id};
    }

    draw();

    return {canvas,ctx,texture,draw,handleUv,state};
  };
})();
