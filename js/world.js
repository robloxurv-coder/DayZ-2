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
      for(const b of world.buildings){rects.push(...b.walls);if(!b.doorOpen)rects.push({x:b.x+b.w/2-25,y:b.y+b.h-12,w:50,h:12});}
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
  W.rollLoot = function(category) {
    const qty=(a,b)=>a+Math.floor(Math.random()*(b-a+1));
    if(category==='starter')return [{id:'water',qty:1},{id:'food',qty:1},{id:'bandage',qty:1},{id:'wood',qty:2},{id:'bat',qty:1}];
    if(category==='military')return [{id:'ammo',qty:qty(16,32)},{id:['smg','rifle','helmet','bandage'][qty(0,3)],qty:1},{id:'rifleAmmo',qty:qty(5,12)}];
    if(category==='farm')return [{id:'meat',qty:2},{id:'fruit',qty:2},{id:'shells',qty:qty(4,10)},{id:'shotgun',qty:1}];
    if(category==='workshop')return [{id:'scrap',qty:qty(2,5)},{id:'wood',qty:qty(1,3)},{id:['tools','water','axe'][qty(0,2)],qty:1}];
    const result=[{id:Math.random()<.5?'food':'water',qty:qty(1,2)}];
    if(Math.random()<.8)result.push({id:'bandage',qty:1});
    if(Math.random()<.45)result.push({id:'ammo',qty:qty(3,8)});
    result.push({id:['dirtyWater','rottenFood','fruit','jacket','trousers','boots'][qty(0,5)],qty:1});
    return result;
  };
})();
