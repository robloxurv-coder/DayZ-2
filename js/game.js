'use strict';
(() => {
  const W=WL;
  const G=W.game={running:false,paused:false,world:null,player:null,keys:{},mouse:{x:innerWidth/2+80,y:innerHeight/2},touchAim:false,tracers:[],particles:[],target:null,elapsed:0,kills:0,looted:0,weather:'normal',weatherTimer:45,uiTimer:0,frameRate:60};
  G.start=function(data=W.maps.valley,difficulty=this.nextDifficulty||'normal'){
    this.difficulty=Object.hasOwn(W.difficulties,difficulty)?difficulty:'normal';const world=W.makeWorld(data);world.enemies=world.enemies.filter((e,i)=>i%Math.max(1,Math.round(2/W.difficulty().population))===0);
    W.ui?.closeModal(true);this.world=world;this.player={x:world.data.spawn.x,y:world.data.spawn.y,vx:0,vy:0,sick:0,angle:-Math.PI/2,health:100,hunger:82,thirst:76,stamina:100,temperature:36.5,bleeding:false,ammo:8,reload:0,cooldown:0,muzzle:0,hurt:0,walk:0,step:0};
    this.secondaryWeapon='knife';this.hotbar=['gun','knife','water','food','bandage',null,null,null,null];this.hasWatch=false;this.durability={};this.spawnTimer=25;this.restUntil=0;this.equippedWeapon='gun';this.magazines={gun:8,shotgun:0,smg:0,rifle:0};this.equipment={};this.stacks=[];this.base=[];this.nextId=1;this.placement=null;this.firing=false;this.saveTimer=30;this.targetTimer=0;this.hitMarker=0;this.recoil=0;this.meleeEffect=null;this.adaptiveLow=false;this.slowTime=0;this.ambientTimer=2;W.renderer.cameraSnap=true;
    W.base.initialize();this.inventory={knife:1,water:2,food:2,bandage:2,ammo:24,gun:1,wood:3,scrap:2};this.tracers=[];this.particles=[];this.target=null;this.elapsed=0;this.kills=0;this.looted=0;this.weather='normal';this.weatherTimer=45;this.keys={};this.running=true;this.paused=false;this.uiTimer=0;
    W.renderer.prepareTerrain(this.world);W.audio.init();W.audio.setRain(false);W.ui.showGame();this.updateTarget();W.ui.updateHUD();W.ui.notify('Refúgio do Vale. Um lugar para recomeçar.');
  };
  G.hour=function(){return (16.5+this.elapsed/20)%24;};
  G.nightAmount=function(){const h=this.hour();if(h>=20||h<5)return 1;if(h>=17)return (h-17)/3;if(h<7)return (7-h)/2;return 0;};
  G.location=function(){let nearest=null,dist=Infinity;for(const o of this.world.poi){const d=W.distance(o,this.player);if(d<o.radius&&d<dist){nearest=o;dist=d;}}return (nearest?.name||this.world.data.name).toUpperCase();};
  G.updateTarget=function(){
    const p=this.player,world=this.world;let best=null,distance=Infinity;
    const consider=o=>{const d=W.distance(p,o);if(d>=(o.type==='fire'?75:65)||d>=distance)return;
      if(o.type==='crate'&&world.buildings.some(b=>W.rectContains(b,o.x,o.y)&&!W.rectContains(b,p.x,p.y)))return;
      if(o.type!=='door'&&o.type!=='bench'&&o.type!=='bed'&&!this.canSee(p,o))return;
      if(['bench','bed'].includes(o.type)&&!W.rectContains(o.building,p.x,p.y))return;
      if(o.type==='door'&&this.rayObstacle(p.x,p.y,(o.x-p.x)/d,(o.y-p.y)/d,Math.max(0,d-14))<d-15)return;
      best=o;distance=d;};
    for(const o of world.stations||[])consider(o);for(const b of world.buildings)consider(b.door);for(const o of world.fires)consider(o);for(const o of world.crates)consider(o);for(const o of this.base)if(o.kind==='chest')consider(o);this.target=best;
  };
  G.interact=function(){
    if(!this.running||this.paused||this.player.health<=0)return;this.updateTarget();const o=this.target;if(!o)return;
    if(o.type==='bench'){W.ui.openCrafting?.();return;}
    if(o.type==='bed'){if(this.world.enemies.some(e=>!e.dead&&W.distance(e,this.player)<300)||o.building.doorOpen){W.ui.notify('Feche a porta e elimine ameaças próximas para descansar.','warn');return;}if(this.elapsed<this.restUntil){W.ui.notify('Você ainda não precisa descansar.');return;}this.player.stamina=100;this.player.health=Math.min(100,this.player.health+8);this.player.hunger=Math.max(0,this.player.hunger-8);this.player.thirst=Math.max(0,this.player.thirst-10);this.restUntil=this.elapsed+180;W.ui.notify('Uma pausa segura. Fôlego recuperado.');return;}
    if(o.type==='chest'){W.ui.openStorage(o);return;}
    if(o.type==='door'){
      if(o.building.locked){if(!(this.inventory.crowbar>0)){W.ui.notify('Entrada bloqueada. Procure um pé de cabra.','warn');return;}o.building.locked=false;this.emitNoise(260);W.ui.notify('Barricada removida com o pé de cabra.');}
      if(o.building.doorOpen&&Math.abs(this.player.x-o.x)<37&&Math.abs(this.player.y-o.y)<20){W.ui.notify('Afaste-se um pouco para fechar a porta.');return;}
      if(o.building.doorOpen&&worldDoorOccupied(o)){W.ui.notify('A passagem está ocupada.','warn');return;}
      o.building.doorOpen=!o.building.doorOpen;W.audio.play('door');this.updateTarget();
    }else if(o.type==='crate'){
      if(o.looted){W.ui.notify('Nada além de poeira. Já foi saqueado.');return;}
      if(o.items===null)o.items=W.rollLoot(o.category);W.ui.openLoot(o);
    }else if(o.type==='fire'){
      if((this.inventory.wood||0)<1){W.ui.notify('Você precisa de madeira para alimentar a fogueira.','warn');return;}
      this.inventory.wood--;o.fuel=Math.min(600,o.fuel+90);o.lit=true;W.audio.play('use');W.ui.notify('Fogueira alimentada. Aproxime-se para aquecer.');
    }
  };
  const worldDoorOccupied=o=>G.world.enemies.some(e=>!e.dead&&Math.abs(e.x-o.x)<37&&Math.abs(e.y-o.y)<22);
  G.addItem=(id,qty)=>W.inventory.add(id,qty);
  G.useItem=id=>W.inventory.use(id);
  G.reload=function(){const p=this.player,w=W.weapon();if(!w||w.melee||!this.running||this.paused||!p||p.health<=0||p.reload>0||p.ammo>=w.magazineSize)return false;if(!(this.inventory[w.ammoType]>0)){W.ui.notify('Sem munição reserva.','warn');return false;}p.reload=w.reloadTime;W.audio.play('reload');return true;};
  // Ray collision with rectangles and circles: no physics engine required.
  W.rayRect=function(x,y,dx,dy,b,max){let lo=0,hi=max;for(const [p,d,min,limit] of [[x,dx,b.x,b.x+b.w],[y,dy,b.y,b.y+b.h]]){if(Math.abs(d)<.00001){if(p<min||p>limit)return Infinity;}else{let a=(min-p)/d,c=(limit-p)/d;if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return Infinity;}}return lo;};
  W.rayCircle=function(x,y,dx,dy,c,r,max){const ox=x-c.x,oy=y-c.y,b=ox*dx+oy*dy,d=b*b-(ox*ox+oy*oy-r*r);if(d<0)return Infinity;const t=-b-Math.sqrt(d);return t>=0&&t<=max?t:Infinity;};
  G.rayObstacle=function(x,y,dx,dy,max,rects){
    if(!rects)W.solidRects(this.world);let dist=max;
    const tx=x+dx*max,ty=y+dy*max,bx=Math.min(x,tx),by=Math.min(y,ty),bw=Math.abs(tx-x),bh=Math.abs(ty-y);
    this.world._grid.someRect(bx,by,bw,bh,r=>{dist=Math.min(dist,W.rayRect(x,y,dx,dy,r,max));return false;});
    this.world._trees.someRect(bx-8,by-8,bw+16,bh+16,tr=>{dist=Math.min(dist,W.rayCircle(x,y,dx,dy,tr,8,max));return false;});
    return dist;
  };
  G.canSee=function(a,b,rects){const d=W.distance(a,b);return d<.001||this.rayObstacle(a.x,a.y,(b.x-a.x)/d,(b.y-a.y)/d,d,rects)>=d-.5;};
  G.aimNearest=function(w){
    const p=this.player;let best=null,dist=w.range+(w.melee?13:0),rects=W.solidRects(this.world);
    for(const e of this.world.enemies){if(e.dead)continue;const d=W.distance(e,p);if(d<dist&&this.canSee(p,e,rects)){best=e;dist=d;}}
    if(best)p.angle=Math.atan2(best.y-p.y,best.x-p.x);this.touchAim=true;
  };
  G.hitEnemy=function(hit,damage,knockback=W.weapon()?.knockback||0){
    const a=Math.atan2(hit.y-this.player.y,hit.x-this.player.x);hit.kx=Math.cos(a)*knockback*7;hit.ky=Math.sin(a)*knockback*7;hit.stun=.18;hit.lastX=this.player.x;hit.lastY=this.player.y;
    hit.hp-=damage;hit.hitFlash=.13;hit.state='chase';hit.timer=7;hit.sightTimer=0;this.hitMarker=.16;W.audio.play('impact');
    if(hit.hp<=0){hit.dead=true;hit.state='dead';this.kills++;}
  };
  G.melee=function(autoAim=false){
    const p=this.player,w=W.weapon();if(!w?.melee||!this.running||this.paused||!p||p.health<=0||p.cooldown>0||this.placement)return false;
    if(autoAim)this.aimNearest(w);
    if(p.stamina<w.stamina){W.ui.notify('Sem fôlego para golpear.','warn');return false;}
    const condition=this.durability[this.equippedWeapon]??100;if(condition<=0){W.ui.notify('Arma danificada. Repare na bancada.','warn');return false;}
    p.stamina-=w.stamina;p.cooldown=w.fireRate;p.muzzle=0;
    this.meleeEffect={x:p.x,y:p.y,angle:p.angle,range:w.range,arc:w.arc,life:.18};W.audio.play('swing');this.emitNoise(w.noise);
    const candidates=[],rects=W.solidRects(this.world);
    for(const e of this.world.enemies){if(e.dead)continue;const d=W.distance(e,p),angle=Math.atan2(e.y-p.y,e.x-p.x)-p.angle;
      if(d<=w.range+10&&Math.abs(Math.atan2(Math.sin(angle),Math.cos(angle)))<=w.arc&&this.canSee(p,e,rects))candidates.push({e,d});}
    candidates.sort((a,b)=>a.d-b.d);
    for(const [i,{e}] of candidates.slice(0,w.maxHits).entries()){
      this.hitEnemy(e,w.damage*(i?.65:1));const budget=W.config.budget();
      for(let j=0;j<budget.particleCount&&this.particles.length<budget.particleCap;j++)this.particles.push({x:e.x,y:e.y,vx:(Math.random()-.5)*100,vy:(Math.random()-.5)*100,life:.3,size:2,color:'#974e45'});
    }
    if(candidates.length)this.durability[this.equippedWeapon]=Math.max(0,condition-1);
    W.ui.updateHUD();return true;
  };
  G.shoot=function(autoAim=false){
    const p=this.player,w=W.weapon();if(!w||!this.running||this.paused||!p||p.health<=0||p.cooldown>0||p.reload>0||this.placement)return false;
    if(w.melee)return this.melee(autoAim);
    if(p.ammo<=0){p.cooldown=.3;W.audio.play('empty');if(!this.firing)W.ui.notify('Pente vazio. Pressione R.','warn');return false;}
    if(autoAim)this.aimNearest(w);
    p.ammo--;p.cooldown=w.fireRate;p.muzzle=this.isSuppressed()?.035:.09;this.recoil=Math.min(13,this.recoil*.5+w.recoil);W.audio.play(this.isSuppressed()?'suppressed':'shoot-'+this.equippedWeapon);
    this.emitNoise(this.noiseRadius());
    const budget=W.config.budget(),rects=W.solidRects(this.world);
    for(let pellet=0;pellet<w.pellets;pellet++){
      const angle=p.angle+(Math.random()-.5)*(w.spread*2+Math.min(.06,Math.hypot(p.vx,p.vy)*.00015)),dx=Math.cos(angle),dy=Math.sin(angle);let dist=this.rayObstacle(p.x,p.y,dx,dy,w.range,rects),hit=null;
      for(const e of this.world.enemies){if(e.dead)continue;const t=W.rayCircle(p.x,p.y,dx,dy,e,13,w.range);if(t<dist){dist=t;hit=e;}}
      const tx=p.x+dx*dist,ty=p.y+dy*dist;this.tracers.push({x:p.x+dx*23,y:p.y+dy*23,tx,ty,life:.1});
      for(let i=0;i<budget.particleCount&&this.particles.length<budget.particleCap;i++)this.particles.push({x:tx,y:ty,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,life:.25+Math.random()*.25,size:2+Math.random()*2,color:hit?'#994c39':'#b4a87c'});
      if(hit)this.hitEnemy(hit,w.damage);
    }
    W.ui.updateHUD();return true;
  };
  G.damage=function(amount,canBleed=true){const p=this.player;if(!p||p.health<=0)return;p.health=Math.max(0,p.health-amount*(canBleed?W.difficulty().damage:1)*(canBleed?1-Math.min(.4,W.equipment.bonus('protection')):1));p.hurt=.6;W.audio.play('attack');if(canBleed&&!p.bleeding&&Math.random()<.32){p.bleeding=true;W.ui.notify('Você está sangrando. Use uma bandagem no inventário.','warn');}if(p.health<=0)this.die();};
  G.die=function(){if(!this.running||this.player.health>0)return;this.player.health=0;this.firing=false;this.placement=null;W.save.write();this.paused=true;this.keys={};W.audio.setRain(false);W.ui.updateHUD();W.ui.showDeath();};
  G.isSuppressed=function(){return !!(W.weapon()?.suppressible&&this.equipment.accessory==='suppressor');};
  G.noiseRadius=function(){return (W.weapon()?.noise||0)*(this.isSuppressed()?.38:1);};
  G.emitNoise=function(radius){const p=this.player;this.lastNoise={x:p.x,y:p.y,radius};for(const e of this.world.enemies)if(!e.dead&&W.distance(e,p)<radius){e.state='chase';e.timer=9;e.lastX=p.x;e.lastY=p.y;e.pathTimer=0;}};
  G.populationTarget=function(){return Math.min(105,Math.round((24+this.elapsed/35)*W.difficulty().population));};
  G.spawnGroup=function(){
    const world=this.world,p=this.player,target=this.populationTarget();
    // Despawn only distant dynamic entities; corpses have a separate bounded budget.
    world.enemies=world.enemies.filter(e=>!(e.id.startsWith('dyn-')&&W.distance(e,p)>1800));
    const dead=world.enemies.filter(e=>e.dead);if(dead.length>28){const remove=new Set(dead.slice(0,dead.length-28));world.enemies=world.enemies.filter(e=>!remove.has(e));}
    let count=Math.min(2+Math.floor(this.elapsed/300),6,target-world.enemies.filter(e=>!e.dead).length);if(count<=0)return;
    const r=W.renderer,z=r.zoom||1;const outside=(x,y)=>x<r.camera.x-90||y<r.camera.y-90||x>r.camera.x+r.width/z+90||y>r.camera.y+r.height/z+90;
    for(let attempt=0;attempt<65&&count>0;attempt++){
      const angle=Math.random()*Math.PI*2,dist=650+Math.random()*650,x=p.x+Math.cos(angle)*dist,y=p.y+Math.sin(angle)*dist;
      if(!outside(x,y)||W.collides(world,x,y,18)||world.buildings.some(b=>W.rectContains(b,x,y,35))||W.distance({x,y},world.data.spawn)<250)continue;
      const kind=this.elapsed>240&&Math.random()<.2?'runner':this.elapsed>600&&Math.random()<.12?'tank':'common',id='dyn-'+this.nextId++;
      world.enemies.push({id,x,y,homeX:x,homeY:y,kind,hp:kind==='tank'?190:kind==='runner'?70:100,dead:false,state:'patrol',angle:angle+Math.PI,timer:4,attackTimer:0,serial:this.nextId,walk:0,hitFlash:0});count--;
    }
  };
  G.updateEnemies=function(dt,rects){
    const p=this.player,diff=W.difficulty();let pathBudget=2;
    for(const e of this.world.enemies){
      if(e.dead)continue;const dist=W.distance(e,p);if(dist>1150)continue;
      // Distant simulation is ticked at 5 Hz; near combat remains frame-accurate.
      let step=dt;if(dist>580){e.sleep=(e.sleep||0)+dt;if(e.sleep<.2)continue;step=e.sleep;e.sleep=0;}
      e.hitFlash=Math.max(0,e.hitFlash-step);e.attackTimer=Math.max(0,e.attackTimer-step);e.timer-=step;e.stun=Math.max(0,(e.stun||0)-step);
      if(e.kx||e.ky){W.move(e,(e.kx||0)*step,(e.ky||0)*step,11,this.world,rects);const k=Math.exp(-14*step);e.kx*=k;e.ky*=k;if(Math.abs(e.kx)+Math.abs(e.ky)<1)e.kx=e.ky=0;}
      e.sightTimer=(e.sightTimer||0)-step;
      if(e.sightTimer<=0||e.geometry!==this.world._signature){
        e.sightTimer=dist>580?.4:.15;e.geometry=this.world._signature;
        const detect=(this.keys.shift?330:260)*diff.detect*(this.nightAmount()>.7?.8:1);
        e.sees=dist<(e.state==='chase'?650:detect)&&this.canSee(e,p,rects);
        if(e.sees){e.state='chase';e.timer=8;e.lastX=p.x;e.lastY=p.y;}
      }
      if(e.stun>0)continue;
      if(e.state==='chase'&&(e.timer<=0||(!e.sees&&Math.hypot(e.x-e.lastX,e.y-e.lastY)<22))){e.state='idle';e.timer=2;e.path=null;}
      let speed=23,moving=false;
      if(e.state==='chase'){
        const target={x:e.lastX??p.x,y:e.lastY??p.y};e.angle=Math.atan2(target.y-e.y,target.x-e.x);speed=(e.kind==='runner'?108:e.kind==='tank'?47:66)*diff.speed;
        if(dist<30&&this.canSee(e,p,rects)){if(e.attackTimer<=0){this.damage(e.kind==='tank'?18:11);e.attackTimer=1.2;}continue;}
        moving=true;e.pathTimer=(e.pathTimer||0)-step;
        if(!this.canSee(e,target,rects)){
          if((e.pathTimer<=0||e.pathGeometry!==this.world._signature)&&pathBudget>0){e.path=W.map.path(this.world,e,target);e.pathTimer=1+(e.serial%5)*.15;e.pathGeometry=this.world._signature;pathBudget--;}
          if(e.path?.length){while(e.path.length&&W.distance(e,e.path[0])<16)e.path.shift();if(e.path.length)e.angle=Math.atan2(e.path[0].y-e.y,e.path[0].x-e.x);else moving=false;}
        }
      }else{if(e.timer<=0){e.state=e.state==='patrol'?'idle':'patrol';e.timer=2+Math.random()*4;e.angle=Math.random()*Math.PI*2;}moving=e.state==='patrol';}
      if(moving){const ox=e.x,oy=e.y;W.move(e,Math.cos(e.angle)*speed*step,Math.sin(e.angle)*speed*step,11,this.world,rects);const moved=Math.hypot(e.x-ox,e.y-oy);if(moved<speed*step*.2){const side=e.angle+(e.serial%2?1:-1)*1.2;W.move(e,Math.cos(side)*speed*step*.6,Math.sin(side)*speed*step*.6,11,this.world,rects);}e.walk+=moved*.14;}
      if(p.health<=0)return;
    }
  };
  G.update=function(dt){
    if(!this.running||this.paused||!this.player)return;
    const p=this.player;this.elapsed+=dt;this.weatherTimer-=dt;this.spawnTimer-=dt;if(this.spawnTimer<=0){this.spawnTimer=18/W.difficulty().population;this.spawnGroup();}
    if(this.weatherTimer<=0){this.weather=this.weather==='normal'?'rain':'normal';this.weatherTimer=this.weather==='rain'?60:90;W.audio.setRain(this.weather==='rain');W.ui.notify(this.weather==='rain'?'A chuva chegou. Procure abrigo ou uma fogueira.':'A chuva passou.','normal');}
    const rects=W.solidRects(this.world);let mx=(this.keys.d?1:0)-(this.keys.a?1:0),my=(this.keys.s?1:0)-(this.keys.w?1:0),moving=!!(mx||my);const starving=p.hunger<15||p.thirst<15,staminaMax=starving?55:100;
    const sprint=moving&&this.keys.shift&&p.stamina>3;
    if(moving){const n=Math.hypot(mx,my);mx/=n;my/=n;}
    const speed=(sprint?245:155)*(1+W.equipment.bonus('speed'))*(p.sick>0?.85:1)*(p.reload>0?.82:1)*(this.meleeEffect?.life>.09?.84:1),blend=1-Math.exp(-dt*(moving?22:32)),ox=p.x,oy=p.y;
    p.vx+=(mx*speed-p.vx)*blend;p.vy+=(my*speed-p.vy)*blend;
    W.move(p,p.vx*dt,p.vy*dt,12,this.world,rects);
    if(this.touchAim&&moving)p.angle=Math.atan2(my,mx);
    if(Math.hypot(p.x-ox,p.y-oy)>.1){p.walk+=Math.hypot(p.x-ox,p.y-oy)*.075;p.step-=dt;if(p.step<=0){W.audio.play('step');p.step=sprint?.23:.36;}}
    p.stamina=Math.max(0,Math.min(staminaMax,p.stamina+(sprint?-25:15)*dt));
    if(!this.touchAim){const r=W.renderer,z=r.zoom||1;p.angle=Math.atan2(this.mouse.y/z+r.camera.y-p.y,this.mouse.x/z+r.camera.x-p.x);}
    p.cooldown=Math.max(0,p.cooldown-dt);p.muzzle=Math.max(0,p.muzzle-dt);p.hurt=Math.max(0,p.hurt-dt);
    if(this.meleeEffect){this.meleeEffect.life-=dt;if(this.meleeEffect.life<=0)this.meleeEffect=null;}
    const weapon=W.weapon();if(p.reload>0&&weapon&&!weapon.melee){p.reload-=dt;if(p.reload<=0){p.reload=0;const q=Math.min(weapon.magazineSize-p.ammo,this.inventory[weapon.ammoType]||0);p.ammo+=q;this.inventory[weapon.ammoType]-=q;W.audio.play('reload');}}
    if(this.firing&&weapon?.automatic)this.shoot();this.hitMarker=Math.max(0,this.hitMarker-dt);this.recoil=Math.max(0,this.recoil-dt*45);
    if(p.sick>0){p.sick=Math.max(0,p.sick-dt);p.thirst=Math.max(0,p.thirst-dt*.6);}
    p.hunger=Math.max(0,p.hunger-dt*(sprint?.15:.085)*W.difficulty().drain);p.thirst=Math.max(0,p.thirst-dt*(sprint?.23:.135)*W.difficulty().drain);
    const sheltered=this.world.buildings.some(b=>W.rectContains(b,p.x,p.y));this.sheltered=sheltered;const warm=this.world.fires.some(f=>f.lit&&W.distance(f,p)<108);
    if(warm)p.temperature=Math.min(37.2,p.temperature+dt*.11);else if(this.weather==='rain'&&!sheltered)p.temperature=Math.max(32,p.temperature-dt*.026*(1-W.equipment.bonus('warmth')));else p.temperature+=(36.5-p.temperature)*dt*.012;
    let damage=0;if(starving)damage+=.45;if(p.bleeding)damage+=1.15;if(p.temperature<35)damage+=.35;p.health=Math.max(0,p.health-damage*dt);
    this.world.fires.forEach(f=>{if(f.lit){f.fuel=Math.max(0,f.fuel-dt);if(f.fuel<=0)f.lit=false;}});
    if(p.health<=0){this.die();return;}this.updateEnemies(dt,rects);
    let n=0;for(const b of this.tracers){b.life-=dt;if(b.life>0)this.tracers[n++]=b;}this.tracers.length=n;
    n=0;for(const b of this.particles){b.life-=dt;if(b.life>0){b.x+=b.vx*dt;b.y+=b.vy*dt;this.particles[n++]=b;}}this.particles.length=n;
    this.targetTimer-=dt;if(this.targetTimer<=0){this.targetTimer=.08;this.updateTarget();}
    this.uiTimer-=dt;if(this.uiTimer<=0){this.uiTimer=.15;W.ui.updateHUD();}
    this.saveTimer-=dt;if(this.saveTimer<=0){this.saveTimer=30;if(!W.save.write()&&!W.save.disabled)W.ui.notify('Save local não gravado: '+W.save.error,'warn');}
    this.ambientTimer-=dt;if(this.ambientTimer<=0){this.ambientTimer=1.8+Math.random();if(warm)W.audio.play('fire');else if(this.world.enemies.some(e=>!e.dead&&W.distance(e,p)<270))W.audio.play('infected');}

  };
  let last=0;
  function frame(now){const realDT=last?(now-last)/1000:1/60;last=now;const dt=Math.min(.04,realDT);G.frameRate=G.frameRate*.94+(1/Math.max(.001,realDT))*.06;G.renderDT=dt;if(G.running&&!G.paused){G.slowTime=G.frameRate<42?(G.slowTime||0)+dt:Math.max(0,(G.slowTime||0)-dt);if(G.slowTime>3){G.adaptiveLow=true;G.recoverTime=0;}if(G.adaptiveLow&&G.frameRate>55){G.recoverTime=(G.recoverTime||0)+dt;if(G.recoverTime>10){G.adaptiveLow=false;G.slowTime=0;}}}G.update(dt);if(G.running)W.renderer.drawGame(G,now/1000);else W.renderer.drawMenu(now/1000);requestAnimationFrame(frame);}
  requestAnimationFrame(frame);
})();
