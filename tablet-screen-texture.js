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
      mapFocus:null
    };

    const apps=[
      {id:'messages',label:'Messages',short:'MSG'},
      {id:'tasks',label:'Tasks',short:'TASK'},
      {id:'map',label:'Map',short:'MAP'},
      {id:'scanner',label:'Scanner',short:'SCAN'}
    ];

    const appRects=[];
    const taskRects=[];
    const messageRects=[
      {x:70,y:505,w:420,h:56,key:'message:0',type:'message-action',index:0,label:'On my way.'},
      {x:510,y:505,w:444,h:56,key:'message:1',type:'message-action',index:1,label:'Meet me by the window.'}
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
      ctx.font=weight+' '+size+'px sans-serif';
      ctx.fillText(txt,x,y);
    }

    function isHover(key){return state.hoverKey===key;}
    function isPressed(key){return state.pressedKey===key;}

    function card(x,y,w,h,r,key,base='rgba(255,255,255,.09)'){
      if(isPressed(key)) ctx.fillStyle='rgba(143,197,255,.22)';
      else if(isHover(key)) ctx.fillStyle='rgba(255,255,255,.145)';
      else ctx.fillStyle=base;
      roundedRect(x,y,w,h,r,true);

      if(isHover(key) || isPressed(key)){
        ctx.strokeStyle=isPressed(key)?'rgba(157,215,255,.95)':'rgba(157,215,255,.62)';
        ctx.lineWidth=isPressed(key)?3:2;
        ctx.stroke();
      }
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

      const now=new Date();
      const time=now.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
      text(time,70,78,30,'bold');
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
        const rect={...app,x,y,w:390,h:120,key:'app:'+app.id,type:'app'};
        appRects.push(rect);

        card(x,y,390,120,28,rect.key);

        const ambient=.16+Math.sin(state.uiTime*1.6+i*.9)*.025;
        ctx.fillStyle=isHover(rect.key)?'rgba(120,190,255,.28)':'rgba(120,190,255,'+ambient.toFixed(3)+')';
        roundedRect(x+20,y+20,80,80,20,true);

        text(app.short,x+30,y+70,20,'bold','#8fc5ff');
        text(app.label,x+125,y+70,30,'bold');

        if(app.id==='messages' && state.messageUnread){
          ctx.fillStyle='#ff9faf';
          ctx.beginPath();
          ctx.arc(x+362,y+28,8,0,Math.PI*2);
          ctx.fill();
          ctx.strokeStyle='rgba(255,255,255,.72)';
          ctx.lineWidth=2;
          ctx.stroke();
        }

        if(isHover(rect.key)){
          text('OPEN',x+300,y+98,14,'bold','#9ed8ff');
        }
      });

      ctx.fillStyle='rgba(255,255,255,.06)';
      roundedRect(260,650,504,48,24,true);
      text('◉   ◌   ◇   ◎',400,684,26,'bold','#8fc5ff');
    }

    function drawBack(){
      card(backRect.x,backRect.y,backRect.w,backRect.h,20,backRect.key,'rgba(255,255,255,.08)');
      text('‹  Home',82,161,24,'bold',isHover(backRect.key)?'#e9f5ff':'#b9d9ff');
    }

    function drawMessages(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(143,197,255,'+(state.actionPulse*.045).toFixed(3)+')';
        roundedRect(52,204,920,430,30,true);
      }
      text('Messages',70,230,44,'bold');
      text('Mira · online',72,264,18,'normal','#8ca4c8');

      ctx.fillStyle='rgba(255,255,255,.10)';
      roundedRect(70,295,610,70,24,true);
      text('Welcome back. Your world is ready.',96,338,22,'normal');

      ctx.fillStyle='rgba(111,167,255,.22)';
      roundedRect(344,385,610,70,24,true);
      text('I am checking the room now.',372,428,22,'normal','#dceaff');

      if(state.messageChoice===null){
        text('QUICK REPLY',72,490,15,'bold','#738aa9');
        messageRects.forEach(rect=>{
          card(rect.x,rect.y,rect.w,rect.h,20,rect.key,'rgba(255,255,255,.075)');
          text(rect.label,rect.x+24,rect.y+36,19,'bold',isHover(rect.key)?'#e9f5ff':'#b9d9ff');
        });
        text('Tap a reply to continue the conversation',72,600,16,'normal','#657a98');
      }else{
        const selected=messageRects[state.messageChoice];
        ctx.fillStyle='rgba(111,167,255,.24)';
        roundedRect(420,485,534,62,22,true);
        text(selected.label,448,523,20,'normal','#e2ecff');

        if(state.messageReplyPending){
          ctx.fillStyle='rgba(255,255,255,.075)';
          roundedRect(70,570,250,58,22,true);
          const dots='.'.repeat(1+Math.floor(state.uiTime*3)%3);
          text('Mira is typing'+dots,94,606,18,'normal','#8ca4c8');
        }else if(state.messageReply){
          ctx.fillStyle='rgba(255,255,255,.10)';
          roundedRect(70,570,660,62,22,true);
          text(state.messageReply,96,608,20,'normal');
        }
      }
    }

    function drawTasks(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(143,197,255,'+(state.actionPulse*.045).toFixed(3)+')';
        roundedRect(52,204,920,430,30,true);
      }
      text('Tasks',70,230,44,'bold');
      text('Tap a task to mark it complete',72,264,18,'normal','#8ca4c8');

      const rows=[
        ['Explore the room','ACTIVE'],
        ['Talk with Mira','NEXT'],
        ['Inspect the window','OPTIONAL']
      ];

      taskRects.length=0;
      rows.forEach((row,i)=>{
        const y=300+i*105;
        const key='task:'+i;
        const rect={x:70,y,w:884,h:80,key,type:'task',index:i};
        taskRects.push(rect);

        card(70,y,884,80,22,key,'rgba(255,255,255,.08)');

        const done=state.completedTasks[i];
        ctx.lineWidth=3;
        if(done){
          ctx.fillStyle='#b8ffd6';
          ctx.beginPath();
          ctx.arc(110,y+40,16,0,Math.PI*2);
          ctx.fill();
          text('✓',101,y+48,22,'bold','#173222');
        }else{
          ctx.strokeStyle='rgba(143,197,255,.55)';
          ctx.beginPath();
          ctx.arc(110,y+40,15,0,Math.PI*2);
          ctx.stroke();
        }

        text(row[0],150,y+49,25,done?'normal':'bold',done?'#7f8d99':'#fff');
        text(done?'DONE':row[1],800,y+47,16,'bold',done?'#8be9b4':'#8fc5ff');

        if(done){
          ctx.strokeStyle='rgba(139,233,180,.42)';
          ctx.lineWidth=2;
          ctx.beginPath();
          ctx.moveTo(150,y+41);
          ctx.lineTo(520,y+41);
          ctx.stroke();
        }
      });
    }

    function drawMap(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(143,197,255,'+(state.actionPulse*.04).toFixed(3)+')';
        roundedRect(52,204,920,430,30,true);
      }
      text('Map',70,230,44,'bold');
      text('Apartment Zone · Level 01',72,264,18,'normal','#8ca4c8');

      ctx.strokeStyle='rgba(255,255,255,.20)';
      ctx.lineWidth=3;
      ctx.strokeRect(90,300,530,270);
      ctx.strokeRect(620,300,300,130);
      ctx.strokeRect(620,430,145,140);
      ctx.strokeRect(765,430,155,140);

      text('LIVING',260,330,14,'bold','rgba(255,255,255,.34)');
      text('STUDY',710,330,14,'bold','rgba(255,255,255,.34)');

      const youPulse=4+Math.sin(state.uiTime*3.1)*2;
      ctx.strokeStyle='rgba(141,229,255,.26)';
      ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(350,500,18+youPulse,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#8de5ff';
      ctx.beginPath();ctx.arc(350,500,12,0,Math.PI*2);ctx.fill();
      text('YOU',375,508,18,'bold','#8de5ff');

      const miraPulse=3+Math.sin(state.uiTime*2.6+1.2)*1.5;
      ctx.strokeStyle='rgba(255,159,175,.20)';
      ctx.beginPath();ctx.arc(500,365,18+miraPulse,0,Math.PI*2);ctx.stroke();
      ctx.fillStyle='#ff9faf';
      ctx.beginPath();ctx.arc(500,365,12,0,Math.PI*2);ctx.fill();
      text('MIRA',525,373,18,'bold','#ffb1bd');

      if(state.mapFocus==='mira'){
        ctx.fillStyle='rgba(255,159,175,.10)';
        roundedRect(620,590,300,62,20,true);
        text('MIRA · 3.8 m',645,620,19,'bold','#ffc0ca');
        text('living room',645,643,14,'normal','#8ca4c8');
      }else{
        text('Tap MIRA to mark her in the world',90,624,18,'normal','#8ca4c8');
      }
    }

    function drawScanner(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(124,255,180,'+(state.actionPulse*.045).toFixed(3)+')';
        roundedRect(52,204,920,450,30,true);
      }
      text('Scanner',70,230,44,'bold');

      const status=state.scanning
        ? 'SCANNING '+Math.round(state.scannerProgress*100)+'%'
        : (state.scannerComplete?'SCAN COMPLETE':'LIVE OBJECT ANALYSIS');
      text(status,72,264,18,'normal',state.scannerComplete?'#b8ffd6':'#7cffb4');

      ctx.strokeStyle=state.scannerComplete?'rgba(184,255,214,.72)':'rgba(124,255,180,.55)';
      ctx.lineWidth=3;
      ctx.strokeRect(250,300,524,240);

      ctx.beginPath();
      ctx.moveTo(512,320);ctx.lineTo(512,520);
      ctx.moveTo(280,420);ctx.lineTo(744,420);
      ctx.stroke();

      if(state.scanning){
        const scanY=312+state.scannerProgress*216;
        const beam=ctx.createLinearGradient(250,scanY-24,250,scanY+24);
        beam.addColorStop(0,'rgba(124,255,180,0)');
        beam.addColorStop(.5,'rgba(124,255,180,.26)');
        beam.addColorStop(1,'rgba(124,255,180,0)');
        ctx.fillStyle=beam;
        ctx.fillRect(250,scanY-24,524,48);

        ctx.strokeStyle='rgba(190,255,220,.9)';
        ctx.lineWidth=2;
        ctx.beginPath();
        ctx.moveTo(250,scanY);
        ctx.lineTo(774,scanY);
        ctx.stroke();
      }

      if(state.scannerComplete){
        ctx.fillStyle='rgba(184,255,214,.11)';
        roundedRect(350,355,324,130,26,true);
        text('MIRA',460,405,30,'bold','#c8ffe0');
        text('human · friendly',420,445,20,'normal','#8fcca9');
        text('confidence 98%',430,474,16,'normal','#79eeb0');
      }

      card(scannerRect.x,scannerRect.y,scannerRect.w,scannerRect.h,22,scannerRect.key,'rgba(124,255,180,.12)');
      const buttonLabel=state.scanning?'SCANNING…':(state.scannerComplete?'SCAN AGAIN':'RUN SCAN');
      const buttonX=state.scanning?428:(state.scannerComplete?438:446);
      text(buttonLabel,buttonX,622,22,'bold','#a9ffd0');
    }

    function drawApp(appId=state.activeApp){
      drawBack();
      if(appId==='messages') drawMessages();
      else if(appId==='tasks') drawTasks();
      else if(appId==='map') drawMap();
      else if(appId==='scanner') drawScanner();
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

    function reflection(){
      const gradient=ctx.createLinearGradient(0,0,width,0);
      gradient.addColorStop(0,'rgba(255,255,255,0)');
      gradient.addColorStop(.45,'rgba(255,255,255,.095)');
      gradient.addColorStop(.55,'rgba(255,255,255,0)');
      gradient.addColorStop(1,'rgba(255,255,255,0)');
      ctx.fillStyle=gradient;
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
          drawLayer(
            ()=>drawApp(state.transitionApp),
            {dx:86*(1-p),dy:4*(1-p),scale:.965+.035*easeOutCubic(raw),alpha:.18+.82*p}
          );
        }else{
          drawLayer(
            ()=>drawApp(state.transitionApp),
            {dx:62*p,dy:2*p,scale:1-.022*p,alpha:1-p*.86}
          );
          drawLayer(
            drawHome,
            {dx:-76*(1-p),dy:3*(1-p),scale:.972+.028*easeOutCubic(raw),alpha:.18+.82*p}
          );
        }
      }else if(state.activeApp){
        drawApp();
      }else{
        drawHome();
      }

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
      const hit=hitTestUv(uv);
      const next=hit?.key || null;
      if(next===state.hoverKey) return hit;
      state.hoverKey=next;
      draw();
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

      const animated=open && (
        Boolean(state.transitionKind) ||
        state.messageReplyPending ||
        !state.activeApp ||
        state.activeApp==='map' ||
        state.activeApp==='scanner' ||
        state.actionPulse>0
      );

      const frameStep=state.transitionKind?1/60:1/30;
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
      canvas,ctx,texture,draw,state,update,
      hitTestUv,setPointerUv,setPressedUv,clearPressed,handleUv
    };
  };
})();
