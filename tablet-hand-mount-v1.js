(function(){
  function install(){
    if(window.__tabletHandMountInstalled) return;
    window.__tabletHandMountInstalled=true;

    window.createTabletHandMount=function(tablet){
      if(!tablet) return null;
      const state={active:false, t:0};
      const home=new THREE.Vector3();
      const homeRot=new THREE.Euler();
      const targetPos=new THREE.Vector3(0.0,-0.12,-0.55);
      const targetRot=new THREE.Euler(-0.12,0.02,0);

      return {
        attach(){
          home.copy(tablet.position);
          homeRot.copy(tablet.rotation);
          state.active=true;
        },
        detach(){
          state.active=false;
        },
        update(dt,time){
          if(!state.active) return;
          const s=1-Math.pow(0.001,dt);
          tablet.position.lerp(targetPos,s);
          tablet.rotation.x=THREE.MathUtils.lerp(tablet.rotation.x,targetRot.x,s);
          tablet.rotation.y=THREE.MathUtils.lerp(tablet.rotation.y,targetRot.y,s);
          tablet.rotation.z=Math.sin(time*0.8)*0.006;
        }
      };
    };
  }
  install();
})();
