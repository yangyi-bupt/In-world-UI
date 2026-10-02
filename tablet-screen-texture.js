(function(){
  window.createTabletScreenTexture=function(width=1024,height=720){
    const canvas=document.createElement('canvas');
    canvas.width=width;
    canvas.height=height;

    const ctx=canvas.getContext('2d');
    const texture=new THREE.CanvasTexture(canvas);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=4;

    const state={
      activeApp:null,
      hoverKey:null,
      pressedKey:null,
      completedTasks:[false,false,false],
      scannerComplete:false,
      scanning:false,
      scannerProgress:0,
      uiTime:0,
      actionPulse:0,
      transitionKind:null,
      transitionProgress:1,
      transitionApp:null,
      messageChoice:null,
      messageReply:null,
      messageReplyPending:false,
      messageReplyTimer:0,
      messageUnread:false,
      mapFocus:null,
      ripples:[],
      pointerTargetX:width*.5,
      pointerTargetY:height*.5,
      pointerX:width*.5,
      pointerY:height*.5,
      pointerVisible:false,
      pointerAlpha:0,
      appHover:[0,0,0,0]
    };

    const apps=[
      {id:'messages',label:'Messages',short:'2 conversations',accent:'#7fd6ff',rgb:'127,214,255'},
      {id:'tasks',label:'Tasks',short:'3 active items',accent:'#9effc4',rgb:'158,255,196'},
      {id:'map',label:'Map',short:'Apartment · L01',accent:'#cdb7ff',rgb:'205,183,255'},
      {id:'scanner',label:'Scanner',short:'Object analysis',accent:'#ffc98a',rgb:'255,201,138'}
    ];

    const appRects=[];
    const taskRects=[];
    const messageRects=[
      {x:70,y:568,w:420,h:56,key:'message:0',type:'message-action',index:0,label:'On my way.'},
      {x:510,y:568,w:444,h:56,key:'message:1',type:'message-action',index:1,label:'Meet me by the window.'}
    ];
    const backRect={x:58,y:122,w:154,h:58,key:'back',type:'back'};
    const scannerRect={x:330,y:580,w:364,h:64,key:'scanner-action',type:'scanner-action'};
    const miraMapRect={x:470,y:332,w:138,h:72,key:'map:mira',type:'map-focus',target:'mira'};

    function roundedRect(x,y,w,h,r,fill){
      ctx.beginPath();
      ctx.roundRect(x,y,w,h,r);
      if(fill) ctx.fill();
    }

    function text(txt,x,y,size,weight='normal',color='#fff'){
      ctx.fillStyle=color;
      ctx.font=weight+' '+size+'px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(txt,x,y);
    }

    function strokeRoundRect(x,y,w,h,r,color='rgba(255,255,255,.08)',lineWidth=1){
      roundedRect(x,y,w,h,r,false);
      ctx.strokeStyle=color;
      ctx.lineWidth=lineWidth;
      ctx.stroke();
    }

    function appIcon(id,x,y,size,accent,energy=0){
      ctx.save();
      ctx.translate(x,y);

      // The glyph now lives inside its own tiny "material" layer. Energy comes
      // from hover and stays subtle at rest so icons feel embedded, not drawn on.
      if(energy>.002){
        const halo=ctx.createRadialGradient(0,0,size*.05,0,0,size*.62);
        halo.addColorStop(0,accent);
        halo.addColorStop(.28,'rgba(255,255,255,'+(.055*energy).toFixed(3)+')');
        halo.addColorStop(1,'rgba(255,255,255,0)');
        ctx.save();
        ctx.globalAlpha=.08+.09*energy;
        ctx.fillStyle=halo;
        ctx.beginPath();
        ctx.arc(0,0,size*.62,0,Math.PI*2);
        ctx.fill();
        ctx.restore();
      }

      ctx.strokeStyle=accent;
      ctx.fillStyle=accent;
      ctx.lineWidth=Math.max(2,size*.055);
      ctx.lineCap='round';
      ctx.lineJoin='round';

      if(id==='messages'){
        roundedRect(-size*.34,-size*.27,size*.68,size*.50,size*.16,false);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size*.08,size*.23);
        ctx.lineTo(-size*.20,size*.36);
        ctx.lineTo(size*.02,size*.25);
        ctx.stroke();

        const pulse=(Math.sin(state.uiTime*4.2)+1)*.5*energy;
        ctx.globalAlpha=.35+.65*pulse;
        ctx.beginPath();
        ctx.arc(size*.18,-size*.03,size*.045+size*.018*pulse,0,Math.PI*2);
        ctx.fill();
        ctx.globalAlpha=1;
      }else if(id==='tasks'){
        [-.22,.05,.32].forEach((offset,i)=>{
          const yy=offset*size;
          roundedRect(-size*.34,yy-size*.07,size*.14,size*.14,size*.04,false);
          ctx.stroke();
          if(i===0){
            ctx.beginPath();
            ctx.moveTo(-size*.31,yy);
            ctx.lineTo(-size*.27,yy+size*.04);
            ctx.lineTo(-size*.20,yy-size*.05);
            ctx.stroke();
          }
          ctx.beginPath();
          ctx.moveTo(-size*.10,yy);
          ctx.lineTo(size*.34,yy);
          ctx.stroke();
        });

        if(energy>.01){
          const scanY=(-.30+.60*((state.uiTime*.55)%1))*size;
          ctx.globalAlpha=.18+.28*energy;
          ctx.fillRect(-size*.31,scanY,size*.62,Math.max(1,size*.025));
          ctx.globalAlpha=1;
        }
      }else if(id==='map'){
        ctx.beginPath();
        ctx.arc(0,-size*.06,size*.19,0,Math.PI*2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0,-size*.06,size*.055,0,Math.PI*2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-size*.14,size*.08);
        ctx.quadraticCurveTo(0,size*.34,size*.14,size*.08);
        ctx.stroke();

        if(energy>.01){
          const a=state.uiTime*.95;
          ctx.globalAlpha=.20+.34*energy;
          ctx.beginPath();
          ctx.arc(
            Math.cos(a)*size*.30,
            Math.sin(a)*size*.16-size*.03,
            size*.035,
            0,Math.PI*2
          );
          ctx.fill();
          ctx.globalAlpha=1;
        }
      }else{
        const d=size*.30;
        const l=size*.14;
        [[-d,-d,1,1],[d,-d,-1,1],[-d,d,1,-1],[d,d,-1,-1]].forEach(([cx,cy,sx,sy])=>{
          ctx.beginPath();
          ctx.moveTo(cx+sx*l,cy);
          ctx.lineTo(cx,cy);
          ctx.lineTo(cx,cy+sy*l);
          ctx.stroke();
        });
        ctx.beginPath();
        ctx.arc(0,0,size*.07,0,Math.PI*2);
        ctx.fill();

        if(energy>.01){
          const sweep=(state.uiTime*.72)%1;
          ctx.globalAlpha=.16+.30*energy;
          ctx.fillRect(-size*.25,(-.24+.48*sweep)*size,size*.50,Math.max(1,size*.022));
          ctx.globalAlpha=1;
        }
      }
      ctx.restore();
    }

    function appMeta(appId){
      const app=apps.find(item=>item.id===appId) || apps[0];
      return app;
    }

    function pill(...args){
      let x,y,w,h,label,accent,active=false,fg;

      if(typeof args[0]==='string'){
        label=args[0];
        x=args[1];
        y=args[2];
        accent=args[3] || 'rgba(255,255,255,.10)';
        fg=args[4] || '#b9c7db';

        ctx.save();
        ctx.font='700 11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
        w=Math.ceil(ctx.measureText(label).width)+22;
        h=26;
        ctx.restore();
      }else{
        x=args[0];
        y=args[1];
        w=args[2];
        h=args[3];
        label=args[4];
        accent=args[5] || '#8fc5ff';
        active=Boolean(args[6]);
        fg=active?'#081018':accent;
      }

      ctx.save();
      ctx.fillStyle=active?accent:'rgba(255,255,255,.040)';
      roundedRect(x,y,w,h,h/2,true);
      strokeRoundRect(
        x,y,w,h,h/2,
        active?'rgba(255,255,255,.18)':accent,
        active?1.2:.8
      );

      ctx.font='700 '+(h>=32?12:11)+'px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const tw=ctx.measureText(String(label)).width;
      text(String(label),x+(w-tw)/2,y+h*.64,h>=32?12:11,'700',fg);
      ctx.restore();
      return w;
    }

    function appShell(accent='#8fc5ff',rgb='127,214,255'){
      ctx.fillStyle='rgba(7,11,18,.60)';
      roundedRect(44,194,936,468,34,true);
      strokeRoundRect(44,194,936,468,34,'rgba(255,255,255,.055)',1);

      // A very faint pointer-driven light stays under the content hierarchy.
      // It reads as light moving inside cover glass without washing out text.
      ctx.save();
      roundedRect(45,195,934,466,33,false);
      ctx.clip();
      const px=THREE.MathUtils.clamp(state.pointerX,44,980);
      const py=THREE.MathUtils.clamp(state.pointerY,194,662);
      const shellLight=ctx.createRadialGradient(px,py,0,px,py,360);
      shellLight.addColorStop(0,'rgba('+rgb+','+(state.pointerAlpha*.030).toFixed(3)+')');
      shellLight.addColorStop(.42,'rgba('+rgb+','+(state.pointerAlpha*.010).toFixed(3)+')');
      shellLight.addColorStop(1,'rgba('+rgb+',0)');
      ctx.fillStyle=shellLight;
      ctx.fillRect(44,194,936,468);
      ctx.restore();

      const glow=ctx.createLinearGradient(44,194,980,194);
      glow.addColorStop(0,'rgba(255,255,255,0)');
      glow.addColorStop(.10,accent);
      glow.addColorStop(.22,'rgba(255,255,255,.025)');
      glow.addColorStop(1,'rgba(255,255,255,0)');
      ctx.globalAlpha=.18;
      ctx.fillStyle=glow;
      roundedRect(74,194,340,1.5,.75,true);
      ctx.globalAlpha=1;

      // Recessed lower edge gives the large app surface a little physical depth.
      const lower=ctx.createLinearGradient(0,614,0,662);
      lower.addColorStop(0,'rgba(0,0,0,0)');
      lower.addColorStop(1,'rgba(0,0,0,.16)');
      ctx.fillStyle=lower;
      roundedRect(45,594,934,67,0,true);
    }

    function drawAppBackdrop(appId,accent,rgb){
      ctx.save();
      ctx.globalAlpha=.34;
      ctx.strokeStyle='rgba('+rgb+',.10)';
      ctx.fillStyle='rgba('+rgb+',.055)';
      ctx.lineWidth=1;

      if(appId==='messages'){
        const drift=Math.sin(state.uiTime*.75)*5;
        [0,1,2].forEach(i=>{
          const y=350+i*44;
          roundedRect(730+drift*.25,y,150-i*18,28,14,false);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(900+drift,y+14,2.4+i*.4,0,Math.PI*2);
          ctx.fill();
        });
      }else if(appId==='tasks'){
        [0,1,2].forEach(i=>{
          const x=738+i*54;
          ctx.fillStyle='rgba('+rgb+','+(.035+i*.012).toFixed(3)+')';
          roundedRect(x,354,16,178-i*24,8,true);
          ctx.strokeStyle='rgba('+rgb+',.09)';
          roundedRect(x,354,16,178-i*24,8,false);
          ctx.stroke();
        });
      }else if(appId==='map'){
        const cx=830,cy=430;
        [36,68,100].forEach((radius,i)=>{
          ctx.strokeStyle='rgba('+rgb+','+(.12-i*.025).toFixed(3)+')';
          ctx.beginPath();
          ctx.arc(cx,cy,radius,0,Math.PI*2);
          ctx.stroke();
        });
        const a=state.uiTime*.30;
        ctx.fillStyle=accent;
        ctx.beginPath();
        ctx.arc(cx+Math.cos(a)*68,cy+Math.sin(a)*68,3,0,Math.PI*2);
        ctx.fill();
      }else{
        const x=830,y=430,d=70,l=22;
        [[-d,-d,1,1],[d,-d,-1,1],[-d,d,1,-1],[d,d,-1,-1]].forEach(([ox,oy,sx,sy])=>{
          ctx.beginPath();
          ctx.moveTo(x+ox+sx*l,y+oy);
          ctx.lineTo(x+ox,y+oy);
          ctx.lineTo(x+ox,y+oy+sy*l);
          ctx.stroke();
        });
        const sweepY=y-d+((state.uiTime*.22)%1)*d*2;
        ctx.fillStyle='rgba('+rgb+',.08)';
        ctx.fillRect(x-d,sweepY,d*2,1);
      }

      ctx.restore();
    }

    function drawSystemFooter(context='HOME'){
      text(context.toUpperCase(),62,684,10,'800','#56667d');

      ctx.fillStyle='rgba(255,255,255,.050)';
      roundedRect(438,681,148,4,2,true);

      const phase=(state.uiTime*.42)%1;
      ctx.fillStyle='rgba(127,214,255,.18)';
      roundedRect(438+phase*118,681,30,4,2,true);

      text('POINTER',864,684,10,'650','#56667d');
      ctx.fillStyle='rgba(127,214,255,.30)';
      ctx.beginPath();
      ctx.arc(945,680,3,0,Math.PI*2);
      ctx.fill();
    }

    function appHeader(title,subtitle,accent='#8fc5ff',appId=null){
      text(title.toUpperCase(),70,220,11,'800',accent);
      text(subtitle,70,246,14,'520','#70809a');
      text(title,70,289,40,'690','#f5f8ff');

      ctx.fillStyle='rgba(255,255,255,.050)';
      roundedRect(70,308,884,1,1,true);

      if(appId){
        ctx.fillStyle='rgba(255,255,255,.030)';
        roundedRect(812,210,42,42,14,true);
        strokeRoundRect(812,210,42,42,14,'rgba(255,255,255,.055)',1);
        appIcon(appId,833,231,21,accent,.14);
      }

      ctx.fillStyle='rgba(255,255,255,.035)';
      roundedRect(866,214,88,30,15,true);
      strokeRoundRect(866,214,88,30,15,'rgba(255,255,255,.060)',1);

      const readyPulse=.62+.38*((Math.sin(state.uiTime*2.4)+1)*.5);
      ctx.save();
      ctx.globalAlpha=readyPulse;
      ctx.fillStyle=accent;
      ctx.beginPath();
      ctx.arc(883,229,3.2,0,Math.PI*2);
      ctx.fill();
      ctx.restore();

      text('READY',894,233,10,'800','#8192aa');
    }

    function isHover(key){return state.hoverKey===key;}
    function isPressed(key){return state.pressedKey===key;}

    function card(x,y,w,h,r,key,base='rgba(255,255,255,.055)'){
      const hovered=isHover(key);
      const pressed=isPressed(key);

      ctx.save();

      if(hovered || pressed){
        ctx.shadowColor=pressed?'rgba(112,195,255,.26)':'rgba(82,164,255,.16)';
        ctx.shadowBlur=pressed?30:22;
        ctx.shadowOffsetY=pressed?1:7;
      }

      ctx.fillStyle=pressed
        ? 'rgba(125,190,255,.15)'
        : (hovered?'rgba(255,255,255,.095)':base);
      roundedRect(x,y,w,h,r,true);

      ctx.shadowColor='transparent';
      ctx.shadowBlur=0;
      ctx.shadowOffsetY=0;

      strokeRoundRect(
        x,y,w,h,r,
        pressed?'rgba(178,224,255,.55)':(hovered?'rgba(178,224,255,.28)':'rgba(255,255,255,.075)'),
        pressed?1.6:1
      );

      if((hovered || pressed) && state.pointerAlpha>.01){
        ctx.save();
        roundedRect(x+1,y+1,w-2,h-2,Math.max(4,r-1),false);
        ctx.clip();

        const px=THREE.MathUtils.clamp(state.pointerX,x-60,x+w+60);
        const py=THREE.MathUtils.clamp(state.pointerY,y-60,y+h+60);
        const radius=Math.max(w,h)*.72;
        const glow=ctx.createRadialGradient(px,py,0,px,py,radius);
        glow.addColorStop(0,'rgba(176,224,255,'+(state.pointerAlpha*(pressed?.11:.075)).toFixed(3)+')');
        glow.addColorStop(.35,'rgba(91,165,255,'+(state.pointerAlpha*(pressed?.06:.034)).toFixed(3)+')');
        glow.addColorStop(1,'rgba(91,165,255,0)');
        ctx.fillStyle=glow;
        ctx.fillRect(x,y,w,h);

        const sheenX=THREE.MathUtils.clamp((state.pointerX-x)/Math.max(1,w),0,1);
        const sheen=ctx.createLinearGradient(
          x+w*(sheenX-.16),y+h,
          x+w*(sheenX+.16),y
        );
        sheen.addColorStop(0,'rgba(255,255,255,0)');
        sheen.addColorStop(.5,'rgba(255,255,255,'+(state.pointerAlpha*.040).toFixed(3)+')');
        sheen.addColorStop(1,'rgba(255,255,255,0)');
        ctx.fillStyle=sheen;
        ctx.fillRect(x,y,w,h);
        ctx.restore();
      }

      ctx.restore();
    }

    function base(){
      ctx.clearRect(0,0,width,height);
      ctx.fillStyle='#03060b';
      ctx.fillRect(0,0,width,height);

      const ambientA=ctx.createRadialGradient(150,60,12,150,60,520);
      ambientA.addColorStop(0,'rgba(45,106,190,.20)');
      ambientA.addColorStop(.44,'rgba(22,57,116,.075)');
      ambientA.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ambientA;
      ctx.fillRect(0,0,width,height);

      const ambientB=ctx.createRadialGradient(930,630,12,930,630,470);
      ambientB.addColorStop(0,'rgba(100,66,165,.13)');
      ambientB.addColorStop(.55,'rgba(55,34,100,.045)');
      ambientB.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=ambientB;
      ctx.fillRect(0,0,width,height);

      // Sparse micro-grid gives the display texture without looking like a
      // website background. It remains under 3% alpha for text clarity.
      ctx.fillStyle='rgba(255,255,255,.018)';
      for(let y=118;y<height-42;y+=54){
        for(let x=52+(Math.floor(y/54)%2)*27;x<width-42;x+=54){
          ctx.beginPath();
          ctx.arc(x,y,1,0,Math.PI*2);
          ctx.fill();
        }
      }

      const now=new Date();
      const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});

      // Minimal system rail rather than a large floating web-style navbar.
      text(time,62,61,21,'650','#eaf0f9');
      text('NOVA',486,59,12,'800','#a8b9d1');

      ctx.fillStyle='#83dcff';
      ctx.beginPath();
      ctx.arc(860,54,3.2,0,Math.PI*2);
      ctx.fill();
      text('LIVE',871,59,11,'750','#94a7c1');

      ctx.strokeStyle='rgba(255,255,255,.32)';
      ctx.lineWidth=1.4;
      roundedRect(920,48,27,13,4,false);
      ctx.stroke();
      ctx.fillStyle='#a4f0c2';
      roundedRect(923,51,19,7,2,true);
      ctx.fillStyle='rgba(255,255,255,.26)';
      roundedRect(948,52,3,5,1.5,true);

      ctx.fillStyle='rgba(255,255,255,.05)';
      roundedRect(52,87,920,1,1,true);
    }

    function drawHome(){
      // Flagship home: one calm world-status surface above a compact app deck.
      // The hierarchy is intentionally OS-like rather than a grid of web cards.
      ctx.fillStyle='rgba(7,11,18,.62)';
      roundedRect(52,112,920,136,32,true);
      strokeRoundRect(52,112,920,136,32,'rgba(255,255,255,.060)',1);

      const heroGlow=ctx.createRadialGradient(860,174,10,860,174,210);
      heroGlow.addColorStop(0,'rgba(127,214,255,.11)');
      heroGlow.addColorStop(.52,'rgba(95,120,255,.035)');
      heroGlow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=heroGlow;
      roundedRect(53,113,918,134,31,true);

      text('WORLD 01',76,144,11,'800','#7fd6ff');
      text('NOVA PAD',76,187,37,'720','#f7f9fd');
      text('Spatial console · all systems nominal',78,214,14,'520','#75869f');

      // Right-side world telemetry gives the home screen a distinctive
      // "device dashboard" identity without adding another fake navigation bar.
      const orbitX=840;
      const orbitY=178;
      const phase=state.uiTime*.42;

      ctx.strokeStyle='rgba(127,214,255,.12)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.arc(orbitX,orbitY,50,0,Math.PI*2);
      ctx.stroke();

      ctx.strokeStyle='rgba(205,183,255,.10)';
      ctx.beginPath();
      ctx.arc(orbitX,orbitY,36,0,Math.PI*2);
      ctx.stroke();

      const dotX=orbitX+Math.cos(phase)*50;
      const dotY=orbitY+Math.sin(phase)*50;
      ctx.fillStyle='#7fd6ff';
      ctx.beginPath();
      ctx.arc(dotX,dotY,3.2,0,Math.PI*2);
      ctx.fill();

      ctx.fillStyle='rgba(127,214,255,.08)';
      ctx.beginPath();
      ctx.arc(orbitX,orbitY,20,0,Math.PI*2);
      ctx.fill();
      ctx.strokeStyle='rgba(127,214,255,.20)';
      ctx.beginPath();
      ctx.arc(orbitX,orbitY,20,0,Math.PI*2);
      ctx.stroke();
      text('01',orbitX-9,orbitY+5,13,'800','#bdeaff');

      const statusItems=[
        ['MIRA','ONLINE','#7fd6ff'],
        ['ROOM','ACTIVE','#9effc4'],
        ['SYNC','98%','#cdb7ff']
      ];
      statusItems.forEach((item,i)=>{
        const sy=142+i*29;
        ctx.fillStyle='rgba(255,255,255,.030)';
        roundedRect(894,sy,60,22,11,true);
        ctx.fillStyle=item[2];
        ctx.beginPath();
        ctx.arc(905,sy+11,2.5,0,Math.PI*2);
        ctx.fill();
        text(item[0],914,sy+9,8,'800','#5f7088');
        text(item[1],914,sy+18,9,'720','#c8d3e4');
      });

      text('APPLICATION DECK',62,280,11,'800','#60718a');
      text('04 modules',854,280,11,'650','#55667d');

      appRects.length=0;
      const focusLevel=Math.max(...state.appHover);
      apps.forEach((app,i)=>{
        const col=i%2;
        const row=Math.floor(i/2);
        const x=62+col*480;
        const y=298+row*146;
        const rect={...app,x,y,w:420,h:126,key:'app:'+app.id,type:'app'};
        appRects.push(rect);

        const hovered=isHover(rect.key);
        const pressed=isPressed(rect.key);
        const hoverMix=state.appHover[i] || 0;
        const yLift=pressed?1:-2*hoverMix;
        const localX=THREE.MathUtils.clamp((state.pointerX-(x+210))/210,-1,1);
        const localY=THREE.MathUtils.clamp((state.pointerY-(y+63))/63,-1,1);
        const magnetX=localX*hoverMix*2.4;
        const magnetY=localY*hoverMix*1.5;

        ctx.save();
        const focusAlpha=1-focusLevel*(1-hoverMix)*.28;
        ctx.globalAlpha=focusAlpha;
        ctx.translate(0,yLift);

        if(hoverMix>.01){
          ctx.shadowColor='rgba('+app.rgb+','+(.05+.11*hoverMix).toFixed(3)+')';
          ctx.shadowBlur=14+12*hoverMix;
          ctx.shadowOffsetY=5+4*hoverMix;
        }

        const surface=ctx.createLinearGradient(x,y,x+420,y+126);
        surface.addColorStop(0,'rgba('+(11+7*hoverMix).toFixed(1)+','+(17+9*hoverMix).toFixed(1)+','+(26+13*hoverMix).toFixed(1)+','+(.88+.06*hoverMix).toFixed(3)+')');
        surface.addColorStop(1,'rgba('+(8+3*hoverMix).toFixed(1)+','+(13+5*hoverMix).toFixed(1)+','+(22+7*hoverMix).toFixed(1)+','+(.90+.06*hoverMix).toFixed(3)+')');
        ctx.fillStyle=surface;
        roundedRect(x,y,420,126,28,true);

        ctx.shadowColor='transparent';
        ctx.shadowBlur=0;
        ctx.shadowOffsetY=0;

        strokeRoundRect(
          x,y,420,126,28,
          hoverMix>.01
            ? 'rgba('+app.rgb+','+(.065+.215*hoverMix).toFixed(3)+')'
            : 'rgba(255,255,255,.065)',
          1+.3*hoverMix
        );

        if(hoverMix>.01){
          ctx.save();
          roundedRect(x+1,y+1,418,124,27,false);
          ctx.clip();
          const edgeX=THREE.MathUtils.clamp(state.pointerX,x,x+420);
          const edgeGlow=ctx.createLinearGradient(edgeX-90,y,edgeX+90,y);
          edgeGlow.addColorStop(0,'rgba('+app.rgb+',0)');
          edgeGlow.addColorStop(.5,'rgba('+app.rgb+','+(.06*hoverMix).toFixed(3)+')');
          edgeGlow.addColorStop(1,'rgba('+app.rgb+',0)');
          ctx.fillStyle=edgeGlow;
          ctx.fillRect(x,y,420,2);
          ctx.restore();
        }

        // Restrained accent wash lives behind the icon rather than across text.
        const glow=ctx.createRadialGradient(x+62+magnetX,y+55+magnetY,2,x+62+magnetX,y+55+magnetY,105);
        glow.addColorStop(0,'rgba('+app.rgb+','+(.095+.075*hoverMix).toFixed(3)+')');
        glow.addColorStop(.55,'rgba('+app.rgb+',.025)');
        glow.addColorStop(1,'rgba('+app.rgb+',0)');
        ctx.fillStyle=glow;
        roundedRect(x+1,y+1,418,124,27,true);

        ctx.save();
        ctx.translate(magnetX,magnetY);
        ctx.fillStyle='rgba('+app.rgb+','+(.10+.06*hoverMix).toFixed(3)+')';
        roundedRect(x+20,y+20,70,70,20,true);
        strokeRoundRect(x+20,y+20,70,70,20,'rgba('+app.rgb+','+(.17+.13*hoverMix).toFixed(3)+')',1);

        if(hoverMix>.01){
          ctx.save();
          roundedRect(x+21,y+21,68,68,19,false);
          ctx.clip();
          const sweepX=x+2+((state.uiTime*.18+i*.21)%1)*110;
          const iconSheen=ctx.createLinearGradient(sweepX-26,y+22,sweepX+26,y+88);
          iconSheen.addColorStop(0,'rgba(255,255,255,0)');
          iconSheen.addColorStop(.5,'rgba(255,255,255,'+(.055*hoverMix).toFixed(3)+')');
          iconSheen.addColorStop(1,'rgba(255,255,255,0)');
          ctx.fillStyle=iconSheen;
          ctx.fillRect(x+20,y+20,70,70);
          ctx.restore();
        }

        appIcon(app.id,x+55,y+55,38,app.accent,hoverMix);
        ctx.restore();

        text(app.label,x+112+magnetX*.35,y+49+magnetY*.22,23,'690','#f4f7fc');
        text(app.short,x+112+magnetX*.22,y+72+magnetY*.16,13,'520','#72829a');

        // System state on every tile makes the deck feel coherent and alive.
        ctx.fillStyle='rgba(255,255,255,.035)';
        roundedRect(x+112,y+88,88,22,11,true);
        ctx.fillStyle=app.accent;
        ctx.beginPath();
        ctx.arc(x+126,y+99,2.8,0,Math.PI*2);
        ctx.fill();
        text('READY',x+136,y+103,9,'800','#7e8fa7');

        text('0'+(i+1),x+24,y+111,10,'800','rgba('+app.rgb+',.60)');

        ctx.strokeStyle=hoverMix>.01
          ? 'rgba('+app.rgb+','+(.28+.72*hoverMix).toFixed(3)+')'
          : '#4e5e73';
        ctx.lineWidth=1.4;
        ctx.beginPath();
        ctx.arc(x+386,y+34,11,0,Math.PI*2);
        ctx.stroke();
        text('›',x+382+magnetX*.45,y+39+magnetY*.2,15,'700',hoverMix>.01?app.accent:'#617087');

        // Short activity trace animates subtly on the hovered module.
        ctx.fillStyle='rgba(255,255,255,.045)';
        roundedRect(x+228,y+98,122,2,1,true);
        const trace=(34+i*8)*(1-hoverMix)+(72+Math.sin(state.uiTime*4+i)*18)*hoverMix;
        ctx.fillStyle='rgba('+app.rgb+','+(.32+.33*hoverMix).toFixed(3)+')';
        roundedRect(x+228,y+98,trace,2,1,true);

        if(app.id==='messages' && state.messageUnread){
          ctx.fillStyle='#ff9faf';
          ctx.beginPath();
          ctx.arc(x+385,y+99,5.5,0,Math.PI*2);
          ctx.fill();
        }

        ctx.restore();
      });

      text('E',62,662,10,'800','#91a5be');
      text('CLOSE PAD',80,662,10,'650','#596a82');
      drawSystemFooter('WORLD DECK');
    }

    function drawBack(){
      const hovered=isHover(backRect.key);
      ctx.fillStyle=hovered?'rgba(127,214,255,.09)':'rgba(255,255,255,.035)';
      roundedRect(backRect.x,backRect.y,backRect.w,backRect.h,18,true);
      strokeRoundRect(
        backRect.x,backRect.y,backRect.w,backRect.h,18,
        hovered?'rgba(127,214,255,.24)':'rgba(255,255,255,.06)',1
      );
      text('‹',82,160,27,'500',hovered?'#dff4ff':'#91a1b8');
      text('HOME',108,156,12,'800',hovered?'#dff4ff':'#91a1b8');
    }

    function drawMessages(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(127,214,255,'+(state.actionPulse*.035).toFixed(3)+')';
        roundedRect(48,204,928,438,30,true);
      }
      appHeader('Messages','Mira · online','#7fd6ff','messages');

      ctx.fillStyle='rgba(127,214,255,.09)';
      roundedRect(70,306,44,44,22,true);
      strokeRoundRect(70,306,44,44,22,'rgba(127,214,255,.22)',1);
      text('M',84,335,18,'750','#aee8ff');
      text('Mira',128,323,14,'700','#dfe8f6');
      text('just now',128,344,12,'500','#65758f');

      const incoming=ctx.createLinearGradient(70,366,610,430);
      incoming.addColorStop(0,'rgba(255,255,255,.085)');
      incoming.addColorStop(1,'rgba(255,255,255,.035)');
      ctx.fillStyle=incoming;
      roundedRect(70,366,590,68,24,true);
      strokeRoundRect(70,366,590,68,24,'rgba(255,255,255,.075)',1);
      text('Welcome back. Your world is ready.',96,407,20,'550','#eaf0f9');

      const outgoing=ctx.createLinearGradient(364,448,954,516);
      outgoing.addColorStop(0,'rgba(89,158,255,.20)');
      outgoing.addColorStop(1,'rgba(89,158,255,.08)');
      ctx.fillStyle=outgoing;
      roundedRect(364,448,590,68,24,true);
      strokeRoundRect(364,448,590,68,24,'rgba(127,214,255,.17)',1);
      text('I am checking the room now.',390,489,20,'550','#dceaff');

      if(state.messageChoice===null){
        text('QUICK REPLY',72,550,12,'750','#667995');
        messageRects.forEach((rect,i)=>{
          const selected=isHover(rect.key)||isPressed(rect.key);
          card(rect.x,rect.y,rect.w,rect.h,18,rect.key,'rgba(255,255,255,.045)');
          text(rect.label,rect.x+22,rect.y+35,17,'600',selected?'#eef8ff':'#b7c5d9');
          text('↗',rect.x+rect.w-38,rect.y+35,16,'600',selected?'#7fd6ff':'#596980');
        });
      }else{
        const selected=messageRects[state.messageChoice];
        ctx.fillStyle='rgba(89,158,255,.16)';
        roundedRect(410,548,544,54,19,true);
        strokeRoundRect(410,548,544,54,19,'rgba(127,214,255,.14)',1);
        text(selected.label,436,581,17,'550','#e2ecff');

        if(state.messageReplyPending){
          ctx.fillStyle='rgba(255,255,255,.050)';
          roundedRect(70,616,260,40,16,true);
          text('Mira is typing'+'.'.repeat(1+Math.floor(state.uiTime*3)%3),92,642,14,'550','#8193ad');
        }else if(state.messageReply){
          ctx.fillStyle='rgba(255,255,255,.060)';
          roundedRect(70,616,630,40,16,true);
          text(state.messageReply,94,642,15,'550','#d9e2ef');
        }
      }
    }

    function drawTasks(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(158,255,196,'+(state.actionPulse*.032).toFixed(3)+')';
        roundedRect(48,204,928,438,30,true);
      }
      appHeader('Tasks','Today · focused mode','#9effc4','tasks');

      const doneCount=state.completedTasks.filter(Boolean).length;
      ctx.fillStyle='rgba(158,255,196,.055)';
      roundedRect(70,304,884,64,22,true);
      strokeRoundRect(70,304,884,64,22,'rgba(158,255,196,.11)',1);
      text(doneCount+' / 3',94,337,24,'720','#dcffe9');
      text('completed',160,337,13,'650','#708a7b');
      ctx.fillStyle='rgba(255,255,255,.055)';
      roundedRect(300,331,620,6,3,true);
      ctx.fillStyle='#9effc4';
      roundedRect(300,331,Math.max(10,620*(doneCount/3)),6,3,true);

      const rows=[
        ['Explore the room','ACTIVE','#7fd6ff'],
        ['Talk with Mira','NEXT','#9effc4'],
        ['Inspect the window','OPTIONAL','#cdb7ff']
      ];

      taskRects.length=0;
      rows.forEach((row,i)=>{
        const y=390+i*82;
        const key='task:'+i;
        const rect={x:70,y,w:884,h:64,key,type:'task',index:i};
        taskRects.push(rect);

        const done=state.completedTasks[i];
        card(70,y,884,64,20,key,done?'rgba(158,255,196,.035)':'rgba(255,255,255,.045)');

        ctx.fillStyle=done?'#9effc4':'rgba(255,255,255,.035)';
        ctx.beginPath();
        ctx.arc(105,y+32,13,0,Math.PI*2);
        ctx.fill();
        ctx.strokeStyle=done?'rgba(158,255,196,.55)':'rgba(145,165,194,.45)';
        ctx.lineWidth=1.5;
        ctx.stroke();

        if(done) text('✓',98,y+38,16,'800','#10251a');

        text(row[0],136,y+39,19,done?'550':'650',done?'#75857f':'#e9eef7');
        pill(790,y+18,132,28,done?'DONE':row[1],done?'#9effc4':row[2],done);

        if(done){
          ctx.strokeStyle='rgba(158,255,196,.18)';
          ctx.lineWidth=1.5;
          ctx.beginPath();
          ctx.moveTo(136,y+32);
          ctx.lineTo(360,y+32);
          ctx.stroke();
        }
      });
    }

    function drawMap(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(205,183,255,'+(state.actionPulse*.028).toFixed(3)+')';
        roundedRect(48,204,928,438,30,true);
      }
      appHeader('Map','Apartment · Level 01','#cdb7ff','map');

      ctx.fillStyle='rgba(255,255,255,.030)';
      roundedRect(70,306,884,316,28,true);
      strokeRoundRect(70,306,884,316,28,'rgba(255,255,255,.07)',1);

      ctx.fillStyle='rgba(205,183,255,.035)';
      roundedRect(94,330,512,250,24,true);
      ctx.fillStyle='rgba(127,214,255,.030)';
      roundedRect(622,330,306,112,22,true);
      roundedRect(622,458,144,122,22,true);
      roundedRect(784,458,144,122,22,true);

      ctx.strokeStyle='rgba(214,222,241,.15)';
      ctx.lineWidth=1.4;
      ctx.strokeRect(94,330,512,250);
      ctx.strokeRect(622,330,306,112);
      ctx.strokeRect(622,458,144,122);
      ctx.strokeRect(784,458,144,122);

      text('LIVING',118,357,11,'750','#62718b');
      text('STUDY',646,357,11,'750','#62718b');
      text('ENTRY',646,484,11,'750','#62718b');
      text('WINDOW',808,484,11,'750','#62718b');

      const youPulse=5+Math.sin(state.uiTime*3.1)*2;
      ctx.strokeStyle='rgba(141,229,255,.22)';
      ctx.lineWidth=1.5;
      ctx.beginPath();ctx.arc(342,516,18+youPulse,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#8de5ff';
      ctx.beginPath();ctx.arc(342,516,9,0,Math.PI*2);ctx.fill();
      text('YOU',364,522,13,'750','#9ae9ff');

      const miraPulse=4+Math.sin(state.uiTime*2.6+1.2)*1.5;
      ctx.strokeStyle='rgba(255,159,175,.18)';
      ctx.beginPath();ctx.arc(500,366,18+miraPulse,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#ff9faf';
      ctx.beginPath();ctx.arc(500,366,9,0,Math.PI*2);ctx.fill();
      text('MIRA',522,372,13,'750','#ffb5c0');

      if(state.mapFocus==='mira'){
        ctx.fillStyle='rgba(255,159,175,.075)';
        roundedRect(610,600,318,48,18,true);
        strokeRoundRect(610,600,318,48,18,'rgba(255,159,175,.14)',1);
        text('MIRA',632,630,14,'750','#ffc0ca');
        text('3.8 m · living room',700,630,13,'550','#8f7890');
      }else{
        pill(94,594,250,34,'TAP MIRA TO MARK','#cdb7ff',false);
      }
    }

    function drawScanner(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(255,201,138,'+(state.actionPulse*.030).toFixed(3)+')';
        roundedRect(48,204,928,450,30,true);
      }
      const status=state.scanning
        ? 'SCANNING '+Math.round(state.scannerProgress*100)+'%'
        : (state.scannerComplete?'SCAN COMPLETE':'LIVE OBJECT ANALYSIS');
      appHeader('Scanner',status,state.scannerComplete?'#9effc4':'#ffc98a','scanner');

      ctx.fillStyle='rgba(255,255,255,.026)';
      roundedRect(184,304,656,258,30,true);
      strokeRoundRect(184,304,656,258,30,'rgba(255,255,255,.065)',1);

      const accent=state.scannerComplete?'#9effc4':'#ffc98a';
      const corner=42;
      const left=218,right=806,top=330,bottom=536;
      ctx.strokeStyle=accent;
      ctx.lineWidth=2;
      [[left,top,1,1],[right,top,-1,1],[left,bottom,1,-1],[right,bottom,-1,-1]].forEach(([x,y,sx,sy])=>{
        ctx.beginPath();
        ctx.moveTo(x+sx*corner,y);
        ctx.lineTo(x,y);
        ctx.lineTo(x,y+sy*corner);
        ctx.stroke();
      });

      ctx.strokeStyle='rgba(255,255,255,.08)';
      ctx.lineWidth=1;
      ctx.beginPath();
      ctx.moveTo(512,348);ctx.lineTo(512,518);
      ctx.moveTo(246,432);ctx.lineTo(778,432);
      ctx.stroke();

      if(state.scanning){
        const scanY=344+state.scannerProgress*172;
        const beam=ctx.createLinearGradient(218,scanY-30,218,scanY+30);
        beam.addColorStop(0,'rgba(255,201,138,0)');
        beam.addColorStop(.5,'rgba(255,201,138,.18)');
        beam.addColorStop(1,'rgba(255,201,138,0)');
        ctx.fillStyle=beam;
        ctx.fillRect(218,scanY-30,588,60);

        ctx.strokeStyle='rgba(255,226,194,.82)';
        ctx.lineWidth=1.5;
        ctx.beginPath();ctx.moveTo(218,scanY);ctx.lineTo(806,scanY);ctx.stroke();
      }

      if(state.scannerComplete){
        ctx.fillStyle='rgba(158,255,196,.065)';
        roundedRect(360,372,304,128,24,true);
        strokeRoundRect(360,372,304,128,24,'rgba(158,255,196,.14)',1);
        text('MIRA',454,413,27,'720','#d9ffe8');
        text('HUMAN · FRIENDLY',430,447,12,'750','#719281');
        pill(430,462,164,28,'CONFIDENCE 98%','#9effc4',true);
      }else{
        pill(434,402,156,30,'TARGET READY','#ffc98a',false);
      }

      card(scannerRect.x,scannerRect.y,scannerRect.w,scannerRect.h,22,scannerRect.key,'rgba(255,201,138,.065)');
      const buttonLabel=state.scanning?'SCANNING…':(state.scannerComplete?'SCAN AGAIN':'RUN SCAN');
      const buttonX=state.scanning?431:(state.scannerComplete?438:448);
      text(buttonLabel,buttonX,621,18,'750',state.scannerComplete?'#bfffd7':'#ffd7aa');
    }

    function drawApp(appId=state.activeApp){
      const meta=appMeta(appId);
      const accent=meta.accent;
      const rgb=meta.rgb;

      appShell(accent,rgb);
      drawAppBackdrop(appId,accent,rgb);
      drawBack();

      if(appId==='messages') drawMessages();
      else if(appId==='tasks') drawTasks();
      else if(appId==='map') drawMap();
      else if(appId==='scanner') drawScanner();

      drawSystemFooter(appId || 'APP');
    }

    function drawTransitionPortal(raw,kind,appId){
      const index=apps.findIndex(app=>app.id===appId);
      if(index<0) return;

      const cardX=62+(index%2)*480;
      const cardY=298+Math.floor(index/2)*146;
      const cardW=420;
      const cardH=126;
      const shellX=44;
      const shellY=194;
      const shellW=936;
      const shellH=468;

      const openProgress=kind==='open' ? easeInOut(raw) : 1-easeInOut(raw);
      const x=THREE.MathUtils.lerp(cardX,shellX,openProgress);
      const y=THREE.MathUtils.lerp(cardY,shellY,openProgress);
      const w=THREE.MathUtils.lerp(cardW,shellW,openProgress);
      const h=THREE.MathUtils.lerp(cardH,shellH,openProgress);
      const radius=THREE.MathUtils.lerp(28,34,openProgress);
      const app=apps[index];
      const envelope=Math.sin(Math.PI*THREE.MathUtils.clamp(raw,0,1));

      ctx.save();
      ctx.globalCompositeOperation='screen';
      ctx.globalAlpha=.30*envelope;

      const bloom=ctx.createRadialGradient(
        x+w*.18,y+h*.22,4,
        x+w*.18,y+h*.22,Math.max(w,h)*.60
      );
      bloom.addColorStop(0,'rgba('+app.rgb+',.26)');
      bloom.addColorStop(.42,'rgba('+app.rgb+',.07)');
      bloom.addColorStop(1,'rgba('+app.rgb+',0)');
      ctx.fillStyle=bloom;
      roundedRect(x,y,w,h,radius,true);

      ctx.globalAlpha=.52*envelope;
      strokeRoundRect(x,y,w,h,radius,'rgba('+app.rgb+',.42)',1.4);
      ctx.restore();
    }

    function easeOutCubic(t){
      return 1-Math.pow(1-t,3);
    }

    function easeInOut(t){
      return t<.5 ? 4*t*t*t : 1-Math.pow(-2*t+2,3)/2;
    }

    function drawLayer(drawFn,{dx=0,dy=0,scale=1,alpha=1}={}){
      ctx.save();
      ctx.globalAlpha=alpha;
      ctx.translate(width/2+dx,height/2+dy);
      ctx.scale(scale,scale);
      ctx.translate(-width/2,-height/2);
      drawFn();
      ctx.restore();
    }

    function drawPointerAura(){
      if(state.pointerAlpha<=.002) return;

      ctx.save();
      ctx.globalCompositeOperation='screen';

      const hoverBoost=state.hoverKey?1.35:1;
      const radius=state.hoverKey?170:135;
      const glow=ctx.createRadialGradient(
        state.pointerX,state.pointerY,0,
        state.pointerX,state.pointerY,radius
      );
      glow.addColorStop(0,'rgba(186,229,255,'+(state.pointerAlpha*.075*hoverBoost).toFixed(3)+')');
      glow.addColorStop(.28,'rgba(98,177,255,'+(state.pointerAlpha*.045*hoverBoost).toFixed(3)+')');
      glow.addColorStop(1,'rgba(98,177,255,0)');
      ctx.fillStyle=glow;
      ctx.fillRect(0,0,width,height);

      ctx.fillStyle='rgba(224,245,255,'+(state.pointerAlpha*.18).toFixed(3)+')';
      ctx.beginPath();
      ctx.arc(state.pointerX,state.pointerY,2.2,0,Math.PI*2);
      ctx.fill();

      ctx.restore();
    }

    function drawRipples(){
      if(!state.ripples.length) return;

      ctx.save();
      ctx.globalCompositeOperation='screen';

      state.ripples.forEach(ripple=>{
        const p=Math.min(1,ripple.age/ripple.life);
        const eased=1-Math.pow(1-p,3);
        const radius=12+118*eased;
        const alpha=Math.pow(1-p,2);

        const glow=ctx.createRadialGradient(
          ripple.x,ripple.y,Math.max(1,radius*.2),
          ripple.x,ripple.y,radius
        );
        glow.addColorStop(0,'rgba(148,214,255,0)');
        glow.addColorStop(.64,'rgba(148,214,255,'+(alpha*.035).toFixed(3)+')');
        glow.addColorStop(.82,'rgba(190,232,255,'+(alpha*.16).toFixed(3)+')');
        glow.addColorStop(1,'rgba(148,214,255,0)');

        ctx.fillStyle=glow;
        ctx.beginPath();
        ctx.arc(ripple.x,ripple.y,radius,0,Math.PI*2);
        ctx.fill();

        ctx.strokeStyle='rgba(205,239,255,'+(alpha*.48).toFixed(3)+')';
        ctx.lineWidth=1.5+alpha*1.5;
        ctx.beginPath();
        ctx.arc(ripple.x,ripple.y,radius*.78,0,Math.PI*2);
        ctx.stroke();
      });

      ctx.restore();
    }

    function pulseUv(uv){
      const point=pointFromUv(uv);
      if(!point) return;
      state.ripples.push({
        x:point.x,
        y:point.y,
        age:0,
        life:.42
      });
      if(state.ripples.length>4) state.ripples.shift();
      draw();
    }

    function reflection(){
      // Keep decorative glass treatment at the extreme edges so text and icons
      // remain crisp. The physical runtime bridge handles the moving highlights.
      const edge=ctx.createLinearGradient(0,0,width,0);
      edge.addColorStop(0,'rgba(168,214,255,.035)');
      edge.addColorStop(.08,'rgba(168,214,255,0)');
      edge.addColorStop(.92,'rgba(255,255,255,0)');
      edge.addColorStop(1,'rgba(210,232,255,.025)');
      ctx.fillStyle=edge;
      ctx.fillRect(0,0,width,height);

      const vignette=ctx.createLinearGradient(0,0,0,height);
      vignette.addColorStop(0,'rgba(255,255,255,.015)');
      vignette.addColorStop(.14,'rgba(255,255,255,0)');
      vignette.addColorStop(.86,'rgba(0,0,0,0)');
      vignette.addColorStop(1,'rgba(0,0,0,.10)');
      ctx.fillStyle=vignette;
      ctx.fillRect(0,0,width,height);
    }

    function draw(){
      base();

      if(state.transitionKind){
        const raw=THREE.MathUtils.clamp(state.transitionProgress,0,1);
        const p=easeInOut(raw);

        if(state.transitionKind==='open'){
          drawLayer(
            drawHome,
            {dx:-54*p,dy:-3*p,scale:1-.018*p,alpha:1-p*.82}
          );
          const contentP=THREE.MathUtils.clamp((raw-.08)/.92,0,1);
          drawLayer(
            ()=>drawApp(state.transitionApp),
            {
              dx:74*(1-p),
              dy:3*(1-p),
              scale:.972+.028*easeOutCubic(raw),
              alpha:.10+.90*contentP
            }
          );
          drawTransitionPortal(raw,'open',state.transitionApp);
        }else{
          drawLayer(
            ()=>drawApp(state.transitionApp),
            {dx:62*p,dy:2*p,scale:1-.022*p,alpha:1-p*.86}
          );
          drawLayer(
            drawHome,
            {dx:-66*(1-p),dy:3*(1-p),scale:.976+.024*easeOutCubic(raw),alpha:.16+.84*p}
          );
          drawTransitionPortal(raw,'close',state.transitionApp);
        }
      }else if(state.activeApp){
        drawApp();
      }else{
        drawHome();
      }

      drawPointerAura();
      drawRipples();
      reflection();
      texture.needsUpdate=true;
    }

    function contains(rect,x,y){
      return x>=rect.x && x<=rect.x+rect.w && y>=rect.y && y<=rect.y+rect.h;
    }

    function pointFromUv(uv){
      if(!uv) return null;
      return {x:uv.x*width,y:(1-uv.y)*height};
    }

    function hitTestUv(uv){
      if(state.transitionKind) return null;
      const point=pointFromUv(uv);
      if(!point) return null;
      const {x,y}=point;

      if(state.activeApp){
        if(contains(backRect,x,y)) return backRect;
        if(state.activeApp==='messages' && state.messageChoice===null){
          const reply=messageRects.find(r=>contains(r,x,y));
          if(reply) return reply;
        }
        if(state.activeApp==='tasks'){
          const task=taskRects.find(r=>contains(r,x,y));
          if(task) return task;
        }
        if(state.activeApp==='map' && contains(miraMapRect,x,y)) return miraMapRect;
        if(state.activeApp==='scanner' && contains(scannerRect,x,y)) return scannerRect;
        return null;
      }

      return appRects.find(r=>contains(r,x,y)) || null;
    }

    function setPointerUv(uv){
      const point=pointFromUv(uv);
      state.pointerVisible=Boolean(point);

      if(point){
        state.pointerTargetX=point.x;
        state.pointerTargetY=point.y;
      }

      const hit=hitTestUv(uv);
      const next=hit?.key || null;
      if(next!==state.hoverKey){
        state.hoverKey=next;
        draw();
      }
      return hit;
    }

    function setPressedUv(uv){
      const hit=hitTestUv(uv);
      const next=hit?.key || null;
      if(next===state.pressedKey) return hit;
      state.pressedKey=next;
      draw();
      return hit;
    }

    function clearPressed(){
      if(state.pressedKey===null) return;
      state.pressedKey=null;
      draw();
    }

    function activateHit(hit){
      if(!hit) return null;

      if(hit.type==='back'){
        const previous=state.activeApp;
        state.transitionKind='close';
        state.transitionProgress=0;
        state.transitionApp=previous;
        state.hoverKey=null;
        state.pressedKey=null;
        state.actionPulse=1;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-app-close',{detail:{app:previous}}));
        return {type:'back',app:previous};
      }

      if(hit.type==='app'){
        state.activeApp=hit.id;
        if(hit.id==='messages') state.messageUnread=false;
        state.transitionKind='open';
        state.transitionProgress=0;
        state.transitionApp=hit.id;
        state.hoverKey=null;
        state.pressedKey=null;
        state.actionPulse=1;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-app-open',{detail:{app:hit.id}}));
        return {type:'open',app:hit.id};
      }

      if(hit.type==='message-action'){
        if(state.messageChoice!==null) return null;
        state.messageChoice=hit.index;
        state.messageReplyPending=true;
        state.messageReplyTimer=0;
        state.completedTasks[1]=true;
        state.actionPulse=1;
        state.pressedKey=null;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-message-send',{
          detail:{text:hit.label}
        }));
        window.dispatchEvent(new CustomEvent('tablet-task-toggle',{
          detail:{index:1,completed:true}
        }));
        return {type:'message',index:hit.index};
      }

      if(hit.type==='task'){
        state.completedTasks[hit.index]=!state.completedTasks[hit.index];
        state.pressedKey=null;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-task-toggle',{
          detail:{index:hit.index,completed:state.completedTasks[hit.index]}
        }));
        return {type:'task',index:hit.index,completed:state.completedTasks[hit.index]};
      }

      if(hit.type==='map-focus'){
        state.mapFocus=hit.target;
        state.actionPulse=1;
        state.pressedKey=null;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-map-focus',{
          detail:{target:hit.target}
        }));
        return {type:'map-focus',target:hit.target};
      }

      if(hit.type==='scanner-action'){
        if(state.scanning) return null;
        state.scannerComplete=false;
        state.scanning=true;
        state.scannerProgress=0;
        state.actionPulse=1;
        state.pressedKey=null;
        draw();
        window.dispatchEvent(new CustomEvent('tablet-scan-start'));
        return {type:'scanner-start'};
      }

      return null;
    }

    let lastUpdateTime=null;
    let lastAnimatedDraw=0;

    function update(t,open=true){
      if(lastUpdateTime===null) lastUpdateTime=t;
      const dt=Math.min(.05,Math.max(0,t-lastUpdateTime));
      lastUpdateTime=t;
      state.uiTime=t;

      const pointerFollow=1-Math.pow(.00008,Math.max(.001,dt));
      const alphaFollow=1-Math.pow(.00002,Math.max(.001,dt));
      state.pointerX=THREE.MathUtils.lerp(state.pointerX,state.pointerTargetX,pointerFollow);
      state.pointerY=THREE.MathUtils.lerp(state.pointerY,state.pointerTargetY,pointerFollow);
      state.pointerAlpha=THREE.MathUtils.lerp(state.pointerAlpha,state.pointerVisible?1:0,alphaFollow);

      const hoverFollow=1-Math.pow(.00045,Math.max(.001,dt));
      state.appHover.forEach((value,i)=>{
        const target=state.hoverKey==='app:'+apps[i].id ? 1 : 0;
        state.appHover[i]=THREE.MathUtils.lerp(value,target,hoverFollow);
      });

      if(state.messageReplyPending){
        state.messageReplyTimer+=dt;
        if(state.messageReplyTimer>=.78){
          state.messageReplyPending=false;
          state.messageReply='Good. I’ll wait by the window.';
          state.messageUnread=state.activeApp!=='messages';
          state.actionPulse=1;
          window.dispatchEvent(new CustomEvent('tablet-message-reply',{
            detail:{text:state.messageReply}
          }));
        }
      }

      if(state.scanning){
        state.scannerProgress=Math.min(1,state.scannerProgress+dt/.95);
        if(state.scannerProgress>=1){
          state.scanning=false;
          state.scannerComplete=true;
          state.actionPulse=1;
          window.dispatchEvent(new CustomEvent('tablet-scan',{
            detail:{complete:true}
          }));
        }
      }

      if(state.transitionKind){
        const duration=state.transitionKind==='open'?.24:.21;
        state.transitionProgress=Math.min(1,state.transitionProgress+dt/duration);

        if(state.transitionProgress>=1){
          if(state.transitionKind==='close'){
            state.activeApp=null;
          }
          state.transitionKind=null;
          state.transitionApp=null;
          state.transitionProgress=1;
          state.hoverKey=null;
          state.pressedKey=null;
        }
      }

      state.actionPulse=Math.max(0,state.actionPulse-dt*2.4);

      if(state.ripples.length){
        state.ripples.forEach(ripple=>{ripple.age+=dt;});
        state.ripples=state.ripples.filter(ripple=>ripple.age<ripple.life);
      }

      const animated=open && (
        Boolean(state.transitionKind) ||
        state.messageReplyPending ||
        state.pointerAlpha>.002 ||
        state.ripples.length>0 ||
        !state.activeApp ||
        state.activeApp==='map' ||
        state.activeApp==='scanner' ||
        state.actionPulse>0
      );

      const frameStep=(state.transitionKind || state.pointerAlpha>.002)?1/60:1/30;
      if(animated && t-lastAnimatedDraw>=frameStep){
        lastAnimatedDraw=t;
        draw();
      }
    }

    function handleUv(uv){
      return activateHit(hitTestUv(uv));
    }

    draw();

    return {
      canvas,ctx,texture,draw,state,update,pulseUv,
      hitTestUv,setPointerUv,setPressedUv,clearPressed,handleUv
    };
  };
})();
