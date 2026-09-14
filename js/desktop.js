'use strict';
// Desktop presentation and commands; all mutations delegate to gameplay modules.
(() => {
  const W=WL,G=W.game,U=W.ui,$=id=>document.getElementById(id);
  const categories={all:'Tudo',weapons:'Armas',food:'Comida',water:'Água',medicine:'Medicina',equipment:'Equipamentos',resources:'Recursos'};
  const button=(label,fn,cls='')=>{const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;return b;};
  const saved=()=>{const s=W.save.read();$('continue-button').classList.toggle('hidden',!s);$('delete-save').classList.toggle('hidden',!s&&!W.save.error);$('save-status').textContent=s?`SAVE LOCAL · ${new Date(s.savedAt).toLocaleString('pt-BR')} · ${s.map.name}`:W.save.error||'Save local neste navegador · nenhum envio de dados.';};
  const persist=()=>{const ok=W.save.write();U.toast(ok?'Partida salva neste navegador.':'Não foi possível salvar: '+W.save.error);return ok;};
  const newGame=(data=W.maps.valley)=>{if(W.save.read()&&!confirm('Iniciar novo jogo substitui o save local atual. Continuar?'))return;G.start(data);if(!W.save.write()&&!W.save.disabled)U.toast('Jogo iniciado sem save: '+W.save.error);};
  $('play-button').onclick=()=>newGame();$('about-play').onclick=()=>newGame();$('respawn-button').onclick=()=>{G.start(G.world?.data||W.maps.valley);persist();};
  $('continue-button').onclick=()=>{W.audio.init();if(!W.save.load()){U.toast(W.save.error||'Nenhum save encontrado.');saved();}};
  $('delete-save').onclick=()=>{if(confirm('Excluir permanentemente a partida salva neste navegador?')){if(!W.save.remove())U.toast(W.save.error);saved();}};
  $('save-button').onclick=persist;
  $('exit-button').onclick=()=>{if(!persist()&&!confirm('Não foi possível salvar. Sair mesmo assim?'))return;U.showMenu();saved();};
  $('import-map-button').onclick=()=>$('import-map').click();
  $('import-map').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;if(f.size>1500000)throw Error('Arquivo grande demais (máximo 1,5 MB).');const d=W.map.validate(JSON.parse(await f.text()));newGame(d);}catch(err){U.toast('Mapa não carregado: '+err.message);}e.target.value='';};
  U.openBase=function(){if(!G.running||G.player.health<=0)return;$('base-recipes').replaceChildren();for(const [id,r] of Object.entries(W.base.recipes)){
    const b=button(r.name+' · '+Object.entries(r.cost).map(([k,q])=>q+' '+W.items[k].name).join(' + '),()=>{U.closeModal();G.placement=id;},'loot-item');$('base-recipes').appendChild(b);
  }this.openModal('base');};$('base-button').onclick=()=>U.openBase();
  U.openStorage=function(chest){this.chest=chest;this.renderStorage();this.openModal('storage');};
  U.renderStorage=function(){const chest=this.chest;$('storage-capacity').textContent=chest.storage.length+'/16';
    for(const [id,items,toChest] of [['storage-deposit',W.inventory.sync(),true],['storage-withdraw',chest.storage,false]]){
      const node=$(id);node.replaceChildren();items.forEach((s,i)=>node.appendChild(button(`${W.items[s.id].name} ×${s.qty}`,()=>{if(!W.base.transfer(chest,i,toChest))U.toast('Sem espaço, item equipado ou baú distante.');this.renderStorage();},'loot-item')));if(!items.length)node.textContent='Vazio.';
    }
  };
  U.category='all';U.selectedIndex=-1;
  U.renderInventory=function(){
    const stacks=W.inventory.sync(),capacity=W.equipment.capacity(),grid=$('inventory-grid');grid.replaceChildren();$('slots-count').textContent=stacks.length+' / '+capacity+' SLOTS';
    $('inventory-categories').replaceChildren();for(const [key,label] of Object.entries(categories))$('inventory-categories').appendChild(button(label,()=>{this.category=key;this.renderInventory();},this.category===key?'active':''));
    for(let i=0;i<capacity;i++){
      const s=stacks[i],b=document.createElement('button');b.className='inventory-slot';b.dataset.index=i;
      if(s){const item=W.items[s.id];b.dataset.category=item.category;b.classList.toggle('dimmed',this.category!=='all'&&item.category!==this.category);b.classList.toggle('selected',this.selected===s.id&&(this.selectedIndex===i||this.selectedIndex<0));b.setAttribute('aria-label',item.name+', quantidade '+s.qty);b.innerHTML=`<span class="item-quantity">×${s.qty}</span><span class="item-icon">${item.weapon?W.weaponIcon(s.id):item.icon}</span><span class="item-name">${item.name}</span><span class="category-tag">${categories[item.category]}</span>`;
        b.draggable=true;b.ondragstart=e=>{e.dataTransfer.setData('text/plain',String(i));};b.onclick=()=>{this.selected=s.id;this.selectedIndex=i;this.renderInventory();};
      }else{b.classList.add('empty-slot');b.textContent=String(i+1).padStart(2,'0');b.setAttribute('aria-label','Slot vazio '+(i+1));}
      b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();const n=e.dataTransfer.getData('text/plain');if(!/^\d+$/.test(n))return;W.inventory.move(Number(n),i);this.selectedIndex=i;this.renderInventory();};grid.appendChild(b);
    }
    const equip=$('equipment-slots');equip.replaceChildren();
    for(const [slot,name] of Object.entries({weapon:'Arma',...W.equipment.slots})){
      const id=slot==='weapon'?G.equippedWeapon:G.equipment[slot],b=button(name.toUpperCase()+'\n'+(W.items[id]?.name||'Não equipado'),()=>{if(id){W.equipment.unequip(slot);this.renderInventory();}},'equipment-slot');b.title='Clique para desequipar; arraste um item para equipar';b.dataset.slot=slot;
      b.ondragover=e=>e.preventDefault();b.ondrop=e=>{e.preventDefault();const text=e.dataTransfer.getData('text/plain');if(!/^\d+$/.test(text))return;const s=W.inventory.sync()[Number(text)];if(!s)return;const item=W.items[s.id];if(slot==='weapon'?item.weapon:item.slot===slot)W.equipment.equip(s.id);this.renderInventory();};equip.appendChild(b);
    }
    const details=$('item-details');details.replaceChildren();
    if(this.selected&&G.inventory[this.selected]>0){const id=this.selected,item=W.items[id];let index=this.selectedIndex;if(stacks[index]?.id!==id)index=stacks.findIndex(s=>s.id===id);this.selectedIndex=index;
      const info=document.createElement('div');info.innerHTML=`<strong>${item.name}</strong>${item.description}`;details.appendChild(info);const actions=document.createElement('div');actions.className='item-actions';details.appendChild(actions);
      const act=(name,fn)=>actions.appendChild(button(name,()=>{fn();this.renderInventory();U.updateHUD();}));
      if(item.usable)act('USAR',()=>G.useItem(id));
      if(item.weapon||item.slot)act(W.equipment.isEquipped(id)?'DESEQUIPAR':'EQUIPAR',()=>W.equipment.isEquipped(id)?W.equipment.unequip(item.weapon?'weapon':item.slot):W.equipment.equip(id));
      if(stacks[index]?.qty>1)act('SEPARAR',()=>{if(!W.inventory.split(index))U.toast('É preciso um slot livre para separar.');});
      act('MOVER ←',()=>{if(index>0){W.inventory.move(index,index-1);this.selectedIndex=index-1;}});
      act('DESCARTAR',()=>W.inventory.drop(index));
    }else{this.selected=null;this.selectedIndex=-1;details.textContent='Selecione um item. Arraste para organizar ou equipar.';}
  };
  const hud=U.updateHUD;let lastWeapon;
  U.updateHUD=function(){hud.call(this);if(!G.player)return;const p=G.player,w=W.weapon();
    $('weapon-name').textContent=w?.name.toUpperCase()||'SEM ARMA';if(lastWeapon!==G.equippedWeapon){$('weapon-icon').innerHTML=W.weaponIcon(G.equippedWeapon);lastWeapon=G.equippedWeapon;}
    $('survival-status').textContent=p.sick>0?'INDISPOSIÇÃO · '+Math.ceil(p.sick)+'s':p.bleeding?'SANGRAMENTO · USE BANDAGEM':p.temperature<35?'HIPOTERMIA · PROCURE CALOR':'CONDIÇÃO ESTÁVEL';
    $('survival-status').classList.toggle('warning',p.sick>0||p.bleeding||p.temperature<35);document.body.classList.toggle('hide-numbers',!W.settings.numbers);
    $('placement-hint').classList.toggle('hidden',!G.placement);if(G.placement)$('placement-hint').textContent=W.base.recipes[G.placement].name.toUpperCase()+' · CLIQUE POSICIONA · ESC CANCELA';
    if(G.adaptiveLow)$('fps-label').textContent+=' · EFEITOS REDUZIDOS';
  };
  const openSettings=U.settings;U.settings=function(from=null){openSettings.call(this,from);for(const key of ['shaders','rain','shadows','numbers'])$(key+'-input').checked=W.settings[key];$('particles-input').value=W.settings.particles;};
  for(const key of ['shaders','rain','shadows','numbers','particles'])$(key+'-input').onchange=e=>{W.settings[key]=key==='particles'?e.target.value:e.target.checked;W.config.persist();};
  document.addEventListener('keydown',e=>{if(e.repeat||!G.running||G.player.health<=0)return;if(e.key==='F6'){e.preventDefault();persist();}if(e.key.toLowerCase()==='b'&&!U.modal)U.openBase();});
  addEventListener('pagehide',()=>{if(G.running)W.save.write();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.running)W.save.write();});
  // Lightweight local SVG glyphs; no icon package and no image requests.
  const paths={health:'M12 20S2 14 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 6-10 12-10 12Z',hunger:'M5 3v7m4-7v7M3 7h8M7 10v11M18 3v18m0-18c-4 2-4 9 0 9',thirst:'M12 2C9 8 4 11 4 15a8 8 0 0 0 16 0c0-4-5-7-8-13Z',stamina:'m14 2-9 12h7l-2 8 9-12h-7Z'};
  for(const [id,path] of Object.entries(paths))$('vital-'+id).querySelector('span').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  saved();
})();
