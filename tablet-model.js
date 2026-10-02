(function(){
  function roundedShape(w,h,r){
    const s=new THREE.Shape();
    const x=-w/2, y=-h/2;
    s.moveTo(x+r,y);
    s.lineTo(x+w-r,y);
    s.quadraticCurveTo(x+w,y,x+w,y+r);
    s.lineTo(x+w,y+h-r);
    s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    s.lineTo(x+r,y+h);
    s.quadraticCurveTo(x,y+h,x,y+h-r);
    s.lineTo(x,y+r);
    s.quadraticCurveTo(x,y,x+r,y);
    return s;
  }

  function extrudedRounded(w,h,d,r,bevel){
    const g=new THREE.ExtrudeGeometry(roundedShape(w,h,r),{
      depth:d,
      bevelEnabled:true,
      bevelSegments:5,
      steps:1,
      bevelSize:bevel,
      bevelThickness:bevel
    });
    g.center();
    g.computeVertexNormals();
    return g;
  }

  window.createTablet3DController=function(canvas){
    if(!canvas || !window.THREE) return null;

    const renderer=new THREE.WebGLRenderer({
      canvas,
      alpha:true,
      antialias:true,
      powerPreference:'high-performance'
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio,2));
    renderer.setClearColor(0x000000,0);
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.16;

    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(31,1,.1,20);
    camera.position.set(0,0,4.42);

    const rig=new THREE.Group();
    scene.add(rig);

    const aluminum=new THREE.MeshPhysicalMaterial({
      color:0x666b70,
      metalness:.98,
      roughness:.22,
      clearcoat:.34,
      clearcoatRoughness:.18
    });
    const edgeMetal=new THREE.MeshPhysicalMaterial({
      color:0x8b8f93,
      metalness:1,
      roughness:.16,
      clearcoat:.28
    });
    const blackGlass=new THREE.MeshPhysicalMaterial({
      color:0x030405,
      metalness:.08,
      roughness:.085,
      clearcoat:1,
      clearcoatRoughness:.045
    });
    const lensMat=new THREE.MeshPhysicalMaterial({
      color:0x06101c,
      metalness:.15,
      roughness:.035,
      clearcoat:1,
      clearcoatRoughness:.02
    });
    const darkMat=new THREE.MeshStandardMaterial({color:0x0a0b0d,roughness:.7,metalness:.2});

    // 11-inch-class proportions: deliberately generic, not branded.
    const body=new THREE.Mesh(extrudedRounded(2.82,2.00,.145,.17,.018),aluminum);
    body.castShadow=true;
    body.receiveShadow=true;
    rig.add(body);

    // A slightly raised front glass/bezel plane. The live HTML screen is placed
    // over its center, leaving this material visible as the physical bezel.
    const bezel=new THREE.Mesh(
      new THREE.ShapeGeometry(roundedShape(2.72,1.90,.145),36),
      blackGlass
    );
    bezel.position.z=.091;
    rig.add(bezel);

    // Thin polished lip around the glass catches highlights at grazing angles.
    const lip=new THREE.Mesh(extrudedRounded(2.755,1.935,.022,.153,.007),edgeMetal);
    lip.position.z=.077;
    rig.add(lip);

    // Camera and ring.
    const cameraRing=new THREE.Mesh(new THREE.RingGeometry(.026,.043,40),edgeMetal);
    cameraRing.position.set(0,.893,.108);
    rig.add(cameraRing);
    const lens=new THREE.Mesh(new THREE.CircleGeometry(.025,40),lensMat);
    lens.position.set(0,.893,.112);
    rig.add(lens);

    // Tiny moving specular glint keeps the camera glass alive as the device tilts.
    const lensGlintMat=new THREE.MeshBasicMaterial({
      color:0xeaf7ff,
      transparent:true,
      opacity:.0,
      depthWrite:false,
      toneMapped:false,
      blending:THREE.AdditiveBlending
    });
    const lensGlint=new THREE.Mesh(new THREE.CircleGeometry(.0085,24),lensGlintMat);
    lensGlint.position.set(-.006,.900,.116);
    lensGlint.renderOrder=8;
    lensGlint.raycast=()=>{};
    rig.add(lensGlint);

    // Power and volume buttons have their own highlight, so side-on views read as hardware.
    const power=new THREE.Mesh(new THREE.BoxGeometry(.38,.032,.058),edgeMetal);
    power.position.set(.78,1.016,.0);
    power.rotation.x=.015;
    rig.add(power);
    [-.32,.02].forEach((y,i)=>{
      const b=new THREE.Mesh(new THREE.BoxGeometry(.032,.25,.058),edgeMetal);
      b.position.set(1.433,y,.0);
      rig.add(b);
    });

    // Speaker perforations and antenna seams.
    for(const side of [-1,1]){
      for(let i=0;i<7;i++){
        const hole=new THREE.Mesh(new THREE.CircleGeometry(.011,12),darkMat);
        hole.position.set(side*(.70+i*.067),-.922,.106);
        rig.add(hole);
      }
    }
    [-1.04,1.04].forEach(x=>{
      const seam=new THREE.Mesh(new THREE.BoxGeometry(.012,.055,.151),darkMat);
      seam.position.set(x,.987,0);
      rig.add(seam);
    });

    // A subtle edge strip creates a readable side profile when the device tilts.
    const sideShade=new THREE.Mesh(
      new THREE.BoxGeometry(2.47,.018,.152),
      new THREE.MeshStandardMaterial({color:0x303337,metalness:.9,roughness:.31})
    );
    sideShade.position.set(0,-1.004,0);
    rig.add(sideShade);

    // Thin side-wall sheens live on the actual chassis thickness rather than
    // the front face. As the tablet tilts they reveal the near/far rail and
    // make the body read as a solid object instead of a flat card.
    const railMaterial=()=>new THREE.MeshBasicMaterial({
      color:0xcfe9ff,
      transparent:true,
      opacity:0,
      depthWrite:false,
      toneMapped:false,
      blending:THREE.AdditiveBlending
    });

    const railSheen={
      left:new THREE.Mesh(new THREE.BoxGeometry(.012,1.70,.115),railMaterial()),
      right:new THREE.Mesh(new THREE.BoxGeometry(.012,1.70,.115),railMaterial()),
      top:new THREE.Mesh(new THREE.BoxGeometry(2.44,.012,.115),railMaterial()),
      bottom:new THREE.Mesh(new THREE.BoxGeometry(2.44,.012,.115),railMaterial())
    };

    railSheen.left.position.set(-1.414,0,-.010);
    railSheen.right.position.set(1.414,0,-.010);
    railSheen.top.position.set(0,1.006,-.010);
    railSheen.bottom.position.set(0,-1.006,-.010);

    Object.values(railSheen).forEach(part=>{
      part.renderOrder=6;
      part.raycast=()=>{};
      rig.add(part);
    });

    const handSkin=new THREE.MeshStandardMaterial({color:0xb9826f,roughness:.74,metalness:0});
    const sleeveMat=new THREE.MeshStandardMaterial({color:0x242a31,roughness:.9,metalness:.02});

    function createHoldingHand(side){
      const hand=new THREE.Group();
      const s=side==='left'?-1:1;

      // Keep almost the whole hand behind the tablet, but let a thin crescent
      // of palm + thumb base show beyond the side rail. This gives a readable
      // grip silhouette without ever crossing onto the display surface.
      const palm=new THREE.Mesh(new THREE.SphereGeometry(.18,20,14),handSkin);
      palm.scale.set(.72,.98,.50);
      palm.position.set(s*1.47,-.765,-.105);
      palm.rotation.z=s*.09;
      hand.add(palm);

      const thumbRoot=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),handSkin);
      thumbRoot.scale.set(.62,.82,.52);
      thumbRoot.position.set(s*1.455,-.755,-.07);
      thumbRoot.rotation.z=s*.18;
      hand.add(thumbRoot);

      const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.031,.12,8,12),handSkin);
      thumb.position.set(s*1.455,-.735,-.012);
      thumb.rotation.z=s*.84;
      thumb.rotation.x=.34;
      hand.add(thumb);

      // Front-facing finger geometry remains hidden until a skinned hand model
      // can bend around the rear shell without clipping through the screen.
      const indexFinger=new THREE.Mesh(new THREE.CapsuleGeometry(.026,.14,8,12),handSkin);
      indexFinger.position.set(s*1.43,-.92,-.11);
      indexFinger.rotation.z=s*.12;
      indexFinger.rotation.x=.46;
      indexFinger.visible=false;
      hand.add(indexFinger);

      const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.092,.46,8,14),sleeveMat);
      forearm.position.set(s*1.73,-1.035,-.18);
      forearm.rotation.z=s*.75;
      forearm.rotation.x=-.10;
      hand.add(forearm);

      hand.userData={side:s,palm,thumbRoot,thumb,indexFinger,forearm,baseY:hand.position.y};
      rig.add(hand);
      return hand;
    }

    const leftHand=createHoldingHand('left');
    const rightHand=createHoldingHand('right');

    const hemi=new THREE.HemisphereLight(0xeaf3ff,0x17130f,1.7);
    scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffe3cf,4.4);
    key.position.set(-2.6,3.2,4.2);
    scene.add(key);
    const rim=new THREE.DirectionalLight(0x8fc5ff,3.1);
    rim.position.set(3.6,-1.2,2.0);
    scene.add(rim);
    const soft=new THREE.PointLight(0xffffff,2.3,8);
    soft.position.set(0,0,3.2);
    scene.add(soft);

    function resize(){
      const w=Math.max(2,canvas.clientWidth|0);
      const h=Math.max(2,canvas.clientHeight|0);
      const pr=Math.min(devicePixelRatio,2);
      const need=canvas.width!==Math.round(w*pr)||canvas.height!==Math.round(h*pr);
      if(need){
        renderer.setPixelRatio(pr);
        renderer.setSize(w,h,false);
        camera.aspect=w/h;
        camera.updateProjectionMatrix();
      }
    }

    let pointerTargetX=0;
    let pointerTargetY=0;
    let pointerX=0;
    let pointerY=0;
    let previousPointerX=0;
    let previousPointerY=0;
    let inertiaX=0;
    let inertiaY=0;
    let inertiaVelocityX=0;
    let inertiaVelocityY=0;
    let pressTarget=0;
    let pressAmount=0;
    let pressVelocity=0;
    let hapticPitch=0;
    let hapticYaw=0;
    let hapticRoll=0;
    let hapticPitchVelocity=0;
    let hapticYawVelocity=0;
    let hapticRollVelocity=0;
    let interactionEnergy=0;
    let holdAmount=0;
    let lastRenderTime=0;

    function setInteractionPointer(x=0,y=0,pressed=false){
      const nextX=THREE.MathUtils.clamp(x,-1,1);
      const nextY=THREE.MathUtils.clamp(y,-1,1);
      const wasPressed=pressTarget>.5;

      pointerTargetX=nextX;
      pointerTargetY=nextY;
      pressTarget=pressed?1:0;

      // Releasing a press gives the chassis a tiny location-aware haptic kick.
      // This is short and rotational, so it feels like hardware snap rather
      // than moving the whole tablet away from the pointer.
      if(wasPressed && !pressed){
        hapticPitchVelocity+=.018-nextY*.030;
        hapticYawVelocity+=nextX*.040;
        hapticRollVelocity-=nextX*.018;
      }
    }

    function clearInteractionPointer(){
      pointerTargetX=0;
      pointerTargetY=0;
      pressTarget=0;
    }

    function render(t,open){
      resize();

      const dt=Math.min(.05,Math.max(.001,lastRenderTime?t-lastRenderTime:.016));
      lastRenderTime=t;
      const follow=1-Math.pow(.003,dt);
      const holdFollow=1-Math.pow(open?.000035:.00022,dt);

      pointerX=THREE.MathUtils.lerp(pointerX,pointerTargetX,follow);
      pointerY=THREE.MathUtils.lerp(pointerY,pointerTargetY,follow);

      // A second, slower spring reacts to pointer velocity rather than pointer
      // position. It makes the held tablet briefly lag behind a quick hand move,
      // then settle, which reads as mass without making the UI hard to target.
      const pointerVelocityX=(pointerX-previousPointerX)/dt;
      const pointerVelocityY=(pointerY-previousPointerY)/dt;
      previousPointerX=pointerX;
      previousPointerY=pointerY;

      const inertiaTargetX=THREE.MathUtils.clamp(-pointerVelocityX*.00115,-.014,.014);
      const inertiaTargetY=THREE.MathUtils.clamp(-pointerVelocityY*.00095,-.011,.011);

      inertiaVelocityX+=(inertiaTargetX-inertiaX)*120*dt;
      inertiaVelocityY+=(inertiaTargetY-inertiaY)*120*dt;
      inertiaVelocityX*=Math.exp(-11.5*dt);
      inertiaVelocityY*=Math.exp(-11.5*dt);
      inertiaX+=inertiaVelocityX*dt;
      inertiaY+=inertiaVelocityY*dt;

      // A lightly under-damped spring gives pointer-down a weighted compression
      // and pointer-up a tiny forward overshoot instead of a simple lerp.
      pressVelocity+=(pressTarget-pressAmount)*185*dt;
      pressVelocity*=Math.exp(-15.5*dt);
      pressAmount+=pressVelocity*dt;
      pressAmount=THREE.MathUtils.clamp(pressAmount,-.10,1.08);

      // A faster rotational spring turns pointer-up into a crisp mechanical
      // release. It overshoots once, then dies out in roughly a quarter second.
      hapticPitchVelocity+=(-hapticPitch)*360*dt;
      hapticYawVelocity+=(-hapticYaw)*360*dt;
      hapticRollVelocity+=(-hapticRoll)*390*dt;
      hapticPitchVelocity*=Math.exp(-15.5*dt);
      hapticYawVelocity*=Math.exp(-15.5*dt);
      hapticRollVelocity*=Math.exp(-16.5*dt);
      hapticPitch+=hapticPitchVelocity*dt;
      hapticYaw+=hapticYawVelocity*dt;
      hapticRoll+=hapticRollVelocity*dt;

      // Quiet hands never freeze completely, but active interaction should
      // stabilize the tablet. Blend a tiny multi-frequency sway in only when
      // pointer velocity and press energy are low.
      const activityTarget=THREE.MathUtils.clamp(
        Math.hypot(pointerVelocityX,pointerVelocityY)*.030+
        Math.max(0,pressAmount)*.78,
        0,1
      );
      const activityFollow=1-Math.pow(.0009,dt);
      interactionEnergy=THREE.MathUtils.lerp(interactionEnergy,activityTarget,activityFollow);

      holdAmount=THREE.MathUtils.lerp(holdAmount,open?1:0,holdFollow);

      const hold=holdAmount*holdAmount*(3-2*holdAmount);
      const hidden=1-hold;

      // The hardware and hands now share one physical raise/lower pose. Pointer
      // parallax is intentionally subtle so the tablet still reads as a held object.
      rig.scale.setScalar(.965+.035*hold);
      const impact=Math.max(0,pressAmount);
      const impactX=impact*pointerX;
      const impactY=impact*pointerY;
      const steady=1-interactionEnergy;

      // Human-held idle motion: layered frequencies avoid a perfect sine-wave
      // float. It fades quickly during interaction so aiming/clicking stays crisp.
      const swayPitch=(Math.sin(t*.46)+Math.sin(t*1.13+.8)*.36)*.0022*hold*steady;
      const swayYaw=(Math.sin(t*.39+1.2)+Math.sin(t*.97)*.31)*.0028*hold*steady;
      const swayRoll=(Math.sin(t*.31+.5)+Math.sin(t*1.37+2.1)*.24)*.00125*hold*steady;
      const swayX=(Math.sin(t*.43+.9)+Math.sin(t*1.07)*.28)*.0019*hold*steady;
      const swayY=(Math.sin(t*.61)+Math.sin(t*1.29+1.6)*.22)*.0027*hold*steady;

      rig.rotation.x=-.032 + hidden*.075 + swayPitch - pointerY*.010*hold + inertiaY*hold + hapticPitch*hold + impact*(.0045+pointerY*.0035);
      rig.rotation.y=.018 - hidden*.018 + swayYaw + pointerX*.013*hold + inertiaX*hold + hapticYaw*hold + impactX*.0065;
      rig.rotation.z=hidden*.012 + swayRoll - pointerX*.0025*hold - inertiaX*.18*hold + hapticRoll*hold - impactX*.0028;
      rig.position.x=swayX + pointerX*.010*hold + inertiaX*.22*hold + impactX*.0025;
      rig.position.y=hidden*.115 + swayY - pointerY*.006*hold + inertiaY*.16*hold - impact*.0035 + impactY*.0015;
      rig.position.z=-hidden*.055-impact*.014;

      leftHand.rotation.z=-pointerX*.004*hold-inertiaX*.11*hold;
      rightHand.rotation.z=-pointerX*.004*hold-inertiaX*.11*hold;

      const leftSide=leftHand.userData.side;
      const rightSide=rightHand.userData.side;
      const leftLoad=impact*(.72-pointerX*.28);
      const rightLoad=impact*(.72+pointerX*.28);

      // Weight transfer continues even when the user is not clicking. The hand
      // on the lower/loaded side firms up while the opposite wrist relaxes.
      // All offsets stay behind the bezel so the grip never crosses the screen.
      const supportBias=THREE.MathUtils.clamp(pointerX*.18+inertiaX*5,-.24,.24);
      const verticalBias=THREE.MathUtils.clamp(pointerY*.10+inertiaY*4,-.14,.14);
      const leftSupport=.5-supportBias;
      const rightSupport=.5+supportBias;
      const leftBreath=(Math.sin(t*.67+.4)+Math.sin(t*1.41)*.18)*.0010*hold*(.45+.55*steady);
      const rightBreath=(Math.sin(t*.67+2.6)+Math.sin(t*1.33+1.7)*.18)*.0010*hold*(.45+.55*steady);

      leftHand.position.x=leftSide*.042*hidden-leftSide*(leftLoad*.005+leftSupport*.0018);
      rightHand.position.x=rightSide*.042*hidden-rightSide*(rightLoad*.005+rightSupport*.0018);
      leftHand.position.y=-.035*hidden+Math.sin(t*.83)*.0015*hold-leftLoad*.0022+leftBreath-verticalBias*.0022;
      rightHand.position.y=-.035*hidden+Math.sin(t*.83)*.0015*hold-rightLoad*.0022+rightBreath+verticalBias*.0022;

      // Wrists counter-rotate against tablet inertia; palms and thumb roots
      // compress by different amounts so the device feels supported, not glued.
      leftHand.userData.forearm.rotation.z=leftSide*(.75+pointerX*.010+inertiaX*.22+hapticYaw*.08);
      rightHand.userData.forearm.rotation.z=rightSide*(.75+pointerX*.010+inertiaX*.22+hapticYaw*.08);
      leftHand.userData.forearm.rotation.x=-.10-pointerY*.012-inertiaY*.18-hapticPitch*.06;
      rightHand.userData.forearm.rotation.x=-.10-pointerY*.012-inertiaY*.18-hapticPitch*.06;

      leftHand.userData.palm.rotation.z=leftSide*(.09+leftSupport*.010+impact*.006);
      rightHand.userData.palm.rotation.z=rightSide*(.09+rightSupport*.010+impact*.006);
      leftHand.userData.thumbRoot.rotation.z=leftSide*(.18+leftSupport*.020+leftLoad*.018);
      rightHand.userData.thumbRoot.rotation.z=rightSide*(.18+rightSupport*.020+rightLoad*.018);

      leftHand.userData.thumb.rotation.x=.28+.06*hold+leftLoad*.055+leftSupport*.010;
      rightHand.userData.thumb.rotation.x=.28+.06*hold+rightLoad*.055+rightSupport*.010;
      leftHand.userData.thumb.rotation.z=leftSide*(.76+.08*hold+leftLoad*.042+leftSupport*.012);
      rightHand.userData.thumb.rotation.z=rightSide*(.76+.08*hold+rightLoad*.042+rightSupport*.012);

      // Material response: the metal gets slightly sharper at steeper pointer
      // angles, while the camera lens catches a moving pin-prick reflection.
      aluminum.roughness=.22-Math.min(.025,Math.abs(pointerX)*.016+Math.abs(pointerY)*.009);
      edgeMetal.roughness=.16-Math.min(.022,Math.abs(pointerX)*.014+Math.abs(pointerY)*.008);
      lensGlint.position.x=-.006+pointerX*.010;
      lensGlint.position.y=.900+pointerY*.006;
      lensGlintMat.opacity=(.22+.34*hold)*(1-Math.min(.45,Math.abs(pointerX)*.15))+Math.max(0,pressAmount)*.08;

      // Real side-wall visibility changes with tilt: the edge opposite the
      // direction of travel opens up more strongly, while the other side
      // almost disappears. Inertia and haptic release add a brief metal flash.
      const railMotion=Math.min(.08,Math.hypot(inertiaX,inertiaY)*2.7);
      const railHaptic=Math.min(.045,Math.abs(hapticPitch)*2.1+Math.abs(hapticYaw)*1.8);
      const railBase=.008*hold;
      railSheen.left.material.opacity=
        railBase+Math.max(0,pointerX)*.060+Math.max(0,inertiaX)*1.8+railMotion+railHaptic;
      railSheen.right.material.opacity=
        railBase+Math.max(0,-pointerX)*.060+Math.max(0,-inertiaX)*1.8+railMotion+railHaptic;
      railSheen.top.material.opacity=
        railBase+Math.max(0,-pointerY)*.045+Math.max(0,-inertiaY)*1.6+railMotion*.75+railHaptic*.8;
      railSheen.bottom.material.opacity=
        railBase+Math.max(0,pointerY)*.045+Math.max(0,inertiaY)*1.6+railMotion*.75+railHaptic*.8;

      railSheen.left.scale.z=1+Math.max(0,pointerX)*.20;
      railSheen.right.scale.z=1+Math.max(0,-pointerX)*.20;
      railSheen.top.scale.z=1+Math.max(0,-pointerY)*.16;
      railSheen.bottom.scale.z=1+Math.max(0,pointerY)*.16;

      key.position.x=-2.6+Math.sin(t*.38)*.28+pointerX*.22;
      rim.position.y=-1.2+Math.cos(t*.46)*.2-pointerY*.15;
      renderer.render(scene,camera);
    }

    resize();
    return {render,resize,renderer,camera,setInteractionPointer,clearInteractionPointer};
  };
})();