// Centralized UI binding layer
// Keeps DOM lookup failures from breaking the game loop.
window.UI = (() => {
  const pick = (selector) => document.querySelector(selector);

  return {
    canvas: pick('#game'),
    startOverlay: pick('#startOverlay'),
    startBtn: pick('#startBtn'),
    tabletLayer: pick('#tabletLayer'),
    tablet: pick('#tablet'),
    closeTablet: pick('#closeTablet'),
    screen: pick('#screen'),
    clock: pick('#clock'),
    messageForm: pick('#messageForm'),
    messageInput: pick('#messageInput'),
    messageList: pick('#messageList'),
    modeLabel: pick('#modeLabel'),
    crosshair: pick('#crosshair'),
    hint: pick('#hint'),
  };
})();
