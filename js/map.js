'use strict';
// Data boundary shared by the game, editor and save adapter. No fetch/file server.
(() => {
  const W=WL, clone=v=>JSON.parse(JSON.stringify(v));
  const lists=['terrain','roads','buildings','objects','enemies','poi'];
  const types=['tree','rock','fence','car','crate','fire','pole'];
  const number=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  W.map={
    clone,
    validate(d){
      if(!d||d.version!==1||!number(d.width,800,6000)||!number(d.height,600,4500))throw Error('Mapa: versão ou tamanho inválido (800–6000 × 600–4500).');
      if(typeof d.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(d.id)||typeof d.name!=='string'||d.name.length>80)throw Error('Mapa: nome/ID inválido.');
      const point=o=>o&&number(o.x,0,d.width)&&number(o.y,0,d.height);
      const rect=o=>point(o)&&number(o.w,1,d.width-o.x)&&number(o.h,1,d.height-o.y);
      if(!point(d.spawn)||d.spawn.x<16||d.spawn.y<16||d.spawn.x>d.width-16||d.spawn.y>d.height-16)throw Error('Spawn fora do mapa.');
      for(const k of lists)if(!Array.isArray(d[k])||d[k].length>(k==='objects'?2500:250))throw Error('Mapa: lista inválida ou limite excedido: '+k);
      const ids=new Set();
      for(const k of lists)for(const o of d[k]){
        if(!point(o))throw Error('Coordenadas inválidas em '+k);
        if(['terrain','roads','buildings'].includes(k)&&!rect(o))throw Error('Retângulo fora do mapa.');
        if(o.name!==undefined&&(typeof o.name!=='string'||o.name.length>80))throw Error('Nome inválido.');
        if(['buildings','objects','enemies'].includes(k)){
          if(typeof o.id!=='string'||o.id.length>80||ids.has(o.id))throw Error('IDs devem ser únicos.');ids.add(o.id);
        }
        if(k==='terrain'&&!['grass','forest','field','concrete','dirt'].includes(o.kind))throw Error('Terreno desconhecido.');
        if(k==='buildings'&&(!['house','workshop','military','farm'].includes(o.type)||o.w<90||o.h<90))throw Error('Construção inválida.');
        if(k==='enemies'&&!['common','runner','tank'].includes(o.kind))throw Error('Infectado inválido.');
        if(k==='poi'&&!number(o.radius,30,2000))throw Error('Raio inválido.');
        if(k==='objects'){
          if(!types.includes(o.type))throw Error('Objeto desconhecido.');
          if(['car','fence'].includes(o.type)&&!rect(o))throw Error('Objeto fora do mapa.');
          if(['tree','rock'].includes(o.type)&&!number(o.r,2,65))throw Error('Raio de objeto inválido.');
          if(o.type==='tree'&&(!Number.isInteger(o.shade)||!number(o.shade,0,2)))throw Error('Cor de árvore inválida.');
          if(o.type==='fire'&&(!number(o.fuel,0,600)||typeof o.lit!=='boolean'))throw Error('Fogueira inválida.');
          if(o.type==='crate'){
            if(!['starter','house','workshop','military','farm'].includes(o.category))throw Error('Categoria de loot inválida.');
            if(o.items!==null&&(!Array.isArray(o.items)||o.items.length>40||o.items.some(i=>!Object.hasOwn(W.items,i.id)||!Number.isInteger(i.qty)||!number(i.qty,1,9999))))throw Error('Itens de loot inválidos.');
          }
        }
      }
      return clone(d);
    },
    empty(width=4000,height=3000){return {version:1,id:'custom',name:'Novo território',width,height,seed:7431,spawn:{x:Math.round(width/2),y:Math.round(height/2)},terrain:[],roads:[],buildings:[],objects:[],enemies:[],poi:[]};},
    build(data){
      const d=this.validate(data),world={width:d.width,height:d.height,mapId:d.id,data:d,roads:d.roads,terrain:d.terrain,poi:d.poi,buildings:[],trees:[],grass:[],cars:[],fences:[],poles:[],crates:[],enemies:[],fires:[],decorations:[]};
      for(const b of d.buildings){
        const {x,y,w,h}=b;b.doorOpen=false;
        b.door={x:x+w/2,y:y+h-4,building:b,type:'door'};
        b.walls=[{x,y,w,h:12},{x,y,w:12,h},{x:x+w-12,y,w:12,h},{x,y:y+h-12,w:w/2-25,h:12},{x:x+w/2+25,y:y+h-12,w:w/2-25,h:12}];
        world.buildings.push(b);
      }
      const groups={tree:'trees',rock:'decorations',car:'cars',fence:'fences',crate:'crates',fire:'fires',pole:'poles'};
      for(const o of d.objects)world[groups[o.type]].push({...o});
      world.crates.forEach(c=>{c.building=world.buildings.find(b=>W.rectContains(b,c.x,c.y))||null;});
      world.enemies=d.enemies.map((e,i)=>({...e,homeX:e.x,homeY:e.y,angle:i*1.4,hp:e.kind==='tank'?190:e.kind==='runner'?70:100,state:'idle',timer:1+i*.3,attackTimer:0,hitFlash:0,walk:0,dead:false,serial:i}));
      const rng=W.seeded(d.seed||7431);
      for(let i=0;i<2400;i++)world.grass.push({x:rng()*d.width,y:rng()*d.height,n:rng()});
      // data must remain acyclic and independent of runtime mutations.
      world.data=this.validate(data);
      return world;
    }
  };
  // 128-unit broad phase. Static geometry rebuilt only when doors change.
  W.SpatialGrid=class {
    constructor(size=128){this.size=size;this.cells=new Map();}
    insert(o,x=o.x,y=o.y,w=o.w||0,h=o.h||0){
      for(let a=Math.floor(x/this.size);a<=Math.floor((x+w)/this.size);a++)for(let b=Math.floor(y/this.size);b<=Math.floor((y+h)/this.size);b++){
        const key=a+','+b;let cell=this.cells.get(key);if(!cell){cell=[];this.cells.set(key,cell);}cell.push(o);
      }
    }
    some(x,y,r,test){
      for(let a=Math.floor((x-r)/this.size);a<=Math.floor((x+r)/this.size);a++)for(let b=Math.floor((y-r)/this.size);b<=Math.floor((y+r)/this.size);b++){
        const cell=this.cells.get(a+','+b);if(cell)for(const o of cell)if(test(o))return true;
      }return false;
    }
  };
})();
