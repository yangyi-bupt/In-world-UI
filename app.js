const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.physicallyCorrectLights = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0e12);
scene.fog = new THREE.FogExp2(0x0b0e12, 0.033);

const camera = new THREE.PerspectiveCamera(78, window.innerWidth / window.innerHeight, 0.08, 80);
camera.position.set(0, 1.68, 5.3);
camera.rotation.order = 'YXZ';

// A slightly wider field of view + subtle camera inertia makes the flat-screen
// prototype feel closer to looking through a headset without requiring WebXR.
let cameraFovTarget = 78;

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x8fa2b5, 0x18130f, 0.78));

const warm = new THREE.PointLight(0xffbd82, 42, 10.5, 2);
warm.position.set(-3.55, 2.85, 0.65);
warm.castShadow = true;
warm.shadow.mapSize.set(1024, 1024);
warm.shadow.bias = -0.0005;
scene.add(warm);

const cool = new THREE.PointLight(0x78b7ff, 20, 12, 2);
cool.position.set(3.7, 2.8, -4.7);
scene.add(cool);

const faceLight = new THREE.SpotLight(0xffd6bd, 24, 8, Math.PI * .24, .55, 1.6);
faceLight.position.set(0.4, 3.1, 1.5);
faceLight.target.position.set(1.7, 1.5, -2.25);
scene.add(faceLight, faceLight.target);

function box(w, h, d, color, x, y, z, roughness=.72) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color, roughness, metalness: .02 })
  );
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

// ---------- room ----------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(16, 16),
  new THREE.MeshStandardMaterial({ color: 0x252422, roughness: .92 })
);
floor.rotation.x = -Math.PI/2;
floor.receiveShadow = true;
scene.add(floor);

box(16, 5, .25, 0x20252a, 0, 2.5, -6.7);
box(.25, 5, 13.5, 0x1a1e22, -7.9, 2.5, 0);
box(.25, 5, 13.5, 0x24272a, 7.9, 2.5, 0);

// Window wall + skyline
const windowFrame = box(6.2, 3.1, .16, 0x171a1d, 2.3, 2.8, -6.48);
const glass = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.55), new THREE.MeshPhysicalMaterial({color:0x324b62,transparent:true,opacity:.27,roughness:.12,metalness:.12,transmission:.12}));
glass.position.set(2.3,2.8,-6.32);scene.add(glass);
for(let i=0;i<22;i++){
  const h=.4+Math.random()*2.2;
  const b=box(.25+Math.random()*.5,h,.35,0x111823,-.3+i*.29, h/2+.1,-6.55);
  if(Math.random()>.45){
    const wm=new THREE.Mesh(new THREE.PlaneGeometry(.08,.08),new THREE.MeshBasicMaterial({color:Math.random()>.5?0xffcf7d:0x81bfff}));
    wm.position.set(b.position.x,b.position.y,b.position.z+.19);scene.add(wm);
  }
}

// Rug, sofa, table
const rug = new THREE.Mesh(new THREE.PlaneGeometry(5.5,3.8),new THREE.MeshStandardMaterial({color:0x433d39,roughness:1}));
rug.rotation.x=-Math.PI/2;rug.position.set(-.5,.012,-1.2);scene.add(rug);
box(3.6,.6,1.05,0x403b3a,-2.6,.43,-2.6);box(3.6,.9,.28,0x373334,-2.6,1,-3.03);box(.28,.78,1.05,0x383334,-4.38,.56,-2.6);box(.28,.78,1.05,0x383334,-.82,.56,-2.6);
box(2.1,.12,1.0,0x211d1a,-.1,.65,-.9);box(.12,.62,.12,0x151312,-.88,.33,-1.25);box(.12,.62,.12,0x151312,.68,.33,-1.25);box(.12,.62,.12,0x151312,-.88,.33,-.55);box(.12,.62,.12,0x151312,.68,.33,-.55);

// Shelf
box(2.8,2.7,.35,0x1c1917,-5.9,1.36,1.8);for(let y=0;y<4;y++) box(2.65,.08,.55,0x2a2520,-5.9,.35+y*.72,1.62);
for(let i=0;i<11;i++) box(.08+Math.random()*.12,.25+Math.random()*.32,.3,[0x6e5f55,0x394c52,0x6b3f3f,0x4d5840][i%4],-6.95+i*.2,.55+(i%3)*.72,1.38);

// Lamp
box(.06,1.7,.06,0x262322,-3.8,.9,.8); const shade = new THREE.Mesh(new THREE.ConeGeometry(.42,.52,24,1,true),new THREE.MeshStandardMaterial({color:0xc9a077,side:THREE.DoubleSide,roughness:.85}));shade.position.set(-3.8,1.84,.8);scene.add(shade);

// Plant
box(.72,.48,.72,0x3d3027,4.9,.24,-1.2); const stemMat=new THREE.MeshStandardMaterial({color:0x37503a});
for(let i=0;i<8;i++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),stemMat);leaf.scale.set(1,2.3,.5);leaf.position.set(4.9+(Math.random()-.5)*.55,.7+Math.random()*1.2,-1.2+(Math.random()-.5)*.5);leaf.rotation.z=(Math.random()-.5)*1.4;scene.add(leaf)}

// NPC: Mira — articulated human silhouette rather than a capsule mannequin
const mira = new THREE.Group();
const miraRig = new THREE.Group();
mira.add(miraRig);

const skinMat = new THREE.MeshStandardMaterial({color:0xb9826f, roughness:.72, metalness:0});
const skinLightMat = new THREE.MeshStandardMaterial({color:0xca9580, roughness:.7, metalness:0});
const jacketMat = new THREE.MeshStandardMaterial({color:0x252a2f, roughness:.7, metalness:.03});
const shirtMat = new THREE.MeshStandardMaterial({color:0x5f6466, roughness:.86});
const denimMat = new THREE.MeshStandardMaterial({color:0x252b34, roughness:.9});
const shoeMat = new THREE.MeshStandardMaterial({color:0x111214, roughness:.62});
const hairMat = new THREE.MeshStandardMaterial({color:0x1d1513, roughness:.88});
const eyeWhite = new THREE.MeshStandardMaterial({color:0xe8dfd8, roughness:.55});
const irisMat = new THREE.MeshStandardMaterial({color:0x33291f, roughness:.45});
const lipMat = new THREE.MeshStandardMaterial({color:0x7a3d3d, roughness:.76});

function capsule(radius,length,material){
  const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,8,16),material);
  mesh.castShadow=true; mesh.receiveShadow=true; return mesh;
}
function addLimb(parent, upperPos, upperRot, upperLen, lowerOffset, lowerRot, lowerLen, material){
  const upper=capsule(.095,upperLen,material);
  upper.position.copy(upperPos); upper.rotation.set(...upperRot); parent.add(upper);
  const lower=capsule(.082,lowerLen,material);
  lower.position.copy(lowerOffset); lower.rotation.set(...lowerRot); parent.add(lower);
  return {upper,lower};
}

// legs + shoes
const leftLeg=capsule(.115,.69,denimMat); leftLeg.position.set(-.14,.49,0); leftLeg.rotation.z=.025; miraRig.add(leftLeg);
const rightLeg=leftLeg.clone(); rightLeg.position.x=.14; rightLeg.rotation.z=-.025; miraRig.add(rightLeg);
const leftShoe=new THREE.Mesh(new THREE.BoxGeometry(.24,.12,.42),shoeMat);leftShoe.position.set(-.14,.08,.08);leftShoe.rotation.x=-.04;leftShoe.castShadow=true;miraRig.add(leftShoe);
const rightShoe=leftShoe.clone();rightShoe.position.x=.14;miraRig.add(rightShoe);

// hips, torso and jacket create a much more human shoulder/waist silhouette
const hips=capsule(.255,.2,denimMat); hips.position.y=.86; hips.rotation.z=Math.PI/2; hips.scale.set(.82,1,.84); miraRig.add(hips);
const torso=capsule(.275,.55,jacketMat); torso.position.y=1.25; torso.scale.set(1.04,1,.66); miraRig.add(torso);
const shirt=new THREE.Mesh(new THREE.BoxGeometry(.22,.36,.025),shirtMat);shirt.position.set(0,1.3,.225);shirt.castShadow=true;miraRig.add(shirt);

const neck=capsule(.085,.10,skinMat); neck.position.y=1.64; miraRig.add(neck);
const head=new THREE.Mesh(new THREE.SphereGeometry(.235,32,24),skinLightMat);
head.scale.set(.88,1.13,.93); head.position.y=1.87; head.castShadow=true; miraRig.add(head);

// hair: cap + back volume + side strands
const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.247,28,18,0,Math.PI*2,0,Math.PI*.62),hairMat);
hairCap.scale.set(.9,1.12,.94);hairCap.position.set(0,1.91,-.012);hairCap.castShadow=true;miraRig.add(hairCap);
const hairBack=new THREE.Mesh(new THREE.SphereGeometry(.205,24,16),hairMat);
hairBack.scale.set(1,1.48,.58);hairBack.position.set(0,1.77,-.17);hairBack.castShadow=true;miraRig.add(hairBack);

// face details are intentionally subtle; at normal gameplay distance they read as a face, not a toy
[-1,1].forEach(side=>{
  const sclera=new THREE.Mesh(new THREE.SphereGeometry(.033,14,10),eyeWhite);
  sclera.scale.set(1.35,.66,.32); sclera.position.set(.082*side,1.91,.209); miraRig.add(sclera);
  const iris=new THREE.Mesh(new THREE.SphereGeometry(.013,12,8),irisMat);
  iris.scale.z=.42; iris.position.set(.082*side,1.908,.229); miraRig.add(iris);
  const brow=new THREE.Mesh(new THREE.BoxGeometry(.075,.012,.012),hairMat);
  brow.position.set(.083*side,1.965,.219); brow.rotation.z=.06*side; miraRig.add(brow);
  const ear=new THREE.Mesh(new THREE.SphereGeometry(.035,12,8),skinMat);
  ear.scale.set(.45,1,.5); ear.position.set(.218*side,1.885,0); miraRig.add(ear);
});
const nose=new THREE.Mesh(new THREE.ConeGeometry(.025,.065,12),skinMat);nose.rotation.x=Math.PI/2;nose.position.set(0,1.875,.242);miraRig.add(nose);
const lips=new THREE.Mesh(new THREE.BoxGeometry(.078,.018,.012),lipMat);lips.position.set(0,1.81,.226);miraRig.add(lips);

// arms with a natural relaxed pose
const lUpper=capsule(.09,.43,jacketMat);lUpper.position.set(-.34,1.34,.005);lUpper.rotation.z=-.18;miraRig.add(lUpper);
const rUpper=capsule(.09,.43,jacketMat);rUpper.position.set(.34,1.34,.005);rUpper.rotation.z=.18;miraRig.add(rUpper);
const lFore=capsule(.074,.39,skinMat);lFore.position.set(-.40,.94,.08);lFore.rotation.z=-.08;lFore.rotation.x=-.05;miraRig.add(lFore);
const rFore=capsule(.074,.39,skinMat);rFore.position.set(.40,.94,.08);rFore.rotation.z=.08;rFore.rotation.x=-.05;miraRig.add(rFore);
const lHand=new THREE.Mesh(new THREE.SphereGeometry(.09,16,12),skinMat);lHand.scale.set(.72,1.08,.55);lHand.position.set(-.42,.71,.10);miraRig.add(lHand);
const rHand=lHand.clone();rHand.position.x=.42;miraRig.add(rHand);

mira.position.set(1.7,0,-2.25);
mira.rotation.y=-.52;
mira.scale.setScalar(1.02);
scene.add(mira);

// Art panels
for (let i=0;i<3;i++) {
  const art=box(.9,1.25,.06,[0x2d3f46,0x4a3437,0x3e4334][i],-6.5+i*1.25,2.55,-6.5);
  art.material.emissive=new THREE.Color([0x081115,0x130a0c,0x0a1008][i]);art.material.emissiveIntensity=.55;
}

// ---------- player controls ----------
const keys = new Set();
let yaw=0, pitch=0, targetYaw=0, targetPitch=0, turnImpulse=0;
let tabletOpen=false, started=false;
const velocity=new THREE.Vector3();
const dir=new THREE.Vector3();
const baseEyeHeight=1.68;
const roomBounds={x:7.1,z:5.9};

document.addEventListener('keydown',e=>{
  keys.add(e.code);
  if(e.code==='KeyE') toggleTablet();
  if(e.code==='Escape' && tabletOpen) closeTablet();
});
document.addEventListener('keyup',e=>keys.delete(e.code));

document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas || tabletOpen) return;
  targetYaw -= e.movementX*.00165;
  targetPitch -= e.movementY*.00138;
  targetPitch=Math.max(-1.12,Math.min(1.12,targetPitch));
  turnImpulse=THREE.MathUtils.clamp(e.movementX,-42,42);
});
canvas.addEventListener('click',()=>{ if(started && !tabletOpen) canvas.requestPointerLock(); });

const tablet3DCanvas=document.querySelector('#tablet3d');
const tablet3D=window.createTablet3DController?.(tablet3DCanvas) || null;

const tabletLayer=document.querySelector('#tabletLayer');
const hud=document.querySelector('#hud');
const crosshair=document.querySelector('#crosshair');
const modeLabel=document.querySelector('#modeLabel');
let tabletCloseTimer=null;

function openTablet(){
  if(tabletCloseTimer){
    clearTimeout(tabletCloseTimer);
    tabletCloseTimer=null;
  }

  tabletOpen=true; keys.clear(); document.exitPointerLock?.();
  cameraFovTarget=71;
  document.body.classList.add('device-open');
  tabletLayer?.classList.remove('closing');
  tabletLayer?.classList.add('open');
  tabletLayer?.setAttribute('aria-hidden','false');
  hud?.classList.add('dimmed');
  if(crosshair) crosshair.style.display='none';
  if(modeLabel) modeLabel.textContent='DEVICE';
  window.dispatchEvent(new CustomEvent('tablet-open'));
}

function closeTablet(){
  if(!tabletOpen) return;

  tabletOpen=false; cameraFovTarget=78;
  tabletLayer?.classList.add('closing');
  tabletLayer?.setAttribute('aria-hidden','true');
  window.dispatchEvent(new CustomEvent('tablet-close'));

  tabletCloseTimer=setTimeout(()=>{
    tabletLayer?.classList.remove('open','closing');
    document.body.classList.remove('device-open');
    hud?.classList.remove('dimmed');
    if(crosshair) crosshair.style.display='';
    if(modeLabel) modeLabel.textContent='EXPLORE';
    tabletCloseTimer=null;
    if(started && !tabletOpen) canvas.requestPointerLock?.();
  },460);
}

function toggleTablet(){tabletOpen?closeTablet():openTablet()}
const closeTabletBtn=document.querySelector('#closeTablet');
if(closeTabletBtn){closeTabletBtn.addEventListener('click',closeTablet);}

// ---------- tablet UI ----------
const views=[...document.querySelectorAll('.view')];
function showView(id){views.forEach(v=>v.classList.toggle('active-view',v.id===id));}
document.querySelectorAll('.app').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.app)));
document.querySelectorAll('.back').forEach(btn=>btn.addEventListener('click',()=>showView('home')));
const form=document.querySelector('#messageForm');const input=document.querySelector('#messageInput');const list=document.querySelector('#messageList');
if(form && input && list){form.addEventListener('submit',e=>{e.preventDefault();const t=input.value.trim();if(!t)return;const b=document.createElement('div');b.className='bubble mine';b.textContent=t;list.appendChild(b);input.value='';list.scrollTop=list.scrollHeight;setTimeout(()=>{const r=document.createElement('div');r.className='bubble theirs';r.textContent='Got it. Meet me by the window.';list.appendChild(r);list.scrollTop=list.scrollHeight;},700)});}
function updateClock(){const clockEl=document.querySelector('#clock');if(!clockEl)return;clockEl.textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}updateClock();setInterval(updateClock,30000);

const startOverlay=document.querySelector('#startOverlay');
const startBtn=document.querySelector('#startBtn');
if(startBtn){startBtn.addEventListener('click',()=>{started=true;startOverlay?.classList.add('hidden');setTimeout(()=>canvas.requestPointerLock?.(),250)});}

// ---------- animation ----------
const clock=new THREE.Clock();
let walkPhase=0;
function animate(){
  const dt=Math.min(clock.getDelta(),.033);
  const t=clock.elapsedTime;

  // Headset-like look inertia: input drives a target, the view follows softly.
  yaw=THREE.MathUtils.lerp(yaw,targetYaw,1-Math.pow(.0007,dt));
  pitch=THREE.MathUtils.lerp(pitch,targetPitch,1-Math.pow(.0007,dt));
  turnImpulse*=Math.pow(.035,dt);

  if(!tabletOpen){
    dir.set(0,0,0);
    if(keys.has('KeyW'))dir.z-=1;if(keys.has('KeyS'))dir.z+=1;if(keys.has('KeyA'))dir.x-=1;if(keys.has('KeyD'))dir.x+=1;
    if(dir.lengthSq()>0){
      dir.normalize();
      const sin=Math.sin(yaw),cos=Math.cos(yaw);
      const x=dir.x*cos-dir.z*sin;
      const z=dir.x*sin+dir.z*cos;
      velocity.x=THREE.MathUtils.lerp(velocity.x,x*2.25,1-Math.pow(.008,dt));
      velocity.z=THREE.MathUtils.lerp(velocity.z,z*2.25,1-Math.pow(.008,dt));
    }else{
      velocity.x*=Math.pow(.001,dt);
      velocity.z*=Math.pow(.001,dt);
    }
    camera.position.x+=velocity.x*dt;camera.position.z+=velocity.z*dt;
    camera.position.x=THREE.MathUtils.clamp(camera.position.x,-roomBounds.x,roomBounds.x);
    camera.position.z=THREE.MathUtils.clamp(camera.position.z,-roomBounds.z,roomBounds.z);
  } else {
    velocity.multiplyScalar(Math.pow(.003,dt));
  }

  const speed=Math.min(1,Math.hypot(velocity.x,velocity.z)/2.25);
  walkPhase += dt*(4.2+speed*6.2);
  const walkBob = tabletOpen ? 0 : Math.sin(walkPhase*2)*.018*speed;
  const walkSway = tabletOpen ? 0 : Math.sin(walkPhase)*.0055*speed;
  const breath = Math.sin(t*1.38)*.0032;

  camera.rotation.y=yaw;
  camera.rotation.x=pitch + Math.sin(walkPhase)*.003*speed;
  camera.rotation.z=THREE.MathUtils.lerp(camera.rotation.z,-turnImpulse*.00042 + walkSway,.12);
  camera.position.y=baseEyeHeight + walkBob + breath;

  // Smooth field-of-view shift when focusing on the near tablet.
  camera.fov=THREE.MathUtils.lerp(camera.fov,cameraFovTarget,1-Math.pow(.001,dt));
  camera.updateProjectionMatrix();

  // Human idle: breathing, tiny weight shift and occasional attention toward player.
  const idleBreath=Math.sin(t*1.55);
  torso.scale.y=1+idleBreath*.009;
  torso.position.y=1.25+idleBreath*.004;
  miraRig.position.y=Math.sin(t*.72)*.003;
  miraRig.rotation.z=Math.sin(t*.48)*.006;
  head.rotation.y=Math.sin(t*.31)*.07;
  head.rotation.x=Math.sin(t*.43)*.018;
  lFore.rotation.x=-.05+Math.sin(t*.62)*.012;
  rFore.rotation.x=-.05-Math.sin(t*.62)*.012;

  tablet3D?.render(t,tabletOpen);
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);tablet3D?.resize();});
