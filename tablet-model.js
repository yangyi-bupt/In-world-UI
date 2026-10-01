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
    let pressTarget=0;
    let pressAmount=0;
    let lastRenderTime=0;

    function setInteractionPointer(x=0,y=0,pressed=false){
      pointerTargetX=THREE.MathUtils.clamp(x,-1,1);
      pointerTargetY=THREE.MathUtils.clamp(y,-1,1);
      pressTarget=pressed?1:0;
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
      const presence=open?1:0;
      const follow=1-Math.pow(.003,dt);
      const pressFollow=1-Math.pow(.00005,dt);

      pointerX=THREE.MathUtils.lerp(pointerX,pointerTargetX,follow);
      pointerY=THREE.MathUtils.lerp(pointerY,pointerTargetY,follow);
      pressAmount=THREE.MathUtils.lerp(pressAmount,pressTarget,pressFollow);

      // Idle breathing + tiny pointer-driven parallax makes the device feel held,
      // while a click gives the tablet a subtle physical recoil.
      rig.rotation.x=-.032 + Math.sin(t*.72)*.004*presence - pointerY*.010*presence + pressAmount*.006;
      rig.rotation.y=.018 + Math.sin(t*.53)*.010*presence + pointerX*.013*presence;
      rig.rotation.z=Math.sin(t*.41)*.0026*presence - pointerX*.0025*presence;
      rig.position.x=pointerX*.010*presence;
      rig.position.y=Math.sin(t*.83)*.006*presence - pointerY*.006*presence - pressAmount*.004;
      rig.position.z=-pressAmount*.014;

      leftHand.rotation.z=-pointerX*.004;
      rightHand.rotation.z=-pointerX*.004;
      leftHand.position.x=-leftHand.userData.side*pressAmount*.004;
      rightHand.position.x=-rightHand.userData.side*pressAmount*.004;
      leftHand.position.y=Math.sin(t*.83)*.0015-pressAmount*.002;
      rightHand.position.y=Math.sin(t*.83)*.0015-pressAmount*.002;
      leftHand.userData.thumb.rotation.x=.34+pressAmount*.05;
      rightHand.userData.thumb.rotation.x=.34+pressAmount*.05;
      leftHand.userData.thumb.rotation.z=leftHand.userData.side*(.84+pressAmount*.035);
      rightHand.userData.thumb.rotation.z=rightHand.userData.side*(.84+pressAmount*.035);

      key.position.x=-2.6+Math.sin(t*.38)*.28+pointerX*.22;
      rim.position.y=-1.2+Math.cos(t*.46)*.2-pointerY*.15;
      renderer.render(scene,camera);
    }

    resize();
    return {render,resize,renderer,camera,setInteractionPointer,clearInteractionPointer};
  };
})();