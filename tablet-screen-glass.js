// V4.2 preparation: improve tablet screen material feeling.
// This keeps the current HTML UI working while adding a hardware-like glass layer.
(function(){
  window.enhanceTabletScreen=function(){
    const screen=document.querySelector('#screen');
    if(!screen || screen.dataset.glassReady) return;
    screen.dataset.glassReady='true';

    const glass=document.createElement('div');
    glass.className='tablet-glass-reflection';
    screen.appendChild(glass);
  };
})();
