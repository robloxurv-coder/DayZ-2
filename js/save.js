'use strict';
// Replaceable local adapter. Saves plain data only, never render caches or cyclic doors.
(() => {
  const W=WL,pick=(o,keys)=>Object.fromEntries(keys.map(k=>[k,o[k]]));
  const playerKeys=['x','y','angle','health','hunger','thirst','stamina','temperature','bleeding','ammo','sick'];
  const enemyKeys=['id','x','y','homeX','homeY','kind','hp','dead','state','angle','timer','attackTimer','serial'];
  const crateKeys=['id','x','y','type','category','name','items','looted','dropped'];
  const finite=(n,a,b)=>Number.isFinite(n)&&n>=a&&n<=b;
  W.save={key:'wasteland-save-v1',version:1,error:null,lastSaved:null,disabled:false,
    snapshot(){const G=W.game;if(!G.running||!G.player)throw Error('Nenhuma partida ativa.');if(G.equippedWeapon)G.magazines[G.equippedWeapon]=G.player.ammo;
      return W.map.clone({version:1,savedAt:Date.now(),map:G.world.data,player:pick(G.player,playerKeys),inventory:G.inventory,stacks:W.inventory.sync(),equipment:G.equipment,equippedWeapon:G.equippedWeapon,magazines:G.magazines,elapsed:G.elapsed,weather:G.weather,weatherTimer:G.weatherTimer,kills:G.kills,looted:G.looted,nextId:G.nextId,base:G.base.map(o=>({...o,doorOpen:G.world.buildings.find(b=>b.id===o.id)?.doorOpen||false})),doors:G.world.buildings.filter(b=>!b.base).map(b=>({id:b.id,open:b.doorOpen})),crates:G.world.crates.map(c=>pick(c,crateKeys)),fires:G.world.fires.filter(f=>!f.kind).map(f=>pick(f,['id','fuel','lit'])),enemies:G.world.enemies.map(e=>pick(e,enemyKeys))});
    },
    validate(s){
      if(!s||s.version!==1)throw Error('Versão de save incompatível.');W.map.validate(s.map);
      const point=o=>o&&finite(o.x,0,s.map.width)&&finite(o.y,0,s.map.height),p=s.player;
      if(!point(p)||!finite(p.angle,-1000,1000)||!finite(p.temperature,25,45)||!finite(p.sick,0,25)||typeof p.bleeding!=='boolean'||['health','hunger','thirst','stamina'].some(k=>!finite(p[k],0,100)))throw Error('Atributos inválidos.');
      const quantities=o=>o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([id,q])=>Object.hasOwn(W.items,id)&&Number.isInteger(q)&&finite(q,0,9999));
      const stackList=a=>Array.isArray(a)&&a.length<=40&&a.every(v=>v&&Object.hasOwn(W.items,v.id)&&Number.isInteger(v.qty)&&finite(v.qty,1,9999));
      if(!quantities(s.inventory)||!stackList(s.stacks)||!s.equipment||Array.isArray(s.equipment))throw Error('Inventário inválido.');
      for(const [slot,id] of Object.entries(s.equipment))if(!Object.hasOwn(W.equipment.slots,slot)||W.items[id]?.slot!==slot||!s.inventory[id])throw Error('Equipamento inválido.');
      if(s.stacks.length>W.equipment.capacity(s.equipment))throw Error('Capacidade excedida.');
      const totals={};s.stacks.forEach(v=>totals[v.id]=(totals[v.id]||0)+v.qty);
      for(const id of new Set([...Object.keys(totals),...Object.keys(s.inventory)]))if((totals[id]||0)!==(s.inventory[id]||0))throw Error('Stacks inconsistentes.');
      if(s.equippedWeapon!==null&&(!Object.hasOwn(W.weapons,s.equippedWeapon)||!s.inventory[s.equippedWeapon]))throw Error('Arma inválida.');
      if(!s.magazines||Array.isArray(s.magazines))throw Error('Pentes inválidos.');
      for(const [id,n] of Object.entries(s.magazines))if(!Object.hasOwn(W.weapons,id)||!Number.isInteger(n)||!finite(n,0,W.weapons[id].magazineSize))throw Error('Munição inválida.');
      if(!Number.isInteger(p.ammo)||!finite(p.ammo,0,W.weapons[s.equippedWeapon]?.magazineSize||0)||(s.equippedWeapon&&s.magazines[s.equippedWeapon]!==p.ammo))throw Error('Pente inválido.');
      if(!finite(s.elapsed,0,1e9)||!finite(s.weatherTimer,0,1000)||!['normal','rain'].includes(s.weather)||!finite(s.savedAt,0,1e15))throw Error('Relógio/clima inválido.');
      for(const k of ['kills','looted','nextId'])if(!Number.isInteger(s[k])||!finite(s[k],0,1e9))throw Error('Contador inválido.');
      if(!Array.isArray(s.base)||s.base.length>12||!Array.isArray(s.crates)||s.crates.length>2700||!Array.isArray(s.doors)||s.doors.length>250||!Array.isArray(s.fires)||s.fires.length>2500||!Array.isArray(s.enemies)||s.enemies.length>250)throw Error('Estado de mundo inválido.');
      const unique=a=>new Set(a.map(o=>o.id)).size===a.length;
      for(const a of [s.base,s.crates,s.doors,s.fires,s.enemies])if(!unique(a))throw Error('Entidades duplicadas.');
      for(const o of s.base)if(typeof o.id!=='string'||!o.id.startsWith('base-')||!point(o)||!Object.hasOwn(W.base.recipes,o.kind)||!stackList(o.storage)||o.storage.length>16||!finite(o.fuel,0,600)||typeof o.lit!=='boolean'||typeof o.doorOpen!=='boolean')throw Error('Base inválida.');
      for(const o of s.crates)if(typeof o.id!=='string'||!point(o)||o.type!=='crate'||typeof o.name!=='string'||o.name.length>80||typeof o.looted!=='boolean'||(o.items!==null&&!stackList(o.items)))throw Error('Loot inválido.');
      for(const o of s.doors)if(!s.map.buildings.some(b=>b.id===o.id)||typeof o.open!=='boolean')throw Error('Porta inválida.');
      for(const o of s.fires)if(!s.map.objects.some(f=>f.id===o.id&&f.type==='fire')||typeof o.lit!=='boolean'||!finite(o.fuel,0,600))throw Error('Fogueira inválida.');
      for(const e of s.enemies)if(!point(e)||!finite(e.hp,-1000,200)||typeof e.dead!=='boolean'||!s.map.enemies.some(v=>v.id===e.id)||!['idle','patrol','chase','dead'].includes(e.state)||!finite(e.angle,-1000,1000)||!finite(e.timer,-1000,1000)||!finite(e.attackTimer,0,10))throw Error('Infectado inválido.');
      return s;
    },
    write(){if(this.disabled)return false;try{const s=this.validate(this.snapshot());localStorage.setItem(this.key,JSON.stringify(s));this.lastSaved=s.savedAt;this.error=null;return true;}catch(e){this.error=e.message;return false;}},
    read(){try{const raw=localStorage.getItem(this.key);if(!raw){this.error=null;return null;}if(raw.length>2500000)throw Error('Save excede o limite.');const s=this.validate(JSON.parse(raw));this.error=null;return s;}catch(e){this.error='Não foi possível ler o save: '+e.message;return null;}},
    remove(){try{localStorage.removeItem(this.key);this.lastSaved=null;this.error=null;return true;}catch(e){this.error='O navegador bloqueou a exclusão.';return false;}},
    load(){const s=this.read();if(!s)return false;const G=W.game;
      try{G.start(s.map);Object.assign(G.player,s.player,{vx:0,vy:0,reload:0,cooldown:0});for(const k of ['inventory','stacks','equipment','equippedWeapon','magazines','elapsed','weather','weatherTimer','kills','looted','nextId','base'])G[k]=s[k];
        G.base.forEach(o=>W.base.attach(o));for(const d of s.doors)G.world.buildings.find(b=>b.id===d.id).doorOpen=d.open;
        G.world.crates=s.crates;G.world.crates.forEach(c=>c.building=G.world.buildings.find(b=>W.rectContains(b,c.x,c.y))||null);
        for(const f of s.fires)Object.assign(G.world.fires.find(o=>o.id===f.id),f);
        G.world.enemies=s.enemies.map(e=>({...e,hitFlash:0,walk:0}));W.renderer.prepareTerrain(G.world);W.renderer.cameraSnap=true;G.updateTarget();W.ui.updateHUD();W.audio.setRain(G.weather==='rain');this.lastSaved=s.savedAt;if(G.player.health<=0)G.die();W.ui.notify('Partida local restaurada.');return true;
      }catch(e){this.error=e.message;return false;}
    }
  };
})();
