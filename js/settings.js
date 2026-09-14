'use strict';
(() => {
  const W=WL,defaults={volume:.5,quality:'high',showFPS:false,shaders:true,particles:'medium',rain:true,shadows:true,numbers:true};
  W.config={
    key:'wasteland-settings',
    normalize(s={}){const result={...defaults};if(!s||typeof s!=='object')return result;if(Number.isFinite(s.volume))result.volume=Math.max(0,Math.min(1,s.volume));for(const k of ['quality','particles'])if(['low','medium','high'].includes(s[k]))result[k]=s[k];for(const k of ['showFPS','shaders','rain','shadows','numbers'])if(typeof s[k]==='boolean')result[k]=s[k];return result;},
    load(){try{return this.normalize(JSON.parse(localStorage.getItem(this.key)||'{}'));}catch(e){return {...defaults};}},
    persist(){W.settings=this.normalize(W.settings);W.audio?.setVolume(W.settings.volume);try{localStorage.setItem(this.key,JSON.stringify(W.settings));return true;}catch(e){W.ui?.toast('Configurações aplicadas, mas o navegador bloqueou a gravação.');return false;}},
    budget(){const reduced=W.game?.adaptiveLow||W.settings.quality==='low',level=reduced?'low':W.settings.particles;return {shaders:W.settings.shaders&&!reduced,shadows:W.settings.shadows&&!reduced,rain:W.settings.rain,particleCount:level==='high'?8:level==='medium'?5:2,particleCap:level==='high'?180:level==='medium'?90:40,rainCount:reduced?24:W.settings.quality==='medium'?55:100};}
  };
  W.settings=W.config.load();
})();
