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

const skyLight = new THREE.HemisphereLight(0xeaf5f7, 0xb9ad98, 1.70);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xfff2dc, 2.82);
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
sun.shadow.radius = 3.8;
scene.add(sun);

const daylightFill = new THREE.DirectionalLight(0xd4e3ed, .54);
daylightFill.position.set(10, 8, -12);
scene.add(daylightFill);

const shopBounce = new THREE.DirectionalLight(0xffe5c9, .18);
shopBounce.position.set(9,5,6);
scene.add(shopBounce);

const faceLight = new THREE.SpotLight(0xffe7d2, 5.8, 9, Math.PI * .22, .78, 1.5);
faceLight.position.set(1.1, 3.8, 3.2);
faceLight.target.position.set(2.0, 1.45, -1.6);
scene.add(faceLight, faceLight.target);

// A broad, very soft bounce near Mira separates her from the storefront
// without reading like a game spotlight. Its strength is modulated by player
// distance later so she remains integrated with the street at long range.
const miraPresenceLight=new THREE.PointLight(0xffe3cb,.34,5.4,2.0);
miraPresenceLight.position.set(2.75,2.05,-.85);
scene.add(miraPresenceLight);

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
    g.fillStyle='#61696a';
    g.fillRect(0,0,size,size);

    // Low-frequency variation stops the road reading as one flat grey slab.
    for(let i=0;i<42;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const radius=12+rnd()*44;
      const grad=g.createRadialGradient(x,y,0,x,y,radius);
      const light=rnd()>.5;
      grad.addColorStop(0,light?'rgba(118,124,124,.050)':'rgba(31,37,38,.045)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-radius,y-radius,radius*2,radius*2);
    }

    for(let i=0;i<1350;i++){
      const v=64+Math.floor(rnd()*54);
      const a=.016+rnd()*.040;
      g.fillStyle='rgba('+v+','+(v+2)+','+(v+2)+','+a.toFixed(3)+')';
      const r=.28+rnd()*1.20;
      g.fillRect(rnd()*size,rnd()*size,r,r);
    }

    for(let i=0;i<18;i++){
      g.strokeStyle='rgba(40,46,47,'+(.020+rnd()*.026).toFixed(3)+')';
      g.lineWidth=.35+rnd()*.65;
      g.beginPath();
      const x=rnd()*size;
      const y=rnd()*size;
      g.moveTo(x,y);
      g.bezierCurveTo(
        x+(rnd()-.5)*18,y+(rnd()-.5)*16,
        x+(rnd()-.5)*34,y+(rnd()-.5)*26,
        x+(rnd()-.5)*46,y+(rnd()-.5)*34
      );
      g.stroke();
    }
  }else{
    g.fillStyle='#dedbd0';
    g.fillRect(0,0,size,size);

    for(let i=0;i<34;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const radius=14+rnd()*48;
      const grad=g.createRadialGradient(x,y,0,x,y,radius);
      grad.addColorStop(0,rnd()>.5?'rgba(195,189,178,.050)':'rgba(244,239,226,.055)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-radius,y-radius,radius*2,radius*2);
    }

    for(let i=0;i<980;i++){
      const warm=rnd()>.56;
      const base=warm?196:210;
      const a=.012+rnd()*.026;
      g.fillStyle='rgba('+(base+8)+','+(base+5)+','+base+','+a.toFixed(3)+')';
      g.beginPath();
      g.arc(rnd()*size,rnd()*size,.24+rnd()*.92,0,Math.PI*2);
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

function makeMaterialTexture(kind,seed){
  const size=256;
  const colorCanvas=document.createElement('canvas');
  const bumpCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=size;
  bumpCanvas.width=bumpCanvas.height=size;
  const g=colorCanvas.getContext('2d');
  const b=bumpCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  const palettes={
    stone:['#d7d0c4','#c9c1b5','#e3ddd2'],
    concrete:['#c5c1b8','#b7b2a8','#d0cbc1'],
    wood:['#b58f70','#9f795e','#c39b78'],
    metal:['#8f9895','#7f8986','#a2aaa7']
  };
  const palette=palettes[kind] || palettes.concrete;
  g.fillStyle=palette[0];
  g.fillRect(0,0,size,size);
  b.fillStyle='#808080';
  b.fillRect(0,0,size,size);

  if(kind==='wood'){
    for(let y=0;y<size;y++){
      const wave=Math.sin(y*.14)+Math.sin(y*.037+1.4)*.55;
      const shade=Math.round(128+wave*10);
      g.fillStyle=y%7===0?'rgba(83,55,39,.040)':'rgba(255,241,222,.018)';
      g.fillRect(0,y,size,1);
      b.fillStyle='rgb('+shade+','+shade+','+shade+')';
      b.fillRect(0,y,size,1);
    }
    for(let i=0;i<18;i++){
      const y=rnd()*size;
      g.strokeStyle='rgba(77,48,34,'+(.025+rnd()*.035).toFixed(3)+')';
      g.lineWidth=.45+rnd()*.55;
      g.beginPath();
      g.moveTo(0,y);
      g.bezierCurveTo(64,y+(rnd()-.5)*8,166,y+(rnd()-.5)*12,256,y+(rnd()-.5)*7);
      g.stroke();
    }
  }else if(kind==='metal'){
    for(let x=0;x<size;x++){
      const a=.012+((x%5===0)?.018:0);
      g.fillStyle='rgba(255,255,255,'+a.toFixed(3)+')';
      g.fillRect(x,0,1,size);
      const v=124+(x%7===0?6:0);
      b.fillStyle='rgb('+v+','+v+','+v+')';
      b.fillRect(x,0,1,size);
    }
    for(let i=0;i<120;i++){
      g.fillStyle='rgba(45,52,52,'+(.012+rnd()*.020).toFixed(3)+')';
      g.fillRect(rnd()*size,rnd()*size,.4+rnd()*1.2,.4);
    }
  }else{
    for(let i=0;i<1050;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const r=.25+rnd()*1.15;
      const dark=rnd()>.52;
      g.fillStyle=dark
        ? 'rgba(91,84,75,'+(.010+rnd()*.028).toFixed(3)+')'
        : 'rgba(255,249,238,'+(.012+rnd()*.026).toFixed(3)+')';
      g.beginPath();
      g.arc(x,y,r,0,Math.PI*2);
      g.fill();
      const v=Math.floor(116+rnd()*28);
      b.fillStyle='rgb('+v+','+v+','+v+')';
      b.fillRect(x,y,1+rnd()*1.2,1+rnd()*1.2);
    }

    if(kind==='stone'){
      for(let i=0;i<12;i++){
        const y=rnd()*size;
        g.strokeStyle='rgba(111,101,91,'+(.018+rnd()*.018).toFixed(3)+')';
        g.lineWidth=.35+rnd()*.35;
        g.beginPath();
        g.moveTo(0,y);
        g.bezierCurveTo(72,y+(rnd()-.5)*5,168,y+(rnd()-.5)*6,256,y+(rnd()-.5)*4);
        g.stroke();
      }
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.anisotropy=8;

  return {map,bump};
}

function configureTexturePair(pair,repeatX,repeatY){
  pair.map.repeat.set(repeatX,repeatY);
  pair.bump.repeat.set(repeatX,repeatY);
  return pair;
}

const asphaltTexture=makeSurfaceTexture('asphalt');
asphaltTexture.repeat.set(5,26);
const pavementTexture=makeSurfaceTexture('pavement');
pavementTexture.repeat.set(5,22);

const facadeSurface=configureTexturePair(makeMaterialTexture('stone',0x51a72d31),1.8,15);
const concreteSurface=configureTexturePair(makeMaterialTexture('concrete',0x327c619b),2.2,5.6);
const woodSurface=configureTexturePair(makeMaterialTexture('wood',0x78d0bc53),1.2,5.8);
const metalSurface=configureTexturePair(makeMaterialTexture('metal',0x1165a2ef),5.5,1.2);

const pavementMicroBump=makeMaterialTexture('concrete',0x4d84b271).bump;
pavementMicroBump.repeat.set(8,34);
const roadMicroBump=makeMaterialTexture('concrete',0x93c25f17).bump;
roadMicroBump.repeat.set(9,42);

function makeOrganicTexture(kind,seed){
  const size=256;
  const colorCanvas=document.createElement('canvas');
  const bumpCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=size;
  bumpCanvas.width=bumpCanvas.height=size;
  const g=colorCanvas.getContext('2d');
  const b=bumpCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  if(kind==='bark'){
    g.fillStyle='#9b7b60';
    g.fillRect(0,0,size,size);
    b.fillStyle='#808080';
    b.fillRect(0,0,size,size);

    for(let x=0;x<size;x++){
      const wave=Math.sin(x*.16)+Math.sin(x*.043+1.2)*.55;
      const alpha=.025+Math.abs(wave)*.025;
      g.fillStyle=wave>0
        ? 'rgba(69,45,32,'+alpha.toFixed(3)+')'
        : 'rgba(224,195,157,'+(alpha*.70).toFixed(3)+')';
      g.fillRect(x,0,1,size);
      const v=Math.round(128+wave*17);
      b.fillStyle='rgb('+v+','+v+','+v+')';
      b.fillRect(x,0,1,size);
    }

    for(let i=0;i<55;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const len=10+rnd()*42;
      g.strokeStyle='rgba(61,39,28,'+(.025+rnd()*.040).toFixed(3)+')';
      g.lineWidth=.4+rnd()*.9;
      g.beginPath();
      g.moveTo(x,y);
      g.bezierCurveTo(x+(rnd()-.5)*4,y+len*.35,x+(rnd()-.5)*5,y+len*.72,x+(rnd()-.5)*3,y+len);
      g.stroke();
    }
  }else{
    g.fillStyle='#f0f3e8';
    g.fillRect(0,0,size,size);
    b.fillStyle='#808080';
    b.fillRect(0,0,size,size);

    for(let i=0;i<1700;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const r=.35+rnd()*1.35;
      const warm=rnd()>.66;
      const dark=rnd()>.57;
      g.fillStyle=dark
        ? 'rgba(70,88,62,'+(.018+rnd()*.040).toFixed(3)+')'
        : (warm
          ? 'rgba(213,210,139,'+(.012+rnd()*.028).toFixed(3)+')'
          : 'rgba(255,255,244,'+(.014+rnd()*.030).toFixed(3)+')');
      g.beginPath();
      g.arc(x,y,r,0,Math.PI*2);
      g.fill();

      const v=Math.floor(120+rnd()*20);
      b.fillStyle='rgb('+v+','+v+','+v+')';
      b.fillRect(x,y,1+rnd(),1+rnd());
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.anisotropy=8;
  return {map,bump};
}

const barkSurface=configureTexturePair(makeOrganicTexture('bark',0x829ad73f),2.6,4.8);
const foliageSurface=configureTexturePair(makeOrganicTexture('foliage',0xa1426b8d),2.2,2.2);

function makeMicroBump(seed,repeat=8){
  const size=128;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.fillStyle='#808080';
  g.fillRect(0,0,size,size);
  for(let i=0;i<1600;i++){
    const v=116+Math.floor(rnd()*25);
    g.fillStyle='rgb('+v+','+v+','+v+')';
    const r=.25+rnd()*.85;
    g.fillRect(rnd()*size,rnd()*size,r,r);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeat,repeat);
  texture.anisotropy=8;
  return texture;
}

const vehiclePaintMicroBump=makeMicroBump(0x26a4bd73,10);
const rubberMicroBump=makeMicroBump(0x9f4c713a,6);
const fabricMicroBump=makeMicroBump(0xc72e5b91,18);

function makeFabricColorTexture(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#f1efe9';
  g.fillRect(0,0,size,size);

  for(let y=0;y<size;y+=3){
    g.fillStyle='rgba(92,85,78,'+(.010+(y%9===0?.012:0)).toFixed(3)+')';
    g.fillRect(0,y,size,1);
  }
  for(let x=0;x<size;x+=4){
    g.fillStyle='rgba(255,255,255,.010)';
    g.fillRect(x,0,1,size);
  }

  for(let i=0;i<95;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=2+rnd()*12;
    const ry=1+rnd()*5;
    const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    grad.addColorStop(
      0,
      rnd()>.5
        ? 'rgba(110,94,81,'+(.006+rnd()*.018).toFixed(3)+')'
        : 'rgba(255,250,240,'+(.008+rnd()*.018).toFixed(3)+')'
    );
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;
    g.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(2.4,1.2);
  texture.anisotropy=8;
  return texture;
}
const fabricColorTexture=makeFabricColorTexture(0x52a9ce31);

function cloneTextureVariant(texture,offsetX,offsetY,repeatScaleX=1,repeatScaleY=1,rotation=0){
  const clone=texture.clone();
  clone.wrapS=THREE.RepeatWrapping;
  clone.wrapT=THREE.RepeatWrapping;
  clone.offset.set(offsetX,offsetY);
  clone.repeat.set(
    texture.repeat.x*repeatScaleX,
    texture.repeat.y*repeatScaleY
  );
  clone.center.set(.5,.5);
  clone.rotation=rotation;
  clone.needsUpdate=true;
  return clone;
}

function makeFoliageMaterial(color,roughness=.91,bumpScale=.009,lightness=.020){
  const base=new THREE.Color(color);
  const emissive=base.clone().multiplyScalar(.22);
  return new THREE.MeshPhysicalMaterial({
    color:base,
    roughness,
    metalness:0,
    map:foliageSurface.map,
    bumpMap:foliageSurface.bump,
    bumpScale,
    sheen:1,
    sheenColor:base.clone().lerp(new THREE.Color(0xdce8c8),.34),
    sheenRoughness:.86,
    envMapIntensity:.16,
    emissive,
    emissiveIntensity:lightness
  });
}

const glassReflectionCanvas=document.createElement('canvas');
glassReflectionCanvas.width=128;
glassReflectionCanvas.height=256;
const glassReflectionCtx=glassReflectionCanvas.getContext('2d');
const glassReflectionGradient=glassReflectionCtx.createLinearGradient(0,0,0,256);
glassReflectionGradient.addColorStop(0,'rgba(226,244,250,.72)');
glassReflectionGradient.addColorStop(.18,'rgba(192,222,232,.38)');
glassReflectionGradient.addColorStop(.43,'rgba(159,190,195,.20)');
glassReflectionGradient.addColorStop(.62,'rgba(205,211,196,.18)');
glassReflectionGradient.addColorStop(.78,'rgba(178,166,145,.19)');
glassReflectionGradient.addColorStop(1,'rgba(112,126,122,.20)');
glassReflectionCtx.fillStyle=glassReflectionGradient;
glassReflectionCtx.fillRect(0,0,128,256);

// Soft vertical reflections hint at nearby facade bays rather than a uniform tint.
for(let i=0;i<9;i++){
  const x=6+i*15;
  glassReflectionCtx.fillStyle='rgba(255,255,255,'+(.018+(i%3)*.008).toFixed(3)+')';
  glassReflectionCtx.fillRect(x,0,1+(i%2),256);
}
glassReflectionCtx.fillStyle='rgba(255,247,230,.035)';
glassReflectionCtx.fillRect(0,174,128,26);
glassReflectionCtx.fillStyle='rgba(91,111,107,.040)';
glassReflectionCtx.fillRect(0,205,128,51);

const glassReflectionTexture=new THREE.CanvasTexture(glassReflectionCanvas);
glassReflectionTexture.colorSpace=THREE.SRGBColorSpace;
glassReflectionTexture.wrapS=THREE.RepeatWrapping;
glassReflectionTexture.wrapT=THREE.ClampToEdgeWrapping;
glassReflectionTexture.repeat.set(2.2,1);
glassReflectionTexture.anisotropy=8;

const glassRoughnessCanvas=document.createElement('canvas');
glassRoughnessCanvas.width=128;
glassRoughnessCanvas.height=256;
const glassRoughnessCtx=glassRoughnessCanvas.getContext('2d');
glassRoughnessCtx.fillStyle='#3d3d3d';
glassRoughnessCtx.fillRect(0,0,128,256);
const glassRoughRnd=makeSeededRandom(0x7e5a1c93);
for(let i=0;i<240;i++){
  const a=.02+glassRoughRnd()*.08;
  const v=74+Math.floor(glassRoughRnd()*42);
  glassRoughnessCtx.fillStyle='rgba('+v+','+v+','+v+','+a.toFixed(3)+')';
  glassRoughnessCtx.beginPath();
  glassRoughnessCtx.arc(
    glassRoughRnd()*128,
    glassRoughRnd()*256,
    .4+glassRoughRnd()*1.8,
    0,Math.PI*2
  );
  glassRoughnessCtx.fill();
}
for(let i=0;i<8;i++){
  const y=30+glassRoughRnd()*205;
  const grad=glassRoughnessCtx.createLinearGradient(0,y,128,y+8);
  grad.addColorStop(0,'rgba(110,110,110,0)');
  grad.addColorStop(.45,'rgba(110,110,110,.055)');
  grad.addColorStop(.55,'rgba(110,110,110,.025)');
  grad.addColorStop(1,'rgba(110,110,110,0)');
  glassRoughnessCtx.fillStyle=grad;
  glassRoughnessCtx.fillRect(0,y-10,128,26);
}
const glassRoughnessTexture=new THREE.CanvasTexture(glassRoughnessCanvas);
glassRoughnessTexture.wrapS=THREE.RepeatWrapping;
glassRoughnessTexture.wrapT=THREE.ClampToEdgeWrapping;
glassRoughnessTexture.repeat.set(2.2,1);
glassRoughnessTexture.anisotropy=8;

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
      roughnessMap:glassRoughnessTexture,
      roughness:.21,
      metalness:.01,
      transparent:true,
      opacity:.42,
      transmission:.10,
      ior:1.45,
      thickness:.012,
      clearcoat:.34,
      clearcoatRoughness:.20,
      envMapIntensity:.84,
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

function makeWeatheringTexture(kind,seed){
  const size=512;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.clearRect(0,0,size,size);

  if(kind==='facade'){
    // Larger low-contrast blooms create believable tonal history before any
    // small marks are added. This is intentionally subtle at normal distance.
    for(let i=0;i<46;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rx=18+rnd()*72;
      const ry=24+rnd()*110;
      const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      const warm=rnd()>.56;
      grad.addColorStop(
        0,
        warm
          ? 'rgba(122,102,82,'+(.012+rnd()*.025).toFixed(3)+')'
          : 'rgba(78,88,84,'+(.010+rnd()*.022).toFixed(3)+')'
      );
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.save();
      g.translate(x,y);
      g.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));
      g.beginPath();
      g.arc(0,0,Math.max(rx,ry),0,Math.PI*2);
      g.fill();
      g.restore();
    }

    // Rain streaks gather below projections and window lines.
    for(let i=0;i<70;i++){
      const x=rnd()*size;
      const y=rnd()*size*.78;
      const len=10+rnd()*74;
      const alpha=.007+rnd()*.018;
      const grad=g.createLinearGradient(x,y,x,y+len);
      grad.addColorStop(0,'rgba(67,72,68,'+alpha.toFixed(3)+')');
      grad.addColorStop(1,'rgba(67,72,68,0)');
      g.strokeStyle=grad;
      g.lineWidth=.45+rnd()*1.2;
      g.beginPath();
      g.moveTo(x,y);
      g.lineTo(x+(rnd()-.5)*2.6,y+len);
      g.stroke();
    }

    // Ground-level urban dust is stronger near the base, but remains faint.
    const base=g.createLinearGradient(0,size*.70,0,size);
    base.addColorStop(0,'rgba(82,75,66,0)');
    base.addColorStop(1,'rgba(82,75,66,.055)');
    g.fillStyle=base;
    g.fillRect(0,size*.70,size,size*.30);
  }else if(kind==='road'){
    for(let i=0;i<84;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rx=10+rnd()*48;
      const ry=18+rnd()*78;
      const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      grad.addColorStop(0,'rgba(25,30,31,'+(.012+rnd()*.030).toFixed(3)+')');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.save();
      g.translate(x,y);
      g.scale(rx/Math.max(rx,ry),ry/Math.max(rx,ry));
      g.beginPath();
      g.arc(0,0,Math.max(rx,ry),0,Math.PI*2);
      g.fill();
      g.restore();
    }

    for(let i=0;i<26;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      g.strokeStyle='rgba(28,33,34,'+(.018+rnd()*.028).toFixed(3)+')';
      g.lineWidth=.4+rnd()*.8;
      g.beginPath();
      g.moveTo(x,y);
      g.bezierCurveTo(
        x+(rnd()-.5)*28,y+12+rnd()*18,
        x+(rnd()-.5)*38,y+26+rnd()*28,
        x+(rnd()-.5)*46,y+42+rnd()*34
      );
      g.stroke();
    }
  }else{
    for(let i=0;i<180;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const len=2+rnd()*16;
      g.strokeStyle=rnd()>.82
        ? 'rgba(119,77,46,'+(.012+rnd()*.026).toFixed(3)+')'
        : 'rgba(240,243,237,'+(.010+rnd()*.022).toFixed(3)+')';
      g.lineWidth=.35+rnd()*.60;
      g.beginPath();
      g.moveTo(x,y);
      g.lineTo(x+len,y+(rnd()-.5)*2);
      g.stroke();
    }
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

const facadeWeatherTexture=makeWeatheringTexture('facade',0x82d4a931);
facadeWeatherTexture.repeat.set(1,1.8);
const roadWearTexture=makeWeatheringTexture('road',0x5ca91d73);
roadWearTexture.repeat.set(1.2,4.8);
const metalWearTexture=makeWeatheringTexture('metal',0x31d7be42);
metalWearTexture.repeat.set(2.5,5.0);

function makePaintWearAlpha(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#ffffff';
  g.fillRect(0,0,size,size);

  // Missing chips and tyre-polished pinholes remove just enough paint to keep
  // road markings from reading like vector UI laid on top of the asphalt.
  for(let i=0;i<220;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=.5+rnd()*3.4;
    const ry=.3+rnd()*1.8;
    g.fillStyle='rgba(0,0,0,'+(.28+rnd()*.58).toFixed(3)+')';
    g.beginPath();
    g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
    g.fill();
  }

  for(let i=0;i<24;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    g.strokeStyle='rgba(0,0,0,'+(.22+rnd()*.40).toFixed(3)+')';
    g.lineWidth=.6+rnd()*1.4;
    g.beginPath();
    g.moveTo(x,y);
    g.lineTo(x+(rnd()-.5)*28,y+(rnd()-.5)*8);
    g.stroke();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

const paintWearAlphaA=makePaintWearAlpha(0x6ab1349d);
const paintWearAlphaB=makePaintWearAlpha(0x8f21c7e4);
const paintWearAlphaC=makePaintWearAlpha(0x2479df61);

function makeFacadeJointTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=1024;
  canvas.height=256;
  const g=canvas.getContext('2d');
  g.clearRect(0,0,canvas.width,canvas.height);

  const rows=7;
  const rowH=canvas.height/rows;
  for(let row=1;row<rows;row++){
    const y=Math.round(row*rowH);
    g.fillStyle='rgba(91,83,75,.075)';
    g.fillRect(0,y,canvas.width,1);
    g.fillStyle='rgba(255,248,236,.040)';
    g.fillRect(0,y+1,canvas.width,1);
  }

  const bayW=128;
  for(let row=0;row<rows;row++){
    const y0=row*rowH;
    const offset=row%2?bayW*.5:0;
    for(let x=offset;x<canvas.width;x+=bayW){
      g.fillStyle='rgba(91,83,75,.050)';
      g.fillRect(Math.round(x),Math.round(y0+2),1,Math.ceil(rowH-4));
    }
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.RepeatWrapping;
  texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}
const facadeJointTexture=makeFacadeJointTexture();

function makeGlassEdgeDirtTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=256;
  canvas.height=512;
  const g=canvas.getContext('2d');
  g.clearRect(0,0,256,512);

  const left=g.createLinearGradient(0,0,28,0);
  left.addColorStop(0,'rgba(83,88,84,.105)');
  left.addColorStop(1,'rgba(83,88,84,0)');
  g.fillStyle=left;
  g.fillRect(0,0,34,512);

  const right=g.createLinearGradient(256,0,228,0);
  right.addColorStop(0,'rgba(83,88,84,.090)');
  right.addColorStop(1,'rgba(83,88,84,0)');
  g.fillStyle=right;
  g.fillRect(222,0,34,512);

  const bottom=g.createLinearGradient(0,512,0,454);
  bottom.addColorStop(0,'rgba(105,91,76,.095)');
  bottom.addColorStop(1,'rgba(105,91,76,0)');
  g.fillStyle=bottom;
  g.fillRect(0,446,256,66);

  const rnd=makeSeededRandom(0xb36d0e47);
  for(let i=0;i<72;i++){
    const x=rnd()>.5 ? rnd()*28 : 228+rnd()*28;
    const y=rnd()*512;
    g.fillStyle='rgba(86,91,87,'+(.012+rnd()*.028).toFixed(3)+')';
    g.beginPath();
    g.arc(x,y,.5+rnd()*1.5,0,Math.PI*2);
    g.fill();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=THREE.ClampToEdgeWrapping;
  texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}
const glassEdgeDirtTexture=makeGlassEdgeDirtTexture();

function addGlassEdgeDirt(w,h,x,y,z,ry=-Math.PI/2,opacity=.42){
  const overlay=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshBasicMaterial({
      map:glassEdgeDirtTexture,
      transparent:true,
      opacity,
      depthWrite:false,
      toneMapped:false,
      side:THREE.DoubleSide
    })
  );
  overlay.position.set(x-.006,y,z);
  overlay.rotation.y=ry;
  overlay.renderOrder=3;
  scene.add(overlay);
  return overlay;
}

// ---------- daytime city block ----------
// Ground is deliberately split into road, curb and pedestrian zones so the
// player immediately reads this as a real street rather than a generic floor.
const cityGround=plane(52,92,0xc7c4b9,0,-.045,-4);
cityGround.material.map=pavementTexture;
cityGround.material.bumpMap=pavementMicroBump;
cityGround.material.bumpScale=.010;
cityGround.material.envMapIntensity=.055;
cityGround.material.color.set(0xc9c6bb);
cityGround.material.needsUpdate=true;

const road=plane(15,92,0xffffff,-6.7,.004,-4);
road.material.map=asphaltTexture;
road.material.bumpMap=roadMicroBump;
road.material.bumpScale=.014;
road.material.roughness=.965;
road.material.envMapIntensity=.035;
road.material.needsUpdate=true;

// Visual-only continuation beyond the playable bounds. Extending the surface
// removes the "map edge" at the end of the boulevard while keeping collision
// and player limits unchanged.
const distantRoadTexture=asphaltTexture.clone();
distantRoadTexture.repeat.set(5,12);
distantRoadTexture.offset.set(.17,.08);
distantRoadTexture.needsUpdate=true;
const distantRoad=new THREE.Mesh(
  new THREE.PlaneGeometry(15,34),
  new THREE.MeshStandardMaterial({
    color:0xffffff,
    map:distantRoadTexture,
    bumpMap:roadMicroBump,
    bumpScale:.010,
    roughness:.97,
    envMapIntensity:.025
  })
);
distantRoad.rotation.x=-Math.PI/2;
distantRoad.position.set(-6.7,.003,-67);
distantRoad.receiveShadow=true;
scene.add(distantRoad);

const distantSidewalkTexture=pavementTexture.clone();
distantSidewalkTexture.repeat.set(4,9);
distantSidewalkTexture.offset.set(.28,.11);
distantSidewalkTexture.needsUpdate=true;
const distantSidewalk=new THREE.Mesh(
  new THREE.PlaneGeometry(10.8,34),
  new THREE.MeshStandardMaterial({
    color:0xc7c4b9,
    map:distantSidewalkTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.007,
    roughness:.97,
    envMapIntensity:.035
  })
);
distantSidewalk.rotation.x=-Math.PI/2;
distantSidewalk.position.set(4.2,.010,-67);
distantSidewalk.receiveShadow=true;
scene.add(distantSidewalk);

const sidewalk=plane(10.8,92,0xffffff,4.2,.014,-4);
sidewalk.material.map=pavementTexture;
sidewalk.material.bumpMap=pavementMicroBump;
sidewalk.material.bumpScale=.011;
sidewalk.material.roughness=.955;
sidewalk.material.envMapIntensity=.055;
sidewalk.material.needsUpdate=true;

const curbsidePaving=new THREE.Mesh(
  new THREE.PlaneGeometry(1.35,88),
  new THREE.MeshStandardMaterial({
    color:0xd5d1c6,
    roughness:.97,
    map:concreteSurface.map,
    bumpMap:pavementMicroBump,
    bumpScale:.010
  })
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

const curb=box(.30,.18,92,0xc4beb2,.05,.08,-4,.94);
curb.material.map=concreteSurface.map;
curb.material.bumpMap=concreteSurface.bump;
curb.material.bumpScale=.012;
curb.material.needsUpdate=true;

// Soft curb scuffs collect near wheel height and break the otherwise perfectly
// even ninety-metre concrete edge.
const curbScuffMat=new THREE.MeshBasicMaterial({
  map:roadWearTexture,
  transparent:true,
  opacity:.18,
  depthWrite:false,
  toneMapped:false
});
[
  [-17.5,8.6],
  [-2.2,10.4],
  [12.8,7.0],
  [26.1,6.5]
].forEach(([z,length],index)=>{
  const scuff=new THREE.Mesh(new THREE.PlaneGeometry(.105,length),curbScuffMat);
  scuff.position.set(-.103,.095,z);
  scuff.rotation.y=Math.PI/2;
  scuff.rotation.z=(index%2?1:-1)*.015;
  scene.add(scuff);
});

const curbCap=box(.09,.035,92,0xe9e3d7,.18,.185,-4,.90);
curbCap.material.map=concreteSurface.map;
curbCap.material.bumpMap=concreteSurface.bump;
curbCap.material.bumpScale=.008;
curbCap.material.needsUpdate=true;

// A narrow rounded nose catches daylight along the curb edge. The original box
// remains the structural/collision-friendly base while this adds the missing
// masonry profile without changing world dimensions.
const curbNose=new THREE.Mesh(
  new THREE.CylinderGeometry(.028,.028,91.8,8,1,false),
  new THREE.MeshStandardMaterial({
    color:0xd8d1c5,
    roughness:.91,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.006,
    envMapIntensity:.055
  })
);
curbNose.rotation.x=Math.PI/2;
curbNose.position.set(-.095,.157,-4);
curbNose.castShadow=true;
curbNose.receiveShadow=true;
scene.add(curbNose);

const gutterStrip=new THREE.Mesh(
  new THREE.PlaneGeometry(.34,88),
  new THREE.MeshStandardMaterial({
    color:0x777c79,
    roughness:.98,
    map:concreteSurface.map,
    bumpMap:roadMicroBump,
    bumpScale:.010
  })
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

const curbDrainMat=new THREE.MeshStandardMaterial({
  color:0x59605e,
  roughness:.64,
  metalness:.38,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.004
});
[-24,-8,8,24].forEach(z=>{
  const grateFrame=new THREE.Mesh(
    new THREE.BoxGeometry(.30,.020,.66),
    curbDrainMat
  );
  grateFrame.position.set(-.18,.032,z);
  grateFrame.receiveShadow=true;
  scene.add(grateFrame);

  const recess=new THREE.Mesh(
    new THREE.BoxGeometry(.23,.012,.59),
    new THREE.MeshBasicMaterial({color:0x303635})
  );
  recess.position.set(-.18,.043,z);
  scene.add(recess);

  [-.22,-.145,-.07,.005,.08,.155,.23].forEach(dz=>{
    const slot=new THREE.Mesh(
      new THREE.BoxGeometry(.15,.014,.022),
      curbDrainMat
    );
    slot.position.set(-.18,.050,z+dz);
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

const pavementWearMat=new THREE.MeshBasicMaterial({
  map:roadWearTexture,
  transparent:true,
  opacity:.18,
  depthWrite:false,
  toneMapped:false
});
[
  [6.55,2.45,1.45,2.10,.05],
  [5.95,6.90,2.55,5.30,-.02],
  [3.65,-1.55,3.50,3.20,.10],
  [6.15,-5.55,2.15,1.20,-.08]
].forEach(([x,z,w,d,rot])=>{
  const wear=new THREE.Mesh(new THREE.PlaneGeometry(w,d),pavementWearMat);
  wear.rotation.x=-Math.PI/2;
  wear.rotation.z=rot;
  wear.position.set(x,.043,z);
  scene.add(wear);
});

// Road lane markings and a distant crossing make the street continue beyond
// the playable slice.
const stripeMaterials=[
  new THREE.MeshBasicMaterial({color:0xe8e6dc,transparent:true,opacity:.78,alphaMap:paintWearAlphaA,alphaTest:.04}),
  new THREE.MeshBasicMaterial({color:0xe8e6dc,transparent:true,opacity:.76,alphaMap:paintWearAlphaB,alphaTest:.04}),
  new THREE.MeshBasicMaterial({color:0xe8e6dc,transparent:true,opacity:.80,alphaMap:paintWearAlphaC,alphaTest:.04})
];
for(let z=-40,index=0;z<40;z+=5.8,index++){
  const stripe=new THREE.Mesh(new THREE.PlaneGeometry(.13,2.9),stripeMaterials[index%stripeMaterials.length]);
  stripe.rotation.x=-Math.PI/2;
  stripe.position.set(-6.5,.022,z);
  scene.add(stripe);
}
const stripeMat=stripeMaterials[0];

const edgeLine=new THREE.Mesh(
  new THREE.PlaneGeometry(.11,86),
  new THREE.MeshBasicMaterial({
    color:0xd8c66d,
    transparent:true,
    opacity:.82,
    alphaMap:paintWearAlphaB,
    alphaTest:.035
  })
);
edgeLine.rotation.x=-Math.PI/2;
edgeLine.position.set(-.45,.025,-4);
scene.add(edgeLine);

const focalCurbMark=new THREE.Mesh(
  new THREE.PlaneGeometry(.13,5.4),
  new THREE.MeshBasicMaterial({
    color:0xd8c777,
    transparent:true,
    opacity:.58,
    alphaMap:paintWearAlphaC,
    alphaTest:.035
  })
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

// Tire lanes and irregular resurfacing gently break the repeated asphalt map.
// Their opacity is low enough to read as accumulated use, not painted graphics.
const roadWearMat=new THREE.MeshBasicMaterial({
  map:roadWearTexture,
  transparent:true,
  opacity:.52,
  depthWrite:false,
  toneMapped:false
});
[
  [-9.25,-4,1.55,82,.00],
  [-5.65,-4,1.42,82,.18]
].forEach(([x,z,w,d,rot])=>{
  const wear=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadWearMat);
  wear.rotation.x=-Math.PI/2;
  wear.rotation.z=rot;
  wear.position.set(x,.028,z);
  scene.add(wear);
});

const roadRepairMat=new THREE.MeshBasicMaterial({
  color:0x4d5555,
  transparent:true,
  opacity:.085,
  depthWrite:false
});
[
  [-8.9,-12.3,2.25,4.7,-.035],
  [-5.65,11.8,1.75,3.2,.025],
  [-8.10,24.5,1.45,2.7,-.02]
].forEach(([x,z,w,d,rot])=>{
  const patch=new THREE.Mesh(new THREE.PlaneGeometry(w,d),roadRepairMat);
  patch.rotation.x=-Math.PI/2;
  patch.rotation.z=rot;
  patch.position.set(x,.029,z);
  scene.add(patch);
});

for(let x=-12.6;x<-1.0;x+=1.45){
  const cross=new THREE.Mesh(new THREE.PlaneGeometry(.62,3.1),stripeMat);
  cross.rotation.x=-Math.PI/2;
  cross.position.set(x,.024,-17.2);
  scene.add(cross);
}

const utilityMetalMat=new THREE.MeshStandardMaterial({
  color:0x51595a,
  roughness:.72,
  metalness:.30,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.005,
  side:THREE.DoubleSide
});
const utilityCover=new THREE.Mesh(
  new THREE.RingGeometry(.27,.39,28),
  utilityMetalMat
);
utilityCover.rotation.x=-Math.PI/2;
utilityCover.position.set(-8.55,.031,2.8);
utilityCover.receiveShadow=true;
scene.add(utilityCover);

const utilityCenter=new THREE.Mesh(
  new THREE.CircleGeometry(.265,28),
  new THREE.MeshStandardMaterial({
    color:0x5d6464,
    roughness:.80,
    metalness:.22,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.006,
    side:THREE.DoubleSide
  })
);
utilityCenter.rotation.x=-Math.PI/2;
utilityCenter.position.set(-8.55,.0305,2.8);
scene.add(utilityCenter);

// Concentric wear and shallow grooves help the cover read as cast metal instead
// of a grey disc without increasing its silhouette.
const utilityGrooveMat=new THREE.MeshBasicMaterial({
  color:0x2f3535,
  transparent:true,
  opacity:.26,
  depthWrite:false,
  side:THREE.DoubleSide
});
[.10,.17,.235].forEach(radius=>{
  const ring=new THREE.Mesh(new THREE.RingGeometry(radius,radius+.008,28),utilityGrooveMat);
  ring.rotation.x=-Math.PI/2;
  ring.position.set(-8.55,.033,2.8);
  scene.add(ring);
});
for(let i=0;i<4;i++){
  const slot=new THREE.Mesh(
    new THREE.PlaneGeometry(.11,.016),
    new THREE.MeshBasicMaterial({color:0x2d3333,transparent:true,opacity:.30,depthWrite:false})
  );
  slot.rotation.x=-Math.PI/2;
  slot.rotation.z=i*Math.PI/2+.22;
  slot.position.set(
    -8.55+Math.cos(i*Math.PI/2+.22)*.14,
    .034,
    2.8+Math.sin(i*Math.PI/2+.22)*.14
  );
  scene.add(slot);
}

// Street-facing buildings: warm stone + glass + shaded shopfronts.
const rightFacade=box(3.4,7.6,66,0xddd5c7,10.15,3.75,-5,.82);
rightFacade.castShadow=false;
rightFacade.material.map=facadeSurface.map;
rightFacade.material.bumpMap=facadeSurface.bump;
rightFacade.material.bumpScale=.018;
rightFacade.material.envMapIntensity=.10;
rightFacade.material.needsUpdate=true;

const upperRecess=new THREE.Mesh(
  new THREE.BoxGeometry(.18,2.10,63.9),
  new THREE.MeshStandardMaterial({
    color:0xc9c5bd,
    roughness:.88,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.012
  })
);
upperRecess.position.set(8.47,6.18,-5);
upperRecess.castShadow=true;
upperRecess.receiveShadow=true;
scene.add(upperRecess);

const topCornice=new THREE.Mesh(
  new THREE.BoxGeometry(.56,.20,65.0),
  new THREE.MeshStandardMaterial({
    color:0xe6ded1,
    roughness:.84,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.010
  })
);
topCornice.position.set(8.25,7.42,-5);
topCornice.castShadow=true;
scene.add(topCornice);

// Layered shadow lines make the roof edge read as built masonry rather than a
// single extruded box. The additions stay shallow so the facade silhouette is
// refined without becoming ornate.
const corniceUnder=new THREE.Mesh(
  new THREE.BoxGeometry(.38,.09,64.86),
  new THREE.MeshStandardMaterial({
    color:0xcac1b5,
    roughness:.90,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.008,
    envMapIntensity:.055
  })
);
corniceUnder.position.set(8.40,7.31,-5);
corniceUnder.castShadow=true;
scene.add(corniceUnder);

const corniceLip=new THREE.Mesh(
  new THREE.BoxGeometry(.68,.055,65.08),
  new THREE.MeshStandardMaterial({
    color:0xeee6da,
    roughness:.86,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.006,
    envMapIntensity:.055
  })
);
corniceLip.position.set(8.16,7.51,-5);
corniceLip.castShadow=true;
scene.add(corniceLip);

const facadeBaseBand=new THREE.Mesh(
  new THREE.BoxGeometry(.36,.20,64.8),
  new THREE.MeshStandardMaterial({
    color:0xd1c6b6,
    roughness:.93,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.014
  })
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

// The street facade gets a very low-opacity weather layer: rain traces, dust at
// pedestrian height and broad tonal drift. It keeps the warm stone clean but
// stops sixty metres of wall from reading as a freshly rendered solid color.
const facadeWeatherMat=new THREE.MeshBasicMaterial({
  map:facadeWeatherTexture,
  transparent:true,
  opacity:.58,
  depthWrite:false,
  toneMapped:false,
  side:THREE.DoubleSide
});
const facadeWeather=new THREE.Mesh(
  new THREE.PlaneGeometry(63.6,6.75),
  facadeWeatherMat
);
facadeWeather.position.set(8.392,3.47,-5);
facadeWeather.rotation.y=-Math.PI/2;
scene.add(facadeWeather);

const facadeJointOverlay=new THREE.Mesh(
  new THREE.PlaneGeometry(63.45,6.64),
  new THREE.MeshBasicMaterial({
    map:facadeJointTexture,
    transparent:true,
    opacity:.62,
    depthWrite:false,
    toneMapped:false,
    side:THREE.DoubleSide
  })
);
facadeJointOverlay.position.set(8.388,3.49,-5);
facadeJointOverlay.rotation.y=-Math.PI/2;
scene.add(facadeJointOverlay);

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
  roughness:.87,
  map:facadeSurface.map,
  bumpMap:facadeSurface.bump,
  bumpScale:.012
});
[-34.2,-27.0,-18.9,-11.2,-3.7,4.1,12.4,20.7,27.3].forEach((z,i)=>{
  const ribWidth=i===4||i===5?.26:.18;
  const rib=new THREE.Mesh(new THREE.BoxGeometry(.20,5.82,ribWidth),facadeRibMat);
  rib.position.set(8.42,3.32,z);
  rib.castShadow=true;
  rib.receiveShadow=true;
  scene.add(rib);
});

const balconyStone=new THREE.MeshStandardMaterial({
  color:0xd8cfc2,
  roughness:.90,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.010
});
const balconyGreenMats=[
  new THREE.MeshStandardMaterial({
    color:0x789a70,roughness:.93,map:foliageSurface.map,bumpMap:foliageSurface.bump,bumpScale:.008
  }),
  new THREE.MeshStandardMaterial({
    color:0x93ad80,roughness:.91,map:foliageSurface.map,bumpMap:foliageSurface.bump,bumpScale:.008
  })
];
[-15.2,-.8,13.6].forEach((z,balconyIndex)=>{
  const slab=new THREE.Mesh(new THREE.BoxGeometry(.82,.10,3.20),balconyStone);
  slab.position.set(7.95,5.56,z);
  slab.castShadow=true;
  slab.receiveShadow=true;
  scene.add(slab);

  const railMat=new THREE.MeshStandardMaterial({
    color:0x9aa29e,
    roughness:.40,
    metalness:.38,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.0035,
    envMapIntensity:.90
  });
  const topRail=new THREE.Mesh(new THREE.BoxGeometry(.055,.055,3.05),railMat);
  topRail.position.set(7.58,6.09,z);
  topRail.castShadow=true;
  scene.add(topRail);

  const lowerRail=new THREE.Mesh(new THREE.BoxGeometry(.045,.045,3.05),railMat);
  lowerRail.position.set(7.58,5.64,z);
  lowerRail.castShadow=true;
  scene.add(lowerRail);

  [-1.38,-.92,-.46,0,.46,.92,1.38].forEach((oz,i)=>{
    const baluster=new THREE.Mesh(new THREE.BoxGeometry(.035,.42,.035),railMat);
    baluster.position.set(7.58,5.86,z+oz);
    baluster.castShadow=true;
    scene.add(baluster);
  });

  [-1.00,-.50,0,.50,1.00].forEach((oz,i)=>{
    const planter=new THREE.Mesh(
      new THREE.BoxGeometry(.28,.20,.38),
      new THREE.MeshStandardMaterial({
        color:0xb9aa96,
        roughness:.94,
        map:concreteSurface.map,
        bumpMap:concreteSurface.bump,
        bumpScale:.010
      })
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
  const bay=box(.42,5.6,bayDepth,bayTone,8.64,3.22,z,.82);
  bay.castShadow=false;
  bay.material.map=cloneTextureVariant(
    facadeSurface.map,
    (bayIndex*.173)%1,
    (bayIndex*.091)%1,
    .92+(bayIndex%3)*.06,
    .94+((bayIndex+1)%3)*.04,
    (bayIndex%2?.004:-.004)
  );
  bay.material.bumpMap=cloneTextureVariant(
    facadeSurface.bump,
    (bayIndex*.173)%1,
    (bayIndex*.091)%1,
    .92+(bayIndex%3)*.06,
    .94+((bayIndex+1)%3)*.04,
    (bayIndex%2?.004:-.004)
  );
  bay.material.bumpScale=.010;
  bay.material.needsUpdate=true;

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

  // Perimeter frame + projecting sill gives the glazing actual construction
  // depth, so reflections sit inside an opening rather than on a flat wall.
  const frameMat=new THREE.MeshStandardMaterial({
    color:z<-7?0x929e9b:(z>10?0xa69688:0x9b948b),
    roughness:.44,
    metalness:.30,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.82
  });
  const frameDepth=bayDepth-.30;
  const frameX=8.315;
  [
    [frameX,1.04,z-frameDepth*.5,.075,.88,.075],
    [frameX,1.04,z+frameDepth*.5,.075,.88,.075],
    [frameX,5.65,z-frameDepth*.5,.075,.34,.075],
    [frameX,5.65,z+frameDepth*.5,.075,.34,.075]
  ].forEach(([x,y,fz,w,h,d])=>{
    const piece=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),frameMat);
    piece.position.set(x,y,fz);
    piece.castShadow=true;
    scene.add(piece);
  });
  [1.02,5.68].forEach(y=>{
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.075,.075,frameDepth+.08),frameMat);
    rail.position.set(frameX,y,z);
    rail.castShadow=true;
    scene.add(rail);
  });
  const sill=new THREE.Mesh(
    new THREE.BoxGeometry(.34,.065,frameDepth+.10),
    new THREE.MeshStandardMaterial({
      color:0xc3bbb0,
      roughness:.88,
      map:concreteSurface.map,
      bumpMap:concreteSurface.bump,
      bumpScale:.008,
      envMapIntensity:.06
    })
  );
  sill.position.set(8.18,.94,z);
  sill.castShadow=true;
  scene.add(sill);

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

const portalStoneMat=new THREE.MeshStandardMaterial({
  color:0xd8d0c4,
  roughness:.90,
  map:facadeSurface.map,
  bumpMap:facadeSurface.bump,
  bumpScale:.011
});
[
  [-4.55,3.45,0xded6c9],
  [10.55,3.10,0xd2d7cf]
].forEach(([z,width,color],portalIndex)=>{
  const mat=new THREE.MeshStandardMaterial({
    color,
    roughness:.90,
    map:cloneTextureVariant(facadeSurface.map,portalIndex*.31,.14+portalIndex*.17,.88,1.04),
    bumpMap:cloneTextureVariant(facadeSurface.bump,portalIndex*.31,.14+portalIndex*.17,.88,1.04),
    bumpScale:.011
  });
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

  // Inner reveal and a projecting head cap add depth to the portal without
  // requiring boolean geometry.
  const innerMat=new THREE.MeshStandardMaterial({
    color:portalIndex===0?0xbab1a5:0xb5bbb3,
    roughness:.92,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.009,
    envMapIntensity:.055
  });
  [-width*.5+.20,width*.5-.20].forEach(oz=>{
    const reveal=new THREE.Mesh(new THREE.BoxGeometry(.18,2.70,.13),innerMat);
    reveal.position.set(7.74,1.48,z+oz);
    reveal.castShadow=true;
    scene.add(reveal);
  });
  const innerHead=new THREE.Mesh(new THREE.BoxGeometry(.18,.16,width-.18),innerMat);
  innerHead.position.set(7.74,2.86,z);
  innerHead.castShadow=true;
  scene.add(innerHead);

  const headCap=new THREE.Mesh(
    new THREE.BoxGeometry(.48,.085,width+.40),
    portalStoneMat
  );
  headCap.position.set(7.91,3.16,z);
  headCap.castShadow=true;
  scene.add(headCap);
});

// A few recessed ground-floor entries keep the frontage from feeling like one
// repeated office wall.
[-18.8,-10.6,13.8].forEach((z,i)=>{
  const inset=box(.72,2.55,4.3,[0xa99b89,0x9daaa8,0xb3a08c][i],8.10,1.31,z,.86);
  inset.castShadow=false;
  inset.material.map=cloneTextureVariant(concreteSurface.map,i*.22,.12+i*.19,.95,1.08);
  inset.material.bumpMap=cloneTextureVariant(concreteSurface.bump,i*.22,.12+i*.19,.95,1.08);
  inset.material.bumpScale=.010;
  inset.material.needsUpdate=true;

  const reveal=box(.16,2.34,3.94,0x8e877d,7.80,1.30,z,.88);
  reveal.castShadow=false;
  reveal.material.map=cloneTextureVariant(concreteSurface.map,.13+i*.21,.27+i*.11,.84,1.12);
  reveal.material.bumpMap=cloneTextureVariant(concreteSurface.bump,.13+i*.21,.27+i*.11,.84,1.12);
  reveal.material.bumpScale=.009;
  reveal.material.needsUpdate=true;

  const door=glassPanel(2.10,2.22,7.70,1.34,z,-Math.PI/2,0xb9ced0);
  door.material.opacity=.50;
  door.material.roughness=.32;

  const handle=new THREE.Mesh(
    new THREE.CylinderGeometry(.018,.018,.48,10),
    new THREE.MeshStandardMaterial({
      color:0x8c9692,
      roughness:.36,
      metalness:.58,
      map:metalWearTexture,
      bumpMap:metalSurface.bump,
      bumpScale:.0025
    })
  );
  handle.rotation.z=Math.PI/2;
  handle.position.set(7.64,1.36,z+.34);
  handle.castShadow=true;
  scene.add(handle);

  const step=box(.92,.10,3.65,0xcec6b8,7.58,.08,z,.90);
  step.castShadow=true;

  // The three entries intentionally differ in their secondary construction so
  // the ground floor reads as separate addresses rather than duplicated doors.
  const entryFrameMat=new THREE.MeshStandardMaterial({
    color:0x838d89,
    roughness:.40,
    metalness:.46,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.86
  });
  if(i===0){
    const transom=glassPanel(1.92,.34,7.69,2.62,z,-Math.PI/2,0xc5d4d2);
    transom.material.opacity=.34;
    const transomBar=new THREE.Mesh(
      new THREE.BoxGeometry(.055,.055,2.02),
      entryFrameMat
    );
    transomBar.position.set(7.66,2.43,z);
    transomBar.castShadow=true;
    scene.add(transomBar);
  }else if(i===1){
    const sidePanel=glassPanel(.46,2.10,7.69,1.34,z-1.18,-Math.PI/2,0xc0d4d1);
    sidePanel.material.opacity=.36;
    const sidePost=new THREE.Mesh(
      new THREE.BoxGeometry(.07,2.18,.07),
      entryFrameMat
    );
    sidePost.position.set(7.66,1.35,z-1.42);
    sidePost.castShadow=true;
    scene.add(sidePost);
  }else{
    const addressPlate=new THREE.Mesh(
      new THREE.BoxGeometry(.045,.38,.54),
      new THREE.MeshStandardMaterial({
        color:0x6f7773,
        roughness:.42,
        metalness:.40,
        map:metalWearTexture,
        bumpMap:metalSurface.bump,
        bumpScale:.0025,
        envMapIntensity:.78
      })
    );
    addressPlate.position.set(7.62,2.10,z+1.30);
    addressPlate.castShadow=true;
    scene.add(addressPlate);

    const shallowCanopy=new THREE.Mesh(
      new THREE.BoxGeometry(.56,.055,2.55),
      portalStoneMat
    );
    shallowCanopy.position.set(7.55,2.82,z);
    shallowCanopy.castShadow=true;
    scene.add(shallowCanopy);
  }

  const stepShadow=new THREE.Mesh(
    new THREE.PlaneGeometry(.42,3.26),
    new THREE.MeshBasicMaterial({
      color:0x5f554b,
      transparent:true,
      opacity:.055,
      depthWrite:false
    })
  );
  stepShadow.rotation.x=-Math.PI/2;
  stepShadow.position.set(7.15,.052,z);
  scene.add(stepShadow);

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
  const rnd=makeSeededRandom(label==='MORI'?0x1f8a6c43:0x7b253fe1);

  g.fillStyle=bg;
  g.fillRect(0,0,384,128);

  // Enamel/paper-like surface variation keeps the sign integrated with the
  // physical storefront instead of reading as a flat UI card.
  for(let i=0;i<420;i++){
    const v=rnd()>.5?255:65;
    g.fillStyle='rgba('+v+','+v+','+v+','+(.006+rnd()*.016).toFixed(3)+')';
    const r=.3+rnd()*.9;
    g.fillRect(rnd()*384,rnd()*128,r,r);
  }

  const edge=g.createLinearGradient(0,0,384,0);
  edge.addColorStop(0,'rgba(54,52,48,.08)');
  edge.addColorStop(.06,'rgba(255,255,255,.025)');
  edge.addColorStop(.94,'rgba(255,255,255,.018)');
  edge.addColorStop(1,'rgba(54,52,48,.075)');
  g.fillStyle=edge;
  g.fillRect(0,0,384,128);
  g.strokeStyle='rgba(70,68,62,.16)';
  g.lineWidth=2;
  g.strokeRect(4,4,376,120);

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
    new THREE.MeshStandardMaterial({
      map:texture,
      roughness:.66,
      metalness:.02,
      toneMapped:false
    })
  );
  plaque.position.set(7.68,2.55,z);
  plaque.rotation.y=-Math.PI/2;
  scene.add(plaque);
}
createStorePlaque('MORI',-10.6,'#e7e8df','#58625d');
createStorePlaque('ATELIER',13.8,'#eee4d8','#63574d');

const facadePlanterMat=new THREE.MeshStandardMaterial({
  color:0xb8aa97,
  roughness:.94,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.014
});
const facadeLeafMats=[
  makeFoliageMaterial(0x78986f,.93,.008,.014),
  makeFoliageMaterial(0x91ad80,.90,.008,.021)
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
      roughness:.91,
      map:cloneTextureVariant(
        concreteSurface.map,
        groupIndex*.29,
        .17+groupIndex*.21,
        .84,
        1.08
      ),
      bumpMap:cloneTextureVariant(
        concreteSurface.bump,
        groupIndex*.29,
        .17+groupIndex*.21,
        .84,
        1.08
      ),
      bumpScale:.010
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

function createWindowDisplay(z,kind='mori'){
  const warm=kind==='atelier';
  const shelfMat=new THREE.MeshStandardMaterial({
    color:warm?0xb99c82:0xa7b4a8,
    roughness:.82,
    map:woodSurface.map,
    bumpMap:woodSurface.bump,
    bumpScale:.010,
    envMapIntensity:.14
  });

  const interiorWallMat=new THREE.MeshStandardMaterial({
    color:warm?0xe2d3c2:0xd8dfd8,
    roughness:.94,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.006,
    envMapIntensity:.04
  });
  const interiorFloorMat=new THREE.MeshStandardMaterial({
    color:warm?0xc8b39c:0xbac3b9,
    roughness:.92,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.007,
    envMapIntensity:.05
  });

  const backWall=new THREE.Mesh(
    new THREE.PlaneGeometry(2.92,1.92),
    interiorWallMat
  );
  backWall.position.set(8.36,1.39,z);
  backWall.rotation.y=-Math.PI/2;
  backWall.receiveShadow=true;
  scene.add(backWall);

  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(.56,2.88),
    interiorFloorMat
  );
  floor.rotation.x=-Math.PI/2;
  floor.position.set(8.08,.67,z);
  floor.receiveShadow=true;
  scene.add(floor);

  [-1.40,1.40].forEach(side=>{
    const returnWall=new THREE.Mesh(
      new THREE.PlaneGeometry(.52,1.90),
      interiorWallMat
    );
    returnWall.position.set(8.10,1.39,z+side);
    returnWall.rotation.y=side<0?0:Math.PI;
    returnWall.receiveShadow=true;
    scene.add(returnWall);
  });

  const ceiling=new THREE.Mesh(
    new THREE.PlaneGeometry(.52,2.86),
    new THREE.MeshStandardMaterial({
      color:warm?0xeee2d4:0xe8ece6,
      roughness:.96,
      envMapIntensity:.03
    })
  );
  ceiling.rotation.x=Math.PI/2;
  ceiling.position.set(8.08,2.30,z);
  scene.add(ceiling);
  const objectMats=warm
    ? [
        new THREE.MeshStandardMaterial({color:0xd6b39a,roughness:.76}),
        new THREE.MeshStandardMaterial({color:0x8a6f62,roughness:.82}),
        new THREE.MeshStandardMaterial({color:0xe4d7c5,roughness:.86})
      ]
    : [
        new THREE.MeshStandardMaterial({color:0x829a86,roughness:.84}),
        new THREE.MeshStandardMaterial({color:0xd9d7c9,roughness:.88}),
        new THREE.MeshStandardMaterial({color:0x66746d,roughness:.80})
      ];

  [.90,1.38].forEach((y,shelfIndex)=>{
    const shelf=new THREE.Mesh(new THREE.BoxGeometry(.34,.045,2.50),shelfMat);
    shelf.position.set(8.16,y,z);
    shelf.castShadow=true;
    scene.add(shelf);

    const shelfBack=new THREE.Mesh(
      new THREE.BoxGeometry(.055,.30,2.48),
      interiorWallMat
    );
    shelfBack.position.set(8.32,y+.12,z);
    shelfBack.castShadow=true;
    scene.add(shelfBack);

    [-.76,-.28,.22,.72].forEach((oz,i)=>{
      const mat=objectMats[(i+shelfIndex)%objectMats.length];
      let object;

      if(warm){
        // ATELIER: ceramics, folded textiles and small sculptural objects.
        if((i+shelfIndex)%4===0){
          object=new THREE.Mesh(
            new THREE.CylinderGeometry(.075,.11,.26,14),
            mat
          );
          const lip=new THREE.Mesh(
            new THREE.TorusGeometry(.076,.009,6,18),
            mat
          );
          lip.rotation.x=Math.PI/2;
          lip.position.set(8.06,y+.285,z+oz);
          scene.add(lip);
        }else if((i+shelfIndex)%4===1){
          object=new THREE.Mesh(
            new THREE.BoxGeometry(.23,.055,.18),
            mat
          );
          const folded=new THREE.Mesh(
            new THREE.BoxGeometry(.20,.040,.16),
            objectMats[(i+shelfIndex+1)%objectMats.length]
          );
          folded.position.set(8.10,y+.225,z+oz+.018);
          folded.rotation.y=-.05;
          folded.castShadow=true;
          scene.add(folded);
        }else if((i+shelfIndex)%4===2){
          object=new THREE.Mesh(
            new THREE.TorusKnotGeometry(.055,.018,42,7),
            mat
          );
          object.scale.set(1,.85,1);
        }else{
          object=new THREE.Mesh(
            new THREE.ConeGeometry(.095,.25,10),
            mat
          );
        }
      }else{
        // MORI: quiet botanical/home objects with books and simple vessels.
        if((i+shelfIndex)%4===0){
          object=new THREE.Mesh(
            new THREE.CylinderGeometry(.085,.105,.20,14),
            mat
          );
          const stem=new THREE.Mesh(
            new THREE.CylinderGeometry(.010,.012,.19,7),
            objectMats[2]
          );
          stem.position.set(8.07,y+.31,z+oz);
          stem.rotation.z=.16;
          scene.add(stem);
          const leaf=new THREE.Mesh(
            new THREE.IcosahedronGeometry(.055,1),
            makeFoliageMaterial(0x78956f,.92,.006,.014)
          );
          leaf.scale.set(.68,1.20,.58);
          leaf.position.set(8.05,y+.41,z+oz+.025);
          leaf.rotation.z=-.28;
          scene.add(leaf);
        }else if((i+shelfIndex)%4===1){
          object=new THREE.Mesh(
            new THREE.BoxGeometry(.22,.045,.18),
            mat
          );
          const book2=new THREE.Mesh(
            new THREE.BoxGeometry(.205,.036,.17),
            objectMats[(i+1)%objectMats.length]
          );
          book2.position.set(8.09,y+.215,z+oz-.01);
          book2.rotation.y=.07;
          scene.add(book2);
        }else if((i+shelfIndex)%4===2){
          object=new THREE.Mesh(
            new THREE.CylinderGeometry(.060,.085,.24,12),
            mat
          );
        }else{
          object=new THREE.Mesh(
            new THREE.BoxGeometry(.16,.26,.12),
            mat
          );
        }
      }

      object.position.set(8.02+(i%2)*.08,y+.15,z+oz);
      object.rotation.y=(i-1.5)*.12;
      object.castShadow=true;
      scene.add(object);
    });
  });

  const displayLight=new THREE.Mesh(
    new THREE.PlaneGeometry(2.55,1.55),
    new THREE.MeshBasicMaterial({
      color:warm?0xf2d4b7:0xd7e6dc,
      transparent:true,
      opacity:warm?.055:.042,
      depthWrite:false,
      toneMapped:false
    })
  );
  displayLight.position.set(7.86,1.35,z);
  displayLight.rotation.y=-Math.PI/2;
  scene.add(displayLight);

  const lightSlot=new THREE.Mesh(
    new THREE.BoxGeometry(.055,.035,1.65),
    new THREE.MeshBasicMaterial({
      color:warm?0xffdfbd:0xe1eee5,
      transparent:true,
      opacity:.40,
      toneMapped:false
    })
  );
  lightSlot.position.set(8.18,2.23,z);
  scene.add(lightSlot);

  const backGlow=new THREE.Mesh(
    new THREE.PlaneGeometry(2.10,.68),
    new THREE.MeshBasicMaterial({
      color:warm?0xffd5af:0xd9e7dc,
      transparent:true,
      opacity:warm?.050:.036,
      depthWrite:false,
      toneMapped:false
    })
  );
  backGlow.position.set(8.345,1.58,z+(warm?.14:-.12));
  backGlow.rotation.y=-Math.PI/2;
  scene.add(backGlow);

  const shelfGlowMat=new THREE.MeshBasicMaterial({
    color:warm?0xffe4c7:0xe8f1e9,
    transparent:true,
    opacity:warm?.30:.22,
    depthWrite:false,
    toneMapped:false
  });
  [.87,1.35].forEach(y=>{
    const glow=new THREE.Mesh(
      new THREE.BoxGeometry(.018,.018,2.22),
      shelfGlowMat
    );
    glow.position.set(8.00,y+.055,z);
    scene.add(glow);
  });
}

createWindowDisplay(-10.6,'mori');
createWindowDisplay(13.8,'atelier');


// Ground-floor cafe corner.
const cafeFrame=box(.48,3.0,8.5,0xb58e70,8.33,1.55,4.8,.86);
cafeFrame.castShadow=false;
cafeFrame.material.map=cloneTextureVariant(facadeSurface.map,.36,.18,.82,1.12);
cafeFrame.material.bumpMap=cloneTextureVariant(facadeSurface.bump,.36,.18,.82,1.12);
cafeFrame.material.bumpScale=.011;
cafeFrame.material.needsUpdate=true;
const cafeGlass=glassPanel(7.75,2.55,8.05,1.62,4.8,-Math.PI/2,0xc3d8d7);
cafeGlass.material.opacity=.48;
cafeGlass.material.roughness=.31;
addGlassEdgeDirt(7.75,2.55,8.044,1.62,4.8,-Math.PI/2,.36);

const cafeMullionMat=new THREE.MeshStandardMaterial({
  color:0x9c8e80,
  roughness:.42,
  metalness:.34,
  map:metalSurface.map,
  bumpMap:metalSurface.bump,
  bumpScale:.006,
  envMapIntensity:.88
});
[2.15,3.80,5.45,7.10].forEach(z=>{
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.055,2.42,.045),cafeMullionMat);
  mullion.position.set(7.96,1.64,z);
  mullion.castShadow=true;
  scene.add(mullion);
});

const cafeDoorFrame=new THREE.MeshStandardMaterial({
  color:0x8e8378,
  roughness:.46,
  metalness:.30,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.004,
  envMapIntensity:.82
});
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
addGlassEdgeDirt(.88,2.28,7.904,1.58,2.20,-Math.PI/2,.30);

const cafeThreshold=new THREE.Mesh(
  new THREE.BoxGeometry(.34,.045,1.02),
  new THREE.MeshStandardMaterial({
    color:0x8a8177,
    roughness:.52,
    metalness:.22,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.72
  })
);
cafeThreshold.position.set(7.73,.075,2.20);
cafeThreshold.castShadow=true;
scene.add(cafeThreshold);

const cafeDoorRevealMat=new THREE.MeshStandardMaterial({
  color:0xb8aa9a,
  roughness:.90,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.008,
  envMapIntensity:.055
});
[1.64,2.76].forEach(z=>{
  const reveal=new THREE.Mesh(new THREE.BoxGeometry(.16,2.48,.08),cafeDoorRevealMat);
  reveal.position.set(8.02,1.56,z);
  reveal.castShadow=true;
  scene.add(reveal);
});

const cafeDoorHandle=new THREE.Mesh(
  new THREE.CylinderGeometry(.018,.018,.42,10),
  new THREE.MeshStandardMaterial({
    color:0x9ba29f,
    roughness:.27,
    metalness:.68,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.0025,
    envMapIntensity:1.05
  })
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

const cafeInteriorShellMat=new THREE.MeshStandardMaterial({
  color:0xe7d8c7,
  roughness:.94,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.006,
  envMapIntensity:.04
});
const cafeBackWall=new THREE.Mesh(
  new THREE.PlaneGeometry(7.34,2.25),
  cafeInteriorShellMat
);
cafeBackWall.position.set(8.39,1.52,4.80);
cafeBackWall.rotation.y=-Math.PI/2;
cafeBackWall.receiveShadow=true;
scene.add(cafeBackWall);

const cafeInteriorFloor=new THREE.Mesh(
  new THREE.PlaneGeometry(.52,7.30),
  new THREE.MeshStandardMaterial({
    color:0xb7a996,
    roughness:.91,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.008,
    envMapIntensity:.05
  })
);
cafeInteriorFloor.rotation.x=-Math.PI/2;
cafeInteriorFloor.position.set(8.12,.065,4.80);
cafeInteriorFloor.receiveShadow=true;
scene.add(cafeInteriorFloor);

const cafeInteriorCeiling=new THREE.Mesh(
  new THREE.PlaneGeometry(.52,7.30),
  new THREE.MeshStandardMaterial({
    color:0xeee5da,
    roughness:.97,
    envMapIntensity:.025
  })
);
cafeInteriorCeiling.rotation.x=Math.PI/2;
cafeInteriorCeiling.position.set(8.12,2.78,4.80);
scene.add(cafeInteriorCeiling);

const cafeCeilingSlot=new THREE.Mesh(
  new THREE.BoxGeometry(.045,.028,4.80),
  new THREE.MeshBasicMaterial({
    color:0xffd6aa,
    transparent:true,
    opacity:.34,
    toneMapped:false
  })
);
cafeCeilingSlot.position.set(8.09,2.74,4.88);
scene.add(cafeCeilingSlot);

const cafeBackGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(5.90,.78),
  new THREE.MeshBasicMaterial({
    color:0xffc98f,
    transparent:true,
    opacity:.040,
    depthWrite:false,
    toneMapped:false
  })
);
cafeBackGlow.position.set(8.375,1.54,4.92);
cafeBackGlow.rotation.y=-Math.PI/2;
scene.add(cafeBackGlow);

[3.12,4.76,6.40].forEach(z=>{
  const underShelfGlow=new THREE.Mesh(
    new THREE.BoxGeometry(.020,.020,.92),
    new THREE.MeshBasicMaterial({
      color:0xffdfbd,
      transparent:true,
      opacity:.28,
      depthWrite:false,
      toneMapped:false
    })
  );
  underShelfGlow.position.set(8.17,1.57,z);
  scene.add(underShelfGlow);
});

const signCanvas=document.createElement('canvas');
signCanvas.width=512;
signCanvas.height=128;
const signCtx=signCanvas.getContext('2d');
signCtx.fillStyle='#f3eee5';
signCtx.fillRect(0,0,512,128);
const cafeSignRnd=makeSeededRandom(0x3417b6cd);
for(let i=0;i<520;i++){
  const dark=cafeSignRnd()>.62;
  signCtx.fillStyle=dark
    ? 'rgba(76,70,63,'+(.006+cafeSignRnd()*.014).toFixed(3)+')'
    : 'rgba(255,255,252,'+(.006+cafeSignRnd()*.012).toFixed(3)+')';
  const r=.3+cafeSignRnd()*.85;
  signCtx.fillRect(cafeSignRnd()*512,cafeSignRnd()*128,r,r);
}
signCtx.strokeStyle='rgba(73,68,62,.13)';
signCtx.lineWidth=2;
signCtx.strokeRect(5,5,502,118);
signCtx.fillStyle='#514b43';
signCtx.font='600 44px Inter, sans-serif';
signCtx.textAlign='center';
signCtx.textBaseline='middle';
signCtx.fillText('NOVA CAFÉ',256,65);
const signTexture=new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace=THREE.SRGBColorSpace;
const cafeSign=new THREE.Mesh(
  new THREE.PlaneGeometry(2.42,.54),
  new THREE.MeshStandardMaterial({
    map:signTexture,
    roughness:.64,
    metalness:.015,
    toneMapped:false
  })
);
cafeSign.position.set(7.77,3.38,4.8);
cafeSign.rotation.y=-Math.PI/2;
scene.add(cafeSign);

const awningCream=new THREE.MeshPhysicalMaterial({
  color:0xf0e5d3,
  roughness:.91,
  metalness:0,
  map:fabricColorTexture,
  bumpMap:fabricMicroBump,
  bumpScale:.007,
  sheen:1,
  sheenColor:new THREE.Color(0xfff1dc),
  sheenRoughness:.88,
  envMapIntensity:.22
});
const awningApricotMap=cloneTextureVariant(fabricColorTexture,.16,.04,1.03,.98);
const awningApricot=new THREE.MeshPhysicalMaterial({
  color:0xd8aa86,
  roughness:.89,
  metalness:0,
  map:awningApricotMap,
  bumpMap:fabricMicroBump,
  bumpScale:.007,
  sheen:1,
  sheenColor:new THREE.Color(0xf4c9a8),
  sheenRoughness:.86,
  envMapIntensity:.20
});
const awningCreamEdge=awningCream.clone();
awningCreamEdge.color.multiplyScalar(.965);
awningCreamEdge.roughness=.90;
const awningApricotEdge=awningApricot.clone();
awningApricotEdge.color.multiplyScalar(.955);
awningApricotEdge.roughness=.89;

const awningFrameMat=new THREE.MeshStandardMaterial({
  color:0x8b8178,
  roughness:.46,
  metalness:.32,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.003,
  envMapIntensity:.82
});

const awningFrontBeam=new THREE.Mesh(
  new THREE.BoxGeometry(.055,.055,5.22),
  awningFrameMat
);
awningFrontBeam.position.set(6.82,2.78,4.80);
awningFrontBeam.rotation.z=-.08;
awningFrontBeam.castShadow=true;
scene.add(awningFrontBeam);

[2.28,4.80,7.32].forEach(z=>{
  const support=new THREE.Mesh(
    new THREE.CylinderGeometry(.018,.018,1.20,8),
    awningFrameMat
  );
  support.position.set(7.18,2.73,z);
  support.rotation.z=Math.PI/2-.12;
  support.castShadow=true;
  scene.add(support);

  const wallBracket=new THREE.Mesh(
    new THREE.BoxGeometry(.08,.15,.06),
    awningFrameMat
  );
  wallBracket.position.set(7.80,2.86,z);
  wallBracket.castShadow=true;
  scene.add(wallBracket);
});

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
    i%2?awningApricotEdge:awningCreamEdge
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

const cafeInteriorWood=new THREE.MeshStandardMaterial({
  color:0xb79473,
  roughness:.82,
  map:woodSurface.map,
  bumpMap:woodSurface.bump,
  bumpScale:.018
});
const cafeInteriorWarm=new THREE.MeshStandardMaterial({
  color:0xe8d9c5,
  roughness:.91,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.008
});
const cafeCounter=new THREE.Mesh(new THREE.BoxGeometry(.32,.86,5.30),cafeInteriorWood);
cafeCounter.position.set(8.18,.72,4.85);
cafeCounter.castShadow=true;
scene.add(cafeCounter);

const cafeCounterTop=new THREE.Mesh(
  new THREE.BoxGeometry(.40,.055,5.42),
  new THREE.MeshStandardMaterial({
    color:0x735f50,
    roughness:.70,
    map:woodSurface.map,
    bumpMap:woodSurface.bump,
    bumpScale:.012,
    envMapIntensity:.22
  })
);
cafeCounterTop.position.set(8.15,1.175,4.85);
cafeCounterTop.castShadow=true;
scene.add(cafeCounterTop);

const cafeCounterToe=new THREE.Mesh(
  new THREE.BoxGeometry(.055,.13,5.18),
  new THREE.MeshStandardMaterial({
    color:0x75695d,
    roughness:.82,
    envMapIntensity:.08
  })
);
cafeCounterToe.position.set(8.00,.17,4.85);
scene.add(cafeCounterToe);

const cafeBenchMat=new THREE.MeshStandardMaterial({
  color:0xb69b82,
  roughness:.87,
  map:woodSurface.map,
  bumpMap:woodSurface.bump,
  bumpScale:.017
});
const cafeBench=new THREE.Mesh(new THREE.BoxGeometry(.34,.40,2.60),cafeBenchMat);
cafeBench.position.set(8.18,.42,6.25);
cafeBench.castShadow=true;
scene.add(cafeBench);

const cafeBenchBack=new THREE.Mesh(
  new THREE.BoxGeometry(.12,.62,2.62),
  cafeBenchMat
);
cafeBenchBack.position.set(8.30,.76,6.25);
cafeBenchBack.castShadow=true;
scene.add(cafeBenchBack);

const cafeBenchCushion=new THREE.Mesh(
  new THREE.BoxGeometry(.24,.075,2.45),
  new THREE.MeshPhysicalMaterial({
    color:0xb7a08c,
    roughness:.88,
    metalness:0,
    sheen:1,
    sheenColor:new THREE.Color(0xd8c1aa),
    sheenRoughness:.90,
    envMapIntensity:.12
  })
);
cafeBenchCushion.position.set(8.00,.66,6.25);
cafeBenchCushion.castShadow=true;
scene.add(cafeBenchCushion);

const cafeSmallTableMat=new THREE.MeshStandardMaterial({
  color:0xc9aa88,
  roughness:.83,
  map:woodSurface.map,
  bumpMap:woodSurface.bump,
  bumpScale:.017
});
[3.45,5.05,6.65].forEach((z,tableIndex)=>{
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.20,.20,.035,20),cafeSmallTableMat);
  top.position.set(7.92,.72,z);
  top.castShadow=true;
  scene.add(top);
  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.022,.030,.60,10),cafeMullionMat);
  stem.position.set(7.92,.41,z);
  stem.castShadow=true;
  scene.add(stem);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.13,.15,.025,18),cafeMullionMat);
  base.position.set(7.92,.095,z);
  base.castShadow=true;
  scene.add(base);

  // A compact chair silhouette behind each table reads through the glazing
  // without crowding the shallow interior.
  const chairZ=z+(tableIndex%2?.31:-.31);
  const chairSeat=new THREE.Mesh(
    new THREE.BoxGeometry(.22,.045,.20),
    cafeBenchMat
  );
  chairSeat.position.set(7.95,.44,chairZ);
  chairSeat.castShadow=true;
  scene.add(chairSeat);

  const chairBack=new THREE.Mesh(
    new THREE.BoxGeometry(.055,.34,.22),
    cafeBenchMat
  );
  chairBack.position.set(8.04,.62,chairZ);
  chairBack.rotation.z=-.08;
  chairBack.castShadow=true;
  scene.add(chairBack);

  [-.075,.075].forEach(offset=>{
    const chairLeg=new THREE.Mesh(
      new THREE.CylinderGeometry(.012,.014,.39,7),
      cafeMullionMat
    );
    chairLeg.position.set(7.94,.235,chairZ+offset);
    chairLeg.castShadow=true;
    scene.add(chairLeg);
  });
});
for(let z=2.95;z<=6.75;z+=1.90){
  const shelf=new THREE.Mesh(new THREE.BoxGeometry(.10,.065,1.15),cafeInteriorWarm);
  shelf.position.set(8.23,1.62,z);
  scene.add(shelf);
}

const cafeDecalCanvas=document.createElement('canvas');
cafeDecalCanvas.width=256;
cafeDecalCanvas.height=512;
const cafeDecalCtx=cafeDecalCanvas.getContext('2d');
cafeDecalCtx.clearRect(0,0,256,512);
cafeDecalCtx.fillStyle='rgba(244,238,225,.92)';
cafeDecalCtx.textAlign='center';
cafeDecalCtx.font='700 30px Inter, sans-serif';
cafeDecalCtx.fillText('OPEN',128,152);
cafeDecalCtx.font='500 18px Inter, sans-serif';
cafeDecalCtx.fillStyle='rgba(244,238,225,.72)';
cafeDecalCtx.fillText('08 — 18',128,186);
cafeDecalCtx.strokeStyle='rgba(244,238,225,.42)';
cafeDecalCtx.lineWidth=2;
cafeDecalCtx.beginPath();
cafeDecalCtx.moveTo(76,212);
cafeDecalCtx.lineTo(180,212);
cafeDecalCtx.stroke();
cafeDecalCtx.font='600 16px Inter, sans-serif';
cafeDecalCtx.fillText('COFFEE · BAKES',128,246);
const cafeDecalTexture=new THREE.CanvasTexture(cafeDecalCanvas);
cafeDecalTexture.colorSpace=THREE.SRGBColorSpace;
const cafeWindowDecal=new THREE.Mesh(
  new THREE.PlaneGeometry(.70,1.38),
  new THREE.MeshBasicMaterial({
    map:cafeDecalTexture,
    transparent:true,
    opacity:.76,
    depthWrite:false,
    toneMapped:false
  })
);
cafeWindowDecal.position.set(7.78,1.56,6.78);
cafeWindowDecal.rotation.y=-Math.PI/2;
scene.add(cafeWindowDecal);

const pastryMat=new THREE.MeshStandardMaterial({color:0xc9996d,roughness:.88});
const trayMat=new THREE.MeshStandardMaterial({color:0x8d8175,roughness:.60,metalness:.16});
[3.25,4.45,5.65].forEach((z,section)=>{
  const tray=new THREE.Mesh(new THREE.BoxGeometry(.26,.025,.72),trayMat);
  tray.position.set(7.87,1.08,z);
  tray.castShadow=true;
  scene.add(tray);

  [-.22,0,.22].forEach((oz,i)=>{
    const pastry=new THREE.Mesh(
      new THREE.CylinderGeometry(.055+(i%2)*.012,.065,.055,12),
      pastryMat
    );
    pastry.position.set(7.72,1.14,z+oz);
    pastry.rotation.z=Math.PI/2;
    pastry.castShadow=true;
    scene.add(pastry);
  });
});


// Buildings across the road give the boulevard depth but stay light enough for
// the AI character to remain the visual focus.
const farBuildingColors=[0xdde0dc,0xd6dddd,0xe6e1d9,0xd2d9d8];
for(let i=0;i<10;i++){
  const z=-36+i*8.3;
  const h=5.2+(i%4)*1.6;
  const b=box(3.8,h,6.4,farBuildingColors[i%farBuildingColors.length],-15.2,h/2-.02,z,.82);
  b.castShadow=false;
  const farBaseMap=i%2?concreteSurface.map:facadeSurface.map;
  const farBaseBump=i%2?concreteSurface.bump:facadeSurface.bump;
  const farOffsetX=(i*.137)%1;
  const farOffsetY=(i*.219)%1;
  b.material.map=cloneTextureVariant(
    farBaseMap,
    farOffsetX,
    farOffsetY,
    .88+(i%4)*.055,
    .92+((i+2)%4)*.045,
    (i%3-1)*.004
  );
  b.material.bumpMap=cloneTextureVariant(
    farBaseBump,
    farOffsetX,
    farOffsetY,
    .88+(i%4)*.055,
    .92+((i+2)%4)*.045,
    (i%3-1)*.004
  );
  b.material.bumpScale=i%2?.008:.010;
  b.material.needsUpdate=true;

  const parapetMat=new THREE.MeshStandardMaterial({
    color:[0xc8d0cc,0xcbd3d1,0xd8d2c8][i%3],
    roughness:.91,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.007,
    envMapIntensity:.05
  });
  const parapet=new THREE.Mesh(
    new THREE.BoxGeometry(3.92,.12,6.52),
    parapetMat
  );
  parapet.position.set(-15.2,h+.06,z);
  parapet.castShadow=false;
  scene.add(parapet);

  // Vary the roofline so the opposite side of the boulevard does not read as
  // ten identical shoeboxes. Small setbacks and service cores are enough at
  // this distance to create a believable city silhouette.
  if(i%3!==1){
    const setbackW=2.3+(i%2)*.45;
    const setbackD=3.0+((i+1)%3)*.55;
    const setbackH=.48+(i%3)*.22;
    const setback=new THREE.Mesh(
      new THREE.BoxGeometry(setbackW,setbackH,setbackD),
      new THREE.MeshStandardMaterial({
        color:[0xcbd0cc,0xd7d3ca,0xbfc9c8][i%3],
        roughness:.89,
        map:i%2?concreteSurface.map:facadeSurface.map,
        bumpMap:i%2?concreteSurface.bump:facadeSurface.bump,
        bumpScale:.006,
        envMapIntensity:.045
      })
    );
    setback.position.set(
      -15.2+(i%2?.24:-.18),
      h+setbackH*.5+.13,
      z+(i%3-1)*.28
    );
    setback.castShadow=false;
    scene.add(setback);
  }

  if(i%4===0 || i%4===3){
    const serviceBox=new THREE.Mesh(
      new THREE.BoxGeometry(.92,.42,1.15),
      new THREE.MeshStandardMaterial({
        color:0x929b99,
        roughness:.68,
        metalness:.18,
        map:metalWearTexture,
        bumpMap:metalSurface.bump,
        bumpScale:.003,
        envMapIntensity:.45
      })
    );
    serviceBox.position.set(-15.38,h+.37,z+(i%2?.72:-.65));
    scene.add(serviceBox);

    const ventCap=new THREE.Mesh(
      new THREE.BoxGeometry(1.02,.055,1.25),
      parapetMat
    );
    ventCap.position.set(-15.38,h+.61,z+(i%2?.72:-.65));
    scene.add(ventCap);
  }

  for(let level=.9;level<h-.6;level+=1.22){
    const floorIndex=Math.round((level-.9)/1.22);
    const windowCount=i%3===0?3:4;
    const spacing=5.10/(windowCount-1);
    const width=windowCount===3?1.16:.82;

    for(let wIndex=0;wIndex<windowCount;wIndex++){
      const windowTone=(floorIndex+wIndex+i)%3;
      const litVariation=((floorIndex*3+wIndex+i)%7===0);
      const win=new THREE.Mesh(
        new THREE.PlaneGeometry(width,.66),
        new THREE.MeshPhysicalMaterial({
          color:litVariation
            ? 0xc5c8b9
            : [0xaabec3,0xb2c4c7,0xa1b7bc][windowTone],
          map:cloneTextureVariant(
            glassReflectionTexture,
            (i*.11+level*.07+wIndex*.13)%1,
            (i*.17+level*.03)%1,
            .92+(wIndex%2)*.09,
            1
          ),
          roughnessMap:cloneTextureVariant(
            glassRoughnessTexture,
            (i*.11+level*.07+wIndex*.13)%1,
            (i*.17+level*.03)%1,
            .92+(wIndex%2)*.09,
            1
          ),
          roughness:litVariation?.34:.27,
          metalness:.025,
          transparent:true,
          opacity:litVariation?.76:.82,
          clearcoat:.18,
          clearcoatRoughness:.30,
          emissive:litVariation?0x6d6758:0x000000,
          emissiveIntensity:litVariation?.028:0
        })
      );
      win.position.set(
        -13.27,
        level,
        z-2.55+wIndex*spacing
      );
      win.rotation.y=Math.PI/2;
      scene.add(win);
    }

    const spandrel=new THREE.Mesh(
      new THREE.BoxGeometry(.06,.10,5.95),
      new THREE.MeshStandardMaterial({
        color:[0xadb5b1,0xbab7af,0xa6b1af][i%3],
        roughness:.78,
        metalness:.08,
        envMapIntensity:.20
      })
    );
    spandrel.position.set(-13.30,level-.43,z);
    scene.add(spandrel);
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
      roughnessMap:glassRoughnessTexture,
      roughness:.22,
      metalness:.025,
      transparent:true,
      opacity:.50,
      transmission:.10,
      clearcoat:.34,
      clearcoatRoughness:.20,
      envMapIntensity:.82
    })
  );
  body.position.set(x,h/2,z);
  body.receiveShadow=true;
  scene.add(body);

  const mullionMat=new THREE.MeshStandardMaterial({
    color:0x919e9f,
    roughness:.46,
    metalness:.22,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003
  });
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

  const roofMat=new THREE.MeshStandardMaterial({
    color:0xaeb8b9,
    roughness:.58,
    metalness:.14,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.58
  });
  const roof=new THREE.Mesh(
    new THREE.BoxGeometry(w+.20,.16,d+.20),
    roofMat
  );
  roof.position.set(x,h+.08,z);
  scene.add(roof);

  const rooftopCore=new THREE.Mesh(
    new THREE.BoxGeometry(w*.42,.62,d*.36),
    new THREE.MeshStandardMaterial({
      color:0xbfc6c4,
      roughness:.78,
      metalness:.08,
      map:concreteSurface.map,
      bumpMap:concreteSurface.bump,
      bumpScale:.005,
      envMapIntensity:.08
    })
  );
  rooftopCore.position.set(x+.18,h+.39,z-.16);
  scene.add(rooftopCore);

  const crownFrame=new THREE.Mesh(
    new THREE.BoxGeometry(w*.48,.06,d*.42),
    roofMat
  );
  crownFrame.position.set(x+.18,h+.72,z-.16);
  scene.add(crownFrame);

  [-.30,.30].forEach(side=>{
    const fin=new THREE.Mesh(
      new THREE.BoxGeometry(.035,.72,d*.72),
      mullionMat
    );
    fin.position.set(x+side*w*.46,h-.55,z);
    scene.add(fin);
  });
}

createGlassTower(-17.8,-4.8,4.4,7.0,12.4,0xa8c8d2);
createGlassTower(-19.2,16.2,4.8,6.4,10.6,0xb7ccd2);

// Low-detail buildings continue beyond the playable road. Their desaturated
// palette and reduced contrast keep them atmospheric while giving the street a
// real vanishing corridor rather than a visible world boundary.
const distantBlockPalette=[0xc6cdca,0xd1d0c8,0xbfc8c6,0xd5d2ca];
[
  [-15.2,-61,5.6,8.4,8.8],
  [-14.8,-72,6.0,7.0,11.2],
  [8.8,-61,4.8,7.6,9.4],
  [9.6,-71,5.4,6.8,12.0],
  [9.1,-80,5.0,6.2,10.4]
].forEach(([x,z,w,d,h],index)=>{
  const block=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color:distantBlockPalette[index%distantBlockPalette.length],
      roughness:.91,
      map:index%2?concreteSurface.map:facadeSurface.map,
      bumpMap:index%2?concreteSurface.bump:facadeSurface.bump,
      bumpScale:.004,
      envMapIntensity:.035
    })
  );
  block.position.set(x,h/2,z);
  scene.add(block);

  const crown=new THREE.Mesh(
    new THREE.BoxGeometry(w*.62,.30,d*.58),
    new THREE.MeshStandardMaterial({
      color:0xb7c0bd,
      roughness:.88,
      envMapIntensity:.03
    })
  );
  crown.position.set(x+(index%2?.24:-.16),h+.15,z);
  scene.add(crown);

  const distantWindowMat=new THREE.MeshBasicMaterial({
    color:index%2?0xaebfbe:0xb7c2bd,
    transparent:true,
    opacity:.34,
    toneMapped:false
  });
  for(let y=1.3;y<h-.8;y+=1.55){
    const band=new THREE.Mesh(
      new THREE.PlaneGeometry(d*.68,.34),
      distantWindowMat
    );
    band.position.set(x-(w/2+.008),y,z);
    band.rotation.y=Math.PI/2;
    scene.add(band);
  }
});

// Tiny visual-only traffic lives beyond the playable area. It never enters the
// main vehicle system, so it cannot affect collision, GLB readiness or wheel
// animation; it only gives the vanishing corridor a little city motion.
const distantTrafficCues=[];
function createDistantTrafficCue(x,z,direction,color){
  const group=new THREE.Group();
  const bodyMat=new THREE.MeshStandardMaterial({
    color,
    roughness:.48,
    metalness:.16,
    envMapIntensity:.36
  });
  const glassMat=new THREE.MeshPhysicalMaterial({
    color:0x9fb2b5,
    roughness:.30,
    metalness:.02,
    transparent:true,
    opacity:.72,
    clearcoat:.14,
    clearcoatRoughness:.32,
    envMapIntensity:.46
  });
  const darkMat=new THREE.MeshStandardMaterial({
    color:0x333837,
    roughness:.90
  });

  const body=new THREE.Mesh(new THREE.BoxGeometry(1.18,.30,2.15),bodyMat);
  body.position.y=.36;
  group.add(body);

  const cabin=new THREE.Mesh(new THREE.BoxGeometry(.98,.34,1.02),glassMat);
  cabin.position.set(0,.62,-.10);
  group.add(cabin);

  [-.61,.61].forEach(wx=>{
    [-.66,.66].forEach(wz=>{
      const wheel=new THREE.Mesh(
        new THREE.CylinderGeometry(.15,.15,.09,12),
        darkMat
      );
      wheel.rotation.z=Math.PI/2;
      wheel.position.set(wx,.19,wz);
      group.add(wheel);
    });
  });

  const lightMat=new THREE.MeshBasicMaterial({
    color:direction>0?0xe8e0c9:0x9b5a54,
    transparent:true,
    opacity:.52,
    toneMapped:false
  });
  [-.32,.32].forEach(side=>{
    const light=new THREE.Mesh(new THREE.PlaneGeometry(.16,.055),lightMat);
    light.position.set(side,.39,direction>0?1.081:-1.081);
    if(direction<0) light.rotation.y=Math.PI;
    group.add(light);
  });

  group.position.set(x,0,z);
  if(direction<0) group.rotation.y=Math.PI;
  group.scale.setScalar(.76);
  scene.add(group);
  distantTrafficCues.push({
    group,
    direction,
    speed:.48+(distantTrafficCues.length*.09),
    phase:distantTrafficCues.length*1.7
  });
}
createDistantTrafficCue(-8.95,-72,1,0xb7bbb6);
createDistantTrafficCue(-5.70,-57,-1,0x87999d);
createDistantTrafficCue(-9.10,-52,1,0xc9bdae);

// Soft skyline silhouettes keep the horizon bright and city-like.
for(let i=0;i<9;i++){
  const h=9+(i%5)*2.4;
  const x=-19-i*1.3;
  const z=-36+i*8.8;
  const tower=box(5.0,h,5.0,[0xc3cdcf,0xd0d5d3,0xb8c6c8][i%3],x,h/2,z,.89);
  tower.castShadow=false;
  const skylineBase=i%3===1?facadeSurface:concreteSurface;
  const sx=(i*.191)%1;
  const sy=(i*.083)%1;
  tower.material.map=cloneTextureVariant(
    skylineBase.map,
    sx,
    sy,
    .76+(i%3)*.09,
    .82+((i+1)%3)*.08,
    (i%2?.003:-.003)
  );
  tower.material.bumpMap=cloneTextureVariant(
    skylineBase.bump,
    sx,
    sy,
    .76+(i%3)*.09,
    .82+((i+1)%3)*.08,
    (i%2?.003:-.003)
  );
  tower.material.bumpScale=.006;
  tower.material.needsUpdate=true;

  if(i%3===0){
    const crown=new THREE.Mesh(
      new THREE.BoxGeometry(3.3,.65,3.5),
      new THREE.MeshStandardMaterial({
        color:0xb8c0bd,
        roughness:.84,
        map:concreteSurface.map,
        bumpMap:concreteSurface.bump,
        bumpScale:.004,
        envMapIntensity:.05
      })
    );
    crown.position.set(x+.18,h+.325,z-.10);
    scene.add(crown);
  }else if(i%3===1){
    const cap=new THREE.Mesh(
      new THREE.CylinderGeometry(1.15,1.35,.48,6),
      new THREE.MeshStandardMaterial({
        color:0xaeb9b8,
        roughness:.66,
        metalness:.12,
        map:metalWearTexture,
        bumpMap:metalSurface.bump,
        bumpScale:.002,
        envMapIntensity:.36
      })
    );
    cap.position.set(x,h+.24,z);
    cap.rotation.y=Math.PI/6;
    scene.add(cap);
  }else{
    const twinA=new THREE.Mesh(
      new THREE.BoxGeometry(1.35,.52,2.8),
      new THREE.MeshStandardMaterial({
        color:0xc8c5bd,
        roughness:.86,
        map:facadeSurface.map,
        bumpMap:facadeSurface.bump,
        bumpScale:.004,
        envMapIntensity:.05
      })
    );
    twinA.position.set(x-.85,h+.26,z);
    scene.add(twinA);
    const twinB=twinA.clone();
    twinB.position.x=x+.85;
    twinB.scale.y=.72;
    twinB.position.y=h+.19;
    scene.add(twinB);
  }
}

// Trees, planters and street furniture make this feel like somewhere Mira
// actually spends time instead of a sterile tech showcase.
const streetTreeCrowns=[];
function createStreetTree(x,z,scale=1){
  const pit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.18*scale,1.18*scale),
    new THREE.MeshStandardMaterial({
      color:0x897a66,
      roughness:1,
      map:concreteSurface.map,
      bumpMap:concreteSurface.bump,
      bumpScale:.010,
      envMapIntensity:.035
    })
  );
  pit.rotation.x=-Math.PI/2;
  pit.position.set(x,.041,z);
  pit.receiveShadow=true;
  scene.add(pit);

  const grateMat=new THREE.MeshStandardMaterial({
    color:0x626b67,
    roughness:.58,
    metalness:.42,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.004,
    envMapIntensity:.84,
    side:THREE.DoubleSide
  });
  const grate=new THREE.Mesh(
    new THREE.RingGeometry(.32*scale,.50*scale,20),
    grateMat
  );
  grate.rotation.x=-Math.PI/2;
  grate.position.set(x,.046,z);
  scene.add(grate);

  for(let spokeIndex=0;spokeIndex<12;spokeIndex++){
    const angle=spokeIndex*Math.PI/6;
    const spoke=new THREE.Mesh(
      new THREE.BoxGeometry(.018*scale,.012,.18*scale),
      grateMat
    );
    spoke.position.set(
      x+Math.sin(angle)*.405*scale,
      .050,
      z+Math.cos(angle)*.405*scale
    );
    spoke.rotation.y=angle;
    scene.add(spoke);
  }

  const pitFrame=new THREE.Mesh(
    new THREE.RingGeometry(.51*scale,.58*scale,4),
    new THREE.MeshStandardMaterial({
      color:0xb7aea0,
      roughness:.94,
      map:concreteSurface.map,
      bumpMap:concreteSurface.bump,
      bumpScale:.008,
      side:THREE.DoubleSide
    })
  );
  pitFrame.rotation.x=-Math.PI/2;
  pitFrame.rotation.z=Math.PI/4;
  pitFrame.position.set(x,.043,z);
  scene.add(pitFrame);

  const trunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.10*scale,.145*scale,2.55*scale,12),
    new THREE.MeshStandardMaterial({
      color:0x8c735d,
      roughness:.96,
      map:barkSurface.map,
      bumpMap:barkSurface.bump,
      bumpScale:.028
    })
  );
  trunk.position.set(x,1.275*scale,z);
  trunk.castShadow=true;
  scene.add(trunk);

  const branchMat=new THREE.MeshStandardMaterial({
    color:0x8a725d,
    roughness:.96,
    map:barkSurface.map,
    bumpMap:barkSurface.bump,
    bumpScale:.022
  });
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
    makeFoliageMaterial(0x7ba56f,.91,.010,.020),
    makeFoliageMaterial(0x91b77e,.89,.009,.024),
    makeFoliageMaterial(0x6f9765,.93,.011,.016)
  ];
  [
    [0,.02,0,.86,1.08,.92,.04],
    [-.42,.02,.06,.62,1.12,.88,-.12],
    [.40,.10,-.06,.68,1.06,.90,.11],
    [-.18,.46,-.02,.60,1.14,.86,-.08],
    [.24,.50,.04,.57,1.12,.88,.10],
    [0,.82,0,.49,1.16,.84,-.04]
  ].forEach(([ox,oy,oz,r,sy,sz,rz],index)=>{
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(r*scale,2),leafMats[index%leafMats.length]);
    leaf.position.set(ox*scale,oy*scale,oz*scale);
    leaf.scale.set(.86,sy*1.06,sz*.90);
    leaf.rotation.z=rz;
    leaf.rotation.y=(index-2.5)*.08;
    leaf.castShadow=true;
    leaf.receiveShadow=true;
    crown.add(leaf);
  });

  // Smaller outer clusters interrupt the six-lobed "balloon" silhouette and
  // create twig-scale depth without the cost of thousands of leaf cards.
  [
    [-.66,.18,.18,.25,.82,1.18,.72],
    [.63,.26,.12,.28,.88,1.12,.76],
    [-.49,.68,-.14,.24,.80,1.22,.70],
    [.46,.78,-.10,.22,.84,1.20,.74],
    [-.10,1.02,.08,.21,.78,1.24,.68],
    [.18,-.20,.16,.27,.92,1.06,.80]
  ].forEach(([ox,oy,oz,r,sx,sy,sz],index)=>{
    const cluster=new THREE.Mesh(
      new THREE.IcosahedronGeometry(r*scale,1),
      leafMats[(index+1)%leafMats.length]
    );
    cluster.position.set(ox*scale,oy*scale,oz*scale);
    cluster.scale.set(sx,sy,sz);
    cluster.rotation.set(
      (index%2?.08:-.06),
      index*.31,
      (index%3-1)*.10
    );
    cluster.castShadow=true;
    cluster.receiveShadow=true;
    crown.add(cluster);
  });

  const crownShadeMat=makeFoliageMaterial(0x63875e,.94,.010,.012);
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

  const highlightMat=makeFoliageMaterial(0xa8c895,.87,.008,.030);
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

const curbGroundcoverMat=makeFoliageMaterial(0x8ea27a,.93,.009,.018);
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
  const planterBase=box(w,.42,.72,0xbcb09d,x,.22,z,.94);
  planterBase.material.map=concreteSurface.map;
  planterBase.material.bumpMap=concreteSurface.bump;
  planterBase.material.bumpScale=.014;
  planterBase.material.needsUpdate=true;
  const greens=[
    makeFoliageMaterial(0x789d70,.93,.009,.016),
    makeFoliageMaterial(0x91b77e,.90,.008,.022),
    makeFoliageMaterial(0x6f9765,.94,.010,.014)
  ];
  const offsets=[
    [-.34,-.05,.94,-.10],
    [-.18,.04,1.08,.08],
    [0,-.03,.98,-.05],
    [.19,.05,1.12,.12],
    [.35,-.02,.92,-.08]
  ];
  offsets.forEach(([nx,nz,ss,tilt],i)=>{
    const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.25,1),greens[i%greens.length]);
    shrub.scale.set(1.18*ss,.78*ss,.92*ss);
    shrub.position.set(x+w*nx,.54+(i%2)*.035,z+nz);
    shrub.rotation.set(tilt*.4,(i-2)*.28,tilt);
    shrub.castShadow=true;
    scene.add(shrub);

    const tip=new THREE.Mesh(
      new THREE.IcosahedronGeometry(.13,1),
      greens[(i+1)%greens.length]
    );
    tip.scale.set(.78,1.10,.72);
    tip.position.set(
      x+w*nx+(i%2?.055:-.045),
      .70+(i%2)*.030,
      z+nz+(i%2?-.025:.035)
    );
    tip.rotation.z=-tilt;
    tip.castShadow=true;
    scene.add(tip);
  });
}
createPlanter(6.6,-8.3,2.2);
createPlanter(6.6,11.8,2.5);

const lowHedgeMat=makeFoliageMaterial(0x78956e,.93,.009,.014);
const hedgeBed=box(3.6,.22,.82,0xaa9d88,5.65,.11,-13.0,.95);
hedgeBed.castShadow=false;
hedgeBed.material.map=concreteSurface.map;
hedgeBed.material.bumpMap=concreteSurface.bump;
hedgeBed.material.bumpScale=.013;
hedgeBed.material.needsUpdate=true;
for(let i=0;i<9;i++){
  const shrub=new THREE.Mesh(new THREE.IcosahedronGeometry(.24+(i%3)*.025,1),lowHedgeMat);
  shrub.scale.set(1.14,.74,.98);
  shrub.position.set(4.20+i*.36,.42+(i%3)*.018,-13.0+([-.06,.03,.08][i%3]));
  shrub.rotation.set((i%2?1:-1)*.05,i*.21,(i%3-1)*.07);
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
  new THREE.MeshStandardMaterial({
    color:0xe6ddce,
    roughness:.96,
    map:pavementTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.008
  })
);
miraPocket.rotation.x=-Math.PI/2;
miraPocket.position.set(3.75,.044,-1.55);
miraPocket.receiveShadow=true;
scene.add(miraPocket);

const miraAmbientPool=createSunPool(3.18,-1.62,3.5,3.9,.10);
miraAmbientPool.position.y=.056;


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

const pocketBorderMat=new THREE.MeshStandardMaterial({
  color:0xb8ad9d,
  roughness:.93,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.012
});
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
  new THREE.MeshStandardMaterial({
    color:0xcec8bb,
    roughness:.96,
    map:pavementTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.010
  })
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

const seatStone=new THREE.MeshStandardMaterial({
  color:0xc0b6a6,
  roughness:.95,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.014,
  envMapIntensity:.07
});
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
  makeFoliageMaterial(0x789a70,.92,.009,.016),
  makeFoliageMaterial(0x86a879,.89,.008,.022)
];
for(let i=0;i<7;i++){
  const shrub=new THREE.Mesh(
    new THREE.IcosahedronGeometry(.25+(i%2)*.035,1),
    pocketGreenMats[i%2]
  );
  shrub.scale.set(1.08,.76,.90);
  shrub.position.set(5.30+i*.31,.66,-2.27+(i%2)*.035);
  shrub.rotation.set((i%2?.06:-.05),i*.27,(i%3-1)*.08);
  shrub.castShadow=true;
  scene.add(shrub);
}

// Drainage slots and dappled tree shade add foreground realism where the player
// spends the most time.
const drainMat=new THREE.MeshStandardMaterial({
  color:0x59615f,
  roughness:.46,
  metalness:.56,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.0035,
  envMapIntensity:.92
});
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
  new THREE.MeshStandardMaterial({
    color:0xc3b6a3,
    roughness:.96,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.014,
    envMapIntensity:.065
  })
);
focalPlanterBase.position.set(4.95,.18,-4.72);
focalPlanterBase.castShadow=true;
focalPlanterBase.receiveShadow=true;
scene.add(focalPlanterBase);

const focalPlantMats=[
  makeFoliageMaterial(0x7d9f72,.92,.009,.016),
  makeFoliageMaterial(0x91ad7e,.89,.008,.024)
];
[
  [-.70,.00,.92],
  [-.42,.04,1.06],
  [-.12,-.03,.96],
  [.18,.04,1.10],
  [.48,-.02,.98],
  [.72,.03,.90]
].forEach(([ox,oz,ss],i)=>{
  const plant=new THREE.Mesh(new THREE.IcosahedronGeometry(.24,1),focalPlantMats[i%2]);
  plant.scale.set(1.08*ss,.74*ss,.92*ss);
  plant.position.set(4.95+ox,.48+(i%2)*.035,-4.72+oz);
  plant.rotation.set((i%2?.07:-.05),i*.35,(i%3-1)*.09);
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
  const metal=new THREE.MeshStandardMaterial({
    color:0x687170,
    roughness:.45,
    metalness:.48,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.004,
    envMapIntensity:.94
  });
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.060,3.2,12),metal);
  pole.position.set(x,1.6,z);
  pole.castShadow=true;
  scene.add(pole);

  const base=new THREE.Mesh(new THREE.CylinderGeometry(.12,.15,.10,16),metal);
  base.position.set(x,.05,z);
  base.castShadow=true;
  scene.add(base);

  const collar=new THREE.Mesh(new THREE.CylinderGeometry(.068,.068,.055,14),metal);
  collar.position.set(x,2.96,z);
  collar.castShadow=true;
  scene.add(collar);

  // Two-piece arm creates a softer contemporary street-light silhouette.
  const armA=new THREE.Mesh(new THREE.CylinderGeometry(.024,.028,.46,10),metal);
  armA.position.set(x-.16,3.10,z);
  armA.rotation.z=Math.PI/2-.28;
  armA.castShadow=true;
  scene.add(armA);

  const armB=new THREE.Mesh(new THREE.CylinderGeometry(.022,.024,.34,10),metal);
  armB.position.set(x-.48,3.19,z);
  armB.rotation.z=Math.PI/2+.08;
  armB.castShadow=true;
  scene.add(armB);

  const lampHousing=new THREE.Mesh(
    new THREE.BoxGeometry(.34,.115,.19),
    new THREE.MeshStandardMaterial({
      color:0x7a8380,
      roughness:.38,
      metalness:.42,
      map:metalWearTexture,
      bumpMap:metalSurface.bump,
      bumpScale:.003,
      envMapIntensity:.90
    })
  );
  lampHousing.position.set(x-.66,3.17,z);
  lampHousing.rotation.z=.035;
  lampHousing.castShadow=true;
  scene.add(lampHousing);

  const lens=new THREE.Mesh(
    new THREE.PlaneGeometry(.26,.12),
    new THREE.MeshPhysicalMaterial({
      color:0xf1eee2,
      roughness:.24,
      metalness:0,
      transparent:true,
      opacity:.92,
      emissive:0xe9e3d5,
      emissiveIntensity:.035,
      clearcoat:.20,
      clearcoatRoughness:.30
    })
  );
  lens.position.set(x-.66,3.105,z+.098);
  lens.rotation.x=-Math.PI/2;
  scene.add(lens);

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
  new THREE.MeshStandardMaterial({
    color:0x66716e,
    roughness:.47,
    metalness:.42,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.004,
    envMapIntensity:.90
  })
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
const wayfindingSignFrame=new THREE.Mesh(
  new THREE.BoxGeometry(.055,.56,1.05),
  new THREE.MeshStandardMaterial({
    color:0x6d7875,
    roughness:.44,
    metalness:.44,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.88
  })
);
wayfindingSignFrame.position.set(.635,1.80,-16.1);
wayfindingSignFrame.castShadow=true;
scene.add(wayfindingSignFrame);

const wayfindingSign=new THREE.Mesh(
  new THREE.PlaneGeometry(.96,.48),
  new THREE.MeshStandardMaterial({
    map:wayfindingTexture,
    roughness:.62,
    metalness:.03,
    side:THREE.DoubleSide,
    toneMapped:false
  })
);
wayfindingSign.position.set(.607,1.80,-16.1);
wayfindingSign.rotation.y=Math.PI/2;
scene.add(wayfindingSign);

const wayfindingCap=new THREE.Mesh(
  new THREE.CylinderGeometry(.075,.075,.035,12),
  new THREE.MeshStandardMaterial({
    color:0x808986,
    roughness:.40,
    metalness:.46,
    envMapIntensity:.88
  })
);
wayfindingCap.position.set(.48,2.275,-16.1);
scene.add(wayfindingCap);

// A bench and bike rack near the cafe create readable points of interest for
// future Scanner/Map interactions.
const benchWoodMap=woodSurface.map.clone();
benchWoodMap.rotation=Math.PI/2;
benchWoodMap.center.set(.5,.5);
benchWoodMap.needsUpdate=true;
const benchWoodBump=woodSurface.bump.clone();
benchWoodBump.rotation=Math.PI/2;
benchWoodBump.center.set(.5,.5);
benchWoodBump.needsUpdate=true;
const benchWood=new THREE.MeshStandardMaterial({
  color:0xb09073,
  roughness:.88,
  map:benchWoodMap,
  bumpMap:benchWoodBump,
  bumpScale:.020,
  envMapIntensity:.18
});
const benchMetal=new THREE.MeshStandardMaterial({
  color:0x707875,
  roughness:.44,
  metalness:.46,
  map:metalSurface.map,
  bumpMap:metalSurface.bump,
  bumpScale:.005,
  envMapIntensity:.92
});
// Separate timber slats produce real gaps and edge highlights instead of one
// monolithic wooden box.
[-.16,0,.16].forEach((zOffset,index)=>{
  const slat=new THREE.Mesh(new THREE.BoxGeometry(1.75,.085,.13),benchWood);
  slat.position.set(6.15,.54,-5.55+zOffset);
  slat.rotation.x=(index-1)*.010;
  slat.castShadow=true;
  scene.add(slat);
});
[-.15,0,.15].forEach((yOffset,index)=>{
  const backSlat=new THREE.Mesh(new THREE.BoxGeometry(1.75,.12,.065),benchWood);
  backSlat.position.set(6.15,.82+yOffset,-5.35-yOffset*.12);
  backSlat.rotation.x=-.12;
  backSlat.castShadow=true;
  scene.add(backSlat);
});

[-.70,.70].forEach(offset=>{
  const leg=new THREE.Mesh(new THREE.BoxGeometry(.07,.50,.07),benchMetal);
  leg.position.set(6.15+offset,.27,-5.55);
  leg.castShadow=true;
  scene.add(leg);

  const support=new THREE.Mesh(new THREE.BoxGeometry(.07,.06,.52),benchMetal);
  support.position.set(6.15+offset,.49,-5.54);
  support.castShadow=true;
  scene.add(support);

  const backPost=new THREE.Mesh(new THREE.BoxGeometry(.06,.53,.06),benchMetal);
  backPost.position.set(6.15+offset,.71,-5.38);
  backPost.rotation.x=-.12;
  backPost.castShadow=true;
  scene.add(backPost);
});

for(let i=0;i<3;i++){
  const rack=new THREE.Mesh(new THREE.TorusGeometry(.27,.025,8,24,Math.PI),benchMetal);
  rack.rotation.x=Math.PI/2;
  rack.rotation.z=Math.PI/2;
  rack.position.set(5.85+i*.55,.35,-9.8);
  rack.castShadow=true;
  scene.add(rack);
}

function createStreetBike(x,z,rotation=.08){
  const bike=new THREE.Group();
  const tireMat=new THREE.MeshStandardMaterial({
    color:0x333a39,
    roughness:.96,
    metalness:0,
    bumpMap:rubberMicroBump,
    bumpScale:.010,
    envMapIntensity:.08
  });
  const frameMat=new THREE.MeshStandardMaterial({
    color:0x7f8d88,
    roughness:.40,
    metalness:.54,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.003,
    envMapIntensity:.88
  });
  const spokeMat=new THREE.MeshStandardMaterial({
    color:0xaab0ad,
    roughness:.34,
    metalness:.66,
    envMapIntensity:.95
  });
  const seatMat=new THREE.MeshStandardMaterial({
    color:0x574b43,
    roughness:.91,
    metalness:0,
    envMapIntensity:.10
  });

  [-.42,.42].forEach(wz=>{
    const wheel=new THREE.Mesh(new THREE.TorusGeometry(.26,.022,8,32),tireMat);
    wheel.rotation.y=Math.PI/2;
    wheel.position.set(0,.30,wz);
    wheel.castShadow=true;
    bike.add(wheel);

    const rim=new THREE.Mesh(new THREE.TorusGeometry(.225,.008,6,28),spokeMat);
    rim.rotation.y=Math.PI/2;
    rim.position.set(0,.30,wz);
    bike.add(rim);

    const hub=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.07,10),spokeMat);
    hub.rotation.z=Math.PI/2;
    hub.position.set(0,.30,wz);
    bike.add(hub);

    for(let s=0;s<8;s++){
      const angle=s*Math.PI/4;
      const spoke=new THREE.Mesh(
        new THREE.CylinderGeometry(.0025,.0025,.20,5),
        spokeMat
      );
      spoke.position.set(
        0,
        .30+Math.sin(angle)*.10,
        wz+Math.cos(angle)*.10
      );
      spoke.rotation.x=angle;
      bike.add(spoke);
    }
  });

  const points=[
    [new THREE.Vector3(0,.30,-.36),new THREE.Vector3(0,.62,-.05)],
    [new THREE.Vector3(0,.62,-.05),new THREE.Vector3(0,.30,.34)],
    [new THREE.Vector3(0,.30,.34),new THREE.Vector3(0,.30,-.36)],
    [new THREE.Vector3(0,.62,-.05),new THREE.Vector3(0,.72,.24)]
  ];
  points.forEach(([a,b])=>{
    const d=b.clone().sub(a);
    const tube=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,d.length(),8),frameMat);
    tube.position.copy(a).add(b).multiplyScalar(.5);
    tube.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());
    tube.castShadow=true;
    bike.add(tube);
  });

  const seat=new THREE.Mesh(new THREE.BoxGeometry(.10,.045,.23),seatMat);
  seat.position.set(0,.67,-.12);
  seat.rotation.x=.06;
  bike.add(seat);

  const seatPost=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.18,8),frameMat);
  seatPost.position.set(0,.59,-.10);
  bike.add(seatPost);

  const handleStem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.014,.18,8),frameMat);
  handleStem.position.set(0,.69,.27);
  handleStem.rotation.x=-.18;
  bike.add(handleStem);

  const handle=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,.30,8),frameMat);
  handle.rotation.z=Math.PI/2;
  handle.position.set(0,.77,.31);
  bike.add(handle);

  const chainRing=new THREE.Mesh(new THREE.TorusGeometry(.075,.008,6,22),spokeMat);
  chainRing.rotation.y=Math.PI/2;
  chainRing.position.set(0,.34,-.03);
  bike.add(chainRing);

  [-1,1].forEach(side=>{
    const crank=new THREE.Mesh(new THREE.BoxGeometry(.018,.018,.13),spokeMat);
    crank.position.set(side*.018,.34,-.03);
    crank.rotation.x=side*.52;
    bike.add(crank);

    const pedal=new THREE.Mesh(new THREE.BoxGeometry(.06,.012,.025),seatMat);
    pedal.position.set(side*.030,.34+side*.055,-.03+side*.045);
    bike.add(pedal);
  });

  const rearFender=new THREE.Mesh(
    new THREE.TorusGeometry(.285,.010,6,24,Math.PI*.78),
    frameMat
  );
  rearFender.rotation.set(Math.PI/2,0,Math.PI*.12);
  rearFender.position.set(0,.31,-.42);
  bike.add(rearFender);

  bike.position.set(x,0,z);
  bike.rotation.y=rotation;
  scene.add(bike);
  return bike;
}
createStreetBike(5.93,-9.72,.08);
createStreetBike(6.48,-9.88,-.10);


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
  new THREE.MeshStandardMaterial({
    color:0xe9e1d5,
    roughness:.965,
    map:pavementTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.009,
    envMapIntensity:.05
  })
);
cafeTerrace.rotation.x=-Math.PI/2;
cafeTerrace.position.set(5.95,.046,6.95);
cafeTerrace.receiveShadow=true;
scene.add(cafeTerrace);

const terraceTrimMat=new THREE.MeshStandardMaterial({
  color:0xcfc4b6,
  roughness:.94,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.009,
  envMapIntensity:.06
});
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

const cafeTableWood=new THREE.MeshStandardMaterial({
  color:0xc39b78,
  roughness:.84,
  map:woodSurface.map,
  bumpMap:woodSurface.bump,
  bumpScale:.020
});
const cafeTableMetal=new THREE.MeshStandardMaterial({
  color:0x7f8783,
  roughness:.42,
  metalness:.48,
  map:metalSurface.map,
  bumpMap:metalSurface.bump,
  bumpScale:.005,
  envMapIntensity:.90
});
const cafeSeatMat=new THREE.MeshStandardMaterial({
  color:0xe5ddd0,
  roughness:.91,
  map:concreteSurface.map,
  bumpMap:concreteSurface.bump,
  bumpScale:.010
});

function createCafeTable(x,z){
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.050,32),cafeTableWood);
  top.position.set(x,.72,z);
  top.castShadow=true;
  scene.add(top);

  // Thin metal rim underneath gives the tabletop a believable laminated edge.
  const topRim=new THREE.Mesh(
    new THREE.TorusGeometry(.315,.018,8,32),
    cafeTableMetal
  );
  topRim.rotation.x=Math.PI/2;
  topRim.position.set(x,.690,z);
  topRim.castShadow=true;
  scene.add(topRim);

  const stem=new THREE.Mesh(new THREE.CylinderGeometry(.032,.045,.62,12),cafeTableMetal);
  stem.position.set(x,.385,z);
  stem.castShadow=true;
  scene.add(stem);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.19,.22,.030,24),cafeTableMetal);
  base.position.set(x,.065,z);
  base.castShadow=true;
  scene.add(base);

  [-.52,.52].forEach(side=>{
    const seat=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.055,24),cafeSeatMat);
    seat.position.set(x+side,.46,z);
    seat.castShadow=true;
    scene.add(seat);

    const leg=new THREE.Mesh(new THREE.CylinderGeometry(.023,.030,.40,10),cafeTableMetal);
    leg.position.set(x+side,.235,z);
    leg.castShadow=true;
    scene.add(leg);

    // Small curved backrest breaks the "stool made from primitives" silhouette.
    const back=new THREE.Mesh(
      new THREE.CapsuleGeometry(.035,.25,4,8),
      cafeTableMetal
    );
    back.position.set(x+side,.69,z+(side<0?.14:-.14));
    back.rotation.z=side<0?.10:-.10;
    back.rotation.x=Math.PI/2;
    back.castShadow=true;
    scene.add(back);
  });
}
createCafeTable(5.9,5.7);
createCafeTable(5.9,8.2);

const terracePot=new THREE.Mesh(
  new THREE.CylinderGeometry(.15,.12,.22,14),
  new THREE.MeshStandardMaterial({
    color:0xb98f76,
    roughness:.93,
    map:concreteSurface.map,
    bumpMap:concreteSurface.bump,
    bumpScale:.010,
    envMapIntensity:.06
  })
);
terracePot.position.set(6.72,.16,7.05);
terracePot.castShadow=true;
scene.add(terracePot);
const terracePlantMat=makeFoliageMaterial(0x789b70,.91,.009,.019);
for(let i=0;i<5;i++){
  const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.11+(i%2)*.012,1),terracePlantMat);
  leaf.scale.set(.64,1.34,.48);
  leaf.position.set(
    6.72+(i-2)*.050,
    .34+(i%3)*.040,
    7.05+(i%2?-.035:.035)
  );
  leaf.rotation.z=(i-2)*.30;
  leaf.rotation.x=(i%2?.10:-.08);
  leaf.rotation.y=i*.55;
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
  const bollardMat=new THREE.MeshStandardMaterial({
    color:0x596266,
    roughness:.42,
    metalness:.54,
    map:metalWearTexture,
    bumpMap:metalSurface.bump,
    bumpScale:.0035,
    envMapIntensity:.90
  });
  const bollard=new THREE.Mesh(
    new THREE.CylinderGeometry(.065,.075,.64,12),
    bollardMat
  );
  bollard.position.set(.35,.37,z);
  bollard.castShadow=true;
  scene.add(bollard);

  const base=new THREE.Mesh(
    new THREE.CylinderGeometry(.12,.14,.06,14),
    bollardMat
  );
  base.position.set(.35,.03,z);
  base.castShadow=true;
  scene.add(base);

  const cap=new THREE.Mesh(
    new THREE.SphereGeometry(.072,12,8,0,Math.PI*2,0,Math.PI*.48),
    bollardMat
  );
  cap.position.set(.35,.70,z);
  cap.castShadow=true;
  scene.add(cap);

  const reflector=new THREE.Mesh(
    new THREE.RingGeometry(.058,.066,16),
    new THREE.MeshBasicMaterial({
      color:0xe2d6a7,
      transparent:true,
      opacity:.46,
      side:THREE.DoubleSide,
      toneMapped:false
    })
  );
  reflector.rotation.x=-Math.PI/2;
  reflector.position.set(.35,.655,z);
  scene.add(reflector);
});

const binMat=new THREE.MeshStandardMaterial({
  color:0x4f5a58,
  roughness:.58,
  metalness:.30,
  map:metalWearTexture,
  bumpMap:metalSurface.bump,
  bumpScale:.004,
  envMapIntensity:.72
});
const bin=new THREE.Mesh(
  new THREE.CylinderGeometry(.20,.23,.64,16),
  binMat
);
bin.position.set(6.85,.35,-7.0);
bin.castShadow=true;
scene.add(bin);

const binRim=new THREE.Mesh(
  new THREE.TorusGeometry(.205,.018,8,24),
  binMat
);
binRim.rotation.x=Math.PI/2;
binRim.position.set(6.85,.68,-7.0);
binRim.castShadow=true;
scene.add(binRim);

const binOpening=new THREE.Mesh(
  new THREE.CircleGeometry(.172,24),
  new THREE.MeshBasicMaterial({color:0x252b2a,side:THREE.DoubleSide})
);
binOpening.rotation.x=-Math.PI/2;
binOpening.position.set(6.85,.687,-7.0);
scene.add(binOpening);

const binBand=new THREE.Mesh(
  new THREE.TorusGeometry(.222,.012,8,24),
  new THREE.MeshStandardMaterial({
    color:0x79827f,
    roughness:.38,
    metalness:.48,
    envMapIntensity:.82
  })
);
binBand.rotation.x=Math.PI/2;
binBand.position.set(6.85,.23,-7.0);
scene.add(binBand);

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

// A narrow, darker contact band grounds the long facade at the sidewalk joint.
// It is intentionally much smaller than the broad storefront shade above.
const storefrontContactCanvas=document.createElement('canvas');
storefrontContactCanvas.width=128;
storefrontContactCanvas.height=16;
const storefrontContactCtx=storefrontContactCanvas.getContext('2d');
const storefrontContactGradient=storefrontContactCtx.createLinearGradient(0,0,128,0);
storefrontContactGradient.addColorStop(0,'rgba(61,54,48,.14)');
storefrontContactGradient.addColorStop(.38,'rgba(71,63,56,.07)');
storefrontContactGradient.addColorStop(1,'rgba(71,63,56,0)');
storefrontContactCtx.fillStyle=storefrontContactGradient;
storefrontContactCtx.fillRect(0,0,128,16);
const storefrontContactTexture=new THREE.CanvasTexture(storefrontContactCanvas);
storefrontContactTexture.colorSpace=THREE.SRGBColorSpace;
const storefrontContactShade=new THREE.Mesh(
  new THREE.PlaneGeometry(.48,63.6),
  new THREE.MeshBasicMaterial({
    map:storefrontContactTexture,
    transparent:true,
    opacity:.82,
    depthWrite:false,
    toneMapped:false
  })
);
storefrontContactShade.rotation.x=-Math.PI/2;
storefrontContactShade.position.set(7.86,.052,-5);
scene.add(storefrontContactShade);

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
let miraGLBBasePosition=null;
let miraIdleAction=null;
const miraBones={head:null,neck:null,chest:null,rightArm:null,rightForeArm:null};
const miraBoneRestQuaternions=new Map();
let miraGreetingUntil=0;
let miraGreetingCooldownUntil=0;
let miraNearLatch=false;
const miraBoneOffsetQuaternion=new THREE.Quaternion();
const miraBoneOffsetEuler=new THREE.Euler(0,0,0,'YXZ');
let worldEnvironmentTexture=null;

function ensureWorldAssetEnvironment(){
  if(worldEnvironmentTexture || !window.RoomEnvironment) return;
  const pmrem=new THREE.PMREMGenerator(renderer);
  const envScene=new window.RoomEnvironment();
  const target=pmrem.fromScene(envScene,.035);
  worldEnvironmentTexture=target.texture;

  // Keep the visible sky dome, but let every PBR material sample the same soft
  // daylight reflection field as imported assets.
  scene.environment=worldEnvironmentTexture;

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
    const hasUv=Boolean(object.geometry?.attributes?.uv);
    const materials=Array.isArray(object.material)?object.material:[object.material];

    materials.forEach(material=>{
      if(!material) return;
      const key=((object.name||'')+' '+(material.name||'')).toLowerCase();

      if(/glass|window|windshield|windscreen/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xb5c8ca),.44);
        material.transparent=true;
        material.opacity=.68;
        material.roughness=.12;
        if('metalness' in material) material.metalness=.015;
        if('envMapIntensity' in material) material.envMapIntensity=1.02;
        if(hasUv && 'roughnessMap' in material && !material.roughnessMap){
          material.roughnessMap=glassRoughnessTexture;
        }
        material.depthWrite=false;
      }else if(/head.?light|lamp_front|front.?light/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xf4ecdc),.76);
        if(material.emissive) material.emissive.set(0x988a70);
        if('emissiveIntensity' in material) material.emissiveIntensity=.075;
        material.roughness=.18;
        if('envMapIntensity' in material) material.envMapIntensity=.88;
      }else if(/tail.?light|rear.?light|brake/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xa26059),.76);
        if(material.emissive) material.emissive.set(0x64231f);
        if('emissiveIntensity' in material) material.emissiveIntensity=.055;
        material.roughness=.22;
        if('envMapIntensity' in material) material.envMapIntensity=.82;
      }else if(/tire|tyre|rubber/.test(key)){
        if(material.color) material.color.set(0x292d2d);
        material.roughness=.94;
        if('metalness' in material) material.metalness=0;
        if('envMapIntensity' in material) material.envMapIntensity=.18;
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=rubberMicroBump;
          material.bumpScale=.018;
        }
      }else if(/wheel|rim/.test(key)){
        if(material.color) material.color.lerp(new THREE.Color(0xa5aaa7),.62);
        material.roughness=.34;
        if('metalness' in material) material.metalness=.58;
        if('envMapIntensity' in material) material.envMapIntensity=.84;
      }else if(/body|paint|carpaint|car_paint|coachwork|exterior/.test(key)){
        if(material.color) material.color.lerp(mutedTint,.76);
        material.roughness=THREE.MathUtils.clamp(material.roughness ?? .31,.245,.34);
        if('metalness' in material) material.metalness=THREE.MathUtils.clamp(material.metalness ?? .18,.14,.24);
        if('envMapIntensity' in material) material.envMapIntensity=.96;
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=vehiclePaintMicroBump;
          material.bumpScale=.0026;
        }
      }else if(material.color){
        const hsl={h:0,s:0,l:0};
        material.color.getHSL(hsl);
        if(hsl.s>.46 && hsl.l>.12){
          material.color.lerp(mutedTint,.34);
        }
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .60,.42,.82);
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
        material.roughness=THREE.MathUtils.clamp(material.roughness ?? .78,.72,.94);
      }
      if('metalness' in material){
        material.metalness=Math.min(material.metalness ?? 0,.025);
      }
      if('envMapIntensity' in material){
        material.envMapIntensity=Math.min(material.envMapIntensity ?? .24,.26);
      }
      // Background pedestrians stay deliberately quieter than Mira. Slightly
      // reducing saturated clothing prevents five equally strong color spots
      // from competing with the focal character.
      if(material.color){
        const hsl={h:0,s:0,l:0};
        material.color.getHSL(hsl);
        if(hsl.s>.18){
          material.color.setHSL(hsl.h,hsl.s*.82,THREE.MathUtils.lerp(hsl.l,.48,.035));
        }
      }
      material.needsUpdate=true;
    });
  });
}

function tuneMiraAsset(root){
  root.traverse(object=>{
    if(!object.isMesh) return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(!material) return;
      const key=((object.name||'')+' '+(material.name||'')).toLowerCase();

      if('metalness' in material){
        material.metalness=Math.min(material.metalness ?? 0,.035);
      }

      if(/skin|face|head|body/.test(key)){
        if('roughness' in material) material.roughness=THREE.MathUtils.clamp(material.roughness ?? .68,.60,.74);
        if(material.color){
          material.color.lerp(new THREE.Color(0xd6a18c),.055);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.22;
      }else if(/hair/.test(key)){
        if('roughness' in material) material.roughness=THREE.MathUtils.clamp(material.roughness ?? .76,.68,.84);
        if('envMapIntensity' in material) material.envMapIntensity=.34;
      }else if('roughness' in material){
        material.roughness=THREE.MathUtils.clamp(material.roughness ?? .76,.68,.90);
        if('envMapIntensity' in material) material.envMapIntensity=.28;
      }

      if(worldEnvironmentTexture && (material.isMeshStandardMaterial || material.isMeshPhysicalMaterial)){
        material.envMap=worldEnvironmentTexture;
      }
      material.needsUpdate=true;
    });
  });
}

function captureMiraBones(root){
  const boneCandidates={chest:[]};

  root.traverse(object=>{
    if(!object.isBone) return;
    const key=(object.name||'').toLowerCase();

    if(!miraBones.head && /head/.test(key)) miraBones.head=object;
    if(!miraBones.neck && /neck/.test(key)) miraBones.neck=object;

    if(/upperchest|chest|spine2|spine_02|spine02/.test(key)){
      boneCandidates.chest.push(object);
    }

    if(
      !miraBones.rightForeArm &&
      /rightforearm|rightlowerarm|forearm_r|lowerarm_r|r_forearm/.test(key)
    ){
      miraBones.rightForeArm=object;
    }

    if(
      !miraBones.rightArm &&
      /rightarm|rightupperarm|upperarm_r|arm_r|r_upperarm/.test(key) &&
      !/forearm|lowerarm/.test(key)
    ){
      miraBones.rightArm=object;
    }
  });

  if(boneCandidates.chest.length){
    miraBones.chest=boneCandidates.chest[boneCandidates.chest.length-1];
  }

  Object.values(miraBones).forEach(bone=>{
    if(bone && !miraBoneRestQuaternions.has(bone)){
      miraBoneRestQuaternions.set(bone,bone.quaternion.clone());
    }
  });
}

function applyMiraBoneOffset(bone,pitch=0,yaw=0,roll=0){
  if(!bone) return;

  // When no authored idle clip exists, restore the captured bind/rest pose
  // before adding our subtle procedural offset so transforms cannot accumulate.
  if(!miraIdleAction){
    const rest=miraBoneRestQuaternions.get(bone);
    if(rest) bone.quaternion.copy(rest);
  }

  miraBoneOffsetEuler.set(pitch,yaw,roll,'YXZ');
  miraBoneOffsetQuaternion.setFromEuler(miraBoneOffsetEuler);
  bone.quaternion.multiply(miraBoneOffsetQuaternion);
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
  prepareImportedModel(root,.36);
  normalizeHumanAsset(root,1.72);
  tuneMiraAsset(root);
  root.rotation.y=Math.PI-.12;
  root.position.z=.015;
  miraRig.visible=false;
  mira.add(root);
  miraGLBRoot=root;
  miraGLBBasePosition=root.position.clone();
  captureMiraBones(root);
  if(!mira.userData.glbContactShadow){
    mira.userData.glbContactShadow=createAttachedContactShadow(mira,.68,.48,.082);
  }

  // Only play an explicitly named idle animation. Keep it slower than the
  // source clip so Mira feels present in the street rather than "performing".
  const idleClip=animations.find(clip=>/idle|stand|breath/i.test(clip.name));
  if(idleClip){
    const mixer=new THREE.AnimationMixer(root);
    const idleAction=mixer.clipAction(idleClip);
    idleAction.setEffectiveTimeScale(.72);
    idleAction.play();
    miraIdleAction=idleAction;
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
if(form && input && list){form.addEventListener('submit',e=>{e.preventDefault();const t=input.value.trim();if(!t)return;const b=document.createElement('div');b.className='bubble mine';b.textContent=t;list.appendChild(b);input.value='';list.scrollTop=list.scrollHeight;setTimeout(()=>{const r=document.createElement('div');r.className='bubble theirs';r.textContent='Got it. Meet me by the café.';list.appendChild(r);list.scrollTop=list.scrollHeight;},700)});}
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

  distantTrafficCues.forEach((traffic,index)=>{
    const pace=traffic.speed*(1+Math.sin(t*.11+traffic.phase)*.035);
    traffic.group.position.z+=traffic.direction*pace*dt;
    traffic.group.position.x+=Math.sin(t*.09+traffic.phase)*.0008;
    if(traffic.direction>0 && traffic.group.position.z>-49){
      traffic.group.position.z=-82-index*4;
    }else if(traffic.direction<0 && traffic.group.position.z<-82){
      traffic.group.position.z=-50-index*3;
    }
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
      walker.group.position.x=walker.baseX+Math.sin(t*.27+walker.pacePhase)*.020;
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

  // Mira does not mechanically track the player. Attention grows naturally as
  // the player approaches, with tiny lapses that keep her from feeling turret-like.
  const miraToCameraX=camera.position.x-mira.position.x;
  const miraToCameraZ=camera.position.z-mira.position.z;
  const miraDistance=Math.hypot(miraToCameraX,miraToCameraZ);
  const miraLookYaw=THREE.MathUtils.clamp(
    Math.atan2(miraToCameraX,miraToCameraZ),
    miraBaseYaw-.24,
    miraBaseYaw+.22
  );
  const nowMs=performance.now();
  const replyAttention=Math.max(0,Math.min(1,(miraReplyMotionUntil-nowMs)/850));
  const distanceAttention=1-THREE.MathUtils.smoothstep(miraDistance,3.2,11.5);
  const attentionDrift=.90+Math.sin(t*.23+1.4)*.07;
  const miraAttention=THREE.MathUtils.clamp(
    distanceAttention*attentionDrift+replyAttention*.28,
    0,1
  );

  // When the player is far away, Mira remains part of the world: she gives the
  // café/street occasional attention instead of freezing on one heading.
  const ambientBodyLook=(
    Math.sin(t*.115+.7)*.034+
    Math.sin(t*.043+2.2)*.020
  )*(1-miraAttention);
  const miraYawTarget=
    THREE.MathUtils.lerp(miraBaseYaw,miraLookYaw,miraAttention)+ambientBodyLook;
  mira.rotation.y=THREE.MathUtils.lerp(
    mira.rotation.y,
    miraYawTarget,
    1-Math.pow(.10,dt)
  );

  // Focal lighting is distance-aware: enough facial separation up close, but
  // almost indistinguishable from ordinary daylight from across the block.
  const presence=1-THREE.MathUtils.smoothstep(miraDistance,2.4,10.5);
  faceLight.intensity=5.25+presence*.95;
  miraPresenceLight.intensity=.22+presence*.24;
  miraWarmBounce.intensity=.13+presence*.055;
  miraCoolRim.intensity=.075+presence*.040;

  if(miraGLBRoot && miraGLBBasePosition){
    const weightShift=Math.sin(t*.37+.6);
    const slowBreath=Math.sin(t*.73);
    miraGLBRoot.position.x=miraGLBBasePosition.x+weightShift*.0045;
    miraGLBRoot.position.y=miraGLBBasePosition.y+slowBreath*.0016;
    miraGLBRoot.position.z=miraGLBBasePosition.z+Math.sin(t*.29+1.1)*.0018;
    miraGLBRoot.rotation.z=weightShift*.0024;
    miraGLBRoot.rotation.x=Math.sin(t*.31)*.0014;

    // One restrained acknowledgement per approach. It only re-arms after the
    // player has stepped away, so standing nearby never loops a greeting.
    if(
      started &&
      !tabletOpen &&
      miraDistance<4.0 &&
      !miraNearLatch &&
      nowMs>miraGreetingCooldownUntil
    ){
      miraGreetingUntil=nowMs+1550;
      miraGreetingCooldownUntil=nowMs+15000;
      miraNearLatch=true;
    }
    if(miraDistance>5.6) miraNearLatch=false;

    const greetingRemaining=Math.max(0,miraGreetingUntil-nowMs);
    const greetingProgress=greetingRemaining>0
      ? THREE.MathUtils.clamp(1-greetingRemaining/1550,0,1)
      : 1;
    const greetingEnvelope=greetingRemaining>0
      ? Math.sin(Math.PI*greetingProgress)
      : 0;

    // Bone offsets are applied after AnimationMixer.update(), so authored idle
    // motion remains intact. The head has more freedom than the torso.
    const relativePlayerYaw=THREE.MathUtils.clamp(miraLookYaw-mira.rotation.y,-.15,.15);
    const ambientHeadYaw=(
      Math.sin(t*.19+1.8)*.055+
      Math.sin(t*.071+.2)*.030
    )*(1-miraAttention);
    const headYaw=relativePlayerYaw*miraAttention*.68+ambientHeadYaw;
    const headPitch=
      Math.sin(t*.16+.9)*.012*(1-miraAttention)-
      greetingEnvelope*.045+
      replyAttention*.018;
    const neckYaw=headYaw*.34;
    const chestYaw=headYaw*.12;
    const chestRoll=weightShift*.0035-greetingEnvelope*.006;

    applyMiraBoneOffset(miraBones.chest,0,chestYaw,chestRoll);
    applyMiraBoneOffset(miraBones.neck,headPitch*.24,neckYaw,0);
    applyMiraBoneOffset(miraBones.head,headPitch,headYaw,Math.sin(t*.21)*.003);

    // The greeting reads as a small shoulder/forearm acknowledgement rather
    // than a full waving animation.
    applyMiraBoneOffset(
      miraBones.rightArm,
      greetingEnvelope*.055,
      -greetingEnvelope*.025,
      -greetingEnvelope*.085
    );
    applyMiraBoneOffset(
      miraBones.rightForeArm,
      -greetingEnvelope*.16,
      0,
      greetingEnvelope*.025
    );

    const shadow=mira.userData.glbContactShadow;
    if(shadow){
      const settle=.985+Math.cos(t*.37+.6)*.012;
      shadow.scale.set(settle,settle,1);
      shadow.material.opacity=.92+Math.sin(t*.37+.6)*.025;
    }
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
