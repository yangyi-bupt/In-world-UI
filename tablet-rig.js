// Tablet interaction state machine.
(function(){
  window.createTabletRigController=function(viewModel){
    let state='IDLE';
    return {
      raise(){
        if(state==='IDLE'){
          state='RAISING';
          viewModel.setState('RAISING');
        }
      },
      lower(){
        if(state==='HOLDING'){
          state='LOWERING';
          viewModel.setState('LOWERING');
        }
      },
      toggle(){
        if(state==='IDLE') this.raise();
        else if(state==='HOLDING') this.lower();
      },
      update(){
        state=viewModel.state;
      },
      get state(){return state;}
    };
  };
})();
