'use strict';
(() => {
  const W=WL;
  W.equipment={
    slots:{head:'Cabeça',body:'Corpo',legs:'Pernas',feet:'Pés',pack:'Mochila'},
    bonus(stat,equipment=W.game.equipment){return Object.values(equipment||{}).reduce((sum,id)=>sum+(W.items[id]?.[stat]||0),0);},
    capacity(equipment){return 12+this.bonus('capacity',equipment);},
    equip(id){const G=W.game,item=W.items[id];if(!G.inventory[id])return false;
      if(item.weapon){if(G.equippedWeapon===id)return true;if(G.equippedWeapon)G.magazines[G.equippedWeapon]=G.player.ammo;G.equippedWeapon=id;G.player.ammo=G.magazines[id]||0;G.player.reload=0;G.player.cooldown=.2;return true;}
      if(!item.slot)return false;
      const next={...G.equipment,[item.slot]:id};if(W.inventory.sync().length>this.capacity(next))return false;G.equipment=next;return true;
    },
    unequip(slot){const G=W.game;if(slot==='weapon'){if(!G.equippedWeapon)return false;G.magazines[G.equippedWeapon]=G.player.ammo;G.equippedWeapon=null;G.player.ammo=0;G.player.reload=0;return true;}
      const next={...G.equipment};delete next[slot];if(W.inventory.sync().length>this.capacity(next)){W.ui?.toast('A carga não cabe sem este equipamento.');return false;}G.equipment=next;return true;
    },
    isEquipped(id){return W.game.equippedWeapon===id||Object.values(W.game.equipment).includes(id);}
  };
})();
