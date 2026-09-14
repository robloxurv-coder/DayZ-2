'use strict';
(() => {
  const W=WL;
  const canvas=document.getElementById('world-canvas'),ctx=canvas.getContext('2d',{alpha:false});
  const mini=document.getElementById('minimap'),mc=mini.getContext('2d');
  const R=W.renderer={canvas,ctx,width:0,height:0,dpr:1,menuCache:null,terrain:null,camera:{x:0,y:0},time:0};
  const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
  const circle=(c,x,y,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();};
  function pine(c,x,y,h,color,width=.32){
    c.fillStyle=color;c.fillRect(x-h*.018,y-h*.8,h*.035,h*.83);
    for(let j=0;j<6;j++){const yy=y-h+j*h*.115,ww=h*width*(.22+j*.155);poly(c,[[x,yy],[x-ww,yy+h*.31],[x-ww*.65,yy+h*.27],[x+ww,yy+h*.31]],color);}
  }
  R.resize=function(){
    this.width=innerWidth;this.height=innerHeight;this.dpr=Math.min(devicePixelRatio||1,1.6);
    canvas.width=Math.round(this.width*this.dpr);canvas.height=Math.round(this.height*this.dpr);ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.menuCache=null;
  };
  addEventListener('resize',()=>R.resize());R.resize();
  R.makeMenu=function(){
    const c=document.createElement('canvas');c.width=this.width*this.dpr;c.height=this.height*this.dpr;const g=c.getContext('2d');g.scale(this.dpr,this.dpr);
    const w=this.width,h=this.height,rng=W.seeded(43191),sx=w/1440,sy=h/900;
    g.scale(sx,sy);
    let sky=g.createLinearGradient(0,0,0,900);sky.addColorStop(0,'#18251f');sky.addColorStop(.42,'#707761');sky.addColorStop(.65,'#888471');sky.addColorStop(1,'#18241b');g.fillStyle=sky;g.fillRect(0,0,1440,900);
    let glow=g.createRadialGradient(1010,326,10,1010,326,420);glow.addColorStop(0,'#d8c69833');glow.addColorStop(1,'#c9b47b00');g.fillStyle=glow;g.fillRect(450,0,990,780);
    circle(g,1050,251,33,'#c3c3a233');circle(g,1050,251,29,'#bac0a033');
    // Long, overlapping mountain ridges.
    for(let layer=0;layer<4;layer++){
      const pts=[[0,800]];for(let x=0;x<=1500;x+=45)pts.push([x,385+layer*52+Math.sin(x*.005+layer*1.2)*46+Math.sin(x*.015)*17+rng()*19]);pts.push([1500,900]);poly(g,pts,['#626e59','#53614c','#414f3c','#344631'][layer]);
      for(let i=0;i<140;i++){const x=rng()*1500,y=448+layer*48+Math.sin(x*.006+layer)*22;pine(g,x,y,22+rng()*55,['#5a6953','#4b5d45','#3b5038','#2d412e'][layer],.25);}
    }
    // Radio tower in the distant valley.
    g.strokeStyle='#354837';g.lineWidth=2;g.beginPath();g.moveTo(956,457);g.lineTo(978,217);g.lineTo(1000,457);g.moveTo(978,218);g.lineTo(978,181);g.stroke();
    for(let j=0;j<9;j++){let y=240+j*23,half=(y-217)*.095;g.beginPath();g.moveTo(978-half,y);g.lineTo(978+half+2,y+22);g.lineTo(978-half-2,y+22);g.stroke();}
    circle(g,978,205,2,'#c98450');
    poly(g,[[0,680],[500,592],[1010,584],[1440,562],[1440,900],[0,900]],'#273729');
    // Faint town blocks behind the service station.
    for(let i=0;i<9;i++){let x=660+i*70,y=526+rng()*36,hh=22+rng()*27;g.fillStyle='#374535';g.fillRect(x,y-hh,55,hh);poly(g,[[x-4,y-hh],[x+25,y-hh-18],[x+60,y-hh]],'#2b3c2d');g.fillStyle='#7d7e5540';g.fillRect(x+13,y-hh+11,7,9);}
    // Wet road, narrowing toward the abandoned village.
    poly(g,[[962,581],[1006,578],[1260,900],[580,900]],'#343e34');
    poly(g,[[978,584],[986,584],[1034,690],[1017,689]],'#96967b25');
    poly(g,[[1026,711],[1046,711],[1070,755],[1043,756]],'#bbb79635');poly(g,[[1065,795],[1104,795],[1143,875],[1085,875]],'#bcb28f35');
    poly(g,[[952,587],[958,587],[629,900],[614,900]],'#75806440');poly(g,[[1007,589],[1011,590],[1275,900],[1266,900]],'#737e6444');
    for(let i=0;i<80;i++){let yy=620+rng()*280,xx=720+rng()*450;g.fillStyle='#a2aa8910';g.fillRect(xx,yy,10+rng()*80,1);}
    // Service station: a deliberately low-detail, hand-composed illustration.
    poly(g,[[1036,574],[1233,537],[1334,574],[1143,621]],'#4a503d');
    poly(g,[[1143,621],[1334,574],[1334,661],[1143,712]],'#343e2c');
    poly(g,[[1036,574],[1143,621],[1143,712],[1036,653]],'#48503a');
    poly(g,[[1027,574],[1235,531],[1345,569],[1143,625]],'#2d392c');
    poly(g,[[1027,574],[1143,620],[1143,629],[1027,583]],'#777659');
    poly(g,[[1143,620],[1345,569],[1345,580],[1143,630]],'#535d43');
    for(let j=0;j<4;j++)poly(g,[[1165+j*36,629-j*9],[1189+j*36,623-j*9],[1189+j*36,654-j*9],[1165+j*36,661-j*9]],j===1?'#87805a':'#192b24');
    poly(g,[[1061,614],[1095,630],[1095,684],[1061,667]],'#1d2b21');poly(g,[[1066,621],[1089,631],[1089,650],[1066,640]],'#5f694a');
    for(let i=0;i<18;i++){let x=1155+rng()*165,y=674-(x-1155)*.26+rng()*12;g.strokeStyle='#67704d44';g.beginPath();g.moveTo(x,y);g.lineTo(x+rng()*7,y-10-rng()*22);g.stroke();}
    // Rusted canopy and pumps.
    poly(g,[[885,618],[1021,597],[1124,633],[971,666]],'#565a41');
    poly(g,[[885,618],[971,652],[1124,624],[1030,589]],'#535841');
    poly(g,[[885,618],[971,652],[971,663],[885,630]],'#958569');
    poly(g,[[971,652],[1124,624],[1124,636],[971,664]],'#746e50');
    g.fillStyle='#515541';g.fillRect(903,635,5,84);g.fillRect(1094,643,5,70);g.fillStyle='#263528';g.fillRect(967,664,5,86);
    for(let j=0;j<2;j++){let x=954+j*87,y=690-j*13;g.fillStyle='#8c7250';g.fillRect(x,y,19,38);g.fillStyle='#b0a485';g.fillRect(x+2,y-5,15,23);g.fillStyle='#22372b';g.fillRect(x+4,y,11,9);g.strokeStyle='#1e2c23';g.lineWidth=3;g.beginPath();g.moveTo(x+19,y+6);g.bezierCurveTo(x+37,y-2,x+36,y+40,x+19,y+29);g.stroke();}
    // Monument sign and a small orange landmark.
    g.fillStyle='#3f4837';g.fillRect(1253,397,7,167);g.fillStyle='#555b42';g.fillRect(1229,413,60,80);g.fillStyle='#7d8060';g.fillRect(1233,418,52,70);g.fillStyle='#363f2e';g.fillRect(1236,421,46,25);g.fillStyle='#b4a379';g.font='bold 14px monospace';g.fillText('FUEL',1241,439);g.fillStyle='#3e4e37';g.font='9px monospace';g.fillText('NO GAS',1240,465);g.fillText('── ──',1240,480);
    // Abandoned car beside the roadway.
    poly(g,[[795,756],[851,741],[897,758],[839,777]],'#5d6248');poly(g,[[795,756],[839,777],[839,793],[795,773]],'#333f2c');poly(g,[[839,777],[897,758],[897,775],[839,793]],'#434b33');poly(g,[[807,753],[825,730],[857,725],[879,749],[838,768]],'#6f7355');poly(g,[[814,752],[828,735],[850,731],[843,756]],'#293f34');poly(g,[[850,754],[858,734],[873,749]],'#2e4132');circle(g,810,777,8,'#15271e');circle(g,878,780,8,'#15271e');g.fillStyle='#a29c7033';g.fillRect(885,765,6,4);
    // Leaning power poles and suspended wires.
    for(let i=0;i<4;i++){let x=742+i*65,y=848-i*67,hh=220-i*39;g.strokeStyle='#253627';g.lineWidth=7-i;g.beginPath();g.moveTo(x,y);g.lineTo(x-10,y-hh);g.moveTo(x-34,y-hh+15);g.lineTo(x+17,y-hh+9);g.stroke();if(i<3){g.lineWidth=1;g.beginPath();g.moveTo(x-29,y-hh+13);g.quadraticCurveTo(x+10,y-hh+70,x+42,y-67-(hh-39)+12);g.stroke();}}
    // Foreground firs frame the scene, leaving the menu comfortably readable.
    for(let i=0;i<18;i++){let x=1320+rng()*230,y=690+rng()*220;pine(g,x,y,180+rng()*290,'#172c20',.23);}
    for(let i=0;i<10;i++)pine(g,580+rng()*150,785+rng()*130,110+rng()*210,'#1c3022',.25);
    poly(g,[[0,831],[332,803],[565,834],[729,859],[836,900],[0,900]],'#10231a');poly(g,[[1195,900],[1307,800],[1440,740],[1440,900]],'#102319');
    for(let i=0;i<450;i++){let x=rng()*1440,y=780+rng()*120;if(x>760&&x<1190)continue;g.strokeStyle=['#37462b','#293e29','#465034'][i%3];g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x-5+rng()*12,y-7-rng()*21);g.stroke();}
    // Bare branches on the far right.
    g.strokeStyle='#10271c';g.lineWidth=9;g.beginPath();g.moveTo(1445,691);g.lineTo(1390,321);g.lineTo(1408,206);g.moveTo(1400,438);g.lineTo(1327,361);g.lineTo(1314,290);g.moveTo(1393,385);g.lineTo(1440,290);g.stroke();
    g.strokeStyle='#2d3e2b';g.lineWidth=1.2;for(let i=0;i<6;i++){let x=1110+rng()*180,y=290+rng()*50;g.beginPath();g.moveTo(x-5,y);g.quadraticCurveTo(x-2,y-3,x,y);g.quadraticCurveTo(x+3,y-3,x+6,y-1);g.stroke();}
    const vignette=g.createRadialGradient(1000,400,150,750,450,830);vignette.addColorStop(0,'#06130a00');vignette.addColorStop(1,'#06130a9c');g.fillStyle=vignette;g.fillRect(0,0,1440,900);
    this.menuCache=c;
  };
  R.drawMenu=function(t){if(!this.menuCache)this.makeMenu();ctx.drawImage(this.menuCache,0,0,this.width,this.height);if(!matchMedia('(prefers-reduced-motion: reduce)').matches)this.rain(t,.35);};
  R.rain=function(t,alpha=1){
    const count=W.settings?.quality==='low'?35:110;ctx.save();ctx.strokeStyle=`rgba(175,192,170,${.13*alpha})`;ctx.lineWidth=1;ctx.beginPath();for(let i=0;i<count;i++){let x=(i*137.13-t*78)%(this.width+180),y=(i*83.73+t*(370+i%5*30))%(this.height+70);if(x<0)x+=this.width+180;ctx.moveTo(x,y);ctx.lineTo(x-5,y+17);}ctx.stroke();ctx.restore();
  };
  R.prepareTerrain=function(world){
    const c=document.createElement('canvas');c.width=world.width;c.height=world.height;const g=c.getContext('2d');const rng=W.seeded(49);
    g.fillStyle='#3c4831';g.fillRect(0,0,c.width,c.height);
    for(let i=0;i<450;i++){circle(g,rng()*2400,rng()*2000,20+rng()*60,['#414c34','#39452f','#445036','#36442f'][i%4]);}
    // Soil beneath buildings and camp.
    world.buildings.forEach(b=>{g.fillStyle='#5c5a42';g.fillRect(b.x-22,b.y-22,b.w+44,b.h+58);g.fillStyle='#636047';g.fillRect(b.x+b.w/2-27,b.y+b.h,54,54);});
    circle(g,1050,1470,78,'#56563a');
    g.fillStyle='#4e5145';g.fillRect(1084,0,150,2000);g.fillRect(310,920,2090,122);g.fillStyle='#6b6b52';g.fillRect(1082,0,3,2000);g.fillRect(1234,0,3,2000);g.fillRect(310,917,2090,3);g.fillRect(310,1042,2090,3);
    g.fillStyle='#ada77b66';for(let y=30;y<2000;y+=100){if(y>900&&y<1055)continue;g.fillRect(1157,y,4,44);}for(let x=330;x<2400;x+=100){if(x>1080&&x<1240)continue;g.fillRect(x,979,42,3);}
    g.strokeStyle='#242d2780';g.lineWidth=1;for(let i=0;i<110;i++){const x=1090+rng()*140,y=rng()*2000;g.beginPath();g.moveTo(x,y);g.lineTo(x+rng()*12-6,y+12);g.lineTo(x+rng()*15-8,y+25);g.stroke();}
    g.fillStyle='#6c6b5038';g.fillRect(1560,666,400,130);g.fillRect(1760,660,85,274);
    world.grass.forEach(p=>{if(Math.abs(p.x-1160)<81||Math.abs(p.y-980)<65)return;g.strokeStyle=p.n>.5?'#73805842':'#172c1c45';g.lineWidth=1;g.beginPath();g.moveTo(p.x,p.y);g.lineTo(p.x-2,p.y-4-p.n*5);g.moveTo(p.x,p.y);g.lineTo(p.x+3,p.y-3);g.stroke();});
    world.decorations.forEach(d=>{circle(g,d.x+3,d.y+3,d.r,'#25342355');poly(g,[[d.x-d.r,d.y],[d.x-d.r/2,d.y-d.r],[d.x+d.r/2,d.y-d.r*.7],[d.x+d.r,d.y+3],[d.x,d.y+d.r*.4]],'#666952');});
    // Small campsite / tent in the southwestern opening.
    poly(g,[[435,1690],[467,1640],[510,1675],[478,1711]],'#747858');poly(g,[[467,1640],[486,1675],[510,1675]],'#424c32');poly(g,[[470,1649],[487,1675],[478,1677]],'#253520');
    g.font='bold 20px monospace';g.fillStyle='#c3b88a2a';g.save();g.translate(1180,1650);g.rotate(-Math.PI/2);g.fillText('VALE CINZENTO',0,0);g.restore();
    this.terrain=c;
  };
  function drawBuilding(g,b,player){
    const inside=W.rectContains(b,player.x,player.y,3),open=inside||b.doorOpen&&W.distance(player,b.door)<75;
    g.fillStyle='#12221755';g.fillRect(b.x+10,b.y+13,b.w,b.h);
    g.fillStyle='#777560';g.fillRect(b.x,b.y,b.w,b.h);
    g.fillStyle='#585b49';g.fillRect(b.x+12,b.y+12,b.w-24,b.h-24);
    if(open){
      g.strokeStyle='#6b6b542c';g.lineWidth=1;for(let y=b.y+16;y<b.y+b.h-12;y+=19){g.beginPath();g.moveTo(b.x+12,y);g.lineTo(b.x+b.w-12,y);g.stroke();}
      g.fillStyle='#454c39';g.fillRect(b.x+21,b.y+26,46,27);g.fillStyle='#767961';g.fillRect(b.x+24,b.y+29,40,19);g.fillStyle='#3d4a37';g.fillRect(b.x+22,b.y+b.h-61,27,40);g.fillStyle='#8c8567';g.fillRect(b.x+25,b.y+b.h-58,21,16);
      g.fillStyle='#979078';b.walls.forEach(r=>g.fillRect(r.x,r.y,r.w,r.h));
    } else {
      const military=b.type==='military';g.fillStyle=military?'#535b48':b.type==='workshop'?'#707262':'#696956';g.fillRect(b.x+3,b.y+3,b.w-6,b.h-9);
      poly(g,[[b.x+3,b.y+3],[b.x+b.w/2,b.y+3],[b.x+b.w/2,b.y+b.h-6],[b.x+3,b.y+b.h-6]],military?'#606651':'#777561');
      g.strokeStyle='#28352970';g.lineWidth=1;for(let y=b.y+9;y<b.y+b.h-8;y+=13){g.beginPath();g.moveTo(b.x+4,y);g.lineTo(b.x+b.w-4,y);g.stroke();}
      g.fillStyle='#99917a';g.fillRect(b.x+b.w/2-3,b.y,6,b.h-5);g.fillStyle='#353f32';g.fillRect(b.x+25,b.y+26,24,27);g.fillStyle='#88806a';g.fillRect(b.x+23,b.y+23,24,24);g.fillStyle='#364033';g.fillRect(b.x+29,b.y+28,12,12);
      // Dirt and moss break up the roof silhouette.
      g.fillStyle='#4c5f3e88';g.fillRect(b.x+5,b.y+b.h-31,29,21);g.fillRect(b.x+b.w-25,b.y+4,20,33);
    }
    g.fillStyle=b.doorOpen?'#232f22':'#ac8c57';g.fillRect(b.door.x-23,b.y+b.h-9,46,9);if(b.doorOpen){g.fillStyle='#967c50';g.fillRect(b.door.x-23,b.y+b.h-7,7,34);}else{g.fillStyle='#d0b782';g.fillRect(b.door.x+12,b.y+b.h-7,3,4);}
    g.fillStyle='#253224';g.fillRect(b.door.x-26,b.y+b.h+11,52,11);g.fillStyle='#bbc29c';g.font='7px monospace';g.textAlign='center';g.fillText(b.type==='military'?'RESTRITO':b.type==='workshop'?'OFICINA':b.name.startsWith('Mercado')?'MERCADO':'ABRIGO',b.door.x,b.y+b.h+19);g.textAlign='left';
  }
  function drawCar(g,c){g.fillStyle='#17291a66';g.fillRect(c.x+6,c.y+7,c.w,c.h);g.save();g.translate(c.x+c.w/2,c.y+c.h/2);if(c.w>c.h)g.rotate(Math.PI/2);const w=Math.min(c.w,c.h),h=Math.max(c.w,c.h);g.fillStyle='#19271c';g.fillRect(-w/2-3,-h/2+12,w+6,13);g.fillRect(-w/2-3,h/2-24,w+6,13);g.fillStyle=c.color;g.fillRect(-w/2,-h/2,w,h);g.fillStyle='#2b3c34';g.fillRect(-w/2+5,-h/2+19,w-10,15);g.fillRect(-w/2+5,h/2-26,w-10,12);g.fillStyle='#98907666';g.fillRect(-w/2+5,-h/2+37,w-10,18);g.fillStyle='#ccb888';g.fillRect(-w/2+3,-h/2,7,4);g.fillRect(w/2-10,-h/2,7,4);g.fillStyle='#80634a';g.fillRect(-w/2+4,h/2-11,13,8);g.restore();}
  function drawActor(g,a,isPlayer,t){
    g.save();g.translate(a.x,a.y);g.rotate(a.angle);if(a.dead){g.globalAlpha=.7;g.scale(1.3,.55);}
    circle(g,2,4,13,'#101b1399');let walk=Math.sin(a.walk||0)*3;
    g.fillStyle=isPlayer?'#29352a':'#33392a';g.fillRect(-8,-8+walk,9,7);g.fillRect(-8,2-walk,9,7);
    g.fillStyle=a.hitFlash>0?'#c7b799':isPlayer?'#798263':'#6a7355';g.fillRect(-7,-10,16,20);g.fillStyle=isPlayer?'#535f44':'#47533b';g.fillRect(-10,-7,5,14);
    g.fillStyle=isPlayer?'#8d9674':'#88906a';g.fillRect(4,-12,13,5);g.fillRect(5,7,13,5);circle(g,2,0,6,isPlayer?'#b1ab86':'#9a9d79');g.fillStyle=isPlayer?'#606e4d':'#777c58';g.fillRect(-3,-6,7,12);
    if(isPlayer){g.fillStyle='#232d26';g.fillRect(13,-3,15,5);g.fillStyle='#9b9c83';g.fillRect(24,-2,4,3);if(a.muzzle>0){poly(g,[[29,-2],[39,-7],[36,-1],[46,0],[36,2],[39,7],[29,2]],'#efc481');}}
    else if(!a.dead&&a.state==='chase'){g.fillStyle='#aa6d4f';g.fillRect(7,-3,2,2);}
    g.restore();
  }
  R.drawGame=function(game,t){
    const g=ctx,w=this.width,h=this.height,p=game.player,world=game.world;
    const zoom=w<760?.85:1;this.zoom=zoom;
    this.camera.x=Math.max(0,Math.min(world.width-w/zoom,p.x-w/zoom/2));this.camera.y=Math.max(0,Math.min(world.height-h/zoom,p.y-h/zoom/2));
    if(world.width<w/zoom)this.camera.x=(world.width-w/zoom)/2;if(world.height<h/zoom)this.camera.y=(world.height-h/zoom)/2;
    const cx=this.camera.x,cy=this.camera.y,visible=(x,y,pad=100)=>x>cx-pad&&y>cy-pad&&x<cx+w/zoom+pad&&y<cy+h/zoom+pad;
    g.fillStyle='#283827';g.fillRect(0,0,w,h);g.save();g.scale(zoom,zoom);g.translate(-cx,-cy);
    if(this.terrain)g.drawImage(this.terrain,0,0);
    world.fences.forEach(f=>{if(!visible(f.x,f.y,400))return;g.fillStyle='#202e2066';g.fillRect(f.x+3,f.y+6,f.w,f.h);g.fillStyle='#8b8564';g.fillRect(f.x,f.y,f.w,f.h);const horizontal=f.w>f.h;for(let n=0;n<(horizontal?f.w:f.h);n+=24){g.fillStyle='#b0a37a';g.fillRect(f.x+(horizontal?n:-2),f.y+(horizontal?-2:n),horizontal?5:11,horizontal?11:5);}});
    world.buildings.forEach(b=>{if(visible(b.x,b.y,300))drawBuilding(g,b,p);});
    world.cars.forEach(c=>{if(visible(c.x,c.y))drawCar(g,c);});
    world.crates.forEach(c=>{if(!visible(c.x,c.y))return;const b=world.buildings.find(b=>W.rectContains(b,c.x,c.y));if(b&&!W.rectContains(b,p.x,p.y,3)&&!(b.doorOpen&&W.distance(p,b.door)<75))return;g.fillStyle='#1e2e2055';g.fillRect(c.x-12+4,c.y-10+5,25,21);g.fillStyle=c.looted?'#555a40':c.category==='military'?'#65734f':'#a18b5a';g.fillRect(c.x-12,c.y-10,25,21);g.strokeStyle=c.looted?'#787957':'#cfb580';g.lineWidth=2;g.strokeRect(c.x-10,c.y-8,21,17);g.beginPath();g.moveTo(c.x-8,c.y-7);g.lineTo(c.x+9,c.y+7);g.moveTo(c.x+9,c.y-7);g.lineTo(c.x-8,c.y+7);g.stroke();if(!c.looted){circle(g,c.x+11,c.y-10,3,'#d1bd7c');}});
    world.enemies.filter(e=>e.dead).forEach(e=>{if(visible(e.x,e.y))drawActor(g,e,false,t);});
    world.fires.forEach(f=>{
      if(!visible(f.x,f.y))return;circle(g,f.x,f.y,20,'#222d20');for(let i=0;i<8;i++)circle(g,f.x+Math.cos(i*.785)*17,f.y+Math.sin(i*.785)*17,4,'#777761');g.save();g.translate(f.x,f.y);g.rotate(.6);g.fillStyle='#8f6d44';g.fillRect(-14,-3,28,6);g.rotate(1.7);g.fillRect(-13,-3,26,6);g.restore();
      if(f.lit){let glow=g.createRadialGradient(f.x,f.y,3,f.x,f.y,80);glow.addColorStop(0,'#eba85037');glow.addColorStop(1,'#eb9a3200');g.fillStyle=glow;g.fillRect(f.x-80,f.y-80,160,160);for(let i=0;i<4;i++){const z=Math.sin(t*9+i*2);poly(g,[[f.x-8+i*3,f.y+7],[f.x-7+i*3+z*3,f.y-8-i*3-z*3],[f.x+6+i*2,f.y+5]],i%2?'#eab96a':'#ce793d');}for(let i=0;i<4;i++){let a=(t*17+i*11)%40;circle(g,f.x+Math.sin(a*.2+i)*8,f.y-a,1.3,'#daaa6577');}}
    });
    world.enemies.filter(e=>!e.dead).forEach(e=>{if(visible(e.x,e.y))drawActor(g,e,false,t);});drawActor(g,p,true,t);
    game.tracers.forEach(b=>{g.strokeStyle=`rgba(242,216,152,${Math.min(1,b.life*10)})`;g.lineWidth=1.7;g.beginPath();g.moveTo(b.x,b.y);g.lineTo(b.tx,b.ty);g.stroke();});
    game.particles.forEach(b=>{g.globalAlpha=Math.min(1,b.life*3);g.fillStyle=b.color;g.fillRect(b.x,b.y,b.size,b.size);});g.globalAlpha=1;
    world.trees.forEach(tr=>{if(!visible(tr.x,tr.y))return;const near=W.distance(tr,p)<tr.r+24;g.save();if(near)g.globalAlpha=.45;if(W.settings.quality==='high'){g.fillStyle='#10291955';g.beginPath();g.ellipse(tr.x+16,tr.y+19,tr.r*.86,tr.r*1.1,-.5,0,Math.PI*2);g.fill();}g.fillStyle='#665b3d';g.fillRect(tr.x-4,tr.y-3,8,15);const palette=['#263f2c','#304930','#385034'];circle(g,tr.x,tr.y-3,tr.r,palette[tr.shade]);if(tr.pine){for(let j=0;j<7;j++){const angle=j*Math.PI*2/7;poly(g,[[tr.x+Math.cos(angle)*tr.r*1.1,tr.y+Math.sin(angle)*tr.r*1.1],[tr.x+Math.cos(angle+.65)*tr.r*.5,tr.y+Math.sin(angle+.65)*tr.r*.5],[tr.x,tr.y-5]],palette[(tr.shade+1)%3]);}circle(g,tr.x-3,tr.y-6,tr.r*.43,'#435b38');}else{circle(g,tr.x-9,tr.y-9,tr.r*.56,'#496040');circle(g,tr.x+11,tr.y-3,tr.r*.48,'#3d5636');circle(g,tr.x+1,tr.y-16,tr.r*.4,'#526442');}g.restore();});
    world.poles.forEach(po=>{if(!visible(po.x,po.y,360))return;g.strokeStyle='#1c2c2260';g.lineWidth=5;g.beginPath();g.moveTo(po.x,po.y);g.lineTo(po.x+34,po.y+38);g.stroke();g.fillStyle='#68654b';g.fillRect(po.x-3,po.y-39,6,45);g.fillStyle='#97916c';g.fillRect(po.x-16,po.y-35,32,4);g.lineWidth=1;g.strokeStyle='#17291d88';g.beginPath();g.moveTo(po.x+12,po.y-35);g.quadraticCurveTo(po.x+30,po.y+130,po.x+12,po.y+295);g.stroke();});
    // Interaction outline, subtle and only on the closest object.
    if(game.target){const o=game.target;g.strokeStyle='#e5c28d';g.lineWidth=1;g.setLineDash([4,4]);g.beginPath();g.arc(o.x,o.y,o.type==='fire'?27:21,0,Math.PI*2);g.stroke();g.setLineDash([]);}
    g.restore();
    const night=game.nightAmount(),px=(p.x-cx)*zoom,py=(p.y-cy)*zoom;
    if(night>.01){const light=g.createRadialGradient(px,py,55*zoom,px,py,(245-55*night)*zoom);light.addColorStop(0,`rgba(4,12,14,${night*.1})`);light.addColorStop(.58,`rgba(4,12,14,${night*.46})`);light.addColorStop(1,`rgba(4,12,14,${night*.88})`);g.fillStyle=light;g.fillRect(0,0,w,h);world.fires.filter(f=>f.lit).forEach(f=>{const x=(f.x-cx)*zoom,y=(f.y-cy)*zoom;const fire=g.createRadialGradient(x,y,2,x,y,120*zoom);fire.addColorStop(0,`rgba(231,162,61,${night*.23})`);fire.addColorStop(1,'rgba(231,162,61,0)');g.fillStyle=fire;g.fillRect(x-120*zoom,y-120*zoom,240*zoom,240*zoom);});}
    if(game.weather==='rain'){g.fillStyle='#15324122';g.fillRect(0,0,w,h);this.rain(t);}
    const vignette=g.createRadialGradient(w/2,h/2,h*.2,w/2,h/2,Math.max(w,h)*.65);vignette.addColorStop(0,'#07130b00');vignette.addColorStop(1,'#07130b80');g.fillStyle=vignette;g.fillRect(0,0,w,h);
    if(p.hurt>0){g.fillStyle=`rgba(141,45,25,${p.hurt*.22})`;g.fillRect(0,0,w,h);}
    if(game.running&&!game.paused&&!game.touchAim){const x=game.mouse.x,y=game.mouse.y;g.strokeStyle='#d9debb99';g.lineWidth=1;g.beginPath();g.arc(x,y,5,0,6.28);g.moveTo(x-11,y);g.lineTo(x-7,y);g.moveTo(x+7,y);g.lineTo(x+11,y);g.moveTo(x,y-11);g.lineTo(x,y-7);g.moveTo(x,y+7);g.lineTo(x,y+11);g.stroke();}
  };
  R.minimap=function(game){
    const w=mini.width,h=mini.height,world=game.world;mc.fillStyle='#263724';mc.fillRect(0,0,w,h);const sx=w/world.width,sy=h/world.height;mc.fillStyle='#6a7051';mc.fillRect(1084*sx,0,150*sx,h);mc.fillRect(310*sx,920*sy,2090*sx,122*sy);mc.fillStyle='#879173';world.buildings.forEach(b=>mc.fillRect(b.x*sx,b.y*sy,b.w*sx,b.h*sy));mc.fillStyle='#d59d54';world.fires.forEach(f=>mc.fillRect(f.x*sx-2,f.y*sy-2,4,4));world.enemies.forEach(e=>{if(!e.dead&&W.distance(e,game.player)<350)circle(mc,e.x*sx,e.y*sy,1.5,'#c47d5d');});const p=game.player;circle(mc,p.x*sx,p.y*sy,3,'#e5e8ca');mc.strokeStyle='#dbe3bba0';mc.beginPath();mc.moveTo(p.x*sx,p.y*sy);mc.lineTo(p.x*sx+Math.cos(p.angle)*9,p.y*sy+Math.sin(p.angle)*9);mc.stroke();mc.strokeStyle='#b2c19415';for(let x=0;x<w;x+=20){mc.beginPath();mc.moveTo(x,0);mc.lineTo(x,h);mc.stroke();}for(let y=0;y<h;y+=20){mc.beginPath();mc.moveTo(0,y);mc.lineTo(w,y);mc.stroke();}
  };
})();
