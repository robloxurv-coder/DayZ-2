'use strict';
(() => {
  const W=WL;
  W.base={
    crafting:{
      bandage:{name:'Bandagem improvisada',output:'bandage',qty:2,cost:{cloth:3}},
      spear:{name:'Lança improvisada',output:'spear',qty:1,cost:{wood:2,scrap:2,tape:1}},
      club:{name:'Bastão reforçado',output:'club',qty:1,cost:{wood:2,tape:1}},
      tools:{name:'Kit de ferramentas',output:'tools',qty:1,cost:{scrap:5,wood:1,tape:1}},
      water:{name:'Filtrar e ferver água',output:'water',qty:1,cost:{dirtyWater:1,cloth:1,wood:1}},
      cloth:{name:'Rasgar roupa',output:'cloth',qty:4,cost:{jacket:1}},
      repair:{name:'Reparar arma melee',qty:1,cost:{scrap:2,tape:1},tool:'tools'}
    },
    nearBench(){const G=W.game;return G.running&&(G.world.stations||[]).some(o=>o.type==='bench'&&W.distance(G.player,o)<80&&W.rectContains(o.building,G.player.x,G.player.y));},
    canCraft(id){const G=W.game,r=this.crafting[id];if(!r||!this.nearBench())return false;
      if(r.tool&&!G.inventory[r.tool])return false;
      if(id==='repair'&&(!W.weapon()?.melee||(G.durability[G.equippedWeapon]??100)>=100))return false;
      return Object.entries(r.cost).every(([k,q])=>(G.inventory[k]||0)>=q&&(!W.equipment.isEquipped(k)||(G.inventory[k]-q)>0));
    },
    craft(id){const G=W.game,r=this.crafting[id];if(!this.canCraft(id))return false;
      const before={...G.inventory},stacks=W.map.clone(W.inventory.sync());for(const [k,q] of Object.entries(r.cost))G.inventory[k]-=q;W.inventory.sync();
      if(r.output&&!W.inventory.add(r.output,r.qty)){G.inventory=before;G.stacks=stacks;return false;}
      if(id==='repair')G.durability[G.equippedWeapon]=100;W.audio.play('craft');W.ui?.notify(r.name+' concluído.');return true;
    },
    recipes:{shelter:{name:'Abrigo',w:110,h:100,cost:{wood:3}},chest:{name:'Baú',w:30,h:26,cost:{wood:2,scrap:1}},fire:{name:'Fogueira',w:42,h:42,cost:{wood:1}}},
    initialize(){
      const G=W.game;
      if(!G.world.buildings.some(b=>b.id==='starter-shelter'))return;
      G.base.push({id:'base-starter-chest',kind:'chest',type:'chest',x:G.world.buildings.find(b=>b.id==='starter-shelter').x+88,y:G.world.buildings.find(b=>b.id==='starter-shelter').y+160,fuel:0,lit:false,storage:[]});
    },
    canPlace(type,x,y){if(!this.freeBuilding)return false;const G=W.game,r=this.recipes[type];if(!G.running||!r||!Number.isFinite(x)||!Number.isFinite(y)||G.player.health<=0||G.base.length>=12)return false;
      const b={x:x-r.w/2,y:y-r.h/2,w:r.w,h:r.h},world=G.world;
      if(W.distance({x,y},G.player)>165||b.x<20||b.y<20||b.x+b.w>world.width-20||b.y+b.h>world.height-20||W.rectContains(b,G.player.x,G.player.y,20))return false;
      if(world.buildings.some(o=>b.x<o.x+o.w+30&&b.x+b.w+30>o.x&&b.y<o.y+o.h+45&&b.y+b.h+30>o.y))return false;
      if(world.trees.some(o=>W.rectContains(b,o.x,o.y,30))||world.roads.some(o=>b.x<o.x+o.w&&b.x+b.w>o.x&&b.y<o.y+o.h&&b.y+b.h>o.y))return false;
      if([...world.crates,...world.fires,...G.base].some(o=>W.rectContains(b,o.x,o.y,45)))return false;
      const rects=W.solidRects(world);for(const dx of [-r.w/2,0,r.w/2])for(const dy of [-r.h/2,0,r.h/2])if(W.collides(world,x+dx,y+dy,16,rects))return false;
      return Object.entries(r.cost).every(([id,q])=>(G.inventory[id]||0)>=q);
    },
    attach(o){const G=W.game;
      if(o.kind==='shelter'){
        const x=o.x-55,y=o.y-50,w=110,h=100,b={id:o.id,x,y,w,h,name:'Seu abrigo',type:'house',doorOpen:!!o.doorOpen,base:true};
        b.door={x:x+w/2,y:y+h-4,building:b,type:'door'};b.walls=[{x,y,w,h:12},{x,y,w:12,h},{x:x+w-12,y,w:12,h},{x,y:y+h-12,w:30,h:12},{x:x+80,y:y+h-12,w:30,h:12}];G.world.buildings.push(b);
      }else if(o.kind==='fire')G.world.fires.push(o);
    },
    place(kind,x,y){const G=W.game;if(!this.canPlace(kind,x,y)){W.ui?.notify('Local obstruído, distante ou recursos insuficientes.','warn');return false;}const r=this.recipes[kind];for(const [id,q] of Object.entries(r.cost))G.inventory[id]-=q;
      const o={id:'base-'+G.nextId++,kind,x,y,type:kind==='chest'?'chest':kind==='fire'?'fire':'shelter',fuel:0,lit:false,storage:[]};G.base.push(o);this.attach(o);G.placement=null;W.renderer.prepareTerrain(G.world);W.audio.play('door');W.ui?.notify(r.name+' instalado.');return true;
    },
    transfer(chest,index,toChest){const G=W.game;if(!chest||!G.base.includes(chest)||chest.kind!=='chest'||W.distance(G.player,chest)>75||!G.canSee(G.player,chest))return false;
      if(toChest){const s=W.inventory.sync()[index];if(!s)return false;let target=chest.storage.find(v=>v.id===s.id);if((!target&&chest.storage.length>=16)||(target&&target.qty+s.qty>9999))return false;const {id,qty}=s;if(!W.inventory.remove(index,qty))return false;if(target)target.qty+=qty;else chest.storage.push({id,qty});}
      else{const s=chest.storage[index];if(!s||!W.inventory.add(s.id,s.qty))return false;chest.storage.splice(index,1);}W.audio.play('loot');return true;
    }
  };
})();
