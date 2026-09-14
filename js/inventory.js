'use strict';
(() => {
  const W=WL;
  // Aggregate inventory remains compatible with the Alpha; ordered stacks support DnD/split.
  W.inventory={
    sync(){const G=W.game;G.stacks=G.stacks||[];const remaining={...G.inventory};
      G.stacks=G.stacks.filter(s=>{s.qty=Math.min(s.qty,remaining[s.id]||0);remaining[s.id]-=s.qty;return s.qty>0;});
      for(const [id,qty] of Object.entries(remaining))if(qty>0)G.stacks.push({id,qty});return G.stacks;
    },
    add(id,qty){const G=W.game;if(!Object.hasOwn(W.items,id)||!Number.isInteger(qty)||qty<1||qty>9999)return false;
      const stacks=this.sync();if(!G.inventory[id]&&stacks.length>=W.equipment.capacity()){W.ui?.notify('Mochila cheia.','warn');return false;}
      if((G.inventory[id]||0)+qty>9999)return false;
      const s=stacks.find(s=>s.id===id);if(s)s.qty+=qty;else stacks.push({id,qty});G.inventory[id]=(G.inventory[id]||0)+qty;return true;
    },
    split(index){const a=this.sync(),s=a[index];if(!s||s.qty<2||a.length>=W.equipment.capacity())return false;const q=Math.floor(s.qty/2);s.qty-=q;a.splice(index+1,0,{id:s.id,qty:q});return true;},
    move(from,to){const a=this.sync();if(!a[from]||to<0||to>=W.equipment.capacity())return false;const [s]=a.splice(from,1);a.splice(Math.min(to,a.length),0,s);return true;},
    remove(index,qty=1){const G=W.game,a=this.sync(),s=a[index];if(!s||!Number.isInteger(qty)||qty<1||qty>s.qty)return false;if(W.equipment.isEquipped(s.id)&&(G.inventory[s.id]-qty)<1)return false;G.inventory[s.id]-=qty;s.qty-=qty;if(!s.qty)a.splice(index,1);return true;},
    drop(index){const G=W.game,s=this.sync()[index];if(!s||G.world.crates.filter(c=>c.dropped).length>=100)return false;const {id,qty}=s;if(!this.remove(index,qty)){W.ui?.toast('Desequipe o item antes de descartar.');return false;}
      G.world.crates.push({id:'drop-'+G.nextId++,type:'crate',x:G.player.x,y:G.player.y,category:'house',name:'Itens descartados',dropped:true,items:[{id,qty}],looted:false});return true;
    },
    use(id){const G=W.game,p=G.player,item=W.items[id];if(!p||p.health<=0||!G.inventory[id]||!item?.usable)return false;
      if(id==='bandage'){if(!p.bleeding&&p.health>=100)return false;p.bleeding=false;p.health=Math.min(100,p.health+12);}
      else{if((item.hunger||0)>0?p.hunger>=100:p.thirst>=100)return false;p.hunger=Math.max(0,Math.min(100,p.hunger+(item.hunger||0)));p.thirst=Math.max(0,Math.min(100,p.thirst+(item.thirst||0)));if(item.effect==='sick'&&Math.random()<item.risk){p.sick=25;W.ui?.notify('Indisposição: perda de sede e movimento reduzido por 25s.','warn');}}
      G.inventory[id]--;this.sync();
      if(id==='water'||id==='dirtyWater')if(!this.add('emptyBottle',1))G.world.crates.push({id:'drop-'+G.nextId++,type:'crate',category:'house',name:'Garrafa vazia',x:p.x,y:p.y,items:[{id:'emptyBottle',qty:1}],looted:false,dropped:true});
      W.audio.play('use');W.ui?.notify(item.name+' utilizado.');W.ui?.updateHUD();return true;
    }
  };
})();
