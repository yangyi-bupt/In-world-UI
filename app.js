const canvas = document.querySelector('#game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.20));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.AgXToneMapping ?? THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.00;
renderer.physicallyCorrectLights = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9dde3);
scene.fog = new THREE.Fog(0xdfe7e5, 52, 138);

const skyCanvas=document.createElement('canvas');
skyCanvas.width=256;
skyCanvas.height=1024;
const skyCtx=skyCanvas.getContext('2d');
const skyGradient=skyCtx.createLinearGradient(0,0,0,1024);
skyGradient.addColorStop(0,'#6fa8c5');
skyGradient.addColorStop(.22,'#9fc7d6');
skyGradient.addColorStop(.48,'#c9dfe3');
skyGradient.addColorStop(.70,'#e4e9e5');
skyGradient.addColorStop(.86,'#efe8dc');
skyGradient.addColorStop(1,'#d4d2c9');
skyCtx.fillStyle=skyGradient;
skyCtx.fillRect(0,0,256,1024);

const visibleSkyRnd=makeSeededRandom(0x51d7a2c3);
for(let i=0;i<22;i++){
  const x=visibleSkyRnd()*256;
  const y=100+visibleSkyRnd()*650;
  const radius=18+visibleSkyRnd()*65;
  const grad=skyCtx.createRadialGradient(x,y,0,x,y,radius);
  const warm=visibleSkyRnd()>.76;
  grad.addColorStop(
    0,
    warm
      ? 'rgba(246,229,206,'+(.010+visibleSkyRnd()*.020).toFixed(3)+')'
      : 'rgba(242,249,250,'+(.010+visibleSkyRnd()*.020).toFixed(3)+')'
  );
  grad.addColorStop(1,'rgba(255,255,255,0)');
  skyCtx.fillStyle=grad;
  skyCtx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
const skyTexture=new THREE.CanvasTexture(skyCanvas);
skyTexture.colorSpace=THREE.SRGBColorSpace;
const skyDome=new THREE.Mesh(
  new THREE.SphereGeometry(88,32,20),
  new THREE.MeshBasicMaterial({map:skyTexture,side:THREE.BackSide,depthWrite:false,toneMapped:false})
);
skyDome.position.y=3;
scene.add(skyDome);

// Very low-contrast horizon veil: distant geometry loses contrast in real daylight
// before it disappears into fog. This keeps the far street from looking like a
// perfectly crisp miniature while leaving the playable foreground untouched.
const horizonVeilCanvas=document.createElement('canvas');
horizonVeilCanvas.width=16;
horizonVeilCanvas.height=256;
const horizonVeilCtx=horizonVeilCanvas.getContext('2d');
const horizonVeilGrad=horizonVeilCtx.createLinearGradient(0,0,0,256);
horizonVeilGrad.addColorStop(0,'rgba(226,232,232,0)');
horizonVeilGrad.addColorStop(.38,'rgba(226,232,232,.015)');
horizonVeilGrad.addColorStop(.72,'rgba(226,232,232,.085)');
horizonVeilGrad.addColorStop(1,'rgba(226,232,232,.16)');
horizonVeilCtx.fillStyle=horizonVeilGrad;
horizonVeilCtx.fillRect(0,0,16,256);
const horizonVeilTexture=new THREE.CanvasTexture(horizonVeilCanvas);
horizonVeilTexture.colorSpace=THREE.SRGBColorSpace;

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
  opacity:.34
}));
sunHaze.position.set(-34,34,-46);
sunHaze.scale.set(10.5,10.5,1);
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

const camera = new THREE.PerspectiveCamera(44.0, window.innerWidth / window.innerHeight, 0.08, 180);
camera.position.set(2.62, 1.70, 9.35);
camera.rotation.order = 'YXZ';

// A narrower architectural FOV is much closer to the supplied street reference
// than an FPS-like wide lens. Tablet focus tightens it only slightly.
let cameraFovTarget = 44.0;

// ---------- daylight ----------
renderer.toneMappingExposure = 1.02;

const skyLight = new THREE.HemisphereLight(0xf0f5f2, 0x8d8a82, 1.22);
scene.add(skyLight);

const sun = new THREE.DirectionalLight(0xfff0d7, 2.92);
// Match the actual key light to the visible sun in the sky. The previous
// opposite-Z setup made highlights and cast shadows disagree with the sun disc.
sun.position.set(-17.5, 19.0, -23.5);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -18;
sun.shadow.camera.right = 18;
sun.shadow.camera.top = 22;
sun.shadow.camera.bottom = -18;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 52;
sun.shadow.bias = -0.00028;
sun.shadow.normalBias = .022;
sun.shadow.radius = 1.15;
scene.add(sun);

const daylightFill = new THREE.DirectionalLight(0xdce8ea, .160);
daylightFill.position.set(10, 8, -12);
scene.add(daylightFill);

const shopBounce = new THREE.DirectionalLight(0xffdfbf, .040);
shopBounce.position.set(9,5,6);
scene.add(shopBounce);

const faceLight = new THREE.SpotLight(0xffeadb, .062, 6.5, Math.PI * .36, .97, 1.9);
faceLight.position.set(1.1, 3.8, 3.2);
faceLight.target.position.set(2.28, 1.47, 2.0);
scene.add(faceLight, faceLight.target);

// A broad, very soft bounce near Mira separates her from the storefront
// without reading like a game spotlight. Its strength is modulated by player
// distance later so she remains integrated with the street at long range.
const miraPresenceLight=new THREE.PointLight(0xffeadb,.012,4.2,2.2);
miraPresenceLight.position.set(2.75,2.05,2.55);
scene.add(miraPresenceLight);

const miraWarmBounce=new THREE.DirectionalLight(0xffead8,.012);
miraWarmBounce.position.set(7.2,5.4,3.4);
miraWarmBounce.target.position.set(2.28,1.18,2.0);
scene.add(miraWarmBounce,miraWarmBounce.target);

const miraCoolRim=new THREE.DirectionalLight(0xd9edf2,.010);
miraCoolRim.position.set(-5.0,4.0,-7.5);
miraCoolRim.target.position.set(2.28,1.28,2.0);
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
    g.fillStyle='#555a59';
    g.fillRect(0,0,size,size);

    // Low-frequency variation stops the road reading as one flat grey slab.
    for(let i=0;i<42;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const radius=12+rnd()*44;
      const grad=g.createRadialGradient(x,y,0,x,y,radius);
      const light=rnd()>.5;
      grad.addColorStop(0,light?'rgba(126,128,123,.034)':'rgba(37,42,42,.032)');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-radius,y-radius,radius*2,radius*2);
    }

    for(let i=0;i<920;i++){
      const v=64+Math.floor(rnd()*54);
      const a=.016+rnd()*.040;
      g.fillStyle='rgba('+v+','+(v+2)+','+(v+2)+','+a.toFixed(3)+')';
      const r=.28+rnd()*1.20;
      g.fillRect(rnd()*size,rnd()*size,r,r);
    }

    // Mineral chips break the "grey rubber sheet" look. Most stay dark; a few
    // warmer quartz/stone grains catch daylight differently from the binder.
    for(let i=0;i<230;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rx=.45+rnd()*1.65;
      const ry=.35+rnd()*1.20;
      const family=Math.floor(rnd()*4);
      const tones=[
        [112,116,113],
        [92,99,100],
        [126,113,96],
        [142,138,126]
      ][family];
      g.fillStyle='rgba('+tones[0]+','+tones[1]+','+tones[2]+','+(.045+rnd()*.090).toFixed(3)+')';
      g.beginPath();
      g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
      g.fill();
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
    g.fillStyle='#e1e1dc';
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

function makeNormalTextureFromHeight(canvas,strength=2.0){
  const w=canvas.width;
  const h=canvas.height;
  const source=canvas.getContext('2d').getImageData(0,0,w,h).data;
  const out=document.createElement('canvas');
  out.width=w;
  out.height=h;
  const og=out.getContext('2d');
  const image=og.createImageData(w,h);
  const dst=image.data;

  const heightAt=(x,y)=>{
    const xx=(x+w)%w;
    const yy=(y+h)%h;
    return source[(yy*w+xx)*4]/255;
  };

  for(let y=0;y<h;y++){
    for(let x=0;x<w;x++){
      const dx=(heightAt(x+1,y)-heightAt(x-1,y))*strength;
      const dy=(heightAt(x,y+1)-heightAt(x,y-1))*strength;
      let nx=-dx;
      let ny=-dy;
      let nz=1;
      const inv=1/Math.sqrt(nx*nx+ny*ny+nz*nz);
      nx*=inv;
      ny*=inv;
      nz*=inv;

      const p=(y*w+x)*4;
      dst[p]=Math.round((nx*.5+.5)*255);
      dst[p+1]=Math.round((ny*.5+.5)*255);
      dst[p+2]=Math.round((nz*.5+.5)*255);
      dst[p+3]=255;
    }
  }

  og.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(out);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

function makeAOTextureFromHeight(canvas,strength=.72){
  const w=canvas.width;
  const h=canvas.height;
  const source=canvas.getContext('2d').getImageData(0,0,w,h).data;
  const out=document.createElement('canvas');
  out.width=w;
  out.height=h;
  const og=out.getContext('2d');
  const image=og.createImageData(w,h);
  const dst=image.data;

  for(let p=0;p<w*h;p++){
    const height=source[p*4]/255;
    const cavity=Math.max(0,.52-height);
    const value=Math.round(
      THREE.MathUtils.clamp(255-cavity*255*strength*2.2,172,255)
    );
    const o=p*4;
    dst[o]=dst[o+1]=dst[o+2]=value;
    dst[o+3]=255;
  }

  og.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(out);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

function makeMaterialTexture(kind,seed){
  const size=512;
  const colorCanvas=document.createElement('canvas');
  const bumpCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=size;
  bumpCanvas.width=bumpCanvas.height=size;
  roughCanvas.width=roughCanvas.height=size;
  const g=colorCanvas.getContext('2d');
  const b=bumpCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  const isStone=/stone|limestone|sandstone/.test(kind);
  const isConcrete=/concrete/i.test(kind);
  const isFineConcrete=kind==='fineConcrete';
  const isCoarseConcrete=kind==='coarseConcrete';
  const isLimestone=kind==='limestone';
  const isSandstone=kind==='sandstone';

  const palettes={
    stone:['#d4cbbf','#bfb5a8','#e4ddd2'],
    limestone:['#ddd6ca','#c9c1b4','#eee8de'],
    sandstone:['#c7a88a','#ad8d71','#dfc0a0'],
    concrete:['#c4c0b7','#aca79e','#d2cdc3'],
    fineConcrete:['#cbc8c1','#b8b4ac','#dad6cf'],
    coarseConcrete:['#b6b0a5','#969187','#cac3b7'],
    wood:['#ae8566','#8f684f','#c79b78'],
    metal:['#858e8b','#707977','#a2aaa7']
  };
  const palette=palettes[kind] || palettes.concrete;

  g.fillStyle=palette[0];
  g.fillRect(0,0,size,size);
  b.fillStyle='#808080';
  b.fillRect(0,0,size,size);
  r.fillStyle=kind==='metal'
    ? '#777777'
    : (kind==='wood'
      ? '#b7b7b7'
      : (isSandstone?'#d2d2d2':(isFineConcrete?'#e5e5e5':'#dedede')));
  r.fillRect(0,0,size,size);

  // Large-scale albedo and roughness drift is what stops a material from
  // looking uniformly sprayed onto the mesh.
  for(let i=0;i<70;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=20+rnd()*92;
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    const dark=rnd()>.52;
    const tone=kind==='wood'
      ? (dark?'92,61,43':'232,194,154')
      : (kind==='metal'
        ? (dark?'49,57,56':'214,220,216')
        : (dark?'88,80,70':'246,239,224'));
    grad.addColorStop(0,'rgba('+tone+','+(.018+rnd()*.042).toFixed(3)+')');
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);

    const roughGrad=r.createRadialGradient(x,y,0,x,y,radius);
    const rv=kind==='metal'
      ? 82+Math.floor(rnd()*82)
      : (kind==='wood'?142+Math.floor(rnd()*72):196+Math.floor(rnd()*48));
    roughGrad.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.12+rnd()*.22).toFixed(3)+')');
    roughGrad.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
    r.fillStyle=roughGrad;
    r.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  if(kind==='wood'){
    for(let y=0;y<size;y++){
      const wave=
        Math.sin(y*.095)+
        Math.sin(y*.027+1.4)*.62+
        Math.sin(y*.0065+.7)*.34;
      const shade=Math.round(128+wave*15);
      g.fillStyle=wave>0
        ? 'rgba(251,220,182,.020)'
        : 'rgba(72,43,29,.030)';
      g.fillRect(0,y,size,1);
      b.fillStyle='rgb('+shade+','+shade+','+shade+')';
      b.fillRect(0,y,size,1);

      const rv=Math.round(174-wave*18);
      r.fillStyle='rgb('+rv+','+rv+','+rv+')';
      r.fillRect(0,y,size,1);
    }

    for(let i=0;i<34;i++){
      const y=rnd()*size;
      const knotX=rnd()*size;
      const knotY=y+(rnd()-.5)*20;
      g.strokeStyle='rgba(69,39,25,'+(.035+rnd()*.055).toFixed(3)+')';
      g.lineWidth=.5+rnd()*1.1;
      g.beginPath();
      g.moveTo(0,y);
      g.bezierCurveTo(
        knotX*.45,y+(rnd()-.5)*12,
        knotX,knotY,
        size,y+(rnd()-.5)*14
      );
      g.stroke();

      if(i%4===0){
        g.strokeStyle='rgba(74,43,28,.065)';
        g.lineWidth=.8;
        g.beginPath();
        g.ellipse(knotX,knotY,5+rnd()*10,2+rnd()*5,rnd()*.25,0,Math.PI*2);
        g.stroke();
        r.fillStyle='rgba(115,115,115,.20)';
        r.beginPath();
        r.ellipse(knotX,knotY,7+rnd()*12,3+rnd()*5,0,0,Math.PI*2);
        r.fill();
      }
    }
  }else if(kind==='metal'){
    for(let x=0;x<size;x++){
      const wave=Math.sin(x*.48)+Math.sin(x*.071)*.45;
      const bumpV=Math.round(128+wave*4);
      b.fillStyle='rgb('+bumpV+','+bumpV+','+bumpV+')';
      b.fillRect(x,0,1,size);
      const roughV=Math.round(112+wave*12);
      r.fillStyle='rgba('+roughV+','+roughV+','+roughV+',.36)';
      r.fillRect(x,0,1,size);
    }
    for(let i=0;i<420;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const len=3+rnd()*34;
      g.strokeStyle=rnd()>.88
        ? 'rgba(137,83,49,'+(.018+rnd()*.040).toFixed(3)+')'
        : 'rgba(232,238,234,'+(.015+rnd()*.034).toFixed(3)+')';
      g.lineWidth=.28+rnd()*.55;
      g.beginPath();
      g.moveTo(x,y);
      g.lineTo(x+len,y+(rnd()-.5)*2);
      g.stroke();

      r.strokeStyle='rgba(210,210,210,'+(.04+rnd()*.12).toFixed(3)+')';
      r.lineWidth=.4+rnd()*.9;
      r.beginPath();
      r.moveTo(x,y);
      r.lineTo(x+len,y+(rnd()-.5)*2);
      r.stroke();
    }

    // Subtle oxidation blooms vary both albedo and roughness. They stay faint
    // enough for maintained street furniture, but stop large metal surfaces
    // from reading as perfectly uniform factory-fresh paint.
    for(let i=0;i<28;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const radius=8+rnd()*36;
      const warm=rnd()>.58;
      const grad=g.createRadialGradient(x,y,0,x,y,radius);
      grad.addColorStop(
        0,
        warm
          ? 'rgba(126,82,51,'+(.010+rnd()*.026).toFixed(3)+')'
          : 'rgba(79,103,92,'+(.009+rnd()*.022).toFixed(3)+')'
      );
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-radius,y-radius,radius*2,radius*2);

      const rv=158+Math.floor(rnd()*42);
      const rg=r.createRadialGradient(x,y,0,x,y,radius);
      rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.08+rnd()*.16).toFixed(3)+')');
      rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
      r.fillStyle=rg;
      r.fillRect(x-radius,y-radius,radius*2,radius*2);
    }
  }else{
    const pores=isLimestone
      ? 1500
      : (isSandstone
        ? 3400
        : (isFineConcrete
          ? 1650
          : (isCoarseConcrete?2300:2800)));

    for(let i=0;i<pores;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rr=isLimestone
        ? .20+rnd()*1.10
        : (isSandstone
          ? .22+rnd()*1.35
          : (isFineConcrete
            ? .18+rnd()*1.15
            : (isCoarseConcrete?.45+rnd()*2.8:.30+rnd()*2.2)));
      const dark=rnd()>.54;

      let darkTone='83,77,69';
      let lightTone='255,248,235';
      if(isLimestone){
        darkTone='118,109,96';
        lightTone='250,245,233';
      }else if(isSandstone){
        darkTone='116,78,54';
        lightTone='244,207,168';
      }else if(isCoarseConcrete){
        darkTone='73,72,68';
        lightTone='225,218,205';
      }

      g.fillStyle=dark
        ? 'rgba('+darkTone+','+(.012+rnd()*.038).toFixed(3)+')'
        : 'rgba('+lightTone+','+(.010+rnd()*.032).toFixed(3)+')';
      g.beginPath();
      g.arc(x,y,rr,0,Math.PI*2);
      g.fill();

      const bumpV=dark?109+Math.floor(rnd()*15):134+Math.floor(rnd()*15);
      b.fillStyle='rgba('+bumpV+','+bumpV+','+bumpV+','+(.34+rnd()*.46).toFixed(3)+')';
      b.beginPath();
      b.arc(x,y,Math.max(.35,rr*.78),0,Math.PI*2);
      b.fill();

      const roughV=isSandstone
        ? 214+Math.floor(rnd()*35)
        : (isFineConcrete
          ? 220+Math.floor(rnd()*30)
          : (isLimestone
            ? 202+Math.floor(rnd()*42)
            : 198+Math.floor(rnd()*48)));
      r.fillStyle='rgba('+roughV+','+roughV+','+roughV+','+(.18+rnd()*.34).toFixed(3)+')';
      r.beginPath();
      r.arc(x,y,rr*1.25,0,Math.PI*2);
      r.fill();
    }

    if(isCoarseConcrete){
      for(let i=0;i<115;i++){
        const x=rnd()*size;
        const y=rnd()*size;
        const rx=2+rnd()*7;
        const ry=1.5+rnd()*5;
        const aggregate=rnd()>.50
          ? 'rgba(92,85,75,'+(.06+rnd()*.09).toFixed(3)+')'
          : 'rgba(228,218,198,'+(.05+rnd()*.08).toFixed(3)+')';
        g.fillStyle=aggregate;
        g.beginPath();
        g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
        g.fill();

        const bv=108+Math.floor(rnd()*36);
        b.fillStyle='rgba('+bv+','+bv+','+bv+',.48)';
        b.beginPath();
        b.ellipse(x,y,rx*.72,ry*.72,0,0,Math.PI*2);
        b.fill();

        // Exposed aggregate is slightly smoother than the cement paste around
        // it, producing small broken highlights instead of one uniform matte.
        const aggregateRough=162+Math.floor(rnd()*34);
        r.fillStyle='rgba('+aggregateRough+','+aggregateRough+','+aggregateRough+','+(.28+rnd()*.24).toFixed(3)+')';
        r.beginPath();
        r.ellipse(x,y,rx*1.06,ry*1.06,0,0,Math.PI*2);
        r.fill();
      }
    }

    if(isFineConcrete || isCoarseConcrete){
      const airCount=isFineConcrete?48:78;
      for(let i=0;i<airCount;i++){
        const x=rnd()*size;
        const y=rnd()*size;
        const rr=(isFineConcrete?.55:1.0)+rnd()*(isFineConcrete?1.25:2.6);
        g.fillStyle='rgba(71,69,64,'+(.018+rnd()*.030).toFixed(3)+')';
        g.beginPath();
        g.arc(x,y,rr,0,Math.PI*2);
        g.fill();
        b.fillStyle='rgba(86,86,86,'+(.34+rnd()*.30).toFixed(3)+')';
        b.beginPath();
        b.arc(x,y,rr*.70,0,Math.PI*2);
        b.fill();
        r.fillStyle='rgba(244,244,244,.20)';
        r.beginPath();
        r.arc(x,y,rr*1.10,0,Math.PI*2);
        r.fill();
      }
    }

    if(isSandstone){
      for(let i=0;i<42;i++){
        const y=rnd()*size;
        const amp=2+rnd()*8;
        const wavelength=28+rnd()*90;
        g.strokeStyle='rgba(119,78,50,'+(.018+rnd()*.038).toFixed(3)+')';
        g.lineWidth=.45+rnd()*1.25;
        g.beginPath();
        for(let x=0;x<=size;x+=8){
          const yy=y+Math.sin(x/wavelength*Math.PI*2+rnd()*.2)*amp;
          if(x===0) g.moveTo(x,yy); else g.lineTo(x,yy);
        }
        g.stroke();
      }
    }

    if(isLimestone){
      for(let i=0;i<68;i++){
        const x=rnd()*size;
        const y=rnd()*size;
        const rr=1+rnd()*3.8;
        g.strokeStyle='rgba(126,116,100,'+(.014+rnd()*.026).toFixed(3)+')';
        g.lineWidth=.45+rnd()*.55;
        g.beginPath();
        g.arc(x,y,rr,0,Math.PI*2);
        g.stroke();
      }
    }

    if(isStone){
      const mineralCount=isSandstone?260:(isLimestone?150:190);
      for(let i=0;i<mineralCount;i++){
        const x=rnd()*size;
        const y=rnd()*size;
        const rr=.25+rnd()*(isSandstone?.90:.72);
        const family=Math.floor(rnd()*4);
        const mineral=isSandstone
          ? [
              [126,95,67],
              [180,145,105],
              [99,103,96],
              [217,198,168]
            ][family]
          : [
              [151,143,129],
              [191,183,165],
              [113,118,111],
              [226,220,204]
            ][family];
        g.fillStyle='rgba('+mineral[0]+','+mineral[1]+','+mineral[2]+','+(.025+rnd()*.055).toFixed(3)+')';
        g.beginPath();
        g.arc(x,y,rr,0,Math.PI*2);
        g.fill();

        const crystalline=rnd()>.88;
        const rv=crystalline
          ? 96+Math.floor(rnd()*42)
          : 158+Math.floor(rnd()*58);
        r.fillStyle='rgba('+rv+','+rv+','+rv+','+(crystalline?(.14+rnd()*.18):(.08+rnd()*.14)).toFixed(3)+')';
        r.beginPath();
        r.arc(x,y,rr*(crystalline?1.05:1.25),0,Math.PI*2);
        r.fill();

        if(crystalline){
          b.fillStyle='rgba(148,148,148,'+(.12+rnd()*.18).toFixed(3)+')';
          b.beginPath();
          b.arc(x,y,Math.max(.20,rr*.62),0,Math.PI*2);
          b.fill();
        }
      }
    }

    const veins=isStone?(isSandstone?18:(isLimestone?22:34)):14;
    for(let i=0;i<veins;i++){
      const y=rnd()*size;
      const x=rnd()*size;
      const len=70+rnd()*250;
      g.strokeStyle=isStone
        ? 'rgba(102,91,79,'+(.012+rnd()*.026).toFixed(3)+')'
        : 'rgba(91,87,80,'+(.008+rnd()*.018).toFixed(3)+')';
      g.lineWidth=.30+rnd()*.90;
      g.beginPath();
      g.moveTo(x,y);
      g.bezierCurveTo(
        x+len*.28,y+(rnd()-.5)*18,
        x+len*.68,y+(rnd()-.5)*24,
        x+len,y+(rnd()-.5)*15
      );
      g.stroke();

      r.strokeStyle='rgba(166,166,166,'+(.028+rnd()*.055).toFixed(3)+')';
      r.lineWidth=.7+rnd()*1.2;
      r.beginPath();
      r.moveTo(x,y);
      r.bezierCurveTo(
        x+len*.28,y+(rnd()-.5)*18,
        x+len*.68,y+(rnd()-.5)*24,
        x+len,y+(rnd()-.5)*15
      );
      r.stroke();
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.anisotropy=8;

  const normal=makeNormalTextureFromHeight(
    bumpCanvas,
    kind==='metal'?1.15:(kind==='wood'?1.55:(kind==='stone'?1.75:2.0))
  );
  const ao=makeAOTextureFromHeight(
    bumpCanvas,
    kind==='metal'?.34:(kind==='wood'?.54:.72)
  );

  return {map,bump,roughness,normal,ao};
}

function configureTexturePair(pair,repeatX,repeatY){
  pair.map.repeat.set(repeatX,repeatY);
  pair.bump.repeat.set(repeatX,repeatY);
  pair.roughness?.repeat.set(repeatX,repeatY);
  pair.normal?.repeat.set(repeatX,repeatY);
  pair.ao?.repeat.set(repeatX,repeatY);
  return pair;
}

function makeGroundRoughnessTexture(kind,seed){
  const size=512;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  const asphalt=kind==='asphalt';

  g.fillStyle=asphalt?'#efefef':'#e7e7e7';
  g.fillRect(0,0,size,size);

  for(let i=0;i<(asphalt?125:86);i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=10+rnd()*70;
    const ry=12+rnd()*90;
    const darker=asphalt
      ? 155+Math.floor(rnd()*55)
      : 178+Math.floor(rnd()*45);
    const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba('+darker+','+darker+','+darker+','+(.10+rnd()*.24).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+darker+','+darker+','+darker+',0)');
    g.fillStyle=grad;
    g.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  const grainCount=asphalt?4200:2600;
  for(let i=0;i<grainCount;i++){
    const v=asphalt
      ? 184+Math.floor(rnd()*67)
      : 198+Math.floor(rnd()*48);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.08+rnd()*.22).toFixed(3)+')';
    const rr=.35+rnd()*1.3;
    g.fillRect(rnd()*size,rnd()*size,rr,rr);
  }

  if(asphalt){
    for(let i=0;i<520;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rx=.55+rnd()*1.8;
      const ry=.40+rnd()*1.25;
      const v=132+Math.floor(rnd()*54);
      g.fillStyle='rgba('+v+','+v+','+v+','+(.18+rnd()*.24).toFixed(3)+')';
      g.beginPath();
      g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
      g.fill();
    }
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=8;
  return texture;
}

function makeGroundTexturePack(kind,seed){
  const size=1024;
  const colorCanvas=document.createElement('canvas');
  const heightCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=size;
  heightCanvas.width=heightCanvas.height=size;
  roughCanvas.width=roughCanvas.height=size;

  const g=colorCanvas.getContext('2d');
  const h=heightCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  const asphalt=kind==='asphalt';

  g.fillStyle=asphalt?'#555a58':'#d2d0c8';
  g.fillRect(0,0,size,size);
  h.fillStyle='#808080';
  h.fillRect(0,0,size,size);
  r.fillStyle=asphalt?'#e8e8e8':'#dedede';
  r.fillRect(0,0,size,size);

  // Macro variation is shared by albedo and roughness. Real surfaces do not
  // have unrelated "color noise" and "roughness noise" pasted on top of each
  // other; the same wear, moisture and aggregate affects both.
  for(let i=0;i<(asphalt?92:74);i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=36+rnd()*(asphalt?150:180);
    const ry=28+rnd()*(asphalt?125:155);
    const dark=rnd()>.53;

    const cg=g.createRadialGradient(x,y,2,x,y,Math.max(rx,ry));
    if(asphalt){
      cg.addColorStop(0,dark
        ? 'rgba(24,29,29,'+(.026+rnd()*.055).toFixed(3)+')'
        : 'rgba(171,166,151,'+(.018+rnd()*.038).toFixed(3)+')');
    }else{
      cg.addColorStop(0,dark
        ? 'rgba(102,99,91,'+(.020+rnd()*.046).toFixed(3)+')'
        : 'rgba(248,239,221,'+(.020+rnd()*.044).toFixed(3)+')');
    }
    cg.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=cg;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();

    const rv=asphalt
      ? (dark?192+Math.floor(rnd()*34):216+Math.floor(rnd()*30))
      : (dark?188+Math.floor(rnd()*36):218+Math.floor(rnd()*26));
    const rg=r.createRadialGradient(x,y,2,x,y,Math.max(rx,ry));
    rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.13+rnd()*.23).toFixed(3)+')');
    rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
    r.fillStyle=rg;
    r.save();
    r.translate(x,y);
    r.scale(1,ry/rx);
    r.beginPath();
    r.arc(0,0,rx,0,Math.PI*2);
    r.fill();
    r.restore();
  }

  if(asphalt){
    // Mixed mineral aggregate with physically matching height + roughness.
    for(let i=0;i<10800;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rr=.32+rnd()*1.75;
      const family=Math.floor(rnd()*5);
      const tones=[
        [106,111,108],
        [79,86,87],
        [129,118,101],
        [151,146,131],
        [91,92,85]
      ][family];
      const light=rnd()>.54;
      g.fillStyle='rgba('+tones[0]+','+tones[1]+','+tones[2]+','+(.050+rnd()*.110).toFixed(3)+')';
      g.beginPath();
      g.ellipse(x,y,rr,rr*(.58+rnd()*.62),rnd()*Math.PI,0,Math.PI*2);
      g.fill();

      const hv=light?136+Math.floor(rnd()*22):111+Math.floor(rnd()*18);
      h.fillStyle='rgba('+hv+','+hv+','+hv+','+(.30+rnd()*.48).toFixed(3)+')';
      h.beginPath();
      h.arc(x,y,Math.max(.30,rr*.72),0,Math.PI*2);
      h.fill();

      const roughV=light?176+Math.floor(rnd()*40):220+Math.floor(rnd()*28);
      r.fillStyle='rgba('+roughV+','+roughV+','+roughV+','+(.15+rnd()*.30).toFixed(3)+')';
      r.beginPath();
      r.arc(x,y,rr*1.05,0,Math.PI*2);
      r.fill();
    }

    // Hairline fatigue cracks are rare and imperfect, never a repeating web.
    for(let i=0;i<34;i++){
      let x=rnd()*size;
      let y=rnd()*size;
      const alpha=.055+rnd()*.070;
      g.strokeStyle='rgba(20,24,24,'+alpha.toFixed(3)+')';
      h.strokeStyle='rgba(78,78,78,'+(.34+rnd()*.32).toFixed(3)+')';
      r.strokeStyle='rgba(247,247,247,'+(.18+rnd()*.20).toFixed(3)+')';
      const lw=.38+rnd()*.95;
      g.lineWidth=lw;
      h.lineWidth=lw*.82;
      r.lineWidth=lw*1.45;
      g.beginPath(); h.beginPath(); r.beginPath();
      g.moveTo(x,y); h.moveTo(x,y); r.moveTo(x,y);
      const segments=3+Math.floor(rnd()*6);
      for(let s=0;s<segments;s++){
        x+=(rnd()-.5)*46;
        y+=10+rnd()*54;
        g.lineTo(x,y); h.lineTo(x,y); r.lineTo(x,y);
      }
      g.stroke(); h.stroke(); r.stroke();
    }
  }else{
    // Concrete fines, exposed sand and tiny pores. The height/roughness response
    // follows the visible specks instead of using unrelated procedural noise.
    for(let i=0;i<7200;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const rr=.28+rnd()*1.45;
      const dark=rnd()>.58;
      const warm=rnd()>.62;
      g.fillStyle=dark
        ? 'rgba(103,101,94,'+(.020+rnd()*.050).toFixed(3)+')'
        : (warm
          ? 'rgba(225,211,187,'+(.018+rnd()*.042).toFixed(3)+')'
          : 'rgba(249,246,235,'+(.016+rnd()*.036).toFixed(3)+')');
      g.beginPath();
      g.arc(x,y,rr,0,Math.PI*2);
      g.fill();

      const hv=dark?105+Math.floor(rnd()*18):137+Math.floor(rnd()*18);
      h.fillStyle='rgba('+hv+','+hv+','+hv+','+(.22+rnd()*.40).toFixed(3)+')';
      h.beginPath();
      h.arc(x,y,Math.max(.24,rr*.68),0,Math.PI*2);
      h.fill();

      const rv=dark?234+Math.floor(rnd()*18):193+Math.floor(rnd()*35);
      r.fillStyle='rgba('+rv+','+rv+','+rv+','+(.12+rnd()*.26).toFixed(3)+')';
      r.beginPath();
      r.arc(x,y,rr*1.15,0,Math.PI*2);
      r.fill();
    }

    // Faint finishing/trowel direction visible only at grazing angles.
    for(let i=0;i<180;i++){
      const y=rnd()*size;
      const x=rnd()*size;
      const len=18+rnd()*95;
      const bend=(rnd()-.5)*5;
      g.strokeStyle='rgba(113,108,97,'+(.008+rnd()*.016).toFixed(3)+')';
      h.strokeStyle='rgba(116,116,116,'+(.08+rnd()*.10).toFixed(3)+')';
      r.strokeStyle='rgba(186,186,186,'+(.035+rnd()*.060).toFixed(3)+')';
      g.lineWidth=.35+rnd()*.75;
      h.lineWidth=.4+rnd()*.8;
      r.lineWidth=.7+rnd()*1.2;
      g.beginPath(); h.beginPath(); r.beginPath();
      g.moveTo(x,y); h.moveTo(x,y); r.moveTo(x,y);
      g.quadraticCurveTo(x+len*.52,y+bend,x+len,y+(rnd()-.5)*4);
      h.quadraticCurveTo(x+len*.52,y+bend,x+len,y+(rnd()-.5)*4);
      r.quadraticCurveTo(x+len*.52,y+bend,x+len,y+(rnd()-.5)*4);
      g.stroke(); h.stroke(); r.stroke();
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(heightCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.anisotropy=8;

  const normal=makeNormalTextureFromHeight(heightCanvas,asphalt?2.55:1.72);
  const ao=makeAOTextureFromHeight(heightCanvas,asphalt?.60:.48);
  return {map,bump,roughness,normal,ao};
}

const asphaltGround=configureTexturePair(
  makeGroundTexturePack('asphalt',0x8a31d64f),
  1.18,
  4.55
);
const pavementGround=configureTexturePair(
  makeGroundTexturePack('pavement',0x63b192e7),
  1.55,
  6.40
);

const asphaltTexture=asphaltGround.map;
const pavementTexture=pavementGround.map;
const asphaltRoughness=asphaltGround.roughness;
const pavementRoughness=pavementGround.roughness;

const facadeSurface=configureTexturePair(makeMaterialTexture('stone',0x51a72d31),.72,5.4);
const limestoneSurface=configureTexturePair(makeMaterialTexture('limestone',0x2cb85419),.70,4.8);
const sandstoneSurface=configureTexturePair(makeMaterialTexture('sandstone',0x9a7345c2),1.05,4.2);
const concreteSurface=configureTexturePair(makeMaterialTexture('concrete',0x327c619b),2.2,5.6);
const fineConcreteSurface=configureTexturePair(makeMaterialTexture('fineConcrete',0x4ac9d176),3.6,8.2);
const coarseConcreteSurface=configureTexturePair(makeMaterialTexture('coarseConcrete',0x8d31a5f0),1.45,3.8);
const woodSurface=configureTexturePair(makeMaterialTexture('wood',0x78d0bc53),1.2,5.8);
const metalSurface=configureTexturePair(makeMaterialTexture('metal',0x1165a2ef),5.5,1.2);

function makeStoneEdgeRoughness(seed,base=220,edge=168){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='rgb('+base+','+base+','+base+')';
  g.fillRect(0,0,size,size);

  const edgeWidth=28;
  const paintEdge=(x0,y0,x1,y1,horizontal=false)=>{
    const grad=g.createLinearGradient(x0,y0,x1,y1);
    grad.addColorStop(0,'rgb('+edge+','+edge+','+edge+')');
    grad.addColorStop(.64,'rgba('+base+','+base+','+base+',.18)');
    grad.addColorStop(1,'rgba('+base+','+base+','+base+',0)');
    g.fillStyle=grad;
    if(horizontal){
      g.fillRect(0,Math.min(y0,y1),size,Math.abs(y1-y0)||edgeWidth);
    }else{
      g.fillRect(Math.min(x0,x1),0,Math.abs(x1-x0)||edgeWidth,size);
    }
  };
  paintEdge(0,0,edgeWidth,0,false);
  paintEdge(size,0,size-edgeWidth,0,false);
  paintEdge(0,0,0,edgeWidth,true);
  paintEdge(0,size,0,size-edgeWidth,true);

  // Small local water uptake / hand-contact patches near edges.
  for(let i=0;i<34;i++){
    const side=Math.floor(rnd()*4);
    const x=side===0?rnd()*edgeWidth:(side===1?size-rnd()*edgeWidth:rnd()*size);
    const y=side===2?rnd()*edgeWidth:(side===3?size-rnd()*edgeWidth:rnd()*size);
    const radius=5+rnd()*18;
    const v=edge-12+Math.floor(rnd()*34);
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.16+rnd()*.18).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}

function makeSkinOilRoughness(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#d5d5d5';
  g.fillRect(0,0,size,size);

  // Broad soft islands emulate natural variation in sebum without assuming a
  // specific facial UV layout.
  for(let i=0;i<26;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=8+rnd()*34;
    const v=154+Math.floor(rnd()*50);
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.10+rnd()*.15).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  for(let i=0;i<1250;i++){
    const v=182+Math.floor(rnd()*55);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.035+rnd()*.08).toFixed(3)+')';
    const rr=.25+rnd()*.70;
    g.fillRect(rnd()*size,rnd()*size,rr,rr);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(3.2,3.2);
  texture.anisotropy=8;
  return texture;
}

const limestoneEdgeRoughness=makeStoneEdgeRoughness(0x31c7a5d2,224,176);
const sandstoneEdgeRoughness=makeStoneEdgeRoughness(0x81de4b63,218,164);
const skinOilRoughness=makeSkinOilRoughness(0x64ab219e);

function makeMetalEdgeRoughness(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#8b8b8b';
  g.fillRect(0,0,size,size);

  const edge=22;
  const left=g.createLinearGradient(0,0,edge,0);
  left.addColorStop(0,'#555555');
  left.addColorStop(1,'rgba(139,139,139,0)');
  g.fillStyle=left; g.fillRect(0,0,edge,size);

  const right=g.createLinearGradient(size,0,size-edge,0);
  right.addColorStop(0,'#555555');
  right.addColorStop(1,'rgba(139,139,139,0)');
  g.fillStyle=right; g.fillRect(size-edge,0,edge,size);

  const top=g.createLinearGradient(0,0,0,edge);
  top.addColorStop(0,'#5d5d5d');
  top.addColorStop(1,'rgba(139,139,139,0)');
  g.fillStyle=top; g.fillRect(0,0,size,edge);

  const bottom=g.createLinearGradient(0,size,0,size-edge);
  bottom.addColorStop(0,'#5d5d5d');
  bottom.addColorStop(1,'rgba(139,139,139,0)');
  g.fillStyle=bottom; g.fillRect(0,size-edge,size,edge);

  for(let i=0;i<180;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const len=3+rnd()*25;
    const v=105+Math.floor(rnd()*65);
    g.strokeStyle='rgba('+v+','+v+','+v+','+(.06+rnd()*.12).toFixed(3)+')';
    g.lineWidth=.35+rnd()*.8;
    g.beginPath();
    g.moveTo(x,y);
    g.lineTo(x+len,y+(rnd()-.5)*1.5);
    g.stroke();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.repeat.set(1,1);
  texture.anisotropy=8;
  return texture;
}
const metalEdgeRoughness=makeMetalEdgeRoughness(0x75ae31c4);

function makeTouchPolishRoughness(){
  const canvas=document.createElement('canvas');
  canvas.width=128;
  canvas.height=256;
  const g=canvas.getContext('2d');
  g.fillStyle='#8c8c8c';
  g.fillRect(0,0,128,256);

  const center=g.createLinearGradient(0,0,128,0);
  center.addColorStop(0,'rgba(140,140,140,0)');
  center.addColorStop(.26,'rgba(102,102,102,.24)');
  center.addColorStop(.46,'rgba(63,63,63,.62)');
  center.addColorStop(.54,'rgba(63,63,63,.62)');
  center.addColorStop(.74,'rgba(102,102,102,.24)');
  center.addColorStop(1,'rgba(140,140,140,0)');
  g.fillStyle=center;
  g.fillRect(0,0,128,256);

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}
const metalTouchRoughness=makeTouchPolishRoughness();

const pavementDetailSurface=configureTexturePair(
  makeMaterialTexture('concrete',0x4d84b271),
  8,
  34
);
const pavementMicroBump=pavementDetailSurface.bump;

const roadDetailSurface=configureTexturePair(
  makeMaterialTexture('concrete',0x93c25f17),
  9,
  42
);
const roadMicroBump=roadDetailSurface.bump;

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
const skinMicroBump=makeMicroBump(0x39ae72c1,7);

function makeOrangePeelNormal(seed,repeat=9){
  const size=192;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.fillStyle='#808080';
  g.fillRect(0,0,size,size);

  for(let i=0;i<1750;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=.35+rnd()*1.25;
    const v=121+Math.floor(rnd()*18);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.22+rnd()*.34).toFixed(3)+')';
    g.beginPath();
    g.arc(x,y,radius,0,Math.PI*2);
    g.fill();
  }

  const normal=makeNormalTextureFromHeight(canvas,.72);
  normal.repeat.set(repeat,repeat);
  normal.anisotropy=8;
  return normal;
}
const vehicleClearcoatNormal=makeOrangePeelNormal(0x7ea14d92,10);

function makeVehicleDustRoughness(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#4c4c4c';
  g.fillRect(0,0,size,size);

  // Broad dusty films interrupt the clearcoat in a way that reads only when
  // highlights sweep across the body.
  for(let i=0;i<46;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=8+rnd()*38;
    const ry=8+rnd()*28;
    const v=104+Math.floor(rnd()*64);
    const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.10+rnd()*.18).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    g.fillStyle=grad;
    g.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  for(let i=0;i<850;i++){
    const v=78+Math.floor(rnd()*70);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.035+rnd()*.085).toFixed(3)+')';
    const rr=.25+rnd()*.85;
    g.fillRect(rnd()*size,rnd()*size,rr,rr);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(3.4,3.4);
  texture.anisotropy=8;
  return texture;
}
const vehicleDustRoughness=makeVehicleDustRoughness(0x8b6e24d1);

function makeSkinSpecularTexture(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#8f8f8f';
  g.fillRect(0,0,size,size);

  for(let i=0;i<34;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=6+rnd()*30;
    const brighter=rnd()>.48;
    const v=brighter
      ? 152+Math.floor(rnd()*46)
      : 86+Math.floor(rnd()*38);
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.10+rnd()*.15).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  for(let i=0;i<1500;i++){
    const v=104+Math.floor(rnd()*80);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.025+rnd()*.060).toFixed(3)+')';
    const rr=.2+rnd()*.65;
    g.fillRect(rnd()*size,rnd()*size,rr,rr);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(3.0,3.0);
  texture.anisotropy=8;
  return texture;
}

function makeRoadMoistureMaps(seed){
  const w=256;
  const h=512;
  const alphaCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  alphaCanvas.width=roughCanvas.width=w;
  alphaCanvas.height=roughCanvas.height=h;
  const a=alphaCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  a.clearRect(0,0,w,h);
  r.fillStyle='#6f6f6f';
  r.fillRect(0,0,w,h);

  // Residual moisture is concentrated near the gutter and interrupted into
  // irregular dry gaps so it never reads like a wet-road effect.
  const edge=a.createLinearGradient(0,0,w,0);
  edge.addColorStop(0,'rgba(83,91,90,.22)');
  edge.addColorStop(.28,'rgba(83,91,90,.095)');
  edge.addColorStop(.72,'rgba(83,91,90,.020)');
  edge.addColorStop(1,'rgba(83,91,90,0)');
  a.fillStyle=edge;
  a.fillRect(0,0,w,h);

  for(let i=0;i<42;i++){
    const x=rnd()*w*.72;
    const y=rnd()*h;
    const rx=8+rnd()*46;
    const ry=14+rnd()*72;
    const grad=a.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba(62,70,70,'+(.035+rnd()*.070).toFixed(3)+')');
    grad.addColorStop(1,'rgba(62,70,70,0)');
    a.fillStyle=grad;
    a.fillRect(x-rx,y-ry,rx*2,ry*2);

    const rv=66+Math.floor(rnd()*42);
    const rg=r.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.22+rnd()*.24).toFixed(3)+')');
    rg.addColorStop(1,'rgba(122,122,122,0)');
    r.fillStyle=rg;
    r.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  const map=new THREE.CanvasTexture(alphaCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(1,3.4);
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.repeat.set(1,3.4);
  roughness.anisotropy=8;

  return {map,roughness};
}

const skinSpecularTexture=makeSkinSpecularTexture(0x2f7ad1c4);
const roadMoistureMaps=makeRoadMoistureMaps(0x7c31e6a9);

function makeWoodFinishRoughness(seed,repeatX=2,repeatY=8){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#c5c5c5';
  g.fillRect(0,0,size,size);

  // Long polished lanes simulate years of hands, cups and clothing rubbing the
  // finish without turning the timber into glossy lacquer.
  for(let i=0;i<34;i++){
    const y=rnd()*size;
    const x=rnd()*size;
    const rx=18+rnd()*70;
    const ry=3+rnd()*12;
    const v=128+Math.floor(rnd()*42);
    const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.10+rnd()*.18).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    g.fillStyle=grad;
    g.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  for(let i=0;i<210;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const len=3+rnd()*28;
    const v=190+Math.floor(rnd()*54);
    g.strokeStyle='rgba('+v+','+v+','+v+','+(.04+rnd()*.11).toFixed(3)+')';
    g.lineWidth=.35+rnd()*.65;
    g.beginPath();
    g.moveTo(x,y);
    g.lineTo(x+len,y+(rnd()-.5)*1.7);
    g.stroke();
  }

  const edgeW=26;
  const left=g.createLinearGradient(0,0,edgeW,0);
  left.addColorStop(0,'rgba(242,242,242,.55)');
  left.addColorStop(1,'rgba(242,242,242,0)');
  g.fillStyle=left; g.fillRect(0,0,edgeW,size);
  const right=g.createLinearGradient(size,0,size-edgeW,0);
  right.addColorStop(0,'rgba(242,242,242,.55)');
  right.addColorStop(1,'rgba(242,242,242,0)');
  g.fillStyle=right; g.fillRect(size-edgeW,0,edgeW,size);
  const top=g.createLinearGradient(0,0,0,edgeW);
  top.addColorStop(0,'rgba(238,238,238,.42)');
  top.addColorStop(1,'rgba(238,238,238,0)');
  g.fillStyle=top; g.fillRect(0,0,size,edgeW);
  const bottom=g.createLinearGradient(0,size,0,size-edgeW);
  bottom.addColorStop(0,'rgba(238,238,238,.42)');
  bottom.addColorStop(1,'rgba(238,238,238,0)');
  g.fillStyle=bottom; g.fillRect(0,size-edgeW,size,edgeW);

  for(let i=0;i<44;i++){
    const side=Math.floor(rnd()*4);
    const x=side===0?rnd()*22:(side===1?size-rnd()*22:rnd()*size);
    const y=side===2?rnd()*22:(side===3?size-rnd()*22:rnd()*size);
    const rx=1+rnd()*5;
    const ry=.6+rnd()*3.2;
    g.fillStyle='rgba(248,248,248,'+(.16+rnd()*.24).toFixed(3)+')';
    g.beginPath();
    g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
    g.fill();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.repeat.set(1,1);
  texture.anisotropy=8;
  return texture;
}

function makeWoodClearcoatWear(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#cfcfcf';
  g.fillRect(0,0,size,size);

  const edgeW=30;
  const edgeGrad=(x0,y0,x1,y1,rect)=>{
    const grad=g.createLinearGradient(x0,y0,x1,y1);
    grad.addColorStop(0,'#5d5d5d');
    grad.addColorStop(.62,'rgba(170,170,170,.42)');
    grad.addColorStop(1,'rgba(207,207,207,0)');
    g.fillStyle=grad;
    g.fillRect(...rect);
  };
  edgeGrad(0,0,edgeW,0,[0,0,edgeW,size]);
  edgeGrad(size,0,size-edgeW,0,[size-edgeW,0,edgeW,size]);
  edgeGrad(0,0,0,edgeW,[0,0,size,edgeW]);
  edgeGrad(0,size,0,size-edgeW,[0,size-edgeW,size,edgeW]);

  for(let i=0;i<60;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=1+rnd()*7;
    const ry=.6+rnd()*4;
    const v=52+Math.floor(rnd()*70);
    g.fillStyle='rgba('+v+','+v+','+v+','+(.18+rnd()*.30).toFixed(3)+')';
    g.beginPath();
    g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
    g.fill();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}

function makeCoatedMetalMaps(seed){
  const size=256;
  const colorCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  const metalCanvas=document.createElement('canvas');
  colorCanvas.width=colorCanvas.height=size;
  roughCanvas.width=roughCanvas.height=size;
  metalCanvas.width=metalCanvas.height=size;
  const g=colorCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const m=metalCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#f2f2ef';
  g.fillRect(0,0,size,size);
  r.fillStyle='#9a9a9a';
  r.fillRect(0,0,size,size);
  m.fillStyle='#0c0c0c';
  m.fillRect(0,0,size,size);

  for(let i=0;i<110;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=.7+rnd()*3.8;
    const ry=.4+rnd()*2.2;
    const exposed=rnd()>.72;
    g.fillStyle=exposed
      ? 'rgba(89,94,92,'+(.16+rnd()*.24).toFixed(3)+')'
      : 'rgba(108,91,73,'+(.06+rnd()*.12).toFixed(3)+')';
    g.beginPath();
    g.ellipse(x,y,rx,ry,rnd()*Math.PI,0,Math.PI*2);
    g.fill();

    const rv=exposed?82+Math.floor(rnd()*42):176+Math.floor(rnd()*46);
    r.fillStyle='rgba('+rv+','+rv+','+rv+','+(.28+rnd()*.32).toFixed(3)+')';
    r.beginPath();
    r.ellipse(x,y,rx*1.15,ry*1.15,0,0,Math.PI*2);
    r.fill();

    if(exposed){
      const mv=188+Math.floor(rnd()*58);
      m.fillStyle='rgba('+mv+','+mv+','+mv+','+(.55+rnd()*.35).toFixed(3)+')';
      m.beginPath();
      m.ellipse(x,y,rx*.88,ry*.88,0,0,Math.PI*2);
      m.fill();
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(3,3);
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.repeat.set(3,3);
  roughness.anisotropy=8;

  const metalness=new THREE.CanvasTexture(metalCanvas);
  metalness.wrapS=metalness.wrapT=THREE.RepeatWrapping;
  metalness.repeat.set(3,3);
  metalness.anisotropy=8;

  return {map,roughness,metalness};
}

const benchWoodClearcoatWear=makeWoodClearcoatWear(0x79bc142e);
const cafeWoodClearcoatWear=makeWoodClearcoatWear(0x31e8a7c4);
const coatedMetalSurface=makeCoatedMetalMaps(0x5ad41c82);

function makeRubberAgingMaps(seed){
  const size=256;
  const bumpCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  bumpCanvas.width=bumpCanvas.height=size;
  roughCanvas.width=roughCanvas.height=size;
  const b=bumpCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  b.fillStyle='#808080';
  b.fillRect(0,0,size,size);
  r.fillStyle='#f0f0f0';
  r.fillRect(0,0,size,size);

  const contactBand=r.createLinearGradient(0,0,size,0);
  contactBand.addColorStop(0,'rgba(235,235,235,0)');
  contactBand.addColorStop(.25,'rgba(214,214,214,.10)');
  contactBand.addColorStop(.43,'rgba(148,148,148,.42)');
  contactBand.addColorStop(.57,'rgba(148,148,148,.42)');
  contactBand.addColorStop(.75,'rgba(214,214,214,.10)');
  contactBand.addColorStop(1,'rgba(235,235,235,0)');
  r.fillStyle=contactBand;
  r.fillRect(0,0,size,size);

  // Slight sidewall bloom and tiny ozone cracks.
  for(let i=0;i<115;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const len=4+rnd()*18;
    const angle=(rnd()-.5)*.55;
    const dx=Math.cos(angle)*len;
    const dy=Math.sin(angle)*len;
    b.strokeStyle='rgba(97,97,97,'+(.14+rnd()*.20).toFixed(3)+')';
    b.lineWidth=.35+rnd()*.55;
    b.beginPath();
    b.moveTo(x,y);
    b.lineTo(x+dx,y+dy);
    b.stroke();

    r.strokeStyle='rgba(205,205,205,'+(.08+rnd()*.14).toFixed(3)+')';
    r.lineWidth=.55+rnd()*.80;
    r.beginPath();
    r.moveTo(x,y);
    r.lineTo(x+dx,y+dy);
    r.stroke();
  }

  for(let i=0;i<1100;i++){
    const v=215+Math.floor(rnd()*38);
    r.fillStyle='rgba('+v+','+v+','+v+','+(.035+rnd()*.07).toFixed(3)+')';
    const rr=.25+rnd()*.85;
    r.fillRect(rnd()*size,rnd()*size,rr,rr);
  }

  const bump=new THREE.CanvasTexture(bumpCanvas);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.repeat.set(5,5);
  bump.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.repeat.set(5,5);
  roughness.anisotropy=8;
  return {bump,roughness};
}

const benchWoodFinishRoughness=makeWoodFinishRoughness(0x6c91ab24,2.2,7.5);
const cafeWoodFinishRoughness=makeWoodFinishRoughness(0x1fd3b785,2.8,5.2);
const rubberAging=makeRubberAgingMaps(0x934ab1d7);

function makePaperTexture(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.fillStyle='#ece5d7';
  g.fillRect(0,0,size,size);
  for(let i=0;i<1650;i++){
    const warm=rnd()>.52;
    g.fillStyle=warm
      ? 'rgba(152,133,105,'+(.008+rnd()*.018).toFixed(3)+')'
      : 'rgba(255,252,242,'+(.010+rnd()*.018).toFixed(3)+')';
    const len=.5+rnd()*2.8;
    g.fillRect(rnd()*size,rnd()*size,len,.25+rnd()*.45);
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(4,4);
  texture.anisotropy=8;
  return texture;
}
const paperFiberTexture=makePaperTexture(0x7b521ace);

function makeDisplayMaterial(type,color){
  if(type==='ceramic'){
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness:.46,
      metalness:0,
      clearcoat:.14,
      clearcoatRoughness:.34,
      envMapIntensity:.40
    });
  }
  if(type==='paper'){
    return new THREE.MeshStandardMaterial({
      color,
      map:paperFiberTexture,
      roughness:.98,
      metalness:0,
      envMapIntensity:.025
    });
  }
  if(type==='leather'){
    return new THREE.MeshPhysicalMaterial({
      color,
      roughness:.82,
      roughnessMap:clothRoughnessTexture,
      metalness:0,
      bumpMap:fabricMicroBump,
      bumpScale:.0016,
      sheen:.08,
      sheenRoughness:.96,
      clearcoat:.015,
      envMapIntensity:.08
    });
  }
  return new THREE.MeshStandardMaterial({
    color,
    roughness:.92,
    roughnessMap:clothRoughnessTexture,
    bumpMap:fabricMicroBump,
    bumpScale:.0022,
    envMapIntensity:.04
  });
}

function makeSubjectRoughnessTexture(kind,seed,repeatX,repeatY){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  const base={
    skin:205,
    cloth:232,
    hair:188,
    carpaint:168
  }[kind] ?? 220;
  g.fillStyle='rgb('+base+','+base+','+base+')';
  g.fillRect(0,0,size,size);

  if(kind==='hair'){
    for(let x=0;x<size;x++){
      const wave=Math.sin(x*.38)+Math.sin(x*.081+1.2)*.45;
      const v=Math.round(188+wave*18);
      g.fillStyle='rgba('+v+','+v+','+v+',.30)';
      g.fillRect(x,0,1,size);
    }
    for(let i=0;i<160;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const len=8+rnd()*50;
      const v=158+Math.floor(rnd()*54);
      g.strokeStyle='rgba('+v+','+v+','+v+','+(.05+rnd()*.11).toFixed(3)+')';
      g.lineWidth=.35+rnd()*.7;
      g.beginPath();
      g.moveTo(x,y);
      g.lineTo(x+(rnd()-.5)*4,y+len);
      g.stroke();
    }
  }else{
    const count=kind==='skin'?1500:(kind==='cloth'?2400:1900);
    for(let i=0;i<count;i++){
      const x=rnd()*size;
      const y=rnd()*size;
      const v=kind==='skin'
        ? 178+Math.floor(rnd()*58)
        : (kind==='cloth'
          ? 205+Math.floor(rnd()*48)
          : 126+Math.floor(rnd()*74));
      const alpha=kind==='carpaint'?.10+rnd()*.18:.08+rnd()*.16;
      g.fillStyle='rgba('+v+','+v+','+v+','+alpha.toFixed(3)+')';
      const rr=.35+rnd()*(kind==='skin'?.8:1.3);
      g.fillRect(x,y,rr,rr);
    }

    if(kind==='carpaint'){
      for(let i=0;i<38;i++){
        const x=rnd()*size;
        const y=rnd()*size;
        const radius=8+rnd()*30;
        const v=118+Math.floor(rnd()*72);
        const grad=g.createRadialGradient(x,y,0,x,y,radius);
        grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.08+rnd()*.14).toFixed(3)+')');
        grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
        g.fillStyle=grad;
        g.fillRect(x-radius,y-radius,radius*2,radius*2);
      }
    }
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeatX,repeatY);
  texture.anisotropy=8;
  return texture;
}

const skinRoughnessTexture=makeSubjectRoughnessTexture('skin',0x2ac9b817,4,4);
const clothRoughnessTexture=makeSubjectRoughnessTexture('cloth',0xa416e35b,10,10);
const hairRoughnessTexture=makeSubjectRoughnessTexture('hair',0x51c82fa0,2.2,7.5);
const vehiclePaintRoughness=makeSubjectRoughnessTexture('carpaint',0x7ad94b21,6,6);

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

function makeBeveledBoxGeometry(width,height,depth,radius=.008){
  const r=Math.max(.001,Math.min(radius,width*.22,height*.22,depth*.22));
  const halfW=width*.5;
  const halfH=height*.5;
  const shape=new THREE.Shape();
  shape.moveTo(-halfW+r,-halfH);
  shape.lineTo(halfW-r,-halfH);
  shape.quadraticCurveTo(halfW,-halfH,halfW,-halfH+r);
  shape.lineTo(halfW,halfH-r);
  shape.quadraticCurveTo(halfW,halfH,halfW-r,halfH);
  shape.lineTo(-halfW+r,halfH);
  shape.quadraticCurveTo(-halfW,halfH,-halfW,halfH-r);
  shape.lineTo(-halfW,-halfH+r);
  shape.quadraticCurveTo(-halfW,-halfH,-halfW+r,-halfH);

  const innerDepth=Math.max(.001,depth-r*2);
  const geometry=new THREE.ExtrudeGeometry(shape,{
    depth:innerDepth,
    steps:1,
    curveSegments:3,
    bevelEnabled:true,
    bevelSegments:2,
    bevelSize:r,
    bevelThickness:r
  });
  geometry.translate(0,0,-innerDepth*.5);
  geometry.computeVertexNormals();
  return geometry;
}

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

function makeMaterialPhaseVariant(baseMaterial,index,scaleBias=0){
  const material=baseMaterial.clone();
  const ox=(.071+index*.173)%1;
  const oy=(.113+index*.287)%1;
  const sx=1+scaleBias+((index%3)-1)*.035;
  const sy=1+scaleBias+(((index+1)%4)-1.5)*.028;
  const rotation=((index%5)-2)*.010;

  ['map','roughnessMap','normalMap','bumpMap','aoMap'].forEach(key=>{
    const texture=material[key];
    if(!texture?.isTexture) return;
    material[key]=cloneTextureVariant(texture,ox,oy,sx,sy,rotation);
  });
  material.needsUpdate=true;
  return material;
}

function makeFoliageMaterial(color,roughness=.91,bumpScale=.009,lightness=.020){
  const base=new THREE.Color(color);
  return new THREE.MeshPhysicalMaterial({
    color:base,
    roughness:Math.max(.90,roughness),
    metalness:0,
    map:foliageSurface.map,
    bumpMap:foliageSurface.bump,
    bumpScale,
    sheen:.10,
    sheenColor:base.clone().lerp(new THREE.Color(0xd7e2c8),.22),
    sheenRoughness:.96,
    clearcoat:.015,
    clearcoatRoughness:.92,
    envMapIntensity:.08,
    emissive:base.clone().multiplyScalar(.08),
    emissiveIntensity:Math.min(.006,lightness*.22)
  });
}

function makeGlassSurfaceTextures(seed){
  const width=512;
  const height=512;
  const colorCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  colorCanvas.width=roughCanvas.width=width;
  colorCanvas.height=roughCanvas.height=height;
  const g=colorCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  // Reflection tint is deliberately low contrast. The environment map supplies
  // the actual specular response; this texture only adds the large-scale urban
  // color variation that prevents perfectly uniform blue glass.
  const sky=g.createLinearGradient(0,0,0,height);
  sky.addColorStop(0,'#d9e8eb');
  sky.addColorStop(.28,'#b9d0d5');
  sky.addColorStop(.55,'#aebfc0');
  sky.addColorStop(.73,'#b5b7aa');
  sky.addColorStop(1,'#8c9690');
  g.fillStyle=sky;
  g.fillRect(0,0,width,height);

  // Broad reflected architecture. Edges stay soft and incomplete so panes read
  // as glass reflecting a city, not as an image pasted onto the facade.
  for(let i=0;i<5;i++){
    const x=rnd()*width;
    const w=28+rnd()*84;
    const top=205+rnd()*115;
    const shade=92+Math.floor(rnd()*54);
    const alpha=.018+rnd()*.045;
    const grad=g.createLinearGradient(x,0,x+w,0);
    grad.addColorStop(0,'rgba('+shade+','+(shade+7)+','+(shade+5)+',0)');
    grad.addColorStop(.18,'rgba('+shade+','+(shade+7)+','+(shade+5)+','+alpha.toFixed(3)+')');
    grad.addColorStop(.82,'rgba('+shade+','+(shade+7)+','+(shade+5)+','+(alpha*.76).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+shade+','+(shade+7)+','+(shade+5)+',0)');
    g.fillStyle=grad;
    g.fillRect(x,top,w,height-top);
  }

  // Soft tree masses and warm street tones near the horizon.
  for(let i=0;i<17;i++){
    const x=rnd()*width;
    const y=325+rnd()*78;
    const rx=18+rnd()*70;
    const ry=9+rnd()*28;
    const green=rnd()>.35;
    const grad=g.createRadialGradient(x,y,2,x,y,rx);
    grad.addColorStop(
      0,
      green
        ? 'rgba(72,92,76,'+(.025+rnd()*.052).toFixed(3)+')'
        : 'rgba(157,132,104,'+(.018+rnd()*.038).toFixed(3)+')'
    );
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  // Broken cloud bands create natural low-frequency reflection variation.
  for(let i=0;i<13;i++){
    const x=rnd()*width;
    const y=45+rnd()*210;
    const rx=36+rnd()*105;
    const ry=8+rnd()*22;
    const grad=g.createRadialGradient(x,y,3,x,y,rx);
    grad.addColorStop(0,'rgba(250,252,250,'+(.020+rnd()*.045).toFixed(3)+')');
    grad.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=grad;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  // Glass roughness starts mostly smooth, then receives the same real-world
  // causes that affect appearance: hand cleaning arcs, rain trails and dust.
  r.fillStyle='#444444';
  r.fillRect(0,0,width,height);

  for(let i=0;i<82;i++){
    const x=rnd()*width;
    const y=20+rnd()*(height-40);
    const rx=8+rnd()*42;
    const ry=6+rnd()*26;
    const v=70+Math.floor(rnd()*54);
    const grad=r.createRadialGradient(x,y,1,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.035+rnd()*.090).toFixed(3)+')');
    grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    r.fillStyle=grad;
    r.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  // Vertical rain/mineral traces affect roughness and are barely visible in
  // albedo; keeping both channels aligned is what makes them feel physical.
  for(let i=0;i<38;i++){
    const x=rnd()*width;
    const y=35+rnd()*350;
    const len=28+rnd()*120;
    const drift=(rnd()-.5)*5;
    const a=.012+rnd()*.024;
    const cg=g.createLinearGradient(x,y,x+drift,y+len);
    cg.addColorStop(0,'rgba(235,239,233,'+a.toFixed(3)+')');
    cg.addColorStop(1,'rgba(235,239,233,0)');
    g.strokeStyle=cg;
    g.lineWidth=.45+rnd()*.90;
    g.beginPath();
    g.moveTo(x,y);
    g.lineTo(x+drift,y+len);
    g.stroke();

    const rg=r.createLinearGradient(x,y,x+drift,y+len);
    rg.addColorStop(0,'rgba(146,146,146,'+(.055+rnd()*.085).toFixed(3)+')');
    rg.addColorStop(1,'rgba(146,146,146,0)');
    r.strokeStyle=rg;
    r.lineWidth=1.0+rnd()*1.8;
    r.beginPath();
    r.moveTo(x,y);
    r.lineTo(x+drift,y+len);
    r.stroke();
  }

  // Partial wipe marks, kept sparse and low contrast.
  for(let i=0;i<14;i++){
    const cx=30+rnd()*(width-60);
    const cy=75+rnd()*(height-130);
    const rx=18+rnd()*36;
    const ry=10+rnd()*28;
    const start=.12+rnd()*.4;
    const finish=1.15+rnd()*.75;
    g.strokeStyle='rgba(246,248,244,'+(.008+rnd()*.015).toFixed(3)+')';
    g.lineWidth=.8+rnd()*1.2;
    g.beginPath();
    g.ellipse(cx,cy,rx,ry,(rnd()-.5)*.35,start*Math.PI,finish*Math.PI);
    g.stroke();

    r.strokeStyle='rgba(126,126,126,'+(.040+rnd()*.070).toFixed(3)+')';
    r.lineWidth=1.2+rnd()*2.2;
    r.beginPath();
    r.ellipse(cx,cy,rx,ry,(rnd()-.5)*.35,start*Math.PI,finish*Math.PI);
    r.stroke();
  }

  // Dust accumulates softly toward the lower pane edge.
  const dust=g.createLinearGradient(0,height*.70,0,height);
  dust.addColorStop(0,'rgba(118,112,100,0)');
  dust.addColorStop(1,'rgba(118,112,100,.032)');
  g.fillStyle=dust;
  g.fillRect(0,height*.70,width,height*.30);
  const roughDust=r.createLinearGradient(0,height*.72,0,height);
  roughDust.addColorStop(0,'rgba(134,134,134,0)');
  roughDust.addColorStop(1,'rgba(134,134,134,.11)');
  r.fillStyle=roughDust;
  r.fillRect(0,height*.72,width,height*.28);

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=THREE.RepeatWrapping;
  map.wrapT=THREE.ClampToEdgeWrapping;
  map.repeat.set(1,1);
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=THREE.RepeatWrapping;
  roughness.wrapT=THREE.ClampToEdgeWrapping;
  roughness.repeat.set(1,1);
  roughness.anisotropy=8;

  return {map,roughness};
}

const glassSurfaceTextures=makeGlassSurfaceTextures(0x184bd7a1);
const glassReflectionTexture=glassSurfaceTextures.map;
const glassRoughnessTexture=glassSurfaceTextures.roughness;

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

function ensureSecondaryUV(geometry){
  if(geometry?.attributes?.uv && !geometry.attributes.uv2){
    geometry.setAttribute('uv2',geometry.attributes.uv.clone());
  }
  return geometry;
}

function box(w, h, d, color, x, y, z, roughness=.72, metalness=.02) {
  const mesh = new THREE.Mesh(
    ensureSecondaryUV(new THREE.BoxGeometry(w,h,d)),
    new THREE.MeshStandardMaterial({ color, roughness, metalness })
  );
  mesh.position.set(x,y,z);
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  scene.add(mesh);
  return mesh;
}

function plane(w,h,color,x,y,z,rx=-Math.PI/2,ry=0,rz=0,roughness=.9){
  const mesh=new THREE.Mesh(
    ensureSecondaryUV(new THREE.PlaneGeometry(w,h)),
    new THREE.MeshStandardMaterial({color,roughness,metalness:0,side:THREE.DoubleSide})
  );
  mesh.position.set(x,y,z);
  mesh.rotation.set(rx,ry,rz);
  mesh.receiveShadow=true;
  scene.add(mesh);
  return mesh;
}

function glassPanel(w,h,x,y,z,ry=-Math.PI/2,tint=0x929e9e){
  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(w,h),
    new THREE.MeshPhysicalMaterial({
      color:tint,
      map:glassReflectionTexture,
      roughnessMap:glassRoughnessTexture,
      roughness:.18,
      metalness:0,
      transparent:true,
      opacity:.39,
      transmission:.14,
      ior:1.50,
      thickness:.014,
      clearcoat:.03,
      clearcoatRoughness:.38,
      envMapIntensity:.92,
      side:THREE.DoubleSide
    })
  );
  panel.position.set(x,y,z);
  panel.rotation.y=ry;
  panel.receiveShadow=true;
  scene.add(panel);

  const innerPane=new THREE.Mesh(
    new THREE.PlaneGeometry(w*.992,h*.992),
    new THREE.MeshPhysicalMaterial({
      color:new THREE.Color(tint).lerp(new THREE.Color(0xcbd7d5),.22),
      roughnessMap:glassRoughnessTexture,
      roughness:.26,
      metalness:0,
      transparent:true,
      opacity:.095,
      transmission:.045,
      ior:1.50,
      thickness:.006,
      clearcoat:0,
      envMapIntensity:.48,
      depthWrite:false,
      side:THREE.DoubleSide
    })
  );
  innerPane.position.z=-.018;
  innerPane.renderOrder=1;
  panel.add(innerPane);

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

function makeFacadeExposureSurface(seed){
  const w=1024;
  const h=256;
  const colorCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  colorCanvas.width=roughCanvas.width=w;
  colorCanvas.height=roughCanvas.height=h;
  const g=colorCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.clearRect(0,0,w,h);
  r.fillStyle='#eeeeee';
  r.fillRect(0,0,w,h);

  // Broad exposure zones: pollution and moisture history vary across tens of
  // metres, not as evenly distributed procedural speckles.
  for(let i=0;i<36;i++){
    const x=rnd()*w;
    const y=20+rnd()*(h-35);
    const rx=28+rnd()*125;
    const ry=12+rnd()*58;
    const family=Math.floor(rnd()*3);
    const tone=[
      [88,82,73],
      [83,94,88],
      [154,135,112]
    ][family];
    const alpha=.012+rnd()*.030;
    const cg=g.createRadialGradient(x,y,2,x,y,Math.max(rx,ry));
    cg.addColorStop(0,'rgba('+tone[0]+','+tone[1]+','+tone[2]+','+alpha.toFixed(3)+')');
    cg.addColorStop(1,'rgba('+tone[0]+','+tone[1]+','+tone[2]+',0)');
    g.fillStyle=cg;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();

    const rv=176+Math.floor(rnd()*58);
    const rg=r.createRadialGradient(x,y,2,x,y,Math.max(rx,ry));
    rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.08+rnd()*.16).toFixed(3)+')');
    rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
    r.fillStyle=rg;
    r.save();
    r.translate(x,y);
    r.scale(1,ry/rx);
    r.beginPath();
    r.arc(0,0,rx,0,Math.PI*2);
    r.fill();
    r.restore();
  }

  // Water begins below believable horizontal projections/window lines. Each
  // streak changes both albedo and roughness, so it reacts at grazing angles.
  const dripRows=[32,78,126,174];
  dripRows.forEach((row,rowIndex)=>{
    for(let i=0;i<18;i++){
      const x=(i+.18+rnd()*.66)*(w/18);
      const y=row+rnd()*8;
      const len=15+rnd()*(32+rowIndex*8);
      const drift=(rnd()-.5)*5;
      const dark=rnd()>.22;
      const alpha=.018+rnd()*.034;
      const cg=g.createLinearGradient(x,y,x+drift,y+len);
      cg.addColorStop(
        0,
        dark
          ? 'rgba(67,73,68,'+alpha.toFixed(3)+')'
          : 'rgba(211,202,184,'+(alpha*.72).toFixed(3)+')'
      );
      cg.addColorStop(.68,dark
        ? 'rgba(67,73,68,'+(alpha*.36).toFixed(3)+')'
        : 'rgba(211,202,184,'+(alpha*.20).toFixed(3)+')');
      cg.addColorStop(1,'rgba(0,0,0,0)');
      g.strokeStyle=cg;
      g.lineWidth=.55+rnd()*1.30;
      g.beginPath();
      g.moveTo(x,y);
      g.bezierCurveTo(
        x+(rnd()-.5)*2,y+len*.28,
        x+drift*.75,y+len*.70,
        x+drift,y+len
      );
      g.stroke();

      const roughV=dark
        ? 150+Math.floor(rnd()*42)
        : 214+Math.floor(rnd()*28);
      const rg=r.createLinearGradient(x,y,x+drift,y+len);
      rg.addColorStop(0,'rgba('+roughV+','+roughV+','+roughV+','+(.12+rnd()*.18).toFixed(3)+')');
      rg.addColorStop(1,'rgba('+roughV+','+roughV+','+roughV+',0)');
      r.strokeStyle=rg;
      r.lineWidth=1.2+rnd()*2.2;
      r.beginPath();
      r.moveTo(x,y);
      r.bezierCurveTo(
        x+(rnd()-.5)*2,y+len*.28,
        x+drift*.75,y+len*.70,
        x+drift,y+len
      );
      r.stroke();
    }
  });

  // Lower 1-1.5m: splashback, road dust and repeated cleaning create a much
  // richer roughness transition than a simple dark gradient.
  const base=g.createLinearGradient(0,h*.66,0,h);
  base.addColorStop(0,'rgba(85,79,70,0)');
  base.addColorStop(.56,'rgba(85,79,70,.018)');
  base.addColorStop(1,'rgba(69,66,59,.072)');
  g.fillStyle=base;
  g.fillRect(0,h*.64,w,h*.36);

  const baseRough=r.createLinearGradient(0,h*.64,0,h);
  baseRough.addColorStop(0,'rgba(238,238,238,0)');
  baseRough.addColorStop(.58,'rgba(202,202,202,.10)');
  baseRough.addColorStop(1,'rgba(174,174,174,.30)');
  r.fillStyle=baseRough;
  r.fillRect(0,h*.64,w,h*.36);

  for(let i=0;i<130;i++){
    const x=rnd()*w;
    const y=h*.72+rnd()*h*.26;
    const rr=.6+rnd()*3.4;
    g.fillStyle='rgba(74,72,65,'+(.010+rnd()*.030).toFixed(3)+')';
    g.beginPath();
    g.arc(x,y,rr,0,Math.PI*2);
    g.fill();

    const rv=155+Math.floor(rnd()*62);
    r.fillStyle='rgba('+rv+','+rv+','+rv+','+(.06+rnd()*.15).toFixed(3)+')';
    r.beginPath();
    r.arc(x,y,rr*1.4,0,Math.PI*2);
    r.fill();
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.ClampToEdgeWrapping;
  roughness.anisotropy=8;

  return {map,roughness};
}

const facadeExposureSurface=makeFacadeExposureSurface(0x92ec41b7);
const roadWearTexture=makeWeatheringTexture('road',0x5ca91d73);
roadWearTexture.repeat.set(1.2,4.8);
const metalWearTexture=makeWeatheringTexture('metal',0x31d7be42);
metalWearTexture.repeat.set(2.5,5.0);

function makeMacroPatinaTexture(kind,seed){
  const w=512;
  const h=512;
  const colorCanvas=document.createElement('canvas');
  const roughCanvas=document.createElement('canvas');
  colorCanvas.width=roughCanvas.width=w;
  colorCanvas.height=roughCanvas.height=h;
  const g=colorCanvas.getContext('2d');
  const r=roughCanvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.clearRect(0,0,w,h);

  if(kind==='wallBase'){
    r.fillStyle='#dddddd';
    r.fillRect(0,0,w,h);

    const base=g.createLinearGradient(0,h*.48,0,h);
    base.addColorStop(0,'rgba(82,74,65,0)');
    base.addColorStop(.70,'rgba(91,80,68,.028)');
    base.addColorStop(1,'rgba(73,68,59,.105)');
    g.fillStyle=base;
    g.fillRect(0,h*.45,w,h*.55);

    const roughBase=r.createLinearGradient(0,h*.45,0,h);
    roughBase.addColorStop(0,'#dddddd');
    roughBase.addColorStop(.72,'#c6c6c6');
    roughBase.addColorStop(1,'#b4b4b4');
    r.fillStyle=roughBase;
    r.fillRect(0,h*.45,w,h*.55);

    for(let i=0;i<54;i++){
      const x=rnd()*w;
      const y=h*.55+rnd()*h*.43;
      const rx=8+rnd()*42;
      const ry=18+rnd()*96;
      const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      grad.addColorStop(
        0,
        rnd()>.72
          ? 'rgba(82,96,84,'+(.018+rnd()*.030).toFixed(3)+')'
          : 'rgba(111,91,70,'+(.016+rnd()*.032).toFixed(3)+')'
      );
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-rx,y-ry,rx*2,ry*2);

      const rv=145+Math.floor(rnd()*54);
      const rg=r.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.10+rnd()*.18).toFixed(3)+')');
      rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
      r.fillStyle=rg;
      r.fillRect(x-rx,y-ry,rx*2,ry*2);
    }
  }else if(kind==='roadOil'){
    r.fillStyle='#d9d9d9';
    r.fillRect(0,0,w,h);

    for(let i=0;i<38;i++){
      const x=w*(.18+rnd()*.64);
      const y=rnd()*h;
      const rx=10+rnd()*40;
      const ry=24+rnd()*105;
      const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      grad.addColorStop(0,'rgba(19,23,23,'+(.028+rnd()*.055).toFixed(3)+')');
      grad.addColorStop(.55,'rgba(28,31,31,'+(.010+rnd()*.022).toFixed(3)+')');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-rx,y-ry,rx*2,ry*2);

      const polished=92+Math.floor(rnd()*54);
      const rg=r.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      rg.addColorStop(0,'rgba('+polished+','+polished+','+polished+','+(.28+rnd()*.28).toFixed(3)+')');
      rg.addColorStop(1,'rgba(220,220,220,0)');
      r.fillStyle=rg;
      r.fillRect(x-rx,y-ry,rx*2,ry*2);
    }
  }else{
    r.fillStyle='#e3e3e3';
    r.fillRect(0,0,w,h);

    for(let i=0;i<44;i++){
      const x=rnd()*w;
      const y=rnd()*h;
      const rx=12+rnd()*48;
      const ry=8+rnd()*30;
      const grad=g.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      grad.addColorStop(0,'rgba(101,93,82,'+(.012+rnd()*.026).toFixed(3)+')');
      grad.addColorStop(1,'rgba(0,0,0,0)');
      g.fillStyle=grad;
      g.fillRect(x-rx,y-ry,rx*2,ry*2);

      const rv=165+Math.floor(rnd()*50);
      const rg=r.createRadialGradient(x,y,0,x,y,Math.max(rx,ry));
      rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.10+rnd()*.18).toFixed(3)+')');
      rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
      r.fillStyle=rg;
      r.fillRect(x-rx,y-ry,rx*2,ry*2);
    }
  }

  const map=new THREE.CanvasTexture(colorCanvas);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS=roughness.wrapT=THREE.ClampToEdgeWrapping;
  roughness.anisotropy=8;
  return {map,roughness};
}

function makeRoadDustTexture(seed){
  const size=512;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  g.clearRect(0,0,size,size);

  // Dust accumulates mostly near the road edges and gutter, with a little
  // wind-blown material crossing the lane.
  const edgeLeft=g.createLinearGradient(0,0,150,0);
  edgeLeft.addColorStop(0,'rgba(202,188,161,.15)');
  edgeLeft.addColorStop(.36,'rgba(202,188,161,.05)');
  edgeLeft.addColorStop(1,'rgba(202,188,161,0)');
  g.fillStyle=edgeLeft;
  g.fillRect(0,0,170,size);

  const edgeRight=g.createLinearGradient(size,0,size-150,0);
  edgeRight.addColorStop(0,'rgba(196,184,160,.10)');
  edgeRight.addColorStop(.40,'rgba(196,184,160,.035)');
  edgeRight.addColorStop(1,'rgba(196,184,160,0)');
  g.fillStyle=edgeRight;
  g.fillRect(size-170,0,170,size);

  for(let i=0;i<420;i++){
    const nearEdge=rnd()>.34;
    const x=nearEdge
      ? (rnd()>.5 ? rnd()*130 : size-rnd()*130)
      : rnd()*size;
    const y=rnd()*size;
    const rr=.25+rnd()*1.15;
    g.fillStyle='rgba(214,198,168,'+(.018+rnd()*.040).toFixed(3)+')';
    g.beginPath();
    g.arc(x,y,rr,0,Math.PI*2);
    g.fill();
  }

  for(let i=0;i<28;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const len=18+rnd()*72;
    g.strokeStyle='rgba(198,184,157,'+(.012+rnd()*.022).toFixed(3)+')';
    g.lineWidth=.5+rnd()*1.1;
    g.beginPath();
    g.moveTo(x,y);
    g.bezierCurveTo(
      x+len*.32,y+(rnd()-.5)*8,
      x+len*.70,y+(rnd()-.5)*12,
      x+len,y+(rnd()-.5)*7
    );
    g.stroke();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(1.15,4.4);
  texture.anisotropy=8;
  return texture;
}

const roadDustTexture=makeRoadDustTexture(0x4d17ac92);

function makeWoodEndGrainTexture(seed){
  const size=256;
  const canvas=document.createElement('canvas');
  canvas.width=canvas.height=size;
  const g=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#a87958';
  g.fillRect(0,0,size,size);

  const cx=size*.50+(rnd()-.5)*12;
  const cy=size*.52+(rnd()-.5)*12;
  for(let ring=0;ring<34;ring++){
    const rx=6+ring*3.35+(rnd()-.5)*1.4;
    const ry=5+ring*2.55+(rnd()-.5)*1.2;
    g.strokeStyle=ring%3===0
      ? 'rgba(75,45,29,.085)'
      : 'rgba(232,191,148,.045)';
    g.lineWidth=.55+(ring%4===0?.35:0);
    g.beginPath();
    g.ellipse(cx,cy,rx,ry,(rnd()-.5)*.025,0,Math.PI*2);
    g.stroke();
  }
  for(let i=0;i<95;i++){
    g.fillStyle='rgba(68,43,30,'+(.015+rnd()*.030).toFixed(3)+')';
    g.beginPath();
    g.arc(rnd()*size,rnd()*size,.3+rnd()*.85,0,Math.PI*2);
    g.fill();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}

const wallBasePatina=makeMacroPatinaTexture('wallBase',0x5169a27d);
const roadOilPatina=makeMacroPatinaTexture('roadOil',0x87cd215b);
const pavementPatina=makeMacroPatinaTexture('pavement',0x21bc95e3);
const woodEndGrainTexture=makeWoodEndGrainTexture(0x53c921af);

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

function makeGlassEdgeSheenTexture(){
  const canvas=document.createElement('canvas');
  canvas.width=256;
  canvas.height=512;
  const g=canvas.getContext('2d');
  g.clearRect(0,0,256,512);

  const left=g.createLinearGradient(0,0,34,0);
  left.addColorStop(0,'rgba(218,240,244,.22)');
  left.addColorStop(.32,'rgba(198,225,230,.07)');
  left.addColorStop(1,'rgba(198,225,230,0)');
  g.fillStyle=left;
  g.fillRect(0,0,42,512);

  const right=g.createLinearGradient(256,0,222,0);
  right.addColorStop(0,'rgba(218,240,244,.18)');
  right.addColorStop(.32,'rgba(198,225,230,.06)');
  right.addColorStop(1,'rgba(198,225,230,0)');
  g.fillStyle=right;
  g.fillRect(214,0,42,512);

  const top=g.createLinearGradient(0,0,0,30);
  top.addColorStop(0,'rgba(237,247,246,.12)');
  top.addColorStop(1,'rgba(237,247,246,0)');
  g.fillStyle=top;
  g.fillRect(0,0,256,36);

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  texture.anisotropy=8;
  return texture;
}
const glassEdgeSheenTexture=makeGlassEdgeSheenTexture();

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

  const edgeSheen=new THREE.Mesh(
    new THREE.PlaneGeometry(w*.996,h*.996),
    new THREE.MeshBasicMaterial({
      map:glassEdgeSheenTexture,
      transparent:true,
      opacity:.22,
      depthWrite:false,
      toneMapped:false,
      side:THREE.DoubleSide,
      blending:THREE.NormalBlending
    })
  );
  edgeSheen.position.set(x-.009,y,z);
  edgeSheen.rotation.y=ry;
  edgeSheen.renderOrder=2;
  scene.add(edgeSheen);

  return overlay;
}

// ---------- daytime city block ----------
// Ground is deliberately split into road, curb and pedestrian zones so the
// player immediately reads this as a real street rather than a generic floor.
const cityGround=plane(52,92,0xc7c4b9,0,-.045,-4);
cityGround.material.map=pavementTexture;
cityGround.material.roughnessMap=pavementRoughness;
cityGround.material.normalMap=pavementGround.normal;
cityGround.material.normalScale.set(.22,.22);
cityGround.material.aoMap=pavementGround.ao;
cityGround.material.aoMapIntensity=.22;
cityGround.material.bumpMap=pavementGround.bump;
cityGround.material.bumpScale=.018;
cityGround.material.roughness=.98;
cityGround.material.envMapIntensity=.035;
cityGround.material.color.set(0xd1d1cc);
cityGround.material.needsUpdate=true;

const road=plane(15,92,0xffffff,-6.7,.004,-4);
road.material.map=asphaltTexture;
road.material.roughnessMap=asphaltRoughness;
road.material.normalMap=asphaltGround.normal;
road.material.normalScale.set(.26,.26);
road.material.aoMap=asphaltGround.ao;
road.material.aoMapIntensity=.18;
road.material.bumpMap=asphaltGround.bump;
road.material.bumpScale=.022;
road.material.roughness=.96;
road.material.envMapIntensity=.018;
road.material.needsUpdate=true;


const roadMacroWearCanvas=document.createElement('canvas');
roadMacroWearCanvas.width=512;
roadMacroWearCanvas.height=1024;
const roadMacroWearCtx=roadMacroWearCanvas.getContext('2d');
const roadMacroWearRnd=makeSeededRandom(0x4bd319af);
roadMacroWearCtx.clearRect(0,0,512,1024);

[
  [132,.050,16],
  [197,.033,12],
  [315,.043,15],
  [380,.028,11]
].forEach(([x,a,w])=>{
  const grad=roadMacroWearCtx.createLinearGradient(x-w,0,x+w,0);
  grad.addColorStop(0,'rgba(28,32,31,0)');
  grad.addColorStop(.50,'rgba(25,29,28,'+a.toFixed(3)+')');
  grad.addColorStop(1,'rgba(28,32,31,0)');
  roadMacroWearCtx.fillStyle=grad;
  roadMacroWearCtx.fillRect(x-w,0,w*2,1024);
});

for(let i=0;i<14;i++){
  const x=42+roadMacroWearRnd()*420;
  const y=roadMacroWearRnd()*1024;
  const w=28+roadMacroWearRnd()*78;
  const h=16+roadMacroWearRnd()*70;
  const radius=4+roadMacroWearRnd()*9;
  roadMacroWearCtx.fillStyle='rgba(40,45,44,'+(.035+roadMacroWearRnd()*.040).toFixed(3)+')';
  roadMacroWearCtx.beginPath();
  roadMacroWearCtx.roundRect(x-w*.5,y-h*.5,w,h,radius);
  roadMacroWearCtx.fill();
  roadMacroWearCtx.strokeStyle='rgba(25,29,29,'+(.040+roadMacroWearRnd()*.045).toFixed(3)+')';
  roadMacroWearCtx.lineWidth=.7+roadMacroWearRnd()*1.1;
  roadMacroWearCtx.stroke();
}

for(let i=0;i<23;i++){
  let x=roadMacroWearRnd()*512;
  let y=roadMacroWearRnd()*1024;
  roadMacroWearCtx.strokeStyle='rgba(22,26,26,'+(.045+roadMacroWearRnd()*.055).toFixed(3)+')';
  roadMacroWearCtx.lineWidth=.45+roadMacroWearRnd()*.70;
  roadMacroWearCtx.beginPath();
  roadMacroWearCtx.moveTo(x,y);
  const segments=2+Math.floor(roadMacroWearRnd()*4);
  for(let s=0;s<segments;s++){
    x+=(roadMacroWearRnd()-.5)*28;
    y+=10+roadMacroWearRnd()*34;
    roadMacroWearCtx.lineTo(x,y);
  }
  roadMacroWearCtx.stroke();
}

for(let i=0;i<9;i++){
  const x=70+roadMacroWearRnd()*360;
  const y=roadMacroWearRnd()*1024;
  const rx=18+roadMacroWearRnd()*55;
  const ry=8+roadMacroWearRnd()*25;
  const grad=roadMacroWearCtx.createRadialGradient(x,y,1,x,y,rx);
  grad.addColorStop(0,'rgba(118,119,112,'+(.020+roadMacroWearRnd()*.030).toFixed(3)+')');
  grad.addColorStop(1,'rgba(118,119,112,0)');
  roadMacroWearCtx.fillStyle=grad;
  roadMacroWearCtx.save();
  roadMacroWearCtx.translate(x,y);
  roadMacroWearCtx.scale(1,ry/rx);
  roadMacroWearCtx.beginPath();
  roadMacroWearCtx.arc(0,0,rx,0,Math.PI*2);
  roadMacroWearCtx.fill();
  roadMacroWearCtx.restore();
}

const roadMacroWearTexture=new THREE.CanvasTexture(roadMacroWearCanvas);
roadMacroWearTexture.colorSpace=THREE.SRGBColorSpace;
roadMacroWearTexture.anisotropy=8;
const roadMacroWearOverlay=new THREE.Mesh(
  new THREE.PlaneGeometry(14.7,90.5),
  new THREE.MeshBasicMaterial({
    map:roadMacroWearTexture,
    transparent:true,
    opacity:.42,
    depthWrite:false,
    toneMapped:true
  })
);
roadMacroWearOverlay.rotation.x=-Math.PI/2;
roadMacroWearOverlay.position.set(-6.7,.018,-4);
roadMacroWearOverlay.renderOrder=2;
scene.add(roadMacroWearOverlay);

// Visual-only continuation beyond the playable bounds. Extending the surface
// removes the "map edge" at the end of the boulevard while keeping collision
// and player limits unchanged.
const distantRoadTexture=asphaltTexture.clone();
distantRoadTexture.repeat.set(5,12);
distantRoadTexture.offset.set(.17,.08);
distantRoadTexture.needsUpdate=true;
const distantRoadRoughness=asphaltRoughness.clone();
distantRoadRoughness.repeat.set(5,12);
distantRoadRoughness.offset.set(.17,.08);
distantRoadRoughness.needsUpdate=true;
const distantRoad=new THREE.Mesh(
  new THREE.PlaneGeometry(15,34),
  new THREE.MeshStandardMaterial({
    color:0xffffff,
    map:distantRoadTexture,
    roughnessMap:distantRoadRoughness,
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
const distantSidewalkRoughness=pavementRoughness.clone();
distantSidewalkRoughness.repeat.set(4,9);
distantSidewalkRoughness.offset.set(.28,.11);
distantSidewalkRoughness.needsUpdate=true;
const distantSidewalk=new THREE.Mesh(
  new THREE.PlaneGeometry(10.8,34),
  new THREE.MeshStandardMaterial({
    color:0xc7c4b9,
    map:distantSidewalkTexture,
    roughnessMap:distantSidewalkRoughness,
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

const visualCurbExtension=new THREE.Mesh(
  new THREE.PlaneGeometry(.72,84),
  new THREE.MeshStandardMaterial({
    color:0xd6d7d2,
    roughness:.98,
    map:pavementTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.008
  })
);
visualCurbExtension.rotation.x=-Math.PI/2;
visualCurbExtension.position.set(.36,.020,-4);
visualCurbExtension.receiveShadow=true;
scene.add(visualCurbExtension);

const sidewalk=plane(10.8,92,0xffffff,4.2,.014,-4);
sidewalk.material.map=pavementTexture;
sidewalk.material.roughnessMap=pavementRoughness;
sidewalk.material.normalMap=pavementGround.normal;
sidewalk.material.normalScale.set(.23,.23);
sidewalk.material.aoMap=pavementGround.ao;
sidewalk.material.aoMapIntensity=.24;
sidewalk.material.bumpMap=pavementGround.bump;
sidewalk.material.bumpScale=.018;
sidewalk.material.roughness=.96;
sidewalk.material.envMapIntensity=.030;
sidewalk.material.needsUpdate=true;

const curbsidePaving=new THREE.Mesh(
  new THREE.PlaneGeometry(1.35,88),
  new THREE.MeshStandardMaterial({
    color:0xd9dad5,
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

// Reference boulevard cue: a restrained warm edge line separates asphalt from
// the pedestrian zone and makes the road geometry read instantly in sunlight.
const boulevardEdgeLine=new THREE.Mesh(
  new THREE.PlaneGeometry(.085,88),
  new THREE.MeshStandardMaterial({
    color:0xd6b54b,
    roughness:.90,
    metalness:0,
    envMapIntensity:.025
  })
);
boulevardEdgeLine.rotation.x=-Math.PI/2;
boulevardEdgeLine.position.set(-.08,.032,-4);
boulevardEdgeLine.receiveShadow=true;
scene.add(boulevardEdgeLine);
curb.material.map=concreteSurface.map;
curb.material.roughnessMap=concreteSurface.roughness;
curb.material.normalMap=concreteSurface.normal;
curb.material.normalScale.set(.20,.20);
curb.material.aoMap=concreteSurface.ao;
curb.material.aoMapIntensity=.20;
curb.material.bumpMap=concreteSurface.bump;
curb.material.bumpScale=.012;
curb.material.needsUpdate=true;


const curbGrimeCanvas=document.createElement('canvas');
curbGrimeCanvas.width=96;
curbGrimeCanvas.height=1024;
const curbGrimeCtx=curbGrimeCanvas.getContext('2d');
const curbGrimeRnd=makeSeededRandom(0x8bca4d17);
curbGrimeCtx.clearRect(0,0,96,1024);

// Dust-darkened lower edge.
const curbDustGrad=curbGrimeCtx.createLinearGradient(0,0,96,0);
curbDustGrad.addColorStop(0,'rgba(74,74,69,.15)');
curbDustGrad.addColorStop(.34,'rgba(92,91,84,.075)');
curbDustGrad.addColorStop(1,'rgba(92,91,84,0)');
curbGrimeCtx.fillStyle=curbDustGrad;
curbGrimeCtx.fillRect(0,0,96,1024);

// Vertical drain streaks and localized splash staining.
for(let i=0;i<34;i++){
  const y=curbGrimeRnd()*1024;
  const x=4+curbGrimeRnd()*34;
  const len=18+curbGrimeRnd()*95;
  const a=.025+curbGrimeRnd()*.050;
  const grad=curbGrimeCtx.createLinearGradient(x,y,x,y+len);
  grad.addColorStop(0,'rgba(58,65,61,'+a.toFixed(3)+')');
  grad.addColorStop(1,'rgba(58,65,61,0)');
  curbGrimeCtx.strokeStyle=grad;
  curbGrimeCtx.lineWidth=.6+curbGrimeRnd()*1.6;
  curbGrimeCtx.beginPath();
  curbGrimeCtx.moveTo(x,y);
  curbGrimeCtx.lineTo(x+(curbGrimeRnd()-.5)*2,y+len);
  curbGrimeCtx.stroke();
}
for(let i=0;i<16;i++){
  const x=10+curbGrimeRnd()*55;
  const y=curbGrimeRnd()*1024;
  const rx=5+curbGrimeRnd()*20;
  const ry=10+curbGrimeRnd()*38;
  const grad=curbGrimeCtx.createRadialGradient(x,y,1,x,y,Math.max(rx,ry));
  grad.addColorStop(0,'rgba(78,83,77,'+(.025+curbGrimeRnd()*.040).toFixed(3)+')');
  grad.addColorStop(1,'rgba(78,83,77,0)');
  curbGrimeCtx.fillStyle=grad;
  curbGrimeCtx.fillRect(x-rx,y-ry,rx*2,ry*2);
}

const curbGrimeTexture=new THREE.CanvasTexture(curbGrimeCanvas);
curbGrimeTexture.colorSpace=THREE.SRGBColorSpace;
curbGrimeTexture.anisotropy=8;
const curbGrimeLayer=new THREE.Mesh(
  new THREE.PlaneGeometry(.165,91.4),
  new THREE.MeshBasicMaterial({
    map:curbGrimeTexture,
    transparent:true,
    opacity:.30,
    depthWrite:false,
    toneMapped:true
  })
);
curbGrimeLayer.position.set(-.104,.091,-4);
curbGrimeLayer.rotation.y=Math.PI/2;
curbGrimeLayer.renderOrder=3;
scene.add(curbGrimeLayer);

// Fine accumulated gutter dirt where asphalt meets the curb.
const gutterDirtCanvas=document.createElement('canvas');
gutterDirtCanvas.width=256;
gutterDirtCanvas.height=1024;
const gutterDirtCtx=gutterDirtCanvas.getContext('2d');
const gutterDirtRnd=makeSeededRandom(0x44ac19e3);
gutterDirtCtx.clearRect(0,0,256,1024);
const gutterEdgeGrad=gutterDirtCtx.createLinearGradient(0,0,256,0);
gutterEdgeGrad.addColorStop(0,'rgba(42,45,42,.19)');
gutterEdgeGrad.addColorStop(.22,'rgba(55,58,54,.095)');
gutterEdgeGrad.addColorStop(.62,'rgba(63,64,59,.025)');
gutterEdgeGrad.addColorStop(1,'rgba(63,64,59,0)');
gutterDirtCtx.fillStyle=gutterEdgeGrad;
gutterDirtCtx.fillRect(0,0,256,1024);
for(let i=0;i<120;i++){
  const y=gutterDirtRnd()*1024;
  const x=gutterDirtRnd()*120;
  const rr=.4+gutterDirtRnd()*2.8;
  gutterDirtCtx.fillStyle='rgba(61,59,51,'+(.025+gutterDirtRnd()*.060).toFixed(3)+')';
  gutterDirtCtx.beginPath();
  gutterDirtCtx.arc(x,y,rr,0,Math.PI*2);
  gutterDirtCtx.fill();
}
const gutterDirtTexture=new THREE.CanvasTexture(gutterDirtCanvas);
gutterDirtTexture.colorSpace=THREE.SRGBColorSpace;
const gutterDirt=new THREE.Mesh(
  new THREE.PlaneGeometry(.72,89.8),
  new THREE.MeshBasicMaterial({
    map:gutterDirtTexture,
    transparent:true,
    opacity:.28,
    depthWrite:false,
    toneMapped:true
  })
);
gutterDirt.rotation.x=-Math.PI/2;
gutterDirt.position.set(-.38,.028,-4);
gutterDirt.renderOrder=2;
scene.add(gutterDirt);

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
curbCap.material.roughnessMap=concreteSurface.roughness;
curbCap.material.normalMap=concreteSurface.normal;
curbCap.material.normalScale.set(.16,.16);
curbCap.material.bumpMap=concreteSurface.bump;
curbCap.material.bumpScale=.008;
curbCap.material.needsUpdate=true;

// Unique long-axis curb-top weathering. This texture spans the full street once
// so dark water pickup, rubber scuffs and pale worn zones do not repeat every
// few metres like a tiled material.
const curbTopPatinaCanvas=document.createElement('canvas');
curbTopPatinaCanvas.width=1024;
curbTopPatinaCanvas.height=96;
const curbTopPatinaCtx=curbTopPatinaCanvas.getContext('2d');
const curbTopPatinaRnd=makeSeededRandom(0x4ce381b2);
curbTopPatinaCtx.clearRect(0,0,1024,96);

for(let i=0;i<46;i++){
  const x=curbTopPatinaRnd()*1024;
  const y=12+curbTopPatinaRnd()*72;
  const rx=8+curbTopPatinaRnd()*55;
  const ry=3+curbTopPatinaRnd()*15;
  const dark=curbTopPatinaRnd()>.42;
  const grad=curbTopPatinaCtx.createRadialGradient(x,y,1,x,y,rx);
  grad.addColorStop(
    0,
    dark
      ? 'rgba(72,70,64,'+(.018+curbTopPatinaRnd()*.050).toFixed(3)+')'
      : 'rgba(240,234,219,'+(.018+curbTopPatinaRnd()*.040).toFixed(3)+')'
  );
  grad.addColorStop(1,'rgba(0,0,0,0)');
  curbTopPatinaCtx.fillStyle=grad;
  curbTopPatinaCtx.save();
  curbTopPatinaCtx.translate(x,y);
  curbTopPatinaCtx.scale(1,ry/rx);
  curbTopPatinaCtx.beginPath();
  curbTopPatinaCtx.arc(0,0,rx,0,Math.PI*2);
  curbTopPatinaCtx.fill();
  curbTopPatinaCtx.restore();
}
for(let i=0;i<28;i++){
  const x=curbTopPatinaRnd()*1024;
  const y=curbTopPatinaRnd()*96;
  const len=8+curbTopPatinaRnd()*42;
  curbTopPatinaCtx.strokeStyle='rgba(69,67,61,'+(.020+curbTopPatinaRnd()*.035).toFixed(3)+')';
  curbTopPatinaCtx.lineWidth=.35+curbTopPatinaRnd()*.75;
  curbTopPatinaCtx.beginPath();
  curbTopPatinaCtx.moveTo(x,y);
  curbTopPatinaCtx.lineTo(x+len,y+(curbTopPatinaRnd()-.5)*5);
  curbTopPatinaCtx.stroke();
}
const curbTopPatinaTexture=new THREE.CanvasTexture(curbTopPatinaCanvas);
curbTopPatinaTexture.colorSpace=THREE.SRGBColorSpace;
curbTopPatinaTexture.wrapS=curbTopPatinaTexture.wrapT=THREE.ClampToEdgeWrapping;
curbTopPatinaTexture.anisotropy=8;
const curbTopPatina=new THREE.Mesh(
  new THREE.PlaneGeometry(.25,91.5),
  new THREE.MeshBasicMaterial({
    map:curbTopPatinaTexture,
    transparent:true,
    opacity:.66,
    depthWrite:false,
    toneMapped:true
  })
);
curbTopPatina.rotation.x=-Math.PI/2;
curbTopPatina.position.set(.05,.190,-4);
curbTopPatina.renderOrder=3;
scene.add(curbTopPatina);

// A narrow rounded nose catches daylight along the curb edge. The original box
// remains the structural/collision-friendly base while this adds the missing
// masonry profile without changing world dimensions.
const curbNose=new THREE.Mesh(
  new THREE.CylinderGeometry(.028,.028,91.8,8,1,false),
  new THREE.MeshStandardMaterial({
    color:0xd8d1c5,
    roughness:.91,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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
const seamMat=new THREE.MeshBasicMaterial({color:0xbab6ad,transparent:true,opacity:.12,depthWrite:false});
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
tactile.visible=false;

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
    color:0xe2e3df,
    transparent:true,
    opacity:.68,
    alphaMap:paintWearAlphaB,
    alphaTest:.035
  })
);
edgeLine.rotation.x=-Math.PI/2;
edgeLine.position.set(-.45,.025,-4);
edgeLine.material.opacity=.26;
scene.add(edgeLine);

const focalCurbMark=new THREE.Mesh(
  new THREE.PlaneGeometry(.13,5.4),
  new THREE.MeshBasicMaterial({
    color:0xe3e3df,
    transparent:true,
    opacity:.34,
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

const roadOilMat=new THREE.MeshStandardMaterial({
  color:0xffffff,
  map:roadOilPatina.map,
  roughnessMap:roadOilPatina.roughness,
  roughness:.72,
  metalness:0,
  transparent:true,
  opacity:.60,
  depthWrite:false,
  envMapIntensity:.075
});
const roadOilLayer=new THREE.Mesh(
  new THREE.PlaneGeometry(12.8,84),
  roadOilMat
);
roadOilLayer.rotation.x=-Math.PI/2;
roadOilLayer.position.set(-6.72,.030,-4);
roadOilLayer.renderOrder=2;
scene.add(roadOilLayer);

const roadDustLayer=new THREE.Mesh(
  new THREE.PlaneGeometry(13.35,85.2),
  new THREE.MeshBasicMaterial({
    map:roadDustTexture,
    transparent:true,
    opacity:.62,
    depthWrite:false,
    toneMapped:false
  })
);
roadDustLayer.rotation.x=-Math.PI/2;
roadDustLayer.position.set(-6.62,.031,-4);
roadDustLayer.renderOrder=3;
scene.add(roadDustLayer);

const roadMoistureLayer=new THREE.Mesh(
  new THREE.PlaneGeometry(2.15,82),
  new THREE.MeshStandardMaterial({
    color:0x6b7372,
    map:roadMoistureMaps.map,
    alphaMap:roadMoistureMaps.map,
    roughnessMap:roadMoistureMaps.roughness,
    roughness:.42,
    metalness:0,
    transparent:true,
    opacity:.34,
    depthWrite:false,
    envMapIntensity:.16
  })
);
roadMoistureLayer.rotation.x=-Math.PI/2;
roadMoistureLayer.position.set(-1.02,.032,-4);
roadMoistureLayer.renderOrder=4;
scene.add(roadMoistureLayer);

const pavementPatinaMat=new THREE.MeshStandardMaterial({
  color:0xffffff,
  map:pavementPatina.map,
  roughnessMap:pavementPatina.roughness,
  roughness:.94,
  metalness:0,
  transparent:true,
  opacity:.52,
  depthWrite:false,
  envMapIntensity:.035
});
const pavementPatinaLayer=new THREE.Mesh(
  new THREE.PlaneGeometry(9.8,83),
  pavementPatinaMat
);
pavementPatinaLayer.rotation.x=-Math.PI/2;
pavementPatinaLayer.position.set(4.55,.044,-4);
pavementPatinaLayer.renderOrder=2;
scene.add(pavementPatinaLayer);

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
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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

// Legacy right-side facade pass. We keep the code for fallback/reference, but
// everything created until the modern skyline section is collected and hidden;
// the later referenceStreet is now the only visible foreground architecture.
const legacyStreetStartIndex=scene.children.length;
// Street-facing buildings: warm stone + glass + shaded shopfronts.
const rightFacade=box(3.4,7.6,66,0xb9aea0,10.15,3.75,-5,.82);
rightFacade.castShadow=false;
rightFacade.material.map=facadeSurface.map;
rightFacade.material.roughnessMap=facadeSurface.roughness;
rightFacade.material.normalMap=facadeSurface.normal;
rightFacade.material.normalScale.set(.18,.18);
rightFacade.material.aoMap=facadeSurface.ao;
rightFacade.material.aoMapIntensity=.24;
rightFacade.material.bumpMap=facadeSurface.bump;
rightFacade.material.bumpScale=.018;
rightFacade.material.envMapIntensity=.10;
rightFacade.material.needsUpdate=true;

const upperRecess=new THREE.Mesh(
  new THREE.BoxGeometry(.18,2.10,63.9),
  new THREE.MeshStandardMaterial({
    color:0xa79d91,
    roughness:.88,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
    color:0xd6cab9,
    roughness:.84,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
    color:0xb5aa9b,
    roughness:.90,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
    color:0xe0d3c2,
    roughness:.86,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
  new THREE.MeshPhysicalMaterial({
    color:0xb8aea1,
    roughness:.95,
    metalness:0,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.050,.050),
    envMapIntensity:.020,
    ior:1.44,
    specularIntensity:.34,
    clearcoat:0
  })
);
facadeBaseBand.position.set(8.36,.20,-5);
facadeBaseBand.castShadow=true;
facadeBaseBand.receiveShadow=true;
scene.add(facadeBaseBand);

const storefrontPavingMap=cloneTextureVariant(pavementGround.map,.31,.17,.42,.54,.006);
const storefrontPavingRough=cloneTextureVariant(pavementGround.roughness,.31,.17,.42,.54,.006);
const storefrontPavingNormal=cloneTextureVariant(pavementGround.normal,.31,.17,.42,.54,.006);
const storefrontPavingBump=cloneTextureVariant(pavementGround.bump,.31,.17,.42,.54,.006);
const storefrontPavingAO=cloneTextureVariant(pavementGround.ao,.31,.17,.42,.54,.006);
const storefrontPavingBand=new THREE.Mesh(
  new THREE.PlaneGeometry(.72,63.8),
  new THREE.MeshPhysicalMaterial({
    color:0xddd7cc,
    metalness:0,
    map:storefrontPavingMap,
    roughnessMap:storefrontPavingRough,
    normalMap:storefrontPavingNormal,
    normalScale:new THREE.Vector2(.020,.020),
    aoMap:storefrontPavingAO,
    aoMapIntensity:.055,
    roughness:.94,
    envMapIntensity:.026,
    ior:1.45,
    specularIntensity:.30,
    clearcoat:0
  })
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
const facadeWeatherMat=new THREE.MeshStandardMaterial({
  color:0xffffff,
  map:facadeExposureSurface.map,
  roughnessMap:facadeExposureSurface.roughness,
  roughness:.92,
  metalness:0,
  transparent:true,
  opacity:.36,
  depthWrite:false,
  envMapIntensity:.020,
  side:THREE.DoubleSide
});
const facadeWeather=new THREE.Mesh(
  new THREE.PlaneGeometry(63.6,6.75),
  facadeWeatherMat
);
facadeWeather.position.set(8.392,3.47,-5);
facadeWeather.rotation.y=-Math.PI/2;
facadeWeather.renderOrder=2;
scene.add(facadeWeather);

const facadeBasePatinaMat=new THREE.MeshStandardMaterial({
  color:0xffffff,
  map:wallBasePatina.map,
  roughnessMap:wallBasePatina.roughness,
  roughness:.96,
  metalness:0,
  transparent:true,
  opacity:.44,
  depthWrite:false,
  envMapIntensity:.025,
  side:THREE.DoubleSide
});
const facadeBasePatina=new THREE.Mesh(
  new THREE.PlaneGeometry(63.3,2.35),
  facadeBasePatinaMat
);
facadeBasePatina.position.set(8.382,1.20,-5);
facadeBasePatina.rotation.y=-Math.PI/2;
facadeBasePatina.renderOrder=2;
scene.add(facadeBasePatina);

const facadeJointOverlay=new THREE.Mesh(
  new THREE.PlaneGeometry(63.45,6.64),
  new THREE.MeshBasicMaterial({
    map:facadeJointTexture,
    transparent:true,
    opacity:.28,
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
  const zoneIndex=Math.round((z+40)*3);
  const zoneMap=cloneTextureVariant(facadeSurface.map,(zoneIndex*.137)%1,(zoneIndex*.193)%1,.72,.58,.006);
  const zoneRough=cloneTextureVariant(facadeSurface.roughness,(zoneIndex*.137)%1,(zoneIndex*.193)%1,.72,.58,.006);
  const zoneNormal=cloneTextureVariant(facadeSurface.normal,(zoneIndex*.137)%1,(zoneIndex*.193)%1,.72,.58,.006);
  const zoneBump=cloneTextureVariant(facadeSurface.bump,(zoneIndex*.137)%1,(zoneIndex*.193)%1,.72,.58,.006);
  const zone=new THREE.Mesh(
    new THREE.PlaneGeometry(width,5.82),
    new THREE.MeshStandardMaterial({
      color,
      map:zoneMap,
      roughnessMap:zoneRough,
      normalMap:zoneNormal,
      normalScale:new THREE.Vector2(.060,.060),
      bumpMap:zoneBump,
      bumpScale:.0032,
      roughness:.90,
      transparent:true,
      opacity,
      envMapIntensity:.055,
      side:THREE.DoubleSide
    })
  );
  zone.position.set(8.515,3.34,z);
  zone.rotation.y=-Math.PI/2;
  zone.receiveShadow=true;
  scene.add(zone);
  return zone;
}
createFacadeZone(-20.4,24.0,0xa9a39b,.28);
createFacadeZone(-2.7,12.4,0xc8bdad,.30);
createFacadeZone(5.1,9.6,0xb9aea1,.24);
createFacadeZone(18.1,15.0,0xa6a098,.28);

// A continuous corporate lobby skin simplifies the ground floor. The older
// cafe/shop geometry stays behind the glass as interior depth instead of
// dominating the streetscape.
const lobbyGlassMat=new THREE.MeshPhysicalMaterial({
  color:0xa3afad,
  map:glassReflectionTexture,
  roughnessMap:glassRoughnessTexture,
  roughness:.24,
  metalness:0,
  transparent:true,
  opacity:.34,
  transmission:.22,
  ior:1.50,
  thickness:.010,
  clearcoat:0,
  envMapIntensity:.60,
  side:THREE.DoubleSide
});
const lobbyFrameMat=new THREE.MeshStandardMaterial({
  color:0x59605f,
  roughness:.48,
  metalness:1,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.040,.040),
  envMapIntensity:.60
});
const lobbyGlass=new THREE.Mesh(new THREE.PlaneGeometry(55.5,3.72),lobbyGlassMat);
lobbyGlass.position.set(7.56,1.93,-3.0);
lobbyGlass.rotation.y=-Math.PI/2;
lobbyGlass.receiveShadow=true;
scene.add(lobbyGlass);

// A second, very faint pane sits behind the street-facing glass to create
// believable layered reflections and interior depth instead of one flat sheet.
const lobbyInnerGlass=new THREE.Mesh(
  new THREE.PlaneGeometry(55.1,3.54),
  new THREE.MeshPhysicalMaterial({
    color:0xb8cbcd,
    map:glassReflectionTexture,
    roughnessMap:glassRoughnessTexture,
    roughness:.24,
    metalness:0,
    transparent:true,
    opacity:.14,
    transmission:.05,
    envMapIntensity:.54,
    depthWrite:false,
    side:THREE.DoubleSide
  })
);
lobbyInnerGlass.position.set(7.78,1.91,-3.0);
lobbyInnerGlass.rotation.y=-Math.PI/2;
scene.add(lobbyInnerGlass);

// Alternating low-opacity floor shadows make the long facade read as occupied
// office space rather than a single empty showroom.
for(let z=-28.5,bandIndex=0;z<=22.5;z+=5.3,bandIndex++){
  const interiorBand=new THREE.Mesh(
    new THREE.PlaneGeometry(4.45,2.85),
    new THREE.MeshBasicMaterial({
      color:bandIndex%2?0x7f9396:0x9aa9aa,
      transparent:true,
      opacity:bandIndex%2?.055:.035,
      depthWrite:false,
      toneMapped:false
    })
  );
  interiorBand.position.set(7.92,1.92,z);
  interiorBand.rotation.y=-Math.PI/2;
  scene.add(interiorBand);
}

for(let z=-29.5;z<=23.5;z+=2.65){
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.055,3.78,.050),lobbyFrameMat);
  mullion.position.set(7.52,1.93,z);
  mullion.castShadow=true;
  scene.add(mullion);
}
[.18,3.76].forEach(y=>{
  const rail=new THREE.Mesh(new THREE.BoxGeometry(.060,.060,55.6),lobbyFrameMat);
  rail.position.set(7.52,y,-3.0);
  rail.castShadow=true;
  scene.add(rail);
});
const lobbyCanopy=new THREE.Mesh(
  new THREE.BoxGeometry(1.30,.12,55.4),
  new THREE.MeshStandardMaterial({
    color:0x8f8c85,
    roughness:.58,
    metalness:.18,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.08,.08),
    bumpMap:metalSurface.bump,
    bumpScale:.002,
    envMapIntensity:.54
  })
);
lobbyCanopy.position.set(7.10,3.86,-3.0);
lobbyCanopy.castShadow=true;
scene.add(lobbyCanopy);

// Dominant reference-style office street wall. This sits just in front of the
// earlier mixed facade so the first read is clean glass, stone piers and deep
// recessed entries rather than many small storefront objects.
const heroGlassMat=new THREE.MeshPhysicalMaterial({
  color:0xa4b0ae,
  map:glassReflectionTexture,
  roughnessMap:glassRoughnessTexture,
  roughness:.23,
  metalness:0,
  transparent:true,
  opacity:.35,
  transmission:.22,
  ior:1.50,
  thickness:.012,
  clearcoat:0,
  envMapIntensity:.72,
  side:THREE.DoubleSide
});
const heroPierMap=cloneTextureVariant(fineConcreteSurface.map,.17,.09,.22,.18,.004);
const heroPierRough=cloneTextureVariant(fineConcreteSurface.roughness,.17,.09,.22,.18,.004);
const heroPierNormal=cloneTextureVariant(fineConcreteSurface.normal,.17,.09,.22,.18,.004);
const heroPierMat=new THREE.MeshPhysicalMaterial({
  color:0xc0b5a6,
  roughness:.90,
  metalness:0,
  map:heroPierMap,
  roughnessMap:heroPierRough,
  normalMap:heroPierNormal,
  normalScale:new THREE.Vector2(.040,.040),
  envMapIntensity:.034,
  ior:1.45,
  specularIntensity:.38,
  clearcoat:0
});
const heroFrameMat=new THREE.MeshStandardMaterial({
  color:0x59605f,
  roughness:.46,
  metalness:1,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.036,.036),
  envMapIntensity:.62
});

[-23.5,-11.5,.8,13.1].forEach((z,bayIndex)=>{
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(10.6,8.05),heroGlassMat.clone());
  glass.material.color.offsetHSL(0,0,(bayIndex-1.5)*.012);
  glass.material.opacity=.40+(bayIndex%3)*.025;
  glass.material.roughness=.13+(bayIndex%2)*.035;
  glass.material.envMapIntensity=.94+(bayIndex%2)*.11;
  if(bayIndex===2){
    glass.material.color.set(0xaab5b2);
    glass.material.opacity=.36;
    glass.material.roughness=.21;
    glass.material.envMapIntensity=.82;
    glass.material.clearcoat=0;
  }
  glass.position.set(7.34,5.60,z);
  glass.rotation.y=-Math.PI/2;
  glass.receiveShadow=true;
  scene.add(glass);

  [2.82,5.62].forEach((y,shadowIndex)=>{
    const shadowBand=new THREE.Mesh(
      new THREE.PlaneGeometry(10.15,.58),
      new THREE.MeshBasicMaterial({
        color:shadowIndex%2?0x71878a:0x85999b,
        transparent:true,
        opacity:.035+(bayIndex%2)*.010,
        depthWrite:false,
        toneMapped:false
      })
    );
    shadowBand.position.set(7.325,y,z);
    shadowBand.rotation.y=-Math.PI/2;
    scene.add(shadowBand);
  });

  for(let dz=-4.0;dz<=4.0;dz+=2.0){
    const mullion=new THREE.Mesh(new THREE.BoxGeometry(.050,8.05,.045),heroFrameMat);
    mullion.position.set(7.30,5.60,z+dz);
    mullion.castShadow=true;
    scene.add(mullion);
  }
  [2.05,3.48,4.91,6.34,7.77,9.20].forEach(y=>{
    const rail=new THREE.Mesh(new THREE.BoxGeometry(.055,.045,10.45),heroFrameMat);
    rail.position.set(7.30,y,z);
    scene.add(rail);
  });
});

[-29.2,-17.5,-5.4,6.9,19.0].forEach((z,index)=>{
  const pierMat=makeMaterialPhaseVariant(heroPierMat,index,.015);
  pierMat.roughness=THREE.MathUtils.clamp(.80+(index%3)*.025,.80,.85);
  const pier=new THREE.Mesh(new THREE.BoxGeometry(.72,9.70,.88),pierMat);
  pier.position.set(7.38,4.90,z);
  pier.castShadow=true;
  pier.receiveShadow=true;
  scene.add(pier);

  // Caps are separate cast/cladding pieces, so shift the texture phase again
  // while keeping all PBR channels registered to one another.
  const capMat=makeMaterialPhaseVariant(heroPierMat,index+11,-.010);
  capMat.roughness=.83+(index%2)*.025;
  const cap=new THREE.Mesh(new THREE.BoxGeometry(1.08,.16,1.10),capMat);
  cap.position.set(7.30,9.80,z);
  cap.castShadow=true;
  scene.add(cap);
});

// Deep, dark entry recesses are the main ground-level accents.
[-11.5,13.0].forEach(z=>{
  const recess=new THREE.Mesh(
    new THREE.PlaneGeometry(3.45,3.05),
    new THREE.MeshBasicMaterial({color:0x374244,transparent:true,opacity:.64})
  );
  recess.position.set(7.26,1.72,z);
  recess.rotation.y=-Math.PI/2;
  scene.add(recess);

  const portal=new THREE.Mesh(new THREE.BoxGeometry(.42,3.55,3.95),heroFrameMat);
  portal.position.set(7.12,1.90,z);
  portal.castShadow=true;
  scene.add(portal);
});

const facadeRibMat=new THREE.MeshStandardMaterial({
  color:0xa79b8d,
  roughness:.87,
  map:facadeSurface.map,
  roughnessMap:facadeSurface.roughness,
  normalMap:facadeSurface.normal,
  normalScale:new THREE.Vector2(.18,.18),
  bumpMap:facadeSurface.bump,
  bumpScale:.012
});
[-34.2,-27.0,-18.9,-11.2,-3.7,4.1,12.4,20.7,27.3].forEach((z,i)=>{
  const ribWidth=i===4||i===5?.26:.18;
  const ribMat=makeMaterialPhaseVariant(facadeRibMat,i+23,.020);
  ribMat.color.offsetHSL(0,0,((i%4)-1.5)*.006);
  ribMat.roughness=.85+(i%3)*.018;
  const rib=new THREE.Mesh(new THREE.BoxGeometry(.20,5.82,ribWidth),ribMat);
  rib.position.set(8.42,3.32,z);
  rib.castShadow=true;
  rib.receiveShadow=true;
  scene.add(rib);
});

const balconyStone=new THREE.MeshStandardMaterial({
  color:0xb6a793,
  roughness:.90,
  map:concreteSurface.map,
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
  bumpMap:concreteSurface.bump,
  bumpScale:.010
});
const balconyGreenMats=[
  new THREE.MeshStandardMaterial({
    color:0x586f53,roughness:.93,map:foliageSurface.map,bumpMap:foliageSurface.bump,bumpScale:.008
  }),
  new THREE.MeshStandardMaterial({
    color:0x708267,roughness:.91,map:foliageSurface.map,bumpMap:foliageSurface.bump,bumpScale:.008
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
        roughnessMap:concreteSurface.roughness,
        normalMap:concreteSurface.normal,
        normalScale:new THREE.Vector2(.22,.22),
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
  const bayTone=z<-7?0xbec7c5:(z>10?0xc8cdca:0xc7c8c3);
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

  const glassTint=z<-7?0xaecbd0:(z>10?0xb9ced0:0xa9c8cf);
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
    color:z<-7?0x6f7a7b:(z>10?0x778181:0x727b7c),
    roughness:.44,
    metalness:.30,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
      roughnessMap:concreteSurface.roughness,
      normalMap:concreteSurface.normal,
      normalScale:new THREE.Vector2(.22,.22),
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
  const canopyTone=z<-7?0xe1e6e3:(z>10?0xd9ddda:0xe6e6e1);
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
  roughness:.93,
  map:limestoneSurface.map,
  roughnessMap:limestoneEdgeRoughness,
  normalMap:limestoneSurface.normal,
  normalScale:new THREE.Vector2(.14,.14),
  bumpMap:limestoneSurface.bump,
  bumpScale:.008,
  envMapIntensity:.045
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
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
      roughness:.30,
      metalness:.60,
      map:metalSurface.map,
      roughnessMap:metalTouchRoughness,
      normalMap:metalSurface.normal,
      normalScale:new THREE.Vector2(.10,.10),
      bumpMap:metalSurface.bump,
      bumpScale:.0025,
      envMapIntensity:.96
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
        map:metalSurface.map,
        roughnessMap:metalSurface.roughness,
        normalMap:metalSurface.normal,
        normalScale:new THREE.Vector2(.10,.10),
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
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
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
    roughnessMap:woodSurface.roughness,
    normalMap:woodSurface.normal,
    normalScale:new THREE.Vector2(.20,.20),
    bumpMap:woodSurface.bump,
    bumpScale:.010,
    envMapIntensity:.14
  });

  const interiorWallMat=new THREE.MeshStandardMaterial({
    color:warm?0xe2d3c2:0xd8dfd8,
    roughness:.94,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
    bumpMap:concreteSurface.bump,
    bumpScale:.006,
    envMapIntensity:.04
  });
  const interiorFloorMat=new THREE.MeshStandardMaterial({
    color:warm?0xc8b39c:0xbac3b9,
    roughness:.92,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
        makeDisplayMaterial('ceramic',0xd6b39a),
        makeDisplayMaterial('leather',0x8a6f62),
        makeDisplayMaterial('paper',0xe4d7c5)
      ]
    : [
        makeDisplayMaterial('ceramic',0x829a86),
        makeDisplayMaterial('paper',0xd9d7c9),
        makeDisplayMaterial('leather',0x66746d)
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
const cafeFrame=box(.48,3.0,8.5,0x9ea5a3,8.33,1.55,4.8,.86);
cafeFrame.castShadow=false;
cafeFrame.material=new THREE.MeshPhysicalMaterial({
  color:0xb7afa4,
  roughness:.93,
  metalness:0,
  map:cloneTextureVariant(sandstoneSurface.map,.36,.18,.42,.48,.004),
  roughnessMap:cloneTextureVariant(sandstoneSurface.roughness,.36,.18,.42,.48,.004),
  normalMap:cloneTextureVariant(sandstoneSurface.normal,.36,.18,.42,.48,.004),
  normalScale:new THREE.Vector2(.050,.050),
  envMapIntensity:.026,
  ior:1.45,
  specularIntensity:.34,
  clearcoat:0
});
const cafeGlass=glassPanel(7.75,2.55,8.05,1.62,4.8,-Math.PI/2,0xc3d8d7);
cafeGlass.material.opacity=.48;
cafeGlass.material.roughness=.31;
addGlassEdgeDirt(7.75,2.55,8.044,1.62,4.8,-Math.PI/2,.36);

const cafeMullionMat=new THREE.MeshStandardMaterial({
  color:0x69716f,
  roughness:.50,
  metalness:1,
  map:coatedMetalSurface.map,
  roughnessMap:coatedMetalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.030,.030),
  envMapIntensity:.56
});
[2.15,3.80,5.45,7.10].forEach(z=>{
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.055,2.42,.045),cafeMullionMat);
  mullion.position.set(7.96,1.64,z);
  mullion.castShadow=true;
  scene.add(mullion);
});

const cafeDoorFrame=new THREE.MeshStandardMaterial({
  color:0x69716f,
  roughness:.52,
  metalness:1,
  map:coatedMetalSurface.map,
  roughnessMap:coatedMetalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.028,.028),
  envMapIntensity:.52
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
cafeDoorGlass.material.opacity=.36;
cafeDoorGlass.material.roughness=.35;
addGlassEdgeDirt(.88,2.28,7.904,1.58,2.20,-Math.PI/2,.18);

const cafeDoorSealMat=new THREE.MeshStandardMaterial({
  color:0x303432,
  roughness:.90,
  metalness:0,
  envMapIntensity:.02
});
[
  [7.895,1.58,1.755,.028,2.20,.025],
  [7.895,1.58,2.645,.028,2.20,.025],
  [7.895,2.67,2.20,.028,.025,.91]
].forEach(([x,y,z,w,h,d])=>{
  const seal=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),cafeDoorSealMat);
  seal.position.set(x,y,z);
  scene.add(seal);
});

const cafeThreshold=new THREE.Mesh(
  makeBeveledBoxGeometry(.34,.045,1.02,.007),
  new THREE.MeshStandardMaterial({
    color:0xb0aaa2,
    roughness:.68,
    metalness:1,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.030,.030),
    envMapIntensity:.42
  })
);
cafeThreshold.position.set(7.73,.075,2.20);
cafeThreshold.castShadow=true;
scene.add(cafeThreshold);

const cafeDoorRevealMat=new THREE.MeshStandardMaterial({
  color:0xb8aa9a,
  roughness:.90,
  map:fineConcreteSurface.map,
  roughnessMap:fineConcreteSurface.roughness,
  normalMap:fineConcreteSurface.normal,
  normalScale:new THREE.Vector2(.075,.075),
  bumpMap:fineConcreteSurface.bump,
  bumpScale:.0035,
  envMapIntensity:.04
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
    color:0xb8bfbd,
    roughness:.38,
    metalness:1,
    map:metalSurface.map,
    roughnessMap:metalTouchRoughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.032,.032),
    envMapIntensity:.66
  })
);
cafeDoorHandle.rotation.z=Math.PI/2;
cafeDoorHandle.position.set(7.84,1.52,2.48);
cafeDoorHandle.castShadow=true;
scene.add(cafeDoorHandle);

const cafeInteriorGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(7.25,2.18),
  new THREE.MeshBasicMaterial({
    color:0xdfe8e7,
    transparent:true,
    opacity:.10,
    depthWrite:false,
    toneMapped:false
  })
);
cafeInteriorGlow.position.set(8.13,1.55,4.8);
cafeInteriorGlow.rotation.y=-Math.PI/2;
scene.add(cafeInteriorGlow);

const cafeInteriorShellMat=new THREE.MeshPhysicalMaterial({
  color:0xd8ddda,
  roughness:.95,
  metalness:0,
  map:cloneTextureVariant(concreteSurface.map,.14,.08,.26,.34,.003),
  roughnessMap:cloneTextureVariant(concreteSurface.roughness,.14,.08,.26,.34,.003),
  normalMap:cloneTextureVariant(concreteSurface.normal,.14,.08,.26,.34,.003),
  normalScale:new THREE.Vector2(.042,.042),
  envMapIntensity:.022,
  ior:1.44,
  specularIntensity:.30,
  clearcoat:0
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
  new THREE.MeshPhysicalMaterial({
    color:0xb7a996,
    roughness:.93,
    metalness:0,
    map:cloneTextureVariant(concreteSurface.map,.21,.11,.24,.40,.004),
    roughnessMap:cloneTextureVariant(concreteSurface.roughness,.21,.11,.24,.40,.004),
    normalMap:cloneTextureVariant(concreteSurface.normal,.21,.11,.24,.40,.004),
    normalScale:new THREE.Vector2(.040,.040),
    envMapIntensity:.024,
    ior:1.45,
    specularIntensity:.28,
    clearcoat:0
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
  sheen:.42,
  sheenColor:new THREE.Color(0xfff1dc),
  sheenRoughness:.96,
  envMapIntensity:.10
});
const awningApricotMap=cloneTextureVariant(fabricColorTexture,.16,.04,1.03,.98);
const awningApricot=new THREE.MeshPhysicalMaterial({
  color:0xd8aa86,
  roughness:.89,
  metalness:0,
  map:awningApricotMap,
  bumpMap:fabricMicroBump,
  bumpScale:.007,
  sheen:.38,
  sheenColor:new THREE.Color(0xf4c9a8),
  sheenRoughness:.95,
  envMapIntensity:.09
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
  metalness:.72,
  metalnessMap:coatedMetalSurface.metalness,
  map:coatedMetalSurface.map,
  roughnessMap:coatedMetalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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
  roughnessMap:woodSurface.roughness,
  normalMap:woodSurface.normal,
  normalScale:new THREE.Vector2(.20,.20),
  bumpMap:woodSurface.bump,
  bumpScale:.018
});
const cafeInteriorWarm=new THREE.MeshPhysicalMaterial({
  color:0xe8d9c5,
  roughness:.93,
  metalness:0,
  map:cloneTextureVariant(concreteSurface.map,.29,.15,.28,.36,.003),
  roughnessMap:cloneTextureVariant(concreteSurface.roughness,.29,.15,.28,.36,.003),
  normalMap:cloneTextureVariant(concreteSurface.normal,.29,.15,.28,.36,.003),
  normalScale:new THREE.Vector2(.045,.045),
  envMapIntensity:.024,
  ior:1.44,
  specularIntensity:.30,
  clearcoat:0
});
const cafeCounter=new THREE.Mesh(new THREE.BoxGeometry(.32,.86,5.30),cafeInteriorWood);
cafeCounter.position.set(8.18,.72,4.85);
cafeCounter.castShadow=true;
scene.add(cafeCounter);

const cafeCounterTop=new THREE.Mesh(
  new THREE.BoxGeometry(.40,.055,5.42),
  new THREE.MeshPhysicalMaterial({
    color:0x735f50,
    roughness:.84,
    metalness:0,
    map:woodSurface.map,
    roughnessMap:cafeWoodFinishRoughness,
    normalMap:woodSurface.normal,
    normalScale:new THREE.Vector2(.070,.070),
    envMapIntensity:.060,
    ior:1.46,
    specularIntensity:.32,
    clearcoat:.008,
    clearcoatRoughness:.90
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

const cafeBenchMat=new THREE.MeshPhysicalMaterial({
  color:0xb69b82,
  roughness:.91,
  metalness:0,
  map:woodSurface.map,
  roughnessMap:cafeWoodFinishRoughness,
  normalMap:woodSurface.normal,
  normalScale:new THREE.Vector2(.060,.060),
  clearcoat:.006,
  clearcoatRoughness:.92,
  envMapIntensity:.050,
  ior:1.46,
  specularIntensity:.30
});
if('anisotropy' in cafeBenchMat){
  cafeBenchMat.anisotropy=.07;
  cafeBenchMat.anisotropyRotation=0;
}

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
    roughness:.92,
    roughnessMap:clothRoughnessTexture,
    metalness:0,
    bumpMap:fabricMicroBump,
    bumpScale:.004,
    sheen:.10,
    sheenColor:new THREE.Color(0xd8c1aa),
    sheenRoughness:.98,
    clearcoat:0,
    envMapIntensity:.045,
    specularIntensity:.18
  })
);
cafeBenchCushion.position.set(8.00,.66,6.25);
cafeBenchCushion.castShadow=true;
scene.add(cafeBenchCushion);

const cafeSmallTableMat=new THREE.MeshPhysicalMaterial({
  color:0xc9aa88,
  roughness:.90,
  metalness:0,
  map:woodSurface.map,
  roughnessMap:cafeWoodFinishRoughness,
  normalMap:woodSurface.normal,
  normalScale:new THREE.Vector2(.070,.070),
  clearcoat:.008,
  clearcoatRoughness:.90,
  envMapIntensity:.055,
  ior:1.46,
  specularIntensity:.32
});
if('anisotropy' in cafeSmallTableMat){
  cafeSmallTableMat.anisotropy=.10;
  cafeSmallTableMat.anisotropyRotation=0;
}

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
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
        map:metalSurface.map,
        roughnessMap:metalSurface.roughness,
        normalMap:metalSurface.normal,
        normalScale:new THREE.Vector2(.10,.10),
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

const legacyStreet=new THREE.Group();
legacyStreet.name='legacy-right-street-hidden';
const legacyStreetChildren=scene.children.slice(legacyStreetStartIndex);
legacyStreetChildren.forEach(child=>legacyStreet.add(child));
legacyStreet.visible=false;
scene.add(legacyStreet);

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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
      roughnessMap:concreteSurface.roughness,
      normalMap:concreteSurface.normal,
      normalScale:new THREE.Vector2(.22,.22),
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

createGlassTower(-17.8,-4.8,5.6,8.0,27.0,0xa7c6cf);
createGlassTower(-19.4,16.2,5.8,7.4,23.5,0xb6ced4);
createGlassTower(-18.6,-27.5,5.2,8.2,31.0,0xa2bfca);

// Reference-style office crowns: slim blue-grey glass volumes with charcoal
// mullions rise behind the lower retail frontage. This gives the first-person
// view the clean business-district silhouette from the reference without
// changing the playable footprint.
function createModernOfficeSlab(z,h,d,tint){
  const x=12.25;
  const glassMat=new THREE.MeshPhysicalMaterial({
    color:tint,
    map:glassReflectionTexture,
    roughnessMap:glassRoughnessTexture,
    roughness:.20,
    metalness:.025,
    transparent:true,
    opacity:.54,
    transmission:.10,
    ior:1.48,
    clearcoat:.24,
    clearcoatRoughness:.22,
    envMapIntensity:.88
  });
  const body=new THREE.Mesh(new THREE.BoxGeometry(4.15,h,d),glassMat);
  body.position.set(x,7.55+h*.5,z);
  body.receiveShadow=true;
  scene.add(body);

  const facadeHighlightMat=new THREE.MeshBasicMaterial({
    color:0xe5f0f1,
    transparent:true,
    opacity:.035,
    depthWrite:false,
    toneMapped:false
  });
  [-1.22,-.40,.42,1.24].forEach((ox,panelIndex)=>{
    const highlight=new THREE.Mesh(
      new THREE.PlaneGeometry(d*.86,h*.94),
      facadeHighlightMat.clone()
    );
    highlight.material.opacity=.022+(panelIndex%3)*.010;
    highlight.position.set(x-2.081,7.55+h*.51,z+ox*.12);
    highlight.rotation.y=Math.PI/2;
    scene.add(highlight);
  });

  const frameMat=new THREE.MeshStandardMaterial({
    color:0x535d60,
    roughness:.40,
    metalness:.38,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.08,.08),
    bumpMap:metalSurface.bump,
    bumpScale:.0025,
    envMapIntensity:.84
  });

  [-1.62,-.82,0,.82,1.62].forEach(ox=>{
    const fin=new THREE.Mesh(new THREE.BoxGeometry(.055,h-.12,d+.05),frameMat);
    fin.position.set(x+ox,7.55+h*.5,z);
    fin.castShadow=true;
    scene.add(fin);
  });
  for(let y=8.45;y<7.55+h-.35;y+=1.42){
    const band=new THREE.Mesh(new THREE.BoxGeometry(4.24,.045,d+.06),frameMat);
    band.position.set(x,y,z);
    scene.add(band);
  }

  const cap=new THREE.Mesh(new THREE.BoxGeometry(4.34,.18,d+.18),frameMat);
  cap.position.set(x,7.55+h+.09,z);
  cap.castShadow=true;
  scene.add(cap);
}

createModernOfficeSlab(-22.5,15.4,14.5,0x91b4bd);
createModernOfficeSlab(-5.0,19.6,15.2,0x98bbc3);
createModernOfficeSlab(14.8,17.8,15.4,0x9ebbc1);

// A continuous dark spandrel ribbon visually ties the three masses together,
// reading as one contemporary office complex rather than separate game props.
const officeSpandrelMat=new THREE.MeshStandardMaterial({
  color:0x596365,
  roughness:.43,
  metalness:.34,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.08,.08),
  bumpMap:metalSurface.bump,
  bumpScale:.002,
  envMapIntensity:.82
});
for(let z=-31;z<=24;z+=3.4){
  const ribbon=new THREE.Mesh(new THREE.BoxGeometry(.10,.19,3.18),officeSpandrelMat);
  ribbon.position.set(8.18,6.62,z);
  ribbon.castShadow=true;
  scene.add(ribbon);
}

// Low-detail buildings continue beyond the playable road. Their desaturated
// palette and reduced contrast keep them atmospheric while giving the street a
// real vanishing corridor rather than a visible world boundary.
const distantBlockPalette=[0xcfd6d3,0xd8d8d2,0xcbd4d1,0xdedbd4];
[
  [-15.2,-61,6.2,8.8,17.8],
  [-14.8,-72,6.4,7.6,22.0],
  [8.8,-61,5.4,8.0,16.4],
  [9.6,-71,5.8,7.2,20.0],
  [9.1,-80,5.5,6.8,18.6]
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

  if(index%2===0){
    const setback=new THREE.Mesh(
      new THREE.BoxGeometry(w*.72,1.25,d*.68),
      new THREE.MeshStandardMaterial({
        color:0xbcc6c4,
        roughness:.86,
        envMapIntensity:.04
      })
    );
    setback.position.set(x+(index%3-.8)*.18,h+.78,z+(index%2?.15:-.10));
    scene.add(setback);
  }else{
    const roofScreen=new THREE.Mesh(
      new THREE.BoxGeometry(w*.46,.52,d*.44),
      new THREE.MeshStandardMaterial({
        color:0xaeb9b8,
        roughness:.72,
        metalness:.08,
        envMapIntensity:.12
      })
    );
    roofScreen.position.set(x-.14,h+.41,z+.08);
    scene.add(roofScreen);
  }

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

// Secondary skyline rows deepen the vanishing point without adding foreground
// clutter. These stay pale and low-contrast so they read through atmospheric fog.
[
  [-16.8,-91,5.4,8.0,13.2],
  [-14.9,-103,5.8,7.4,15.8],
  [10.2,-91,5.1,7.6,12.6],
  [11.0,-103,5.5,7.0,16.4]
].forEach(([x,z,w,d,h],index)=>{
  const block=new THREE.Mesh(
    new THREE.BoxGeometry(w,h,d),
    new THREE.MeshStandardMaterial({
      color:index%2?0xc7d0cf:0xbfc9c9,
      roughness:.88,
      metalness:.01,
      envMapIntensity:.04
    })
  );
  block.position.set(x,h*.5,z);
  scene.add(block);

  for(let y=1.8;y<h-1.0;y+=1.7){
    const windows=new THREE.Mesh(
      new THREE.PlaneGeometry(d*.68,.26),
      new THREE.MeshBasicMaterial({
        color:0xa9bec1,
        transparent:true,
        opacity:.20,
        toneMapped:false
      })
    );
    windows.position.set(x-(w*.5+.006),y,z);
    windows.rotation.y=Math.PI/2;
    scene.add(windows);
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


// Layered atmospheric cards compress distant contrast before the global fog
// takes over, approximating the pale urban air visible in real daytime streets.
// ---------- photographic set extension ----------
// The playable block remains fully 3D, but the last 25-30m of the view uses
// compressed real photography. This is the same technique used on film sets:
// nearby geometry supplies parallax and interaction, while distant detail no
// longer exposes low-poly boxes and repeated procedural windows.
let photographicSetExtensionStarted=false;
const photographicSetExtensionGroup=new THREE.Group();
photographicSetExtensionGroup.name='photographic-set-extension';
scene.add(photographicSetExtensionGroup);

function makeSetExtensionMask(width=512,height=512){
  const canvas=document.createElement('canvas');
  canvas.width=width;
  canvas.height=height;
  const g=canvas.getContext('2d');
  const image=g.createImageData(width,height);
  const d=image.data;
  for(let y=0;y<height;y++){
    const v=y/(height-1);
    const bottom=THREE.MathUtils.smoothstep(v,.04,.22);
    const top=1-THREE.MathUtils.smoothstep(v,.91,1);
    for(let x=0;x<width;x++){
      const u=x/(width-1);
      const edge=Math.min(
        THREE.MathUtils.smoothstep(u,.02,.15),
        1-THREE.MathUtils.smoothstep(u,.85,.98)
      );
      const a=Math.max(0,Math.min(1,edge*bottom*top));
      const i=(y*width+x)*4;
      d[i]=d[i+1]=d[i+2]=255;
      d[i+3]=Math.round(a*255);
    }
  }
  g.putImageData(image,0,0);
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
  return texture;
}

const photographicSetMask=makeSetExtensionMask();

function installPhotographicSetExtensions(){
  if(photographicSetExtensionStarted) return;
  photographicSetExtensionStarted=true;

  const loader=new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');

  const farUrl='https://images.pexels.com/photos/4947391/pexels-photo-4947391.jpeg?auto=compress&cs=tinysrgb&w=900';
  loader.load(farUrl,texture=>{
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearMipmapLinearFilter;
    texture.magFilter=THREE.LinearFilter;
    texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy?.()||1,4);

    const material=new THREE.MeshBasicMaterial({
      map:texture,
      alphaMap:photographicSetMask,
      transparent:true,
      opacity:.82,
      depthWrite:false,
      fog:true,
      toneMapped:true,
      side:THREE.DoubleSide
    });
    const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(46,27),material);
    backdrop.position.set(-2.0,11.2,-91.5);
    backdrop.renderOrder=-2;
    photographicSetExtensionGroup.add(backdrop);
  },undefined,error=>{
    console.warn('Far photographic set extension failed.',error);
  });

}

const refHazeMaterialA=new THREE.MeshBasicMaterial({
  color:0xdce7e7,
  transparent:true,
  opacity:.055,
  depthWrite:false,
  side:THREE.DoubleSide,
  toneMapped:true
});
const refHazeMaterialB=new THREE.MeshBasicMaterial({
  color:0xe5ecea,
  transparent:true,
  opacity:.085,
  depthWrite:false,
  side:THREE.DoubleSide,
  toneMapped:true
});
[
  [-45,22,17,refHazeMaterialA],
  [-58,25,18,refHazeMaterialA],
  [-72,30,20,refHazeMaterialB],
  [-88,34,22,refHazeMaterialB]
].forEach(([z,w,h,mat])=>{
  const haze=new THREE.Mesh(new THREE.PlaneGeometry(w,h),mat);
  haze.position.set(-2.0,h*.48,z);
  haze.rotation.y=0;
  haze.renderOrder=20;
  scene.add(haze);
});

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
        roughnessMap:concreteSurface.roughness,
        normalMap:concreteSurface.normal,
        normalScale:new THREE.Vector2(.22,.22),
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
        map:metalSurface.map,
        roughnessMap:metalSurface.roughness,
        normalMap:metalSurface.normal,
        normalScale:new THREE.Vector2(.10,.10),
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
        roughnessMap:facadeSurface.roughness,
        normalMap:facadeSurface.normal,
        normalScale:new THREE.Vector2(.18,.18),
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


/* ---------- reference street architecture reset ----------
   Dedicated PBR-style procedural maps are used here instead of stretching the
   older generic materials across the dominant facade. The goal is photographic
   scale: low-frequency stone variation, readable glass reflections and large
   concrete paving rather than visible noise/repetition. */
const refStreet=new THREE.Group();
refStreet.name='reference-street-reset';
scene.add(refStreet);

function makeReferenceStoneMaps(seed){
  const size=512;
  const color=document.createElement('canvas');
  const height=document.createElement('canvas');
  const rough=document.createElement('canvas');
  color.width=color.height=height.width=height.height=rough.width=rough.height=size;
  const g=color.getContext('2d');
  const h=height.getContext('2d');
  const r=rough.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#d6d6d1';
  g.fillRect(0,0,size,size);
  h.fillStyle='#808080';
  h.fillRect(0,0,size,size);
  r.fillStyle='#c9c9c9';
  r.fillRect(0,0,size,size);

  // Large, extremely subtle tonal clouds are more believable on commercial
  // facade stone than high-frequency procedural speckle.
  for(let i=0;i<32;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=42+rnd()*120;
    const warm=rnd()>.52;
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    grad.addColorStop(
      0,
      warm
        ? 'rgba(196,190,179,'+(.025+rnd()*.040).toFixed(3)+')'
        : 'rgba(171,181,181,'+(.020+rnd()*.034).toFixed(3)+')'
    );
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);

    const rv=184+Math.floor(rnd()*45);
    const rg=r.createRadialGradient(x,y,0,x,y,radius);
    rg.addColorStop(0,'rgba('+rv+','+rv+','+rv+','+(.05+rnd()*.10).toFixed(3)+')');
    rg.addColorStop(1,'rgba('+rv+','+rv+','+rv+',0)');
    r.fillStyle=rg;
    r.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  // Fine pores stay nearly invisible until the camera gets close.
  for(let i=0;i<1700;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rr=.22+rnd()*.72;
    const dark=rnd()>.58;
    g.fillStyle=dark
      ? 'rgba(103,105,101,'+(.010+rnd()*.022).toFixed(3)+')'
      : 'rgba(250,247,237,'+(.008+rnd()*.020).toFixed(3)+')';
    g.beginPath();
    g.arc(x,y,rr,0,Math.PI*2);
    g.fill();

    const hv=dark?114+Math.floor(rnd()*10):139+Math.floor(rnd()*10);
    h.fillStyle='rgba('+hv+','+hv+','+hv+','+(.20+rnd()*.30).toFixed(3)+')';
    h.beginPath();
    h.arc(x,y,Math.max(.22,rr*.65),0,Math.PI*2);
    h.fill();
  }

  // A handful of very faint mineral streaks break the computer-generated
  // uniformity without making the facade look like marble.
  for(let i=0;i<13;i++){
    const y=rnd()*size;
    const x=-40+rnd()*220;
    const len=260+rnd()*360;
    g.strokeStyle='rgba(112,108,99,'+(.010+rnd()*.014).toFixed(3)+')';
    g.lineWidth=.35+rnd()*.55;
    g.beginPath();
    g.moveTo(x,y);
    g.bezierCurveTo(
      x+len*.30,y+(rnd()-.5)*18,
      x+len*.68,y+(rnd()-.5)*23,
      x+len,y+(rnd()-.5)*14
    );
    g.stroke();
  }

  // Slight vertical weathering near panel bottoms.
  for(let i=0;i<12;i++){
    const x=rnd()*size;
    const y=310+rnd()*185;
    const len=25+rnd()*95;
    const grad=g.createLinearGradient(x,y,x,y+len);
    grad.addColorStop(0,'rgba(112,120,116,'+(.010+rnd()*.018).toFixed(3)+')');
    grad.addColorStop(1,'rgba(112,120,116,0)');
    g.strokeStyle=grad;
    g.lineWidth=.5+rnd()*1.15;
    g.beginPath();
    g.moveTo(x,y);
    g.lineTo(x+(rnd()-.5)*2,y+len);
    g.stroke();
  }

  const map=new THREE.CanvasTexture(color);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(1.25,3.0);
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(height);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.repeat.copy(map.repeat);
  bump.anisotropy=8;

  const roughness=new THREE.CanvasTexture(rough);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.repeat.copy(map.repeat);
  roughness.anisotropy=8;

  const normal=makeNormalTextureFromHeight(height,1.35);
  normal.repeat.copy(map.repeat);
  return {map,bump,roughness,normal};
}

function makeReferenceGlassMaps(seed){
  const w=1024;
  const h=384;
  const color=document.createElement('canvas');
  const rough=document.createElement('canvas');
  color.width=rough.width=w;
  color.height=rough.height=h;
  const g=color.getContext('2d');
  const r=rough.getContext('2d');
  const rnd=makeSeededRandom(seed);

  // Real city glass reads mostly from what it reflects: pale sky above, darker
  // opposite buildings/trees below, plus imperfect pane-to-pane variation.
  const sky=g.createLinearGradient(0,0,0,h);
  sky.addColorStop(0,'#aec8d0');
  sky.addColorStop(.27,'#9eb8bf');
  sky.addColorStop(.52,'#879fa5');
  sky.addColorStop(.70,'#74888a');
  sky.addColorStop(1,'#596a68');
  g.fillStyle=sky;
  g.fillRect(0,0,w,h);

  // Soft opposing-building bands.
  for(let i=0;i<15;i++){
    const x=i*(w/15)-20+rnd()*24;
    const bw=38+rnd()*58;
    const top=80+rnd()*90;
    const shade=80+Math.floor(rnd()*35);
    g.fillStyle='rgba('+shade+','+(shade+7)+','+(shade+7)+','+(.035+rnd()*.055).toFixed(3)+')';
    g.fillRect(x,top,bw,h-top);
    if(rnd()>.55){
      g.fillStyle='rgba(225,233,229,'+(.022+rnd()*.032).toFixed(3)+')';
      g.fillRect(x+bw*.18,top+18,bw*.12,h-top-34);
    }
  }

  // Broad tree canopies reflected in the lower half. They are deliberately
  // blurred-looking silhouettes, not literal foliage geometry.
  for(let i=0;i<18;i++){
    const x=rnd()*w;
    const y=230+rnd()*95;
    const rx=30+rnd()*80;
    const ry=16+rnd()*42;
    const grad=g.createRadialGradient(x,y,4,x,y,rx);
    grad.addColorStop(0,'rgba(60,81,66,'+(.06+rnd()*.08).toFixed(3)+')');
    grad.addColorStop(.55,'rgba(63,84,70,'+(.035+rnd()*.055).toFixed(3)+')');
    grad.addColorStop(1,'rgba(63,84,70,0)');
    g.fillStyle=grad;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  // Horizontal horizon bounce and warm street reflection.
  const horizon=g.createLinearGradient(0,235,0,350);
  horizon.addColorStop(0,'rgba(224,231,225,.035)');
  horizon.addColorStop(.45,'rgba(195,189,168,.070)');
  horizon.addColorStop(1,'rgba(130,128,115,.025)');
  g.fillStyle=horizon;
  g.fillRect(0,225,w,135);

  // Slight pane-to-pane exposure differences stop the curtain wall from
  // reading as one giant tinted sheet.
  const paneW=w/15;
  for(let i=0;i<15;i++){
    g.fillStyle=i%3===0
      ? 'rgba(255,255,255,.018)'
      : (i%3===1?'rgba(29,45,48,.018)':'rgba(190,213,216,.012)');
    g.fillRect(i*paneW,0,paneW,h);
  }

  // Roughness is low but non-uniform: cleaned wipe zones, mineral haze and a
  // few vertical rain traces.
  r.fillStyle='#3c3c3c';
  r.fillRect(0,0,w,h);
  for(let i=0;i<90;i++){
    const x=rnd()*w;
    const y=rnd()*h;
    const radius=12+rnd()*55;
    const v=54+Math.floor(rnd()*66);
    const rg=r.createRadialGradient(x,y,0,x,y,radius);
    rg.addColorStop(0,'rgba('+v+','+v+','+v+','+(.03+rnd()*.08).toFixed(3)+')');
    rg.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
    r.fillStyle=rg;
    r.fillRect(x-radius,y-radius,radius*2,radius*2);
  }
  for(let i=0;i<40;i++){
    const x=rnd()*w;
    const y=20+rnd()*285;
    const len=24+rnd()*100;
    const grad=r.createLinearGradient(x,y,x,y+len);
    grad.addColorStop(0,'rgba(150,150,150,'+(.018+rnd()*.035).toFixed(3)+')');
    grad.addColorStop(1,'rgba(150,150,150,0)');
    r.strokeStyle=grad;
    r.lineWidth=.4+rnd()*.8;
    r.beginPath();
    r.moveTo(x,y);
    r.lineTo(x+(rnd()-.5)*2,y+len);
    r.stroke();
  }

  const map=new THREE.CanvasTexture(color);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.ClampToEdgeWrapping;
  map.anisotropy=8;

  const roughness=new THREE.CanvasTexture(rough);
  roughness.wrapS=roughness.wrapT=THREE.ClampToEdgeWrapping;
  roughness.anisotropy=8;
  return {map,roughness};
}

function makeReferencePavingMaps(seed){
  const size=512;
  const color=document.createElement('canvas');
  const height=document.createElement('canvas');
  const rough=document.createElement('canvas');
  color.width=color.height=height.width=height.height=rough.width=rough.height=size;
  const g=color.getContext('2d');
  const h=height.getContext('2d');
  const r=rough.getContext('2d');
  const rnd=makeSeededRandom(seed);

  g.fillStyle='#d1d1cc';
  g.fillRect(0,0,size,size);
  h.fillStyle='#808080';
  h.fillRect(0,0,size,size);
  r.fillStyle='#eeeeee';
  r.fillRect(0,0,size,size);

  for(let i=0;i<26;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const radius=28+rnd()*95;
    const grad=g.createRadialGradient(x,y,0,x,y,radius);
    grad.addColorStop(
      0,
      rnd()>.5
        ? 'rgba(178,178,170,'+(.025+rnd()*.038).toFixed(3)+')'
        : 'rgba(241,237,225,'+(.022+rnd()*.035).toFixed(3)+')'
    );
    grad.addColorStop(1,'rgba(0,0,0,0)');
    g.fillStyle=grad;
    g.fillRect(x-radius,y-radius,radius*2,radius*2);
  }

  for(let i=0;i<1500;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rr=.20+rnd()*.95;
    const warm=rnd()>.64;
    const v=warm?174+Math.floor(rnd()*38):188+Math.floor(rnd()*48);
    g.fillStyle='rgba('+(v+4)+','+(v+2)+','+v+','+(.012+rnd()*.030).toFixed(3)+')';
    g.fillRect(x,y,rr,rr);
    const hv=118+Math.floor(rnd()*25);
    h.fillStyle='rgba('+hv+','+hv+','+hv+','+(.08+rnd()*.18).toFixed(3)+')';
    h.fillRect(x,y,Math.max(.3,rr*.65),Math.max(.3,rr*.65));
  }

  // Rare darker use/water marks around the pedestrian path.
  for(let i=0;i<8;i++){
    const x=rnd()*size;
    const y=rnd()*size;
    const rx=8+rnd()*38;
    const ry=4+rnd()*18;
    const grad=g.createRadialGradient(x,y,1,x,y,Math.max(rx,ry));
    grad.addColorStop(0,'rgba(109,112,107,'+(.018+rnd()*.035).toFixed(3)+')');
    grad.addColorStop(1,'rgba(109,112,107,0)');
    g.fillStyle=grad;
    g.fillRect(x-rx,y-ry,rx*2,ry*2);
  }

  const map=new THREE.CanvasTexture(color);
  map.colorSpace=THREE.SRGBColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;
  map.repeat.set(1.30,8.25);
  map.anisotropy=8;

  const bump=new THREE.CanvasTexture(height);
  bump.wrapS=bump.wrapT=THREE.RepeatWrapping;
  bump.repeat.copy(map.repeat);
  bump.anisotropy=8;

  const roughness=new THREE.CanvasTexture(rough);
  roughness.wrapS=roughness.wrapT=THREE.RepeatWrapping;
  roughness.repeat.copy(map.repeat);
  roughness.anisotropy=8;

  const normal=makeNormalTextureFromHeight(height,1.05);
  normal.repeat.copy(map.repeat);
  return {map,bump,roughness,normal};
}

const refStoneMaps=makeReferenceStoneMaps(0x2f61bc83);
const refGlassMaps=makeReferenceGlassMaps(0x93a7c151);
const refPavingMaps=makeReferencePavingMaps(0x74b82d1e);

const refStone=new THREE.MeshStandardMaterial({
  color:0xd8d4cb,
  roughness:.86,
  metalness:.005,
  map:refStoneMaps.map,
  roughnessMap:refStoneMaps.roughness,
  normalMap:refStoneMaps.normal,
  normalScale:new THREE.Vector2(.085,.085),
  bumpMap:refStoneMaps.bump,
  bumpScale:.008,
  envMapIntensity:.10
});
const refStoneDark=new THREE.MeshStandardMaterial({
  color:0xb9b7b0,
  roughness:.86,
  metalness:.012,
  map:refStoneMaps.map,
  roughnessMap:refStoneMaps.roughness,
  normalMap:refStoneMaps.normal,
  normalScale:new THREE.Vector2(.065,.065),
  bumpMap:refStoneMaps.bump,
  bumpScale:.006,
  envMapIntensity:.08
});
const refMetal=new THREE.MeshStandardMaterial({
  color:0x343b3d,
  roughness:.42,
  metalness:.48,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.035,.035),
  envMapIntensity:.78
});
const refGlass=new THREE.MeshPhysicalMaterial({
  color:0xc5d6d8,
  map:refGlassMaps.map,
  roughnessMap:refGlassMaps.roughness,
  roughness:.23,
  metalness:0,
  transparent:true,
  opacity:.66,
  transmission:.055,
  ior:1.50,
  thickness:.008,
  clearcoat:0,
  envMapIntensity:.60,
  depthWrite:true
});
const refLobbyGlass=new THREE.MeshPhysicalMaterial({
  color:0xb5c1bf,
  map:refGlassMaps.map,
  roughnessMap:refGlassMaps.roughness,
  roughness:.24,
  metalness:0,
  transparent:true,
  opacity:.68,
  transmission:.045,
  ior:1.50,
  thickness:.008,
  clearcoat:0,
  envMapIntensity:.64
});

// Large backing mass hides the former low-rise silhouette and gives the street
// a believable 5-storey office scale.
const refOfficeMass=new THREE.Mesh(
  new THREE.BoxGeometry(4.6,15.8,76),
  refStone
);
refOfficeMass.position.set(10.15,7.88,-7);
refOfficeMass.castShadow=false;
refOfficeMass.receiveShadow=true;
refStreet.add(refOfficeMass);

// Continuous glazed face. Reflection texture is authored across the entire
// elevation, avoiding the flat transparent-plastic look from the previous pass.
const refGlassWall=new THREE.Mesh(
  new THREE.PlaneGeometry(72,13.9),
  refGlass
);
refGlassWall.position.set(7.77,8.05,-7);
refGlassWall.rotation.y=-Math.PI/2;
refGlassWall.receiveShadow=true;
refStreet.add(refGlassWall);


// Replace the single synchronized curtain-wall read with individually varied
// glass cells. The original wall remains as a subtle backing/reflection layer,
// while each cell gets its own sample window, tint and micro-roughness.
refGlassWall.material.opacity=.08;
refGlassWall.material.envMapIntensity=.70;

const refPaneRnd=makeSeededRandom(0x2d7f91c3);
const refGlassCells=[];
const refFloorBands=[
  {y:2.16,h:2.06},
  {y:4.88,h:2.84},
  {y:8.03,h:2.84},
  {y:11.18,h:2.84},
  {y:14.02,h:1.72}
];

for(let bay=0;bay<15;bay++){
  const z=-37.6+bay*4.75+2.37;
  refFloorBands.forEach((floor,floorIndex)=>{
    const map=refGlassMaps.map.clone();
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.repeat.set(.16,.58);
    map.offset.set(
      (bay*.137+floorIndex*.071+refPaneRnd()*.08)%1,
      (floorIndex*.19+refPaneRnd()*.13)%1
    );
    map.needsUpdate=true;

    const roughMap=refGlassMaps.roughness.clone();
    roughMap.wrapS=roughMap.wrapT=THREE.RepeatWrapping;
    roughMap.repeat.copy(map.repeat);
    roughMap.offset.copy(map.offset);
    roughMap.needsUpdate=true;

    const tintPalette=[0xd8e6e8,0xcbdcdf,0xe0e9e7,0xc3d4d7,0xdde5e2];
    const material=new THREE.MeshPhysicalMaterial({
      color:tintPalette[(bay+floorIndex*2)%tintPalette.length],
      map,
      roughnessMap:roughMap,
      roughness:.14+refPaneRnd()*.050,
      metalness:.012,
      transparent:true,
      opacity:.48+refPaneRnd()*.08,
      transmission:.018,
      clearcoat:.15,
      clearcoatRoughness:.24+refPaneRnd()*.05,
      envMapIntensity:.78+refPaneRnd()*.16,
      ior:1.46,
      reflectivity:.38,
      depthWrite:true
    });

    const pane=new THREE.Mesh(
      new THREE.PlaneGeometry(4.18,floor.h-.14),
      material
    );
    pane.position.set((z>=-9.2 && z<=14.7)?7.94:7.765,floor.y,z);
    pane.rotation.y=-Math.PI/2;
    pane.renderOrder=1;
    pane.userData.baseMapOffset=map.offset.clone();
    pane.userData.baseRoughOffset=roughMap.offset.clone();
    pane.userData.parallaxStrength=.0025+refPaneRnd()*.0045;
    pane.userData.phase=refPaneRnd()*Math.PI*2;
    refStreet.add(pane);
    refGlassCells.push(pane);
  });
}

// Selected panes get a recessed interior tone behind the glass. The variation is
// sparse and low contrast: enough to create depth, but not a checkerboard facade.
const refInteriorShadeMat=new THREE.MeshBasicMaterial({
  color:0x3d4848,
  transparent:true,
  opacity:.16,
  depthWrite:false,
  toneMapped:true,
  side:THREE.DoubleSide
});
[
  {z:-30.45,y:4.88,w:3.38,h:2.15,o:.13},
  {z:-20.95,y:8.03,w:3.60,h:2.22,o:.17},
  {z:-16.20,y:11.18,w:3.46,h:2.18,o:.11},
  {z:-6.70,y:4.88,w:3.55,h:2.20,o:.18},
  {z:-1.95,y:11.18,w:3.40,h:2.16,o:.12},
  {z:7.55,y:8.03,w:3.56,h:2.20,o:.15},
  {z:12.30,y:11.18,w:3.44,h:2.18,o:.10},
  {z:21.80,y:4.88,w:3.62,h:2.22,o:.16}
].forEach((spec,index)=>{
  const shade=new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w,spec.h),
    refInteriorShadeMat.clone()
  );
  shade.material.opacity=spec.o;
  shade.material.color.offsetHSL(
    index%3===0 ? .010 : (index%3===1 ? -.008 : 0),
    -.03,
    index%2 ? .018 : -.012
  );
  shade.position.set(7.815,spec.y,spec.z);
  shade.rotation.y=-Math.PI/2;
  shade.renderOrder=0;
  refStreet.add(shade);
});

// Extremely thin highlights on selected pane edges mimic grazing-angle Fresnel
// without a custom shader. They are sparse enough to avoid a neon outline.
const refGlassEdgeMat=new THREE.MeshBasicMaterial({
  color:0xe7f2f2,
  transparent:true,
  opacity:.075,
  depthWrite:false,
  toneMapped:true
});
for(let bay=0;bay<=15;bay++){
  if(bay%2!==0 && bay!==15) continue;
  const z=-37.6+bay*4.75;
  const edge=new THREE.Mesh(new THREE.PlaneGeometry(.018,13.55),refGlassEdgeMat);
  edge.position.set(7.735,8.02,z);
  edge.rotation.y=-Math.PI/2;
  edge.renderOrder=2;
  refStreet.add(edge);
}


const refInteriorGroup=new THREE.Group();
refInteriorGroup.name='reference-office-interior';
refStreet.add(refInteriorGroup);

const refInteriorRnd=makeSeededRandom(0x6a4d9b31);
const refInteriorBackMaterials=[
  new THREE.MeshStandardMaterial({color:0x596264,roughness:.94,metalness:0,envMapIntensity:.015}),
  new THREE.MeshStandardMaterial({color:0x626866,roughness:.95,metalness:0,envMapIntensity:.012}),
  new THREE.MeshStandardMaterial({color:0x4e5759,roughness:.93,metalness:0,envMapIntensity:.018}),
  new THREE.MeshStandardMaterial({color:0x686861,roughness:.96,metalness:0,envMapIntensity:.010})
];
const refInteriorWarmMaterials=[
  new THREE.MeshBasicMaterial({color:0xd7c6aa,toneMapped:true,transparent:true,opacity:.075}),
  new THREE.MeshBasicMaterial({color:0xc9d1cf,toneMapped:true,transparent:true,opacity:.050}),
  new THREE.MeshBasicMaterial({color:0xe1c8a8,toneMapped:true,transparent:true,opacity:.060})
];
const refInteriorShadowMat=new THREE.MeshBasicMaterial({
  color:0x20282a,
  transparent:true,
  opacity:.18,
  depthWrite:false
});
const refInteriorColumnMat=new THREE.MeshStandardMaterial({
  color:0x777d7a,
  roughness:.76,
  metalness:.04,
  envMapIntensity:.06
});

for(let bay=0;bay<15;bay++){
  const z=-37.6+bay*4.75+2.37;
  const bayWidth=4.28;
  [4.92,8.08,11.22,14.12].forEach((y,floorIndex)=>{
    const shadeIndex=(bay+floorIndex*2)%refInteriorBackMaterials.length;
    const back=new THREE.Mesh(
      new THREE.PlaneGeometry(bayWidth,2.62),
      refInteriorBackMaterials[shadeIndex]
    );
    back.position.set(8.23,y,z);
    back.rotation.y=-Math.PI/2;
    refInteriorGroup.add(back);

    if(refInteriorRnd()>.34){
      const wash=new THREE.Mesh(
        new THREE.PlaneGeometry(bayWidth*.88,2.22),
        refInteriorWarmMaterials[(bay+floorIndex)%refInteriorWarmMaterials.length]
      );
      wash.position.set(8.215,y+.02,z+(refInteriorRnd()-.5)*.08);
      wash.rotation.y=-Math.PI/2;
      refInteriorGroup.add(wash);
    }

    const ceilingShadow=new THREE.Mesh(
      new THREE.PlaneGeometry(bayWidth,.18),
      refInteriorShadowMat
    );
    ceilingShadow.position.set(8.205,y+1.25,z);
    ceilingShadow.rotation.y=-Math.PI/2;
    refInteriorGroup.add(ceilingShadow);

    const lowerShadow=ceilingShadow.clone();
    lowerShadow.position.y=y-1.24;
    refInteriorGroup.add(lowerShadow);

    if((bay+floorIndex)%3===0){
      const column=new THREE.Mesh(
        new THREE.BoxGeometry(.16,2.52,.16),
        refInteriorColumnMat
      );
      column.position.set(8.08,y,z+(refInteriorRnd()-.5)*1.75);
      refInteriorGroup.add(column);
    }
  });
}

const refDeskMat=new THREE.MeshStandardMaterial({
  color:0x5c5a55,
  roughness:.82,
  metalness:.02,
  envMapIntensity:.02
});
const refPartitionMat=new THREE.MeshStandardMaterial({
  color:0x858983,
  roughness:.90,
  metalness:0,
  transparent:true,
  opacity:.72
});
[-10.4,-5.8,-.4,4.6,10.2].forEach((z,index)=>{
  const floorY=[4.15,7.32,10.46][index%3];
  const desk=new THREE.Mesh(new THREE.BoxGeometry(.52,.055,1.35),refDeskMat);
  desk.position.set(8.02,floorY,z);
  refInteriorGroup.add(desk);

  const partition=new THREE.Mesh(new THREE.BoxGeometry(.055,.88,1.20),refPartitionMat);
  partition.position.set(8.00,floorY+.46,z+.52);
  refInteriorGroup.add(partition);
});

const refFacadeRecessMat=new THREE.MeshBasicMaterial({
  color:0x273032,
  transparent:true,
  opacity:.20,
  depthWrite:false
});
for(let z=-37.6;z<=28.9;z+=4.75){
  const recess=new THREE.Mesh(new THREE.PlaneGeometry(.16,13.65),refFacadeRecessMat);
  recess.position.set(7.785,8.02,z+.18);
  recess.rotation.y=-Math.PI/2;
  refStreet.add(recess);
}
[3.30,6.45,9.60,12.75].forEach(y=>{
  const recess=new THREE.Mesh(new THREE.PlaneGeometry(71.2,.09),refFacadeRecessMat);
  recess.position.set(7.79,y-.09,-7);
  recess.rotation.y=-Math.PI/2;
  refStreet.add(recess);
});

// Recessed dark ground floor reads as a real office lobby / retail base.
const refLobbyBand=new THREE.Mesh(
  new THREE.PlaneGeometry(70,3.05),
  refLobbyGlass
);
refLobbyBand.position.set(7.64,1.75,-7);
refLobbyBand.rotation.y=-Math.PI/2;
refStreet.add(refLobbyBand);

// Pale vertical piers create the strong architectural cadence visible in the
// reference without turning the elevation into a grid of tiny meshes.
for(let z=-37.6;z<=28.9;z+=4.75){
  const pier=new THREE.Mesh(
    new THREE.BoxGeometry(.32,15.2,.34),
    refStone
  );
  pier.position.set(7.58,7.62,z);
  pier.castShadow=true;
  pier.receiveShadow=true;
  refStreet.add(pier);
}

// Four floor plates are enough to give office scale from street level.
[3.30,6.45,9.60,12.75].forEach((y,index)=>{
  const slab=new THREE.Mesh(
    new THREE.BoxGeometry(.46,.14,71.5),
    index===0?refStoneDark:refMetal
  );
  slab.position.set(7.55,y,-7);
  slab.castShadow=index===0;
  refStreet.add(slab);
});

// Main lobby portal: a single deep, dark opening gives the facade a believable
// entrance and a clear focal relationship to Mira.
const refLobbyPortal=new THREE.Mesh(
  new THREE.BoxGeometry(.52,3.35,6.2),
  new THREE.MeshStandardMaterial({
    color:0x3b4345,
    roughness:.30,
    metalness:.28,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.74
  })
);
refLobbyPortal.position.set(7.34,1.76,-2.0);
refLobbyPortal.castShadow=true;
refStreet.add(refLobbyPortal);

const refLobbyInset=new THREE.Mesh(
  new THREE.PlaneGeometry(5.58,2.88),
  new THREE.MeshPhysicalMaterial({
    color:0xaec1c2,
    map:refGlassMaps.map,
    roughnessMap:refGlassMaps.roughness,
    roughness:.13,
    metalness:.02,
    transparent:true,
    opacity:.90,
    transmission:.018,
    clearcoat:.40,
    clearcoatRoughness:.12,
    envMapIntensity:1.12
  })
);
refLobbyInset.position.set(7.04,1.77,-2.0);
refLobbyInset.rotation.y=-Math.PI/2;
refStreet.add(refLobbyInset);


const refLobbyInterior=new THREE.Mesh(
  new THREE.BoxGeometry(1.18,2.72,5.25),
  new THREE.MeshStandardMaterial({
    color:0x3f4746,
    roughness:.84,
    metalness:.01,
    envMapIntensity:.03
  })
);
refLobbyInterior.position.set(7.72,1.70,-2.0);
refStreet.add(refLobbyInterior);

const refLobbyRearGlow=new THREE.Mesh(
  new THREE.PlaneGeometry(4.70,2.25),
  new THREE.MeshBasicMaterial({
    color:0xd8c7aa,
    transparent:true,
    opacity:.11,
    toneMapped:true
  })
);
refLobbyRearGlow.position.set(8.33,1.72,-2.0);
refLobbyRearGlow.rotation.y=-Math.PI/2;
refStreet.add(refLobbyRearGlow);

const refLobbyCeiling=new THREE.Mesh(
  new THREE.BoxGeometry(1.08,.08,5.15),
  new THREE.MeshStandardMaterial({color:0xb8b7b0,roughness:.88})
);
refLobbyCeiling.position.set(7.78,2.88,-2.0);
refStreet.add(refLobbyCeiling);

const refLobbyLightMat=new THREE.MeshBasicMaterial({
  color:0xffe5bd,
  transparent:true,
  opacity:.72,
  toneMapped:false
});
[-3.55,-2.5,-1.45,-.42].forEach(z=>{
  const lightSlot=new THREE.Mesh(new THREE.PlaneGeometry(.58,.035),refLobbyLightMat);
  lightSlot.position.set(7.20,2.82,z);
  lightSlot.rotation.y=-Math.PI/2;
  refStreet.add(lightSlot);
});

const refCanopy=new THREE.Mesh(
  new THREE.BoxGeometry(1.55,.15,6.7),
  new THREE.MeshStandardMaterial({
    color:0xcfd1cd,
    roughness:.43,
    metalness:.16,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.42
  })
);
refCanopy.position.set(6.86,3.25,-2.0);
refCanopy.castShadow=true;
refStreet.add(refCanopy);

/* ---------- near-camera hero facade ----------
   The long office wall stays inexpensive in the distance, but the five bays
   closest to the spawn/Mira zone receive real architectural depth.  The key
   change is not more surface noise: glass now sits inside a thick frame with
   projected sills, opaque spandrels and visible interior ceiling planes. */
const refHeroFacade=new THREE.Group();
refHeroFacade.name='reference-hero-facade';
refStreet.add(refHeroFacade);

const refHeroStone=new THREE.MeshPhysicalMaterial({
  color:0xd9d5cc,
  roughness:.91,
  metalness:0,
  map:refStoneMaps.map,
  roughnessMap:refStoneMaps.roughness,
  normalMap:refStoneMaps.normal,
  normalScale:new THREE.Vector2(.022,.022),
  envMapIntensity:.032,
  ior:1.45,
  specularIntensity:.38,
  clearcoat:0
});

// Near-camera stone needs a different texel scale from the seventy-metre wall.
// Clone every map so changing repeat/offset here cannot alter the distant facade.
if(refHeroStone.map){
  refHeroStone.map=refHeroStone.map.clone();
  refHeroStone.map.wrapS=refHeroStone.map.wrapT=THREE.RepeatWrapping;
  refHeroStone.map.repeat.set(.56,1.12);
  refHeroStone.map.offset.set(.17,.08);
  refHeroStone.map.needsUpdate=true;
}
if(refHeroStone.roughnessMap){
  refHeroStone.roughnessMap=refHeroStone.roughnessMap.clone();
  refHeroStone.roughnessMap.wrapS=refHeroStone.roughnessMap.wrapT=THREE.RepeatWrapping;
  refHeroStone.roughnessMap.repeat.set(.56,1.12);
  refHeroStone.roughnessMap.offset.set(.17,.08);
  refHeroStone.roughnessMap.needsUpdate=true;
}
if(refHeroStone.normalMap){
  refHeroStone.normalMap=refHeroStone.normalMap.clone();
  refHeroStone.normalMap.wrapS=refHeroStone.normalMap.wrapT=THREE.RepeatWrapping;
  refHeroStone.normalMap.repeat.set(.56,1.12);
  refHeroStone.normalMap.offset.set(.17,.08);
  refHeroStone.normalMap.needsUpdate=true;
}
if(refHeroStone.bumpMap){
  refHeroStone.bumpMap=refHeroStone.bumpMap.clone();
  refHeroStone.bumpMap.wrapS=refHeroStone.bumpMap.wrapT=THREE.RepeatWrapping;
  refHeroStone.bumpMap.repeat.set(.56,1.12);
  refHeroStone.bumpMap.offset.set(.17,.08);
  refHeroStone.bumpMap.needsUpdate=true;
}

const refHeroMetal=refMetal.clone();
refHeroMetal.color=new THREE.Color(0x626966);
refHeroMetal.roughness=.46;
refHeroMetal.metalness=1;
refHeroMetal.envMapIntensity=.58;
refHeroMetal.normalScale=new THREE.Vector2(.030,.030);

const refHeroRevealMat=new THREE.MeshStandardMaterial({
  color:0x42494a,
  roughness:.58,
  metalness:.18,
  envMapIntensity:.22
});
const refHeroUndersideMat=new THREE.MeshBasicMaterial({
  color:0x202526,
  transparent:true,
  opacity:.13,
  depthWrite:false,
  toneMapped:true
});
const refHeroCeilingMat=new THREE.MeshStandardMaterial({
  color:0xb9b8b0,
  roughness:.91,
  metalness:0,
  envMapIntensity:.025
});
const refHeroBlindMat=new THREE.MeshStandardMaterial({
  color:0xbfc3bd,
  roughness:.88,
  metalness:.01,
  transparent:true,
  opacity:.34,
  side:THREE.DoubleSide,
  depthWrite:false,
  envMapIntensity:.03
});
const refHeroShopFrameMat=new THREE.MeshStandardMaterial({
  color:0x6a675f,
  roughness:.48,
  metalness:1,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  envMapIntensity:.52
});
const refHeroDoorThresholdMat=new THREE.MeshStandardMaterial({
  color:0xb2aea4,
  roughness:.64,
  metalness:1,
  envMapIntensity:.40
});
const refHeroDoorGasketMat=new THREE.MeshStandardMaterial({
  color:0x2f3332,
  roughness:.90,
  metalness:0,
  envMapIntensity:.020
});
const refHeroShopInteriorMat=new THREE.MeshStandardMaterial({
  color:0x504d47,
  roughness:.89,
  metalness:0,
  envMapIntensity:.025
});
const refHeroInteriorWoodMat=new THREE.MeshStandardMaterial({
  color:0x796b5b,
  roughness:.86,
  metalness:0,
  envMapIntensity:.030
});
const refHeroInteriorLightMat=new THREE.MeshBasicMaterial({
  color:0xe9d9c1,
  transparent:true,
  opacity:.34,
  depthWrite:false,
  toneMapped:true
});
const refHeroInteriorDisplayMat=new THREE.MeshStandardMaterial({
  color:0xb6aa98,
  roughness:.84,
  metalness:0,
  envMapIntensity:.035
});

const refHeroBayCenters=[-6.73,-1.98,2.77,7.52,12.27];
const refHeroUpperFloors=[
  {y:4.88,h:2.84},
  {y:8.03,h:2.84},
  {y:11.18,h:2.84},
  {y:14.02,h:1.72}
];

// Thicker stone piers give the close facade a believable wall section instead
// of paper-thin bars laid over glass.
[-9.105,-4.355,.395,5.145,9.895,14.645].forEach(z=>{
  const pier=new THREE.Mesh(
    new THREE.BoxGeometry(.58,15.18,.38),
    refHeroStone
  );
  pier.position.set(7.53,7.62,z);
  pier.castShadow=true;
  pier.receiveShadow=true;
  refHeroFacade.add(pier);
});

// Projected opaque bands conceal the otherwise perfectly continuous glass wall.
// A darker underside strip makes each floor plate read as actual thickness.
refHeroBayCenters.forEach((z,bayIndex)=>{
  [3.30,6.45,9.60,12.75].forEach((y,floorIndex)=>{
    const spandrel=new THREE.Mesh(
      new THREE.BoxGeometry(.48,.31,4.34),
      floorIndex===0?refHeroStone:refHeroMetal
    );
    spandrel.position.set(7.48,y,z);
    spandrel.castShadow=floorIndex===0;
    spandrel.receiveShadow=true;
    refHeroFacade.add(spandrel);

    const underside=new THREE.Mesh(
      new THREE.PlaneGeometry(4.18,.055),
      refHeroUndersideMat
    );
    underside.position.set(7.225,y-.175,z);
    underside.rotation.y=-Math.PI/2;
    underside.renderOrder=3;
    refHeroFacade.add(underside);
  });

  refHeroUpperFloors.forEach((floor,floorIndex)=>{
    // Deep head + sill returns: from oblique street angles the viewer now sees
    // a real reveal before the glazing plane.
    const head=new THREE.Mesh(
      new THREE.BoxGeometry(.62,.075,4.12),
      refHeroRevealMat
    );
    head.position.set(7.56,floor.y+floor.h*.5-.035,z);
    refHeroFacade.add(head);

    const sill=head.clone();
    sill.position.y=floor.y-floor.h*.5+.035;
    refHeroFacade.add(sill);

    // A restrained centre mullion appears only on alternating bays/floors,
    // preventing the close elevation from becoming a perfectly repeated grid.
    if((bayIndex+floorIndex)%3!==1){
      const mullion=new THREE.Mesh(
        new THREE.BoxGeometry(.24,floor.h-.22,.065),
        refHeroMetal
      );
      mullion.position.set(7.50,floor.y,z+(bayIndex%2?.18:-.14));
      refHeroFacade.add(mullion);
    }

    // Interior ceiling slab directly behind the window is one of the strongest
    // real-world depth cues at street eye level.
    const ceiling=new THREE.Mesh(
      new THREE.BoxGeometry(.92,.055,3.94),
      refHeroCeilingMat
    );
    ceiling.position.set(8.08,floor.y+floor.h*.5-.18,z);
    refHeroFacade.add(ceiling);

    // Sparse blinds / privacy screens create occupancy variation.  They sit far
    // enough behind the glass to avoid the sticker-on-window look.
    if((bayIndex*2+floorIndex)%4===0){
      const blind=new THREE.Mesh(
        new THREE.PlaneGeometry(2.55,floor.h*.70),
        refHeroBlindMat
      );
      blind.position.set(8.16,floor.y-.02,z+(bayIndex%2?.52:-.44));
      blind.rotation.y=-Math.PI/2;
      refHeroFacade.add(blind);

      for(let stripe=0;stripe<7;stripe++){
        const slat=new THREE.Mesh(
          new THREE.PlaneGeometry(2.46,.018),
          new THREE.MeshBasicMaterial({
            color:0x8f9691,
            transparent:true,
            opacity:.10,
            depthWrite:false,
            toneMapped:true
          })
        );
        slat.position.set(
          8.145,
          floor.y-floor.h*.24+stripe*(floor.h*.48/6),
          z+(bayIndex%2?.52:-.44)
        );
        slat.rotation.y=-Math.PI/2;
        refHeroFacade.add(slat);
      }
    }
  });
});

// Ground-floor retail / lobby frontage closest to the camera.  Two different
// modules replace the single uninterrupted dark strip with doors, transoms,
// display zones and deep stone jambs.
const refHeroShopGlass=refLobbyGlass.clone();
refHeroShopGlass.opacity=.70;
refHeroShopGlass.roughness=.21;
refHeroShopGlass.envMapIntensity=.88;
refHeroShopGlass.clearcoat=0;
refHeroShopGlass.transmission=.020;
refHeroShopGlass.ior=1.48;

function addHeroStorefront(z,width,doorOffset,variant=0){
  const jambDepth=.76;
  const leftJamb=new THREE.Mesh(
    new THREE.BoxGeometry(jambDepth,3.06,.34),
    refHeroStone
  );
  leftJamb.position.set(7.48,1.59,z-width*.5);
  leftJamb.castShadow=true;
  refHeroFacade.add(leftJamb);

  const rightJamb=leftJamb.clone();
  rightJamb.position.z=z+width*.5;
  refHeroFacade.add(rightJamb);

  const head=new THREE.Mesh(
    new THREE.BoxGeometry(jambDepth,.34,width+.32),
    refHeroStone
  );
  head.position.set(7.48,3.02,z);
  head.castShadow=true;
  refHeroFacade.add(head);

  const recess=new THREE.Mesh(
    new THREE.PlaneGeometry(width-.26,2.58),
    refHeroShopGlass
  );
  recess.position.set(7.91,1.63,z);
  recess.rotation.y=-Math.PI/2;
  refHeroFacade.add(recess);

  const rear=new THREE.Mesh(
    new THREE.BoxGeometry(.70,2.42,width-.46),
    refHeroShopInteriorMat
  );
  rear.position.set(8.28,1.56,z);
  refHeroFacade.add(rear);

  // A few broad interior elements are more convincing through glass than
  // texture noise: a rear display panel, two shelves and a soft ceiling strip.
  const displayPanel=new THREE.Mesh(
    new THREE.BoxGeometry(.055,1.36,width*.42),
    refHeroInteriorDisplayMat
  );
  displayPanel.position.set(7.995,1.46,z-doorOffset*.30);
  refHeroFacade.add(displayPanel);

  [.82,1.34].forEach((shelfY,shelfIndex)=>{
    const shelf=new THREE.Mesh(
      new THREE.BoxGeometry(.30,.038,width*(shelfIndex?.25:.31)),
      refHeroInteriorWoodMat
    );
    shelf.position.set(
      8.06,
      shelfY,
      z-doorOffset*(shelfIndex?.46:.31)
    );
    refHeroFacade.add(shelf);
  });

  const interiorLightStrip=new THREE.Mesh(
    new THREE.BoxGeometry(.035,.026,width*.48),
    refHeroInteriorLightMat
  );
  interiorLightStrip.position.set(7.985,2.64,z+doorOffset*.18);
  refHeroFacade.add(interiorLightStrip);

  const transom=new THREE.Mesh(
    new THREE.BoxGeometry(.24,.065,width-.24),
    refHeroShopFrameMat
  );
  transom.position.set(7.55,2.36,z);
  refHeroFacade.add(transom);

  const doorZ=z+doorOffset;
  const doorFrame=new THREE.Mesh(
    makeBeveledBoxGeometry(.25,2.28,.065,.008),
    refHeroShopFrameMat
  );
  doorFrame.position.set(7.54,1.20,doorZ-.52);
  refHeroFacade.add(doorFrame);
  const doorFrameR=doorFrame.clone();
  doorFrameR.position.z=doorZ+.52;
  refHeroFacade.add(doorFrameR);

  const doorTop=new THREE.Mesh(
    makeBeveledBoxGeometry(.25,.065,1.10,.008),
    refHeroShopFrameMat
  );
  doorTop.position.set(7.54,2.30,doorZ);
  refHeroFacade.add(doorTop);

  // Door sill + compression gaskets give the opening believable construction
  // scale when the player is within a few metres.
  const threshold=new THREE.Mesh(
    makeBeveledBoxGeometry(.30,.030,1.12,.005),
    refHeroDoorThresholdMat
  );
  threshold.position.set(7.50,.080,doorZ);
  threshold.castShadow=true;
  threshold.receiveShadow=true;
  refHeroFacade.add(threshold);

  [-.505,.505].forEach(side=>{
    const gasket=new THREE.Mesh(
      new THREE.BoxGeometry(.032,2.12,.022),
      refHeroDoorGasketMat
    );
    gasket.position.set(7.405,1.20,doorZ+side);
    refHeroFacade.add(gasket);
  });
  const gasketTop=new THREE.Mesh(
    new THREE.BoxGeometry(.032,.022,1.03),
    refHeroDoorGasketMat
  );
  gasketTop.position.set(7.405,2.255,doorZ);
  refHeroFacade.add(gasketTop);

  const innerJoint=new THREE.Mesh(
    new THREE.BoxGeometry(.20,.008,1.05),
    new THREE.MeshBasicMaterial({
      color:0x393b38,
      transparent:true,
      opacity:.22,
      depthWrite:false,
      toneMapped:true
    })
  );
  innerJoint.position.set(7.63,.096,doorZ);
  refHeroFacade.add(innerJoint);

  const handle=new THREE.Mesh(
    makeBeveledBoxGeometry(.055,.48,.028,.004),
    new THREE.MeshStandardMaterial({
      color:0xb9b4a6,
      roughness:.25,
      metalness:.72,
      envMapIntensity:.88
    })
  );
  handle.position.set(7.39,1.34,doorZ+(doorOffset>0?-.34:.34));
  refHeroFacade.add(handle);

  // Low display plinth catches a little street light behind the glass.
  const plinth=new THREE.Mesh(
    new THREE.BoxGeometry(.52,.42,width*.34),
    new THREE.MeshStandardMaterial({
      color:variant?0x81796e:0x706f69,
      roughness:.76,
      metalness:.02,
      envMapIntensity:.06
    })
  );
  plinth.position.set(7.96,.28,z-doorOffset*.62);
  refHeroFacade.add(plinth);

  const ceiling=new THREE.Mesh(
    new THREE.BoxGeometry(.92,.075,width-.44),
    refHeroCeilingMat
  );
  ceiling.position.set(8.05,2.77,z);
  refHeroFacade.add(ceiling);
}

addHeroStorefront(5.15,4.34,.82,0);
addHeroStorefront(9.90,4.34,-.72,1);

/* ---------- near-building massing ----------
   The detail pass above fixes wall thickness; this pass fixes the silhouette.
   Only the focal zone receives these pieces so the rest of the block remains
   cheap. The goal is a real corner, a recessed double-height entrance,
   pedestrian-scale canopies and a roof setback rather than one endless wall. */
const refHeroMassingShadowMat=new THREE.MeshBasicMaterial({
  color:0x171c1d,
  transparent:true,
  opacity:.26,
  depthWrite:false,
  toneMapped:true
});

// Terminate the hero facade with a solid return wall. From the spawn side this
// exposes an actual side surface and stops the curtain wall reading as infinite.
const refHeroCornerReturn=new THREE.Mesh(
  new THREE.BoxGeometry(2.80,15.30,.58),
  refHeroStone
);
refHeroCornerReturn.position.set(8.72,7.66,14.84);
refHeroCornerReturn.castShadow=true;
refHeroCornerReturn.receiveShadow=true;
refHeroFacade.add(refHeroCornerReturn);

const refHeroCornerReveal=new THREE.Mesh(
  new THREE.BoxGeometry(.05,14.68,.66),
  refHeroMassingShadowMat
);
refHeroCornerReveal.position.set(7.27,7.55,14.49);
refHeroFacade.add(refHeroCornerReveal);

// Two projected blades form a deliberately asymmetric frame around the closest
// commercial frontage. Their extra depth creates strong changing parallax while
// walking past the building.
[
  {z:5.04,h:9.48,y:7.78},
  {z:9.98,h:8.78,y:7.58}
].forEach((spec,index)=>{
  const blade=new THREE.Mesh(
    new THREE.BoxGeometry(.90,spec.h,.46),
    refHeroStone
  );
  blade.position.set(7.12,spec.y,spec.z);
  blade.castShadow=true;
  blade.receiveShadow=true;
  refHeroFacade.add(blade);

  const gap=new THREE.Mesh(
    new THREE.BoxGeometry(.045,spec.h-.28,.50),
    refHeroMassingShadowMat
  );
  gap.position.set(6.65,spec.y,spec.z+(index?.25:-.24));
  refHeroFacade.add(gap);
});

const refHeroFrameHead=new THREE.Mesh(
  new THREE.BoxGeometry(.92,.50,5.35),
  refHeroStone
);
refHeroFrameHead.position.set(7.12,12.48,7.52);
refHeroFrameHead.castShadow=true;
refHeroFacade.add(refHeroFrameHead);

// Convert the bay between the lobby and shops into a double-height entry. The
// dark volume sits behind the glass, so it reads as a vestibule rather than a
// painted rectangle on the facade.
const refHeroEntryInterior=new THREE.Mesh(
  new THREE.BoxGeometry(1.28,5.16,3.40),
  new THREE.MeshStandardMaterial({
    color:0x4d4b45,
    roughness:.92,
    metalness:.01,
    envMapIntensity:.025
  })
);
refHeroEntryInterior.position.set(8.18,2.60,2.77);
refHeroFacade.add(refHeroEntryInterior);

// A few large, quiet interior planes make the lobby readable through the glass
// without turning it into a prop-filled game room.
const refHeroLobbyFloor=new THREE.Mesh(
  new THREE.BoxGeometry(1.14,.045,3.10),
  new THREE.MeshStandardMaterial({
    color:0xb7aa98,
    roughness:.78,
    metalness:0,
    envMapIntensity:.035
  })
);
refHeroLobbyFloor.position.set(7.96,.11,2.77);
refHeroFacade.add(refHeroLobbyFloor);

const refHeroLobbyBackWall=new THREE.Mesh(
  new THREE.PlaneGeometry(3.02,4.20),
  new THREE.MeshStandardMaterial({
    color:0x8a8175,
    roughness:.93,
    metalness:0,
    envMapIntensity:.018
  })
);
refHeroLobbyBackWall.position.set(8.80,2.55,2.77);
refHeroLobbyBackWall.rotation.y=-Math.PI/2;
refHeroFacade.add(refHeroLobbyBackWall);

const refHeroLobbyDesk=new THREE.Mesh(
  new THREE.BoxGeometry(.54,.74,1.36),
  refHeroInteriorWoodMat
);
refHeroLobbyDesk.position.set(8.20,.47,3.16);
refHeroLobbyDesk.castShadow=true;
refHeroFacade.add(refHeroLobbyDesk);

const refHeroLobbyLightMat=new THREE.MeshBasicMaterial({
  color:0xffe9c8,
  transparent:true,
  opacity:.20,
  depthWrite:false,
  toneMapped:true
});
[-.82,.82].forEach(offset=>{
  const lightPanel=new THREE.Mesh(
    new THREE.PlaneGeometry(.44,1.04),
    refHeroLobbyLightMat
  );
  lightPanel.position.set(8.66,4.48,2.77+offset);
  lightPanel.rotation.y=-Math.PI/2;
  refHeroFacade.add(lightPanel);
});

const refHeroEntryGlass=refLobbyGlass.clone();
refHeroEntryGlass.opacity=.66;
refHeroEntryGlass.roughness=.20;
refHeroEntryGlass.envMapIntensity=.86;
const refHeroEntryPane=new THREE.Mesh(
  new THREE.PlaneGeometry(3.08,4.64),
  refHeroEntryGlass
);
refHeroEntryPane.position.set(7.72,2.62,2.77);
refHeroEntryPane.rotation.y=-Math.PI/2;
refHeroFacade.add(refHeroEntryPane);

[1.10,4.44].forEach(z=>{
  const jamb=new THREE.Mesh(
    new THREE.BoxGeometry(.94,5.46,.42),
    refHeroStone
  );
  jamb.position.set(7.17,2.75,z);
  jamb.castShadow=true;
  jamb.receiveShadow=true;
  refHeroFacade.add(jamb);
});

const refHeroEntryHead=new THREE.Mesh(
  new THREE.BoxGeometry(.94,.44,3.74),
  refHeroStone
);
refHeroEntryHead.position.set(7.17,5.26,2.77);
refHeroEntryHead.castShadow=true;
refHeroFacade.add(refHeroEntryHead);

const refHeroEntryDivider=new THREE.Mesh(
  new THREE.BoxGeometry(.26,4.46,.07),
  refHeroShopFrameMat
);
refHeroEntryDivider.position.set(7.53,2.54,2.77);
refHeroFacade.add(refHeroEntryDivider);

const refHeroEntryHandleMat=new THREE.MeshStandardMaterial({
  color:0xbdb6a7,
  roughness:.24,
  metalness:.74,
  envMapIntensity:.92
});
[-.29,.29].forEach((offset,index)=>{
  const handle=new THREE.Mesh(
    new THREE.BoxGeometry(.045,.58,.032),
    refHeroEntryHandleMat
  );
  handle.position.set(7.38,1.52,2.77+offset);
  refHeroFacade.add(handle);
});

// Independent canopies give the shops a human-scale datum and cast useful
// near-field shadows. Different depths avoid another exact repetition.
[
  {z:5.18,depth:1.06,width:3.66},
  {z:9.90,depth:1.30,width:3.48}
].forEach((spec,index)=>{
  const canopy=new THREE.Mesh(
    new THREE.BoxGeometry(spec.depth,.105,spec.width),
    refHeroMetal
  );
  canopy.position.set(6.94-spec.depth*.18,2.77,spec.z);
  canopy.castShadow=true;
  canopy.receiveShadow=true;
  refHeroFacade.add(canopy);

  const fascia=new THREE.Mesh(
    new THREE.BoxGeometry(.055,.18,spec.width-.10),
    refHeroShopFrameMat
  );
  fascia.position.set(6.39-spec.depth*.06,2.70,spec.z);
  refHeroFacade.add(fascia);

  const soffit=new THREE.Mesh(
    new THREE.BoxGeometry(spec.depth*.82,.018,spec.width*.86),
    new THREE.MeshBasicMaterial({
      color:index?0xd8cbb7:0xd2c8b9,
      transparent:true,
      opacity:.15,
      toneMapped:true
    })
  );
  soffit.position.set(6.92,2.71,spec.z);
  refHeroFacade.add(soffit);
});

// The existing parapet now hides a smaller roof setback instead of terminating
// against empty sky. This produces a second roof line without loading a new GLB.
const refHeroRoofMass=new THREE.Mesh(
  new THREE.BoxGeometry(2.30,1.16,14.0),
  new THREE.MeshStandardMaterial({
    color:0x8f9692,
    roughness:.64,
    metalness:.16,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.34
  })
);
refHeroRoofMass.position.set(9.16,16.35,4.28);
refHeroRoofMass.castShadow=true;
refHeroRoofMass.receiveShadow=true;
refHeroFacade.add(refHeroRoofMass);

[-1.25,1.45,4.20,6.95,9.72].forEach((z,index)=>{
  const fin=new THREE.Mesh(
    new THREE.BoxGeometry(.08,.78,1.46),
    refHeroMetal
  );
  fin.position.set(7.98,16.28,z);
  fin.rotation.x=index%2?.010:-.008;
  refHeroFacade.add(fin);
});

/* ---------- near-building use + construction detail ----------
   These are deliberately small, sparse cues. Real storefronts reveal how
   assemblies meet the pavement and a few objects behind the glass; perfectly
   empty interiors and mathematically clean wall feet are stronger CG tells than
   slightly simplified geometry. */
const refHeroThresholdMat=new THREE.MeshStandardMaterial({
  color:0x878984,
  roughness:.38,
  metalness:.56,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  envMapIntensity:.72
});
const refHeroRubberMat=new THREE.MeshStandardMaterial({
  color:0x303333,
  roughness:.98,
  metalness:0,
  envMapIntensity:.015
});

// Entry threshold and a slightly recessed walk-off mat.
const refHeroThreshold=new THREE.Mesh(
  new THREE.BoxGeometry(.56,.032,3.10),
  refHeroThresholdMat
);
refHeroThreshold.position.set(7.18,.086,2.77);
refHeroThreshold.castShadow=false;
refHeroThreshold.receiveShadow=true;
refHeroFacade.add(refHeroThreshold);

const refHeroEntryMat=new THREE.Mesh(
  new THREE.BoxGeometry(.86,.022,1.82),
  refHeroRubberMat
);
refHeroEntryMat.position.set(6.77,.074,2.77);
refHeroEntryMat.receiveShadow=true;
refHeroFacade.add(refHeroEntryMat);

// Linear trench drain where the architectural paving meets the storefront zone.
const refHeroDrainBody=new THREE.Mesh(
  new THREE.BoxGeometry(.26,.028,9.55),
  new THREE.MeshStandardMaterial({
    color:0x5a605e,
    roughness:.58,
    metalness:.42,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.54
  })
);
refHeroDrainBody.position.set(6.74,.070,7.55);
refHeroFacade.add(refHeroDrainBody);

const refHeroDrainSlotMat=new THREE.MeshBasicMaterial({
  color:0x242929,
  transparent:true,
  opacity:.74,
  toneMapped:true
});
for(let i=0;i<27;i++){
  const slot=new THREE.Mesh(
    new THREE.BoxGeometry(.105,.012,.095),
    refHeroDrainSlotMat
  );
  slot.position.set(6.735,.088,3.05+i*.345);
  refHeroFacade.add(slot);
}

// Subtle splash/dirt band at the base of the closest stone, strongest near the
// door zone and fading upward. This breaks the "freshly extruded box" read.
const refHeroBaseWearCanvas=document.createElement('canvas');
refHeroBaseWearCanvas.width=64;
refHeroBaseWearCanvas.height=256;
const refHeroBaseWearCtx=refHeroBaseWearCanvas.getContext('2d');
const refHeroBaseWearGrad=refHeroBaseWearCtx.createLinearGradient(0,0,64,0);
refHeroBaseWearGrad.addColorStop(0,'rgba(86,88,82,.18)');
refHeroBaseWearGrad.addColorStop(.30,'rgba(97,96,88,.095)');
refHeroBaseWearGrad.addColorStop(1,'rgba(97,96,88,0)');
refHeroBaseWearCtx.fillStyle=refHeroBaseWearGrad;
refHeroBaseWearCtx.fillRect(0,0,64,256);
const refHeroBaseWearTexture=new THREE.CanvasTexture(refHeroBaseWearCanvas);
refHeroBaseWearTexture.colorSpace=THREE.SRGBColorSpace;
const refHeroBaseWear=new THREE.Mesh(
  new THREE.PlaneGeometry(.58,23.1),
  new THREE.MeshBasicMaterial({
    map:refHeroBaseWearTexture,
    transparent:true,
    opacity:.68,
    depthWrite:false,
    toneMapped:true
  })
);
refHeroBaseWear.position.set(7.225,.36,2.75);
refHeroBaseWear.rotation.y=-Math.PI/2;
refHeroBaseWear.renderOrder=5;
refHeroFacade.add(refHeroBaseWear);

// A few restrained interior objects create scale and occlusion behind the glass.
const refHeroInteriorWoodMat=new THREE.MeshStandardMaterial({
  color:0x76685a,
  roughness:.79,
  metalness:.01,
  envMapIntensity:.04
});
const refHeroInteriorDarkMat=new THREE.MeshStandardMaterial({
  color:0x444846,
  roughness:.84,
  metalness:.03,
  envMapIntensity:.05
});
const refHeroInteriorWarmMat=new THREE.MeshBasicMaterial({
  color:0xd3bea0,
  transparent:true,
  opacity:.12,
  toneMapped:true
});

[
  {z:5.35,x:8.02,w:1.42},
  {z:9.45,x:8.06,w:1.18}
].forEach((spec,index)=>{
  const display=new THREE.Mesh(
    new THREE.BoxGeometry(.54,.055,spec.w),
    refHeroInteriorWoodMat
  );
  display.position.set(spec.x,.86,spec.z);
  refHeroFacade.add(display);

  const legA=new THREE.Mesh(
    new THREE.BoxGeometry(.045,.72,.045),
    refHeroInteriorDarkMat
  );
  legA.position.set(spec.x,.49,spec.z-spec.w*.35);
  refHeroFacade.add(legA);
  const legB=legA.clone();
  legB.position.z=spec.z+spec.w*.35;
  refHeroFacade.add(legB);

  const objectA=new THREE.Mesh(
    new THREE.BoxGeometry(.24,.30,.30),
    new THREE.MeshStandardMaterial({
      color:index?0xa29a8c:0x858b82,
      roughness:.74,
      metalness:.02,
      envMapIntensity:.05
    })
  );
  objectA.position.set(spec.x-.12,1.04,spec.z+.22);
  refHeroFacade.add(objectA);

  const backWash=new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w*.88,1.45),
    refHeroInteriorWarmMat
  );
  backWash.position.set(8.61,1.50,spec.z);
  backWash.rotation.y=-Math.PI/2;
  refHeroFacade.add(backWash);
});

// One shelving rhythm in the deeper shop adds parallax without filling every
// bay with props.
for(let shelf=0;shelf<3;shelf++){
  const board=new THREE.Mesh(
    new THREE.BoxGeometry(.42,.045,2.05),
    refHeroInteriorWoodMat
  );
  board.position.set(8.42,.70+shelf*.62,9.90);
  refHeroFacade.add(board);
}

// Sparse stone panel joints on the solid return wall. They are recessed-looking
// shadow lines, not dark decorative stripes.
for(let y=2.05;y<14.6;y+=2.72){
  const joint=new THREE.Mesh(
    new THREE.PlaneGeometry(2.42,.018),
    refHeroMassingShadowMat
  );
  joint.position.set(8.72,y,14.535);
  joint.renderOrder=5;
  refHeroFacade.add(joint);
}

/* ---------- occupied storefront pass ----------
   Daylight storefronts are rarely empty black boxes. A small amount of signage,
   ceiling light, glass edge haze and planting does more for realism than filling
   every square metre with props. */
function makeFacadeLabelTexture(lines,options={}){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=192;
  const ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  const fg=options.fg || '#d9d7cf';
  const accent=options.accent || '#a9aaa4';

  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillStyle=fg;
  ctx.font=(options.weight || 500)+' 46px Arial, sans-serif';
  ctx.letterSpacing='2px';
  ctx.fillText(lines[0] || '',256,74);

  if(lines[1]){
    ctx.fillStyle=accent;
    ctx.font='400 21px Arial, sans-serif';
    ctx.fillText(lines[1],256,126);
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
}

const refHeroSignMatA=new THREE.MeshBasicMaterial({
  map:makeFacadeLabelTexture(['ALDER','COFFEE · BAKERY'],{
    fg:'#e2ddd2',
    accent:'#a8a49b',
    weight:600
  }),
  transparent:true,
  opacity:.88,
  depthWrite:false,
  toneMapped:true
});
const refHeroSignA=new THREE.Mesh(
  new THREE.PlaneGeometry(2.72,.88),
  refHeroSignMatA
);
refHeroSignA.position.set(6.335,2.36,5.18);
refHeroSignA.rotation.y=-Math.PI/2;
refHeroSignA.renderOrder=6;
refHeroFacade.add(refHeroSignA);

const refHeroSignMatB=new THREE.MeshBasicMaterial({
  map:makeFacadeLabelTexture(['STUDIO 17','DESIGN OFFICE'],{
    fg:'#d7d9d3',
    accent:'#929994',
    weight:500
  }),
  transparent:true,
  opacity:.76,
  depthWrite:false,
  toneMapped:true
});
const refHeroSignB=new THREE.Mesh(
  new THREE.PlaneGeometry(2.45,.78),
  refHeroSignMatB
);
refHeroSignB.position.set(6.285,2.35,9.90);
refHeroSignB.rotation.y=-Math.PI/2;
refHeroSignB.renderOrder=6;
refHeroFacade.add(refHeroSignB);

// Small building-number plaque beside the double-height entrance.
const refHeroNumberCanvas=document.createElement('canvas');
refHeroNumberCanvas.width=256;
refHeroNumberCanvas.height=256;
const refHeroNumberCtx=refHeroNumberCanvas.getContext('2d');
refHeroNumberCtx.clearRect(0,0,256,256);
refHeroNumberCtx.fillStyle='#bab7ad';
refHeroNumberCtx.textAlign='center';
refHeroNumberCtx.textBaseline='middle';
refHeroNumberCtx.font='300 112px Arial, sans-serif';
refHeroNumberCtx.fillText('17',128,132);
const refHeroNumberTexture=new THREE.CanvasTexture(refHeroNumberCanvas);
refHeroNumberTexture.colorSpace=THREE.SRGBColorSpace;
const refHeroNumber=new THREE.Mesh(
  new THREE.PlaneGeometry(.42,.42),
  new THREE.MeshBasicMaterial({
    map:refHeroNumberTexture,
    transparent:true,
    opacity:.78,
    depthWrite:false,
    toneMapped:true
  })
);
refHeroNumber.position.set(6.685,2.14,4.20);
refHeroNumber.rotation.y=-Math.PI/2;
refHeroNumber.renderOrder=7;
refHeroFacade.add(refHeroNumber);

// Daytime interior luminance should be visible but never glow like a game sign.
// Two broad ceiling cards and one soft wall wash supply depth behind the glass.
const refHeroInteriorCeilingGlowMat=new THREE.MeshBasicMaterial({
  color:0xe3d4bd,
  transparent:true,
  opacity:.095,
  depthWrite:false,
  toneMapped:true
});
[
  {z:5.22,w:3.15,x:8.12},
  {z:9.82,w:2.88,x:8.15}
].forEach((spec,index)=>{
  const panel=new THREE.Mesh(
    new THREE.PlaneGeometry(.62,spec.w),
    refHeroInteriorCeilingGlowMat
  );
  panel.position.set(spec.x,2.61,spec.z);
  panel.rotation.x=-Math.PI/2;
  panel.renderOrder=2;
  refHeroFacade.add(panel);

  if(index===0){
    const wallWash=new THREE.Mesh(
      new THREE.PlaneGeometry(2.34,1.10),
      new THREE.MeshBasicMaterial({
        color:0xd6c2a4,
        transparent:true,
        opacity:.075,
        depthWrite:false,
        toneMapped:true
      })
    );
    wallWash.position.set(8.63,1.58,spec.z-.14);
    wallWash.rotation.y=-Math.PI/2;
    refHeroFacade.add(wallWash);
  }
});

// Very faint lower-edge glass haze / cleaning marks. Kept as two overlays so
// the whole window remains reflective and readable from a distance.
function makeGlassUseTexture(seed){
  const canvas=document.createElement('canvas');
  canvas.width=512;
  canvas.height=256;
  const ctx=canvas.getContext('2d');
  const rnd=makeSeededRandom(seed);
  ctx.clearRect(0,0,512,256);

  const bottom=ctx.createLinearGradient(0,256,0,120);
  bottom.addColorStop(0,'rgba(192,197,190,.14)');
  bottom.addColorStop(.35,'rgba(199,203,197,.055)');
  bottom.addColorStop(1,'rgba(210,214,209,0)');
  ctx.fillStyle=bottom;
  ctx.fillRect(0,110,512,146);

  for(let i=0;i<12;i++){
    const x=20+rnd()*472;
    const y=105+rnd()*122;
    const rx=12+rnd()*30;
    const ry=5+rnd()*12;
    const grad=ctx.createRadialGradient(x,y,1,x,y,rx);
    grad.addColorStop(0,'rgba(221,224,217,'+(.016+rnd()*.025).toFixed(3)+')');
    grad.addColorStop(1,'rgba(221,224,217,0)');
    ctx.fillStyle=grad;
    ctx.save();
    ctx.translate(x,y);
    ctx.scale(1,ry/rx);
    ctx.beginPath();
    ctx.arc(0,0,rx,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
  }

  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return texture;
}
[
  {z:5.15,seed:0x72ac1131},
  {z:9.90,seed:0x91bd4aa2}
].forEach(spec=>{
  const haze=new THREE.Mesh(
    new THREE.PlaneGeometry(3.80,2.36),
    new THREE.MeshBasicMaterial({
      map:makeGlassUseTexture(spec.seed),
      transparent:true,
      opacity:.46,
      depthWrite:false,
      toneMapped:true
    })
  );
  haze.position.set(7.685,1.58,spec.z);
  haze.rotation.y=-Math.PI/2;
  haze.renderOrder=7;
  refHeroFacade.add(haze);
});

// Two restrained planters link the architecture to the sidewalk and break the
// hard CAD-like line between glazing, stone and empty paving.
const refHeroPlanterMat=new THREE.MeshStandardMaterial({
  color:0x777a73,
  roughness:.88,
  metalness:.03,
  map:concreteSurface.map,
  roughnessMap:concreteSurface.roughness,
  bumpMap:concreteSurface.bump,
  bumpScale:.005,
  envMapIntensity:.04
});
const refHeroPlanterLeafMats=[
  makeFoliageMaterial(0x667b61,.94,.008,.018),
  makeFoliageMaterial(0x75896b,.92,.010,.022)
];
[
  {z:4.47,w:.88},
  {z:10.72,w:1.02}
].forEach((spec,index)=>{
  const planter=new THREE.Mesh(
    new THREE.BoxGeometry(.74,.36,spec.w),
    refHeroPlanterMat
  );
  planter.position.set(6.20,.25,spec.z);
  planter.castShadow=true;
  planter.receiveShadow=true;
  refHeroFacade.add(planter);

  for(let i=0;i<5;i++){
    const leaf=new THREE.Mesh(
      new THREE.IcosahedronGeometry(.16+(i%2)*.025,1),
      refHeroPlanterLeafMats[(i+index)%2]
    );
    leaf.scale.set(.88,1.25,.72);
    leaf.position.set(
      6.18+(i%2-.5)*.12,
      .52+(i%3)*.035,
      spec.z-spec.w*.32+i*(spec.w*.64/4)
    );
    leaf.rotation.set((i%2?.10:-.08),i*.63,(i%3-1)*.12);
    leaf.castShadow=false;
    refHeroFacade.add(leaf);
  }
});

// A narrow stone base and sparse panel joints make the scale legible at walking
// distance without drawing a noisy checkerboard over the whole building.
const refHeroBase=new THREE.Mesh(
  new THREE.BoxGeometry(.66,.44,24.1),
  refStoneDark
);
refHeroBase.position.set(7.52,.25,2.75);
refHeroBase.castShadow=true;
refHeroFacade.add(refHeroBase);

// The upper edge needs mass too; without a parapet/coping the building reads as
// a cut cardboard box against the sky.
const refHeroParapet=new THREE.Mesh(
  new THREE.BoxGeometry(.92,.34,24.1),
  refHeroStone
);
refHeroParapet.position.set(7.68,15.70,2.75);
refHeroParapet.castShadow=true;
refHeroParapet.receiveShadow=true;
refHeroFacade.add(refHeroParapet);

const refHeroCoping=new THREE.Mesh(
  new THREE.BoxGeometry(1.05,.075,24.24),
  refHeroMetal
);
refHeroCoping.position.set(7.62,15.90,2.75);
refHeroCoping.castShadow=true;
refHeroFacade.add(refHeroCoping);

const refHeroJointMat=new THREE.MeshBasicMaterial({
  color:0x777a76,
  transparent:true,
  opacity:.16,
  depthWrite:false
});
[-9.105,-4.355,.395,5.145,9.895,14.645].forEach((z,pierIndex)=>{
  [2.25,4.55,6.85,9.15,11.45,13.75].forEach((y,jointIndex)=>{
    if((pierIndex+jointIndex)%2) return;
    const joint=new THREE.Mesh(
      new THREE.PlaneGeometry(.28,.014),
      refHeroJointMat
    );
    joint.position.set(7.235,y,z);
    joint.rotation.y=-Math.PI/2;
    joint.renderOrder=4;
    refHeroFacade.add(joint);
  });
});

// Upper glass bays get only sparse mullions; big panes make the building read
// much more like a photographed commercial facade.
for(let z=-37.6;z<=24.6;z+=4.75){
  const mullionZ=z+2.37;
  if(mullionZ>=-9.2 && mullionZ<=14.7) continue;
  const mullion=new THREE.Mesh(
    new THREE.BoxGeometry(.09,9.15,.07),
    refMetal
  );
  mullion.position.set(7.72,9.55,mullionZ);
  refStreet.add(mullion);
}

/* ---------- adjacent warm masonry building ----------
   A believable street edge needs more than one facade system. The hero office
   now terminates into a shorter, warmer punched-window building with its own
   floor rhythm and entrance. It deliberately overlaps the distant curtain wall,
   so the close camera reads two separate buildings instead of one procedural
   elevation stretching down the block. */
const refNeighbor=new THREE.Group();
refNeighbor.name='reference-neighbor-masonry';
refStreet.add(refNeighbor);

const refNeighborMasonry=refStone.clone();
refNeighborMasonry.color=new THREE.Color(0xc5b39e);
refNeighborMasonry.roughness=.90;
refNeighborMasonry.envMapIntensity=.07;
refNeighborMasonry.normalScale=new THREE.Vector2(.050,.050);
refNeighborMasonry.bumpScale=.0042;

if(refNeighborMasonry.map){
  refNeighborMasonry.map=refNeighborMasonry.map.clone();
  refNeighborMasonry.map.wrapS=refNeighborMasonry.map.wrapT=THREE.RepeatWrapping;
  refNeighborMasonry.map.repeat.set(.86,1.62);
  refNeighborMasonry.map.offset.set(.41,.13);
  refNeighborMasonry.map.needsUpdate=true;
}
if(refNeighborMasonry.roughnessMap){
  refNeighborMasonry.roughnessMap=refNeighborMasonry.roughnessMap.clone();
  refNeighborMasonry.roughnessMap.wrapS=refNeighborMasonry.roughnessMap.wrapT=THREE.RepeatWrapping;
  refNeighborMasonry.roughnessMap.repeat.set(.86,1.62);
  refNeighborMasonry.roughnessMap.offset.set(.41,.13);
  refNeighborMasonry.roughnessMap.needsUpdate=true;
}
if(refNeighborMasonry.normalMap){
  refNeighborMasonry.normalMap=refNeighborMasonry.normalMap.clone();
  refNeighborMasonry.normalMap.wrapS=refNeighborMasonry.normalMap.wrapT=THREE.RepeatWrapping;
  refNeighborMasonry.normalMap.repeat.set(.86,1.62);
  refNeighborMasonry.normalMap.offset.set(.41,.13);
  refNeighborMasonry.normalMap.needsUpdate=true;
}
if(refNeighborMasonry.bumpMap){
  refNeighborMasonry.bumpMap=refNeighborMasonry.bumpMap.clone();
  refNeighborMasonry.bumpMap.wrapS=refNeighborMasonry.bumpMap.wrapT=THREE.RepeatWrapping;
  refNeighborMasonry.bumpMap.repeat.set(.86,1.62);
  refNeighborMasonry.bumpMap.offset.set(.41,.13);
  refNeighborMasonry.bumpMap.needsUpdate=true;
}

const refNeighborTrim=refStoneDark.clone();
refNeighborTrim.color=new THREE.Color(0xa89a89);
refNeighborTrim.roughness=.88;
refNeighborTrim.envMapIntensity=.06;

const refNeighborGlass=refLobbyGlass.clone();
refNeighborGlass.color=new THREE.Color(0x9facaa);
refNeighborGlass.opacity=.72;
refNeighborGlass.roughness=.22;
refNeighborGlass.transmission=.018;
refNeighborGlass.clearcoat=.10;
refNeighborGlass.clearcoatRoughness=.30;
refNeighborGlass.envMapIntensity=.82;

const refNeighborMass=new THREE.Mesh(
  new THREE.BoxGeometry(3.35,10.65,11.30),
  refNeighborMasonry
);
refNeighborMass.position.set(8.93,5.32,21.05);
refNeighborMass.castShadow=true;
refNeighborMass.receiveShadow=true;
refNeighbor.add(refNeighborMass);

// Narrow construction joint separates the two buildings and helps their masses
// read independently at a glance.
const refNeighborPartyJoint=new THREE.Mesh(
  new THREE.BoxGeometry(.055,10.35,.14),
  new THREE.MeshBasicMaterial({
    color:0x353633,
    transparent:true,
    opacity:.38,
    depthWrite:false,
    toneMapped:true
  })
);
refNeighborPartyJoint.position.set(7.23,5.18,15.33);
refNeighbor.add(refNeighborPartyJoint);

// Punched windows: dark recess first, glazing behind, then a projected sill.
// Three irregular columns prevent another perfect curtain-wall cadence.
const refNeighborWindowRecessMat=new THREE.MeshBasicMaterial({
  color:0x303534,
  transparent:true,
  opacity:.86,
  toneMapped:true
});
const refNeighborWindowCenters=[17.20,20.82,24.20];
const refNeighborWindowFloors=[
  {y:5.28,h:1.78},
  {y:8.02,h:1.70}
];
refNeighborWindowCenters.forEach((z,columnIndex)=>{
  refNeighborWindowFloors.forEach((floor,floorIndex)=>{
    const width=[1.72,1.46,1.68][columnIndex];

    const recess=new THREE.Mesh(
      new THREE.PlaneGeometry(width+.30,floor.h+.28),
      refNeighborWindowRecessMat
    );
    recess.position.set(7.235,floor.y,z);
    recess.rotation.y=-Math.PI/2;
    refNeighbor.add(recess);

    const glass=new THREE.Mesh(
      new THREE.PlaneGeometry(width,floor.h),
      refNeighborGlass
    );
    glass.position.set(7.39,floor.y,z);
    glass.rotation.y=-Math.PI/2;
    refNeighbor.add(glass);

    const sill=new THREE.Mesh(
      new THREE.BoxGeometry(.46,.10,width+.24),
      refNeighborTrim
    );
    sill.position.set(7.17,floor.y-floor.h*.5-.11,z);
    sill.castShadow=true;
    sill.receiveShadow=true;
    refNeighbor.add(sill);

    const head=sill.clone();
    head.scale.y=.72;
    head.position.y=floor.y+floor.h*.5+.10;
    refNeighbor.add(head);

    // A few curtains / blinds sit well behind the glazing to sell depth.
    if((columnIndex+floorIndex)%2===0){
      const blind=new THREE.Mesh(
        new THREE.PlaneGeometry(width*.72,floor.h*.72),
        new THREE.MeshStandardMaterial({
          color:columnIndex===1?0xb2aaa0:0xc3c0b6,
          roughness:.96,
          metalness:0,
          transparent:true,
          opacity:.42,
          side:THREE.DoubleSide,
          depthWrite:false,
          envMapIntensity:.015
        })
      );
      blind.position.set(7.72,floor.y-.04,z+(columnIndex===2?-.16:.12));
      blind.rotation.y=-Math.PI/2;
      refNeighbor.add(blind);
    }
  });
});

// Ground floor is heavier and more opaque than the office next door.
const refNeighborGroundBand=new THREE.Mesh(
  new THREE.BoxGeometry(.72,3.14,10.64),
  refNeighborTrim
);
refNeighborGroundBand.position.set(7.42,1.62,21.05);
refNeighborGroundBand.castShadow=true;
refNeighbor.add(refNeighborGroundBand);

const refNeighborShopGlass=refNeighborGlass.clone();
refNeighborShopGlass.opacity=.78;
refNeighborShopGlass.roughness=.18;
refNeighborShopGlass.envMapIntensity=.90;

[
  {z:18.15,w:3.05},
  {z:23.12,w:3.35}
].forEach((spec,index)=>{
  const glass=new THREE.Mesh(
    new THREE.PlaneGeometry(spec.w,2.46),
    refNeighborShopGlass
  );
  glass.position.set(7.025,1.55,spec.z);
  glass.rotation.y=-Math.PI/2;
  refNeighbor.add(glass);

  const rear=new THREE.Mesh(
    new THREE.BoxGeometry(.84,2.30,spec.w-.28),
    new THREE.MeshStandardMaterial({
      color:index?0x5a544d:0x4f514e,
      roughness:.92,
      metalness:0,
      envMapIntensity:.02
    })
  );
  rear.position.set(7.72,1.48,spec.z);
  refNeighbor.add(rear);
});

// Solid entrance interrupts the shopfront and gives the second building its own
// address / access pattern.
const refNeighborDoorFrame=new THREE.Mesh(
  new THREE.BoxGeometry(.82,2.88,1.36),
  new THREE.MeshStandardMaterial({
    color:0x5b554d,
    roughness:.46,
    metalness:.32,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.46
  })
);
refNeighborDoorFrame.position.set(7.19,1.48,20.72);
refNeighborDoorFrame.castShadow=true;
refNeighbor.add(refNeighborDoorFrame);

const refNeighborDoorGlass=new THREE.Mesh(
  new THREE.PlaneGeometry(1.08,2.42),
  refNeighborGlass
);
refNeighborDoorGlass.position.set(6.765,1.47,20.72);
refNeighborDoorGlass.rotation.y=-Math.PI/2;
refNeighbor.add(refNeighborDoorGlass);

const refNeighborDoorHandle=new THREE.Mesh(
  new THREE.BoxGeometry(.04,.52,.028),
  refHeroEntryHandleMat
);
refNeighborDoorHandle.position.set(6.70,1.42,20.49);
refNeighbor.add(refNeighborDoorHandle);

// Strong cornice and small setback make the height change intentional.
const refNeighborCornice=new THREE.Mesh(
  new THREE.BoxGeometry(.66,.30,11.58),
  refNeighborTrim
);
refNeighborCornice.position.set(7.34,10.42,21.05);
refNeighborCornice.castShadow=true;
refNeighbor.add(refNeighborCornice);

const refNeighborCoping=new THREE.Mesh(
  new THREE.BoxGeometry(.84,.075,11.72),
  refHeroMetal
);
refNeighborCoping.position.set(7.33,10.62,21.05);
refNeighborCoping.castShadow=true;
refNeighbor.add(refNeighborCoping);

// Two vertical rain streak zones and a darker foot band keep the warm masonry
// from reading as a pristine color block.
const refNeighborWeatherCanvas=document.createElement('canvas');
refNeighborWeatherCanvas.width=128;
refNeighborWeatherCanvas.height=512;
const refNeighborWeatherCtx=refNeighborWeatherCanvas.getContext('2d');
refNeighborWeatherCtx.clearRect(0,0,128,512);
const refNeighborWeatherRnd=makeSeededRandom(0x2cb84a31);
for(let i=0;i<20;i++){
  const x=8+refNeighborWeatherRnd()*112;
  const y=60+refNeighborWeatherRnd()*380;
  const len=20+refNeighborWeatherRnd()*90;
  const grad=refNeighborWeatherCtx.createLinearGradient(x,y,x,y+len);
  grad.addColorStop(0,'rgba(82,78,69,'+(.020+refNeighborWeatherRnd()*.035).toFixed(3)+')');
  grad.addColorStop(1,'rgba(82,78,69,0)');
  refNeighborWeatherCtx.strokeStyle=grad;
  refNeighborWeatherCtx.lineWidth=.5+refNeighborWeatherRnd()*1.2;
  refNeighborWeatherCtx.beginPath();
  refNeighborWeatherCtx.moveTo(x,y);
  refNeighborWeatherCtx.lineTo(x+(refNeighborWeatherRnd()-.5)*2,y+len);
  refNeighborWeatherCtx.stroke();
}
const refNeighborFootGrad=refNeighborWeatherCtx.createLinearGradient(0,0,128,0);
refNeighborFootGrad.addColorStop(0,'rgba(76,72,65,.15)');
refNeighborFootGrad.addColorStop(.28,'rgba(84,78,70,.07)');
refNeighborFootGrad.addColorStop(1,'rgba(84,78,70,0)');
refNeighborWeatherCtx.fillStyle=refNeighborFootGrad;
refNeighborWeatherCtx.fillRect(0,0,128,512);
const refNeighborWeatherTexture=new THREE.CanvasTexture(refNeighborWeatherCanvas);
refNeighborWeatherTexture.colorSpace=THREE.SRGBColorSpace;
const refNeighborWeather=new THREE.Mesh(
  new THREE.PlaneGeometry(.58,10.58),
  new THREE.MeshBasicMaterial({
    map:refNeighborWeatherTexture,
    transparent:true,
    opacity:.55,
    depthWrite:false,
    toneMapped:true
  })
);
refNeighborWeather.position.set(7.205,5.30,21.05);
refNeighborWeather.rotation.y=-Math.PI/2;
refNeighborWeather.renderOrder=6;
refNeighbor.add(refNeighborWeather);

// Clean the foreground sidewalk visually with a dedicated architectural paving
// map rather than reusing the noisier legacy sidewalk texture.
const refWalk=new THREE.Mesh(
  new THREE.PlaneGeometry(7.35,78),
  new THREE.MeshStandardMaterial({
    color:0xe6e1d7,
    roughness:.90,
    map:refPavingMaps.map,
    roughnessMap:refPavingMaps.roughness,
    normalMap:refPavingMaps.normal,
    normalScale:new THREE.Vector2(.018,.018),
    bumpMap:refPavingMaps.bump,
    bumpScale:.0012,
    envMapIntensity:.050
  })
);
refWalk.rotation.x=-Math.PI/2;
refWalk.position.set(4.05,.058,-6);
refWalk.receiveShadow=true;
refStreet.add(refWalk);

/* ---------- integrated pedestrian realm ----------
   The sidewalk is no longer treated as one decorative plane.  Three very
   subtle bands establish a frontage zone, a clear walking path and a curbside
   furnishing strip.  The tonal change is restrained enough to read as paving
   specification rather than colored game tiles. */
const refFrontagePavingMat=new THREE.MeshStandardMaterial({
  color:0xe2ddd3,
  roughness:.91,
  map:refPavingMaps.map,
  roughnessMap:refPavingMaps.roughness,
  normalMap:refPavingMaps.normal,
  normalScale:new THREE.Vector2(.018,.018),
  bumpMap:refPavingMaps.bump,
  bumpScale:.0012,
  envMapIntensity:.046
});
const refFurnishingPavingMat=new THREE.MeshStandardMaterial({
  color:0xd7d4cc,
  roughness:.93,
  map:refPavingMaps.map,
  roughnessMap:refPavingMaps.roughness,
  normalMap:refPavingMaps.normal,
  normalScale:new THREE.Vector2(.020,.020),
  bumpMap:refPavingMaps.bump,
  bumpScale:.0014,
  envMapIntensity:.040
});

const refFrontageZone=new THREE.Mesh(
  new THREE.PlaneGeometry(1.34,44.0),
  refFrontagePavingMat
);
refFrontageZone.rotation.x=-Math.PI/2;
refFrontageZone.position.set(6.97,.064,3.0);
refFrontageZone.receiveShadow=true;
refStreet.add(refFrontageZone);

const refFurnishingZone=new THREE.Mesh(
  new THREE.PlaneGeometry(1.44,44.0),
  refFurnishingPavingMat
);
refFurnishingZone.rotation.x=-Math.PI/2;
refFurnishingZone.position.set(1.14,.063,3.0);
refFurnishingZone.receiveShadow=true;
refStreet.add(refFurnishingZone);

// Longitudinal saw-cut joints explain the banding as real paving construction.
const refLongJointMat=new THREE.MeshBasicMaterial({
  color:0x959792,
  transparent:true,
  opacity:.115,
  depthWrite:false,
  toneMapped:true
});
[1.86,6.28].forEach(x=>{
  const joint=new THREE.Mesh(
    new THREE.PlaneGeometry(.018,43.4),
    refLongJointMat
  );
  joint.rotation.x=-Math.PI/2;
  joint.position.set(x,.069,3.0);
  refStreet.add(joint);
});

// Small utility covers sit in the furnishing zone rather than randomly in the
// walking path.
const refUtilityCoverMat=new THREE.MeshStandardMaterial({
  color:0x777d79,
  roughness:.78,
  metalness:1,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.030,.030),
  envMapIntensity:.30
});
[
  {z:-1.05,w:.48,d:.66,r:.04},
  {z:12.35,w:.56,d:.56,r:-.02}
].forEach(spec=>{
  const cover=new THREE.Mesh(
    new THREE.BoxGeometry(spec.w,.018,spec.d),
    refUtilityCoverMat
  );
  cover.position.set(1.48,.074,spec.z);
  cover.rotation.y=spec.r;
  cover.receiveShadow=true;
  refStreet.add(cover);
});

// A narrow concrete apron immediately in front of the hero entry visually ties
// the threshold to the public sidewalk.
const refEntryApron=new THREE.Mesh(
  new THREE.PlaneGeometry(1.36,3.58),
  new THREE.MeshStandardMaterial({
    color:0xd7d4cc,
    roughness:.92,
    map:refPavingMaps.map,
    roughnessMap:refPavingMaps.roughness,
    normalMap:refPavingMaps.normal,
    normalScale:new THREE.Vector2(.018,.018),
    bumpMap:refPavingMaps.bump,
    bumpScale:.0012,
    envMapIntensity:.044
  })
);
refEntryApron.rotation.x=-Math.PI/2;
refEntryApron.position.set(6.43,.071,2.77);
refEntryApron.receiveShadow=true;
refStreet.add(refEntryApron);

// A continuous but very subtle gutter band connects curb, drainage and parked
// vehicles into one street section.
const refGutterMat=new THREE.MeshStandardMaterial({
  color:0x4f5553,
  roughness:.94,
  metalness:0,
  map:asphaltGround.map,
  roughnessMap:asphaltGround.roughness,
  normalMap:asphaltGround.normal,
  normalScale:new THREE.Vector2(.048,.048),
  bumpMap:asphaltGround.bump,
  bumpScale:.0034,
  envMapIntensity:.020
});
const refGutterBand=new THREE.Mesh(
  new THREE.PlaneGeometry(.62,43.8),
  refGutterMat
);
refGutterBand.rotation.x=-Math.PI/2;
refGutterBand.position.set(-.43,.031,3.0);
refGutterBand.receiveShadow=true;
refStreet.add(refGutterBand);

// Two storm drains sit at believable low points near the parked cars / trees.
const refStormDrainMat=new THREE.MeshStandardMaterial({
  color:0x69716e,
  roughness:.72,
  metalness:1,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  envMapIntensity:.38
});
[-5.55,8.75].forEach((z,drainIndex)=>{
  const frame=new THREE.Mesh(
    new THREE.BoxGeometry(.36,.032,.88),
    refStormDrainMat
  );
  frame.position.set(-.38,.050,z);
  refStreet.add(frame);

  for(let i=0;i<6;i++){
    const slit=new THREE.Mesh(
      new THREE.BoxGeometry(.22,.013,.052),
      new THREE.MeshBasicMaterial({
        color:0x1d2221,
        transparent:true,
        opacity:.78,
        toneMapped:true
      })
    );
    slit.position.set(-.38,.070,z-.31+i*.124);
    refStreet.add(slit);
  }
});

// Minor curb wear where tires repeatedly approach the parking lane.
const refCurbTireMarkMat=new THREE.MeshBasicMaterial({
  color:0x676964,
  transparent:true,
  opacity:.095,
  depthWrite:false,
  toneMapped:true
});
[-8.5,8.1].forEach((z,index)=>{
  const mark=new THREE.Mesh(
    new THREE.PlaneGeometry(.18,1.55),
    refCurbTireMarkMat
  );
  mark.rotation.x=-Math.PI/2;
  mark.position.set(.055,.103,z+(index?.12:-.08));
  refStreet.add(mark);
});

// Soft contact shading along the building foot removes the "model placed on a
// floor plane" look. A canvas alpha gradient keeps it broad and photographic.
const refContactCanvas=document.createElement('canvas');
refContactCanvas.width=256;
refContactCanvas.height=32;
const refContactCtx=refContactCanvas.getContext('2d');
const refContactGrad=refContactCtx.createLinearGradient(0,0,256,0);
refContactGrad.addColorStop(0,'rgba(22,27,27,.23)');
refContactGrad.addColorStop(.18,'rgba(30,34,34,.12)');
refContactGrad.addColorStop(.52,'rgba(38,41,40,.040)');
refContactGrad.addColorStop(1,'rgba(38,41,40,0)');
refContactCtx.fillStyle=refContactGrad;
refContactCtx.fillRect(0,0,256,32);
const refContactTexture=new THREE.CanvasTexture(refContactCanvas);
refContactTexture.colorSpace=THREE.SRGBColorSpace;
refContactTexture.wrapS=THREE.ClampToEdgeWrapping;
refContactTexture.wrapT=THREE.RepeatWrapping;
refContactTexture.repeat.set(1,12);

const refBuildingContact=new THREE.Mesh(
  new THREE.PlaneGeometry(1.48,73.0),
  new THREE.MeshBasicMaterial({
    map:refContactTexture,
    transparent:true,
    opacity:.46,
    depthWrite:false,
    toneMapped:true
  })
);
refBuildingContact.rotation.x=-Math.PI/2;
refBuildingContact.position.set(7.05,.066,-7);
refBuildingContact.renderOrder=3;
refStreet.add(refBuildingContact);

// The neighboring masonry building shares the same broad architectural contact
// gradient, but it must be created only after refContactTexture exists.
const refNeighborContact=new THREE.Mesh(
  new THREE.PlaneGeometry(.82,10.90),
  new THREE.MeshBasicMaterial({
    map:refContactTexture,
    transparent:true,
    opacity:.56,
    depthWrite:false,
    toneMapped:true
  })
);
refNeighborContact.rotation.x=-Math.PI/2;
refNeighborContact.position.set(6.93,.067,21.05);
refNeighborContact.renderOrder=4;
refNeighbor.add(refNeighborContact);

// A second, much softer curb-side shadow ties paving and road together.
const refCurbContactCanvas=document.createElement('canvas');
refCurbContactCanvas.width=128;
refCurbContactCanvas.height=16;
const refCurbCtx=refCurbContactCanvas.getContext('2d');
const refCurbGrad=refCurbCtx.createLinearGradient(0,0,128,0);
refCurbGrad.addColorStop(0,'rgba(40,43,42,0)');
refCurbGrad.addColorStop(.55,'rgba(36,39,39,.038)');
refCurbGrad.addColorStop(1,'rgba(28,31,31,.095)');
refCurbCtx.fillStyle=refCurbGrad;
refCurbCtx.fillRect(0,0,128,16);
const refCurbTexture=new THREE.CanvasTexture(refCurbContactCanvas);
refCurbTexture.colorSpace=THREE.SRGBColorSpace;
const refCurbContact=new THREE.Mesh(
  new THREE.PlaneGeometry(.86,73),
  new THREE.MeshBasicMaterial({
    map:refCurbTexture,
    transparent:true,
    opacity:.38,
    depthWrite:false,
    toneMapped:true
  })
);
refCurbContact.rotation.x=-Math.PI/2;
refCurbContact.position.set(.58,.064,-7);
refCurbContact.renderOrder=3;
refStreet.add(refCurbContact);

// Real sidewalks almost never keep a mathematically perfect cadence after years
// of repairs. Deterministic spacing/width variation preserves construction scale
// while removing the obvious procedural grid.
const refJointMat=new THREE.MeshBasicMaterial({
  color:0x91938f,
  transparent:true,
  opacity:.11,
  depthWrite:false,
  toneMapped:true
});
const refJointRnd=makeSeededRandom(0x3a8f120d);
let refJointZ=-42.0;
let refJointIndex=0;
while(refJointZ<31){
  const jointMat=refJointMat.clone();
  jointMat.opacity=.062+refJointRnd()*.050;
  const jointWidth=.009+refJointRnd()*.010;
  const joint=new THREE.Mesh(new THREE.PlaneGeometry(6.92,jointWidth),jointMat);
  joint.rotation.x=-Math.PI/2;
  joint.rotation.z=(refJointRnd()-.5)*.0035;
  joint.position.set(
    4.05+(refJointRnd()-.5)*.018,
    .061+refJointIndex%2*.0006,
    refJointZ
  );
  refStreet.add(joint);
  refJointZ+=3.68+refJointRnd()*1.02;
  refJointIndex++;
}

// A handful of low-contrast stains / old maintenance marks make the clean slab
// feel occupied without turning it into a grungy game texture.
const refWalkPatinaRnd=makeSeededRandom(0x71ce09b4);
const refWalkPatinaMat=new THREE.MeshBasicMaterial({
  color:0x716f68,
  transparent:true,
  opacity:.018,
  depthWrite:false,
  toneMapped:true
});
for(let i=0;i<5;i++){
  const radius=.12+refWalkPatinaRnd()*.28;
  const stain=new THREE.Mesh(
    new THREE.CircleGeometry(radius,18),
    refWalkPatinaMat.clone()
  );
  stain.material.opacity=.005+refWalkPatinaRnd()*.010;
  stain.scale.set(.65+refWalkPatinaRnd()*1.9,.45+refWalkPatinaRnd()*.85,1);
  stain.rotation.x=-Math.PI/2;
  stain.rotation.z=refWalkPatinaRnd()*Math.PI;
  stain.position.set(
    1.85+refWalkPatinaRnd()*4.55,
    .0705,
    -31+refWalkPatinaRnd()*56
  );
  stain.renderOrder=2;
  refStreet.add(stain);
}

// Two slim street trees near the focal zone establish the reference-image
// rhythm while leaving the facade visible between trunks.

const refLeafCanvas=document.createElement('canvas');
refLeafCanvas.width=refLeafCanvas.height=256;
const refLeafCtx=refLeafCanvas.getContext('2d');
const refLeafRnd=makeSeededRandom(0x91a53cd7);
refLeafCtx.fillStyle='#82947b';
refLeafCtx.fillRect(0,0,256,256);
for(let i=0;i<110;i++){
  const x=refLeafRnd()*256;
  const y=refLeafRnd()*256;
  const rx=4+refLeafRnd()*18;
  const ry=2+refLeafRnd()*12;
  const warm=refLeafRnd()>.60;
  refLeafCtx.fillStyle=warm
    ? 'rgba(154,160,124,'+(.025+refLeafRnd()*.055).toFixed(3)+')'
    : 'rgba(67,92,68,'+(.030+refLeafRnd()*.065).toFixed(3)+')';
  refLeafCtx.beginPath();
  refLeafCtx.ellipse(x,y,rx,ry,refLeafRnd()*Math.PI,0,Math.PI*2);
  refLeafCtx.fill();
}
for(let i=0;i<520;i++){
  const v=95+Math.floor(refLeafRnd()*75);
  refLeafCtx.fillStyle='rgba('+v+','+(v+16)+','+(v-5)+','+(.010+refLeafRnd()*.025).toFixed(3)+')';
  const rr=.3+refLeafRnd()*1.0;
  refLeafCtx.fillRect(refLeafRnd()*256,refLeafRnd()*256,rr,rr);
}
const refLeafTexture=new THREE.CanvasTexture(refLeafCanvas);
refLeafTexture.colorSpace=THREE.SRGBColorSpace;
refLeafTexture.wrapS=refLeafTexture.wrapT=THREE.RepeatWrapping;
refLeafTexture.repeat.set(1.8,1.8);
refLeafTexture.anisotropy=8;


const refLeafClusterCanvas=document.createElement('canvas');
refLeafClusterCanvas.width=refLeafClusterCanvas.height=256;
const refLeafClusterCtx=refLeafClusterCanvas.getContext('2d');
const refLeafClusterRnd=makeSeededRandom(0xb73184d2);
refLeafClusterCtx.clearRect(0,0,256,256);

for(let i=0;i<58;i++){
  const angle=refLeafClusterRnd()*Math.PI*2;
  const radius=Math.pow(refLeafClusterRnd(),.7)*76;
  const cx=128+Math.cos(angle)*radius;
  const cy=132+Math.sin(angle)*radius*.70;
  const rx=7+refLeafClusterRnd()*20;
  const ry=4+refLeafClusterRnd()*12;
  const rot=(refLeafClusterRnd()-.5)*1.8;
  const light=refLeafClusterRnd()>.58;
  refLeafClusterCtx.fillStyle=light
    ? 'rgba(137,154,122,'+(.55+refLeafClusterRnd()*.28).toFixed(3)+')'
    : 'rgba(72,101,70,'+(.55+refLeafClusterRnd()*.30).toFixed(3)+')';
  refLeafClusterCtx.save();
  refLeafClusterCtx.translate(cx,cy);
  refLeafClusterCtx.rotate(rot);
  refLeafClusterCtx.beginPath();
  refLeafClusterCtx.ellipse(0,0,rx,ry,0,0,Math.PI*2);
  refLeafClusterCtx.fill();
  refLeafClusterCtx.restore();
}

refLeafClusterCtx.globalCompositeOperation='destination-out';
for(let i=0;i<19;i++){
  const x=76+refLeafClusterRnd()*104;
  const y=72+refLeafClusterRnd()*112;
  const rr=3+refLeafClusterRnd()*10;
  refLeafClusterCtx.beginPath();
  refLeafClusterCtx.arc(x,y,rr,0,Math.PI*2);
  refLeafClusterCtx.fill();
}
refLeafClusterCtx.globalCompositeOperation='source-over';

const refLeafClusterTexture=new THREE.CanvasTexture(refLeafClusterCanvas);
refLeafClusterTexture.colorSpace=THREE.SRGBColorSpace;
refLeafClusterTexture.anisotropy=8;

const refLeafCardMaterials=[
  new THREE.MeshStandardMaterial({
    color:0x87987e,
    map:refLeafClusterTexture,
    transparent:true,
    alphaTest:.10,
    alphaToCoverage:true,
    roughness:.96,
    metalness:0,
    envMapIntensity:.015,
    side:THREE.DoubleSide,
    depthWrite:true
  }),
  new THREE.MeshStandardMaterial({
    color:0x65785f,
    map:refLeafClusterTexture,
    transparent:true,
    alphaTest:.11,
    alphaToCoverage:true,
    roughness:.97,
    metalness:0,
    envMapIntensity:.012,
    side:THREE.DoubleSide,
    depthWrite:true
  }),
  new THREE.MeshStandardMaterial({
    color:0xa6aa8c,
    map:refLeafClusterTexture,
    transparent:true,
    alphaTest:.10,
    alphaToCoverage:true,
    roughness:.97,
    metalness:0,
    envMapIntensity:.012,
    side:THREE.DoubleSide,
    depthWrite:true
  })
];

let photographicLeafLoadStarted=false;
function loadPhotographicLeafCards(){
  if(photographicLeafLoadStarted) return;
  photographicLeafLoadStarted=true;

  const loader=new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  const load=url=>new Promise((resolve,reject)=>loader.load(url,resolve,undefined,reject));

  Promise.all([
    load('https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/tree_small_02/tree_small_02_leaves_diff_1k.jpg'),
    load('https://dl.polyhaven.org/file/ph-assets/Models/jpg/1k/tree_small_02/tree_small_02_leaves_alpha_1k.jpg')
  ]).then(([diffuse,alpha])=>{
    diffuse.colorSpace=THREE.SRGBColorSpace;
    [diffuse,alpha].forEach(texture=>{
      texture.wrapS=texture.wrapT=THREE.ClampToEdgeWrapping;
      texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy?.()||1,6);
    });

    const colorTints=[0xf2f4eb,0xc9d5c3,0xfff7df];
    refLeafCardMaterials.forEach((material,index)=>{
      const map=diffuse.clone();
      const alphaMap=alpha.clone();
      const cropX=[0,.055,.11][index];
      const cropW=[.70,.67,.64][index];
      map.offset.set(cropX,.01);
      alphaMap.offset.copy(map.offset);
      map.repeat.set(cropW,.98);
      alphaMap.repeat.copy(map.repeat);
      map.needsUpdate=true;
      alphaMap.needsUpdate=true;

      material.map=map;
      material.alphaMap=alphaMap;
      material.color.setHex(colorTints[index]);
      material.alphaTest=.22;
      material.roughness=.92;
      material.envMapIntensity=.025;
      material.needsUpdate=true;
    });

    diffuse.dispose();
    alpha.dispose();
  }).catch(error=>{
    photographicLeafLoadStarted=false;
    console.warn('Photographic leaf atlas failed; keeping procedural foliage.',error);
  });
}

const refLeafCardGeometry=new THREE.PlaneGeometry(1,.72);
function addLeafCardCloud(parent,scale=1,seed=1,count=18){
  const rnd=makeSeededRandom(seed);
  const buckets=refLeafCardMaterials.map(()=>[]);
  const dummy=new THREE.Object3D();
  const visualCount=Math.max(20,Math.round(count*1.45));

  for(let i=0;i<visualCount;i++){
    const angle=rnd()*Math.PI*2;
    const radius=Math.pow(rnd(),.68)*.90;
    const y=.03+rnd()*1.52;
    const size=(.34+rnd()*.48)*scale;
    // Interior/lower leaves stay darker; the exposed upper shell catches more
    // sky and warm daylight. This removes the evenly-speckled procedural read.
    const vertical=THREE.MathUtils.clamp(y/1.55,0,1);
    const materialIndex=
      vertical>.66
        ? (rnd()>.28?2:0)
        : (vertical<.30?(rnd()>.22?1:0):(rnd()>.62?2:0));

    dummy.position.set(
      Math.cos(angle)*radius*scale,
      y*scale,
      Math.sin(angle)*radius*.72*scale
    );
    dummy.rotation.set(
      (rnd()-.5)*.42,
      rnd()*Math.PI,
      (rnd()-.5)*.34
    );
    dummy.scale.set(size,size*(.82+rnd()*.22),1);
    dummy.updateMatrix();
    buckets[materialIndex].push(dummy.matrix.clone());

    // Crossed leaf clusters have real volume from multiple view angles, but are
    // instances rather than extra Mesh objects/draw calls.
    if(i%2===0){
      dummy.rotation.y+=Math.PI*(.44+rnd()*.12);
      dummy.scale.multiplyScalar(.78+rnd()*.14);
      dummy.position.y+=(rnd()-.5)*.08*scale;
      dummy.updateMatrix();
      buckets[(materialIndex+1)%buckets.length].push(dummy.matrix.clone());
    }
  }

  buckets.forEach((matrices,index)=>{
    if(!matrices.length) return;
    const leaves=new THREE.InstancedMesh(
      refLeafCardGeometry,
      refLeafCardMaterials[index],
      matrices.length
    );
    matrices.forEach((matrix,instanceIndex)=>leaves.setMatrixAt(instanceIndex,matrix));
    leaves.instanceMatrix.needsUpdate=true;
    // One darker bucket per crown casts broken alpha-tested sun shadows. Keeping
    // the other buckets shadow-free preserves the current performance budget.
    leaves.castShadow=index===1;
    leaves.receiveShadow=false;
    leaves.userData.foliageInstanced=true;
    parent.add(leaves);
  });
}

function createReferenceTree(x,z,scale=1){
  const tree=new THREE.Group();

  const pit=new THREE.Mesh(
    new THREE.PlaneGeometry(1.18*scale,1.18*scale),
    new THREE.MeshStandardMaterial({
      color:0x655c4d,
      roughness:1,
      metalness:0,
      map:concreteSurface.map,
      roughnessMap:concreteSurface.roughness,
      bumpMap:concreteSurface.bump,
      bumpScale:.006,
      envMapIntensity:.015
    })
  );
  pit.rotation.x=-Math.PI/2;
  pit.position.y=.010;
  pit.receiveShadow=true;
  tree.add(pit);

  const grateMat=new THREE.MeshStandardMaterial({
    color:0x5f6864,
    roughness:.58,
    metalness:.44,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    envMapIntensity:.55
  });
  const grateFrame=new THREE.Mesh(
    new THREE.BoxGeometry(1.12*scale,.025,1.12*scale),
    grateMat
  );
  grateFrame.position.y=.025;
  tree.add(grateFrame);

  const soil=new THREE.Mesh(
    new THREE.PlaneGeometry(.64*scale,.64*scale),
    new THREE.MeshStandardMaterial({
      color:0x4c4438,
      roughness:1,
      metalness:0,
      envMapIntensity:0
    })
  );
  soil.rotation.x=-Math.PI/2;
  soil.position.y=.042;
  tree.add(soil);

  // Slender grate openings create depth without expensive geometry.
  const grateCutMat=new THREE.MeshBasicMaterial({
    color:0x252b29,
    transparent:true,
    opacity:.72,
    toneMapped:true
  });
  for(let i=-3;i<=3;i++){
    const slotA=new THREE.Mesh(
      new THREE.BoxGeometry(.055,.012,.92*scale),
      grateCutMat
    );
    slotA.position.set(i*.12*scale,.041,0);
    tree.add(slotA);
  }

  const trunkMat=new THREE.MeshStandardMaterial({
    color:0x766452,
    roughness:.95,
    map:barkSurface.map,
    roughnessMap:barkSurface.roughness,
    bumpMap:barkSurface.bump,
    bumpScale:.024,
    envMapIntensity:.018
  });

  // Root flare and two subtly offset trunk sections remove the perfectly
  // lathed-cylinder silhouette that is especially obvious at walking distance.
  const rootFlare=new THREE.Mesh(
    new THREE.CylinderGeometry(.17*scale,.235*scale,.30*scale,11),
    trunkMat
  );
  rootFlare.position.y=.15*scale;
  rootFlare.rotation.z=.018;
  rootFlare.castShadow=true;
  tree.add(rootFlare);

  const lowerTrunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.105*scale,.17*scale,2.18*scale,11),
    trunkMat
  );
  lowerTrunk.position.set(-.025*scale,1.30*scale,.018*scale);
  lowerTrunk.rotation.z=.022+(z>0?.010:-.008);
  lowerTrunk.rotation.x=z>0?-.010:.014;
  lowerTrunk.castShadow=true;
  tree.add(lowerTrunk);

  const upperTrunk=new THREE.Mesh(
    new THREE.CylinderGeometry(.075*scale,.115*scale,1.48*scale,10),
    trunkMat
  );
  upperTrunk.position.set(.015*scale,3.03*scale,-.018*scale);
  upperTrunk.rotation.z=-.032+(z>0?.012:-.006);
  upperTrunk.rotation.x=z>0?.018:-.012;
  upperTrunk.castShadow=true;
  tree.add(upperTrunk);

  const branchMat=trunkMat.clone();
  branchMat.color=new THREE.Color(0x705f4f);
  function addReferenceBranch(start,end,r0,r1){
    const dir=end.clone().sub(start);
    const branch=new THREE.Mesh(
      new THREE.CylinderGeometry(r1*scale,r0*scale,dir.length(),9),
      branchMat
    );
    branch.position.copy(start).add(end).multiplyScalar(.5);
    branch.quaternion.setFromUnitVectors(
      new THREE.Vector3(0,1,0),
      dir.clone().normalize()
    );
    branch.castShadow=true;
    tree.add(branch);
  }

  const forkBase=new THREE.Vector3(.015*scale,3.30*scale,-.015*scale);
  const branchBias=z>0?1:-1;
  addReferenceBranch(
    forkBase,
    new THREE.Vector3(-.42*scale,3.96*scale,.16*scale*branchBias),
    .070,.040
  );
  addReferenceBranch(
    forkBase,
    new THREE.Vector3(.38*scale,3.88*scale,-.20*scale*branchBias),
    .066,.038
  );
  addReferenceBranch(
    new THREE.Vector3(.02*scale,3.55*scale,0),
    new THREE.Vector3(.12*scale,4.20*scale,.34*scale*branchBias),
    .052,.028
  );

  const crown=new THREE.Group();
  crown.position.set(
    (z>0?.12:-.10)*scale,
    3.08*scale,
    (z>0?-.07:.09)*scale
  );
  crown.rotation.set(z>0?.025:-.018,z*.013,z>0?-.035:.028);
  crown.scale.set(z>0?.94:1.04,1.08,z>0?1.03:.91);
  addLeafCardCloud(
    crown,
    .94*scale,
    Math.floor((z+80)*317+(x+20)*109),
    22
  );

  // One smaller offset cluster breaks the spherical crown silhouette without
  // multiplying the main leaf density.
  const crownLobe=new THREE.Group();
  crownLobe.position.set(
    (z>0?-.48:.44)*scale,
    .48*scale,
    (z>0?.24:-.20)*scale
  );
  crownLobe.scale.set(.72,.78,.66);
  addLeafCardCloud(
    crownLobe,
    .72*scale,
    Math.floor((z+120)*193+(x+30)*277),
    9
  );
  crown.add(crownLobe);
  tree.add(crown);
  tree.position.set(x,0,z);
  refStreet.add(tree);
}
createReferenceTree(.92,-4.9,1.34);
createReferenceTree(.92,7.8,1.42);

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
      roughnessMap:concreteSurface.roughness,
      normalMap:concreteSurface.normal,
      normalScale:new THREE.Vector2(.22,.22),
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
      roughnessMap:concreteSurface.roughness,
      normalMap:concreteSurface.normal,
      normalScale:new THREE.Vector2(.22,.22),
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
  crown.position.set(x,2.88*scale,z);
  addLeafCardCloud(
    crown,
    .92*scale,
    Math.floor((z+50)*977+(x+24)*191),
    24
  );
  crown.scale.set(.90,1.06,.90);
  scene.add(crown);
  streetTreeCrowns.push(crown);
}

[
  [1.18,-16.4,1.22],
  [1.14,-8.2,1.30],
  [1.16,.2,1.38],
  [1.18,8.7,1.32],
  [1.15,17.1,1.24]
].forEach(([x,z,scale])=>createStreetTree(x,z,scale));

const curbGroundcoverMat=makeFoliageMaterial(0x8ea27a,.93,.009,.018);
[-6.4,10.8].forEach(z=>{
  [-.31,-.15,.14,.30].forEach((dx,i)=>{
    const tuft=new THREE.Mesh(new THREE.ConeGeometry(.055,.20,7),curbGroundcoverMat);
    tuft.position.set(1.0+dx,.145,z+(i%2?.27:-.25));
    tuft.rotation.z=(i-1.5)*.18;
    tuft.castShadow=true;
    tuft.visible=false;
    scene.add(tuft);
  });
});
[
  [-12.35,-18.4,.88],
  [-11.95,.35,.92],
  [-12.25,18.5,.89],
  [-12.05,-32.0,.80],
  [-12.10,-43.5,.74]
].forEach(([x,z,scale])=>createStreetTree(x,z,scale));

function createPlanter(x,z,w=1.8){
  const planterBase=box(w,.42,.72,0xbcb09d,x,.22,z,.97);
  planterBase.material.map=coarseConcreteSurface.map;
  planterBase.material.roughnessMap=coarseConcreteSurface.roughness;
  planterBase.material.normalMap=coarseConcreteSurface.normal;
  planterBase.material.normalScale.set(.18,.18);
  planterBase.material.bumpMap=coarseConcreteSurface.bump;
  planterBase.material.bumpScale=.015;
  planterBase.material.envMapIntensity=.025;
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
  const flowerMats=[
    new THREE.MeshStandardMaterial({color:0xf4f0e6,roughness:.92}),
    new THREE.MeshStandardMaterial({color:0xe8cfd3,roughness:.92}),
    new THREE.MeshStandardMaterial({color:0xf1dfc8,roughness:.92})
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

    for(let bloomIndex=0;bloomIndex<3;bloomIndex++){
      const bloom=new THREE.Mesh(
        new THREE.SphereGeometry(.030+(bloomIndex%2)*.008,8,6),
        flowerMats[(i+bloomIndex)%flowerMats.length]
      );
      bloom.position.set(
        x+w*nx+(bloomIndex-1)*.070,
        .74+(i%2)*.035+bloomIndex*.016,
        z+nz+(bloomIndex%2?.055:-.040)
      );
      bloom.castShadow=true;
      scene.add(bloom);
    }
  });
}
createPlanter(6.6,-15.8,2.0);
createPlanter(6.6,-8.3,2.2);
createPlanter(6.6,4.6,2.15);
createPlanter(6.6,11.8,2.5);
createPlanter(6.6,20.2,2.05);

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
    color:0xd9dad5,
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
miraPocket.visible=false;

const miraAmbientPool=createSunPool(3.18,1.95,3.9,4.4,.16);
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
  color:0xb8bcb8,
  roughness:.93,
  map:concreteSurface.map,
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
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
    color:0xd0d2cd,
    roughness:.96,
    map:pavementTexture,
    bumpMap:pavementMicroBump,
    bumpScale:.010
  })
);
ramp.rotation.x=-Math.PI/2;
ramp.position.set(.76,.050,-1.55);
scene.add(ramp);
ramp.visible=false;

const dotMat=new THREE.MeshStandardMaterial({color:0xd4d5d1,roughness:.96,transparent:true,opacity:0});
for(let dz=-.48;dz<=.48;dz+=.24){
  for(let dx=-.42;dx<=.42;dx+=.21){
    const dot=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.012,10),dotMat);
    dot.position.set(.76+dx,.061,-1.55+dz);
    scene.add(dot);
  }
}

const seatStone=new THREE.MeshStandardMaterial({
  color:0xbec2bf,
  roughness:.95,
  map:concreteSurface.map,
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
  bumpMap:concreteSurface.bump,
  bumpScale:.014,
  envMapIntensity:.07
});
const pocketSeat=new THREE.Mesh(new THREE.BoxGeometry(2.35,.34,.48),seatStone);
pocketSeat.position.set(6.25,.20,-1.70);
pocketSeat.castShadow=true;
pocketSeat.receiveShadow=true;
scene.add(pocketSeat);
pocketSeat.visible=false;

const pocketPlanter=new THREE.Mesh(new THREE.BoxGeometry(2.55,.52,.62),seatStone);
pocketPlanter.position.set(6.25,.27,-2.27);
pocketPlanter.castShadow=true;
scene.add(pocketPlanter);
pocketPlanter.visible=false;

const pocketBook=new THREE.Mesh(
  new THREE.BoxGeometry(.28,.028,.20),
  new THREE.MeshStandardMaterial({color:0xb68d79,roughness:.86})
);
pocketBook.position.set(5.88,.392,-1.70);
pocketBook.rotation.y=.16;
pocketBook.castShadow=true;
scene.add(pocketBook);
pocketBook.visible=false;

const pocketCup=new THREE.Mesh(
  new THREE.CylinderGeometry(.052,.044,.105,12),
  new THREE.MeshStandardMaterial({color:0xeee8df,roughness:.76})
);
pocketCup.position.set(6.45,.425,-1.70);
pocketCup.castShadow=true;
scene.add(pocketCup);
pocketCup.visible=false;

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
  shrub.visible=false;
  scene.add(shrub);
}

// Drainage slots and dappled tree shade add foreground realism where the player
// spends the most time.
const drainMat=new THREE.MeshStandardMaterial({
  color:0x59615f,
  roughness:.46,
  metalness:.56,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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

createDapplePatch(2.15,1.75,4.9,5.7,-.10,.76);
createDapplePatch(4.75,5.15,3.8,4.4,.16,.62);
createSunPool(2.85,1.90,5.2,4.9,.22);
createSunPool(5.85,6.40,3.6,5.8,.14);

const focalPlanterBase=new THREE.Mesh(
  new THREE.BoxGeometry(1.95,.34,.58),
  new THREE.MeshStandardMaterial({
    color:0xbfc3c0,
    roughness:.96,
    map:concreteSurface.map,
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
    bumpMap:concreteSurface.bump,
    bumpScale:.014,
    envMapIntensity:.065
  })
);
focalPlanterBase.position.set(4.95,.18,-4.72);
focalPlanterBase.castShadow=true;
focalPlanterBase.receiveShadow=true;
scene.add(focalPlanterBase);
focalPlanterBase.visible=true;

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
  plant.visible=true;
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
  bloom.visible=true;
  scene.add(bloom);
});

function createLampPost(x,z,withBanner=true){
  const metal=new THREE.MeshStandardMaterial({
    color:0x687170,
    roughness:.45,
    metalness:.72,
    metalnessMap:coatedMetalSurface.metalness,
    map:coatedMetalSurface.map,
    roughnessMap:coatedMetalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
    bumpMap:metalSurface.bump,
    bumpScale:.004,
    envMapIntensity:.94
  });
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.032,.044,3.35,12),metal);
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
    new THREE.BoxGeometry(.26,.085,.15),
    new THREE.MeshStandardMaterial({
      color:0x7a8380,
      roughness:.38,
      metalness:.42,
      map:metalSurface.map,
      roughnessMap:metalSurface.roughness,
      normalMap:metalSurface.normal,
      normalScale:new THREE.Vector2(.10,.10),
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
createLampPost(.45,-11,false);
createLampPost(.45,2,false);
createLampPost(.45,15,false);

const wayfindingPole=new THREE.Mesh(
  new THREE.CylinderGeometry(.045,.055,2.25,10),
  new THREE.MeshStandardMaterial({
    color:0x66716e,
    roughness:.47,
    metalness:.42,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
wayfindingPole.visible=false;
wayfindingSignFrame.visible=false;
wayfindingSign.visible=false;
wayfindingCap.visible=false;

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
const benchWoodRoughness=woodSurface.roughness.clone();
benchWoodRoughness.rotation=Math.PI/2;
benchWoodRoughness.center.set(.5,.5);
benchWoodRoughness.needsUpdate=true;
const benchWoodNormal=woodSurface.normal.clone();
benchWoodNormal.rotation=Math.PI/2;
benchWoodNormal.center.set(.5,.5);
benchWoodNormal.needsUpdate=true;
const benchWood=new THREE.MeshPhysicalMaterial({
  color:0xb09073,
  roughness:.90,
  map:benchWoodMap,
  roughnessMap:benchWoodFinishRoughness,
  normalMap:benchWoodNormal,
  normalScale:new THREE.Vector2(.16,.16),
  bumpMap:benchWoodBump,
  bumpScale:.020,
  clearcoat:.055,
  clearcoatMap:benchWoodClearcoatWear,
  clearcoatRoughness:.76,
  envMapIntensity:.10
});
if('anisotropy' in benchWood){
  benchWood.anisotropy=.07;
  benchWood.anisotropyRotation=Math.PI/2;
}

const benchEndMat=new THREE.MeshStandardMaterial({
  color:0xb48765,
  map:woodEndGrainTexture,
  roughness:.92,
  metalness:0,
  envMapIntensity:.08
});
function addBenchEndCaps(y,z,w=.13,h=.085,rotationX=0){
  [-1,1].forEach(side=>{
    const cap=new THREE.Mesh(
      new THREE.PlaneGeometry(w,h),
      benchEndMat
    );
    cap.position.set(6.15+side*.878,y,z);
    cap.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    cap.rotation.z=rotationX;
    cap.castShadow=false;
    scene.add(cap);
  });
}
const benchMetal=new THREE.MeshStandardMaterial({
  color:0x707875,
  roughness:.44,
  metalness:.72,
  metalnessMap:coatedMetalSurface.metalness,
  map:coatedMetalSurface.map,
  roughnessMap:coatedMetalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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
  addBenchEndCaps(.54,-5.55+zOffset,.13,.085,(index-1)*.010);
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
    color:0x303534,
    roughness:.99,
    roughnessMap:rubberAging.roughness,
    metalness:0,
    bumpMap:rubberAging.bump,
    bumpScale:.008,
    envMapIntensity:.035
  });
  const frameMat=new THREE.MeshStandardMaterial({
    color:0x7f8d88,
    roughness:.40,
    metalness:.54,
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
  const seatMat=makeDisplayMaterial('leather',0x574b43);

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
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
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
  roughnessMap:woodSurface.roughness,
  normalMap:woodSurface.normal,
  normalScale:new THREE.Vector2(.20,.20),
  bumpMap:woodSurface.bump,
  bumpScale:.020
});
const cafeTableMetal=new THREE.MeshStandardMaterial({
  color:0x7f8783,
  roughness:.42,
  metalness:.48,
  map:metalSurface.map,
  roughnessMap:metalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
  bumpMap:metalSurface.bump,
  bumpScale:.005,
  envMapIntensity:.90
});
const cafeSeatMat=new THREE.MeshStandardMaterial({
  color:0xe5ddd0,
  roughness:.91,
  map:concreteSurface.map,
  roughnessMap:concreteSurface.roughness,
  normalMap:concreteSurface.normal,
  normalScale:new THREE.Vector2(.22,.22),
  bumpMap:concreteSurface.bump,
  bumpScale:.010
});

function createCafeTable(x,z){
  return;
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
    roughnessMap:concreteSurface.roughness,
    normalMap:concreteSurface.normal,
    normalScale:new THREE.Vector2(.22,.22),
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
    map:metalSurface.map,
    roughnessMap:metalSurface.roughness,
    normalMap:metalSurface.normal,
    normalScale:new THREE.Vector2(.10,.10),
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
  metalness:.72,
  metalnessMap:coatedMetalSurface.metalness,
  map:coatedMetalSurface.map,
  roughnessMap:coatedMetalSurface.roughness,
  normalMap:metalSurface.normal,
  normalScale:new THREE.Vector2(.10,.10),
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
  const gradient=g.createRadialGradient(48,48,5,48,48,46);
  gradient.addColorStop(0,'rgba(24,27,26,'+(opacity*.78).toFixed(3)+')');
  gradient.addColorStop(.30,'rgba(24,27,26,'+(opacity*.46).toFixed(3)+')');
  gradient.addColorStop(.68,'rgba(24,27,26,'+(opacity*.13).toFixed(3)+')');
  gradient.addColorStop(1,'rgba(24,27,26,0)');
  g.fillStyle=gradient;
  g.fillRect(0,0,96,96);

  const texture=new THREE.CanvasTexture(c);
  const shadow=new THREE.Mesh(
    new THREE.PlaneGeometry(w,d),
    new THREE.MeshBasicMaterial({
      map:texture,
      transparent:true,
      depthWrite:false,
      toneMapped:true
    })
  );
  shadow.rotation.x=-Math.PI/2;
  shadow.position.y=.031;
  shadow.renderOrder=1;
  parent.add(shadow);

  // A faint secondary lobe gives feet/tires a daylight direction rather than a
  // perfectly centered radial blob. Kept very subtle so authored cast shadows
  // remain the primary cue.
  if(d<1.0){
    const sunLobe=shadow.clone();
    sunLobe.material=shadow.material.clone();
    sunLobe.material.opacity=.32;
    sunLobe.scale.set(.78,1.55,1);
    sunLobe.position.set(.07,.002,.10);
    sunLobe.rotation.z=-.10;
    sunLobe.renderOrder=0;
    parent.add(sunLobe);
  }
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
  const curbOffsets=[-.09,.035,-.055,.070];
  const parkingYaws=[-.026,.018,-.012,.031];
  group.position.set(x+curbOffsets[parkedIndex%curbOffsets.length],0,z);
  group.rotation.y=parkingYaws[parkedIndex%parkingYaws.length];
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
    pauseCycle:16.5+Math.random()*12.0,
    pauseOffset:Math.random()*9.0,
    pauseLength:1.1+Math.random()*1.8,
    browseSide:(ambientWalkers.length%2===0?1:-1),
    laneWander:.012+Math.random()*.022,
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

// Keep exactly two background pedestrians, and keep them outside Mira's focal
// zone. Their procedural placeholders stay hidden; only authored GLBs can appear.
ambientWalkers.forEach((walker,index)=>{
  walker.backgroundOnly=index<2;
  walker.group.visible=index<2;
});

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
    speedPhase:Math.random()*Math.PI*2,
    speedCycle:8.5+Math.random()*7.5,
    lanePhase:Math.random()*Math.PI*2,
    laneWander:.018+Math.random()*.032,
    wheels,
    placeholderChildren,
    assetRoot:null,
    assetWheels:[]
  });
}

// Low-speed urban traffic still needs to move decisively faster than a person.
createTrafficCar(-9.2,-28,0xd4d0c7,3.35,'primary');
createTrafficCar(-5.9,27,0x8a9da6,-2.85,'secondary');

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
    opacity:.032,
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
storefrontContactGradient.addColorStop(0,'rgba(61,54,48,.095)');
storefrontContactGradient.addColorStop(.38,'rgba(71,63,56,.045)');
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
    opacity:.60,
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
  bloom.visible=false;
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

mira.position.set(2.28,0,2.0);
const miraBaseYaw=-.16;
mira.rotation.y=miraBaseYaw;
mira.scale.setScalar(1.02);
// The authored character is the normal path. Keep the procedural Mira hidden
// from frame zero so there is no visible "old -> new" character swap.
miraRig.visible=false;
scene.add(mira);

function trimStaticShadowBudget(){
  scene.updateMatrixWorld(true);
  const boxSize=new THREE.Vector3();
  const worldScale=new THREE.Vector3();
  const worldPos=new THREE.Vector3();

  scene.traverse(object=>{
    if(!object.isMesh || !object.castShadow || object.isSkinnedMesh) return;
    if(object.userData?.keepShadow) return;

    const geometry=object.geometry;
    if(!geometry) return;
    if(!geometry.boundingBox) geometry.computeBoundingBox();
    if(!geometry.boundingBox) return;

    geometry.boundingBox.getSize(boxSize);
    object.getWorldScale(worldScale);
    object.getWorldPosition(worldPos);

    const sx=Math.abs(boxSize.x*worldScale.x);
    const sy=Math.abs(boxSize.y*worldScale.y);
    const sz=Math.abs(boxSize.z*worldScale.z);
    const largest=Math.max(sx,sy,sz);
    const distanceXZ=Math.hypot(
      worldPos.x-camera.position.x,
      worldPos.z-camera.position.z
    );

    // Tiny props contribute almost nothing to a sun shadow at eye level, while
    // every one still costs draw work in the shadow pass. Far static geometry
    // is already represented by contact shading / photographic set extension.
    if(largest<.65 || distanceXZ>34){
      object.castShadow=false;
    }
  });
}
trimStaticShadowBudget();

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
let worldCoreAssetsReady=true;
let miraGLBRoot=null;
let miraGLBBasePosition=null;
let miraIdleAction=null;
const miraBones={
  head:null,
  neck:null,
  chest:null,
  hips:null,
  leftUpperLeg:null,
  rightUpperLeg:null,
  leftShoulder:null,
  rightShoulder:null,
  leftArm:null,
  leftForeArm:null,
  rightArm:null,
  rightForeArm:null
};
const miraBoneRestQuaternions=new Map();
let miraGreetingUntil=0;
let miraGreetingCooldownUntil=0;
let miraNearLatch=false;
const miraBoneOffsetQuaternion=new THREE.Quaternion();
const miraBoneOffsetEuler=new THREE.Euler(0,0,0,'YXZ');
let worldEnvironmentTexture=null;
let photographicEnvironmentLoadStarted=false;

async function loadPhotographicEnvironment(){
  if(photographicEnvironmentLoadStarted) return;
  photographicEnvironmentLoadStarted=true;

  if(!window.RGBELoader && window.ensureRGBELoader){
    try{
      await window.ensureRGBELoader();
    }catch(error){
      photographicEnvironmentLoadStarted=false;
      console.warn('HDR loader import failed; keeping procedural environment.',error);
      return;
    }
  }
  if(!window.RGBELoader){
    photographicEnvironmentLoadStarted=false;
    return;
  }

  const hdrLoader=new window.RGBELoader();
  hdrLoader.load(
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/wide_street_02_1k.hdr',
    hdrTexture=>{
      hdrTexture.mapping=THREE.EquirectangularReflectionMapping;
      const pmrem=new THREE.PMREMGenerator(renderer);
      pmrem.compileEquirectangularShader();
      const target=pmrem.fromEquirectangular(hdrTexture);
      const previousEnvironment=worldEnvironmentTexture;

      worldEnvironmentTexture=target.texture;
      scene.environment=worldEnvironmentTexture;

      // Imported assets sometimes hold an explicit reference to the fallback
      // environment. Swap only those references; materials that intentionally
      // have no envMap keep using scene.environment normally.
      scene.traverse(object=>{
        if(!object.isMesh) return;
        const materials=Array.isArray(object.material)?object.material:[object.material];
        materials.forEach(material=>{
          if(!material) return;
          if(material.envMap===previousEnvironment){
            material.envMap=worldEnvironmentTexture;
            material.needsUpdate=true;
          }
        });
      });

      previousEnvironment?.dispose?.();
      hdrTexture.dispose();
      pmrem.dispose();
    },
    undefined,
    error=>{
      console.warn('Photographic HDR environment failed; using procedural fallback.',error);
    }
  );
}

function ensureWorldAssetEnvironment(){
  if(worldEnvironmentTexture) return;

  const width=512;
  const height=256;
  const envCanvas=document.createElement('canvas');
  envCanvas.width=width;
  envCanvas.height=height;
  const g=envCanvas.getContext('2d');

  // Outdoor equirectangular environment: cool zenith, pale horizon, warm ground.
  const vertical=g.createLinearGradient(0,0,0,height);
  vertical.addColorStop(0,'#7fb8d2');
  vertical.addColorStop(.23,'#9fc9d9');
  vertical.addColorStop(.46,'#d6e4e6');
  vertical.addColorStop(.56,'#ece9df');
  vertical.addColorStop(.72,'#b9b8ae');
  vertical.addColorStop(1,'#6f746e');
  g.fillStyle=vertical;
  g.fillRect(0,0,width,height);

  const rnd=makeSeededRandom(0x7351ace9);

  // Broad city masses below the horizon generate believable low-frequency
  // reflections in glass, cars and skin without reading like an indoor studio.
  for(let i=0;i<18;i++){
    const x=i*(width/18)-20+rnd()*36;
    const w=32+rnd()*88;
    const top=146+rnd()*42;
    const shade=84+Math.floor(rnd()*45);
    g.fillStyle='rgba('+shade+','+(shade+7)+','+(shade+5)+','+(.055+rnd()*.085).toFixed(3)+')';
    g.fillRect(x,top,w,height-top);
  }

  // Tree masses near the horizon add natural green reflection breakup.
  for(let i=0;i<20;i++){
    const x=rnd()*width;
    const y=151+rnd()*34;
    const rx=24+rnd()*70;
    const ry=10+rnd()*28;
    const grad=g.createRadialGradient(x,y,2,x,y,rx);
    grad.addColorStop(0,'rgba(67,88,68,'+(.055+rnd()*.075).toFixed(3)+')');
    grad.addColorStop(1,'rgba(67,88,68,0)');
    g.fillStyle=grad;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  // A low-frequency road band and vertical facade rhythm supply the reflections
  // that real cars, glazing and skin pick up at street level. These shapes stay
  // intentionally abstract; PMREM turns them into soft environmental structure.
  const roadGrad=g.createLinearGradient(0,height*.63,0,height);
  roadGrad.addColorStop(0,'rgba(78,82,79,0)');
  roadGrad.addColorStop(.28,'rgba(69,72,70,.18)');
  roadGrad.addColorStop(1,'rgba(45,48,47,.34)');
  g.fillStyle=roadGrad;
  g.fillRect(0,height*.58,width,height*.42);

  for(let i=0;i<26;i++){
    const x=i*(width/26)+(rnd()-.5)*14;
    const w=4+rnd()*15;
    const a=.018+rnd()*.040;
    g.fillStyle='rgba(214,219,215,'+a.toFixed(3)+')';
    g.fillRect(x,height*.50,w,height*.26);
  }

  // Soft off-axis sun disc and surrounding warm sky.
  const sunX=width*.30;
  const sunY=height*.23;
  const sunGlow=g.createRadialGradient(sunX,sunY,2,sunX,sunY,76);
  sunGlow.addColorStop(0,'rgba(255,246,216,.96)');
  sunGlow.addColorStop(.08,'rgba(255,239,200,.62)');
  sunGlow.addColorStop(.32,'rgba(255,226,184,.16)');
  sunGlow.addColorStop(1,'rgba(255,226,184,0)');
  g.fillStyle=sunGlow;
  g.fillRect(sunX-80,sunY-80,160,160);

  // Soft clouds affect specular highlights without producing graphic shapes.
  for(let i=0;i<28;i++){
    const x=rnd()*width;
    const y=26+rnd()*112;
    const rx=22+rnd()*80;
    const ry=8+rnd()*24;
    const grad=g.createRadialGradient(x,y,3,x,y,rx);
    grad.addColorStop(0,'rgba(255,255,255,'+(.035+rnd()*.070).toFixed(3)+')');
    grad.addColorStop(1,'rgba(255,255,255,0)');
    g.fillStyle=grad;
    g.save();
    g.translate(x,y);
    g.scale(1,ry/rx);
    g.beginPath();
    g.arc(0,0,rx,0,Math.PI*2);
    g.fill();
    g.restore();
  }

  const envTexture=new THREE.CanvasTexture(envCanvas);
  envTexture.colorSpace=THREE.SRGBColorSpace;
  envTexture.mapping=THREE.EquirectangularReflectionMapping;

  const pmrem=new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target=pmrem.fromEquirectangular(envTexture);
  worldEnvironmentTexture=target.texture;
  scene.environment=worldEnvironmentTexture;

  envTexture.dispose();
  pmrem.dispose();

  // The photographic HDR is intentionally loaded later. Starting it here made
  // the largest texture download compete with Mira and the first vehicle.
  // The generated PMREM is enough for the first painted frame.
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

// ---------- scanned world skins ----------
// Photo-based CC0 PBR maps replace the most visible procedural surfaces.
// They are intentionally 1K in the runtime demo to keep startup reasonable.
const realSkinLoader=new THREE.TextureLoader();
realSkinLoader.setCrossOrigin('anonymous');

function loadRuntimeSkin(url,{srgb=false,repeatX=1,repeatY=1,deferMs=0}={}){
  const configure=texture=>{
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(repeatX,repeatY);
    texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy?.()||1,8);
    if(srgb) texture.colorSpace=THREE.SRGBColorSpace;
    return texture;
  };

  if(!deferMs){
    return configure(realSkinLoader.load(
      url,
      loaded=>{ loaded.needsUpdate=true; },
      undefined,
      error=>console.warn('Scanned skin texture failed; keeping fallback surface.',url,error)
    ));
  }

  // A blank texture uses Three's neutral placeholder until the photo normal
  // arrives, so diffuse color and interaction are never blocked by this request.
  const texture=configure(new THREE.Texture());
  window.setTimeout(()=>{
    realSkinLoader.load(
      url,
      loaded=>{
        texture.image=loaded.image;
        texture.needsUpdate=true;
        loaded.dispose?.();
      },
      undefined,
      error=>console.warn('Deferred scanned texture failed.',url,error)
    );
  },deferMs);
  return texture;
}

const realStuccoColor=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_wall_009/concrete_wall_009_diff_1k.jpg',
  {srgb:true,repeatX:1.55,repeatY:3.10}
);
const realStuccoNormal=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_wall_009/concrete_wall_009_nor_gl_1k.jpg',
  {repeatX:1.55,repeatY:3.10,deferMs:1150}
);
const realStuccoRough=facadeSurface.roughness;

const realAsphaltColor=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_01/asphalt_01_diff_1k.jpg',
  {srgb:true,repeatX:5.2,repeatY:31}
);
const realAsphaltNormal=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/asphalt_01/asphalt_01_nor_gl_1k.jpg',
  {repeatX:5.2,repeatY:31,deferMs:850}
);
const realAsphaltRough=asphaltRoughness;

const realPavingColor=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_pavement_02/concrete_pavement_02_diff_1k.jpg',
  {srgb:true,repeatX:4.6,repeatY:33}
);
const realPavingNormal=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/concrete_pavement_02/concrete_pavement_02_nor_gl_1k.jpg',
  {repeatX:4.6,repeatY:33,deferMs:700}
);
const realPavingRough=pavementRoughness;

const realBarkColor=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/tree_bark_03/tree_bark_03_diff_1k.jpg',
  {srgb:true,repeatX:1.0,repeatY:3.7}
);
const realBarkNormal=loadRuntimeSkin(
  'https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/tree_bark_03/tree_bark_03_nor_gl_1k.jpg',
  {repeatX:1.0,repeatY:3.7,deferMs:1250}
);
const realBarkRough=barkSurface.roughness;

const realVehicleNormal=null;
const realVehicleRough=vehiclePaintRoughness;

function installScannedBuildingSkins(){
  const materials=[
    rightFacade?.material,
    upperRecess?.material,
    topCornice?.material,
    corniceUnder?.material,
    corniceLip?.material,
    facadeBaseBand?.material,
    heroPierMat,
    facadeRibMat,
    balconyStone
  ].filter(Boolean);

  const skinPalette=[
    0xd4d3ce,
    0xc9cbc7,
    0xe0ddd5,
    0xc4c5c1,
    0xe7e2d8,
    0xc7c4bd,
    0xd9d3c8,
    0xc2c4c0,
    0xd0cbc2
  ];

  materials.forEach((material,index)=>{
    material.color?.setHex(skinPalette[index%skinPalette.length]);
    material.map=cloneTextureVariant(
      realStuccoColor,
      (index*.173)%1,
      (index*.281)%1,
      .92+(index%3)*.055,
      .88+((index+1)%3)*.060,
      ((index%5)-2)*.006
    );
    material.roughnessMap=cloneTextureVariant(
      realStuccoRough,
      (index*.173)%1,
      (index*.281)%1,
      .92+(index%3)*.055,
      .88+((index+1)%3)*.060,
      ((index%5)-2)*.006
    );
    material.normalMap=cloneTextureVariant(
      realStuccoNormal,
      (index*.173)%1,
      (index*.281)%1,
      .92+(index%3)*.055,
      .88+((index+1)%3)*.060,
      ((index%5)-2)*.006
    );
    material.normalScale?.set(.18,.18);
    material.bumpMap=null;
    material.roughness=.90+(index%3)*.018;
    material.metalness=0;
    material.envMapIntensity=Math.min(material.envMapIntensity??.025,.035);
    material.needsUpdate=true;
  });
}
installScannedBuildingSkins();

function copyRuntimeSkinSet(material,color,normal,roughness,{
  normalScale=.16,
  roughnessValue=.92,
  envIntensity=.025,
  colorTint=null
}={}){
  if(!material) return;
  material.map=color;
  material.normalMap=normal;
  material.roughnessMap=roughness;
  material.bumpMap=null;
  material.roughness=roughnessValue;
  material.metalness=0;
  material.envMapIntensity=envIntensity;
  if(material.normalScale?.set) material.normalScale.set(normalScale,normalScale);
  if(colorTint && material.color?.setHex) material.color.setHex(colorTint);
  material.needsUpdate=true;
}

function installScannedStreetSkins(){
  // The boulevard now uses actual photographed/scanned surfaces instead of
  // procedural grain. The big planes get texture scale close to real metres,
  // while small curb pieces keep their existing construction detail.
  copyRuntimeSkinSet(road?.material,realAsphaltColor,realAsphaltNormal,realAsphaltRough,{
    normalScale:.34,roughnessValue:.93,envIntensity:.012,colorTint:0xffffff
  });
  copyRuntimeSkinSet(distantRoad?.material,
    cloneTextureVariant(realAsphaltColor,.17,.08,1,1),
    cloneTextureVariant(realAsphaltNormal,.17,.08,1,1),
    cloneTextureVariant(realAsphaltRough,.17,.08,1,1),{
      normalScale:.30,roughnessValue:.94,envIntensity:.012,colorTint:0xffffff
    }
  );

  [
    cityGround?.material,
    sidewalk?.material,
    distantSidewalk?.material,
    cafeTerrace?.material
  ].filter(Boolean).forEach((material,index)=>{
    const ox=(index*.173)%1;
    const oy=(index*.119)%1;
    copyRuntimeSkinSet(
      material,
      cloneTextureVariant(realPavingColor,ox,oy,1,1),
      cloneTextureVariant(realPavingNormal,ox,oy,1,1),
      cloneTextureVariant(realPavingRough,ox,oy,1,1),{
        normalScale:index>=2?.13:.15,
        roughnessValue:.945,
        envIntensity:.016,
        colorTint:index>=2?0xe9e7e1:0xe4e2dc
      }
    );
  });

  // The dominant office stone also gets a photographed cast-concrete response.
  [refStone,refStoneDark].forEach((material,index)=>{
    copyRuntimeSkinSet(
      material,
      cloneTextureVariant(realStuccoColor,index*.27,index*.13,1,1),
      cloneTextureVariant(realStuccoNormal,index*.27,index*.13,1,1),
      cloneTextureVariant(realStuccoRough,index*.27,index*.13,1,1),{
        normalScale:index?.11:.13,
        roughnessValue:index?.89:.87,
        envIntensity:.030,
        colorTint:index?0xc5c5c0:0xe0ded7
      }
    );
  });

  // All procedural bark users share the same source texture object, making them
  // easy to replace without rebuilding the tree geometry.
  scene.traverse(object=>{
    if(!object.isMesh) return;
    const materials=Array.isArray(object.material)?object.material:[object.material];
    materials.forEach(material=>{
      if(!material) return;
      if(material.map===barkSurface.map || material.bumpMap===barkSurface.bump){
        material.map=realBarkColor;
        material.normalMap=realBarkNormal;
        material.roughnessMap=realBarkRough;
        material.bumpMap=null;
        material.roughness=.94;
        material.metalness=0;
        material.envMapIntensity=.012;
        material.normalScale?.set(.22,.22);
        if(material.color?.setHex) material.color.setHex(0xb6a995);
        material.needsUpdate=true;
      }
    });
  });
}
installScannedStreetSkins();

function tuneVehicleAsset(root,bodyColor){
  const bodyTint=new THREE.Color(bodyColor);
  const mutedTint=bodyTint.clone().lerp(new THREE.Color(0xbdbcb7),.46);

  root.traverse(object=>{
    if(!object.isMesh) return;
    const hasUv=Boolean(object.geometry?.attributes?.uv);
    const sourceMaterials=Array.isArray(object.material)?object.material:[object.material];

    const tunedMaterials=sourceMaterials.map((source,materialIndex)=>{
      if(!source) return source;
      const key=((object.name||'')+' '+(source.name||'')).toLowerCase();
      const common={
        name:source.name||'',
        side:source.side,
        alphaTest:source.alphaTest||0
      };

      if(/glass|window|windshield|windscreen/.test(key)){
        const glass=new THREE.MeshPhysicalMaterial({
          ...common,
          color:0x899493,
          roughness:.19,
          metalness:0,
          transparent:true,
          opacity:.54,
          transmission:.18,
          ior:1.50,
          thickness:.010,
          clearcoat:.015,
          clearcoatRoughness:.38,
          envMap:worldEnvironmentTexture,
          envMapIntensity:.82,
          depthWrite:false
        });
        if(hasUv) glass.roughnessMap=glassRoughnessTexture;
        return glass;
      }

      if(/body|paint|carpaint|car_paint|coachwork|exterior/.test(key)){
        let panelHash=2166136261;
        const panelKey=(object.name||'')+'|'+(source.name||'')+'|'+materialIndex;
        for(let pi=0;pi<panelKey.length;pi++){
          panelHash^=panelKey.charCodeAt(pi);
          panelHash=Math.imul(panelHash,16777619);
        }
        const panelVariation=((panelHash>>>0)%1000)/1000-.5;
        const paintColor=mutedTint.clone();
        paintColor.offsetHSL(
          panelVariation*.004,
          panelVariation*.025,
          panelVariation*.018
        );

        const paint=new THREE.MeshPhysicalMaterial({
          ...common,
          color:paintColor,
          roughness:THREE.MathUtils.clamp(.39+panelVariation*.028,.36,.42),
          metalness:.015,
          clearcoat:.42,
          clearcoatRoughness:THREE.MathUtils.clamp(.27+panelVariation*.025,.24,.30),
          specularIntensity:.42,
          envMap:worldEnvironmentTexture,
          envMapIntensity:.62
        });
        if(hasUv){
          paint.normalMap=realVehicleNormal;
          paint.normalScale=new THREE.Vector2(.018,.018);
          paint.roughnessMap=realVehicleRough;
          paint.clearcoatNormalMap=realVehicleNormal;
          paint.clearcoatNormalScale=new THREE.Vector2(.010,.010);
        }
        return paint;
      }

      if(/head.?light|lamp_front|front.?light/.test(key)){
        return new THREE.MeshPhysicalMaterial({
          ...common,
          color:0xf1eadb,
          roughness:.17,
          metalness:0,
          clearcoat:.66,
          clearcoatRoughness:.12,
          transmission:.10,
          transparent:source.transparent||false,
          opacity:source.opacity??1,
          emissive:0x6c624f,
          emissiveIntensity:.055,
          envMap:worldEnvironmentTexture,
          envMapIntensity:.92
        });
      }

      if(/tail.?light|rear.?light|brake/.test(key)){
        return new THREE.MeshPhysicalMaterial({
          ...common,
          color:0xa75149,
          roughness:.19,
          metalness:0,
          clearcoat:.72,
          clearcoatRoughness:.13,
          transmission:.06,
          transparent:source.transparent||false,
          opacity:source.opacity??1,
          emissive:0x3b0f0c,
          emissiveIntensity:.045,
          envMap:worldEnvironmentTexture,
          envMapIntensity:.86
        });
      }

      const material=source.clone?.()||source;
      if(/tire|tyre|rubber/.test(key)){
        if(material.color) material.color.set(0x242727);
        material.roughness=.96;
        if('metalness' in material) material.metalness=0;
        if('envMapIntensity' in material) material.envMapIntensity=.08;
        if(hasUv){
          if('roughnessMap' in material) material.roughnessMap=rubberAging.roughness;
          if('bumpMap' in material){
            material.bumpMap=rubberAging.bump;
            material.bumpScale=.010;
          }
        }
      }else if(/wheel|rim/.test(key)){
        if(material.color) material.color.set(0x9a9f9d);
        material.roughness=.32;
        if('metalness' in material) material.metalness=.74;
        if('envMapIntensity' in material) material.envMapIntensity=.96;
        if(hasUv && 'roughnessMap' in material) material.roughnessMap=metalSurface.roughness;
      }else{
        if(material.color){
          const hsl={h:0,s:0,l:0};
          material.color.getHSL(hsl);
          if(hsl.s>.35 && hsl.l>.12){
            material.color.setHSL(hsl.h,hsl.s*.62,THREE.MathUtils.lerp(hsl.l,.46,.10));
          }
        }
        if('roughness' in material) material.roughness=THREE.MathUtils.clamp(material.roughness??.66,.52,.90);
        if('metalness' in material) material.metalness=Math.min(material.metalness??0,.12);
        if('envMapIntensity' in material) material.envMapIntensity=.055;
      }
      material.needsUpdate=true;
      return material;
    });

    object.material=Array.isArray(object.material)?tunedMaterials:tunedMaterials[0];
  });

  // Keep authored wheel meshes static; translation already sells slow traffic.
  return [];
}

function tunePedestrianAsset(root,index=0){
  root.traverse(object=>{
    if(!object.isMesh) return;
    const hasUv=Boolean(object.geometry?.attributes?.uv);
    const materials=Array.isArray(object.material)?object.material:[object.material];

    materials.forEach(material=>{
      if(!material) return;
      const key=((object.name||'')+' '+(material.name||'')).toLowerCase();

      if('metalness' in material){
        material.metalness=0;
      }

      if(/skin|face|head/.test(key)){
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .78,.74,.86);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.070;
        if(hasUv && 'roughnessMap' in material && !material.roughnessMap){
          material.roughnessMap=skinOilRoughness;
        }
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=skinMicroBump;
          material.bumpScale=.0008;
        }
      }else if(/hair/.test(key)){
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .82,.78,.90);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.090;
        if(hasUv && 'roughnessMap' in material && !material.roughnessMap){
          material.roughnessMap=hairRoughnessTexture;
        }
      }else{
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .84,.80,.96);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.070;
        if(hasUv && 'roughnessMap' in material && !material.roughnessMap){
          material.roughnessMap=clothRoughnessTexture;
        }
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=fabricMicroBump;
          material.bumpScale=.0020;
        }
      }

      // Background pedestrians stay deliberately quieter than Mira.
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


const humanToneCanvas=document.createElement('canvas');
humanToneCanvas.width=humanToneCanvas.height=256;
const humanToneCtx=humanToneCanvas.getContext('2d');
const humanToneRnd=makeSeededRandom(0x4f9c31a2);
humanToneCtx.fillStyle='#d3a18c';
humanToneCtx.fillRect(0,0,256,256);
for(let i=0;i<42;i++){
  const x=humanToneRnd()*256;
  const y=humanToneRnd()*256;
  const radius=10+humanToneRnd()*42;
  const warm=humanToneRnd()>.48;
  const grad=humanToneCtx.createRadialGradient(x,y,0,x,y,radius);
  grad.addColorStop(
    0,
    warm
      ? 'rgba(188,102,82,'+(.015+humanToneRnd()*.030).toFixed(3)+')'
      : 'rgba(196,159,139,'+(.012+humanToneRnd()*.024).toFixed(3)+')'
  );
  grad.addColorStop(1,'rgba(0,0,0,0)');
  humanToneCtx.fillStyle=grad;
  humanToneCtx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
for(let i=0;i<900;i++){
  const warm=humanToneRnd()>.55;
  const base=warm?148:176;
  humanToneCtx.fillStyle='rgba('+(base+24)+','+(base-2)+','+(base-12)+','+(.006+humanToneRnd()*.014).toFixed(3)+')';
  const rr=.20+humanToneRnd()*.65;
  humanToneCtx.fillRect(humanToneRnd()*256,humanToneRnd()*256,rr,rr);
}
const humanToneTexture=new THREE.CanvasTexture(humanToneCanvas);
humanToneTexture.colorSpace=THREE.SRGBColorSpace;
humanToneTexture.wrapS=humanToneTexture.wrapT=THREE.RepeatWrapping;
humanToneTexture.repeat.set(1.35,1.35);
humanToneTexture.anisotropy=8;

const humanSkinRoughCanvas=document.createElement('canvas');
humanSkinRoughCanvas.width=humanSkinRoughCanvas.height=256;
const humanSkinRoughCtx=humanSkinRoughCanvas.getContext('2d');
const humanSkinRoughRnd=makeSeededRandom(0xa1387d62);
humanSkinRoughCtx.fillStyle='#c6c6c6';
humanSkinRoughCtx.fillRect(0,0,256,256);
for(let i=0;i<35;i++){
  const x=humanSkinRoughRnd()*256;
  const y=humanSkinRoughRnd()*256;
  const radius=8+humanSkinRoughRnd()*36;
  const v=165+Math.floor(humanSkinRoughRnd()*58);
  const grad=humanSkinRoughCtx.createRadialGradient(x,y,0,x,y,radius);
  grad.addColorStop(0,'rgba('+v+','+v+','+v+','+(.08+humanSkinRoughRnd()*.12).toFixed(3)+')');
  grad.addColorStop(1,'rgba('+v+','+v+','+v+',0)');
  humanSkinRoughCtx.fillStyle=grad;
  humanSkinRoughCtx.fillRect(x-radius,y-radius,radius*2,radius*2);
}
for(let i=0;i<1200;i++){
  const v=175+Math.floor(humanSkinRoughRnd()*60);
  humanSkinRoughCtx.fillStyle='rgba('+v+','+v+','+v+','+(.012+humanSkinRoughRnd()*.030).toFixed(3)+')';
  humanSkinRoughCtx.fillRect(humanSkinRoughRnd()*256,humanSkinRoughRnd()*256,.4+humanSkinRoughRnd()*.8,.4+humanSkinRoughRnd()*.8);
}
const humanSkinRoughTexture=new THREE.CanvasTexture(humanSkinRoughCanvas);
humanSkinRoughTexture.wrapS=humanSkinRoughTexture.wrapT=THREE.RepeatWrapping;
humanSkinRoughTexture.repeat.set(1.55,1.55);
humanSkinRoughTexture.anisotropy=8;

const humanHairRoughCanvas=document.createElement('canvas');
humanHairRoughCanvas.width=128;
humanHairRoughCanvas.height=256;
const humanHairRoughCtx=humanHairRoughCanvas.getContext('2d');
const humanHairRnd=makeSeededRandom(0x72b9c145);
humanHairRoughCtx.fillStyle='#bcbcbc';
humanHairRoughCtx.fillRect(0,0,128,256);
for(let x=0;x<128;x++){
  const wave=Math.sin(x*.43)+Math.sin(x*.093)*.55;
  const v=Math.round(170+wave*18);
  humanHairRoughCtx.fillStyle='rgba('+v+','+v+','+v+',.42)';
  humanHairRoughCtx.fillRect(x,0,1,256);
}
for(let i=0;i<280;i++){
  const x=humanHairRnd()*128;
  const y=humanHairRnd()*256;
  const len=8+humanHairRnd()*50;
  humanHairRoughCtx.strokeStyle='rgba(220,220,220,'+(.035+humanHairRnd()*.070).toFixed(3)+')';
  humanHairRoughCtx.lineWidth=.35+humanHairRnd()*.55;
  humanHairRoughCtx.beginPath();
  humanHairRoughCtx.moveTo(x,y);
  humanHairRoughCtx.lineTo(x+(humanHairRnd()-.5)*2,y+len);
  humanHairRoughCtx.stroke();
}
const humanHairRoughTexture=new THREE.CanvasTexture(humanHairRoughCanvas);
humanHairRoughTexture.wrapS=humanHairRoughTexture.wrapT=THREE.RepeatWrapping;
humanHairRoughTexture.repeat.set(3.5,1.0);
humanHairRoughTexture.anisotropy=8;

function tuneMiraAsset(root){
  root.traverse(object=>{
    if(!object.isMesh) return;
    const hasUv=Boolean(object.geometry?.attributes?.uv);
    const materials=Array.isArray(object.material)?object.material:[object.material];

    materials.forEach(material=>{
      if(!material) return;
      const key=((object.name||'')+' '+(material.name||'')).toLowerCase();

      if('metalness' in material){
        material.metalness=0;
      }

      if(/eye|cornea|iris/.test(key)){
        if('roughness' in material) material.roughness=.18;
        if('envMapIntensity' in material) material.envMapIntensity=.32;
        if(material.color) material.color.lerp(new THREE.Color(0xdce8e7),.035);
        if(material.isMeshPhysicalMaterial){
          material.clearcoat=.07;
          material.clearcoatRoughness=.30;
          if('specularIntensity' in material) material.specularIntensity=.50;
        }
      }else if(/skin|face|head/.test(key)){
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .72,.72,.84);
        }
        if(material.color){
          material.color.lerp(new THREE.Color(0xd5a28e),.028);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.095;
        if(hasUv && 'map' in material && !material.map){
          material.map=humanToneTexture;
        }
        if(hasUv && 'roughnessMap' in material){
          material.roughnessMap=humanSkinRoughTexture;
        }
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=skinMicroBump;
          material.bumpScale=.00018;
        }
        if(material.isMeshPhysicalMaterial){
          material.clearcoat=0;
          if('specularIntensity' in material) material.specularIntensity=.26;
          if(hasUv && 'specularIntensityMap' in material){
            material.specularIntensityMap=skinSpecularTexture;
          }
        }
      }else if(/hair/.test(key)){
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .70,.60,.78);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.12;
        if(hasUv && 'roughnessMap' in material){
          material.roughnessMap=humanHairRoughTexture;
        }
        if(material.isMeshPhysicalMaterial){
          material.sheen=.10;
          material.sheenRoughness=.92;
          if(material.sheenColor && material.color){
            material.sheenColor.copy(material.color).lerp(new THREE.Color(0x8a766c),.20);
          }
          if('anisotropy' in material) material.anisotropy=.30;
          if('anisotropyRotation' in material) material.anisotropyRotation=.06;
        }
      }else{
        // Treat the remaining character materials as fabric/leather rather than
        // generic smooth plastic. Existing authored roughness maps are kept.
        if('roughness' in material){
          material.roughness=THREE.MathUtils.clamp(material.roughness ?? .88,.84,.96);
        }
        if('envMapIntensity' in material) material.envMapIntensity=.060;
        if(hasUv && 'roughnessMap' in material && !material.roughnessMap){
          material.roughnessMap=clothRoughnessTexture;
        }
        if(hasUv && 'bumpMap' in material && !material.bumpMap){
          material.bumpMap=fabricMicroBump;
          material.bumpScale=.0028;
        }
        if(material.isMeshPhysicalMaterial){
          material.clearcoat=0;
          material.sheen=.11;
          material.sheenRoughness=.98;
          if(material.sheenColor && material.color){
            material.sheenColor.copy(material.color).lerp(new THREE.Color(0xd8d1c8),.12);
          }
          if('specularIntensity' in material) material.specularIntensity=.20;
        }
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
      !miraBones.hips &&
      /(^|_|mixamorig)?hips$|pelvis|root_hips/.test(key)
    ){
      miraBones.hips=object;
    }

    if(
      !miraBones.leftUpperLeg &&
      /leftupleg|leftthigh|upleg_l|upperleg_l|thigh_l|l_thigh/.test(key)
    ){
      miraBones.leftUpperLeg=object;
    }

    if(
      !miraBones.rightUpperLeg &&
      /rightupleg|rightthigh|upleg_r|upperleg_r|thigh_r|r_thigh/.test(key)
    ){
      miraBones.rightUpperLeg=object;
    }

    if(
      !miraBones.leftShoulder &&
      /leftshoulder|shoulder_l|clavicle_l|l_clavicle/.test(key)
    ){
      miraBones.leftShoulder=object;
    }

    if(
      !miraBones.rightShoulder &&
      /rightshoulder|shoulder_r|clavicle_r|r_clavicle/.test(key)
    ){
      miraBones.rightShoulder=object;
    }

    if(
      !miraBones.leftForeArm &&
      /leftforearm|leftlowerarm|forearm_l|lowerarm_l|l_forearm/.test(key)
    ){
      miraBones.leftForeArm=object;
    }

    if(
      !miraBones.leftArm &&
      /leftarm|leftupperarm|upperarm_l|arm_l|l_upperarm/.test(key) &&
      !/forearm|lowerarm/.test(key)
    ){
      miraBones.leftArm=object;
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

function makeVehiclePlateMaterial(code){
  const canvas=document.createElement('canvas');
  canvas.width=320;
  canvas.height=96;
  const ctx=canvas.getContext('2d');
  ctx.fillStyle='#e9e8e1';
  ctx.fillRect(0,0,320,96);
  ctx.strokeStyle='rgba(54,58,58,.42)';
  ctx.lineWidth=5;
  ctx.strokeRect(5,5,310,86);
  ctx.fillStyle='#34393a';
  ctx.font='600 45px system-ui, -apple-system, sans-serif';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(code,160,50);
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=8;
  return new THREE.MeshStandardMaterial({
    color:0xffffff,
    map:texture,
    roughness:.55,
    metalness:.04,
    envMapIntensity:.14
  });
}

const vehiclePlateFrameMat=new THREE.MeshStandardMaterial({
  color:0x393e3e,
  roughness:.48,
  metalness:.48,
  envMapIntensity:.52
});

function addVehicleStreetDetails(entry,root,targetLength,index=0){
  root.updateMatrixWorld(true);
  const localBox=new THREE.Box3().setFromObject(root);
  const size=localBox.getSize(new THREE.Vector3());
  const width=Math.max(1.48,Math.min(1.95,size.x));
  const height=Math.max(1.20,Math.min(1.70,size.y));
  const plateNumbers=['NOVA 418','NOVA 263','NOVA 705','NOVA 932','NOVA 154','NOVA 681'];
  const plateMat=makeVehiclePlateMaterial(plateNumbers[index%plateNumbers.length]);

  // Plates sit on both ends because source assets do not expose a reliable
  // semantic "front" axis after normalization. One will naturally read as rear.
  [-1,1].forEach((side,index)=>{
    const frame=new THREE.Mesh(
      new THREE.BoxGeometry(width*.31,.19,.035),
      vehiclePlateFrameMat
    );
    frame.position.set(
      0,
      Math.max(.34,height*.27),
      side*(targetLength*.505)
    );
    entry.group.add(frame);

    const plate=new THREE.Mesh(
      new THREE.PlaneGeometry(width*.27,.145),
      plateMat
    );
    plate.position.set(
      0,
      frame.position.y,
      side*(targetLength*.524)
    );
    plate.rotation.y=side<0?Math.PI:0;
    entry.group.add(plate);
  });

  // A low dark mass inside the cabin stops transparent windows showing an
  // unnaturally empty bright shell when the camera passes close by.
  const cabinShade=new THREE.Mesh(
    new THREE.BoxGeometry(width*.66,height*.32,targetLength*.34),
    new THREE.MeshStandardMaterial({
      color:0x252a2a,
      roughness:.96,
      metalness:0,
      transparent:true,
      opacity:.50,
      depthWrite:false,
      envMapIntensity:.01
    })
  );
  cabinShade.position.set(0,height*.60,-targetLength*.035);
  entry.group.add(cabinShade);

  // Low underbody volume blocks daylight from leaking through the chassis and
  // makes the wheel/road gap read like a real car rather than a hollow shell.
  const underbody=new THREE.Mesh(
    new THREE.BoxGeometry(width*.72,.11,targetLength*.66),
    new THREE.MeshStandardMaterial({
      color:0x202424,
      roughness:.98,
      metalness:.015,
      envMapIntensity:.012
    })
  );
  underbody.position.set(0,.18,-.015);
  entry.group.add(underbody);

  // Seat/headrest silhouettes keep close glazing from reading as an empty shell.
  const seatMat=new THREE.MeshStandardMaterial({
    color:0x303433,
    roughness:.96,
    metalness:0,
    envMapIntensity:.012
  });
  [-.23,.23].forEach((sx,seatIndex)=>{
    const seatBack=new THREE.Mesh(
      new THREE.BoxGeometry(width*.18,height*.25,targetLength*.12),
      seatMat
    );
    seatBack.position.set(
      sx*width,
      height*.54,
      -targetLength*.055+(seatIndex?-.015:.010)
    );
    entry.group.add(seatBack);

    const headrest=new THREE.Mesh(
      new THREE.SphereGeometry(width*.065,10,8),
      seatMat
    );
    headrest.scale.set(.86,1.10,.78);
    headrest.position.set(
      sx*width,
      height*.72,
      -targetLength*.055+(seatIndex?-.015:.010)
    );
    entry.group.add(headrest);
  });

  if(entry.assetVariant==='secondary'){
    // Hatchback roof rails + rear wiper preserve a different silhouette even
    // after both vehicle paints are deliberately muted.
    const railMat=new THREE.MeshStandardMaterial({
      color:0x5f6665,
      roughness:.36,
      metalness:.58,
      envMapIntensity:.66
    });
    [-1,1].forEach(side=>{
      const rail=new THREE.Mesh(
        new THREE.BoxGeometry(.030,.035,targetLength*.43),
        railMat
      );
      rail.position.set(side*width*.27,height*.90,-targetLength*.035);
      rail.rotation.x=.006*side;
      entry.group.add(rail);
    });

    const wiper=new THREE.Mesh(
      new THREE.BoxGeometry(width*.27,.018,.022),
      railMat
    );
    wiper.position.set(0,height*.67,-targetLength*.495);
    wiper.rotation.z=-.18;
    entry.group.add(wiper);
  }else{
    const beltline=new THREE.Mesh(
      new THREE.BoxGeometry(width*.72,.024,.026),
      new THREE.MeshStandardMaterial({
        color:0x949a98,
        roughness:.34,
        metalness:.62,
        envMapIntensity:.70
      })
    );
    beltline.position.set(0,height*.58,targetLength*.22);
    entry.group.add(beltline);
  }

  if(!entry.userGroundShadow){
    entry.userGroundShadow=createAttachedContactShadow(
      entry.group,
      width*1.08,
      targetLength*.94,
      entry.baseSpeed===undefined?.085:.065
    );
  }
}

function attachCarAsset(entry,source,index=0,targetLength=3.85){
  const root=source.clone(true);
  prepareImportedModel(root,.72);
  normalizeCarAsset(root,targetLength);
  if(entry.assetVariant==='secondary'){
    root.scale.x*=.975;
    root.scale.y*=1.035;
  }else{
    root.scale.x*=1.012;
    root.scale.y*=.992;
  }
  root.updateMatrixWorld(true);
  const palette=[0xbfc3c0,0xd5ccbe,0xaebdc0,0xc7c6bf];
  entry.assetWheels=tuneVehicleAsset(root,entry.color ?? palette[index%palette.length]);
  entry.placeholderChildren?.forEach(child=>{child.visible=false;});
  entry.group.add(root);
  entry.assetRoot=root;
  entry.assetBaseY=root.position.y;
  addVehicleStreetDetails(entry,root,targetLength,index);
  if(entry.baseSpeed!==undefined && !entry.contactShadow && !entry.userGroundShadow){
    entry.contactShadow=createAttachedContactShadow(entry.group,1.82,targetLength*.96,.075);
  }
}

function attachWalkerAsset(entry,source,animations,index){
  const root=cloneAssetScene(source);
  prepareImportedModel(root,.20);
  normalizeHumanAsset(root,[1.68,1.63,1.60,1.71,1.58][index%5]);
  root.scale.x*=[.97,1.00,.96,1.02,.95][index%5];
  root.scale.z*=[.98,1.01,.97,1.00,.96][index%5];
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
  prepareImportedModel(root,.28);
  normalizeHumanAsset(root,1.71);
  tuneMiraAsset(root);
  root.rotation.y=Math.PI-.10;
  root.position.set(0,.004,.010);
  root.scale.x*=.975;
  root.scale.z*=.985;
  miraRig.visible=false;
  mira.add(root);
  miraGLBRoot=root;
  miraGLBBasePosition=root.position.clone();
  captureMiraBones(root);
  if(!mira.userData.glbContactShadow){
    mira.userData.glbContactShadow=createAttachedContactShadow(mira,.54,.36,.058);
  }

  if(!mira.userData.footContactShadows){
    const footShadowMat=new THREE.MeshBasicMaterial({
      color:0x1f2423,
      transparent:true,
      opacity:.078,
      depthWrite:false,
      toneMapped:true
    });
    mira.userData.footContactShadows=[-.095,.095].map((x,index)=>{
      const shadow=new THREE.Mesh(
        new THREE.CircleGeometry(.102,18),
        footShadowMat.clone()
      );
      shadow.scale.set(.88,1.28,1);
      shadow.rotation.x=-Math.PI/2;
      shadow.rotation.z=index?-.08:.08;
      shadow.position.set(x,.006,.016+(index?.010:-.006));
      mira.add(shadow);
      return shadow;
    });
  }

  // Only play an explicitly named idle animation. Keep it slower than the
  // source clip so Mira feels present in the street rather than "performing".
  const idleClip=animations.find(clip=>/idle|stand|breath/i.test(clip.name));
  if(idleClip){
    const mixer=new THREE.AnimationMixer(root);
    const idleAction=mixer.clipAction(idleClip);
    idleAction.setEffectiveTimeScale(.60);
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
  // Real compact/sedan dimensions make the curb and storefront scale read
  // correctly next to a 1.7m person. Previous lengths were slightly toy-like.
  return entry.assetVariant==='secondary'
    ? (parked?4.08:4.00)
    : (parked?4.38:4.30);
}

function scheduleWorldStream(task,delay=0){
  window.setTimeout(()=>{
    const run=()=>Promise.resolve().then(task).catch(error=>{
      console.warn('Deferred world asset failed:',error);
    });
    if('requestIdleCallback' in window){
      window.requestIdleCallback(run,{timeout:1400});
    }else{
      run();
    }
  },delay);
}

function initWorldGLBAssets(){
  if(worldGLBLoadStarted || !window.GLTFLoader) return;
  worldGLBLoadStarted=true;

  const loader=new window.GLTFLoader();
  const vehicleEntries=[...parkedCars,...movingTraffic];

  // Entry is never blocked by remote GLBs. The street shell is already usable;
  // authored assets progressively replace empty/fallback slots as they arrive.
  worldCoreAssetsReady=true;
  window.dispatchEvent(new Event('world-core-assets-ready'));

  // Priority 1: Mira is the focal subject, so her single GLB starts first.
  loadGLB(loader,WORLD_GLB_ASSETS.mira)
    .then(result=>attachMiraAsset(result.scene,result.animations))
    .catch(error=>{
      console.warn('Mira GLB failed; revealing procedural fallback.',error);
      miraRig.visible=true;
    });

  // Priority 2: load two genuinely different body shapes. Reusing one sedan for
  // every slot was a strong "game population" tell even after paint tuning.
  let primaryVehicleSource=null;

  scheduleWorldStream(async()=>{
    try{
      const result=await loadGLB(loader,WORLD_GLB_ASSETS.carPrimary);
      primaryVehicleSource=result.scene;
      vehicleEntries.forEach((entry,index)=>{
        if(entry.assetVariant!=='secondary' && !entry.assetRoot){
          attachCarAsset(entry,result.scene,index,carTargetLength(entry));
        }
      });
    }catch(error){
      console.warn('Primary vehicle GLB failed; trying compact fallback.',error);
      try{
        const fallback=await loadGLB(loader,WORLD_GLB_ASSETS.carFallback);
        primaryVehicleSource=fallback.scene;
        vehicleEntries.forEach((entry,index)=>{
          if(entry.assetVariant!=='secondary' && !entry.assetRoot){
            attachCarAsset(entry,fallback.scene,index,carTargetLength(entry));
          }
        });
      }catch(fallbackError){
        console.warn('Primary vehicle fallback failed.',fallbackError);
      }
    }
  },180);

  scheduleWorldStream(async()=>{
    const secondaryEntries=vehicleEntries.filter(entry=>entry.assetVariant==='secondary');
    if(!secondaryEntries.length) return;

    try{
      const result=await loadGLB(loader,WORLD_GLB_ASSETS.carSecondary);
      secondaryEntries.forEach((entry,index)=>{
        if(!entry.assetRoot){
          attachCarAsset(entry,result.scene,index+7,carTargetLength(entry));
        }
      });
    }catch(error){
      console.warn('Secondary vehicle GLB failed; reusing primary shape.',error);
      if(primaryVehicleSource){
        secondaryEntries.forEach((entry,index)=>{
          if(!entry.assetRoot){
            attachCarAsset(entry,primaryVehicleSource,index+7,carTargetLength(entry));
          }
        });
      }else{
        try{
          const fallback=await loadGLB(loader,WORLD_GLB_ASSETS.carFallback);
          secondaryEntries.forEach((entry,index)=>{
            if(!entry.assetRoot){
              attachCarAsset(entry,fallback.scene,index+7,carTargetLength(entry));
            }
          });
        }catch(fallbackError){
          console.warn('Secondary vehicle fallback failed.',fallbackError);
        }
      }
    }
  },520);

  // Two authored walkers arrive late and remain confined to the far ends of
  // the block. This adds life without creating an NPC crowd around Mira.
  const backgroundPedestrianEntries=ambientWalkers.slice(0,2);
  [
    [WORLD_GLB_ASSETS.pedestrianPrimary,backgroundPedestrianEntries[0],0,1650],
    [WORLD_GLB_ASSETS.pedestrianSecondary,backgroundPedestrianEntries[1],1,2250]
  ].forEach(([url,entry,index,delay])=>{
    if(!entry) return;
    scheduleWorldStream(async()=>{
      try{
        const result=await loadGLB(loader,url);
        attachWalkerAsset(entry,result.scene,result.animations,index);
      }catch(error){
        entry.group.visible=false;
        console.warn('Background pedestrian GLB failed; keeping the slot empty.',error);
      }
    },delay);
  });

  // CPU-side PMREM and the HDR download are pushed behind the focal assets so
  // they cannot delay the first interaction. Reflections upgrade seamlessly.
  scheduleWorldStream(()=>{
    ensureWorldAssetEnvironment();
  },650);
  scheduleWorldStream(()=>{
    installPhotographicSetExtensions();
  },900);
  scheduleWorldStream(()=>{
    loadPhotographicLeafCards();
  },1050);
  // On capable devices upgrade the fallback PMREM to a real outdoor HDR after
  // the focal world assets are already visible. Save-data / low-memory clients
  // keep the lightweight procedural reflection environment.
  const connection=navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const memory=navigator.deviceMemory;
  if(!connection?.saveData && (memory===undefined || memory>=6)){
    scheduleWorldStream(()=>{
      loadPhotographicEnvironment();
    },3600);
  }

  scheduleWorldStream(()=>{
    const targetPixelRatio=Math.min(window.devicePixelRatio,1.30);
    if(Math.abs(renderer.getPixelRatio()-targetPixelRatio)>.05){
      renderer.setPixelRatio(targetPixelRatio);
      renderer.setSize(window.innerWidth,window.innerHeight);
    }
  },2600);
  // Avoid the runtime HDR/PMREM upgrade. The smaller procedural environment is
  // visually sufficient and removes a large decode + GPU preprocessing hitch.
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
let yaw=.145, pitch=-.018, targetYaw=.145, targetPitch=-.018, turnImpulse=0;
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
  cameraFovTarget=43.0;
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

  tabletOpen=false; cameraFovTarget=44.0;
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
    document.body.classList.add('world-entered');
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
      // Human-scale walking speed keeps cars, storefronts and Mira from
      // feeling miniature. The older FPS pace made the block pass too quickly.
      velocity.x=THREE.MathUtils.lerp(velocity.x,x*1.72,1-Math.pow(.010,dt));
      velocity.z=THREE.MathUtils.lerp(velocity.z,z*1.72,1-Math.pow(.010,dt));
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

  const speed=Math.min(1,Math.hypot(velocity.x,velocity.z)/1.72);
  walkPhase += dt*(3.7+speed*4.8);
  // Real head motion is much smaller than common FPS camera bob. Keep enough
  // movement to feel embodied, but let the architecture stay visually stable.
  const walkBob = tabletOpen ? 0 : Math.sin(walkPhase*2)*.0062*speed;
  const walkSway = tabletOpen ? 0 : Math.sin(walkPhase)*.00145*speed;
  const breath = Math.sin(t*1.22)*.0021;

  camera.rotation.y=yaw;
  camera.rotation.x=pitch + Math.sin(walkPhase)*.00165*speed;
  camera.rotation.z=THREE.MathUtils.lerp(camera.rotation.z,-turnImpulse*.00022 + walkSway,.10);
  camera.position.y=baseEyeHeight + walkBob + breath;

  // Smooth field-of-view shift when focusing on the near tablet.
  camera.fov=THREE.MathUtils.lerp(camera.fov,cameraFovTarget,1-Math.pow(.001,dt));
  camera.updateProjectionMatrix();

  streetTreeCrowns.forEach((crown,i)=>{
    // Animate the crown as a mass. Individual leaf cards are instanced now,
    // which keeps hundreds of tiny JS transforms out of the hot frame loop.
    crown.rotation.z=Math.sin(t*.34+i*.9)*.0052;
    crown.rotation.x=Math.sin(t*.27+i*1.4)*.0040;
    crown.rotation.y=Math.sin(t*.19+i*.55)*.0024;
  });
  dappleTexture.offset.x=Math.sin(t*.052)*.0022;
  dappleTexture.offset.y=Math.cos(t*.044)*.0015;
  sunHaze.material.opacity=.34+Math.sin(t*.11)*.008;
  sun.intensity=2.92;

  skyClouds.forEach((cloud,index)=>{
    cloud.position.x+=dt*(.055+index*.018);
    if(cloud.position.x>46) cloud.position.x=-46-index*7;
  });

  // Keep curtain-wall reflections static. Real architecture reads more like a
  // photograph when large panes are stable; per-frame texture drift looked
  // synthetic and also dirtied the CPU hot path.

  worldAssetMixers.forEach(mixer=>mixer.update(dt));

  // A long-period playback drift hides the loop cadence of a short authored
  // idle clip without overriding its actual pose work.
  if(miraIdleAction){
    miraIdleAction.setEffectiveTimeScale(
      .590+
      Math.sin(t*.061+.8)*.014+
      Math.sin(t*.017+2.1)*.007
    );
  }

  movingTraffic.forEach((traffic,index)=>{
    // City traffic should breathe instead of travelling at a perfect loop speed.
    // Layered long-period waves create gentle accelerator/coast behaviour while
    // preserving the overall direction and keeping cars from stalling.
    const speedBreath=
      Math.sin(t*(Math.PI*2/traffic.speedCycle)+traffic.speedPhase)*.055+
      Math.sin(t*.083+traffic.motionPhase)*.020;
    const targetSpeed=traffic.baseSpeed*(1+speedBreath);
    traffic.speed=THREE.MathUtils.lerp(
      traffic.speed,
      targetSpeed,
      1-Math.pow(.018,dt)
    );
    traffic.group.position.z+=traffic.speed*dt;

    const laneOffset=
      Math.sin(t*.095+traffic.lanePhase)*traffic.laneWander+
      Math.sin(t*.041+traffic.motionPhase)*traffic.laneWander*.45;
    traffic.group.position.x=traffic.baseX+laneOffset;

    if(traffic.assetRoot){
      traffic.assetRoot.position.y=traffic.assetBaseY+Math.sin(t*2.1+traffic.motionPhase)*.0015;
      traffic.assetRoot.rotation.z=
        Math.sin(t*.31+traffic.motionPhase)*.0010-
        laneOffset*.008;
    }

    // Imported vehicle wheels are intentionally not rotated because many GLBs
    // use off-centre wheel pivots. Procedural fallback wheels remain safe to spin.
    const spin=traffic.speed*dt*2.8;
    if(!traffic.assetRoot){
      traffic.wheels?.forEach(wheel=>wheel.rotation.x-=spin);
    }

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
    const pace=
      1+
      Math.sin(t*.21+walker.pacePhase)*.032+
      Math.sin(t*.071+walker.phase*.13)*.018;
    const cycle=(t+walker.pauseOffset)%walker.pauseCycle;
    const farFromMira=Math.abs(walker.group.position.z-mira.position.z)>9.0;
    const shouldPause=Boolean(
      walker.assetRoot &&
      walker.idleAction &&
      farFromMira &&
      cycle>walker.pauseCycle-walker.pauseLength
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
      const wander=
        Math.sin(t*.19+walker.pacePhase)*walker.laneWander+
        Math.sin(t*.061+walker.phase)*walker.laneWander*.45;
      walker.group.position.x=walker.baseX+wander;

      // Paused pedestrians don't simply freeze: they subtly turn toward the
      // shopfront side, as if checking a window or reorienting before walking on.
      const browseYaw=walker.motionState==='idle'
        ? walker.idleFacingBias+walker.browseSide*(.14+index*.012)
        : wander*.28;
      walker.group.rotation.y=THREE.MathUtils.lerp(
        walker.group.rotation.y,
        browseYaw,
        1-Math.pow(walker.motionState==='idle'?.045:.10,dt)
      );
      walker.group.rotation.z=THREE.MathUtils.lerp(
        walker.group.rotation.z,
        walker.motionState==='idle'?walker.browseSide*.0025:0,
        1-Math.pow(.08,dt)
      );
      if(walker.walkAction && walker.motionState==='walk'){
        walker.walkAction.setEffectiveTimeScale(
          THREE.MathUtils.clamp(Math.max(.01,walker.speed)/.70,.68,.90)
        );
      }
    }else{
      walker.group.position.y=Math.abs(Math.sin(walker.phase))*0.012;
      walker.group.rotation.z=Math.sin(walker.phase)*.012;
    }

    if(walker.backgroundOnly){
      // Background figures never cross the focal 20m around Mira. They appear
      // and disappear at natural street depth instead of walking through the shot.
      if(walker.direction>0 && walker.group.position.z>-8.5){
        walker.group.position.z=-30-index*1.4;
        walker.speed=walker.baseSpeed;
        setWalkerMotionState(walker,'walk');
      }
      if(walker.direction<0 && walker.group.position.z<12.5){
        walker.group.position.z=31+index*1.4;
        walker.speed=walker.baseSpeed;
        setWalkerMotionState(walker,'walk');
      }
    }else{
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
  const storefrontAttention=
    Math.max(0,Math.sin(t*.071+1.15))*
    Math.max(0,Math.sin(t*.033+2.35))*
    (1-miraAttention);
  const ambientBodyLook=(
    Math.sin(t*.115+.7)*.034+
    Math.sin(t*.043+2.2)*.020+
    storefrontAttention*.048
  )*(1-miraAttention);
  const bodyAttention=miraAttention*.34;
  const miraYawTarget=
    THREE.MathUtils.lerp(miraBaseYaw,miraLookYaw,bodyAttention)+ambientBodyLook*.72;
  mira.rotation.y=THREE.MathUtils.lerp(
    mira.rotation.y,
    miraYawTarget,
    1-Math.pow(.10,dt)
  );

  // Focal lighting is distance-aware: enough facial separation up close, but
  // almost indistinguishable from ordinary daylight from across the block.
  const presence=1-THREE.MathUtils.smoothstep(miraDistance,2.4,10.5);
  // Keep Mira inside the same daylight exposure as the street. Near-field
  // assistance is now only a faint facial lift, not a game-style hero light.
  faceLight.intensity=.028+presence*.014;
  miraPresenceLight.intensity=.0028+presence*.0017;
  miraWarmBounce.intensity=.0030+presence*.0014;
  miraCoolRim.intensity=.0026+presence*.0011;

  if(miraGLBRoot && miraGLBBasePosition){
    const weightShift=
      Math.sin(t*.31+.6)*.72+
      Math.sin(t*.083+1.7)*.28;
    const slowBreath=Math.sin(t*.73);
    const stanceBias=Math.sin(t*.145+2.2);
    miraGLBRoot.position.x=miraGLBBasePosition.x+weightShift*.0058;
    miraGLBRoot.position.y=miraGLBBasePosition.y+slowBreath*.0013-Math.abs(weightShift)*.00045;
    miraGLBRoot.position.z=miraGLBBasePosition.z+stanceBias*.0021;
    miraGLBRoot.rotation.z=weightShift*.0018;
    miraGLBRoot.rotation.x=Math.sin(t*.27)*.0011;

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
    const relativePlayerYaw=THREE.MathUtils.clamp(miraLookYaw-mira.rotation.y,-.30,.30);
    const ambientHeadYaw=(
      Math.sin(t*.19+1.8)*.055+
      Math.sin(t*.071+.2)*.030+
      storefrontAttention*.070
    )*(1-miraAttention);
    const headYaw=relativePlayerYaw*miraAttention*.58+ambientHeadYaw;
    const headPitch=
      Math.sin(t*.16+.9)*.012*(1-miraAttention)-
      greetingEnvelope*.026+
      replyAttention*.014;
    const neckYaw=headYaw*.22;
    const chestYaw=headYaw*.025;
    const chestRoll=weightShift*.0026-greetingEnvelope*.003;

    // Hips and upper legs carry most of the idle weight transfer. The values
    // stay tiny so authored animation remains dominant, but the silhouette no
    // longer feels like a rigid model rotating from the root.
    const hipRoll=weightShift*.0075;
    const hipYaw=stanceBias*.0028;
    const legCounter=weightShift*.0048;
    applyMiraBoneOffset(miraBones.hips,0,hipYaw,hipRoll);
    applyMiraBoneOffset(miraBones.leftUpperLeg,legCounter*.32,0,-legCounter);
    applyMiraBoneOffset(miraBones.rightUpperLeg,-legCounter*.18,0,legCounter*.82);

    applyMiraBoneOffset(miraBones.chest,slowBreath*.0018,chestYaw,chestRoll);
    applyMiraBoneOffset(miraBones.neck,headPitch*.24,neckYaw,0);
    applyMiraBoneOffset(miraBones.head,headPitch,headYaw,Math.sin(t*.21)*.003);

    // The non-greeting arm participates in the stance. A small opposing motion
    // keeps both shoulders alive without turning the idle into an animation loop.
    const leftArmBreath=Math.sin(t*.43+2.1)*.0030;
    // Relax clavicles first, then keep the upper arms close to the rib cage.
    // This counters the source idle's slightly open presentation pose without
    // freezing the hands or flattening the breathing motion.
    applyMiraBoneOffset(miraBones.leftShoulder,.010,-.006,.030);
    applyMiraBoneOffset(miraBones.rightShoulder,.010,.006,-.030);
    applyMiraBoneOffset(
      miraBones.leftArm,
      -.022+leftArmBreath,
      .001-weightShift*.0015,
      .125+weightShift*.002
    );
    applyMiraBoneOffset(
      miraBones.leftForeArm,
      -.014+slowBreath*.0025,
      0,
      -.006
    );

    // Greeting now comes mostly from the elbow/wrist; the shoulder stays tucked
    // so Mira never opens into a theatrical or mannequin-like silhouette.
    applyMiraBoneOffset(
      miraBones.rightArm,
      -.018+greetingEnvelope*.010,
      -greetingEnvelope*.004,
      -.125-greetingEnvelope*.010
    );
    applyMiraBoneOffset(
      miraBones.rightForeArm,
      -.014-greetingEnvelope*.085,
      0,
      greetingEnvelope*.006
    );

    const shadow=mira.userData.glbContactShadow;
    if(shadow){
      const settle=.985+Math.cos(t*.37+.6)*.012;
      shadow.scale.set(settle,settle,1);
      shadow.material.opacity=.92+Math.sin(t*.37+.6)*.025;
    }

    mira.userData.footContactShadows?.forEach((footShadow,index)=>{
      const footWeight=index===0
        ? .104+weightShift*.020
        : .104-weightShift*.020;
      footShadow.material.opacity=THREE.MathUtils.clamp(footWeight,.078,.132);
      const loaded=index===0?weightShift:-weightShift;
      footShadow.scale.x=.94+loaded*.034;
      footShadow.scale.y=1.48+loaded*.055;
      footShadow.position.x=(index===0?-.095:.095)+loaded*.006;
    });
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
