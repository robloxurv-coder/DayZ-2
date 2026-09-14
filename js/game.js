'use strict';
(() => {
  const W=WL;
  const G=W.game={running:false,paused:false,world:null,player:null,keys:{},mouse:{x:innerWidth/2+80,y:innerHeight/2},touchAim:false,tracers:[],particles:[],target:null,elapsed:0,kills:0,looted:0,weather:'normal',weatherTimer:45,uiTimer:0,frameRate:60};
  G.start=function(data=W.maps.valley){
    const world=W.makeWorld(data);
    W.ui?.closeModal(true);this.world=world;this.player={x:world.data.spawn.x,y:world.data.spawn.y,vx:0,vy:0,sick:0,angle:-Math.PI/2,health:100,hunger:82,thirst:76,stamina:100,temperature:36.5,bleeding:false,ammo:8,reload:0,cooldown:0,muzzle:0,hurt:0,walk:0,step:0};
    this.equippedWeapon='gun';this.magazines={gun:8,shotgun:0,smg:0,rifle:0};this.equipment={};this.stacks=[];this.base=[];this.nextId=1;this.placement=null;this.firing=false;this.saveTimer=30;this.targetTimer=0;this.hitMarker=0;this.recoil=0;this.ambientTimer=2;W.renderer.cameraSnap=true;
    this.inventory={water:2,food:2,bandage:2,ammo:24,gun:1,wood:3,scrap:2};this.tracers=[];this.particles=[];this.target=null;this.elapsed=0;this.kills=0;this.looted=0;this.weather='normal';this.weatherTimer=45;this.keys={};this.running=true;this.paused=false;this.uiTimer=0;
    W.renderer.prepareTerrain(this.world);W.audio.init();W.audio.setRain(false);W.ui.showGame();this.updateTarget();W.ui.updateHUD();W.ui.notify('Vale Cinzento. Você está por sua conta.');W.ui.notify('E: saquear perto da caixa · TAB: usar seus suprimentos.');
  };
  G.hour=function(){return (16.5+this.elapsed/20)%24;};
  G.nightAmount=function(){const h=this.hour();if(h>=20||h<5)return 1;if(h>=17)return (h-17)/3;if(h<7)return (7-h)/2;return 0;};
  G.location=function(){let nearest=null,dist=Infinity;for(const o of this.world.poi){const d=W.distance(o,this.player);if(d<o.radius&&d<dist){nearest=o;dist=d;}}return (nearest?.name||this.world.data.name).toUpperCase();};
  G.updateTarget=function(){
    const p=this.player,world=this.world;let best=null,distance=Infinity;
    const consider=o=>{const d=W.distance(p,o);if(d>=(o.type==='fire'?75:65)||d>=distance)return;
      if(o.type==='crate'&&world.buildings.some(b=>W.rectContains(b,o.x,o.y)&&!W.rectContains(b,p.x,p.y)))return;
      best=o;distance=d;};
    for(const b of world.buildings)consider(b.door);for(const o of world.fires)consider(o);for(const o of world.crates)consider(o);for(const o of this.base)if(o.kind==='chest')consider(o);this.target=best;
  };
  G.interact=function(){
    if(!this.running||this.paused||this.player.health<=0)return;this.updateTarget();const o=this.target;if(!o)return;
    if(o.type==='chest'){W.ui.openStorage(o);return;}
    if(o.type==='door'){
      if(o.building.doorOpen&&Math.abs(this.player.x-o.x)<37&&Math.abs(this.player.y-o.y)<20){W.ui.notify('Afaste-se um pouco para fechar a porta.');return;}
      o.building.doorOpen=!o.building.doorOpen;W.audio.play('door');this.updateTarget();
    }else if(o.type==='crate'){
      if(o.looted){W.ui.notify('Nada além de poeira. Já foi saqueado.');return;}
      if(o.items===null)o.items=W.rollLoot(o.category);W.ui.openLoot(o);
    }else if(o.type==='fire'){
      if((this.inventory.wood||0)<1){W.ui.notify('Você precisa de madeira para alimentar a fogueira.','warn');return;}
      this.inventory.wood--;o.fuel=Math.min(600,o.fuel+90);o.lit=true;W.audio.play('use');W.ui.notify('Fogueira alimentada. Aproxime-se para aquecer.');
    }
  };
  G.addItem=(id,qty)=>W.inventory.add(id,qty);
  G.useItem=id=>W.inventory.use(id);
  G.reload=function(){const p=this.player,w=W.weapon();if(!w||!this.running||this.paused||!p||p.health<=0||p.reload>0||p.ammo>=w.magazineSize)return false;if(!(this.inventory[w.ammoType]>0)){W.ui.notify('Sem munição reserva.','warn');return false;}p.reload=w.reloadTime;W.audio.play('reload');return true;};
  // Ray collision with rectangles and circles: no physics engine required.
  W.rayRect=function(x,y,dx,dy,b,max){let lo=0,hi=max;for(const [p,d,min,limit] of [[x,dx,b.x,b.x+b.w],[y,dy,b.y,b.y+b.h]]){if(Math.abs(d)<.00001){if(p<min||p>limit)return Infinity;}else{let a=(min-p)/d,c=(limit-p)/d;if(a>c)[a,c]=[c,a];lo=Math.max(lo,a);hi=Math.min(hi,c);if(lo>hi)return Infinity;}}return lo;};
  W.rayCircle=function(x,y,dx,dy,c,r,max){const ox=x-c.x,oy=y-c.y,b=ox*dx+oy*dy,d=b*b-(ox*ox+oy*oy-r*r);if(d<0)return Infinity;const t=-b-Math.sqrt(d);return t>=0&&t<=max?t:Infinity;};
  G.rayObstacle=function(x,y,dx,dy,max,rects){let dist=max;for(const r of rects||W.solidRects(this.world))dist=Math.min(dist,W.rayRect(x,y,dx,dy,r,max));for(const tr of this.world.trees)dist=Math.min(dist,W.rayCircle(x,y,dx,dy,tr,8,max));return dist;};
  G.shoot=function(autoAim=false){
    const p=this.player,w=W.weapon();if(!w||!this.running||this.paused||!p||p.health<=0||p.cooldown>0||p.reload>0||this.placement)return false;
    if(p.ammo<=0){p.cooldown=.3;W.audio.play('empty');if(!this.firing)W.ui.notify('Pente vazio. Pressione R.','warn');return false;}
    if(autoAim){this.touchAim=true;const e=this.world.enemies.filter(e=>!e.dead&&W.distance(e,p)<w.range).sort((a,b)=>W.distance(a,p)-W.distance(b,p))[0];if(e)p.angle=Math.atan2(e.y-p.y,e.x-p.x);}
    p.ammo--;p.cooldown=w.fireRate;p.muzzle=.09;this.recoil=this.equippedWeapon==='shotgun'?7:3;W.audio.play('shoot-'+this.equippedWeapon);
    for(const e of this.world.enemies)if(!e.dead&&W.distance(e,p)<w.noise){e.state='chase';e.timer=8;}
    const budget=W.config.budget(),rects=W.solidRects(this.world);
    for(let pellet=0;pellet<w.pellets;pellet++){
      const angle=p.angle+(Math.random()-.5)*w.spread*2,dx=Math.cos(angle),dy=Math.sin(angle);let dist=this.rayObstacle(p.x,p.y,dx,dy,w.range,rects),hit=null;
      for(const e of this.world.enemies){if(e.dead)continue;const t=W.rayCircle(p.x,p.y,dx,dy,e,13,w.range);if(t<dist){dist=t;hit=e;}}
      const tx=p.x+dx*dist,ty=p.y+dy*dist;this.tracers.push({x:p.x+dx*23,y:p.y+dy*23,tx,ty,life:.1});
      for(let i=0;i<budget.particleCount&&this.particles.length<budget.particleCap;i++)this.particles.push({x:tx,y:ty,vx:(Math.random()-.5)*90,vy:(Math.random()-.5)*90,life:.25+Math.random()*.25,size:2+Math.random()*2,color:hit?'#994c39':'#b4a87c'});
      if(hit){hit.hp-=w.damage;hit.hitFlash=.13;hit.state='chase';hit.timer=8;this.hitMarker=.16;W.audio.play('impact');if(hit.hp<=0){hit.dead=true;hit.state='dead';this.kills++;W.ui.notify('Infectado neutralizado.');}}
    }
    W.ui.updateHUD();return true;
  };
  G.damage=function(amount,canBleed=true){const p=this.player;if(!p||p.health<=0)return;p.health=Math.max(0,p.health-amount*(canBleed?1-Math.min(.4,W.equipment.bonus('protection')):1));p.hurt=.6;W.audio.play('attack');if(canBleed&&!p.bleeding&&Math.random()<.32){p.bleeding=true;W.ui.notify('Você está sangrando. Use uma bandagem no inventário.','warn');}if(p.health<=0)this.die();};
  G.die=function(){if(!this.running||this.player.health>0)return;this.player.health=0;this.firing=false;this.placement=null;W.save.write();this.paused=true;this.keys={};W.audio.setRain(false);W.ui.updateHUD();W.ui.showDeath();};
  G.updateEnemies=function(dt,rects){
    const p=this.player;
    for(const e of this.world.enemies){
      if(e.dead||W.distance(e,p)>1100)continue;e.hitFlash=Math.max(0,e.hitFlash-dt);e.attackTimer=Math.max(0,e.attackTimer-dt);e.timer-=dt;const dist=W.distance(e,p),detect=this.keys.shift?335:255;
      if(dist<detect){e.state='chase';e.timer=7;}else if(e.state==='chase'&&e.timer<=0&&dist>440){e.state='idle';e.timer=2;}
      let moving=false,speed=25;
      if(e.state==='chase'){
        e.angle=Math.atan2(p.y-e.y,p.x-e.x);speed=e.kind==='runner'?108:e.kind==='tank'?47:66;
        if(dist<29){
          const obstacle=this.rayObstacle(e.x,e.y,Math.cos(e.angle),Math.sin(e.angle),dist,rects);
          if(e.attackTimer<=0&&obstacle>=dist-1){this.damage((e.kind==='tank'?17:10)+Math.random()*3);e.attackTimer=1.2;}
        }else moving=true;
      }else{
        if(e.timer<=0){e.state=e.state==='patrol'?'idle':'patrol';e.timer=2+Math.random()*3;e.angle=W.distance(e,{x:e.homeX,y:e.homeY})>120?Math.atan2(e.homeY-e.y,e.homeX-e.x):Math.random()*Math.PI*2;}
        moving=e.state==='patrol';
      }
      if(moving){const ox=e.x,oy=e.y;W.move(e,Math.cos(e.angle)*speed*dt,Math.sin(e.angle)*speed*dt,11,this.world,rects);if(Math.hypot(ox-e.x,oy-e.y)<speed*dt*.25){const a=e.angle+((e.serial??e.id)%2?1:-1)*1.15;W.move(e,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt,11,this.world,rects);}e.walk+=dt*9;}
      if(p.health<=0)return;
    }
  };
  G.update=function(dt){
    if(!this.running||this.paused||!this.player)return;
    const p=this.player;this.elapsed+=dt;this.weatherTimer-=dt;
    if(this.weatherTimer<=0){this.weather=this.weather==='normal'?'rain':'normal';this.weatherTimer=this.weather==='rain'?60:90;W.audio.setRain(this.weather==='rain');W.ui.notify(this.weather==='rain'?'A chuva chegou. Procure abrigo ou uma fogueira.':'A chuva passou.','normal');}
    const rects=W.solidRects(this.world);let mx=(this.keys.d?1:0)-(this.keys.a?1:0),my=(this.keys.s?1:0)-(this.keys.w?1:0),moving=!!(mx||my);const starving=p.hunger<15||p.thirst<15,staminaMax=starving?55:100;
    const sprint=moving&&this.keys.shift&&p.stamina>3;
    if(moving){const n=Math.hypot(mx,my);mx/=n;my/=n;}
    const speed=(sprint?245:155)*(1+W.equipment.bonus('speed'))*(p.sick>0?.85:1),blend=1-Math.exp(-dt*24),ox=p.x,oy=p.y;
    p.vx+=(mx*speed-p.vx)*blend;p.vy+=(my*speed-p.vy)*blend;
    W.move(p,p.vx*dt,p.vy*dt,12,this.world,rects);
    if(this.touchAim&&moving)p.angle=Math.atan2(my,mx);
    if(Math.hypot(p.x-ox,p.y-oy)>.1){p.walk+=dt*(sprint?17:11);p.step-=dt;if(p.step<=0){W.audio.play('step');p.step=sprint?.23:.36;}}
    p.stamina=Math.max(0,Math.min(staminaMax,p.stamina+(sprint?-25:15)*dt));
    if(!this.touchAim){const r=W.renderer,z=r.zoom||1;p.angle=Math.atan2(this.mouse.y/z+r.camera.y-p.y,this.mouse.x/z+r.camera.x-p.x);}
    p.cooldown=Math.max(0,p.cooldown-dt);p.muzzle=Math.max(0,p.muzzle-dt);p.hurt=Math.max(0,p.hurt-dt);
    const weapon=W.weapon();if(p.reload>0&&weapon){p.reload-=dt;if(p.reload<=0){p.reload=0;const q=Math.min(weapon.magazineSize-p.ammo,this.inventory[weapon.ammoType]||0);p.ammo+=q;this.inventory[weapon.ammoType]-=q;W.audio.play('reload');}}
    if(this.firing&&weapon?.automatic)this.shoot();this.hitMarker=Math.max(0,this.hitMarker-dt);this.recoil=Math.max(0,this.recoil-dt*45);
    if(p.sick>0){p.sick=Math.max(0,p.sick-dt);p.thirst=Math.max(0,p.thirst-dt*.6);}
    p.hunger=Math.max(0,p.hunger-dt*(sprint?.15:.085));p.thirst=Math.max(0,p.thirst-dt*(sprint?.23:.135));
    const sheltered=this.world.buildings.some(b=>W.rectContains(b,p.x,p.y));const warm=this.world.fires.some(f=>f.lit&&W.distance(f,p)<108);
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
