'use strict';
// Repeatable integration diagnostics. Runs the real page, not a duplicate renderer.
document.getElementById('game-frame').addEventListener('load',()=>{
  const f=document.getElementById('game-frame'),win=f.contentWindow,doc=f.contentDocument,W=win.WL,G=W.game,UI=W.ui;
  let passed=0,failed=0;
  const check=(label,test)=>{if(test){passed++;console.log('PASS: '+label);}else{failed++;console.error('FAIL: '+label);}};
  const press=key=>doc.dispatchEvent(new win.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const release=key=>doc.dispatchEvent(new win.KeyboardEvent('keyup',{key,bubbles:true}));
  const tick=(n=1)=>{for(let i=0;i<n;i++)G.update(1/60);};
  try {
    doc.getElementById('play-button').click();check('JOGAR starts a new game',G.running&&!G.paused&&G.player.health===100);
    G.world.enemies=[];
    const startY=G.player.y;press('s');tick(30);release('s');check('WASD moves the player',G.player.y>startY+70);
    const beforeSprint=G.player.y;press('s');press('Shift');tick(30);release('s');release('Shift');check('Shift increases speed and consumes stamina',G.player.y>beforeSprint+110&&G.player.stamina<100);
    press('Tab');check('TAB opens the inventory and pauses simulation',UI.modal==='inventory'&&G.paused);const pausedAt=G.elapsed;tick(60);check('Inventory freezes survival time',G.elapsed===pausedAt);
    G.player.thirst=30;const water=G.inventory.water;UI.selected='water';UI.renderInventory();doc.querySelector('#item-details button').click();check('Inventory button drinks water and removes one item',G.player.thirst===68&&G.inventory.water===water-1);
    G.player.bleeding=true;G.player.health=60;UI.selected='bandage';UI.renderInventory();doc.querySelector('#item-details button').click();check('Bandage stops bleeding and heals',!G.player.bleeding&&G.player.health===72);
    press('Tab');check('TAB closes inventory and resumes',UI.modal===null&&!G.paused);
    const c=G.world.crates.find(c=>c.category==='starter');G.player.x=c.x;G.player.y=c.y+35;press('e');check('E opens nearby loot',UI.modal==='loot'&&UI.loot===c);const wood=G.inventory.wood;doc.getElementById('take-all-button').click();check('Collect all transfers loot and empties crate',c.looted&&G.inventory.wood===wood+2&&UI.modal===null);
    press('e');check('Loot cannot be collected twice',UI.modal===null&&G.inventory.wood===wood+2);
    const b=G.world.buildings[0];G.player.x=b.door.x;G.player.y=b.y+b.h+35;press('w');tick(30);release('w');check('Closed door blocks movement',G.player.y>=b.y+b.h+10);press('e');check('E opens a door',b.doorOpen);press('w');tick(35);release('w');check('Open door permits entering the house',W.rectContains(b,G.player.x,G.player.y));
    G.player.x=1160;G.player.y=1650;G.player.angle=-Math.PI/2;G.player.ammo=8;G.player.cooldown=0;
    const enemy={x:1160,y:1530,homeX:1160,homeY:1530,angle:0,hp:100,state:'idle',timer:3,attackTimer:0,hitFlash:0,walk:0,dead:false,id:0};G.world.enemies=[enemy];G.shoot();check('Gun consumes ammo and deals damage',G.player.ammo===7&&enemy.hp===66);check('Gun enforces cooldown',G.shoot()===false&&G.player.ammo===7);G.player.cooldown=0;G.shoot();G.player.cooldown=0;G.shoot();check('Three pistol hits kill an infected',enemy.dead&&G.kills===1);
    const reserve=G.inventory.ammo;press('r');check('R starts reloading',G.player.reload>0);tick(90);check('Reload fills magazine from reserves',G.player.ammo===8&&G.inventory.ammo===reserve-3);
    b.doorOpen=false;G.player.x=b.door.x;G.player.y=b.y+b.h+40;G.player.angle=-Math.PI/2;G.player.cooldown=0;Object.assign(enemy,{x:b.door.x,y:b.y+b.h-60,hp:100,dead:false});G.shoot();check('Bullets cannot pass through closed doors',enemy.hp===100);
    G.player.x=1160;G.player.y=1650;Object.assign(enemy,{x:1160,y:1500,hp:100,state:'idle',timer:1,attackTimer:0,dead:false});const oldY=enemy.y;tick(30);check('Infected detects and pursues the player',enemy.state==='chase'&&enemy.y>oldY);
    enemy.x=G.player.x;enemy.y=G.player.y-23;const health=G.player.health;tick(1);check('Nearby infected attacks',G.player.health<health);
    G.world.enemies=[];G.player.bleeding=false;G.player.health=100;G.player.hunger=5;G.player.thirst=5;tick(60);check('Low hunger and thirst damage health and limit stamina',G.player.health<100&&G.player.stamina<=55);
    G.player.hunger=80;G.player.thirst=80;G.player.temperature=36.5;G.weather='rain';G.weatherTimer=100;G.player.x=1160;G.player.y=1650;tick(60);check('Rain lowers temperature outdoors',G.player.temperature<36.5);
    const fire=G.world.fires[0];G.player.x=fire.x+35;G.player.y=fire.y;const temp=G.player.temperature;tick(60);check('Nearby campfire warms the player',G.player.temperature>temp);const fuel=fire.fuel,woodBefore=G.inventory.wood;press('e');check('E fuels the campfire using wood',fire.fuel>fuel&&G.inventory.wood===woodBefore-1);
    G.elapsed=0;const day=G.nightAmount();G.elapsed=90;check('Day/night cycle darkens the world',G.nightAmount()>day);G.weather='normal';G.weatherTimer=.01;tick(2);check('Weather changes automatically',G.weather==='rain');
    press('Escape');check('ESC pauses the game',G.paused&&UI.modal==='pause');doc.getElementById('pause-settings').click();check('Settings accessible from pause',UI.modal==='settings');doc.querySelector('#settings-modal .close-modal').click();check('Closing settings returns to pause',UI.modal==='pause');doc.getElementById('resume-button').click();check('Resume continues the game',!G.paused&&!UI.modal);
    G.damage(200,false);check('Zero health displays death screen',G.player.health===0&&UI.modal==='death'&&G.paused);doc.getElementById('respawn-button').click();check('Respawn resets world, health, ammo and inventory',G.player.health===100&&G.player.ammo===8&&G.inventory.water===2&&G.kills===0&&!G.paused&&G.world.enemies.length===12);
    check('Map includes houses, trees, roads, cars, fire and loot',G.world.buildings.length===8&&G.world.trees.length>150&&G.world.cars.length===5&&G.world.crates.length>=10);
    check('No horizontal document overflow',doc.documentElement.scrollWidth<=win.innerWidth);
    // Leave the actual game in a representative urban view for visual inspection.
    G.player.x=1120;G.player.y=1040;G.player.angle=-Math.PI/3;G.elapsed=23;G.weather='rain';G.weatherTimer=60;G.world.enemies.forEach(e=>{if(W.distance(e,G.player)<350){e.x+=230;e.y-=140;}});G.keys={};G.paused=true;G.updateTarget();UI.updateHUD();doc.getElementById('notifications').replaceChildren();UI.notify('Explore o vale. Entre nas casas e encontre suprimentos.');W.renderer.drawGame(G,1);
  }catch(e){failed++;console.error(e.stack||e.message);}
  const result=document.getElementById('test-result');result.textContent=failed?`${passed} OK · ${failed} FALHA(S) — veja console`:`✓ ${passed} TESTES PASSARAM · DIAGNÓSTICO`;result.classList.toggle('fail',failed>0);result.dataset.complete='true';console.log(`RESULT: ${passed} passed, ${failed} failed`);
});
