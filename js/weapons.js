'use strict';
(() => {
  const W=WL;
  W.weapons={
    gun:{name:'Pistola 9mm',damage:34,range:560,fireRate:.27,magazineSize:8,reloadTime:1.35,spread:0,ammoType:'ammo',noise:650,pellets:1,automatic:false,path:'M5 10h36v9H23l-4 17H9l4-18H5z'},
    shotgun:{name:'Espingarda',damage:24,range:300,fireRate:.85,magazineSize:4,reloadTime:2.4,spread:.19,ammoType:'shells',noise:850,pellets:6,automatic:false,path:'M3 13h54v5H26l-7 7-3 12H5l5-20H3z M28 19h18v4H28z'},
    smg:{name:'SMG',damage:19,range:460,fireRate:.085,magazineSize:24,reloadTime:1.8,spread:.055,ammoType:'ammo',noise:700,pellets:1,automatic:true,path:'M6 12h42v6H34v18H23V21h-7l-3 14H4l5-18H6z M47 13h12v3H47z'},
    rifle:{name:'Rifle',damage:82,range:950,fireRate:.75,magazineSize:5,reloadTime:2.2,spread:.008,ammoType:'rifleAmmo',noise:950,pellets:1,automatic:false,path:'M2 13h20v-3h19v4h21v4H35l-6 8H18L9 36H2l7-18H2z M27 5h15v4H27z'}
  };
  W.weapon=()=>W.weapons[W.game?.equippedWeapon]||null;
  W.weaponIcon=id=>`<svg viewBox="0 0 64 42" aria-hidden="true"><path fill="currentColor" d="${W.weapons[id]?.path||''}"/></svg>`;
})();
