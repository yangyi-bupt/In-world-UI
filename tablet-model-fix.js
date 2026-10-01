// Compatibility layer: #tablet3d is a DOM container, not a canvas.
// Create a real canvas before the tablet renderer initializes.
(function(){
  const original = window.createTablet3DController;
  if(!original) return;

  window.createTablet3DController = function(target){
    if(target && typeof target.getContext !== 'function'){
      let canvas = target.querySelector('canvas');
      if(!canvas){
        canvas = document.createElement('canvas');
        canvas.style.width='100%';
        canvas.style.height='100%';
        canvas.style.display='block';
        target.appendChild(canvas);
      }
      target = canvas;
    }
    return original(target);
  };
})();
