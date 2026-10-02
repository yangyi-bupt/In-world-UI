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
scene.background = new THREE.Color(0xc9e2ef);
scene.fog = new THREE.Fog(0xdde9e8, 30, 90);

const skyCanvas=document.createElement('canvas');
skyCanvas.width=32;
skyCanvas.height=512;
const skyCtx=skyCanvas.getContext('2d');
const skyGradient=skyCtx.createLinearGradient(0,0,0,512);
skyGradient.addColorStop(0,'#82bee2');
skyGradient.addColorStop(.40,'#b0d6e9');
skyGradient.addColorStop(.72,'#dcecef');
skyGradient.addColorStop(1,'#f4eee1');
skyCtx.fillStyle=skyGradient;
skyCtx.fillRect(0,0,32,512);
const skyTexture=new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace=THREE.SRGBColorSpace;
const skyDome=new THREE.Mesh(
  new THREE.SphereGeometry(88,32,20),
  new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,depthWrite:false,toneMapped:false})
);
skyDome.position.y=3;
scene.add(skyDome);

const sunCanvas=document.createElement('canvas');
sunCanvas.width=256;
sunCanvas.height=256;
const sunCtx=sunCanvas.getContext('2d');
const sunGlow=sunCtx.createRadialGradient(128,128,5,128,128,126);
sunGlow.addColorStop(0,'rgba(255,250,225,.98)');
sunGlow.addColorStop(.10,'rgba(255,246,215,.82)');
sunGlow.addColorStop(.34,'rgba(255,238,198,.20)');
sunGlow.addColorStop(1,'rgba(255,238,198,0)');
sunCtx.fillStyle=sunGlow;
sunCtx.fillRect(0,0,256,256);
const sunTexture=new THREE.CanvasTexture(sunCanvas);
sunTexture.colorSpace=THREE.SRGBColorSpace;
const sunHaze=new THREE.Sprite(new THREE.SpriteMaterial({
  map:sunTexture,
  transparent:true,
  depthTest:false,
  depthWrite:false,
  toneMapped:false,
  opacity:.84
}));
sunHaze.position.set(-34,34,-46);
sunHaze.scale.set(18,18,1);
scene.add(sunHaze);

const camera = new THREE.PerspectiveCamera(72.5, window.innerWidth / window.innerHeight, 0.08, 120);
camera.position.set(1.4, 1.68, 7.8);
camera.rotation.order = 'YXZ';

// A slightly wider field of view + subtle camera inertia makes the flat-screen
// prototype feel closer to looking through a headset without requiring WebXR.
let cameraFovTarget = 72.5;

// ---------- daylight ----------
renderer.toneMappingExposure = 1.02;

const skyLight = new THREE.HemisphereLight(0xeaf7ff, 0xb7ad94, 1.7);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xfff0d3, 3.2);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 52;
sun.shadow.bias = -0.00028;
sun.shadow.normalBias = .022;
sun.shadow.radius = 3.2;
scene.add(sun);

const daylightFill = new THREE.DirectionalLight(0xc7ddf2, .54);
daylightFill.position.set(10, 8, -12);
scene.add(daylightFill);

const shopBounce = new THREE.DirectionalLight(0xffddb9, .24);
shopBounce.position.set(9,5,6);
scene.add(shopBounce);

const faceLight = new THREE.SpotLight(0xffe2c8, 12, 9, Math.PI * .22, .72, 1.5);
faceLight.position.set(1.1, 3.8, 3.2);
faceLight.target.position.set(2.0, 1.45, -1.6);
scene.add(faceLight, faceLight.target);

function makeSurfaceTexture(kind){
  const size=256;
  const c=document.createElement('canvas');
  c.width=size;
  c.height=size;
  const g=c.getContext('2d');

  if(kind==='asphalt'){
    g.fillStyle='#575d60';
    g.fillRect(0,0,size,size);
    for(let i=0;i<1700;i++){
      const v=70+Math.floor(Math.random()*55);
      const a=.025+Math.random()*.045;
      g.fillStyle='rgba('+v+','+v+','+v+','+a.toFixed(3)+')';
      const r=.35+Math.random()*1.25;
      g.fillRect(Math.random()*size,Math.random()*size,r,r);
    }
    for(let i=0;i<22;i++){
      g.strokeStyle='rgba(35,40,42,'+(.025+Math.random()*.025).toFixed(3)+')';
      g.lineWidth=.45+Math.random()*.8;
      g.beginPath();
      const x=Math.random()*size;
      const y=Math.random()*size;
      g.moveTo(x,y);
      g.lineTo(x+(Math.random()-.5)*42,y+(Math.random()-.5)*42);
      g.stroke();
    }
  }else{
    g.fillStyle='#d6d2c7';
    g.fillRect(0,0,size,size);
    for(let i=0;i<1200;i++){
      const warm=Math.random()>.52;
      const base=warm?188:205;
      const a=.018+Math.random()*.030;
      g.fillStyle='rgba('+(base+8)+','+(base+5)+','+base+','+a.toFixed(3)+')';
      g.beginPath();
      g.arc(Math.random()*size,Math.random()*size,.35+Math.random()*1.15,0,Math.PI*2);
      g.fill();
    }
  }

  const texture=new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;
  texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

const asphaltTexture=makeSurfaceTexture('asphalt');
asphaltTexture.repeat.set(5,26);
const pavementTexture=makeSurfaceTexture('pavement');
pavementTexture.repeat.set(5,22);

const glassReflectionCanvas=document.createElement('canvas');
glassReflectionCanvas.width=128;
glassReflectionCanvas.height=256;
const glassReflectionCtx=glassReflectionCanvas.getContext('2d');
const glassReflectionGradient=glassReflectionCtx.createLinearGradient(0,0,0,256);
glassReflectionGradient.addColorStop(0,'rgba(225,244,255,.66)');
glassReflectionGradient.addColorStop(.24,'rgba(181,219,236,.30)');
glassReflectionGradient.addColorStop(.48,'rgba(126,176,198,.14)');
glassReflectionGradient.addColorStop(.67,'rgba(226,237,231,.24)');
glassReflectionGradient.addColorStop(1,'rgba(94,135,152,.18)');
glassReflectionCtx.fillStyle=glassReflectionGradient;
glassReflectionCtx.fillRect(0,0,128,256);
for(let i=0;i<7;i++){
  glassReflectionCtx.fillStyle='rgba(255,255,255,'+(.025+i*.004).toFixed(3)+')';
  glassReflectionCtx.fillRect(12+i*17,0,1,256);
}
const glassReflectionTexture=new THREE.CanvasTexture(glassReflectionCanvas);
glassReflectionTexture.colorSpace=THREE.SRGBColorSpace;
glassReflectionTexture.wrapS=THREE.RepeatWrapping;
glassReflectionTexture.wrapT=THREE.ClampToEdgeWrapping;
glassReflectionTexture.repeat.set(2.2,1);
glassReflectionTexture.anisotropy=8;

const streetBannerCanvas=document.createElement('canvas');
streetBannerCanvas.width=256;
streetBannerCanvas.height=512;
const streetBannerCtx=streetBannerCanvas.getContext('2d');
const bannerGrad=streetBannerCtx.createLinearGradient(0,0,0,512);
bannerGrad.addColorStop(0,'#496b78');
bannerGrad.addColorStop(.52,'#6f8f91');
bannerGrad.addColorStop(1,'#a98268');
streetBannerCtx.fillStyle=bannerGrad;
streetBannerCtx.fillRect(0,0,256,512);
streetBannerCtx.fillStyle='rgba(255,255,255,.10)';
streetBannerCtx.fillRect(28,24,200,2);
streetBannerCtx.fillRect(28,486,200,2);
streetBannerCtx.fillStyle='#f5f0e6';
streetBannerCtx.font='700 48px Inter, sans-serif';
streetBannerCtx.textAlign='center';
streetBannerCtx.fillText('NOVA',128,226);
streetBannerCtx.font='500 22px Inter, sans-serif';
streetBannerCtx.fillStyle='rgba(245,240,230,.82)';
streetBannerCtx.fillText('CITY WALK',128,264);
streetBannerCtx.fillStyle='rgba(245,240,230,.28)';
streetBannerCtx.beginPath();
streetBannerCtx.arc(128,335,52,0,Math.PI*2);
streetBannerCtx.strokeStyle='rgba(245,240,230,.42)';
streetBannerCtx.lineWidth=3;
streetBannerCtx.stroke();
streetBannerCtx.beginPath();
streetBannerCtx.arc(128,335,9,0,Math.PI*2);
streetBannerCtx.fill();
const streetBannerTexture=new THREE.CanvasTexture(streetBannerCanvas);
streetBannerTexture.colorSpace=THREE.SRGBColorSpace;
streetBannerTexture.anisotropy=8;

function box(w, h, d, color, x, y, z, roughness=.72, metalness=.02) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({ color, roughness, metalness })
  );
  mesh.position.set(x,y,z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function plane(w,h,color,x,y,z,rx=-Math.PI/2,ry=0,rz=0,roughness=.9){
  const mesh=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshStandardMaterial({color,roughness,metalness:0,side:THREE.DoubleSide})
  );
  mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,rz);
  mesh.receiveShadow=true;
  scene.add(mesh);
  return mesh;
}

function glassPanel(w,h,x,y,z,ry=-Math.PI/2,tint=0x9fc7d6){
  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshPhysicalMaterial({
      color:tint,
      map:glassReflectionTexture,
      roughness:.22,
      metalness:.06,
      transparent:true,
      opacity:.50,
      transmission:.08,
      clearcoat:.24,
      clearcoatRoughness:.34,
      side:THREE.DoubleSide
    })
  );
  panel.position.set(x,y,z);
  panel.rotation.y=ry;
  panel.receiveShadow=true;
  scene.add(panel);
  return panel;
}

const dappleCanvas=document.createElement('canvas');
dappleCanvas.width=512;
dappleCanvas.height=512;
const dappleCtx=dappleCanvas.getContext('2d');
dappleCtx.clearRect(0,0,512,512);
for(let i=0;i<120;i++){
  const x=40+Math.random()*432;
  const y=40+Math.random()*432;
  const rx=9+Math.random()*24;
  const ry=5+Math.random()*15;
  dappleCtx.save();
  dappleCtx.translate(x,y);
  dappleCtx.rotate(Math.random()*Math.PI);
  const a=.018+Math.random()*.026;
  dappleCtx.fillStyle='rgba(47,66,48,'+a.toFixed(3)+')';
  dappleCtx.beginPath();
  dappleCtx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  dappleCtx.fill();
  dappleCtx.restore();
}
const dappleTexture=new THREE.CanvasTexture(dappleCanvas);
dappleTexture.colorSpace=THREE.SRGBColorSpace;
dappleTexture.anisotropy=8;

function createDapplePatch(x,z,w,d,rotation=0,opacity=.72){
  const patch=new THREE.Mesh(
    new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({
      map:dappleTexture,
      transparent:true,
      opacity,
      depthWrite:false,
      toneMapped:false
    })
  );
  patch.rotation.x=-Math.PI/2;
  patch.rotation.z=rotation;
  patch.position.set(x,.052,z);
  scene.add(patch);
  return patch;
}

// ---------- daytime city block ----------
// Ground is deliberately split into road, curb and pedestrian zones so the
// player immediately reads this as a real street rather than a generic floor.
const cityGround=plane(52,92,0xc7c4b9,0,-.045,-4);
cityGround.material.map=pavementTexture;
cityGround.material.color.set(0xbebbb1);
cityGround.material.needsUpdate=true;

const road=plane(15,92,0xffffff,-6.7,.004,-4);
road.material.map=asphaltTexture;
road.material.roughness=.96;
road.material.needsUpdate=true;

const sidewalk=plane(10.8,92,0xffffff,4.2,.014,-4);
sidewalk.material.map=pavementTexture;
sidewalk.material.roughness=.93;
sidewalk.material.needsUpdate=true;

const curb=box(.30,.18,92,0xb8b4a8,.05,.08,-4,.92);
const curbCap=box(.09,.035,92,0xe7e2d6,.18,.185,-4,.86);

// Fine sidewalk seams add scale without relying on image textures.
const seamMat=new THREE.MeshBasicMaterial({color:0xb7b4aa,transparent:true,opacity:.34,depthWrite:false});
for(let z=-44;z<=40;z+=2.35){
  const seam=new THREE.Mesh(new THREE.PlaneGeometry(9.9,.018),seamMat);
  seam.rotation.x=-Math.PI/2;
  seam.position.set(4.75,.031,z);
  scene.add(seam);
}
for(let x=.8;x<=8.6;x+=1.95){
  const seam=new THREE.Mesh(new THREE.PlaneGeometry(.018,84),seamMat);
  seam.rotation.x=-Math.PI/2;
  seam.position.set(x,.032,-4);
  scene.add(seam);
}

// Tactile strip and quiet pavement variation make the foreground read much
// closer to a real pedestrian street without introducing external textures.
const tactileMat=new THREE.MeshStandardMaterial({color:0xd4bd72,roughness:.90});
const tactile=new THREE.Mesh(new THREE.PlaneGeometry(.34,82),tactileMat);
tactile.rotation.x=-Math.PI/2;
tactile.position.set(.78,.038,-4);
tactile.receiveShadow=true;
scene.add(tactile);

const patchMat=new THREE.MeshBasicMaterial({
  color:0xffffff,
  transparent:true,
  opacity:.035,
  depthWrite:false
});
[
  [3.1,-13.4,2.8,.75],
  [6.4,-5.8,1.6,.55],
  [3.8,6.2,2.1,.65],
  [6.7,14.6,1.8,.50]
].forEach(([x,z,w,h])=>{
  const patch=new THREE.Mesh(new THREE.PlaneGeometry(w,h),patchMat);
  patch.rotation.x=-Math.PI/2;
  patch.position.set(x,.039,z);
  scene.add(patch);
});

// Road lane markings and a distant crossing make the street continue beyond
// the playable slice.
const stripeMat=new THREE.MeshBasicMaterial({color:0xe8e8dc,transparent:true,opacity:.82});
for(let z=-40;z<40;z+=5.8){
  const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.13,2.9),stripeMat);
  stripe.rotation.x=-Math.PI/2;
  stripe.position.set(-6.5,.022,z);
  scene.add(stripe);
}
const edgeLine=new THREE.Mesh(new THREE.PlaneGeometry(.11,86),new THREE.MeshBasicMaterial({color:0xe7d46b}));
edgeLine.rotation.x=-Math.PI/2;
edgeLine.position.set(-.45,.025,-4);
scene.add(edgeLine);

const focalCurbMark=new THREE.Mesh(
  new THREE.PlaneGeometry(.13,5.4),
  new THREE.MeshBasicMaterial({color:0xe5d179,transparent:true,opacity:.92})
);
focalCurbMark.rotation.x=-Math.PI/2;
focalCurbMark.position.set(-.28,.030,-1.55);
scene.add(focalCurbMark);

for(let x=-12.6;x<-1.0;x+=1.45){
  const cross=new THREE.Mesh(new THREE.PlaneGeometry(.62,3.1),stripeMat);
  cross.rotation.x=-Math.PI/2;
  cross.position.set(x,.024,-17.2);
  scene.add(cross);
}

// Street-facing buildings: warm stone + glass + shaded shopfronts.
const rightFacade=box(3.4,7.6,66,0xd8d2c5,10.15,3.75,-5,.76);
rightFacade.castShadow=false;

[1.08,3.04,5.02,6.92].forEach((y,i)=>{
  const band=box(
    .20,
    i===0?.24:.12,
    65.4,
    i===0?0xb8afa1:0xc5c0b7,
    8.56,
    y,
    -5,
    .72
  );
  band.castShadow=true;
});

for(let z=-31;z<=24;z+=7.2){
  const bay=box(.42,5.6,5.35,0xbab6ad,8.64,3.22,z,.62);
  bay.castShadow=false;

  const glass=glassPanel(5.0,4.65,8.41,3.35,z,-Math.PI/2,0xaed1df);
  glass.material.opacity=.42;

  // Mullions prevent large glazing bays from reading as flat placeholder planes.
  [-1.62,0,1.62].forEach(offset=>{
    const mullion=box(.045,4.62,.035,0x788589,8.35,3.35,z+offset,.42,.34);
    mullion.castShadow=false;
  });
  [2.05,3.35,4.65].forEach(y=>{
    const mullion=box(.045,.035,4.96,0x7f8c90,8.35,y,z,.42,.34);
    mullion.castShadow=false;
  });

  // dark sill + pale canopy creates the cafe / mixed-use street rhythm.
  box(.38,.16,5.2,0x565c5d,8.34,.62,z,.55,.18);
  const canopy=box(1.15,.12,5.35,0xe9e0cf,7.95,3.02,z,.66);
  canopy.castShadow=true;

  const ledge=box(.28,.07,5.05,0xcfc9bd,8.18,5.70,z,.74);
  ledge.castShadow=true;
}

// A few recessed ground-floor entries keep the frontage from feeling like one
// repeated office wall.
[-18.8,-10.6,13.8].forEach((z,i)=>{
  const inset=box(.72,2.55,4.3,[0xa99b89,0x9daaa8,0xb3a08c][i],8.10,1.31,z,.72);
  inset.castShadow=false;

  const door=glassPanel(2.10,2.22,7.72,1.34,z,-Math.PI/2,0xa8c4c7);
  door.material.opacity=.56;

  const step=box(.92,.10,3.65,0xc5beb0,7.58,.08,z,.88);
  step.castShadow=true;
});

// Ground-floor cafe corner.
const cafeFrame=box(.48,3.0,8.5,0xb49778,8.33,1.55,4.8,.68);
cafeFrame.castShadow=false;
const cafeGlass=glassPanel(7.75,2.55,8.05,1.62,4.8,-Math.PI/2,0x9fc8cf);
cafeGlass.material.opacity=.58;

const signCanvas=document.createElement('canvas');
signCanvas.width=512;
signCanvas.height=128;
const signCtx=signCanvas.getContext('2d');
signCtx.fillStyle='#efe8dc';
signCtx.fillRect(0,0,512,128);
signCtx.fillStyle='#4e463d';
signCtx.font='600 54px Inter, sans-serif';
signCtx.textAlign='center';
signCtx.textBaseline='middle';
signCtx.fillText('NOVA CAFÉ',256,65);
const signTexture=new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace=THREE.SRGBColorSpace;
const cafeSign=new THREE.Mesh(
  new THREE.PlaneGeometry(3.35,.84),
  new THREE.MeshBasicMaterial({map:signTexture,toneMapped:false})
);
cafeSign.position.set(7.77,3.48,4.8);
cafeSign.rotation.y=-Math.PI/2;
scene.add(cafeSign);

const cafeAwning=new THREE.Mesh(
  new THREE.BoxGeometry(1.55,.10,5.2),
  new THREE.MeshStandardMaterial({color:0xd8a77f,roughness:.72})
);
cafeAwning.position.set(7.58,2.78,4.8);
cafeAwning.rotation.z=-.08;
cafeAwning.castShadow=true;
scene.add(cafeAwning);

const cafeInteriorMat=new THREE.MeshStandardMaterial({
  color:0xf0c38f,
  emissive:0xc8783a,
  emissiveIntensity:.10,
  roughness:.82
});
for(let z=2.4;z<=7.2;z+=2.4){
  const pendant=new THREE.Mesh(new THREE.SphereGeometry(.10,12,8),cafeInteriorMat);
  pendant.position.set(7.72,2.05,z);
  scene.add(pendant);
}

// Buildings across the road give the boulevard depth but stay light enough for
// the AI character to remain the visual focus.
const farBuildingColors=[0xd2d5d2,0xc5d0d3,0xe1d7ca,0xbfc9cc];
for(let i=0;i<10;i++){
  const z=-36+i*8.3;
  const h=5.2+(i%4)*1.6;
  const b=box(3.8,h,6.4,farBuildingColors[i%farBuildingColors.length],-15.2,h/2-.02,z,.72);
  b.castShadow=false;

  for(let level=.9;level<h-.6;level+=1.22){
    const windowTone=(Math.floor(level*10)+i)%3;
    const win=new THREE.Mesh(
      new THREE.PlaneGeometry(3.45,.66),
      new THREE.MeshStandardMaterial({
        color:[0x91aeb8,0x9bb8c0,0x86a3ad][windowTone],
        roughness:.30,
        metalness:.10
      })
    );
    win.position.set(-13.27,level,z);
    win.rotation.y=Math.PI/2;
    scene.add(win);
  }
}

// Soft skyline silhouettes keep the horizon bright and city-like.
for(let i=0;i<9;i++){
  const h=9+(i%5)*2.4;
  const tower=box(5.0,h,5.0,[0xaebbc1,0xc0c8c8,0x9fafb6][i%3],-19-i*1.3,h/2,-36+i*8.8,.82);
  tower.castShadow=false;
}

// Trees, planters and street furniture make this feel like somewhere Mira
// actually spends time instead of a sterile tech showcase.
const streetTreeCrowns=[];
function createStreetTree(x,z,scale=1){
  const pit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.18*scale,1.18*scale),
    new THREE.MeshStandardMaterial({color:0x7f715d,roughness:1})
  );
  pit.rotation.x=-Math.PI/2;
  pit.position.set(x,.041,z);
  pit.receiveShadow=true;
  scene.add(pit);

  const grate=new THREE.Mesh(
    new THREE.RingGeometry(.32*scale,.50*scale,20),
    new THREE.MeshStandardMaterial({color:0x4f5b59,roughness:.62,metalness:.42,side:THREE.DoubleSide})
  );
  grate.rotation.x=-Math.PI/2;
  grate.position.set(x,.046,z);
  scene.add(grate);

  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.13*scale,.18*scale,2.3*scale,12),
    new THREE.MeshStandardMaterial({color:0x80654f,roughness:.95})
  );
  trunk.position.set(x,1.15*scale,z);
  trunk.castShadow=true;
  scene.add(trunk);

  const crown=new THREE.Group();
  const leafMats=[
    new THREE.MeshStandardMaterial({color:0x6f9c65,roughness:.92}),
    new THREE.MeshStandardMaterial({color:0x7eaa72,roughness:.90}),
    new THREE.MeshStandardMaterial({color:0x628c5e,roughness:.94})
  ];
  [
    [0,0,0,1.02],
    [-.42,.03,.10,.72],
    [.38,.10,-.05,.78],
    [0,.35,.04,.70]
  ].forEach(([ox,oy,oz,r],index)=>{
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,2),leafMats[index%leafMats.length]);
    leaf.position.set(ox*scale,oy*scale,oz*scale);
    leaf.castShadow=true;
    leaf.receiveShadow=true;
    crown.add(leaf);
  });
  crown.position.set(x,2.72*scale,z);
  scene.add(crown);
  streetTreeCrowns.push(crown);
}

[-13,-4.8,4.2,13.2].forEach((z,i)=>createStreetTree(1.0,z,i%2?.94:1.04));
[-18,0,18].forEach((z,i)=>createStreetTree(-12.1,z,.88+i*.04));

function createPlanter(x,z,w=1.8){
  box(w,.42,.72,0xb7aa95,x,.22,z,.90);
  const greenMat=new THREE.MeshStandardMaterial({color:0x6f9e65,roughness:.95});
  for(let i=0;i<5;i++){
    const shrub=new THREE.Mesh(new THREE.SphereGeometry(.24+(i%2)*.05,12,9),greenMat);
    shrub.scale.set(1.2,.82,1);
    shrub.position.set(x-w*.35+i*(w*.70/4),.55,z);
    shrub.castShadow=true;
    scene.add(shrub);
  }
}
createPlanter(6.6,-8.3,2.2);
createPlanter(6.6,11.8,2.5);

const lowHedgeMat=new THREE.MeshStandardMaterial({color:0x78956e,roughness:.96});
const hedgeBed=box(3.6,.22,.82,0xaa9d88,5.65,.11,-13.0,.94);
hedgeBed.castShadow=false;
for(let i=0;i<9;i++){
  const shrub=new THREE.Mesh(new THREE.SphereGeometry(.24+(i%3)*.025,12,9),lowHedgeMat);
  shrub.scale.set(1.12,.72,1);
  shrub.position.set(4.20+i*.36,.43,-13.0+(i%2)*.05);
  shrub.castShadow=true;
  scene.add(shrub);
}

const accentFlowerMats=[
  new THREE.MeshStandardMaterial({color:0xf1eee3,roughness:.82}),
  new THREE.MeshStandardMaterial({color:0xd9c3c7,roughness:.82}),
  new THREE.MeshStandardMaterial({color:0xb8c7df,roughness:.82})
];
for(let i=0;i<18;i++){
  const bloom=new THREE.Mesh(
    new THREE.SphereGeometry(.035+(i%3)*.006,8,6),
    accentFlowerMats[i%accentFlowerMats.length]
  );
  bloom.position.set(4.15+i*.20,.63+((i%4)*.015),-12.72-(i%2)*.10);
  scene.add(bloom);
}

// ---------- Mira street pocket ----------
// A warmer paving inset, curb ramp and low seat-wall create a human-scale
// "home spot" in the street composition without changing Mira herself.
const miraPocket=new THREE.Mesh(
  new THREE.PlaneGeometry(5.35,5.15),
  new THREE.MeshStandardMaterial({color:0xddd6c8,roughness:.95})
);
miraPocket.rotation.x=-Math.PI/2;
miraPocket.position.set(3.75,.044,-1.55);
miraPocket.receiveShadow=true;
scene.add(miraPocket);

const pocketLineMat=new THREE.MeshBasicMaterial({
  color:0xbdb4a6,
  transparent:true,
  opacity:.44,
  depthWrite:false
});
for(let i=-2;i<=2;i++){
  const line=new THREE.Mesh(new THREE.PlaneGeometry(.018,5.02),pocketLineMat);
  line.rotation.x=-Math.PI/2;
  line.position.set(3.75+i*.92,.050,-1.55);
  scene.add(line);
}
for(let i=-2;i<=2;i++){
  const line=new THREE.Mesh(new THREE.PlaneGeometry(5.20,.018),pocketLineMat);
  line.rotation.x=-Math.PI/2;
  line.position.set(3.75,.051,-1.55+i*.88);
  scene.add(line);
}

const pocketBorderMat=new THREE.MeshStandardMaterial({color:0xb8ad9d,roughness:.90});
[
  [3.75,.045,-4.10,5.45,.08],
  [3.75,.045,1.00,5.45,.08]
].forEach(([x,y,z,w,d])=>{
  const border=new THREE.Mesh(new THREE.BoxGeometry(w,.035,d),pocketBorderMat);
  border.position.set(x,y,z);
  border.receiveShadow=true;
  scene.add(border);
});

// Curb ramp visually ties Mira's pocket to the street and gives the sidewalk a
// practical urban detail at the exact focal area.
const ramp=new THREE.Mesh(
  new THREE.PlaneGeometry(1.35,1.55),
  new THREE.MeshStandardMaterial({color:0xcec8bb,roughness:.94})
);
ramp.rotation.x=-Math.PI/2;
ramp.position.set(.76,.050,-1.55);
scene.add(ramp);

const dotMat=new THREE.MeshStandardMaterial({color:0xcaa95c,roughness:.90});
for(let dz=-.48;dz<=.48;dz+=.24){
  for(let dx=-.42;dx<=.42;dx+=.21){
    const dot=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.012,10),dotMat);
    dot.position.set(.76+dx,.061,-1.55+dz);
    scene.add(dot);
  }
}

const seatStone=new THREE.MeshStandardMaterial({color:0xc0b6a6,roughness:.92});
const pocketSeat=new THREE.Mesh(new THREE.BoxGeometry(2.35,.34,.48),seatStone);
pocketSeat.position.set(6.25,.20,-1.70);
pocketSeat.castShadow=true;
pocketSeat.receiveShadow=true;
scene.add(pocketSeat);

const pocketPlanter=new THREE.Mesh(new THREE.BoxGeometry(2.55,.52,.62),seatStone);
pocketPlanter.position.set(6.25,.27,-2.27);
pocketPlanter.castShadow=true;
scene.add(pocketPlanter);

const pocketGreenMats=[
  new THREE.MeshStandardMaterial({color:0x789a70,roughness:.95}),
  new THREE.MeshStandardMaterial({color:0x86a879,roughness:.94})
];
for(let i=0;i<7;i++){
  const shrub=new THREE.Mesh(
    new THREE.SphereGeometry(.25+(i%2)*.035,12,9),
    pocketGreenMats[i%2]
  );
  shrub.scale.set(1.05,.74,.90);
  shrub.position.set(5.30+i*.31,.66,-2.27+(i%2)*.035);
  shrub.castShadow=true;
  scene.add(shrub);
}

// Drainage slots and dappled tree shade add foreground realism where the player
// spends the most time.
const drainMat=new THREE.MeshStandardMaterial({color:0x59615f,roughness:.60,metalness:.48});
for(let i=0;i<7;i++){
  const slot=new THREE.Mesh(new THREE.BoxGeometry(.045,.018,.30),drainMat);
  slot.position.set(-.02,.065,-2.25+i*.24);
  slot.castShadow=false;
  scene.add(slot);
}

createDapplePatch(2.15,-2.10,4.3,5.1,-.10,.82);
createDapplePatch(4.75,5.15,3.8,4.4,.16,.62);

function createLampPost(x,z){
  const metal=new THREE.MeshStandardMaterial({color:0x3f494b,roughness:.48,metalness:.62});
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.055,3.2,10),metal);
  pole.position.set(x,1.6,z);
  pole.castShadow=true;
  scene.add(pole);

  const arm=new THREE.Mesh(new THREE.BoxGeometry(.65,.055,.055),metal);
  arm.position.set(x-.27,3.16,z);
  scene.add(arm);

  const lamp=new THREE.Mesh(
    new THREE.BoxGeometry(.34,.11,.18),
    new THREE.MeshStandardMaterial({color:0xe9efe6,roughness:.34,emissive:0xe9efe6,emissiveIntensity:.06})
  );
  lamp.position.set(x-.59,3.11,z);
  scene.add(lamp);

  const banner=new THREE.Mesh(
    new THREE.PlaneGeometry(.48,.96),
    new THREE.MeshBasicMaterial({
      map:streetBannerTexture,
      transparent:true,
      side:THREE.DoubleSide,
      toneMapped:false
    })
  );
  banner.position.set(x+.15,2.55,z);
  banner.rotation.y=Math.PI/2;
  scene.add(banner);
}
[-11,2,15].forEach(z=>createLampPost(.45,z));

// A bench and bike rack near the cafe create readable points of interest for
// future Scanner/Map interactions.
const benchWood=new THREE.MeshStandardMaterial({color:0x9b795d,roughness:.82});
const benchMetal=new THREE.MeshStandardMaterial({color:0x454d4e,roughness:.55,metalness:.45});
const benchSeat=new THREE.Mesh(new THREE.BoxGeometry(1.75,.10,.48),benchWood);
benchSeat.position.set(5.1,.54,1.9);benchSeat.castShadow=true;scene.add(benchSeat);
const benchBack=new THREE.Mesh(new THREE.BoxGeometry(1.75,.48,.08),benchWood);
benchBack.position.set(5.1,.82,2.10);benchBack.rotation.x=-.12;benchBack.castShadow=true;scene.add(benchBack);
[-.70,.70].forEach(offset=>{
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.52,.08),benchMetal);
  leg.position.set(5.1+offset,.27,1.9);leg.castShadow=true;scene.add(leg);
});

for(let i=0;i<3;i++){
  const rack=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,8,24,Math.PI),benchMetal);
  rack.rotation.x=Math.PI/2;
  rack.rotation.z=Math.PI/2;
  rack.position.set(6.0+i*.55,.35,-2.6);
  rack.castShadow=true;
  scene.add(rack);
}

// Small outdoor cafe setup turns the building edge into a believable place,
// not just a facade.
function createCafeTable(x,z){
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.055,24),benchWood);
  top.position.set(x,.72,z);
  top.castShadow=true;
  scene.add(top);

  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.68,10),benchMetal);
  stem.position.set(x,.36,z);
  stem.castShadow=true;
  scene.add(stem);

  [-.52,.52].forEach(side=>{
    const seat=new THREE.Mesh(new THREE.BoxGeometry(.34,.055,.34),benchWood);
    seat.position.set(x+side,.46,z);
    seat.castShadow=true;
    scene.add(seat);

    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.43,8),benchMetal);
    leg.position.set(x+side,.23,z);
    leg.castShadow=true;
    scene.add(leg);
  });
}
createCafeTable(5.9,5.7);
createCafeTable(5.9,8.2);

const cupMat=new THREE.MeshStandardMaterial({color:0xf0ece2,roughness:.72});
[
  [5.78,.78,5.64],
  [6.02,.78,8.12]
].forEach(([x,y,z])=>{
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.055,.045,.10,12),cupMat);
  cup.position.set(x,y,z);
  cup.castShadow=true;
  scene.add(cup);
});

[-9.5,-6.5,8.7].forEach(z=>{
  const bollard=new THREE.Mesh(
    new THREE.CylinderGeometry(.065,.075,.72,12),
    new THREE.MeshStandardMaterial({color:0x596266,roughness:.50,metalness:.48})
  );
  bollard.position.set(.35,.36,z);
  bollard.castShadow=true;
  scene.add(bollard);
});

const bin=new THREE.Mesh(
  new THREE.CylinderGeometry(.20,.23,.72,14),
  new THREE.MeshStandardMaterial({color:0x4f5a58,roughness:.66,metalness:.22})
);
bin.position.set(6.85,.36,-.2);
bin.castShadow=true;
scene.add(bin);

function createContactShadow(x,z,w,d,opacity=.10){
  const c=document.createElement('canvas');
  c.width=128;
  c.height=128;
  const g=c.getContext('2d');
  const gradient=g.createRadialGradient(64,64,8,64,64,62);
  gradient.addColorStop(0,'rgba(0,0,0,'+opacity.toFixed(3)+')');
  gradient.addColorStop(.58,'rgba(0,0,0,'+(opacity*.48).toFixed(3)+')');
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gradient;
  g.fillRect(0,0,128,128);

  const texture=new THREE.CanvasTexture(c);
  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true,
      depthWrite:false,
      toneMapped:false
    })
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.position.set(x,.047,z);
  scene.add(shadow);
  return shadow;
}

function createParkedCar(x,z,color){
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.40,metalness:.18});
  const glassMat=new THREE.MeshStandardMaterial({color:0x58727b,roughness:.18,metalness:.30});
  const rubberMat=new THREE.MeshStandardMaterial({color:0x232629,roughness:.88});

  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.62,.42,3.30),bodyMat);
  body.position.y=.45;
  body.castShadow=true;
  body.receiveShadow=true;
  group.add(body);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.40,.48,1.72),glassMat);
  cabin.position.set(0,.84,-.12);
  cabin.castShadow=true;
  group.add(cabin);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.48,.15,.82),bodyMat);
  hood.position.set(0,.68,1.18);
  hood.castShadow=true;
  group.add(hood);

  [-.86,.86].forEach(wx=>{
    [-1.04,1.04].forEach(wz=>{
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.25,.25,.14,18),rubberMat);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(wx,.27,wz);
      wheel.castShadow=true;
      group.add(wheel);
    });
  });

  group.position.set(x,0,z);
  scene.add(group);
  return group;
}
createParkedCar(-3.55,-8.5,0x8fa0aa);
createContactShadow(-3.55,-8.5,2.0,3.8,.13);
createParkedCar(-3.55,8.1,0xc7b8a6);
createContactShadow(-3.55,8.1,2.0,3.8,.13);
createContactShadow(5.1,1.95,2.05,.85,.085);
createContactShadow(5.9,5.7,1.65,1.12,.075);
createContactShadow(5.9,8.2,1.65,1.12,.075);

const movingTraffic=[];
function createTrafficCar(x,z,color,speed){
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.44,metalness:.16});
  const glassMat=new THREE.MeshStandardMaterial({color:0x607b84,roughness:.22,metalness:.22});
  const group=new THREE.Group();

  const body=new THREE.Mesh(new THREE.BoxGeometry(1.46,.34,2.72),bodyMat);
  body.position.y=.40;
  body.castShadow=true;
  group.add(body);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.24,.40,1.28),glassMat);
  cabin.position.set(0,.72,-.12);
  cabin.castShadow=true;
  group.add(cabin);

  group.position.set(x,0,z);
  scene.add(group);
  movingTraffic.push({group,speed});
}

createTrafficCar(-9.2,-28,0xd4d0c7,2.15);
createTrafficCar(-5.9,27,0x7c929d,-1.72);

const storefrontShade=new THREE.Mesh(
  new THREE.PlaneGeometry(1.95,64),
  new THREE.MeshBasicMaterial({
    color:0x806f61,
    transparent:true,
    opacity:.045,
    depthWrite:false
  })
);
storefrontShade.rotation.x=-Math.PI/2;
storefrontShade.position.set(7.65,.048,-5);
scene.add(storefrontShade);

// Small flower dots keep the palette warm without becoming decorative noise.
const flowerMat=new THREE.MeshStandardMaterial({color:0xf0eee2,roughness:.8});
for(let i=0;i<14;i++){
  const bloom=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),flowerMat);
  bloom.position.set(
    6.0+(i%7)*.22,
    .73+(i%3)*.035,
    -8.55+Math.floor(i/7)*.32
  );
  scene.add(bloom);
}

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

mira.position.set(2.0,0,-1.6);
mira.rotation.y=-.16;
mira.scale.setScalar(1.02);
scene.add(mira);

const miraBeaconCanvas=document.createElement('canvas');
miraBeaconCanvas.width=192;
miraBeaconCanvas.height=192;
const miraBeaconCtx=miraBeaconCanvas.getContext('2d');
miraBeaconCtx.clearRect(0,0,192,192);
miraBeaconCtx.strokeStyle='rgba(255,177,189,.95)';
miraBeaconCtx.lineWidth=7;
miraBeaconCtx.beginPath();
miraBeaconCtx.arc(96,78,48,0,Math.PI*2);
miraBeaconCtx.stroke();
miraBeaconCtx.fillStyle='rgba(255,177,189,.16)';
miraBeaconCtx.beginPath();
miraBeaconCtx.arc(96,78,39,0,Math.PI*2);
miraBeaconCtx.fill();
miraBeaconCtx.fillStyle='#ffd5dc';
miraBeaconCtx.font='bold 22px sans-serif';
miraBeaconCtx.textAlign='center';
miraBeaconCtx.fillText('MIRA',96,156);

const miraBeaconTexture=new THREE.CanvasTexture(miraBeaconCanvas);
miraBeaconTexture.colorSpace=THREE.SRGBColorSpace;
const miraBeaconMaterial=new THREE.SpriteMaterial({
  map:miraBeaconTexture,
  transparent:true,
  depthTest:false,
  depthWrite:false,
  opacity:0
});
const miraBeacon=new THREE.Sprite(miraBeaconMaterial);
miraBeacon.position.set(0,2.52,0);
miraBeacon.scale.set(.72,.72,1);
miraBeacon.visible=false;
mira.add(miraBeacon);

let miraBeaconUntil=0;
let miraReplyMotionUntil=0;

window.addEventListener('tablet-map-focus',event=>{
  if(event.detail?.target!=='mira') return;
  miraBeacon.visible=true;
  miraBeaconUntil=performance.now()+4500;
});

window.addEventListener('tablet-message-reply',()=>{
  miraReplyMotionUntil=performance.now()+1200;
});

// ---------- player controls ----------
const keys = new Set();
let yaw=0, pitch=0, targetYaw=0, targetPitch=0, turnImpulse=0;
let tabletOpen=false, started=false;
const velocity=new THREE.Vector3();
const dir=new THREE.Vector3();
const baseEyeHeight=1.68;
const worldBounds={xMin:-6.3,xMax:7.15,zMin:-18,zMax:19};

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
  cameraFovTarget=69.5;
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

  tabletOpen=false; cameraFovTarget=72.5;
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
    camera.position.x=THREE.MathUtils.clamp(camera.position.x,worldBounds.xMin,worldBounds.xMax);
    camera.position.z=THREE.MathUtils.clamp(camera.position.z,worldBounds.zMin,worldBounds.zMax);
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

  streetTreeCrowns.forEach((crown,i)=>{
    crown.rotation.z=Math.sin(t*.34+i*.9)*.006;
    crown.rotation.x=Math.sin(t*.27+i*1.4)*.004;
  });
  dappleTexture.offset.x=Math.sin(t*.075)*.003;
  dappleTexture.offset.y=Math.cos(t*.061)*.002;
  sunHaze.material.opacity=.80+Math.sin(t*.11)*.018;
  sun.intensity=3.16+Math.sin(t*.045)*.035;

  movingTraffic.forEach((traffic,index)=>{
    traffic.group.position.z+=traffic.speed*dt;
    if(traffic.speed>0 && traffic.group.position.z>38) traffic.group.position.z=-38-index*5;
    if(traffic.speed<0 && traffic.group.position.z<-38) traffic.group.position.z=38+index*5;
  });

  // Human idle: breathing, tiny weight shift and occasional attention toward player.
  const idleBreath=Math.sin(t*1.55);
  torso.scale.y=1+idleBreath*.009;
  torso.position.y=1.25+idleBreath*.004;
  miraRig.position.y=Math.sin(t*.72)*.003;
  miraRig.rotation.z=Math.sin(t*.48)*.006;
  head.rotation.y=Math.sin(t*.31)*.07;
  const replyRemaining=Math.max(0,miraReplyMotionUntil-performance.now());
  const replyEnvelope=Math.min(1,replyRemaining/280, (1200-replyRemaining)/220);
  const replyNod=replyRemaining>0 ? Math.sin((1200-replyRemaining)*.022)*.055*Math.max(0,replyEnvelope) : 0;
  head.rotation.x=Math.sin(t*.43)*.018+replyNod;

  if(miraBeacon.visible){
    const remaining=miraBeaconUntil-performance.now();
    if(remaining<=0){
      miraBeacon.visible=false;
      miraBeaconMaterial.opacity=0;
    }else{
      const fade=Math.min(1,remaining/550);
      const pulse=.72+Math.sin(t*4.5)*.055;
      miraBeacon.scale.set(pulse,pulse,1);
      miraBeaconMaterial.opacity=.72*fade;
    }
  }

  lFore.rotation.x=-.05+Math.sin(t*.62)*.012;
  rFore.rotation.x=-.05-Math.sin(t*.62)*.012;

  tablet3D?.render(t,tabletOpen);
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);tablet3D?.resize();});
