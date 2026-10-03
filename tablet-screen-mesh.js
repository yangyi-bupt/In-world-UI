(function(){
  // V4.2.4 helper: attaches CanvasTexture to a real Three.js screen mesh.
  // Kept separate to avoid breaking the existing tablet hardware renderer.
  window.attachTabletScreenMesh=function(parent, tabletTexture){
    if(!parent || !tabletTexture || !window.THREE) return null;

    const geometry = new THREE.PlaneGeometry(2.48,1.66);
    // The UI layer itself is intentionally unlit. Using a physical material
    // here caused the tablet's front point light to create a hot white specular
    // spot over text. Glass/reflection effects are rendered by separate overlay
    // meshes so readability is never sacrificed.
    const material = new THREE.MeshBasicMaterial({
      map: tabletTexture.texture || tabletTexture,
      // Slightly warm display white avoids an emissive paper-white rectangle
      // against the daylight scene while preserving UI contrast.
      color:0xf7f5ef,
      toneMapped:false
    });

    const screen = new THREE.Mesh(geometry, material);
    screen.position.z = 0.108;
    screen.name = 'tablet-live-screen';
    parent.add(screen);

    return screen;
  };
})();
