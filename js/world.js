'use strict';
window.WL = window.WL || {};
(() => {
  const W = WL;
  W.items = {
    water: { name: 'Água', icon: '💧', description: 'Uma garrafa lacrada. Recupera 38 de sede.', usable: true },
    food: { name: 'Comida enlatada', icon: '🥫', description: 'Ainda está dentro da validade. Recupera 32 de fome.', usable: true },
    bandage: { name: 'Bandagem', icon: '✚', description: 'Estanca sangramento e recupera 12 de vida.', usable: true },
    ammo: { name: 'Munição 9mm', icon: '▥', description: 'Munição reserva da pistola. Use R para recarregar.' },
    gun: { name: 'Pistola 9mm', icon: '⌐═', description: 'Arma equipada. Pente de 8 tiros. Dano: 34. Alcance: 560.' },
    wood: { name: 'Madeira', icon: '🪵', description: 'Combustível. Cada unidade mantém a fogueira acesa por 90 segundos.' },
    scrap: { name: 'Sucata', icon: '⚙', description: 'Restos de metal. Recurso reservado para futuras versões.' },
    tools: { name: 'Ferramentas', icon: '⚒', description: 'Kit de oficina. Recurso reservado para futuras versões.' }
  };
  W.seeded = function(seed) { return function() { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
  W.distance = (a,b) => Math.hypot(a.x-b.x, a.y-b.y);
  W.rectContains = (r,x,y,p=0) => x>r.x-p && x<r.x+r.w+p && y>r.y-p && y<r.y+r.h+p;
  W.makeWorld = function(data=W.maps.valley) { return W.map.build(data); };
  W.solidRects = function(world) {
    const signature=world.buildings.map(b=>b.doorOpen?'1':'0').join('')+':'+world.buildings.length;
    if(world._signature!==signature){
      const rects=[...world.cars,...world.fences];
      for(const b of world.buildings){rects.push(...b.walls,...(b.furniture||[]).filter(f=>!f.passable));if(!b.doorOpen)rects.push({x:b.x+b.w/2-25,y:b.y+b.h-12,w:50,h:12});}
      world._rects=rects;world._signature=signature;world._grid=new W.SpatialGrid();rects.forEach(r=>world._grid.insert(r));
    }
    if(!world._trees){world._trees=new W.SpatialGrid();world.trees.forEach(t=>world._trees.insert(t,t.x-8,t.y-8,16,16));}
    return world._rects;
  };
  W.collides = function(world,x,y,r,rects) {
    if(x<r||y<r||x>world.width-r||y>world.height-r)return true;
    if(!world._grid||!rects)W.solidRects(world);
    if(world._grid.some(x,y,r,b=>{const nx=Math.max(b.x,Math.min(x,b.x+b.w)),ny=Math.max(b.y,Math.min(y,b.y+b.h));return (x-nx)**2+(y-ny)**2<r*r;}))return true;
    return world._trees.some(x,y,r+8,t=>(x-t.x)**2+(y-t.y)**2<(r+7)**2);
  };
  W.move = function(entity,dx,dy,r,world,rects) {
    // Substeps prevent tunnelling through thin fences even after a long frame.
    const steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/8));
    for(let i=0;i<steps;i++){
      if(!W.collides(world,entity.x+dx/steps,entity.y,r,rects))entity.x+=dx/steps;
      if(!W.collides(world,entity.x,entity.y+dy/steps,r,rects))entity.y+=dy/steps;
    }
  };
  W.difficulties={
    easy:{name:'Fácil',population:.65,loot:1.45,drain:.7,damage:.72,detect:.8,speed:.9},
    normal:{name:'Normal',population:1,loot:1,drain:1,damage:1,detect:1,speed:1},
    hard:{name:'Difícil',population:1.4,loot:.7,drain:1.2,damage:1.25,detect:1.15,speed:1.06},
    nightmare:{name:'Pesadelo',population:1.8,loot:.48,drain:1.45,damage:1.55,detect:1.3,speed:1.12}
  };
  W.difficulty=()=>W.difficulties[W.game?.difficulty]||W.difficulties.normal;
  W.lootTables={
    house:[['food',1,2],['water',1,2],['cloth',1,4],['knife',1,1],['jacket',1,1],['bandage',1,2],['watch',1,1]],
    mansion:[['food',1,3],['heavyPistol',1,1],['heavyAmmo',4,12],['watch',1,1],['backpack',1,1],['medicine',1,2],['jacket',1,1]],
    market:[['food',2,5],['water',2,4],['fruit',1,4],['rottenFood',1,2],['tape',1,2]],
    hospital:[['medicine',1,3],['bandage',2,5],['cloth',2,4],['water',1,2]],
    pharmacy:[['medicine',1,2],['bandage',1,4],['water',1,2],['cloth',1,3]],
    police:[['gun',1,1],['heavyPistol',1,1],['ammo',8,24],['heavyAmmo',5,16],['club',1,1],['shotgun',1,1],['shells',5,12],['suppressor',1,1]],
    military:[['smg',1,1],['rifle',1,1],['rifleAmmo',8,20],['ammo',12,30],['suppressor',1,1],['helmet',1,1]],
    workshop:[['scrap',2,6],['tools',1,1],['hammer',1,1],['axe',1,1],['crowbar',1,1],['tape',1,3]],
    warehouse:[['wood',2,6],['scrap',2,6],['tools',1,1],['tape',1,3],['shovel',1,1]],
    farm:[['meat',1,3],['fruit',1,4],['shotgun',1,1],['shells',4,10],['machete',1,1]],
    school:[['cloth',1,3],['water',1,2],['food',1,2],['bat',1,1],['backpack',1,1]],
    office:[['watch',1,1],['water',1,2],['cloth',1,3],['tape',1,3]],
    shop:[['food',1,2],['jacket',1,1],['trousers',1,1],['boots',1,1],['cloth',1,4]],
    gas:[['water',1,3],['food',1,3],['tools',1,1],['scrap',1,3],['tape',1,3]]
  };
  W.rollLoot=function(category,rng=Math.random){
    if(category==='starter')return [{id:'water',qty:1},{id:'food',qty:1},{id:'bandage',qty:1},{id:'wood',qty:2},{id:'bat',qty:1},{id:'cloth',qty:4},{id:'tape',qty:2}];
    const table=[...(W.lootTables[category]||W.lootTables.house)],result=[],factor=W.difficulty().loot;
    const count=Math.max(1,Math.min(table.length,Math.round((2+rng()*2)*factor)));
    for(let i=0;i<count;i++){const [id,min,max]=table.splice(Math.floor(rng()*table.length),1)[0];result.push({id,qty:Math.max(1,Math.round((min+Math.floor(rng()*(max-min+1)))*(W.items[id].weapon||W.items[id].slot?1:factor)))});}
    return result;
  };
})();
