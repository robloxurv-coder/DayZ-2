'use strict';
(() => {
  const W=WL;
  W.weapons={
    knife:{name:'Faca',melee:true,damage:30,range:48,arc:.7,fireRate:.34,magazineSize:0,reloadTime:0,noise:0,automatic:false,path:'M10 33l7 5 12-15-7-5z M24 17L51 2c0 13-8 20-22 22z'},
    bat:{name:'Bastão',melee:true,damage:42,range:65,arc:.8,fireRate:.62,magazineSize:0,reloadTime:0,noise:0,automatic:false,path:'M8 33l4 5 14-15c9-4 22-12 27-19l-6-3c-8 5-16 16-22 21z'},
    axe:{name:'Machado',melee:true,damage:65,range:59,arc:.75,fireRate:.85,magazineSize:0,reloadTime:0,noise:0,automatic:false,path:'M12 38l5 2L46 5l-5-3z M27 8l8 13c8 0 15-4 20-10L43 3z'},
    gun:{name:'Pistola 9mm',damage:34,range:560,fireRate:.27,magazineSize:8,reloadTime:1.35,spread:0,ammoType:'ammo',noise:650,pellets:1,automatic:false,path:'M5 10h36v9H23l-4 17H9l4-18H5z'},
    shotgun:{name:'Espingarda',damage:24,range:300,fireRate:.85,magazineSize:4,reloadTime:2.4,spread:.19,ammoType:'shells',noise:850,pellets:6,automatic:false,path:'M3 13h54v5H26l-7 7-3 12H5l5-20H3z M28 19h18v4H28z'},
    smg:{name:'SMG',damage:19,range:460,fireRate:.085,magazineSize:24,reloadTime:1.8,spread:.055,ammoType:'ammo',noise:700,pellets:1,automatic:true,path:'M6 12h42v6H34v18H23V21h-7l-3 14H4l5-18H6z M47 13h12v3H47z'},
    rifle:{name:'Rifle',damage:82,range:950,fireRate:.75,magazineSize:5,reloadTime:2.2,spread:.008,ammoType:'rifleAmmo',noise:950,pellets:1,automatic:false,path:'M2 13h20v-3h19v4h21v4H35l-6 8H18L9 36H2l7-18H2z M27 5h15v4H27z'}
  };
  // Shared data contract: the same fields drive combat, icons, audio and save validation.
  Object.assign(W.weapons,{
    heavyPistol:{...W.weapons.gun,name:'Pistola .45',damage:53,range:610,fireRate:.38,magazineSize:7,reloadTime:1.65,ammoType:'heavyAmmo',noise:740,spread:.012},
    club:{...W.weapons.bat,name:'Bastão policial',damage:35,range:58,fireRate:.46},
    hammer:{...W.weapons.axe,name:'Martelo',damage:48,range:49,fireRate:.56,path:'M8 38l5 2L40 5l-5-3z M26 7l7 7 7-7 9 7 6-7L39 0z'},
    crowbar:{...W.weapons.bat,name:'Pé de cabra',damage:46,range:67,fireRate:.65,path:'M9 37l5 3L43 8l8-1 3-5-12-1-6 5z'},
    machete:{...W.weapons.knife,name:'Facão',damage:51,range:64,fireRate:.55},
    shovel:{...W.weapons.axe,name:'Pá',damage:50,range:76,fireRate:.8,path:'M7 36l5 4L37 15l-4-4z M32 10L43 0l13 12-11 10z'},
    spear:{...W.weapons.knife,name:'Lança improvisada',damage:47,range:94,arc:.25,fireRate:.82,path:'M4 39l3 3L50 8l-3-3z M43 7L62 0 51 17z'}
  });
  for(const [id,w] of Object.entries(W.weapons)){
    w.weight=({gun:.9,heavyPistol:1.2,smg:2.4,shotgun:3.5,rifle:3.8,knife:.3,bat:1.1,axe:2.2,club:.8,hammer:.7,crowbar:1.5,machete:.6,shovel:2,spear:1.3})[id];
    w.recoil=w.melee?0:id==='shotgun'?8:id==='smg'?2.3:id==='rifle'?6:3.5;
    w.knockback=w.melee?(id==='knife'?13:id==='axe'?48:32):id==='shotgun'?18:12;
    w.noise=w.melee?(id==='knife'?45:110):w.noise;
    w.maxHits=['axe','bat','machete','shovel'].includes(id)?2:1;
    w.stamina=w.melee?(id==='knife'?5:id==='axe'?16:10):0;
    w.suppressible=!w.melee&&id!=='shotgun';w.durability=w.melee?100:0;
  }
  W.weapon=()=>W.weapons[W.game?.equippedWeapon]||null;
  W.weaponIcon=id=>`<svg viewBox="0 0 64 42" aria-hidden="true"><path fill="currentColor" d="${W.weapons[id]?.path||''}"/></svg>`;
})();
