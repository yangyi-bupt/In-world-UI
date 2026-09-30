const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x101317);
scene.fog = new THREE.Fog(0x101317, 8, 24);

const camera = new THREE.PerspectiveCamera(67, window.innerWidth / window.innerHeight, 0.1, 80);
camera.position.set(0, 1.68, 5.3);
camera.rotation.order = 'YXZ';

// ---------- lights ----------
scene.add(new THREE.HemisphereLight(0x9db3c4, 0x191513, 1.15));
const warm = new THREE.PointLight(0xffc99b, 22, 13, 1.8);
warm.position.set(-3.3, 3.2, 0.4);
warm.castShadow = true;
scene.add(warm);
const cool = new THREE.PointLight(0x8fcfff, 14, 11, 1.7);
cool.position.set(3.7, 2.6, -3.2);
scene.add(cool);

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

// NPC: Mira
const mira = new THREE.Group();
const bodyMat = new THREE.MeshStandardMaterial({color:0x272b31,roughness:.75});
const skinMat = new THREE.MeshStandardMaterial({color:0xb98c78,roughness:.82});
const hairMat = new THREE.MeshStandardMaterial({color:0x201816,roughness:.85});
const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.32,.78,6,12),bodyMat);torso.position.y=1.12;mira.add(torso);
const head=new THREE.Mesh(new THREE.SphereGeometry(.25,20,14),skinMat);head.position.y=1.82;mira.add(head);
const hair=new THREE.Mesh(new THREE.SphereGeometry(.265,20,14,0,Math.PI*2,0,Math.PI*.57),hairMat);hair.position.set(0,1.89,-.035);mira.add(hair);
const leg1=new THREE.Mesh(new THREE.CapsuleGeometry(.105,.72,4,8),bodyMat);leg1.position.set(-.15,.44,0);mira.add(leg1);const leg2=leg1.clone();leg2.position.x=.15;mira.add(leg2);
mira.position.set(1.7,0,-2.25);mira.rotation.y=-.55;scene.add(mira);

// Art panels
for (let i=0;i<3;i++) {
  const art=box(.9,1.25,.06,[0x2d3f46,0x4a3437,0x3e4334][i],-6.5+i*1.25,2.55,-6.5);
  art.material.emissive=new THREE.Color([0x081115,0x130a0c,0x0a1008][i]);art.material.emissiveIntensity=.55;
}

// ---------- player controls ----------
const keys = new Set();
let yaw=0, pitch=0, tabletOpen=false, started=false;
const velocity=new THREE.Vector3();
const dir=new THREE.Vector3();
const roomBounds={x:7.1,z:5.9};

document.addEventListener('keydown',e=>{
  keys.add(e.code);
  if(e.code==='KeyE') toggleTablet();
  if(e.code==='Escape' && tabletOpen) closeTablet();
});
document.addEventListener('keyup',e=>keys.delete(e.code));

document.addEventListener('mousemove',e=>{
  if(document.pointerLockElement!==canvas || tabletOpen) return;
  yaw -= e.movementX*.0017;
  pitch -= e.movementY*.00145;
  pitch=Math.max(-1.22,Math.min(1.22,pitch));
});
canvas.addEventListener('click',()=>{ if(started && !tabletOpen) canvas.requestPointerLock(); });

const tabletLayer=document.querySelector('#tabletLayer');
const hud=document.querySelector('#hud');
const crosshair=document.querySelector('#crosshair');
const modeLabel=document.querySelector('#modeLabel');
function openTablet(){
  tabletOpen=true; keys.clear(); document.exitPointerLock?.();
  tabletLayer.classList.add('open');tabletLayer.setAttribute('aria-hidden','false');hud.classList.add('dimmed');crosshair.style.display='none';modeLabel.textContent='DEVICE';
}
function closeTablet(){
  tabletOpen=false;tabletLayer.classList.remove('open');tabletLayer.setAttribute('aria-hidden','true');hud.classList.remove('dimmed');crosshair.style.display='';modeLabel.textContent='EXPLORE';
  setTimeout(()=>{ if(started && !tabletOpen) canvas.requestPointerLock?.(); },180);
}
function toggleTablet(){tabletOpen?closeTablet():openTablet()}
document.querySelector('#closeTablet').addEventListener('click',closeTablet);

// ---------- tablet UI ----------
const views=[...document.querySelectorAll('.view')];
function showView(id){views.forEach(v=>v.classList.toggle('active-view',v.id===id));}
document.querySelectorAll('.app').forEach(btn=>btn.addEventListener('click',()=>showView(btn.dataset.app)));
document.querySelectorAll('.back').forEach(btn=>btn.addEventListener('click',()=>showView('home')));
const form=document.querySelector('#messageForm');const input=document.querySelector('#messageInput');const list=document.querySelector('#messageList');
form.addEventListener('submit',e=>{e.preventDefault();const t=input.value.trim();if(!t)return;const b=document.createElement('div');b.className='bubble mine';b.textContent=t;list.appendChild(b);input.value='';list.scrollTop=list.scrollHeight;setTimeout(()=>{const r=document.createElement('div');r.className='bubble theirs';r.textContent='Got it. Meet me by the window.';list.appendChild(r);list.scrollTop=list.scrollHeight;},700)});
function updateClock(){document.querySelector('#clock').textContent=new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});}updateClock();setInterval(updateClock,30000);

const startOverlay=document.querySelector('#startOverlay');
document.querySelector('#startBtn').addEventListener('click',()=>{started=true;startOverlay.classList.add('hidden');setTimeout(()=>canvas.requestPointerLock?.(),250)});

// ---------- animation ----------
const clock=new THREE.Clock();
function animate(){
  const dt=Math.min(clock.getDelta(),.033);
  const t=clock.elapsedTime;
  if(!tabletOpen){
    dir.set(0,0,0);
    if(keys.has('KeyW'))dir.z-=1;if(keys.has('KeyS'))dir.z+=1;if(keys.has('KeyA'))dir.x-=1;if(keys.has('KeyD'))dir.x+=1;
    if(dir.lengthSq()>0){dir.normalize();const sin=Math.sin(yaw),cos=Math.cos(yaw);const x=dir.x*cos-dir.z*sin;const z=dir.x*sin+dir.z*cos;velocity.x=THREE.MathUtils.lerp(velocity.x,x*2.45,.16);velocity.z=THREE.MathUtils.lerp(velocity.z,z*2.45,.16);}else{velocity.x*=.82;velocity.z*=.82}
    camera.position.x+=velocity.x*dt;camera.position.z+=velocity.z*dt;
    camera.position.x=THREE.MathUtils.clamp(camera.position.x,-roomBounds.x,roomBounds.x);camera.position.z=THREE.MathUtils.clamp(camera.position.z,-roomBounds.z,roomBounds.z);
  } else { velocity.multiplyScalar(.75); }
  camera.rotation.y=yaw;camera.rotation.x=pitch;
  camera.position.y=1.68 + (dir.lengthSq()>0 && !tabletOpen ? Math.sin(t*11)*.012 : 0);
  mira.rotation.z=Math.sin(t*.85)*.008;
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight)});
