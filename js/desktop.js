'use strict';
// Desktop presentation and commands; all mutations delegate to gameplay modules.
(() => {
  const W=WL,G=W.game,U=W.ui,$=id=>document.getElementById(id);
  const categories={all:'Tudo',weapons:'Armas',ammo:'Munição',food:'Comida',water:'Bebida',medicine:'Medicina',tools:'Ferramentas',materials:'Materiais',clothes:'Roupas',misc:'Diversos'};
  const button=(label,fn,cls='')=>{const b=document.createElement('button');b.textContent=label;b.className=cls;b.onclick=fn;return b;};
  const saved=()=>{const s=W.save.read();$('continue-button').classList.toggle('hidden',!s);$('delete-save').classList.toggle('hidden',!s&&!W.save.error);$('save-status').textContent=s?`SAVE LOCAL · ${new Date(s.savedAt).toLocaleString('pt-BR')} · ${s.map.name}`:W.save.error||'Save local neste navegador · nenhum envio de dados.';};
  const persist=()=>{const ok=W.save.write();U.toast(ok?'Partida salva neste navegador.':'Não foi possível salvar: '+W.save.error);return ok;};
  const newGame=(data=W.maps.valley)=>{if(W.save.read()&&!confirm('Iniciar novo jogo substitui o save local atual. Continuar?'))return;G.start(data);if(!W.save.write()&&!W.save.disabled)U.toast('Jogo iniciado sem save: '+W.save.error);};
  let selectedDifficulty='normal';
  const descriptions={easy:'Mais recursos. Menos infectados.',normal:'Cada saída exige preparo.',hard:'Mais perigo. Menos suprimentos.',nightmare:'Combate brutal e escassez.'};
  function renderDifficulty(){$('difficulty-options').replaceChildren();for(const [id,d] of Object.entries(W.difficulties)){const b=button('',()=>{selectedDifficulty=id;renderDifficulty();},'difficulty-card'+(selectedDifficulty===id?' active':''));b.innerHTML='<strong>'+d.name+'</strong><small>'+descriptions[id]+'</small>';b.setAttribute('aria-pressed',selectedDifficulty===id);$('difficulty-options').appendChild(b);}}
  const chooseDifficulty=()=>{U.openModal('newgame');renderDifficulty();};
  $('play-button').onclick=chooseDifficulty;$('about-play').onclick=chooseDifficulty;$('start-game').onclick=()=>{G.nextDifficulty=selectedDifficulty;newGame();};
  $('menu-controls').onclick=()=>{U.controlsFrom='menu';U.openModal('controls');};$('respawn-button').onclick=()=>{G.start(G.world?.data||W.maps.valley,G.difficulty);persist();};
  $('continue-button').onclick=()=>{W.audio.init();if(!W.save.load()){U.toast(W.save.error||'Nenhum save encontrado.');saved();}};
  $('delete-save').onclick=()=>{if(confirm('Excluir permanentemente a partida salva neste navegador?')){if(!W.save.remove())U.toast(W.save.error);saved();}};
  $('save-button').onclick=persist;
  $('exit-button').onclick=()=>{if(!persist()&&!confirm('Não foi possível salvar. Sair mesmo assim?'))return;U.showMenu();saved();};
  U.openStorage=function(chest){this.chest=chest;this.renderStorage();this.openModal('storage');};
  U.renderStorage=function(){const chest=this.chest;$('storage-capacity').textContent=chest.storage.length+'/16';
    for(const [id,items,toChest] of [['storage-deposit',W.inventory.sync(),true],['storage-withdraw',chest.storage,false]]){
      const node=$(id);node.replaceChildren();items.forEach((s,i)=>{const b=button('',()=>{if(!W.base.transfer(chest,i,toChest))U.toast('Sem espaço, item equipado ou baú distante.');this.renderStorage();},'loot-item');b.innerHTML=`<span class="item-icon">${W.itemIcon(s.id)}</span><span>${W.items[s.id].name}<small>${(W.items[s.id].weight*s.qty).toFixed(1)} KG</small></span><b>×${s.qty} ${toChest?'→':'←'}</b>`;node.appendChild(b);});if(!items.length)node.textContent='Vazio.';
    }
  };
  U.category='all';U.selectedIndex=-1;
  U.renderInventory=function(){
    const stacks=W.inventory.sync(),capacity=W.equipment.capacity(),grid=$('inventory-grid');grid.replaceChildren();$('slots-count').textContent=stacks.length+' / '+capacity+' SLOTS';$('carry-weight').textContent=W.inventory.weight().toFixed(1)+' KG';
    $('inventory-categories').replaceChildren();for(const [key,label] of Object.entries(categories)){const b=button(label,()=>{this.category=key;this.renderInventory();},this.category===key?'active':'');b.setAttribute('aria-pressed',this.category===key);$('inventory-categories').appendChild(b);}
    const focusKey=document.activeElement?.dataset.focusKey;
    let shown=0;
    for(let i=0;i<capacity;i++){
      const s=stacks[i];if(this.category!=='all'&&(!s||W.items[s.id].category!==this.category))continue;
      const b=document.createElement('button');b.className='inventory-slot';b.dataset.index=i;b.dataset.focusKey='slot-'+i;
      if(s){const item=W.items[s.id],equipped=W.equipment.isEquipped(s.id),selected=this.selected===s.id&&(this.selectedIndex===i||this.selectedIndex<0);b.dataset.category=item.category;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',selected);b.setAttribute('aria-label',item.name+', quantidade '+s.qty+(equipped?', equipado':''));
        b.innerHTML=`<span class="item-quantity">×${s.qty}</span><span class="item-icon">${W.itemIcon(s.id)}</span><span class="item-name">${item.name}</span><span class="category-tag">${equipped?'EQUIPADO':item.weight.toFixed(2)+' KG'}</span>`;
        b.onclick=()=>{this.selected=s.id;this.selectedIndex=i;this.renderInventory();};
      }else{b.classList.add('empty-slot');b.textContent=String(i+1).padStart(2,'0');b.disabled=true;b.setAttribute('aria-label','Slot vazio '+(i+1));}
      grid.appendChild(b);shown++;
    }
    if(!shown){const empty=document.createElement('p');empty.className='inventory-empty';empty.textContent='Nenhum item nesta categoria.';grid.appendChild(empty);}
    const equip=$('equipment-slots');equip.replaceChildren();
    for(const [slot,name] of Object.entries({weapon:'Principal',secondary:'Secundária',...W.equipment.slots})){
      const id=slot==='weapon'?G.equippedWeapon:slot==='secondary'?G.secondaryWeapon:G.equipment[slot],b=button(name.toUpperCase()+'\n'+(W.items[id]?.name||'Não equipado'),()=>{if(id){W.equipment.unequip(slot);this.renderInventory();}},'equipment-slot');b.title='Clique para desequipar';b.dataset.slot=slot;
      equip.appendChild(b);
    }
    const details=$('item-details');details.replaceChildren();
    if(this.selected&&G.inventory[this.selected]>0){const id=this.selected,item=W.items[id];let index=this.selectedIndex;if(stacks[index]?.id!==id)index=stacks.findIndex(s=>s.id===id);this.selectedIndex=index;
      const info=document.createElement('div');info.className='selected-item';info.innerHTML=`<span class="detail-icon">${W.itemIcon(id)}</span><div><strong>${item.name}</strong><p>${item.description}</p><small>×${stacks[index]?.qty||0} · ${item.weight.toFixed(2)} KG / UN.${W.weapons[id]?.melee?' · CONDIÇÃO '+Math.round(G.durability[id]??100)+'%':''}</small></div>`;details.appendChild(info);const actions=document.createElement('div');actions.className='item-actions';details.appendChild(actions);
      const act=(name,enabled,fn)=>{const b=button(name,()=>{fn();this.renderInventory();U.updateHUD();});b.disabled=!enabled;b.dataset.action=name;b.dataset.focusKey=name;actions.appendChild(b);};
      act('USAR',!!item.usable,()=>{if(!G.useItem(id))U.toast('Este atributo já está cheio.');});
      const equipped=W.equipment.isEquipped(id);
      act(equipped?'DESEQUIPAR':'EQUIPAR',!!(item.weapon||item.slot),()=>{const ok=equipped?W.equipment.unequip(item.weapon?(G.equippedWeapon===id?'weapon':'secondary'):item.slot):W.equipment.equip(id);U.toast(ok?(equipped?'Item desequipado.':item.name+' equipado.'):'A carga não cabe sem este equipamento.');});
      act('DIVIDIR',stacks[index]?.qty>1,()=>{if(!W.inventory.split(index))U.toast('Sem espaço para outra pilha.');});
      act('SOLTAR',!equipped,()=>{if(W.inventory.drop(index)){G.updateTarget();W.audio.play('loot');U.toast('Item deixado no chão.');}else U.toast('Não foi possível descartar.');});
      const row=document.createElement('div');row.className='assign-hotbar';const label=document.createElement('small');label.textContent='ATALHO';row.appendChild(label);for(let n=0;n<9;n++){const b=button(String(n+1),()=>{G.hotbar[n]=id;this.renderInventory();this.renderHotbar();},G.hotbar[n]===id?'active':'');b.title='Associar a '+(n+1);row.appendChild(b);}info.appendChild(row);
    }else{this.selected=null;this.selectedIndex=-1;details.textContent='Selecione um item para ver detalhes e ações.';}
    if(focusKey)document.querySelector(`[data-focus-key="${focusKey}"]`)?.focus({preventScroll:true});
  };
  U.activateHotbar=function(index){if(!G.running||G.paused)return;const id=G.hotbar[index];if(!id||!G.inventory[id])return;if(W.items[id].weapon||W.items[id].slot)W.equipment.equip(id);else if(W.items[id].usable)G.useItem(id);this.updateHUD();};
  let hotbarSignature='';
  U.renderHotbar=function(){const signature=G.hotbar.map(id=>id+':'+(G.inventory[id]||0)).join('|')+G.equippedWeapon;if(signature===hotbarSignature)return;hotbarSignature=signature;$('hotbar').replaceChildren();G.hotbar.forEach((id,i)=>{const b=button('',()=>this.activateHotbar(i),'hotbar-slot'+(id===G.equippedWeapon?' active':'')+(!G.inventory[id]?' depleted':''));b.setAttribute('aria-label','Atalho '+(i+1)+': '+(W.items[id]?.name||'vazio'));b.innerHTML='<small>'+(i+1)+'</small>'+(id?W.itemIcon(id):'<span class="empty-dot">·</span>')+'<b>'+(G.inventory[id]>1?G.inventory[id]:'')+'</b>';$('hotbar').appendChild(b);});};
  $('inventory-sort').onclick=()=>{G.stacks=W.inventory.sync().sort((a,b)=>W.items[a.id].category.localeCompare(W.items[b.id].category)||W.items[a.id].name.localeCompare(W.items[b.id].name));U.selectedIndex=-1;U.renderInventory();};
  U.openCrafting=function(){this.renderCrafting();this.openModal('crafting');};
  U.renderCrafting=function(){$('craft-location').textContent=W.base.nearBench()?'BANCADA DO REFÚGIO / PRONTA':'Aproxime-se da bancada no cômodo leste do refúgio para fabricar.';$('craft-recipes').replaceChildren();for(const [id,r] of Object.entries(W.base.crafting)){
    const card=document.createElement('article');card.className='recipe';card.innerHTML='<span class="item-icon">'+W.itemIcon(r.output||G.equippedWeapon||'tools')+'</span><div><strong>'+r.name+' <small>×'+r.qty+'</small></strong><p>'+Object.entries(r.cost).map(([k,q])=>'<span class="'+((G.inventory[k]||0)>=q?'available':'missing')+'">'+W.items[k].name+' '+(G.inventory[k]||0)+'/'+q+'</span>').join(' · ')+(r.tool?' · KIT DE FERRAMENTAS':'')+'</p></div>';
    const b=button('CRIAR',()=>{if(!W.base.craft(id))U.toast('Materiais insuficientes, equipamento em uso ou inventário cheio.');this.renderCrafting();this.updateHUD();});b.disabled=!W.base.canCraft(id);card.appendChild(b);$('craft-recipes').appendChild(card);
  }};
  $('inventory-craft').onclick=()=>U.openCrafting();
  const hud=U.updateHUD;let lastWeapon;
  U.updateHUD=function(){hud.call(this);if(!G.player)return;const p=G.player,w=W.weapon();
    $('weapon-name').textContent=w?.name.toUpperCase()||'SEM ARMA';if(lastWeapon!==G.equippedWeapon){$('weapon-icon').innerHTML=W.weaponIcon(G.equippedWeapon);lastWeapon=G.equippedWeapon;}
    document.body.classList.toggle('hide-numbers',!W.settings.numbers);
    if(G.adaptiveLow)$('fps-label').textContent+=' · EFEITOS REDUZIDOS';
  };
  const openSettings=U.settings;U.settings=function(from=null){openSettings.call(this,from);for(const key of ['shaders','rain','shadows','numbers'])$(key+'-input').checked=W.settings[key];$('particles-input').value=W.settings.particles;};
  for(const key of ['shaders','rain','shadows','numbers','particles'])$(key+'-input').onchange=e=>{W.settings[key]=key==='particles'?e.target.value:e.target.checked;W.config.persist();};
  document.addEventListener('keydown',e=>{if(e.repeat||!G.running||G.player.health<=0)return;if(e.key==='F6'){e.preventDefault();persist();}});
  addEventListener('pagehide',()=>{if(G.running)W.save.write();});document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.running)W.save.write();});
  // Lightweight local SVG glyphs; no icon package and no image requests.
  const paths={health:'M12 20S2 14 2 8a5 5 0 0 1 10-2 5 5 0 0 1 10 2c0 6-10 12-10 12Z',hunger:'M5 3v7m4-7v7M3 7h8M7 10v11M18 3v18m0-18c-4 2-4 9 0 9',thirst:'M12 2C9 8 4 11 4 15a8 8 0 0 0 16 0c0-4-5-7-8-13Z',stamina:'m14 2-9 12h7l-2 8 9-12h-7Z'};
  for(const [id,path] of Object.entries(paths))$('vital-'+id).querySelector('span').innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  saved();
})();
