(function(){
  // V4.2.4 helper: attaches CanvasTexture to a real Three.js screen mesh.
  // Kept separate to avoid breaking the existing tablet hardware renderer.
  window.attachTabletScreenMesh=function(parent, tabletTexture){
    if(!parent || !tabletTexture || !window.THREE) return null;

    const geometry = new THREE.PlaneGeometry(2.48,1.66);
    const material = new THREE.MeshPhysicalMaterial({
      map: tabletTexture.texture || tabletTexture,
      roughness:0.16,
      metalness:0.02,
      clearcoat:1,
      clearcoatRoughness:0.06
    });

    const screen = new THREE.Mesh(geometry, material);
    screen.position.z = 0.108;
    screen.name = 'tablet-live-screen';
    parent.add(screen);

    return screen;
  };
})();
