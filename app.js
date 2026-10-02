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
scene.background = new THREE.Color(0xd4e7ef);
scene.fog = new THREE.Fog(0xe2e9e4, 27, 80);

const skyCanvas=document.createElement('canvas');
skyCanvas.width=32;
skyCanvas.height=512;
const skyCtx=skyCanvas.getContext('2d');
const skyGradient=skyCtx.createLinearGradient(0,0,0,512);
skyGradient.addColorStop(0,'#98cbe5');
skyGradient.addColorStop(.38,'#c5dfeb');
skyGradient.addColorStop(.72,'#eef0e8');
skyGradient.addColorStop(1,'#f6ecdc');
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
  depthTest:true,
  depthWrite:false,
  toneMapped:false,
  opacity:.84
}));
sunHaze.position.set(-34,34,-46);
sunHaze.scale.set(18,18,1);
scene.add(sunHaze);

const cloudCanvas=document.createElement('canvas');
cloudCanvas.width=512;
cloudCanvas.height=256;
const cloudCtx=cloudCanvas.getContext('2d');
cloudCtx.clearRect(0,0,512,256);
[
  [150,132,82,42,.30],
  [228,112,104,56,.28],
  [320,136,78,39,.24],
  [260,154,126,38,.20]
].forEach(([x,y,rx,ry,a])=>{
  const g=cloudCtx.createRadialGradient(x,y,8,x,y,rx);
  g.addColorStop(0,'rgba(255,255,255,'+a.toFixed(2)+')');
  g.addColorStop(.52,'rgba(255,255,255,'+(a*.68).toFixed(2)+')');
  g.addColorStop(1,'rgba(255,255,255,0)');
  cloudCtx.fillStyle=g;
  cloudCtx.save();
  cloudCtx.translate(x,y);
  cloudCtx.scale(1,ry/rx);
  cloudCtx.beginPath();
  cloudCtx.arc(0,0,rx,0,Math.PI*2);
  cloudCtx.fill();
  cloudCtx.restore();
});
const cloudTexture=new THREE.CanvasTexture(cloudCanvas);
cloudTexture.colorSpace=THREE.SRGBColorSpace;
const skyClouds=[];
[
  [-22,18,-52,20,10,.24],
  [18,15,-64,26,12,.18],
  [34,20,-78,22,10,.14]
].forEach(([x,y,z,w,h,opacity])=>{
  const cloud=new THREE.Sprite(new THREE.SpriteMaterial({
    map:cloudTexture,
    transparent:true,
    depthWrite:false,
    toneMapped:false,
    opacity
  }));
  cloud.position.set(x,y,z);
  cloud.scale.set(w,h,1);
  scene.add(cloud);
  skyClouds.push(cloud);
});

const camera = new THREE.PerspectiveCamera(69.5, window.innerWidth / window.innerHeight, 0.08, 120);
camera.position.set(1.15, 1.68, 7.05);
camera.rotation.order = 'YXZ';

// A slightly wider field of view + subtle camera inertia makes the flat-screen
// prototype feel closer to looking through a headset without requiring WebXR.
let cameraFovTarget = 69.5;

// ---------- daylight ----------
renderer.toneMappingExposure = 1.02;

const skyLight = new THREE.HemisphereLight(0xeaf5f7, 0xb9ad98, 1.62);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xfff2dc, 3.05);
sun.position.set(-11, 15, 10);
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

const daylightFill = new THREE.DirectionalLight(0xd4e3ed, .46);
daylightFill.position.set(10, 8, -12);
scene.add(daylightFill);

const shopBounce = new THREE.DirectionalLight(0xffe5c9, .18);
shopBounce.position.set(9,5,6);
scene.add(shopBounce);

const faceLight = new THREE.SpotLight(0xffe7d2, 7.2, 9, Math.PI * .22, .76, 1.5);
faceLight.position.set(1.1, 3.8, 3.2);
faceLight.target.position.set(2.0, 1.45, -1.6);
scene.add(faceLight, faceLight.target);

const miraWarmBounce=new THREE.DirectionalLight(0xffe3c8,.16);
miraWarmBounce.position.set(7.2,5.4,3.4);
miraWarmBounce.target.position.set(2.0,1.15,-1.6);
scene.add(miraWarmBounce,miraWarmBounce.target);

const miraCoolRim=new THREE.DirectionalLight(0xd8edf2,.10);
miraCoolRim.position.set(-5.0,4.0,-7.5);
miraCoolRim.target.position.set(2.0,1.25,-1.6);
scene.add(miraCoolRim,miraCoolRim.target);

function makeSeededRandom(seed){
  let state=seed>>>0;
  return ()=>{
    state=(Math.imul(state,1664525)+1013904223)>>>0;
    return state/4294967296;
  };
}

function makeSurfaceTexture(kind){
  const size=256;
  const c=document.createElement('canvas');
  c.width=size;
  c.height=size;
  const g=c.getContext('2d');
  const rnd=makeSeededRandom(kind==='asphalt'?0x6d2b79f5:0x1b873593);

  if(kind==='asphalt'){
    g.fillStyle='#62696a';
    g.fillRect(0,0,size,size);
    for(let i=0;i<760;i++){
      const v=82+Math.floor(rnd()*30);
      const a=.015+rnd()*.022;
      g.fillStyle='rgba('+v+','+v+','+v+','+a.toFixed(3)+')';
      const r=.35+rnd()*.90;
      g.fillRect(rnd()*size,rnd()*size,r,r);
    }
    for(let i=0;i<10;i++){
      g.strokeStyle='rgba(55,60,61,'+(.016+rnd()*.012).toFixed(3)+')';
      g.lineWidth=.40+rnd()*.55;
      g.beginPath();
      const x=rnd()*size;
      const y=rnd()*size;
      g.moveTo(x,y);
      g.lineTo(x+(rnd()-.5)*30,y+(rnd()-.5)*30);
      g.stroke();
    }
  }else{
    g.fillStyle='#dedbd0';
    g.fillRect(0,0,size,size);
    for(let i=0;i<620;i++){
      const warm=rnd()>.56;
      const base=warm?205:215;
      const a=.010+rnd()*.016;
      g.fillStyle='rgba('+(base+5)+','+(base+3)+','+base+','+a.toFixed(3)+')';
      g.beginPath();
      g.arc(rnd()*size,rnd()*size,.30+rnd()*.78,0,Math.PI*2);
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
glassReflectionGradient.addColorStop(0,'rgba(236,248,252,.64)');
glassReflectionGradient.addColorStop(.24,'rgba(199,225,235,.28)');
glassReflectionGradient.addColorStop(.48,'rgba(177,209,207,.15)');
glassReflectionGradient.addColorStop(.70,'rgba(229,235,221,.22)');
glassReflectionGradient.addColorStop(1,'rgba(154,182,180,.16)');
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
bannerGrad.addColorStop(0,'#738f8b');
bannerGrad.addColorStop(.52,'#91a79a');
bannerGrad.addColorStop(1,'#b99c82');
streetBannerCtx.fillStyle=bannerGrad;
streetBannerCtx.fillRect(0,0,256,512);
streetBannerCtx.fillStyle='rgba(255,255,255,.10)';
streetBannerCtx.fillRect(28,24,200,2);
streetBannerCtx.fillRect(28,486,200,2);
streetBannerCtx.fillStyle='#f8f3ea';
streetBannerCtx.font='700 48px Inter, sans-serif';
streetBannerCtx.textAlign='center';
streetBannerCtx.fillText('NOVA',128,226);
streetBannerCtx.font='500 22px Inter, sans-serif';
streetBannerCtx.fillStyle='rgba(248,243,234,.84)';
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
      roughness:.29,
      metalness:.03,
      transparent:true,
      opacity:.47,
      transmission:.06,
      clearcoat:.18,
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
const dappleRnd=makeSeededRandom(0xa341316c);
for(let i=0;i<120;i++){
  const x=40+dappleRnd()*432;
  const y=40+dappleRnd()*432;
  const rx=9+dappleRnd()*24;
  const ry=5+dappleRnd()*15;
  dappleCtx.save();
  dappleCtx.translate(x,y);
  dappleCtx.rotate(dappleRnd()*Math.PI);
  const a=.018+dappleRnd()*.026;
  dappleCtx.fillStyle='rgba(47,66,48,'+a.toFixed(3)+')';
  dappleCtx.beginPath();
  dappleCtx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  dappleCtx.fill();
  dappleCtx.restore();
}
const dappleTexture=new THREE.CanvasTexture(dappleCanvas);
dappleTexture.colorSpace=THREE.SRGBColorSpace;
dappleTexture.anisotropy=8;

const sunPoolCanvas=document.createElement('canvas');
sunPoolCanvas.width=256;
sunPoolCanvas.height=256;
const sunPoolCtx=sunPoolCanvas.getContext('2d');
const sunPoolGradient=sunPoolCtx.createRadialGradient(128,128,10,128,128,124);
sunPoolGradient.addColorStop(0,'rgba(255,246,221,.23)');
sunPoolGradient.addColorStop(.42,'rgba(255,241,214,.12)');
sunPoolGradient.addColorStop(1,'rgba(255,241,214,0)');
sunPoolCtx.fillStyle=sunPoolGradient;
sunPoolCtx.fillRect(0,0,256,256);
const sunPoolTexture=new THREE.CanvasTexture(sunPoolCanvas);
sunPoolTexture.colorSpace=THREE.SRGBColorSpace;

function createSunPool(x,z,w,d,opacity=.30){
  const pool=new THREE.Mesh(
    new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({
      map:sunPoolTexture,
      transparent:true,
      opacity,
      depthWrite:false,
      toneMapped:false
    })
  );
  pool.rotation.x=-Math.PI/2;
  pool.position.set(x,.053,z);
  scene.add(pool);
  return pool;
}

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
cityGround.material.color.set(0xc9c6bb);
cityGround.material.needsUpdate=true;

const road=plane(15,92,0xffffff,-6.7,.004,-4);
road.material.map=asphaltTexture;
road.material.roughness=.96;
road.material.needsUpdate=true;

const sidewalk=plane(10.8,92,0xffffff,4.2,.014,-4);
sidewalk.material.map=pavementTexture;
sidewalk.material.roughness=.95;
sidewalk.material.needsUpdate=true;

const curbsidePaving=new THREE.Mesh(
  new THREE.PlaneGeometry(1.35,88),
  new THREE.MeshStandardMaterial({color:0xd5d1c6,roughness:.97})
);
curbsidePaving.rotation.x=-Math.PI/2;
curbsidePaving.position.set(1.30,.029,-4);
curbsidePaving.receiveShadow=true;
scene.add(curbsidePaving);

const curbsideEdgeMat=new THREE.MeshBasicMaterial({
  color:0xbab5aa,
  transparent:true,
  opacity:.28,
  depthWrite:false
});
[.64,1.96].forEach(x=>{
  const edge=new THREE.Mesh(new THREE.PlaneGeometry(.018,86),curbsideEdgeMat);
  edge.rotation.x=-Math.PI/2;
  edge.position.set(x,.037,-4);
  scene.add(edge);
});

const curb=box(.30,.18,92,0xc4beb2,.05,.08,-4,.92);
const curbCap=box(.09,.035,92,0xe9e3d7,.18,.185,-4,.86);

const gutterStrip=new THREE.Mesh(
  new THREE.PlaneGeometry(.34,88),
  new THREE.MeshStandardMaterial({color:0x777c79,roughness:.98})
);
gutterStrip.rotation.x=-Math.PI/2;
gutterStrip.position.set(-.20,.018,-4);
gutterStrip.receiveShadow=true;
scene.add(gutterStrip);

const curbJointMat=new THREE.MeshBasicMaterial({
  color:0x9f9a90,
  transparent:true,
  opacity:.34,
  depthWrite:false
});
for(let z=-43;z<=39;z+=3.25){
  const joint=new THREE.Mesh(new THREE.PlaneGeometry(.30,.018),curbJointMat);
  joint.rotation.x=-Math.PI/2;
  joint.position.set(.05,.188,z);
  scene.add(joint);
}

const curbDrainMat=new THREE.MeshStandardMaterial({color:0x59605e,roughness:.68,metalness:.35});
[-24,-8,8,24].forEach(z=>{
  const grate=new THREE.Mesh(new THREE.BoxGeometry(.24,.018,.58),curbDrainMat);
  grate.position.set(-.18,.034,z);
  grate.receiveShadow=true;
  scene.add(grate);

  [-.16,-.05,.06,.17].forEach(dz=>{
    const slot=new THREE.Mesh(new THREE.BoxGeometry(.14,.012,.025),new THREE.MeshBasicMaterial({color:0x343938}));
    slot.position.set(-.18,.047,z+dz);
    scene.add(slot);
  });
});

// Fine sidewalk seams add scale without relying on image textures.
const seamMat=new THREE.MeshBasicMaterial({color:0xbab6ad,transparent:true,opacity:.23,depthWrite:false});
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
const tactileMat=new THREE.MeshStandardMaterial({color:0xcebd7b,roughness:.92});
const tactile=new THREE.Mesh(new THREE.PlaneGeometry(.34,82),tactileMat);
tactile.rotation.x=-Math.PI/2;
tactile.position.set(.78,.038,-4);
tactile.receiveShadow=true;
scene.add(tactile);

const patchMat=new THREE.MeshBasicMaterial({
  color:0xffffff,
  transparent:true,
  opacity:.018,
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
const stripeMat=new THREE.MeshBasicMaterial({color:0xe8e6dc,transparent:true,opacity:.78});
for(let z=-40;z<40;z+=5.8){
  const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.13,2.9),stripeMat);
  stripe.rotation.x=-Math.PI/2;
  stripe.position.set(-6.5,.022,z);
  scene.add(stripe);
}
const edgeLine=new THREE.Mesh(new THREE.PlaneGeometry(.11,86),new THREE.MeshBasicMaterial({color:0xd8c66d}));
edgeLine.rotation.x=-Math.PI/2;
edgeLine.position.set(-.45,.025,-4);
scene.add(edgeLine);

const focalCurbMark=new THREE.Mesh(
  new THREE.PlaneGeometry(.13,5.4),
  new THREE.MeshBasicMaterial({color:0xd8c777,transparent:true,opacity:.58})
);
focalCurbMark.rotation.x=-Math.PI/2;
focalCurbMark.position.set(-.28,.030,-1.55);
scene.add(focalCurbMark);

const roadSheenMat=new THREE.MeshBasicMaterial({
  color:0xdde8eb,
  transparent:true,
  opacity:.025,
  depthWrite:false,
  blending:THREE.NormalBlending
});
[
  [-8.8,-5.0,2.2,26],
  [-4.6,8.0,1.7,22],
  [-10.3,19.0,1.2,13]
].forEach(([x,z,w,d])=>{
  const sheen=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadSheenMat);
  sheen.rotation.x=-Math.PI/2;
  sheen.position.set(x,.026,z);
  scene.add(sheen);
});

for(let x=-12.6;x<-1.0;x+=1.45){
  const cross=new THREE.Mesh(new THREE.PlaneGeometry(.62,3.1),stripeMat);
  cross.rotation.x=-Math.PI/2;
  cross.position.set(x,.024,-17.2);
  scene.add(cross);
}

const utilityCover=new THREE.Mesh(
  new THREE.RingGeometry(.27,.39,28),
  new THREE.MeshStandardMaterial({color:0x51595a,roughness:.86,metalness:.20,side:THREE.DoubleSide})
);
utilityCover.rotation.x=-Math.PI/2;
utilityCover.position.set(-8.55,.031,2.8);
utilityCover.receiveShadow=true;
scene.add(utilityCover);

const utilityCenter=new THREE.Mesh(
  new THREE.CircleGeometry(.265,28),
  new THREE.MeshStandardMaterial({color:0x5d6464,roughness:.92,metalness:.12,side:THREE.DoubleSide})
);
utilityCenter.rotation.x=-Math.PI/2;
utilityCenter.position.set(-8.55,.0305,2.8);
scene.add(utilityCenter);

// Street-facing buildings: warm stone + glass + shaded shopfronts.
const rightFacade=box(3.4,7.6,66,0xddd5c7,10.15,3.75,-5,.78);
rightFacade.castShadow=false;

const upperRecess=new THREE.Mesh(
  new THREE.BoxGeometry(.18,2.10,63.9),
  new THREE.MeshStandardMaterial({color:0xc9c5bd,roughness:.84})
);
upperRecess.position.set(8.47,6.18,-5);
upperRecess.castShadow=true;
upperRecess.receiveShadow=true;
scene.add(upperRecess);

const topCornice=new THREE.Mesh(
  new THREE.BoxGeometry(.56,.20,65.0),
  new THREE.MeshStandardMaterial({color:0xe6ded1,roughness:.78})
);
topCornice.position.set(8.25,7.42,-5);
topCornice.castShadow=true;
scene.add(topCornice);

const facadeBaseBand=new THREE.Mesh(
  new THREE.BoxGeometry(.36,.20,64.8),
  new THREE.MeshStandardMaterial({color:0xd1c6b6,roughness:.90})
);
facadeBaseBand.position.set(8.36,.20,-5);
facadeBaseBand.castShadow=true;
facadeBaseBand.receiveShadow=true;
scene.add(facadeBaseBand);

const storefrontPavingBand=new THREE.Mesh(
  new THREE.PlaneGeometry(.72,63.8),
  new THREE.MeshStandardMaterial({color:0xd9d0c3,roughness:.96})
);
storefrontPavingBand.rotation.x=-Math.PI/2;
storefrontPavingBand.position.set(7.62,.047,-5);
storefrontPavingBand.receiveShadow=true;
scene.add(storefrontPavingBand);

const facadeShadeCanvas=document.createElement('canvas');
facadeShadeCanvas.width=256;
facadeShadeCanvas.height=32;
const facadeShadeCtx=facadeShadeCanvas.getContext('2d');
const facadeShadeGradient=facadeShadeCtx.createLinearGradient(0,0,256,0);
facadeShadeGradient.addColorStop(0,'rgba(79,72,65,.16)');
facadeShadeGradient.addColorStop(.30,'rgba(86,79,71,.085)');
facadeShadeGradient.addColorStop(.72,'rgba(92,86,78,.025)');
facadeShadeGradient.addColorStop(1,'rgba(92,86,78,0)');
facadeShadeCtx.fillStyle=facadeShadeGradient;
facadeShadeCtx.fillRect(0,0,256,32);
const facadeShadeTexture=new THREE.CanvasTexture(facadeShadeCanvas);
facadeShadeTexture.colorSpace=THREE.SRGBColorSpace;
const facadeSoftShade=new THREE.Mesh(
  new THREE.PlaneGeometry(2.30,61.8),
  new THREE.MeshBasicMaterial({
    map:facadeShadeTexture,
    transparent:true,
    opacity:.58,
    depthWrite:false,
    toneMapped:false
  })
);
facadeSoftShade.rotation.x=-Math.PI/2;
facadeSoftShade.position.set(6.95,.056,-5);
scene.add(facadeSoftShade);

// Three shallow backing planes give the long frontage three distinct identities:
// muted grey-green shops, a cream stone home block around Mira, and the warm cafe.
function createFacadeZone(z,width,color,opacity=.34){
  const zone=new THREE.Mesh(
    new THREE.PlaneGeometry(width,5.82),
    new THREE.MeshStandardMaterial({
      color,
      roughness:.84,
      transparent:true,
      opacity,
      side:THREE.DoubleSide
    })
  );
  zone.position.set(8.515,3.34,z);
  zone.rotation.y=-Math.PI/2;
  zone.receiveShadow=true;
  scene.add(zone);
  return zone;
}
createFacadeZone(-20.4,24.0,0xc9d0c8,.30);
createFacadeZone(-2.7,12.4,0xddd5c7,.34);
createFacadeZone(5.1,9.6,0xb58e70,.22);
createFacadeZone(18.1,15.0,0xd2d4cb,.28);

const facadeRibMat=new THREE.MeshStandardMaterial({
  color:0xd6cec1,
  roughness:.82
});
[-34.2,-27.0,-18.9,-11.2,-3.7,4.1,12.4,20.7,27.3].forEach((z,i)=>{
  const ribWidth=i===4||i===5?.26:.18;
  const rib=new THREE.Mesh(new THREE.BoxGeometry(.20,5.82,ribWidth),facadeRibMat);
  rib.position.set(8.42,3.32,z);
  rib.castShadow=true;
  rib.receiveShadow=true;
  scene.add(rib);
});

const balconyStone=new THREE.MeshStandardMaterial({color:0xd8cfc2,roughness:.86});
const balconyGreenMats=[
  new THREE.MeshStandardMaterial({color:0x789a70,roughness:.96}),
  new THREE.MeshStandardMaterial({color:0x93ad80,roughness:.95})
];
[-15.2,-.8,13.6].forEach((z,balconyIndex)=>{
  const slab=new THREE.Mesh(new THREE.BoxGeometry(.82,.10,3.20),balconyStone);
  slab.position.set(7.95,5.56,z);
  slab.castShadow=true;
  slab.receiveShadow=true;
  scene.add(slab);

  const railMat=new THREE.MeshStandardMaterial({color:0x9aa29e,roughness:.48,metalness:.28});
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.045,.50,3.05),railMat);
  rail.position.set(7.58,5.86,z);
  rail.castShadow=true;
  scene.add(rail);

  [-1.00,-.50,0,.50,1.00].forEach((oz,i)=>{
    const planter=new THREE.Mesh(
      new THREE.BoxGeometry(.28,.20,.38),
      new THREE.MeshStandardMaterial({color:0xb9aa96,roughness:.92})
    );
    planter.position.set(7.72,5.72,z+oz);
    planter.castShadow=true;
    scene.add(planter);

    const shrub=new THREE.Mesh(
      new THREE.SphereGeometry(.13+(i%2)*.018,10,8),
      balconyGreenMats[(i+balconyIndex)%2]
    );
    shrub.scale.set(1.1,.78,.95);
    shrub.position.set(7.72,5.91,z+oz);
    shrub.castShadow=true;
    scene.add(shrub);
  });
});

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

const facadeSunWashMat=new THREE.MeshBasicMaterial({
  color:0xffe6c8,
  transparent:true,
  opacity:.055,
  depthWrite:false,
  toneMapped:false
});
[-16.6,-2.2,12.2].forEach((z,i)=>{
  const wash=new THREE.Mesh(new THREE.PlaneGeometry(4.20,2.05),facadeSunWashMat);
  wash.position.set(8.28,4.52,z);
  wash.rotation.y=-Math.PI/2;
  wash.rotation.z=(i-1)*.018;
  scene.add(wash);
});

const facadeBayCenters=[-31.0,-23.6,-16.0,-8.6,-1.1,6.5,14.5,22.7];
const facadeBayDepths=[5.00,5.55,5.12,5.62,5.08,5.82,5.18,5.52];
facadeBayCenters.forEach((z,bayIndex)=>{
  const bayDepth=facadeBayDepths[bayIndex];
  const bayTone=z<-7?0xc2c9c2:(z>10?0xd8cabc:0xc9c1b5);
  const bay=box(.42,5.6,bayDepth,bayTone,8.64,3.22,z,.66);
  bay.castShadow=false;

  const glassTint=z<-7?0xc6dad8:(z>10?0xd2d5cd:0xc2d9da);
  const glass=glassPanel(bayDepth-.34,4.65,8.41,3.35,z,-Math.PI/2,glassTint);
  glass.material.opacity=z<-7?.39:(z>10?.37:.42);
  glass.material.roughness=z>10?.33:.29;

  // Mullions prevent large glazing bays from reading as flat placeholder planes.
  [-.32,0,.32].forEach(fraction=>{
    const offset=fraction*(bayDepth-.42);
    const mullion=box(.045,4.62,.035,0x9aa5a3,8.35,3.35,z+offset,.42,.28);
    mullion.castShadow=false;
  });
  [2.05,3.35,4.65].forEach(y=>{
    const mullion=box(.045,.035,bayDepth-.40,0xa3adaa,8.35,y,z,.42,.28);
    mullion.castShadow=false;
  });

  // dark sill + pale canopy creates the cafe / mixed-use street rhythm.
  box(.38,.16,bayDepth-.18,0x666965,8.34,.62,z,.62,.10);
  const canopyTone=z<-7?0xe2e8df:(z>10?0xe6d8cb:0xeee6d8);
  const canopyProjection=bayIndex===3||bayIndex===4?1.28:(bayIndex===5?1.46:1.02);
  const canopy=box(canopyProjection,.12,bayDepth+.04,canopyTone,8.12-canopyProjection*.15,3.02,z,.74);
  canopy.castShadow=true;

  const canopyShadow=box(Math.max(.82,canopyProjection-.12),.035,bayDepth-.16,0x9d9489,8.02,2.945,z,.92);
  canopyShadow.material.transparent=true;
  canopyShadow.material.opacity=.28;
  canopyShadow.material.depthWrite=false;
  canopyShadow.castShadow=false;

  const glassBacking=new THREE.Mesh(
    new THREE.PlaneGeometry(bayDepth-.56,4.38),
    new THREE.MeshBasicMaterial({
      color:z<-7?0xb7c1ba:(z>10?0xcbb9a9:0xbeb5aa),
      transparent:true,
      opacity:.055,
      depthWrite:false
    })
  );
  glassBacking.position.set(8.48,3.34,z);
  glassBacking.rotation.y=-Math.PI/2;
  scene.add(glassBacking);

  const ledge=box(.28,.07,bayDepth-.38,0xcfc9bd,8.18,5.70,z,.74);
  ledge.castShadow=true;
});

const portalStoneMat=new THREE.MeshStandardMaterial({color:0xd8d0c4,roughness:.86});
[
  [-4.55,3.45,0xded6c9],
  [10.55,3.10,0xd2d7cf]
].forEach(([z,width,color])=>{
  const mat=new THREE.MeshStandardMaterial({color,roughness:.86});
  [-width*.5,width*.5].forEach(oz=>{
    const jamb=new THREE.Mesh(new THREE.BoxGeometry(.36,3.05,.24),mat);
    jamb.position.set(7.98,1.57,z+oz);
    jamb.castShadow=true;
    scene.add(jamb);
  });
  const head=new THREE.Mesh(new THREE.BoxGeometry(.36,.24,width+.24),mat);
  head.position.set(7.98,3.00,z);
  head.castShadow=true;
  scene.add(head);
});

// A few recessed ground-floor entries keep the frontage from feeling like one
// repeated office wall.
[-18.8,-10.6,13.8].forEach((z,i)=>{
  const inset=box(.72,2.55,4.3,[0xa99b89,0x9daaa8,0xb3a08c][i],8.10,1.31,z,.72);
  inset.castShadow=false;

  const reveal=box(.16,2.34,3.94,0x8e877d,7.80,1.30,z,.82);
  reveal.castShadow=false;

  const door=glassPanel(2.10,2.22,7.70,1.34,z,-Math.PI/2,0xb9ced0);
  door.material.opacity=.50;
  door.material.roughness=.32;

  const handle=new THREE.Mesh(
    new THREE.CylinderGeometry(.018,.018,.48,10),
    new THREE.MeshStandardMaterial({color:0x8c9692,roughness:.42,metalness:.54})
  );
  handle.rotation.z=Math.PI/2;
  handle.position.set(7.64,1.36,z+.34);
  handle.castShadow=true;
  scene.add(handle);

  const step=box(.92,.10,3.65,0xcec6b8,7.58,.08,z,.90);
  step.castShadow=true;

  const sconceBase=new THREE.Mesh(
    new THREE.BoxGeometry(.10,.22,.16),
    new THREE.MeshStandardMaterial({color:0x777f7b,roughness:.48,metalness:.30})
  );
  sconceBase.position.set(7.63,2.34,z-1.54);
  sconceBase.castShadow=true;
  scene.add(sconceBase);

  const sconceGlow=new THREE.Mesh(
    new THREE.PlaneGeometry(.08,.15),
    new THREE.MeshBasicMaterial({
      color:0xffe7c7,
      transparent:true,
      opacity:.34,
      toneMapped:false,
      depthWrite:false
    })
  );
  sconceGlow.position.set(7.575,2.34,z-1.54);
  sconceGlow.rotation.y=-Math.PI/2;
  scene.add(sconceGlow);
});

function createStorePlaque(label,z,bg,fg){
  const c=document.createElement('canvas');
  c.width=384;
  c.height=128;
  const g=c.getContext('2d');
  g.fillStyle=bg;
  g.fillRect(0,0,384,128);
  g.fillStyle=fg;
  g.font='600 42px Inter, sans-serif';
  g.textAlign='center';
  g.textBaseline='middle';
  g.fillText(label,192,64);
  const texture=new THREE.CanvasTexture(c);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  const plaque=new THREE.Mesh(
    new THREE.PlaneGeometry(2.15,.54),
    new THREE.MeshBasicMaterial({map:texture,toneMapped:false})
  );
  plaque.position.set(7.68,2.55,z);
  plaque.rotation.y=-Math.PI/2;
  scene.add(plaque);
}
createStorePlaque('MORI',-10.6,'#e7e8df','#58625d');
createStorePlaque('ATELIER',13.8,'#eee4d8','#63574d');

const facadePlanterMat=new THREE.MeshStandardMaterial({color:0xb8aa97,roughness:.92});
const facadeLeafMats=[
  new THREE.MeshStandardMaterial({color:0x78986f,roughness:.96}),
  new THREE.MeshStandardMaterial({color:0x91ad80,roughness:.95})
];
[-10.6,13.8].forEach((z,groupIndex)=>{
  const interiorWash=new THREE.Mesh(
    new THREE.PlaneGeometry(2.82,1.72),
    new THREE.MeshBasicMaterial({
      color:groupIndex===0?0xdde2d8:0xead8c8,
      transparent:true,
      opacity:.15,
      depthWrite:false,
      toneMapped:false
    })
  );
  interiorWash.position.set(8.02,1.46,z);
  interiorWash.rotation.y=-Math.PI/2;
  scene.add(interiorWash);

  const displayPlinth=new THREE.Mesh(
    new THREE.BoxGeometry(.42,.46,1.42),
    new THREE.MeshStandardMaterial({
      color:groupIndex===0?0xb8c1b4:0xc8ae98,
      roughness:.88
    })
  );
  displayPlinth.position.set(7.94,.42,z+(groupIndex===0?.28:-.24));
  displayPlinth.castShadow=true;
  scene.add(displayPlinth);

  const planter=new THREE.Mesh(new THREE.BoxGeometry(.62,.22,2.15),facadePlanterMat);
  planter.position.set(7.55,.36,z);
  planter.castShadow=true;
  planter.receiveShadow=true;
  scene.add(planter);

  [-.72,-.38,0,.37,.70].forEach((offset,i)=>{
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16+(i%2)*.02,10,8),facadeLeafMats[(i+groupIndex)%2]);
    leaf.scale.set(1.0,.72,.92);
    leaf.position.set(7.40,.58+(i%2)*.025,z+offset);
    leaf.castShadow=true;
    scene.add(leaf);
  });
});

// Ground-floor cafe corner.
const cafeFrame=box(.48,3.0,8.5,0xb58e70,8.33,1.55,4.8,.72);
cafeFrame.castShadow=false;
const cafeGlass=glassPanel(7.75,2.55,8.05,1.62,4.8,-Math.PI/2,0xc3d8d7);
cafeGlass.material.opacity=.48;
cafeGlass.material.roughness=.31;

const cafeMullionMat=new THREE.MeshStandardMaterial({
  color:0x9c8e80,
  roughness:.56,
  metalness:.18
});
[2.15,3.80,5.45,7.10].forEach(z=>{
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.055,2.42,.045),cafeMullionMat);
  mullion.position.set(7.96,1.64,z);
  mullion.castShadow=true;
  scene.add(mullion);
});

const cafeDoorFrame=new THREE.MeshStandardMaterial({color:0x8e8378,roughness:.58,metalness:.16});
[
  [7.88,1.58,1.73,.055,2.42,.055],
  [7.88,1.58,2.67,.055,2.42,.055],
  [7.88,2.77,2.20,.055,.055,.98]
].forEach(([x,y,z,w,h,d])=>{
  const frame=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),cafeDoorFrame);
  frame.position.set(x,y,z);
  frame.castShadow=true;
  scene.add(frame);
});

const cafeDoorGlass=glassPanel(.88,2.28,7.91,1.58,2.20,-Math.PI/2,0xc7d9d7);
cafeDoorGlass.material.opacity=.40;
cafeDoorGlass.material.roughness=.32;

const cafeDoorHandle=new THREE.Mesh(
  new THREE.CylinderGeometry(.018,.018,.42,10),
  new THREE.MeshStandardMaterial({color:0x9ba29f,roughness:.40,metalness:.48})
);
cafeDoorHandle.rotation.z=Math.PI/2;
cafeDoorHandle.position.set(7.84,1.52,2.48);
cafeDoorHandle.castShadow=true;
scene.add(cafeDoorHandle);

const cafeInteriorGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(7.25,2.18),
  new THREE.MeshBasicMaterial({
    color:0xf2ddc4,
    transparent:true,
    opacity:.10,
    depthWrite:false,
    toneMapped:false
  })
);
cafeInteriorGlow.position.set(8.13,1.55,4.8);
cafeInteriorGlow.rotation.y=-Math.PI/2;
scene.add(cafeInteriorGlow);

const signCanvas=document.createElement('canvas');
signCanvas.width=512;
signCanvas.height=128;
const signCtx=signCanvas.getContext('2d');
signCtx.fillStyle='#f3eee5';
signCtx.fillRect(0,0,512,128);
signCtx.fillStyle='#514b43';
signCtx.font='600 44px Inter, sans-serif';
signCtx.textAlign='center';
signCtx.textBaseline='middle';
signCtx.fillText('NOVA CAFÉ',256,65);
const signTexture=new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace=THREE.SRGBColorSpace;
const cafeSign=new THREE.Mesh(
  new THREE.PlaneGeometry(2.42,.54),
  new THREE.MeshBasicMaterial({map:signTexture,toneMapped:false})
);
cafeSign.position.set(7.77,3.38,4.8);
cafeSign.rotation.y=-Math.PI/2;
scene.add(cafeSign);

const awningCream=new THREE.MeshStandardMaterial({color:0xf0e5d3,roughness:.78});
const awningApricot=new THREE.MeshStandardMaterial({color:0xd8aa86,roughness:.76});
const awningDepth=5.18/7;
for(let i=0;i<7;i++){
  const slat=new THREE.Mesh(
    new THREE.BoxGeometry(1.55,.10,awningDepth+.012),
    i%2?awningApricot:awningCream
  );
  slat.position.set(7.58,2.78,2.21+awningDepth*(i+.5));
  slat.rotation.z=-.08;
  slat.castShadow=true;
  scene.add(slat);

  const valance=new THREE.Mesh(
    new THREE.BoxGeometry(.055,.19,awningDepth-.025),
    i%2?awningApricot:awningCream
  );
  valance.position.set(6.82,2.67,2.21+awningDepth*(i+.5));
  valance.rotation.z=-.08;
  valance.castShadow=true;
  scene.add(valance);
}

const awningLightMat=new THREE.MeshBasicMaterial({color:0xffe8c9,toneMapped:false});
[3.0,4.8,6.6].forEach(z=>{
  const light=new THREE.Mesh(new THREE.CircleGeometry(.045,14),awningLightMat);
  light.position.set(6.79,2.59,z);
  light.rotation.y=-Math.PI/2;
  scene.add(light);
});

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

const cafeInteriorWood=new THREE.MeshStandardMaterial({color:0xb79473,roughness:.80});
const cafeInteriorWarm=new THREE.MeshStandardMaterial({color:0xe8d9c5,roughness:.88});
const cafeCounter=new THREE.Mesh(new THREE.BoxGeometry(.32,.86,5.30),cafeInteriorWood);
cafeCounter.position.set(8.18,.72,4.85);
cafeCounter.castShadow=true;
scene.add(cafeCounter);

const cafeBenchMat=new THREE.MeshStandardMaterial({color:0xb69b82,roughness:.88});
const cafeBench=new THREE.Mesh(new THREE.BoxGeometry(.34,.48,2.60),cafeBenchMat);
cafeBench.position.set(8.18,.46,6.25);
cafeBench.castShadow=true;
scene.add(cafeBench);

const cafeSmallTableMat=new THREE.MeshStandardMaterial({color:0xc9aa88,roughness:.82});
[3.45,5.05,6.65].forEach(z=>{
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.035,18),cafeSmallTableMat);
  top.position.set(7.92,.72,z);
  top.castShadow=true;
  scene.add(top);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.022,.030,.64,8),cafeMullionMat);
  stem.position.set(7.92,.39,z);
  stem.castShadow=true;
  scene.add(stem);
});
for(let z=2.95;z<=6.75;z+=1.90){
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(.10,.065,1.15),cafeInteriorWarm);
  shelf.position.set(8.23,1.62,z);
  scene.add(shelf);
}

// Buildings across the road give the boulevard depth but stay light enough for
// the AI character to remain the visual focus.
const farBuildingColors=[0xdde0dc,0xd6dddd,0xe6e1d9,0xd2d9d8];
for(let i=0;i<10;i++){
  const z=-36+i*8.3;
  const h=5.2+(i%4)*1.6;
  const b=box(3.8,h,6.4,farBuildingColors[i%farBuildingColors.length],-15.2,h/2-.02,z,.72);
  b.castShadow=false;

  const parapet=new THREE.Mesh(
    new THREE.BoxGeometry(3.92,.12,6.52),
    new THREE.MeshStandardMaterial({
      color:[0xc8d0cc,0xcbd3d1,0xd8d2c8][i%3],
      roughness:.88
    })
  );
  parapet.position.set(-15.2,h+.06,z);
  parapet.castShadow=false;
  scene.add(parapet);

  for(let level=.9;level<h-.6;level+=1.22){
    const windowTone=(Math.floor(level*10)+i)%3;
    const win=new THREE.Mesh(
      new THREE.PlaneGeometry(3.45,.66),
      new THREE.MeshStandardMaterial({
        color:[0xaabec3,0xb2c4c7,0xa1b7bc][windowTone],
        roughness:.30,
        metalness:.10
      })
    );
    win.position.set(-13.27,level,z);
    win.rotation.y=Math.PI/2;
    scene.add(win);
  }
}

// Glass office volumes sit behind the lower street wall so the boulevard reads
// as a real modern city rather than one strip of boxes.
function createGlassTower(x,z,w,d,h,tint){
  const body=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshPhysicalMaterial({
      color:tint,
      map:glassReflectionTexture,
      roughness:.29,
      metalness:.05,
      transparent:true,
      opacity:.56,
      transmission:.05,
      clearcoat:.20,
      clearcoatRoughness:.38
    })
  );
  body.position.set(x,h/2,z);
  body.receiveShadow=true;
  scene.add(body);

  const mullionMat=new THREE.MeshStandardMaterial({color:0x919e9f,roughness:.48,metalness:.18});
  for(let level=1.0;level<h-.7;level+=1.35){
    const band=new THREE.Mesh(new THREE.BoxGeometry(w+.04,.035,d+.04),mullionMat);
    band.position.set(x,level,z);
    scene.add(band);
  }
  [-.34,0,.34].forEach(n=>{
    const v=new THREE.Mesh(new THREE.BoxGeometry(.04,h-.4,d+.05),mullionMat);
    v.position.set(x+n*w*.72,h/2,z);
    scene.add(v);
  });

  const roof=new THREE.Mesh(
    new THREE.BoxGeometry(w+.20,.16,d+.20),
    new THREE.MeshStandardMaterial({color:0xaeb8b9,roughness:.64,metalness:.08})
  );
  roof.position.set(x,h+.08,z);
  scene.add(roof);
}

createGlassTower(-17.8,-4.8,4.4,7.0,12.4,0xa8c8d2);
createGlassTower(-19.2,16.2,4.8,6.4,10.6,0xb7ccd2);

// Soft skyline silhouettes keep the horizon bright and city-like.
for(let i=0;i<9;i++){
  const h=9+(i%5)*2.4;
  const tower=box(5.0,h,5.0,[0xc3cdcf,0xd0d5d3,0xb8c6c8][i%3],-19-i*1.3,h/2,-36+i*8.8,.86);
  tower.castShadow=false;
}

// Trees, planters and street furniture make this feel like somewhere Mira
// actually spends time instead of a sterile tech showcase.
const streetTreeCrowns=[];
function createStreetTree(x,z,scale=1){
  const pit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.18*scale,1.18*scale),
    new THREE.MeshStandardMaterial({color:0x897a66,roughness:1})
  );
  pit.rotation.x=-Math.PI/2;
  pit.position.set(x,.041,z);
  pit.receiveShadow=true;
  scene.add(pit);

  const grate=new THREE.Mesh(
    new THREE.RingGeometry(.32*scale,.50*scale,20),
    new THREE.MeshStandardMaterial({color:0x626b67,roughness:.66,metalness:.32,side:THREE.DoubleSide})
  );
  grate.rotation.x=-Math.PI/2;
  grate.position.set(x,.046,z);
  scene.add(grate);

  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.10*scale,.145*scale,2.55*scale,12),
    new THREE.MeshStandardMaterial({color:0x8c735d,roughness:.96})
  );
  trunk.position.set(x,1.275*scale,z);
  trunk.castShadow=true;
  scene.add(trunk);

  const branchMat=new THREE.MeshStandardMaterial({color:0x8a725d,roughness:.96});
  const branchRoot=new THREE.Vector3(x,2.15*scale,z);
  [
    [-.34,.52,.08,.055],
    [.30,.46,-.10,.050],
    [-.08,.64,-.26,.046]
  ].forEach(([ox,oy,oz,r])=>{
    const end=new THREE.Vector3(x+ox*scale,(2.15+oy)*scale,z+oz*scale);
    const dir=end.clone().sub(branchRoot);
    const branch=new THREE.Mesh(
      new THREE.CylinderGeometry(r*scale,r*.72*scale,dir.length(),9),
      branchMat
    );
    branch.position.copy(branchRoot).add(end).multiplyScalar(.5);
    branch.quaternion.setFromUnitVectors(
      new THREE.Vector3(0,1,0),
      dir.clone().normalize()
    );
    branch.castShadow=true;
    scene.add(branch);
  });

  const crown=new THREE.Group();
  const leafMats=[
    new THREE.MeshStandardMaterial({color:0x7ba56f,roughness:.94}),
    new THREE.MeshStandardMaterial({color:0x91b77e,roughness:.92}),
    new THREE.MeshStandardMaterial({color:0x6f9765,roughness:.95})
  ];
  [
    [0,.02,0,.86,1.08,.92],
    [-.42,.02,.06,.62,1.12,.88],
    [.40,.10,-.06,.68,1.06,.90],
    [-.18,.46,-.02,.60,1.14,.86],
    [.24,.50,.04,.57,1.12,.88],
    [0,.82,0,.49,1.16,.84]
  ].forEach(([ox,oy,oz,r,sy,sz],index)=>{
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,2),leafMats[index%leafMats.length]);
    leaf.position.set(ox*scale,oy*scale,oz*scale);
    leaf.scale.set(.86,sy*1.06,sz*.90);
    leaf.castShadow=true;
    leaf.receiveShadow=true;
    crown.add(leaf);
  });

  const crownShadeMat=new THREE.MeshStandardMaterial({color:0x63875e,roughness:.97});
  [
    [-.32,-.22,.02,.38],
    [.28,-.16,-.08,.34]
  ].forEach(([ox,oy,oz,r])=>{
    const shadeLeaf=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,1),crownShadeMat);
    shadeLeaf.position.set(ox*scale,oy*scale,oz*scale);
    shadeLeaf.scale.set(.90,.78,.86);
    shadeLeaf.castShadow=true;
    crown.add(shadeLeaf);
  });

  const highlightMat=new THREE.MeshStandardMaterial({color:0xa8c895,roughness:.94});
  [
    [-.26,.62,.18,.28],
    [.30,.42,.14,.24]
  ].forEach(([ox,oy,oz,r])=>{
    const highlight=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,1),highlightMat);
    highlight.position.set(ox*scale,oy*scale,oz*scale);
    highlight.castShadow=false;
    crown.add(highlight);
  });

  crown.position.set(x,3.10*scale,z);
  scene.add(crown);
  streetTreeCrowns.push(crown);
}

[
  [1.08,-13.4,1.02],
  [.94,-6.55,.95],
  [1.06,10.55,1.00],
  [.92,16.65,.93]
].forEach(([x,z,scale])=>createStreetTree(x,z,scale));

const curbGroundcoverMat=new THREE.MeshStandardMaterial({color:0x8ea27a,roughness:.98});
[-6.4,10.8].forEach(z=>{
  [-.31,-.15,.14,.30].forEach((dx,i)=>{
    const tuft=new THREE.Mesh(new THREE.ConeGeometry(.055,.20,7),curbGroundcoverMat);
    tuft.position.set(1.0+dx,.145,z+(i%2?.27:-.25));
    tuft.rotation.z=(i-1.5)*.18;
    tuft.castShadow=true;
    scene.add(tuft);
  });
});
[
  [-12.35,-18.4,.88],
  [-11.95,.35,.92],
  [-12.25,18.5,.89]
].forEach(([x,z,scale])=>createStreetTree(x,z,scale));

function createPlanter(x,z,w=1.8){
  box(w,.42,.72,0xbcb09d,x,.22,z,.92);
  const greens=[
    new THREE.MeshStandardMaterial({color:0x789d70,roughness:.96}),
    new THREE.MeshStandardMaterial({color:0x91b77e,roughness:.95}),
    new THREE.MeshStandardMaterial({color:0x6f9765,roughness:.97})
  ];
  const offsets=[
    [-.34,-.05,.94],
    [-.18,.04,1.08],
    [0,-.03,.98],
    [.19,.05,1.12],
    [.35,-.02,.92]
  ];
  offsets.forEach(([nx,nz,ss],i)=>{
    const shrub=new THREE.Mesh(new THREE.SphereGeometry(.25,12,9),greens[i%greens.length]);
    shrub.scale.set(1.14*ss,.76*ss,.94*ss);
    shrub.position.set(x+w*nx,.54+(i%2)*.035,z+nz);
    shrub.castShadow=true;
    scene.add(shrub);
  });
}
createPlanter(6.6,-8.3,2.2);
createPlanter(6.6,11.8,2.5);

const lowHedgeMat=new THREE.MeshStandardMaterial({color:0x78956e,roughness:.96});
const hedgeBed=box(3.6,.22,.82,0xaa9d88,5.65,.11,-13.0,.94);
hedgeBed.castShadow=false;
for(let i=0;i<9;i++){
  const shrub=new THREE.Mesh(new THREE.SphereGeometry(.24+(i%3)*.025,12,9),lowHedgeMat);
  shrub.scale.set(1.12,.72,1);
  shrub.position.set(4.20+i*.36,.42+(i%3)*.018,-13.0+([-.06,.03,.08][i%3]));
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
  new THREE.MeshStandardMaterial({color:0xe6ddce,roughness:.96})
);
miraPocket.rotation.x=-Math.PI/2;
miraPocket.position.set(3.75,.044,-1.55);
miraPocket.receiveShadow=true;
scene.add(miraPocket);

const pocketInlayMat=new THREE.MeshBasicMaterial({
  color:0xf2ece2,
  transparent:true,
  opacity:.16,
  depthWrite:false
});
[
  [2.05,-3.95,1.10,.025],
  [3.86,-3.95,1.58,.025],
  [5.20,.86,1.12,.025]
].forEach(([x,z,w,d])=>{
  const inlay=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pocketInlayMat);
  inlay.rotation.x=-Math.PI/2;
  inlay.position.set(x,.052,z);
  scene.add(inlay);
});

const pocketLineMat=new THREE.MeshBasicMaterial({
  color:0xc7bfb3,
  transparent:true,
  opacity:.16,
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

const pocketAccentMat=new THREE.MeshBasicMaterial({
  color:0xffffff,
  transparent:true,
  opacity:.055,
  depthWrite:false
});
[
  [2.86,-2.86,.58,.18],
  [4.58,-.74,.72,.16],
  [5.18,-2.92,.54,.15]
].forEach(([x,z,w,d])=>{
  const accent=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pocketAccentMat);
  accent.rotation.x=-Math.PI/2;
  accent.position.set(x,.054,z);
  scene.add(accent);
});

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

const dotMat=new THREE.MeshStandardMaterial({color:0xc6b678,roughness:.92});
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

const pocketBook=new THREE.Mesh(
  new THREE.BoxGeometry(.28,.028,.20),
  new THREE.MeshStandardMaterial({color:0xb68d79,roughness:.86})
);
pocketBook.position.set(5.88,.392,-1.70);
pocketBook.rotation.y=.16;
pocketBook.castShadow=true;
scene.add(pocketBook);

const pocketCup=new THREE.Mesh(
  new THREE.CylinderGeometry(.052,.044,.105,12),
  new THREE.MeshStandardMaterial({color:0xeee8df,roughness:.76})
);
pocketCup.position.set(6.45,.425,-1.70);
pocketCup.castShadow=true;
scene.add(pocketCup);

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

createDapplePatch(2.15,-2.10,4.3,5.1,-.10,.68);
createDapplePatch(4.75,5.15,3.8,4.4,.16,.62);
createSunPool(2.85,-1.72,4.8,4.5,.18);
createSunPool(5.85,6.40,3.6,5.8,.14);

const focalPlanterBase=new THREE.Mesh(
  new THREE.BoxGeometry(1.95,.34,.58),
  new THREE.MeshStandardMaterial({color:0xc3b6a3,roughness:.93})
);
focalPlanterBase.position.set(4.95,.18,-4.72);
focalPlanterBase.castShadow=true;
focalPlanterBase.receiveShadow=true;
scene.add(focalPlanterBase);

const focalPlantMats=[
  new THREE.MeshStandardMaterial({color:0x7d9f72,roughness:.96}),
  new THREE.MeshStandardMaterial({color:0x91ad7e,roughness:.95})
];
[
  [-.70,.00,.92],
  [-.42,.04,1.06],
  [-.12,-.03,.96],
  [.18,.04,1.10],
  [.48,-.02,.98],
  [.72,.03,.90]
].forEach(([ox,oz,ss],i)=>{
  const plant=new THREE.Mesh(new THREE.SphereGeometry(.24,12,9),focalPlantMats[i%2]);
  plant.scale.set(1.05*ss,.72*ss,.92*ss);
  plant.position.set(4.95+ox,.48+(i%2)*.035,-4.72+oz);
  plant.castShadow=true;
  scene.add(plant);
});

const focalBloomMats=[
  new THREE.MeshStandardMaterial({color:0xf0ebe0,roughness:.84}),
  new THREE.MeshStandardMaterial({color:0xe4cfd1,roughness:.84})
];
[
  [-.62,-.20],[-.30,.18],[.06,-.16],[.36,.17],[.63,-.10]
].forEach(([ox,oz],i)=>{
  const bloom=new THREE.Mesh(new THREE.SphereGeometry(.035,8,6),focalBloomMats[i%2]);
  bloom.position.set(4.95+ox,.70,-4.72+oz);
  bloom.castShadow=true;
  scene.add(bloom);
});

function createLampPost(x,z,withBanner=true){
  const metal=new THREE.MeshStandardMaterial({color:0x687170,roughness:.56,metalness:.38});
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

  if(withBanner){
    const banner=new THREE.Mesh(
      new THREE.PlaneGeometry(.36,.72),
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
}
createLampPost(.45,-11,true);
createLampPost(.45,2,false);
createLampPost(.45,15,true);

const wayfindingPole=new THREE.Mesh(
  new THREE.CylinderGeometry(.045,.055,2.25,10),
  new THREE.MeshStandardMaterial({color:0x66716e,roughness:.58,metalness:.30})
);
wayfindingPole.position.set(.48,1.13,-16.1);
wayfindingPole.castShadow=true;
scene.add(wayfindingPole);

const wayfindingCanvas=document.createElement('canvas');
wayfindingCanvas.width=256;
wayfindingCanvas.height=128;
const wayfindingCtx=wayfindingCanvas.getContext('2d');
wayfindingCtx.fillStyle='#607571';
wayfindingCtx.fillRect(0,0,256,128);
wayfindingCtx.fillStyle='#f2efe6';
wayfindingCtx.font='700 28px Inter, sans-serif';
wayfindingCtx.fillText('NOVA WALK',20,48);
wayfindingCtx.font='500 20px Inter, sans-serif';
wayfindingCtx.fillStyle='rgba(242,239,230,.78)';
wayfindingCtx.fillText('CAFÉ  •  PARK',20,82);
const wayfindingTexture=new THREE.CanvasTexture(wayfindingCanvas);
wayfindingTexture.colorSpace=THREE.SRGBColorSpace;
const wayfindingSign=new THREE.Mesh(
  new THREE.PlaneGeometry(.96,.48),
  new THREE.MeshBasicMaterial({map:wayfindingTexture,toneMapped:false,side:THREE.DoubleSide})
);
wayfindingSign.position.set(.66,1.80,-16.1);
wayfindingSign.rotation.y=Math.PI/2;
scene.add(wayfindingSign);

// A bench and bike rack near the cafe create readable points of interest for
// future Scanner/Map interactions.
const benchWood=new THREE.MeshStandardMaterial({color:0xb09073,roughness:.86});
const benchMetal=new THREE.MeshStandardMaterial({color:0x707875,roughness:.60,metalness:.32});
const benchSeat=new THREE.Mesh(new THREE.BoxGeometry(1.75,.10,.48),benchWood);
benchSeat.position.set(6.15,.54,-5.55);benchSeat.castShadow=true;scene.add(benchSeat);
const benchBack=new THREE.Mesh(new THREE.BoxGeometry(1.75,.48,.08),benchWood);
benchBack.position.set(6.15,.82,-5.35);benchBack.rotation.x=-.12;benchBack.castShadow=true;scene.add(benchBack);
[-.70,.70].forEach(offset=>{
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.08,.52,.08),benchMetal);
  leg.position.set(6.15+offset,.27,-5.55);leg.castShadow=true;scene.add(leg);
});

for(let i=0;i<3;i++){
  const rack=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,8,24,Math.PI),benchMetal);
  rack.rotation.x=Math.PI/2;
  rack.rotation.z=Math.PI/2;
  rack.position.set(5.85+i*.55,.35,-9.8);
  rack.castShadow=true;
  scene.add(rack);
}

// Small outdoor cafe setup turns the building edge into a believable place,
// not just a facade.
const menuCanvas=document.createElement('canvas');
menuCanvas.width=256;
menuCanvas.height=384;
const menuCtx=menuCanvas.getContext('2d');
menuCtx.fillStyle='#f3eee4';
menuCtx.fillRect(0,0,256,384);
menuCtx.fillStyle='#59655f';
menuCtx.textAlign='center';
menuCtx.font='700 28px Inter, sans-serif';
menuCtx.fillText('NOVA',128,92);
menuCtx.font='500 18px Inter, sans-serif';
menuCtx.fillText('COFFEE  •  BAKES',128,134);
menuCtx.strokeStyle='rgba(89,101,95,.34)';
menuCtx.lineWidth=3;
menuCtx.beginPath();
menuCtx.moveTo(54,174);
menuCtx.lineTo(202,174);
menuCtx.stroke();
menuCtx.font='500 16px Inter, sans-serif';
menuCtx.fillText('TODAY  08 — 18',128,226);
const menuTexture=new THREE.CanvasTexture(menuCanvas);
menuTexture.colorSpace=THREE.SRGBColorSpace;
const menuBoard=new THREE.Mesh(
  new THREE.PlaneGeometry(.56,.84),
  new THREE.MeshBasicMaterial({map:menuTexture,toneMapped:false,side:THREE.DoubleSide})
);
menuBoard.position.set(6.78,.62,3.42);
menuBoard.rotation.y=-.18;
scene.add(menuBoard);

const menuLegMat=new THREE.MeshStandardMaterial({color:0x8c8174,roughness:.72});
[-.18,.18].forEach(dx=>{
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.035,.70,.035),menuLegMat);
  leg.position.set(6.78+dx,.30,3.40);
  leg.rotation.z=dx<0?.10:-.10;
  leg.castShadow=true;
  scene.add(leg);
});

const cafeTerrace=new THREE.Mesh(
  new THREE.PlaneGeometry(3.25,6.15),
  new THREE.MeshStandardMaterial({color:0xe9e1d5,roughness:.96})
);
cafeTerrace.rotation.x=-Math.PI/2;
cafeTerrace.position.set(5.95,.046,6.95);
cafeTerrace.receiveShadow=true;
scene.add(cafeTerrace);

const terraceTrimMat=new THREE.MeshStandardMaterial({color:0xcfc4b6,roughness:.92});
[
  [5.95,.050,3.89,3.28,.045],
  [5.95,.050,10.01,3.28,.045],
  [4.34,.050,6.95,.045,6.16],
  [7.56,.050,6.95,.045,6.16]
].forEach(([x,y,z,w,d])=>{
  const trim=new THREE.Mesh(new THREE.BoxGeometry(w,.025,d),terraceTrimMat);
  trim.position.set(x,y,z);
  trim.receiveShadow=true;
  scene.add(trim);
});

const terraceEdgeLine=new THREE.Mesh(
  new THREE.PlaneGeometry(.035,5.75),
  new THREE.MeshBasicMaterial({
    color:0xb5aa9b,
    transparent:true,
    opacity:.40,
    depthWrite:false
  })
);
terraceEdgeLine.rotation.x=-Math.PI/2;
terraceEdgeLine.position.set(4.39,.061,6.95);
scene.add(terraceEdgeLine);

const cafeTableWood=new THREE.MeshStandardMaterial({color:0xc39b78,roughness:.84});
const cafeTableMetal=new THREE.MeshStandardMaterial({color:0x7f8783,roughness:.58,metalness:.30});
const cafeSeatMat=new THREE.MeshStandardMaterial({color:0xe5ddd0,roughness:.88});

function createCafeTable(x,z){
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.055,24),cafeTableWood);
  top.position.set(x,.72,z);
  top.castShadow=true;
  scene.add(top);

  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.035,.05,.68,10),cafeTableMetal);
  stem.position.set(x,.36,z);
  stem.castShadow=true;
  scene.add(stem);

  [-.52,.52].forEach(side=>{
    const seat=new THREE.Mesh(new THREE.BoxGeometry(.34,.06,.34),cafeSeatMat);
    seat.position.set(x+side,.46,z);
    seat.castShadow=true;
    scene.add(seat);

    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.025,.03,.43,8),cafeTableMetal);
    leg.position.set(x+side,.23,z);
    leg.castShadow=true;
    scene.add(leg);
  });
}
createCafeTable(5.9,5.7);
createCafeTable(5.9,8.2);

const terracePot=new THREE.Mesh(
  new THREE.CylinderGeometry(.15,.12,.22,14),
  new THREE.MeshStandardMaterial({color:0xb98f76,roughness:.88})
);
terracePot.position.set(6.72,.16,7.05);
terracePot.castShadow=true;
scene.add(terracePot);
const terracePlantMat=new THREE.MeshStandardMaterial({color:0x789b70,roughness:.95});
for(let i=0;i<4;i++){
  const leaf=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),terracePlantMat);
  leaf.scale.set(.75,1.25,.55);
  leaf.position.set(6.72+(i-1.5)*.055,.34+(i%2)*.045,7.05+(i%2?-.03:.03));
  leaf.rotation.z=(i-1.5)*.34;
  leaf.castShadow=true;
  scene.add(leaf);
}

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

[-9.5,8.7].forEach(z=>{
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
bin.position.set(6.85,.36,-7.0);
bin.castShadow=true;
scene.add(bin);

function createAttachedContactShadow(parent,w,d,opacity=.08){
  const c=document.createElement('canvas');
  c.width=96;
  c.height=96;
  const g=c.getContext('2d');
  const gradient=g.createRadialGradient(48,48,8,48,48,46);
  gradient.addColorStop(0,'rgba(0,0,0,'+opacity.toFixed(3)+')');
  gradient.addColorStop(.52,'rgba(0,0,0,'+(opacity*.44).toFixed(3)+')');
  gradient.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=gradient;
  g.fillRect(0,0,96,96);

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
  shadow.position.y=.031;
  shadow.renderOrder=1;
  parent.add(shadow);
  return shadow;
}

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

const parkedCars=[];
function createParkedCar(x,z,color,assetVariant='primary'){
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.48,metalness:.12});
  const glassMat=new THREE.MeshStandardMaterial({color:0x8ca1a3,roughness:.28,metalness:.12});
  const rubberMat=new THREE.MeshStandardMaterial({color:0x343839,roughness:.92});
  const trimMat=new THREE.MeshStandardMaterial({color:0xa9afac,roughness:.50,metalness:.26});
  const lampMat=new THREE.MeshBasicMaterial({color:0xf2e8d2,toneMapped:false});
  const tailMat=new THREE.MeshBasicMaterial({color:0xa96a60,toneMapped:false});

  const group=new THREE.Group();
  const body=new THREE.Mesh(new THREE.BoxGeometry(1.62,.40,3.22),bodyMat);
  body.position.y=.45;
  body.castShadow=true;
  body.receiveShadow=true;
  group.add(body);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.34,.46,1.62),glassMat);
  cabin.position.set(0,.82,-.10);
  cabin.castShadow=true;
  group.add(cabin);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.46,.13,.78),bodyMat);
  hood.position.set(0,.66,1.15);
  hood.castShadow=true;
  group.add(hood);

  const frontBumper=new THREE.Mesh(new THREE.BoxGeometry(1.42,.08,.10),trimMat);
  frontBumper.position.set(0,.35,1.64);
  group.add(frontBumper);
  const rearBumper=frontBumper.clone();
  rearBumper.position.z=-1.64;
  group.add(rearBumper);

  [-.86,.86].forEach(wx=>{
    [-1.02,1.02].forEach(wz=>{
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.235,.235,.13,18),rubberMat);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(wx,.27,wz);
      wheel.castShadow=true;
      group.add(wheel);
    });
  });

  [-.46,.46].forEach(side=>{
    const headLamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.09,.025),lampMat);
    headLamp.position.set(side,.49,1.616);
    group.add(headLamp);
    const rearLamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.08,.025),tailMat);
    rearLamp.position.set(side,.47,-1.616);
    group.add(rearLamp);

    const mirror=new THREE.Mesh(new THREE.BoxGeometry(.12,.07,.16),trimMat);
    mirror.position.set(side*1.14,.80,.32);
    group.add(mirror);
  });

  const parkedIndex=parkedCars.length;
  group.position.set(x+(parkedIndex===0?-.05:.06),0,z);
  group.rotation.y=parkedIndex===0?-.018:.024;
  scene.add(group);
  const placeholderChildren=[...group.children];
  // Keep the legacy procedural car out of the first painted frame. It is only
  // revealed again if every authored vehicle asset for this slot fails.
  placeholderChildren.forEach(child=>{child.visible=false;});
  parkedCars.push({
    group,
    color,
    assetVariant,
    placeholderChildren,
    assetRoot:null
  });
  return group;
}
createParkedCar(-3.55,-8.5,0xa0adb0,'primary');
createContactShadow(-3.55,-8.5,2.0,3.8,.13);
createParkedCar(-3.55,8.1,0xcabdab,'secondary');
createContactShadow(-3.55,8.1,2.0,3.8,.13);
createContactShadow(6.15,-5.55,2.05,.85,.085);
createContactShadow(5.9,5.7,1.65,1.12,.075);
createContactShadow(5.9,8.2,1.65,1.12,.075);
createContactShadow(6.25,-1.72,2.75,1.18,.080);
createContactShadow(2.0,-1.6,.92,.58,.105);

const ambientWalkers=[];
function createAmbientWalker(x,z,direction,color,speed=.58,assetVariant='primary'){
  const group=new THREE.Group();
  const cloth=new THREE.MeshStandardMaterial({color,roughness:.86});
  const skin=new THREE.MeshStandardMaterial({color:0xc69c83,roughness:.82});
  const dark=new THREE.MeshStandardMaterial({color:0x3f474b,roughness:.88});

  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.11,.42,5,10),cloth);
  torso.position.y=1.08;
  torso.castShadow=true;
  group.add(torso);

  const head=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),skin);
  head.position.y=1.48;
  head.castShadow=true;
  group.add(head);

  [-1,1].forEach(side=>{
    const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.055,.44,5,8),dark);
    leg.position.set(side*.075,.54,0);
    leg.castShadow=true;
    group.add(leg);
  });

  group.position.set(x,0,z);
  group.scale.setScalar(.76);
  scene.add(group);
  const placeholderChildren=[...group.children];
  // Avoid the old mannequin pass flashing while the GLB walkers download.
  placeholderChildren.forEach(child=>{child.visible=false;});
  ambientWalkers.push({
    group,
    direction,
    speed,
    baseSpeed:speed,
    assetVariant,
    baseX:x,
    headingBias:(ambientWalkers.length-2)*.014,
    modelYawOffset:0,
    idleFacingBias:(ambientWalkers.length%2===0?1:-1)*(.035+ambientWalkers.length*.006),
    pacePhase:Math.random()*Math.PI*2,
    phase:Math.random()*Math.PI*2,
    strollOffset:ambientWalkers.length*6.25+2.5,
    motionState:'walk',
    placeholderChildren,
    assetRoot:null,
    mixer:null
  });
}

createAmbientWalker(4.95,-15.8,1,0xa98f82,.53,'primary');
createAmbientWalker(6.15,16.6,-1,0x718692,.59,'secondary');
createAmbientWalker(5.45,13.5,-1,0x8d9a73,.50,'tertiary');
createAmbientWalker(4.72,-24.8,1,0x8c8580,.55,'quaternary');
createAmbientWalker(6.38,24.6,-1,0x7e8982,.48,'quinary');

const movingTraffic=[];
function createTrafficCar(x,z,color,speed,assetVariant='primary'){
  const bodyMat=new THREE.MeshStandardMaterial({color,roughness:.42,metalness:.14});
  const glassMat=new THREE.MeshStandardMaterial({color:0x7f969b,roughness:.26,metalness:.14});
  const rubberMat=new THREE.MeshStandardMaterial({color:0x2f3334,roughness:.92});
  const lampMat=new THREE.MeshBasicMaterial({color:0xf3ead3,toneMapped:false});
  const tailMat=new THREE.MeshBasicMaterial({color:0xb55f55,toneMapped:false});
  const group=new THREE.Group();
  const wheels=[];

  const body=new THREE.Mesh(new THREE.BoxGeometry(1.46,.34,2.72),bodyMat);
  body.position.y=.40;
  body.castShadow=true;
  group.add(body);

  const hood=new THREE.Mesh(new THREE.BoxGeometry(1.34,.13,.66),bodyMat);
  hood.position.set(0,.61,1.05);
  hood.castShadow=true;
  group.add(hood);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.20,.40,1.20),glassMat);
  cabin.position.set(0,.73,-.18);
  cabin.castShadow=true;
  group.add(cabin);

  [-.76,.76].forEach(wx=>{
    [-.88,.88].forEach(wz=>{
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.205,.205,.13,16),rubberMat);
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(wx,.245,wz);
      wheel.castShadow=true;
      group.add(wheel);
      wheels.push(wheel);
    });
  });

  [-.43,.43].forEach(side=>{
    const headLamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.10,.035),lampMat);
    headLamp.position.set(side,.46,1.375);
    group.add(headLamp);

    const tailLamp=new THREE.Mesh(new THREE.BoxGeometry(.22,.09,.035),tailMat);
    tailLamp.position.set(side,.45,-1.375);
    group.add(tailLamp);
  });

  group.position.set(x,0,z);
  if(speed<0) group.rotation.y=Math.PI;
  scene.add(group);
  const placeholderChildren=[...group.children];
  placeholderChildren.forEach(child=>{child.visible=false;});
  movingTraffic.push({
    group,
    speed,
    baseSpeed:speed,
    baseX:x,
    assetVariant,
    motionPhase:Math.random()*Math.PI*2,
    wheels,
    placeholderChildren,
    assetRoot:null,
    assetWheels:[]
  });
}

createTrafficCar(-9.2,-28,0xd4d0c7,1.64,'primary');
createTrafficCar(-5.9,27,0x8a9da6,-1.30,'secondary');

const storefrontReveal=new THREE.Mesh(
  new THREE.PlaneGeometry(.86,61.5),
  new THREE.MeshBasicMaterial({
    color:0x5e625e,
    transparent:true,
    opacity:.055,
    depthWrite:false
  })
);
storefrontReveal.rotation.x=-Math.PI/2;
storefrontReveal.position.set(7.88,.049,-5);
scene.add(storefrontReveal);

const storefrontShade=new THREE.Mesh(
  new THREE.PlaneGeometry(1.95,64),
  new THREE.MeshBasicMaterial({
    color:0x806f61,
    transparent:true,
    opacity:.055,
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
const miraBaseYaw=-.16;
mira.rotation.y=miraBaseYaw;
mira.scale.setScalar(1.02);
// The authored character is the normal path. Keep the procedural Mira hidden
// from frame zero so there is no visible "old -> new" character swap.
miraRig.visible=false;
scene.add(mira);

const WORLD_GLB_ASSETS={
  // Pinned assets keep the prototype deterministic while still replacing the
  // primitive placeholders with real authored meshes and skeletal animation.
  // Quaternius / Kay Lousberg models are CC0; pinned to the source revision
  // used by the public demo so the street does not drift between releases.
  carPrimary:'https://cdn.jsdelivr.net/gh/halcyon-video/halcyon-video@57cb937f18bb162706c91d0a250258685928ec2a/public/models/car_sedan.glb',
  carSecondary:'https://cdn.jsdelivr.net/gh/halcyon-video/halcyon-video@57cb937f18bb162706c91d0a250258685928ec2a/public/models/car_hatchback.glb',
  carFallback:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r159/examples/models/gltf/ferrari.glb',
  // Quaternius civilian characters are CC0 and read as ordinary pedestrians,
  // not armored / robotic demo characters.
  pedestrianPrimary:'https://cdn.jsdelivr.net/gh/MrArun005/3D-Games-AmusementPark@2d827a479ef7a44938372ca07d24c0faffb43b1d/public/models/characters/civilian_man.glb',
  pedestrianSecondary:'https://cdn.jsdelivr.net/gh/MrArun005/3D-Games-AmusementPark@2d827a479ef7a44938372ca07d24c0faffb43b1d/public/models/characters/civilian_longsleeve.glb',
  pedestrianTertiary:'https://cdn.jsdelivr.net/gh/MrArun005/3D-Games-AmusementPark@2d827a479ef7a44938372ca07d24c0faffb43b1d/public/models/characters/civilian_woman.glb',
  pedestrianQuaternary:'https://cdn.jsdelivr.net/gh/MrArun005/3D-Games-AmusementPark@2d827a479ef7a44938372ca07d24c0faffb43b1d/public/models/characters/civilian_suit.glb',
  pedestrianQuinary:'https://cdn.jsdelivr.net/gh/MrArun005/3D-Games-AmusementPark@2d827a479ef7a44938372ca07d24c0faffb43b1d/public/models/characters/civilian_woman2.glb',
  mira:'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r159/examples/models/gltf/Michelle.glb'
};
const worldAssetMixers=[];
let worldGLBLoadStarted=false;
let worldCoreAssetsReady=false;
let miraGLBRoot=null;
let worldEnvironmentTexture=null;

function ensureWorldAssetEnvironment(){
  if(worldEnvironmentTexture || !window.RoomEnvironment) return;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const envScene=new window.RoomEnvironment();
  const target=pmrem.fromScene(envScene,.035);
  worldEnvironmentTexture=target.texture;
  pmrem.dispose();
}

function cloneAssetScene(source){
  if(window.cloneGLTFScene) return window.cloneGLTFScene(source);
  return source.clone(true);
}

function prepareImportedModel(root,envIntensity=.42){
  const maxAnisotropy=Math.min(renderer.capabilities.getMaxAnisotropy?.() || 1,8);
  root.traverse(object=>{
    if(!object.isMesh) return;
    object.castShadow=true;
    object.receiveShadow=true;
    if(object.isSkinnedMesh) object.frustumCulled=false;
    if(Array.isArray(object.material)){
      object.material=object.material.map(material=>material?.clone?.() || material);
    }else if(object.material?.clone){
      object.material=object.material.clone();
    }

    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(!material) return;
      if(worldEnvironmentTexture && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)){
        material.envMap=worldEnvironmentTexture;
        material.envMapIntensity=envIntensity;
      }
      ['map','normalMap','roughnessMap','metalnessMap'].forEach(key=>{
        const texture=material[key];
        if(texture?.isTexture) texture.anisotropy=maxAnisotropy;
      });
      material.needsUpdate=true;
    });
  });
}

function normalizeHumanAsset(root,targetHeight){
  root.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(root);
  const size=box.getSize(new THREE.Vector3());
  if(size.y>0){
    root.scale.multiplyScalar(targetHeight/size.y);
  }
  root.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(root);
  const center=box.getCenter(new THREE.Vector3());
  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=box.min.y;
  root.updateMatrixWorld(true);
}

function normalizeCarAsset(root,targetLength=3.85){
  root.updateMatrixWorld(true);
  let box=new THREE.Box3().setFromObject(root);
  let size=box.getSize(new THREE.Vector3());

  // The street lanes run along Z. Turn assets whose long axis arrives on X.
  if(size.x>size.z){
    root.rotation.y+=Math.PI*.5;
    root.updateMatrixWorld(true);
    box=new THREE.Box3().setFromObject(root);
    size=box.getSize(new THREE.Vector3());
  }

  const horizontalLength=Math.max(size.x,size.z);
  if(horizontalLength>0) root.scale.multiplyScalar(targetLength/horizontalLength);

  root.updateMatrixWorld(true);
  box=new THREE.Box3().setFromObject(root);
  const center=box.getCenter(new THREE.Vector3());
  root.position.x-=center.x;
  root.position.z-=center.z;
  root.position.y-=box.min.y-.015;
  root.updateMatrixWorld(true);
}

function tuneVehicleAsset(root,bodyColor){
  const bodyTint=new THREE.Color(bodyColor);
  const mutedTint=bodyTint.clone().lerp(new THREE.Color(0xd9d8d1),.16);
  const wheels=[];

  root.traverse(object=>{
    if(!object.isMesh) return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(!material) return;
      const key=((object.name||'')+' '+(material.name||'')).toLowerCase();

      if(/glass|window|windshield|windscreen/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xb9cbcc),.48);
        material.transparent=true;
        material.opacity=.76;
        material.roughness=.18;
        if('metalness' in material) material.metalness=.03;
        material.depthWrite=false;
      }else if(/head.?light|lamp_front|front.?light/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xf2ead8),.72);
        if(material.emissive) material.emissive.set(0x8f856d);
        if('emissiveIntensity' in material) material.emissiveIntensity=.08;
        material.roughness=.22;
      }else if(/tail.?light|rear.?light|brake/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0x9f665e),.72);
        if(material.emissive) material.emissive.set(0x5d211d);
        if('emissiveIntensity' in material) material.emissiveIntensity=.06;
        material.roughness=.26;
      }else if(/tire|tyre|rubber/.test(key)){
        if(material.color) material.color.set(0x2d3131);
        material.roughness=.88;
      }else if(/wheel|rim/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0x9ba09d),.56);
        material.roughness=.42;
        if('metalness' in material) material.metalness=.46;
      }else if(/body|paint|carpaint|car_paint|coachwork|exterior/.test(key)){
        if(material.color) material.color.lerp(mutedTint,.72);
        material.roughness=Math.max(.28,Math.min(material.roughness ?? .34,.42));
        if('metalness' in material) material.metalness=Math.min(material.metalness ?? .16,.22);
      }else if(material.color){
        const hsl={h:0,s:0,l:0};
        material.color.getHSL(hsl);
        if(hsl.s>.46 && hsl.l>.12){
          material.color.lerp(mutedTint,.34);
        }
      }
      material.needsUpdate=true;
    });

    const meshKey=(object.name||'').toLowerCase();
    if(/wheel|tire|tyre/.test(meshKey)) wheels.push(object);
  });

  // These source GLBs do not guarantee wheel-mesh pivots at the wheel hubs.
  // Rotating a mesh whose geometry is baked around a body/root pivot makes the
  // wheel orbit the car ("flying wheels"). Keep authored wheels static rather
  // than applying unsafe runtime rotation; the vehicle translation still sells
  // the slow street traffic motion.
  return [];
}

function tunePedestrianAsset(root,index=0){
  root.traverse(object=>{
    if(!object.isMesh) return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(!material) return;
      if('roughness' in material){
        material.roughness=THREE.MathUtils.clamp(material.roughness ?? .78,.66,.92);
      }
      if('metalness' in material){
        material.metalness=Math.min(material.metalness ?? 0,.04);
      }
      material.needsUpdate=true;
    });
  });
}

function loadGLB(loader,url){
  return new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));
}

function attachCarAsset(entry,source,index=0,targetLength=3.85){
  const root=source.clone(true);
  prepareImportedModel(root,.72);
  normalizeCarAsset(root,targetLength);
  const palette=[0xbfc3c0,0xd5ccbe,0xaebdc0,0xc7c6bf];
  entry.assetWheels=tuneVehicleAsset(root,entry.color ?? palette[index%palette.length]);
  entry.placeholderChildren?.forEach(child=>{child.visible=false;});
  entry.group.add(root);
  entry.assetRoot=root;
  entry.assetBaseY=root.position.y;
  if(entry.baseSpeed!==undefined && !entry.contactShadow){
    entry.contactShadow=createAttachedContactShadow(entry.group,1.82,targetLength*.96,.075);
  }
}

function attachWalkerAsset(entry,source,animations,index){
  const root=cloneAssetScene(source);
  prepareImportedModel(root,.28);
  normalizeHumanAsset(root,[1.74,1.69,1.66,1.78,1.63][index%5]);
  tunePedestrianAsset(root,index);
  root.rotation.y=(entry.direction>0?0:Math.PI)+entry.headingBias+(entry.modelYawOffset||0);
  entry.placeholderChildren?.forEach(child=>{child.visible=false;});
  entry.group.scale.setScalar(1);
  entry.group.add(root);
  entry.assetRoot=root;
  if(!entry.contactShadow){
    entry.contactShadow=createAttachedContactShadow(entry.group,.48,.34,.072);
  }

  const walkClip=
    animations.find(clip=>/walk$/i.test(clip.name)) ||
    animations.find(clip=>/walk/i.test(clip.name)) ||
    (animations.length===1?animations[0]:null);
  const idleClip=
    animations.find(clip=>/idle$/i.test(clip.name)) ||
    animations.find(clip=>/idle|stand/i.test(clip.name));

  if(walkClip){
    const mixer=new THREE.AnimationMixer(root);
    const action=mixer.clipAction(walkClip);
    action.setEffectiveTimeScale(THREE.MathUtils.clamp(entry.speed/.72,.72,.98));
    action.play();
    action.time=(index*.73+entry.phase*.19)%Math.max(.01,walkClip.duration);
    entry.mixer=mixer;
    entry.walkAction=action;

    if(idleClip){
      const idleAction=mixer.clipAction(idleClip);
      idleAction.enabled=true;
      idleAction.setEffectiveWeight(0);
      idleAction.play();
      entry.idleAction=idleAction;
    }

    worldAssetMixers.push(mixer);
  }else{
    entry.speed=0;
    entry.baseSpeed=0;
  }
}

function setWalkerMotionState(walker,nextState){
  if(walker.motionState===nextState) return;
  const fade=.42;

  if(nextState==='idle' && walker.idleAction && walker.walkAction){
    walker.walkAction.fadeOut(fade);
    walker.idleAction
      .reset()
      .setEffectiveTimeScale(.92)
      .setEffectiveWeight(1)
      .fadeIn(fade)
      .play();
  }else if(nextState==='walk' && walker.walkAction){
    walker.idleAction?.fadeOut(fade);
    walker.walkAction
      .reset()
      .setEffectiveWeight(1)
      .fadeIn(fade)
      .play();
  }

  walker.motionState=nextState;
}

function attachMiraAsset(source,animations){
  const root=cloneAssetScene(source);
  prepareImportedModel(root,.34);
  normalizeHumanAsset(root,1.72);
  root.rotation.y=Math.PI-.12;
  root.position.z=.015;
  miraRig.visible=false;
  mira.add(root);
  miraGLBRoot=root;
  if(!mira.userData.glbContactShadow){
    mira.userData.glbContactShadow=createAttachedContactShadow(mira,.62,.42,.065);
  }

  // Only play an explicitly named idle animation. A dancing/run clip would
  // make the central character less believable than a restrained static pose.
  const idleClip=animations.find(clip=>/idle|stand|breath/i.test(clip.name));
  if(idleClip){
    const mixer=new THREE.AnimationMixer(root);
    const idleAction=mixer.clipAction(idleClip);
    idleAction.setEffectiveTimeScale(.82);
    idleAction.play();
    worldAssetMixers.push(mixer);
  }
}

function setPlaceholderVisibility(entries,visible){
  entries.forEach(entry=>{
    entry.placeholderChildren?.forEach(child=>{child.visible=visible;});
  });
}

function carTargetLength(entry){
  const parked=entry.baseSpeed===undefined;
  return entry.assetVariant==='secondary'
    ? (parked?4.16:4.02)
    : (parked?4.52:4.42);
}

async function initWorldGLBAssets(){
  if(worldGLBLoadStarted || !window.GLTFLoader) return;
  worldGLBLoadStarted=true;
  ensureWorldAssetEnvironment();
  const loader=new window.GLTFLoader();
  const vehicleEntries=[...parkedCars,...movingTraffic];

  // Load and attach the two visible car variants independently. Previously all
  // nine world GLBs were held behind one Promise.allSettled(), so even a slow
  // pedestrian download delayed the cars and Mira.
  async function loadCarVariant(variant,url){
    try{
      const result=await loadGLB(loader,url);
      vehicleEntries.forEach((entry,index)=>{
        if(entry.assetVariant===variant && !entry.assetRoot){
          attachCarAsset(entry,result.scene,index,carTargetLength(entry));
        }
      });
      return result;
    }catch(error){
      console.warn('Vehicle GLB failed:',variant,error);
      return null;
    }
  }

  const primaryCarTask=loadCarVariant('primary',WORLD_GLB_ASSETS.carPrimary);
  const secondaryCarTask=loadCarVariant('secondary',WORLD_GLB_ASSETS.carSecondary);

  const carTask=Promise.all([primaryCarTask,secondaryCarTask]).then(async ([primary,secondary])=>{
    if(primary && secondary) return;

    try{
      const fallback=await loadGLB(loader,WORLD_GLB_ASSETS.carFallback);
      vehicleEntries.forEach((entry,index)=>{
        const variantLoaded=entry.assetVariant==='secondary'?secondary:primary;
        if(!variantLoaded && !entry.assetRoot){
          attachCarAsset(entry,fallback.scene,index,carTargetLength(entry));
        }
      });
    }catch(error){
      console.warn('Vehicle fallback GLB failed; revealing procedural fallback.',error);
      vehicleEntries
        .filter(entry=>!entry.assetRoot)
        .forEach(entry=>entry.placeholderChildren?.forEach(child=>{child.visible=true;}));
    }
  });

  const pedestrianDefinitions=[
    ['primary',WORLD_GLB_ASSETS.pedestrianPrimary],
    ['secondary',WORLD_GLB_ASSETS.pedestrianSecondary],
    ['tertiary',WORLD_GLB_ASSETS.pedestrianTertiary],
    ['quaternary',WORLD_GLB_ASSETS.pedestrianQuaternary],
    ['quinary',WORLD_GLB_ASSETS.pedestrianQuinary]
  ];
  const pedestrianSources={};

  const pedestrianTask=Promise.all(pedestrianDefinitions.map(async ([variant,url])=>{
    try{
      const result=await loadGLB(loader,url);
      pedestrianSources[variant]=result;
      ambientWalkers.forEach((entry,index)=>{
        if(entry.assetVariant===variant && !entry.assetRoot){
          attachWalkerAsset(entry,result.scene,result.animations,index);
        }
      });
    }catch(error){
      console.warn('Pedestrian GLB failed:',variant,error);
    }
  })).then(()=>{
    const fallback=Object.values(pedestrianSources)[0] || null;
    ambientWalkers.forEach((entry,index)=>{
      if(entry.assetRoot) return;
      if(fallback){
        attachWalkerAsset(entry,fallback.scene,fallback.animations,index);
      }else{
        entry.placeholderChildren?.forEach(child=>{child.visible=true;});
      }
    });
  });

  const miraTask=loadGLB(loader,WORLD_GLB_ASSETS.mira)
    .then(result=>attachMiraAsset(result.scene,result.animations))
    .catch(error=>{
      console.warn('Mira GLB failed; revealing procedural fallback.',error);
      miraRig.visible=true;
    });

  // The player can enter as soon as the focal character and cars have settled.
  // Ambient walkers continue streaming independently instead of blocking entry.
  await Promise.allSettled([carTask,miraTask]);
  worldCoreAssetsReady=true;
  window.dispatchEvent(new Event('world-core-assets-ready'));

  await Promise.allSettled([pedestrianTask]);
  window.dispatchEvent(new Event('world-assets-ready'));
}

if(window.GLTFLoader){
  initWorldGLBAssets();
}else{
  window.addEventListener('gltf-loader-ready',initWorldGLBAssets,{once:true});
}

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
  cameraFovTarget=67.5;
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

  tabletOpen=false; cameraFovTarget=69.5;
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
if(startBtn){
  const unlockWorldEntry=()=>{
    startBtn.disabled=false;
    startBtn.removeAttribute('aria-busy');
    startBtn.textContent='Click to enter world';
  };

  if(worldCoreAssetsReady){
    unlockWorldEntry();
  }else{
    startBtn.disabled=true;
    startBtn.setAttribute('aria-busy','true');
    startBtn.textContent='Loading city…';
    window.addEventListener('world-core-assets-ready',unlockWorldEntry,{once:true});
  }

  startBtn.addEventListener('click',()=>{
    if(!worldCoreAssetsReady) return;
    started=true;
    startOverlay?.classList.add('hidden');
    setTimeout(()=>canvas.requestPointerLock?.(),250);
  });
}

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
  dappleTexture.offset.x=Math.sin(t*.052)*.0022;
  dappleTexture.offset.y=Math.cos(t*.044)*.0015;
  sunHaze.material.opacity=.80+Math.sin(t*.11)*.018;
  sun.intensity=3.03+Math.sin(t*.045)*.025;

  skyClouds.forEach((cloud,index)=>{
    cloud.position.x+=dt*(.055+index*.018);
    if(cloud.position.x>46) cloud.position.x=-46-index*7;
  });

  glassReflectionTexture.offset.x=(Math.sin(t*.034)*.013+.013)%1;

  worldAssetMixers.forEach(mixer=>mixer.update(dt));

  movingTraffic.forEach((traffic,index)=>{
    const drift=1+Math.sin(t*.19+traffic.motionPhase)*.028;
    traffic.speed=traffic.baseSpeed*drift;
    traffic.group.position.z+=traffic.speed*dt;
    traffic.group.position.x=traffic.baseX+Math.sin(t*.16+traffic.motionPhase)*.035;
    if(traffic.assetRoot){
      traffic.assetRoot.position.y=traffic.assetBaseY+Math.sin(t*2.1+traffic.motionPhase)*.0022;
      traffic.assetRoot.rotation.z=Math.sin(t*.31+traffic.motionPhase)*.0018;
    }
    const spin=traffic.speed*dt*2.8;
    const rollingWheels=traffic.assetWheels?.length?traffic.assetWheels:traffic.wheels;
    rollingWheels?.forEach(wheel=>wheel.rotation.x-=spin);
    if(traffic.speed>0 && traffic.group.position.z>38) traffic.group.position.z=-38-index*5;
    if(traffic.speed<0 && traffic.group.position.z<-38) traffic.group.position.z=38+index*5;
  });

  ambientWalkers.forEach((walker,index)=>{
    const pace=1+Math.sin(t*.21+walker.pacePhase)*.038;
    const cycleLength=18.5+index*2.35;
    const cycle=(t+walker.strollOffset)%cycleLength;
    const farFromMira=Math.abs(walker.group.position.z-mira.position.z)>9.0;
    const pauseDuration=1.45+(index%3)*.38;
    const shouldPause=Boolean(
      walker.assetRoot &&
      walker.idleAction &&
      farFromMira &&
      cycle>cycleLength-pauseDuration
    );

    setWalkerMotionState(walker,shouldPause?'idle':'walk');

    const targetSpeed=shouldPause?0:walker.baseSpeed*pace;
    walker.speed=THREE.MathUtils.lerp(
      walker.speed,
      targetSpeed,
      1-Math.pow(.035,dt)
    );
    walker.group.position.z+=walker.direction*walker.speed*dt;
    walker.phase+=dt*(3.8+index*.35)*Math.max(.18,pace);

    if(walker.assetRoot){
      walker.group.position.y=0;
      walker.group.position.x=walker.baseX+Math.sin(t*.27+walker.pacePhase)*.030;
      const idleYaw=walker.motionState==='idle'?walker.idleFacingBias:0;
      walker.group.rotation.y=THREE.MathUtils.lerp(
        walker.group.rotation.y,
        idleYaw,
        1-Math.pow(.12,dt)
      );
      walker.group.rotation.z=0;
      if(walker.walkAction && walker.motionState==='walk'){
        walker.walkAction.setEffectiveTimeScale(
          THREE.MathUtils.clamp(Math.max(.01,walker.speed)/.70,.68,.90)
        );
      }
    }else{
      walker.group.position.y=Math.abs(Math.sin(walker.phase))*0.012;
      walker.group.rotation.z=Math.sin(walker.phase)*.012;
    }

    if(walker.direction>0 && walker.group.position.z>31){
      walker.group.position.z=-31-index*1.25;
      walker.speed=walker.baseSpeed;
      setWalkerMotionState(walker,'walk');
    }
    if(walker.direction<0 && walker.group.position.z<-30){
      walker.group.position.z=32+index*1.25;
      walker.speed=walker.baseSpeed;
      setWalkerMotionState(walker,'walk');
    }
  });

  // Human idle: breathing, tiny weight shift and occasional attention toward player.
  const miraToCameraX=camera.position.x-mira.position.x;
  const miraToCameraZ=camera.position.z-mira.position.z;
  const miraDistance=Math.hypot(miraToCameraX,miraToCameraZ);
  const miraLookYaw=THREE.MathUtils.clamp(
    Math.atan2(miraToCameraX,miraToCameraZ),
    miraBaseYaw-.22,
    miraBaseYaw+.20
  );
  const miraYawTarget=miraDistance<12?miraLookYaw:miraBaseYaw;
  mira.rotation.y=THREE.MathUtils.lerp(
    mira.rotation.y,
    miraYawTarget,
    1-Math.pow(.08,dt)
  );

  if(miraGLBRoot){
    miraGLBRoot.position.y=Math.sin(t*.74)*.003;
    miraGLBRoot.rotation.z=Math.sin(t*.42)*.0028;
    miraGLBRoot.rotation.x=Math.sin(t*.29)*.0018;
  }
  const idleBreath=Math.sin(t*1.55);
  if(!miraGLBRoot){
    torso.scale.y=1+idleBreath*.009;
    torso.position.y=1.25+idleBreath*.004;
    miraRig.position.y=Math.sin(t*.72)*.003;
    miraRig.rotation.z=Math.sin(t*.48)*.006;
    head.rotation.y=Math.sin(t*.31)*.07;
  }
  const replyRemaining=Math.max(0,miraReplyMotionUntil-performance.now());
  const replyEnvelope=Math.min(1,replyRemaining/280, (1200-replyRemaining)/220);
  const replyNod=replyRemaining>0 ? Math.sin((1200-replyRemaining)*.022)*.055*Math.max(0,replyEnvelope) : 0;
  if(!miraGLBRoot) head.rotation.x=Math.sin(t*.43)*.018+replyNod;

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

  if(!miraGLBRoot){
    lFore.rotation.x=-.05+Math.sin(t*.62)*.012;
    rFore.rotation.x=-.05-Math.sin(t*.62)*.012;
  }

  tablet3D?.render(t,tabletOpen);
  renderer.render(scene,camera);
  requestAnimationFrame(animate);
}
animate();

window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);tablet3D?.resize();});
