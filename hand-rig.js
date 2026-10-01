// First-person hand placeholder rig.
// Kept as a separate module so real GLB hand assets can replace it later.
(function(){
  window.createHandRig = function(){
    const root = new THREE.Group();
    root.name = 'FirstPersonHands';

    const skin = new THREE.MeshStandardMaterial({
      color: 0xb9826f,
      roughness: 0.72,
      metalness: 0
    });

    function hand(side){
      const group = new THREE.Group();
      group.name = side + '_hand';

      const palm = new THREE.Mesh(
        new THREE.SphereGeometry(0.11, 16, 12),
        skin
      );
      palm.scale.set(0.75,1.25,0.55);
      palm.position.set(side === 'left' ? -0.38 : 0.38,-0.38,-0.62);
      group.add(palm);

      const thumb = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.018,0.12,6,10),
        skin
      );
      thumb.rotation.z = side === 'left' ? -0.8 : 0.8;
      thumb.position.set(side === 'left' ? -0.29 : 0.29,-0.36,-0.70);
      group.add(thumb);

      root.add(group);
      return group;
    }

    hand('left');
    hand('right');

    return {
      object: root,
      update(time, holding){
        root.visible = holding;
        if(!holding) return;
        root.position.y = Math.sin(time * 1.1) * 0.004;
        root.rotation.z = Math.sin(time * .7) * 0.004;
      }
    };
  };
})();
