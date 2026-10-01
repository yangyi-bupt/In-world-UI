// Emergency start bridge: keeps the demo enter button functional even if a later module fails.
window.addEventListener('DOMContentLoaded',()=>{
  const btn=document.querySelector('#startBtn');
  const overlay=document.querySelector('#startOverlay');
  const canvas=document.querySelector('#game');
  if(!btn || !overlay) return;
  btn.addEventListener('click',()=>{
    window.__ENTER_CLICKED__=true;
    overlay.classList.add('hidden');
    window.__WORLD_STARTED__=true;
    setTimeout(()=>canvas?.requestPointerLock?.(),250);
  }, {once:false});
});
