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
      pointerAlpha:0
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
      ctx.font=weight+' '+size+'px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      ctx.fillText(txt,x,y);
    }

    function strokeRoundRect(x,y,w,h,r,color='rgba(255,255,255,.08)',lineWidth=1){
      roundedRect(x,y,w,h,r,false);
      ctx.strokeStyle=color;
      ctx.lineWidth=lineWidth;
      ctx.stroke();
    }

    function appIcon(id,x,y,size,accent){
      ctx.save();
      ctx.translate(x,y);
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
      }
      ctx.restore();
    }

    function pill(label,x,y,accent='rgba(255,255,255,.10)',fg='#b9c7db'){
      ctx.save();
      ctx.font='700 11px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      const w=Math.ceil(ctx.measureText(label).width)+22;
      ctx.fillStyle=accent;
      roundedRect(x,y,w,26,13,true);
      strokeRoundRect(x,y,w,26,13,'rgba(255,255,255,.065)',1);
      text(label,x+11,y+17,11,'700',fg);
      ctx.restore();
      return w;
    }

    function appHeader(title,subtitle,accent='#8fc5ff'){
      text(title.toUpperCase(),70,212,12,'750',accent);
      text(subtitle,70,241,15,'500','#70809a');
      text(title,70,286,42,'680','#f5f8ff');
      ctx.fillStyle='rgba(255,255,255,.055)';
      roundedRect(70,307,884,1,1,true);
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
      text('WORLD DECK',62,132,12,'800','#7fd6ff');
      text('NOVA PAD',62,177,45,'700','#f7f9fd');
      text('Everything in reach, nothing in the way.',64,207,16,'500','#71819b');

      pill('WORLD ONLINE',793,137,'rgba(127,214,255,.075)','#aee6ff');

      appRects.length=0;
      apps.forEach((app,i)=>{
        const col=i%2;
        const row=Math.floor(i/2);
        const x=62+col*480;
        const y=236+row*172;
        const rect={...app,x,y,w:420,h:148,key:'app:'+app.id,type:'app'};
        appRects.push(rect);

        const hovered=isHover(rect.key);
        const pressed=isPressed(rect.key);
        const yLift=pressed?2:(hovered?-3:0);

        ctx.save();
        ctx.translate(0,yLift);

        // Dark glass tile with restrained accent bloom.
        if(hovered){
          ctx.shadowColor='rgba('+app.rgb+',.16)';
          ctx.shadowBlur=28;
          ctx.shadowOffsetY=10;
        }
        ctx.fillStyle=hovered?'rgba(15,22,34,.92)':'rgba(11,16,25,.84)';
        roundedRect(x,y,420,148,30,true);
        ctx.shadowColor='transparent';
        ctx.shadowBlur=0;
        ctx.shadowOffsetY=0;
        strokeRoundRect(
          x,y,420,148,30,
          hovered?'rgba('+app.rgb+',.30)':'rgba(255,255,255,.075)',
          hovered?1.4:1
        );

        const bloom=ctx.createRadialGradient(x+72,y+64,4,x+72,y+64,118);
        bloom.addColorStop(0,'rgba('+app.rgb+','+(hovered?'.18':'.10')+')');
        bloom.addColorStop(.55,'rgba('+app.rgb+',.035)');
        bloom.addColorStop(1,'rgba('+app.rgb+',0)');
        ctx.fillStyle=bloom;
        roundedRect(x+1,y+1,418,146,29,true);

        // Icon puck.
        ctx.fillStyle='rgba('+app.rgb+','+(hovered?'.17':'.11')+')';
        roundedRect(x+22,y+24,76,76,22,true);
        strokeRoundRect(x+22,y+24,76,76,22,'rgba('+app.rgb+','+(hovered?'.34':'.19')+')',1);
        appIcon(app.id,x+60,y+62,42,app.accent);

        text(app.label,x+120,y+55,26,'680','#f4f7fc');
        text(app.short,x+120,y+80,14,'520','#75869f');

        // Tiny system metadata makes the cards feel like OS surfaces rather than web CTA cards.
        text('0'+(i+1),x+24,y+127,11,'800','rgba('+app.rgb+',.72)');
        ctx.fillStyle='rgba(255,255,255,.06)';
        roundedRect(x+49,y+120,190,1,1,true);
        ctx.fillStyle='rgba('+app.rgb+','+(hovered?'.70':'.42')+')';
        roundedRect(x+49,y+120,hovered?92:54,1,1,true);

        ctx.beginPath();
        ctx.strokeStyle=hovered?app.accent:'#58677c';
        ctx.lineWidth=1.7;
        ctx.arc(x+385,y+34,12,0,Math.PI*2);
        ctx.stroke();
        text('›',x+381,y+40,17,'650',hovered?app.accent:'#6a7890');

        if(app.id==='messages' && state.messageUnread){
          ctx.fillStyle='#ff9faf';
          ctx.beginPath();
          ctx.arc(x+385,y+112,6,0,Math.PI*2);
          ctx.fill();
        }

        ctx.restore();
      });

      // Bottom hardware-like gesture rail / context hint.
      ctx.fillStyle='rgba(255,255,255,.055)';
      roundedRect(431,681,162,4,2,true);
      text('E',62,684,11,'800','#95a8c1');
      text('CLOSE PAD',81,684,11,'650','#5f7088');
      text('POINTER',867,684,11,'650','#5f7088');
      ctx.fillStyle='rgba(127,214,255,.30)';
      ctx.beginPath();
      ctx.arc(945,680,3,0,Math.PI*2);
      ctx.fill();
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
      appHeader('Messages','Mira · online','#7fd6ff');

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
        text('QUICK REPLY',72,556,12,'750','#667995');
        messageRects.forEach((rect,i)=>{
          const selected=isHover(rect.key)||isPressed(rect.key);
          card(rect.x,rect.y,rect.w,rect.h,18,rect.key,'rgba(255,255,255,.045)');
          text(rect.label,rect.x+22,rect.y+35,17,'600',selected?'#eef8ff':'#b7c5d9');
          text('↗',rect.x+rect.w-38,rect.y+35,16,'600',selected?'#7fd6ff':'#596980');
        });
      }else{
        const selected=messageRects[state.messageChoice];
        ctx.fillStyle='rgba(89,158,255,.16)';
        roundedRect(410,548,544,58,20,true);
        strokeRoundRect(410,548,544,58,20,'rgba(127,214,255,.14)',1);
        text(selected.label,436,584,18,'550','#e2ecff');

        if(state.messageReplyPending){
          ctx.fillStyle='rgba(255,255,255,.050)';
          roundedRect(70,620,260,48,18,true);
          text('Mira is typing'+'.'.repeat(1+Math.floor(state.uiTime*3)%3),92,651,15,'550','#8193ad');
        }else if(state.messageReply){
          ctx.fillStyle='rgba(255,255,255,.060)';
          roundedRect(70,620,630,48,18,true);
          text(state.messageReply,94,651,16,'550','#d9e2ef');
        }
      }
    }

    function drawTasks(){
      if(state.actionPulse>0){
        ctx.fillStyle='rgba(158,255,196,'+(state.actionPulse*.032).toFixed(3)+')';
        roundedRect(48,204,928,438,30,true);
      }
      appHeader('Tasks','Today · focused mode','#9effc4');

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
      appHeader('Map','Apartment · Level 01','#cdb7ff');

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
      appHeader('Scanner',status,state.scannerComplete?'#9effc4':'#ffc98a');

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
