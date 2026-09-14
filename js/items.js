'use strict';
(() => {
  const W=WL;
  Object.assign(W.items,{
    water:{name:'Água limpa',icon:'◇',description:'Lacrada. +38 sede. Devolve uma garrafa vazia.',usable:true,hunger:0,thirst:38,effect:null,category:'water'},
    dirtyWater:{name:'Água suja',icon:'◈',description:'+22 sede. 30% de chance de indisposição por 25s.',usable:true,hunger:0,thirst:22,effect:'sick',risk:.3,category:'water'},
    emptyBottle:{name:'Garrafa vazia',icon:'♧',description:'Recipiente vazio. Sem sistema de enchimento nesta versão.',category:'water'},
    food:{name:'Enlatado',icon:'▤',description:'+32 fome, +2 sede.',usable:true,hunger:32,thirst:2,effect:null,category:'food'},
    fruit:{name:'Fruta',icon:'◕',description:'+18 fome, +10 sede.',usable:true,hunger:18,thirst:10,effect:null,category:'food'},
    meat:{name:'Carne cozida',icon:'◓',description:'+42 fome, -5 sede.',usable:true,hunger:42,thirst:-5,effect:null,category:'food'},
    rottenFood:{name:'Comida estragada',icon:'⊗',description:'+12 fome. Causa indisposição por 25s.',usable:true,hunger:12,thirst:-4,effect:'sick',risk:1,category:'food'},
    shells:{name:'Cartuchos calibre 12',icon:'▥',description:'Munição da espingarda.',category:'weapons'},
    rifleAmmo:{name:'Munição de rifle',icon:'▥',description:'Munição de longo alcance.',category:'weapons'},
    helmet:{name:'Capacete',icon:'⌒',description:'Cabeça: +8% proteção.',slot:'head',protection:.08,category:'equipment'},
    jacket:{name:'Jaqueta',icon:'♜',description:'Corpo: +5% proteção; reduz perda de calor na chuva em 55%.',slot:'body',protection:.05,warmth:.55,category:'equipment'},
    trousers:{name:'Calça reforçada',icon:'Π',description:'Pernas: +4% proteção e +2 slots.',slot:'legs',protection:.04,capacity:2,category:'equipment'},
    boots:{name:'Botas de trilha',icon:'⌞',description:'Pés: +5% velocidade.',slot:'feet',speed:.05,category:'equipment'},
    backpack:{name:'Mochila de campo',icon:'▣',description:'Carga: +8 slots. Não pode ser removida se a carga não couber.',slot:'pack',capacity:8,category:'equipment'}
  });
  for(const [id,w] of Object.entries(W.weapons))W.items[id]={name:w.name,icon:'⌐═',description:w.melee?`Melee · dano ${w.damage} · alcance ${w.range} · intervalo ${w.fireRate}s. Ruído baixo, mas audível de perto.`:`Dano ${w.damage}${w.pellets>1?' × '+w.pellets:''} · alcance ${w.range} · pente ${w.magazineSize}.`,category:'weapons',weapon:true};
  W.items.ammo.category='weapons';W.items.bandage.category='medicine';
  for(const id of ['wood','scrap','tools'])W.items[id].category='resources';
  W.items.wood.icon='≋';W.items.scrap.description='Metal recuperado. Guarde para uma próxima jornada.';
  W.items.tools.description='Ferramentas de oficina. Reservadas para receitas futuras.';
  Object.assign(W.items,{
    heavyAmmo:{name:'Munição .45',description:'Cartuchos de pistola pesada.',category:'ammo',weight:.02},
    cloth:{name:'Tecido',description:'Tiras limpas para bandagens e ferramentas.',category:'materials',weight:.1},
    tape:{name:'Fita resistente',description:'Reforço para ferramentas improvisadas.',category:'materials',weight:.15},
    medicine:{name:'Kit médico',description:'Recupera 35 de vida, estanca sangramento e trata indisposição.',usable:true,category:'medicine',weight:.4},
    suppressor:{name:'Silenciador',description:'Acessório: reduz o raio de ruído em 62% em pistolas, SMG e rifle. Não elimina o som.',slot:'accessory',category:'misc',weight:.35},
    watch:{name:'Relógio de pulso',description:'Ao coletar, revela o horário exato no HUD. Continua funcionando após guardar o item.',category:'misc',weight:.08}
  });
  for(const [id,item] of Object.entries(W.items)){
    if(W.weapons[id])item.weight=W.weapons[id].weight;
    if(['ammo','shells','rifleAmmo'].includes(id)){item.category='ammo';item.weight=id==='shells'?.045:.015;}
    if(['wood','scrap'].includes(id))item.category='materials';
    if(id==='tools')item.category='tools';
    if(item.category==='equipment')item.category=id==='backpack'?'misc':'clothes';
    item.weight??=({water:.6,dirtyWater:.6,emptyBottle:.08,food:.4,wood:.6,scrap:.3,tools:1.2,backpack:.8})[id]||.2;
  }
  W.items.tools.description='O kit permite fabricar e reparar ferramentas na bancada.';
  W.items.scrap.description='Metal recuperado para fabricação e reparos.';
  W.items.emptyBottle.description='Recipiente para purificar água suja na bancada.';
  const glyphs={
    watch:'M8 5V1h8v4M8 19v4h8v-4M12 8v5l3 2M5 5h14v14H5z',suppressor:'M3 8h18v8H3z M6 8v8M18 8v8',cloth:'M3 4l17-2-2 19L1 18z M5 8l10 8M6 16l9-10',tape:'M3 12a9 9 0 1 0 18 0 9 9 0 1 0-18 0M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0',medicine:'M3 5h18v16H3z M8 5V2h8v3M12 8v10M7 13h10',
    water:'M10 2h4v4l3 4v11H7V10l3-4z M7 13h10',dirtyWater:'M10 2h4v4l3 4v11H7V10l3-4z M8 14l3 2 4-3',emptyBottle:'M10 2h4v4l3 4v11H7V10l3-4z',
    food:'M5 5c0-3 14-3 14 0v14c0 3-14 3-14 0z M5 5c0 3 14 3 14 0M5 9h14M5 17h14',fruit:'M12 7c8-5 12 5 6 12-3 4-4 1-6 1s-3 3-6-1C0 12 4 2 12 7z M12 7V3l4-2',meat:'M4 10c0-7 14-9 16-2 3 8-8 12-13 11-5-1-5-6-3-9z M9 8c5-3 8 2 3 5s-7 0-3-5',
    bandage:'M3 8l5-5 13 13-5 5z M10 10h4v4h-4z',wood:'M4 5l16 11-4 5L1 10z M7 6l10-4 4 5-7 3',scrap:'M7 3h10v5l4 4-4 4v5H7v-5l-4-4 4-4z M9 9h6v6H9z',tools:'M14 3c-5-1-7 4-4 7L2 18l4 4 8-9c6 2 9-3 7-7l-4 4-3-3z',
    ammo:'M5 21V7l3-5 3 5v14z M14 21V7l3-5 3 5v14z',helmet:'M3 16v-4a9 9 0 0 1 18 0v4z M2 17h20M8 18v3h8v-3',jacket:'M8 3l4 3 4-3 6 5-4 5-2-2v10H8V11l-2 2-4-5z M12 7v14',trousers:'M6 3h12l2 18h-6l-2-11-2 11H4z M6 6h12',boots:'M6 3h8v10l7 4v4H3v-8z M3 17h13',backpack:'M8 6V3h8v3M6 7h12l2 14H4z M8 12h8v6H8z'
  };
  W.itemIcon=id=>W.items[id]?.weapon?W.weaponIcon(id):`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${glyphs[id]||glyphs[id==='rottenFood'?'food':'ammo']}" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
})();
