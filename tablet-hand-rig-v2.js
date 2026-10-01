// Tablet hand binding layer v2
// Connects tablet motion state with first-person hand rig.
(function(){
  window.bindTabletToHandRig=function(handRig, tabletRig){
    if(!handRig || !tabletRig) return null;

    const mount=new THREE.Group();
    mount.name='TabletHandMount';
    mount.position.set(0.22,-0.12,-0.28);
    mount.rotation.set(-0.22,0.18,-0.08);

    tabletRig.position.set(0,0,0);
    mount.add(tabletRig);
    handRig.add(mount);

    return {
      mount,
      update(time,holding){
        mount.visible=holding;
        if(!holding) return;
        mount.rotation.x=-0.22+Math.sin(time*0.8)*0.008;
        mount.rotation.z=-0.08+Math.sin(time*0.65)*0.006;
        mount.position.y=-0.12+Math.sin(time*1.1)*0.003;
      }
    };
  };
})();
