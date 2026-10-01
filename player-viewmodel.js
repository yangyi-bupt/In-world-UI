// First-person viewmodel foundation.
// Keeps hands/devices in camera space instead of UI overlay space.
(function(){
  window.createPlayerViewModel = function(camera){
    const root = new THREE.Group();
    root.name = 'PlayerViewModel';
    camera.add(root);

    const tabletRig = new THREE.Group();
    tabletRig.name = 'TabletRig';
    tabletRig.position.set(0.34,-0.30,-0.75);
    tabletRig.rotation.set(-0.12,-0.08,0);
    root.add(tabletRig);

    const skin = new THREE.MeshStandardMaterial({color:0xb9826f,roughness:.8});
    function arm(x){
      const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(.065,.42,8,12),skin);
      mesh.position.set(x,-.38,-.48);
      mesh.rotation.z=x>0?-0.25:0.25;
      mesh.visible=false;
      root.add(mesh);
      return mesh;
    }
    const left=arm(-.32), right=arm(.32);

    let state='IDLE';
    let progress=0;
    const hidden = new THREE.Vector3(.5,-.55,-.15);
    const shown = new THREE.Vector3(.34,-.30,-.75);

    function setState(next){ state=next; }
    function update(dt,time){
      if(state==='RAISING'){
        progress=Math.min(1,progress+dt*1.6);
        tabletRig.position.lerpVectors(hidden,shown,1-Math.pow(1-progress,3));
        if(progress>=1) state='HOLDING';
      }
      if(state==='LOWERING'){
        progress=Math.max(0,progress-dt*1.8);
        tabletRig.position.lerpVectors(hidden,shown,progress);
        if(progress<=0) state='IDLE';
      }
      if(state==='HOLDING'){
        tabletRig.rotation.y=Math.sin(time*0.7)*0.012;
        tabletRig.position.y=shown.y+Math.sin(time*1.4)*0.004;
      }
      const visible=state!=='IDLE';
      left.visible=visible; right.visible=visible;
    }
    return {root,tabletRig,setState,update,get state(){return state;}};
  };
})();
