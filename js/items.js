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
  for(const [id,w] of Object.entries(W.weapons))W.items[id]={name:w.name,icon:'⌐═',description:`Dano ${w.damage}${w.pellets>1?' × '+w.pellets:''} · alcance ${w.range} · pente ${w.magazineSize}.`,category:'weapons',weapon:true};
  W.items.ammo.category='weapons';W.items.bandage.category='medicine';
  for(const id of ['wood','scrap','tools'])W.items[id].category='resources';
  W.items.wood.icon='≋';W.items.scrap.description='Metal usado para construir baús.';
  W.items.tools.description='Ferramentas de oficina. Reservadas para receitas futuras.';
})();
