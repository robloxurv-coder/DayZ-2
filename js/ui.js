'use strict';
(() => {
  const W=WL,G=W.game,$=id=>document.getElementById(id);
  const UI=W.ui={modal:null,loot:null,selected:null,returnModal:null,lastFocus:null,toastTimer:null};
  UI.toast=function(text){$('global-toast').textContent=text;$('global-toast').classList.remove('hidden');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>$('global-toast').classList.add('hidden'),3200);};
  UI.notify=function(text,type='normal'){
    if(this.modal){this.toast(text);return;}
    const node=document.createElement('div');node.className='notification'+(type==='warn'?' warn':'');node.textContent=text;$('notifications').appendChild(node);while($('notifications').children.length>4)$('notifications').firstChild.remove();setTimeout(()=>node.remove(),4600);
  };
  UI.showGame=function(){$('menu-screen').classList.add('hidden');$('game-hud').classList.remove('hidden');$('notifications').replaceChildren();document.body.classList.add('playing');$('world-canvas').style.cursor='none';};
  UI.showMenu=function(){this.closeModal(true);G.running=false;G.paused=false;G.keys={};G.firing=false;G.placement=null;W.audio.setRain(false);$('menu-screen').classList.remove('hidden');$('game-hud').classList.add('hidden');document.body.classList.remove('playing');$('world-canvas').style.cursor='default';$('play-button').focus();};
  UI.openModal=function(name){
    if(!this.modal)this.lastFocus=document.activeElement;
    document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));$('modal-backdrop').classList.remove('hidden');$(name+'-modal').classList.remove('hidden');this.modal=name;G.keys={};G.firing=false;if(G.player){G.player.vx=0;G.player.vy=0;}if(G.running)G.paused=true;W.audio.setRain(false);
    const focus=$(name+'-modal').querySelector('button,input,select');if(focus)focus.focus();
  };
  UI.closeModal=function(force=false){
    if(!force&&this.modal==='death')return;
    if(!force&&this.modal==='settings'&&this.returnModal){const next=this.returnModal;this.returnModal=null;this.openModal(next);return;}
    document.querySelectorAll('.modal').forEach(m=>m.classList.add('hidden'));$('modal-backdrop').classList.add('hidden');this.modal=null;this.returnModal=null;G.keys={};if(G.running&&G.player.health>0){G.paused=false;W.audio.setRain(G.weather==='rain');}
    if(this.lastFocus&&this.lastFocus.isConnected&&!force)this.lastFocus.focus();this.lastFocus=null;
  };
  UI.updateHUD=function(){
    if(!G.player)return;const p=G.player;
    ['health','hunger','thirst','stamina'].forEach(id=>{$(id+'-value').textContent=Math.ceil(p[id]);$(id+'-bar').style.width=p[id]+'%';$('vital-'+id).classList.toggle('low',p[id]<25);});
    $('temperature-value').textContent=p.temperature.toFixed(1)+'°';$('temperature-value').style.color=p.temperature<35?'#d08b63':'';$('bleeding-status').classList.toggle('hidden',!p.bleeding);
    $('ammo-value').textContent=p.ammo.toString().padStart(2,'0');$('reserve-value').textContent='/ '+(G.inventory[W.weapon()?.ammoType]||0);$('reload-label').innerHTML=p.reload>0?'RECARREGANDO…':'<kbd>R</kbd> RECARREGAR';
    $('location-label').textContent=G.location();const hour=G.hour();$('time-label').textContent=String(Math.floor(hour)).padStart(2,'0')+':'+String(Math.floor(hour%1*60)).padStart(2,'0');$('weather-label').textContent=G.weather==='rain'?'☂ CHUVA · PROCURE ABRIGO':G.nightAmount()>.5?'☾ ANOITECER · VISIBILIDADE BAIXA':'☀ CÉU ABERTO';
    $('fps-label').classList.toggle('hidden',!W.settings.showFPS);$('fps-label').textContent=Math.round(G.frameRate)+' FPS';
    const danger=G.world.enemies.some(e=>!e.dead&&e.state==='chase'&&W.distance(e,p)<360);$('danger-alert').classList.toggle('hidden',!danger);
    const target=G.target;$('interaction-prompt').classList.toggle('hidden',!target);if(target){let text='SAQUEAR';if(target.type==='door')text=target.building.doorOpen?'FECHAR PORTA':'ABRIR PORTA';if(target.type==='crate')text=target.looted?'VAZIO — JÁ SAQUEADO':'SAQUEAR · '+target.name.toUpperCase();if(target.type==='chest')text='ABRIR BAÚ · ARMAZENAMENTO';if(target.type==='fire')text=(target.lit?'ALIMENTAR FOGUEIRA':'ACENDER FOGUEIRA')+' · 1 MADEIRA';$('interaction-prompt').querySelector('span').textContent=text;}
    W.renderer.minimap(G);
  };
  UI.openInventory=function(){if(!G.running||G.player.health<=0)return;this.selected=null;this.renderInventory();this.openModal('inventory');};
  UI.renderInventory=function(){
    const grid=$('inventory-grid');grid.replaceChildren();const entries=Object.entries(G.inventory).filter(([id,q])=>q>0);$('slots-count').textContent=entries.length+' / 12 SLOTS';
    for(let i=0;i<12;i++){
      const btn=document.createElement('button');btn.className='inventory-slot';
      if(entries[i]){const [id,qty]=entries[i],item=W.items[id];btn.classList.toggle('selected',this.selected===id);btn.setAttribute('aria-label',item.name+', quantidade '+qty);btn.innerHTML=`<span class="item-quantity">×${qty}</span><span class="item-icon">${item.icon}</span><span class="item-name">${item.name}</span>`;btn.onclick=()=>{this.selected=id;this.renderInventory();};}
      else{btn.classList.add('empty-slot');btn.textContent='+';btn.disabled=true;btn.setAttribute('aria-label','Slot vazio');}grid.appendChild(btn);
    }
    const details=$('item-details');details.replaceChildren();if(this.selected&&G.inventory[this.selected]>0){const item=W.items[this.selected],info=document.createElement('div');info.innerHTML=`<strong>${item.name}</strong>${item.description}`;details.appendChild(info);if(item.usable){const use=document.createElement('button');use.textContent=this.selected==='water'?'BEBER':this.selected==='food'?'COMER':'USAR';use.onclick=()=>{G.useItem(this.selected);this.renderInventory();};details.appendChild(use);}}
    else{this.selected=null;details.textContent='Selecione um item para ver detalhes e usar.';}
  };
  UI.openLoot=function(crate){this.loot=crate;this.renderLoot();this.openModal('loot');};
  UI.takeLoot=function(index){const c=this.loot,entry=c.items[index];if(!entry||!G.addItem(entry.id,entry.qty))return;this.toast(`Você encontrou ${entry.qty} × ${W.items[entry.id].name.toLowerCase()}.`);c.items.splice(index,1);W.audio.play('loot');this.finishLoot();};
  UI.finishLoot=function(){if(this.loot.items.length===0){this.loot.looted=true;G.looted++;this.closeModal();}else this.renderLoot();this.updateHUD();};
  UI.renderLoot=function(){const c=this.loot;$('loot-source').textContent=c.name;$('loot-list').replaceChildren();c.items.forEach((entry,i)=>{const b=document.createElement('button');b.className='loot-item';b.innerHTML=`<span class="item-icon">${W.items[entry.id].icon}</span><span>${W.items[entry.id].name}</span><span>×${entry.qty} &nbsp; ↓</span>`;b.onclick=()=>this.takeLoot(i);$('loot-list').appendChild(b);});};
  UI.showDeath=function(){$('death-summary').textContent=`Sobreviveu por ${Math.floor(G.elapsed/60)}min ${Math.floor(G.elapsed%60)}s. ${G.kills} infectado(s) neutralizado(s). ${G.looted} ponto(s) saqueado(s).`;this.openModal('death');};
  UI.settings=function(from=null){this.returnModal=from;$('volume-input').value=Math.round(W.settings.volume*100);$('volume-value').textContent=Math.round(W.settings.volume*100)+'%';$('quality-input').value=W.settings.quality;$('fps-input').checked=W.settings.showFPS;this.openModal('settings');};
  function saveSettings(){W.config.persist();W.audio.setVolume(W.settings.volume);$('menu-sound').textContent=W.settings.volume>0?'♫':'♪';$('menu-sound').setAttribute('aria-label',W.settings.volume>0?'Desativar áudio':'Ativar áudio');}
  $('play-button').onclick=()=>G.start();$('about-play').onclick=()=>G.start();$('respawn-button').onclick=()=>G.start();$('settings-button').onclick=()=>UI.settings();$('about-button').onclick=()=>UI.openModal('about');$('about-link').onclick=e=>{e.preventDefault();UI.openModal('about');};
  $('pause-button').onclick=()=>UI.openModal('pause');$('resume-button').onclick=()=>UI.closeModal();$('exit-button').onclick=()=>UI.showMenu();$('pause-settings').onclick=()=>UI.settings('pause');$('inventory-button').onclick=()=>UI.openInventory();
  document.querySelectorAll('.close-modal').forEach(b=>b.onclick=()=>UI.closeModal());
  $('volume-input').oninput=e=>{W.audio.init();W.settings.volume=Number(e.target.value)/100;$('volume-value').textContent=e.target.value+'%';saveSettings();};$('volume-input').onchange=()=>W.audio.play('loot');
  $('quality-input').onchange=e=>{W.settings.quality=e.target.value;saveSettings();};$('fps-input').onchange=e=>{W.settings.showFPS=e.target.checked;saveSettings();};
  let previousVolume=.5;$('menu-sound').onclick=()=>{W.audio.init();if(W.settings.volume>0){previousVolume=W.settings.volume;W.settings.volume=0;}else W.settings.volume=previousVolume;saveSettings();if(W.settings.volume>0)W.audio.play('loot');};
  $('fullscreen-button').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else UI.toast('Tela cheia não é suportada neste navegador.');}catch(e){UI.toast('O navegador bloqueou a tela cheia. Tente abrir o jogo em uma aba própria.');}};
  $('take-all-button').onclick=()=>{const c=UI.loot;let total=0;c.items=c.items.filter(entry=>{if(G.addItem(entry.id,entry.qty)){total+=entry.qty;return false;}return true;});if(total){W.audio.play('loot');UI.toast(`${total} itens coletados. Guarde bem seus suprimentos.`);}UI.finishLoot();};
  document.addEventListener('keydown',e=>{
    const key=e.key.toLowerCase();
    if(key==='escape'){
      e.preventDefault();if(G.placement){G.placement=null;return;}if(UI.modal)UI.closeModal();else if(G.running)UI.openModal('pause');return;
    }
    if(key==='tab'&&G.running&&(!UI.modal||UI.modal==='inventory')){e.preventDefault();if(e.repeat)return;if(UI.modal==='inventory')UI.closeModal();else UI.openInventory();return;}
    if(UI.modal){
      // Focus containment for keyboard-accessible dialogs.
      if(key==='tab'){const nodes=[...$(UI.modal+'-modal').querySelectorAll('button:not(:disabled),input,select')].filter(n=>n.offsetParent!==null);const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}
      return;
    }
    if(!G.running)return;if(['w','a','s','d','shift','e','r',' '].includes(key))e.preventDefault();
    if(['w','a','s','d','shift'].includes(key))G.keys[key]=true;if(e.repeat)return;if(key==='e')G.interact();if(key==='r')G.reload();
  });
  document.addEventListener('keyup',e=>{G.keys[e.key.toLowerCase()]=false;});
  $('world-canvas').addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;G.mouse.x=e.clientX;G.mouse.y=e.clientY;G.touchAim=false;});
  $('world-canvas').addEventListener('pointerdown',e=>{if(e.button!==0||!G.running||G.paused)return;if(G.placement){const r=W.renderer;W.base.place(G.placement,e.clientX/(r.zoom||1)+r.camera.x,e.clientY/(r.zoom||1)+r.camera.y);return;}G.firing=true;W.audio.init();if(e.pointerType==='touch'){G.touchAim=true;const z=W.renderer.zoom||1;G.player.angle=Math.atan2(e.clientY/z+W.renderer.camera.y-G.player.y,e.clientX/z+W.renderer.camera.x-G.player.x);}else{G.mouse.x=e.clientX;G.mouse.y=e.clientY;const z=W.renderer.zoom||1;G.player.angle=Math.atan2(e.clientY/z+W.renderer.camera.y-G.player.y,e.clientX/z+W.renderer.camera.x-G.player.x);}G.shoot(false);});
  window.addEventListener('pointerup',()=>G.firing=false);window.addEventListener('pointercancel',()=>G.firing=false);
  $('world-canvas').addEventListener('contextmenu',e=>e.preventDefault());
  document.querySelectorAll('[data-key]').forEach(b=>{const key=b.dataset.key;b.addEventListener('pointerdown',e=>{e.preventDefault();if(!G.running||G.paused)return;W.audio.init();G.touchAim=true;G.keys[key]=true;b.setPointerCapture(e.pointerId);});const end=()=>G.keys[key]=false;b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('lostpointercapture',end);});
  $('touch-shoot').onclick=()=>G.shoot(true);$('touch-interact').onclick=()=>G.interact();$('touch-reload').onclick=()=>G.reload();
  const autoPause=()=>{G.keys={};G.firing=false;if(G.running&&!G.paused&&G.player.health>0)UI.openModal('pause');};window.addEventListener('blur',autoPause);document.addEventListener('visibilitychange',()=>{if(document.hidden)autoPause();});
  saveSettings();
})();
