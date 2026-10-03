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

  function seededRandom(seed){
    let state=seed>>>0;
    return ()=>{
      state=(Math.imul(state,1664525)+1013904223)>>>0;
      return state/4294967296;
    };
  }

  function makeDeviceRoughnessTexture(seed,base=166,grain=24,smudges=0){
    const size=256;
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=size;
    const g=canvas.getContext('2d');
    const rnd=seededRandom(seed);

    g.fillStyle='rgb('+base+','+base+','+base+')';
    g.fillRect(0,0,size,size);

    for(let i=0;i<2800;i++){
      const delta=(rnd()-.5)*grain;
      const v=Math.max(0,Math.min(255,Math.round(base+delta)));
      const a=.035+rnd()*.085;
      const r=.25+rnd()*.85;
      g.fillStyle='rgba('+v+','+v+','+v+','+a.toFixed(3)+')';
      g.fillRect(rnd()*size,rnd()*size,r,r);
    }

    for(let i=0;i<smudges;i++){
      const x=22+rnd()*(size-44);
      const y=22+rnd()*(size-44);
      const radius=12+rnd()*34;
      const v=Math.max(0,Math.min(255,Math.round(base-30+rnd()*28)));
      const gradient=g.createRadialGradient(x,y,1,x,y,radius);
      gradient.addColorStop(0,'rgba('+v+','+v+','+v+','+(.08+rnd()*.10).toFixed(3)+')');
      gradient.addColorStop(.55,'rgba('+v+','+v+','+v+','+(.035+rnd()*.05).toFixed(3)+')');
      gradient.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
      g.fillStyle=gradient;
      g.fillRect(x-radius,y-radius,radius*2,radius*2);
    }

    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.anisotropy=8;
    return texture;
  }

  function makeSkinMicroTexture(seed){
    const size=256;
    const canvas=document.createElement('canvas');
    canvas.width=canvas.height=size;
    const g=canvas.getContext('2d');
    const rnd=seededRandom(seed);

    g.fillStyle='#808080';
    g.fillRect(0,0,size,size);

    // Fine pore/noise field breaks up the broad plastic highlight.
    for(let i=0;i<4200;i++){
      const v=112+Math.floor(rnd()*32);
      const a=.04+rnd()*.10;
      const r=.20+rnd()*.72;
      g.fillStyle='rgba('+v+','+v+','+v+','+a.toFixed(3)+')';
      g.fillRect(rnd()*size,rnd()*size,r,r);
    }

    // A few shallow crease-like strokes suggest palm/finger skin at grazing angles.
    for(let i=0;i<26;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const length=9+rnd()*28;
      g.strokeStyle='rgba(102,102,102,'+(.035+rnd()*.055).toFixed(3)+')';
      g.lineWidth=.35+rnd()*.55;
      g.beginPath();
      g.moveTo(x,y);
      g.quadraticCurveTo(
        x+length*.46,
        y+(rnd()-.5)*5,
        x+length,
        y+(rnd()-.5)*7
      );
      g.stroke();
    }

    const texture=new THREE.CanvasTexture(canvas);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(2.6,2.6);
    texture.anisotropy=8;
    return texture;
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

    const tabletDom=canvas.closest?.('.tablet')||null;

    // Real scanned surface maps replace the old all-procedural micro-noise.
    // Poly Haven assets are CC0; only normal/roughness are used so the device
    // keeps its authored color while gaining real-world surface statistics.
    const textureLoader=new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');
    const loadPbrTexture=(url,{srgb=false,repeatX=1,repeatY=1}={})=>{
      const texture=textureLoader.load(url);
      texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.repeat.set(repeatX,repeatY);
      texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy?.()||1,8);
      if(srgb) texture.colorSpace=THREE.SRGBColorSpace;
      return texture;
    };

    const scannedMetalNormal=loadPbrTexture(
      'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_metal_plate/blue_metal_plate_nor_gl_1k.jpg',
      {repeatX:7.5,repeatY:5.4}
    );
    const scannedMetalRough=loadPbrTexture(
      'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/blue_metal_plate/blue_metal_plate_rough_1k.jpg',
      {repeatX:7.5,repeatY:5.4}
    );
    const scannedSkinNormal=loadPbrTexture(
      'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leather_white/leather_white_nor_gl_1k.jpg',
      {repeatX:11.0,repeatY:11.0}
    );
    const scannedSkinRough=loadPbrTexture(
      'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/leather_white/leather_white_rough_1k.jpg',
      {repeatX:11.0,repeatY:11.0}
    );

    const chassisRoughness=makeDeviceRoughnessTexture(0x4f8cb312,168,22,3);
    chassisRoughness.repeat.set(4.2,3.4);
    const edgeRoughness=makeDeviceRoughnessTexture(0x86c22f41,150,16,1);
    edgeRoughness.repeat.set(5.0,3.0);
    const glassRoughness=makeDeviceRoughnessTexture(0x71ac4d21,30,18,22);
    glassRoughness.repeat.set(1.0,1.0);
    const skinMicroTexture=makeSkinMicroTexture(0x8cb14e2a);
    const palmRoughness=makeDeviceRoughnessTexture(0x2ab7d143,177,28,8);
    palmRoughness.repeat.set(2.8,2.8);
    const fingerRoughness=makeDeviceRoughnessTexture(0x14d983c5,165,24,10);
    fingerRoughness.repeat.set(3.2,3.2);

    const aluminum=new THREE.MeshPhysicalMaterial({
      color:0x343638,
      metalness:.74,
      roughness:.39,
      roughnessMap:scannedMetalRough,
      normalMap:scannedMetalNormal,
      normalScale:new THREE.Vector2(.055,.055),
      clearcoat:.025,
      clearcoatRoughness:.62,
      envMapIntensity:.58
    });
    const edgeMetal=new THREE.MeshPhysicalMaterial({
      color:0x4a4c4d,
      metalness:.78,
      roughness:.34,
      roughnessMap:scannedMetalRough,
      normalMap:scannedMetalNormal,
      normalScale:new THREE.Vector2(.040,.040),
      clearcoat:.04,
      clearcoatRoughness:.52,
      envMapIntensity:.68
    });
    const blackGlass=new THREE.MeshPhysicalMaterial({
      color:0x080808,
      metalness:.02,
      roughness:.085,
      roughnessMap:glassRoughness,
      clearcoat:.72,
      clearcoatRoughness:.08,
      transmission:.025,
      ior:1.5,
      thickness:.006,
      envMapIntensity:.78
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

    // A shallow rear shell layer makes the chassis thickness readable when the
    // tablet pitches forward instead of collapsing into one extruded slab.
    const rearShell=new THREE.Mesh(
      extrudedRounded(2.77,1.95,.042,.162,.010),
      new THREE.MeshPhysicalMaterial({
        color:0x2c2e30,
        metalness:.70,
        roughness:.44,
        roughnessMap:scannedMetalRough,
        normalMap:scannedMetalNormal,
        normalScale:new THREE.Vector2(.050,.050),
        clearcoat:.02,
        clearcoatRoughness:.66,
        envMapIntensity:.50
      })
    );
    rearShell.position.z=-.088;
    rearShell.castShadow=true;
    rig.add(rearShell);

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
      color:0xf0ece4,
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

    // A very low-opacity reflection band lives above the physical bezel. It
    // moves with view angle and creates a separate optical layer from the HTML
    // display content underneath.
    const glassSheenMat=new THREE.MeshBasicMaterial({
      color:0xeee8df,
      transparent:true,
      opacity:0,
      depthWrite:false,
      toneMapped:false,
      blending:THREE.AdditiveBlending
    });
    const glassSheen=new THREE.Mesh(
      new THREE.PlaneGeometry(1.18,2.15),
      glassSheenMat
    );
    glassSheen.position.set(-.56,.08,.118);
    glassSheen.rotation.z=-.39;
    glassSheen.renderOrder=7;
    glassSheen.raycast=()=>{};
    rig.add(glassSheen);

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

    // Speaker perforations, a small charging port, and antenna seams add
    // hardware-scale detail that becomes visible in the lower-angle hand pose.
    const portMat=new THREE.MeshStandardMaterial({
      color:0x060708,
      roughness:.66,
      metalness:.18
    });
    const chargePort=new THREE.Mesh(
      new THREE.BoxGeometry(.26,.035,.036),
      portMat
    );
    chargePort.position.set(0,-1.010,-.012);
    chargePort.rotation.x=.04;
    rig.add(chargePort);

    const portInner=new THREE.Mesh(
      new THREE.BoxGeometry(.15,.012,.039),
      new THREE.MeshStandardMaterial({color:0x22272a,roughness:.44,metalness:.36})
    );
    portInner.position.set(0,-1.014,.009);
    rig.add(portInner);

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
      color:0xddd5cb,
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

    const handPalmSkin=new THREE.MeshPhysicalMaterial({
      color:0xc9967f,
      roughness:.56,
      roughnessMap:scannedSkinRough,
      normalMap:scannedSkinNormal,
      normalScale:new THREE.Vector2(.090,.090),
      bumpMap:skinMicroTexture,
      bumpScale:.00045,
      metalness:0,
      clearcoat:0,
      specularIntensity:.34,
      specularColor:new THREE.Color(0xffd6c9),
      envMapIntensity:.20
    });
    const handFingerSkin=new THREE.MeshPhysicalMaterial({
      color:0xcc9982,
      roughness:.52,
      roughnessMap:scannedSkinRough,
      normalMap:scannedSkinNormal,
      normalScale:new THREE.Vector2(.105,.105),
      bumpMap:skinMicroTexture,
      bumpScale:.00050,
      metalness:0,
      clearcoat:0,
      specularIntensity:.38,
      specularColor:new THREE.Color(0xffd5c6),
      envMapIntensity:.22
    });
    const nailMat=new THREE.MeshPhysicalMaterial({
      color:0xe7bbae,
      roughness:.26,
      metalness:0,
      clearcoat:.12,
      clearcoatRoughness:.22,
      specularIntensity:.46,
      specularColor:new THREE.Color(0xffeee8),
      envMapIntensity:.30
    });
    const sleeveMat=new THREE.MeshStandardMaterial({color:0x1f2021,roughness:.94,metalness:.01});

    function createHoldingHand(side){
      const hand=new THREE.Group();
      const s=side==='left'?-1:1;

      // Keep almost the whole hand behind the tablet, but let a thin crescent
      // of palm + thumb base show beyond the side rail. This gives a readable
      // grip silhouette without ever crossing onto the display surface.
      const palm=new THREE.Mesh(new THREE.SphereGeometry(.18,24,18),handPalmSkin);
      palm.scale.set(.70,1.02,.48);
      palm.position.set(s*1.47,-.765,-.105);
      palm.rotation.z=s*.09;
      hand.add(palm);

      // Heel + knuckle volumes break the single-sphere silhouette and make the
      // visible outside edge read as a compressed human grip around the chassis.
      const palmHeel=new THREE.Mesh(new THREE.SphereGeometry(.115,20,14),handPalmSkin);
      palmHeel.scale.set(.76,.70,.52);
      palmHeel.position.set(s*1.515,-.865,-.135);
      palmHeel.rotation.z=s*.18;
      hand.add(palmHeel);

      const knucklePad=new THREE.Mesh(new THREE.SphereGeometry(.090,18,12),handFingerSkin);
      knucklePad.scale.set(.62,.88,.48);
      knucklePad.position.set(s*1.455,-.645,-.125);
      knucklePad.rotation.z=s*.10;
      hand.add(knucklePad);

      const thumbRoot=new THREE.Mesh(new THREE.SphereGeometry(.075,18,14),handFingerSkin);
      thumbRoot.scale.set(.62,.82,.52);
      thumbRoot.position.set(s*1.455,-.755,-.07);
      thumbRoot.rotation.z=s*.18;
      hand.add(thumbRoot);

      const thumb=new THREE.Mesh(new THREE.CapsuleGeometry(.031,.12,8,12),handFingerSkin);
      thumb.position.set(s*1.455,-.735,-.012);
      thumb.rotation.z=s*.84;
      thumb.rotation.x=.34;
      hand.add(thumb);

      // A separate nail material gives the only exposed fingertip a keratin-like
      // response instead of letting the whole grip share one waxy skin shader.
      const nail=new THREE.Mesh(new THREE.SphereGeometry(.026,14,10),nailMat);
      nail.scale.set(.72,.34,.34);
      nail.position.set(s*1.407,-.695,.025);
      nail.rotation.z=s*.84;
      nail.rotation.x=.34;
      hand.add(nail);

      // Three rear fingers are visible only as slim side crescents. They sit
      // behind the display plane and sell the wraparound grip without covering UI.
      const rearFingers=[];
      [
        [-.925,.012,.145],
        [-.850,.010,.152],
        [-.775,.008,.146]
      ].forEach(([y,z,length],fingerIndex)=>{
        const finger=new THREE.Mesh(
          new THREE.CapsuleGeometry(.027-fingerIndex*.0015,length,8,12),
          handFingerSkin
        );
        finger.position.set(s*(1.438+fingerIndex*.006),y,-.128+z);
        finger.rotation.z=s*(.055+fingerIndex*.020);
        finger.rotation.x=.30+fingerIndex*.055;
        finger.scale.z=.86;
        hand.add(finger);
        rearFingers.push(finger);
      });

      // The front-facing index finger stays hidden: showing it across the glass
      // would interfere with the HTML interaction layer.
      const indexFinger=new THREE.Mesh(new THREE.CapsuleGeometry(.026,.14,8,12),handFingerSkin);
      indexFinger.position.set(s*1.43,-.92,-.11);
      indexFinger.rotation.z=s*.12;
      indexFinger.rotation.x=.46;
      indexFinger.visible=false;
      hand.add(indexFinger);

      const wristSkin=new THREE.Mesh(new THREE.CapsuleGeometry(.080,.18,8,12),handPalmSkin);
      wristSkin.position.set(s*1.61,-.955,-.155);
      wristSkin.rotation.z=s*.72;
      wristSkin.rotation.x=-.10;
      hand.add(wristSkin);

      const forearm=new THREE.Mesh(new THREE.CapsuleGeometry(.092,.46,8,14),sleeveMat);
      forearm.position.set(s*1.73,-1.035,-.18);
      forearm.rotation.z=s*.75;
      forearm.rotation.x=-.10;
      hand.add(forearm);

      hand.userData={
        side:s,
        palm,
        palmHeel,
        knucklePad,
        thumbRoot,
        thumb,
        nail,
        rearFingers,
        indexFinger,
        wristSkin,
        forearm,
        baseY:hand.position.y
      };
      rig.add(hand);
      return hand;
    }

    const leftHand=createHoldingHand('left');
    const rightHand=createHoldingHand('right');

    // Match the outdoor world instead of lighting the hands like a product studio.
    const hemi=new THREE.HemisphereLight(0xe8f0f2,0x5d554d,1.12);
    scene.add(hemi);
    const key=new THREE.DirectionalLight(0xffedd7,2.35);
    key.position.set(-2.6,3.2,4.2);
    scene.add(key);
    const rim=new THREE.DirectionalLight(0xb8d6de,.58);
    rim.position.set(3.6,-1.2,2.0);
    scene.add(rim);
    const soft=new THREE.PointLight(0xfff5e9,.48,8);
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
    let previousVelocityX=0;
    let previousVelocityY=0;
    let previousSpeed=0;
    let catchAmount=0;
    let catchDirectionX=0;
    let catchDirectionY=0;
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

      // A sudden reduction in hand speed creates a short "catch" phase:
      // the wrists brace and the device tucks back a few millimeters before
      // returning to neutral. Direction is captured from the previous frame
      // so stopping after a fast sweep still has a readable physical response.
      const pointerSpeed=Math.min(1,Math.hypot(pointerVelocityX,pointerVelocityY)*.030);
      const stopImpulse=Math.max(0,previousSpeed-pointerSpeed);
      if(stopImpulse>.018){
        const previousMagnitude=Math.max(.0001,Math.hypot(previousVelocityX,previousVelocityY));
        catchDirectionX=previousVelocityX/previousMagnitude;
        catchDirectionY=previousVelocityY/previousMagnitude;
        catchAmount=Math.max(catchAmount,THREE.MathUtils.clamp(stopImpulse*2.8,0,.72));
      }
      catchAmount*=Math.exp(-8.4*dt);
      previousSpeed=pointerSpeed;
      previousVelocityX=pointerVelocityX;
      previousVelocityY=pointerVelocityY;

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

      // The two hands do not establish contact on the exact same frame. The
      // dominant/right side catches the lower rail first, then the left hand
      // closes a fraction later. On the way down the same offsets naturally
      // unwind in reverse without introducing timers or input latency.
      const rightGripRaw=THREE.MathUtils.clamp((holdAmount+.035)/1.035,0,1);
      const leftGripRaw=THREE.MathUtils.clamp((holdAmount-.045)/.955,0,1);
      const rightGrip=rightGripRaw*rightGripRaw*(3-2*rightGripRaw);
      const leftGrip=leftGripRaw*leftGripRaw*(3-2*leftGripRaw);
      const leftGripHidden=1-leftGrip;
      const rightGripHidden=1-rightGrip;

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

      const catchPitch=-catchDirectionY*catchAmount*.0021*hold;
      const catchYaw=-catchDirectionX*catchAmount*.0026*hold;
      const catchRoll=-catchDirectionX*catchAmount*.0012*hold;

      rig.rotation.x=-.032 + hidden*.075 + swayPitch - pointerY*.010*hold + inertiaY*hold + hapticPitch*hold + catchPitch + impact*(.0045+pointerY*.0035);
      rig.rotation.y=.018 - hidden*.018 + swayYaw + pointerX*.013*hold + inertiaX*hold + hapticYaw*hold + catchYaw + impactX*.0065;
      rig.rotation.z=hidden*.012 + swayRoll - pointerX*.0025*hold - inertiaX*.18*hold + hapticRoll*hold + catchRoll - impactX*.0028;
      rig.position.x=swayX + pointerX*.010*hold + inertiaX*.22*hold - catchDirectionX*catchAmount*.0012*hold + impactX*.0025;
      rig.position.y=hidden*.115 + swayY - pointerY*.006*hold + inertiaY*.16*hold - catchDirectionY*catchAmount*.0010*hold - impact*.0035 + impactY*.0015;
      rig.position.z=-hidden*.055-impact*.014-catchAmount*.0065*hold;

      leftHand.rotation.z=-.010*leftGripHidden-pointerX*.004*leftGrip-inertiaX*.11*leftGrip;
      rightHand.rotation.z=.008*rightGripHidden-pointerX*.004*rightGrip-inertiaX*.11*rightGrip;

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

      const catchGrip=catchAmount*.0028*hold;
      leftHand.position.x=leftSide*.050*leftGripHidden-leftSide*(leftLoad*.0055+leftSupport*.0020+catchGrip);
      rightHand.position.x=rightSide*.047*rightGripHidden-rightSide*(rightLoad*.0055+rightSupport*.0020+catchGrip);
      leftHand.position.y=-.043*leftGripHidden+Math.sin(t*.83)*.0015*leftGrip-leftLoad*.0024+leftBreath-verticalBias*.0022;
      rightHand.position.y=-.038*rightGripHidden+Math.sin(t*.83+.18)*.0014*rightGrip-rightLoad*.0024+rightBreath+verticalBias*.0022;
      leftHand.position.z=-.020*leftGripHidden-leftLoad*.0016-catchAmount*.0012;
      rightHand.position.z=-.016*rightGripHidden-rightLoad*.0016-catchAmount*.0012;

      // Wrists counter-rotate against tablet inertia; palms and thumb roots
      // compress by different amounts so the device feels supported, not glued.
      leftHand.userData.forearm.rotation.z=leftSide*(.75+pointerX*.010+inertiaX*.22+hapticYaw*.08);
      rightHand.userData.forearm.rotation.z=rightSide*(.75+pointerX*.010+inertiaX*.22+hapticYaw*.08);
      leftHand.userData.forearm.rotation.x=-.10-pointerY*.012-inertiaY*.18-hapticPitch*.06;
      rightHand.userData.forearm.rotation.x=-.10-pointerY*.012-inertiaY*.18-hapticPitch*.06;

      leftHand.userData.palm.rotation.z=leftSide*(.09+leftSupport*.010+impact*.006);
      rightHand.userData.palm.rotation.z=rightSide*(.09+rightSupport*.010+impact*.006);
      leftHand.userData.palmHeel.rotation.z=leftSide*(.18+leftSupport*.014+leftLoad*.012);
      rightHand.userData.palmHeel.rotation.z=rightSide*(.18+rightSupport*.014+rightLoad*.012);
      leftHand.userData.palmHeel.scale.x=.76-leftLoad*.020-catchAmount*.008;
      rightHand.userData.palmHeel.scale.x=.76-rightLoad*.020-catchAmount*.008;
      leftHand.userData.knucklePad.scale.y=1-leftLoad*.035-catchAmount*.016;
      rightHand.userData.knucklePad.scale.y=1-rightLoad*.035-catchAmount*.016;
      leftHand.userData.thumbRoot.rotation.z=leftSide*(.18+leftSupport*.022+leftLoad*.020);
      rightHand.userData.thumbRoot.rotation.z=rightSide*(.18+rightSupport*.022+rightLoad*.020);
      leftHand.userData.thumbRoot.position.x=leftSide*(1.455-leftLoad*.0038-catchAmount*.0018);
      rightHand.userData.thumbRoot.position.x=rightSide*(1.455-rightLoad*.0038-catchAmount*.0018);
      leftHand.userData.thumbRoot.position.z=-.070+leftLoad*.0030;
      rightHand.userData.thumbRoot.position.z=-.070+rightLoad*.0030;

      leftHand.userData.rearFingers.forEach((finger,index)=>{
        finger.rotation.x=.30+index*.055+leftLoad*(.028+index*.005)+catchAmount*.010;
        finger.position.x=leftSide*(1.438+index*.006-leftLoad*.0022);
      });
      rightHand.userData.rearFingers.forEach((finger,index)=>{
        finger.rotation.x=.30+index*.055+rightLoad*(.028+index*.005)+catchAmount*.010;
        finger.position.x=rightSide*(1.438+index*.006-rightLoad*.0022);
      });

      leftHand.userData.thumb.rotation.x=.27+.07*leftGrip+leftLoad*.060+leftSupport*.011+catchAmount*.020;
      rightHand.userData.thumb.rotation.x=.27+.07*rightGrip+rightLoad*.060+rightSupport*.011+catchAmount*.020;
      leftHand.userData.thumb.rotation.z=leftSide*(.75+.09*leftGrip+leftLoad*.046+leftSupport*.013);
      rightHand.userData.thumb.rotation.z=rightSide*(.75+.09*rightGrip+rightLoad*.046+rightSupport*.013);
      leftHand.userData.thumb.position.x=leftSide*(1.455-leftLoad*.0045-catchAmount*.0020);
      rightHand.userData.thumb.position.x=rightSide*(1.455-rightLoad*.0045-catchAmount*.0020);
      leftHand.userData.thumb.position.z=-.012+leftLoad*.0040;
      rightHand.userData.thumb.position.z=-.012+rightLoad*.0040;
      leftHand.userData.nail.position.x=leftSide*(1.407-leftLoad*.0040);
      rightHand.userData.nail.position.x=rightSide*(1.407-rightLoad*.0040);

      // Material response: the metal gets slightly sharper at steeper pointer
      // angles, while the camera lens catches a moving pin-prick reflection.
      aluminum.roughness=.31-Math.min(.018,Math.abs(pointerX)*.010+Math.abs(pointerY)*.006);
      edgeMetal.roughness=.24-Math.min(.015,Math.abs(pointerX)*.009+Math.abs(pointerY)*.005);
      handPalmSkin.roughness=.56-Math.min(.020,Math.abs(pointerX)*.008+Math.max(0,pressAmount)*.014);
      handFingerSkin.roughness=.52-Math.min(.024,Math.abs(pointerY)*.010+Math.max(0,pressAmount)*.017);
      lensGlint.position.x=-.006+pointerX*.010;
      lensGlint.position.y=.900+pointerY*.006;
      lensGlintMat.opacity=(.22+.34*hold)*(1-Math.min(.45,Math.abs(pointerX)*.15))+Math.max(0,pressAmount)*.08;

      const opticalX=THREE.MathUtils.clamp(pointerX+inertiaX*18+hapticYaw*6,-1,1);
      const opticalY=THREE.MathUtils.clamp(pointerY+inertiaY*18+hapticPitch*6,-1,1);
      glassSheen.position.x=-.56+opticalX*.32;
      glassSheen.position.y=.08+opticalY*.16;
      glassSheen.rotation.z=-.39+opticalX*.055;
      glassSheenMat.opacity=(.012+.030*hold)*(1-Math.min(.62,Math.abs(opticalX)*.28+Math.abs(opticalY)*.20));

      // Keep the live screen optically separate from the 3D shell. The movement
      // is deliberately sub-pixel-to-few-pixel scale so UI targeting remains stable.
      if(tabletDom){
        tabletDom.style.setProperty('--screen-parallax-x',(opticalX*1.9).toFixed(2)+'px');
        tabletDom.style.setProperty('--screen-parallax-y',(opticalY*1.25).toFixed(2)+'px');
        tabletDom.style.setProperty('--glass-shift-x',(opticalX*11).toFixed(2)+'px');
        tabletDom.style.setProperty('--glass-shift-y',(opticalY*7).toFixed(2)+'px');
        tabletDom.style.setProperty('--glass-counter-x',(-opticalX*3.85).toFixed(2)+'px');
        tabletDom.style.setProperty('--glass-counter-y',(-opticalY*2.45).toFixed(2)+'px');
        tabletDom.style.setProperty('--glass-angle',(118+opticalX*3.8).toFixed(2)+'deg');
      }

      // Real side-wall visibility changes with tilt: the edge opposite the
      // direction of travel opens up more strongly, while the other side
      // almost disappears. Inertia and haptic release add a brief metal flash.
      const railMotion=Math.min(.08,Math.hypot(inertiaX,inertiaY)*2.7);
      const railHaptic=Math.min(.055,Math.abs(hapticPitch)*2.1+Math.abs(hapticYaw)*1.8+catchAmount*.038);
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