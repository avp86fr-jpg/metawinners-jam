import { getArenaArtwork } from './premium-arenas.js';

// Crowd choreography is driven only by the supplied game state and clock.
// All spectator anatomy is rasterized once; frames draw atlas tiles, not paths.
const TAU=Math.PI*2, TW=40, TH=64, POSES=24, STYLES=12;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const ease=v=>{v=clamp(v);return v*v*(3-2*v);};
const palettes={
  casino:{reaction:.69,flash:'#ffe3ac',shirt:['#5b2236','#193e43','#77552d','#171d32']},
  stadium:{reaction:1,flash:'#dff5ff',shirt:['#26466e','#6b2839','#727d85','#b38743']},
  miami:{reaction:.72,flash:'#ffe2ba',shirt:['#ab664d','#396c6d','#d2b57e','#744f69']},
  bugatti:{reaction:.56,flash:'#b7e9ff',shirt:['#273b4b','#3a3a51','#8e8b7f','#725b47']},
};
const skin=['#d5a67a','#a87550','#69422d','#e5bc98','#b88765','#83533a'];
const hair=['#201a1d','#38251c','#a97939','#101922','#51423b','#c3aa78'];
const atlases=new Map();
const poseTiles=new WeakMap();
const PAINT_W=72,PAINT_H=112,PAINT_FRAMES=12;
const spectatorCrops=[[75,18,237,318],[450,15,176,320],[795,9,232,327],[1173,9,174,326],[87,356,200,338],[431,353,216,342],[790,362,227,332],[1150,353,228,341],[87,706,207,380],[461,700,163,386],[796,708,207,378],[1176,708,194,378]];
let paintedAtlas=null,spectatorRequest=null;
let frontAtlas=null,frontArtwork=null;
function canvas(w,h){
  let c;if(typeof OffscreenCanvas!=='undefined')c=new OffscreenCanvas(w,h);
  else if(typeof document!=='undefined')c=document.createElement('canvas');
  if(!c)return null;c.width=w;c.height=h;return c;
}
function poseTile(source,x,y,w,h){
  let tiles=poseTiles.get(source);if(!tiles){tiles=new Map();poseTiles.set(source,tiles);}
  const key=`${x}:${y}:${w}:${h}`;if(tiles.has(key))return tiles.get(key);
  const tile=canvas(Math.ceil(w),Math.ceil(h));if(!tile)return source;
  tile.getContext('2d').drawImage(source,x,y,w,h,0,0,tile.width,tile.height);
  tiles.set(key,tile);return tile;
}
function path(g,points,fill){g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.closePath();g.fillStyle=fill;g.fill();}
function oval(g,x,y,rx,ry,fill){g.fillStyle=fill;g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);g.fill();}
function limb(g,points,width,color){g.beginPath();g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.lineTo(...points[i]);g.lineWidth=width;g.lineJoin='round';g.lineCap='round';g.strokeStyle=color;g.stroke();}

function spectator(g,style,pose,venue,rear=false){
  const mode=pose<4?'idle':pose<8?'lean':pose<12?'clap':pose<20?'cheer':'phone';
  const phase=(pose%4)/4*TAU, wave=pose>=12&&pose<20?(pose-12)/7:0;
  const leaning=mode==='lean'?Math.sin(phase)*1.25:mode==='idle'?Math.sin(phase)*.35:0;
  const rise=mode==='cheer'?ease(wave)*7:0, x=20+leaning, y=28-rise;
  const shirt=palettes[venue].shirt[style%4], flesh=skin[style%skin.length], locks=hair[(style*7)%hair.length];
  const feminine=style%4===2, jacket=style%3===0, cap=style===5||style===9;
  // A compact seated silhouette: fitted thighs, folded calves, separate shoes.
  path(g,[[x-7,43-rise*.35],[x+8,43-rise*.35],[x+9,52],[x+5,59],[x+1,59],[x+2,50],[x-2,50],[x-3,59],[x-8,59],[x-9,51]],'#192335');
  limb(g,[[x-6,49],[x-5,56]],2,'#354458');limb(g,[[x+5,49],[x+4,57]],2,'#27364b');
  oval(g,x-6,60,4.5,1.9,'#0b1421');oval(g,x+4,60,4.5,1.9,'#101725');
  limb(g,[[x-9,60],[x-3,60]],.7,'#7c8790');limb(g,[[x+1,60],[x+7,60]],.7,'#7c8790');
  // Curved shoulder and torso contours, three tones and narrow cloth highlights.
  g.beginPath();g.moveTo(x-3,y-1);g.bezierCurveTo(x-8,y,x-10,y+3,x-10,y+8);g.lineTo(x-8,45-rise*.45);g.quadraticCurveTo(x,49-rise*.45,x+8,45-rise*.45);g.lineTo(x+10,y+8);g.bezierCurveTo(x+10,y+3,x+7,y,x+3,y-1);g.closePath();g.fillStyle=shirt;g.fill();
  path(g,[[x-9,y+4],[x-5,y+6],[x-4,44-rise*.45],[x-8,44-rise*.45]],'#050e215c');
  path(g,[[x+5,y+3],[x+8,y+5],[x+6,43-rise*.45],[x+3,44-rise*.45]],'#e8f3ff16');
  limb(g,[[x-3,y+13],[x+4,y+14]],.7,'#f7f1df25');
  if(jacket){path(g,[[x-3,y],[x,y+12],[x+3,y],[x+1,y-2],[x-1,y-2]],'#c3c3b6');limb(g,[[x,y+5],[x+.7,y+12]],1.2,'#101c2e');}
  else{limb(g,[[x-3,y],[x,y+2],[x+3,y]],1.2,'#0a152759');if(style%3===1)limb(g,[[x-3,y+7],[x+3,y+7]],1,'#dcd9bc55');}
  let hands;
  if(mode==='cheer'){
    const up=ease(wave),s=style%2?1:-1;
    hands=[[x-10-3*up,y+9-29*up],[x+10+3*up,y+9-(24+3*s)*up]];
  }else if(mode==='clap'){
    const spread=1.8+Math.abs(Math.sin(phase))*4;
    hands=[[x-spread,y+7],[x+spread,y+6]];
  }else if(mode==='phone')hands=[[x-4,y+5],[x+4,y+4+Math.sin(phase)*.5]];
  else if(mode==='lean')hands=[[x-6,y+17],[x+4,y+13]];
  else hands=[[x-7,y+20],[x+7,y+19]];
  for(let side=0;side<2;side++){
    const dir=side?1:-1, shoulder=[x+dir*8,y+5],hand=hands[side];
    const elbow=[x+dir*(mode==='clap'?10:11),mode==='cheer'?(y+4+hand[1])*.5:y+13];
    limb(g,[shoulder,elbow],5.5,shirt);limb(g,[shoulder,elbow],2,'#ffffff12');
    limb(g,[elbow,hand],3.5,flesh);limb(g,[[elbow[0]-.6,elbow[1]],[hand[0]-.6,hand[1]]],.8,'#fff0d02c');
    oval(g,hand[0],hand[1],2.2,2.8,flesh);
    if(mode==='cheer'){limb(g,[[hand[0]-1,hand[1]],[hand[0]-1,hand[1]-3]],.8,flesh);limb(g,[[hand[0]+1,hand[1]],[hand[0]+1,hand[1]-2.5]],.8,flesh);}
  }
  const turn=mode==='idle'?Math.sin(phase)*1.1:mode==='lean'?Math.cos(phase)*.9:0;
  // Neck, ears, cheek shadow, a small nose and hair silhouette survive downsampling.
  oval(g,x,y-1,2.3,4,flesh);oval(g,x+turn,y-7,4.5,6,flesh);
  oval(g,x+turn-4.1,y-6,1.1,1.8,flesh);oval(g,x+turn+4.1,y-6,1,1.8,flesh);
  path(g,[[x+turn+1,y-12],[x+turn+4,y-10],[x+turn+4,y-4],[x+turn+1,y-1]],'#3e241e30');
  if(rear){oval(g,x+turn,y-7.7,4.7,5.4,locks);oval(g,x+turn-1,y-10,2.5,1.5,'#ecd1a31a');}
  else{
    g.beginPath();g.moveTo(x+turn-4.5,y-7);g.quadraticCurveTo(x+turn-6,y-15,x+turn,y-14);g.quadraticCurveTo(x+turn+6,y-15,x+turn+4.5,y-7);g.lineTo(x+turn+2.7,y-11);g.quadraticCurveTo(x+turn,y-10,x+turn-3,y-11);g.closePath();g.fillStyle=locks;g.fill();
    if(feminine){limb(g,[[x-4,y-9],[x-5,y-3],[x-4,y+1]],2.5,locks);limb(g,[[x+4,y-9],[x+5,y-2]],2.5,locks);}
    if(cap){g.fillStyle=style===5?'#224463':'#783144';g.fillRect(x-4.5,y-13,9,3);limb(g,[[x-4,y-10],[x+6,y-10]],1.5,'#a1a9a1');}
    g.fillStyle='#211e23';g.fillRect(x+turn-2.4,y-7.7,.9,.8);g.fillRect(x+turn+1.3,y-7.7,.9,.8);
    limb(g,[[x+turn+.1,y-7],[x+turn+.7,y-5]],.6,'#f7d8b7');
    limb(g,[[x+turn-1.3,y-3.8],[x+turn+1.3,y-3.8]],.65,'#6a3d36');
    if(style===3||style===8){limb(g,[[x-3.5,y-7],[x+3.5,y-7]],1.4,'#17263b');limb(g,[[x-3,y-7.7],[x-1,y-7.7]],.5,'#b6d8e3');}
  }
  if(mode==='phone'){g.fillStyle='#0c1523';g.fillRect(x-2.6,y+1,5,8);g.fillStyle='#b6dbef';g.fillRect(x-1.8,y+2,3.3,5);}
}
function atlas(venue,rear){
  const key=venue+(rear?'-rear':'');if(atlases.has(key))return atlases.get(key);
  const c=canvas(TW*POSES,TH*STYLES);if(!c)return null;
  const g=c.getContext('2d');
  for(let s=0;s<STYLES;s++)for(let p=0;p<POSES;p++){g.save();g.translate(p*TW,s*TH);spectator(g,s,p,venue,rear);g.restore();}
  atlases.set(key,c);return c;
}

/** Optional native-Canvas injection; the browser loads this local sheet lazily. */
export function installArenaSpectators(image){
  if(!(image?.naturalWidth||image?.width))return false;
  const c=canvas(PAINT_W*PAINT_FRAMES,PAINT_H*12);if(!c)return false;
  const g=c.getContext('2d');g.imageSmoothingEnabled=true;
  for(let actor=0;actor<12;actor++)for(let f=0;f<PAINT_FRAMES;f++){
    const [sx,sy,sw,sh]=spectatorCrops[actor],phase=f/(PAINT_FRAMES-1)*TAU;
    const h=96,w=sw/sh*h,ox=f*PAINT_W+PAINT_W/2,oy=actor*PAINT_H+108;
    // Thin horizontal mesh strips articulate head/shoulders while planted feet
    // stay still. These twelve poses are cached, never warped during a frame.
    for(let strip=0;strip<48;strip++){
      const q=strip/48,next=(strip+1)/48,upper=1-ease((q-.2)/.52);
      const sway=Math.sin(phase)*upper*(actor<4?1.25:actor<8?1.6:2.1);
      const pinch=(actor===4||actor===5)?Math.sin(phase)*.035*Math.sin(Math.PI*clamp((q-.2)/.35)):0;
      const scale=1-pinch,dy=Math.sin(phase+actor)*upper*(actor>=8?.8:.25);
      g.drawImage(image,sx,sy+q*sh,sw,(next-q)*sh,ox-w*scale/2+sway,oy-h+q*h+dy,w*scale,h/48+.4);
    }
  }
  paintedAtlas=c;return true;
}
function loadSpectators(){
  if(paintedAtlas||spectatorRequest||typeof Image==='undefined')return;
  spectatorRequest=new Image();spectatorRequest.decoding='async';
  spectatorRequest.onload=()=>{installArenaSpectators(spectatorRequest);spectatorRequest.onload=null;spectatorRequest.onerror=null;};
  spectatorRequest.onerror=()=>{spectatorRequest=null;};
  spectatorRequest.src=new URL('./assets/arenas/spectators.png',import.meta.url).href;
}
function foregroundAtlas(){
  const art=getArenaArtwork('stadium');if(!art)return null;
  if(frontAtlas&&frontArtwork===art)return frontAtlas;
  const plate=canvas(1200,72),out=canvas(60*12,72*22);if(!plate||!out)return null;
  const pg=plate.getContext('2d'),g=out.getContext('2d'),height=art.naturalHeight||art.height,width=art.naturalWidth||art.width;
  pg.drawImage(art,0,height*806/941,width,height*135/941,0,0,1200,72);
  for(let person=0;person<22;person++)for(let f=0;f<12;f++){
    const x=person*1200/22,w=1200/22,phase=f/11*TAU;
    g.save();g.beginPath();g.rect(f*60,person*72,w,72);g.clip();
    for(let band=0;band<24;band++){
      const y=band*3,weight=Math.sin(Math.PI*clamp((y-4)/62));
      // Faces and shoulders lean independently within each fixed seat. Original
      // brushwork, clothing and the seat rail remain exactly the plate's art.
      const shift=Math.sin(phase)*weight*1.7;
      g.drawImage(plate,Math.max(0,x-3),y,Math.min(w+6,1200-Math.max(0,x-3)),3,f*60-3+shift,person*72+y,w+6,3.4);
    }g.restore();
  }
  frontArtwork=art;frontAtlas=out;return out;
}

function seating(id){
  const people=[];let seed=Object.keys(palettes).indexOf(id)*931+17;
  const row=(x0,x1,y,n,height,layer='back',depth=1)=>{
    for(let i=0;i<n;i++){
      const k=seed++,r=hash(k),x=x0+(x1-x0)*(i+.5)/n+(r-.5)*3;
      people.push({x,y:y+(hash(k+30)-.5)*3,h:height*(.9+hash(k+9)*.17),style:Math.floor(hash(k+12)*STYLES),phase:hash(k+1)*TAU,delay:hash(k+5)*.32+x/2200,enthusiasm:.28+hash(k+7)*.72,phone:hash(k+14)>.88,layer,depth,seed:k});
    }
  };
  if(id==='stadium'){
    row(172,1028,116,24,23,'back',.58);row(182,1016,142,22,29,'back',.72);
    row(196,433,177,10,40);row(770,1005,177,10,40);
    row(0,1200,680,22,72,'front');
  }else if(id==='casino'){
    row(300,901,184,22,35,'back',.83);row(298,905,202,20,43);
  }else if(id==='miami'){
    row(348,884,158,18,31,'back',.78);row(334,882,198,18,45);
  }else{
    row(263,936,202,24,40);
  }
  return people;
}

/** One instance per renderer/venue. No timers, random sources, or DOM listeners. */
export function createArenaLife(arenaId='stadium'){
  const id=palettes[arenaId]?arenaId:'stadium';
  loadSpectators();
  return {arenaId:id,people:seating(id),reaction:0,anticipation:0,reactionAt:-100,kind:'idle',
    lastScore:null,lastTime:null,lastElapsed:null,lastState:null,lastPhase:null,lastFlight:null,
    seenEffects:new WeakSet(),lastUpdateTime:null,flashAt:-100,scoreTeam:0};
}
function reset(life,state,t){
  life.reaction=0;life.anticipation=0;life.reactionAt=-100;life.flashAt=-100;life.kind='idle';
  life.lastScore=[...(state?.scores||[0,0])];life.lastFlight=state?.ball?.flight||null;
  life.seenEffects=new WeakSet();for(const e of state?.effects||[])if(e&&typeof e==='object')life.seenEffects.add(e);
  life.lastState=state;life.lastPhase=state?.phase;life.lastElapsed=state?.elapsed;life.lastTime=t;
}
function react(life,t,strength,kind,team){
  life.reactionAt=t;life.reaction=strength;life.kind=kind;life.flashAt=t+.12;life.scoreTeam=team??0;
}
function update(life,t,state){
  if(life.lastUpdateTime===t&&life.lastState===state)return;
  const scores=state?.scores||[0,0],elapsed=state?.elapsed,phase=state?.phase;
  const changed=life.lastState&&life.lastState!==state&&phase!=='attract';
  const restarted=life.lastScore&&scores.some((s,i)=>s<life.lastScore[i]);
  if(!life.lastScore||changed||restarted||t<(life.lastTime??t)||Number.isFinite(elapsed)&&Number.isFinite(life.lastElapsed)&&elapsed<life.lastElapsed-.05)reset(life,state,t);
  const flight=state?.ball?.flight;
  for(let team=0;team<scores.length;team++)if(scores[team]>(life.lastScore?.[team]??scores[team])){
    const dunk=life.lastFlight?.kind==='dunk'||/BOOMSHAKA|DUNK/i.test(state?.announcement||'');
    react(life,t,dunk?1:scores[team]-life.lastScore[team]===3?.9:.74,dunk?'dunk':'score',team);
  }
  for(const e of state?.effects||[]){
    if(!e||typeof e!=='object'||life.seenEffects.has(e))continue;life.seenEffects.add(e);
    if(e.type==='dunk'||e.type==='shake')react(life,t,1,'dunk');
    else if(e.type==='block')react(life,t,.65,'block');
    else if(e.type==='fire')react(life,t,.9,'fire');
    else if(e.type==='burst'&&t-life.reactionAt>.3)react(life,t,/BOOMSHAKA/.test(state?.announcement||'')?1:.72,'score');
  }
  const shot=flight?.kind==='shot'||flight?.kind==='dunk';
  life.anticipation=shot?clamp((flight.elapsed||0)/Math.max(.1,flight.duration||1))*(flight.kind==='dunk'?.9:.65):0;
  life.lastScore=[...scores];life.lastFlight=flight||null;life.lastTime=t;life.lastElapsed=elapsed;
  life.lastState=state;life.lastPhase=phase;life.lastUpdateTime=t;
}
function crowdPose(p,life,t,reduced){
  if(reduced)return 0;
  const age=t-life.reactionAt-p.delay, strength=life.reaction*palettes[life.arenaId].reaction;
  if(age>=0&&age<3.4&&strength*p.enthusiasm>.24){
    const cheer=strength>.8&&p.enthusiasm>.45;
    if(cheer){const lift=ease(age/.42)*(1-ease((age-1.4)/1.3));return 12+Math.min(7,Math.floor(lift*7+.25));}
    return 8+Math.floor((age*7+p.phase)%4);
  }
  if(life.anticipation>.3&&p.enthusiasm>.45)return 4+Math.floor((t*2+p.phase)%4);
  if(p.phone&&Math.sin(t*.22+p.phase)>.3)return 20+Math.floor((t*1.4+p.phase)%4);
  // Independent 3–9 second idles, never a whole row bobbing in unison.
  if(Math.sin(t*.37+p.phase)> .86)return 8+Math.floor((t*4+p.phase)%4);
  if(Math.sin(t*.2+p.phase*2)>.7)return 4+Math.floor((t*1.5+p.phase)%4);
  return Math.floor((t*.8+p.phase)%4);
}
function drawCrowd(g,life,t,reduced,layer){
  if(layer==='front'){
    if(life.arenaId!=='stadium')return;
    const source=foregroundAtlas();if(!source)return;
    g.save();g.imageSmoothingEnabled=true;
    let i=0;for(const p of life.people){if(p.layer!=='front')continue;
      const age=t-life.reactionAt-p.delay,reacting=!reduced&&age>0&&age<3;
      const phase=reduced?0:Math.floor((t*(reacting?2.9:.55)+p.phase)*2)%12;
      g.drawImage(poseTile(source,phase*60,i*72,1200/22,72),i*1200/22,608,1200/22,72);i++;
    }g.restore();return;
  }
  const a=atlas(life.arenaId,layer==='front');if(!a)return;
  g.save();g.beginPath();g.rect(0,layer==='front'?608:0,1200,layer==='front'?72:208);g.clip();
  g.imageSmoothingEnabled=true;
  for(const p of life.people){
    if(p.layer!==layer)continue;
    const pose=crowdPose(p,life,t,reduced), age=t-life.reactionAt-p.delay;
    const breathing=reduced?0:Math.sin(t*1.05+p.phase)*.27;
    const reactionSway=!reduced&&age>0&&age<3?Math.sin(age*5+p.phase)*.55*life.reaction:0;
    const w=p.h*TW/TH;
    g.globalAlpha=p.depth;
    // The painted cast furnishes the closest audience; distant fans and the
    // stadium's rear-facing foreground retain the responsive pose atlas.
    if(paintedAtlas&&layer==='back'&&p.h>30&&p.seed%3!==0){
      const actor=p.style%8,active=!reduced&&age>0&&age<3.4;
      const speed=reduced?0:active?2.6:life.anticipation>.3?1:.48;
      const frame=reduced?0:Math.floor((t*speed+p.phase)*2)%PAINT_FRAMES;
      const pw=p.h*PAINT_W/PAINT_H;
      g.drawImage(poseTile(paintedAtlas,frame*PAINT_W,actor*PAINT_H,PAINT_W,PAINT_H),p.x-pw/2+reactionSway*.35,p.y-p.h,pw,p.h);
    }else g.drawImage(poseTile(a,pose*TW,p.style*TH,TW,TH),p.x-w/2+reactionSway,p.y-p.h+breathing,w,p.h);
  }
  g.restore();
}

let glowAtlas;
function glowTile(){
  if(glowAtlas)return glowAtlas;const c=canvas(96,96);if(!c)return null;
  const g=c.getContext('2d'),rad=g.createRadialGradient(48,48,0,48,48,48);
  rad.addColorStop(0,'#ffffff');rad.addColorStop(.08,'#ffffffcc');rad.addColorStop(.28,'#b2dfff3a');rad.addColorStop(1,'#8bbaff00');g.fillStyle=rad;g.fillRect(0,0,96,96);glowAtlas=c;return c;
}
function glow(g,x,y,r,alpha){const a=glowTile();if(!a)return;g.globalAlpha=alpha;g.drawImage(a,x-r,y-r,r*2,r*2);}
function venueLife(g,life,t,reduced){
  const id=life.arenaId,clock=reduced?0:t,pulse=(Math.sin(clock*.8)+1)*.5;
  const age=t-life.reactionAt,roar=reduced?0:clamp(1-age/2.6)*life.reaction;
  g.save();g.globalCompositeOperation='screen';
  if(id==='casino'){
    for(const [i,x,y] of [[0,63,182],[1,108,197],[2,1090,183],[3,1141,197]])glow(g,x,y,22,.06+.045*Math.sin(clock*1.9+i*1.8)**2);
    for(const x of [342,600,858])glow(g,x,x===600?30:38,40,.035+pulse*.025);
    for(const x of [69,1131]){g.globalAlpha=.12;g.strokeStyle='#f7ce6d';g.lineWidth=1.3;g.beginPath();g.ellipse(x,291,18,5,0,clock*.45,clock*.45+.65);g.stroke();}
  }else if(id==='stadium'){
    g.save();g.beginPath();g.rect(0,0,1200,174);g.clip();
    for(let side=0;side<2;side++){
      const x=side?1000:200,sway=Math.sin(clock*.21+side)*32;
      const grad=g.createLinearGradient(x,0,x+sway,185);grad.addColorStop(0,'#8fdcff');grad.addColorStop(1,'#8fdcff00');
      g.globalAlpha=.035+roar*.03;g.fillStyle=grad;g.beginPath();g.moveTo(x-8,0);g.lineTo(x+8,0);g.lineTo(x+sway+110,185);g.lineTo(x+sway-55,185);g.closePath();g.fill();
    }g.restore();
    g.globalAlpha=.12+roar*.18;g.fillStyle='#b8dcff';
    const x=444+((clock*38)%260);g.fillRect(x,184,Math.min(48,756-x),3);
    if(roar>.05){g.globalAlpha=roar*.16;g.fillStyle='#ffc36b';g.fillRect(446,188,308,4);}
  }else if(id==='miami'){
    for(let i=0;i<22;i++){
      const band=i<11,xx=(band?910:677)+hash(i+11)*(band?198:190),yy=(band?120:115)+hash(i+80)*(band?22:9);
      g.globalAlpha=.12+.18*Math.sin(clock*1.7+i*1.67)**2;g.fillStyle=i%3?'#ffe1a8':'#fff6df';
      g.fillRect(xx+Math.sin(clock*.3+i)*2,yy,2+hash(i+40)*6,.6);
    }
    g.globalCompositeOperation='source-over';g.strokeStyle='#c9ad6460';g.lineWidth=1.1;
    for(const [x,y,dir] of [[82,24,1],[488,24,-1],[628,35,1],[1115,18,-1]])for(let j=0;j<3;j++){
      const bend=Math.sin(clock*.62+j+x)*2.5;
      g.globalAlpha=.36;g.beginPath();g.moveTo(x,y);g.quadraticCurveTo(x+dir*(18+j*9),y-7+bend,x+dir*(28+j*14),y+11+j*6+bend);g.stroke();
    }
  }else{
    const lamps=[[214,135],[307,129],[501,125],[572,112],[894,130],[1000,139]];
    lamps.forEach(([x,y],i)=>glow(g,x,y,11,.06+.08*Math.sin(clock*.6+i*2)**8));
    for(const [x,y] of [[235,57],[600,20],[960,57]])glow(g,x,y,49,.025+pulse*.02);
    // Small moving highlights remain on the polished side aisles.
    for(const side of [0,1])for(let i=0;i<4;i++){
      const x=side?1090+i*13:110-i*13,y=314+i*58+Math.sin(clock*.45+i)*3;
      g.globalAlpha=.04+.02*pulse;g.fillStyle='#b5e5ff';g.fillRect(x,y,2,19+i*4);
    }
  }
  g.restore();
}
function cameraFlashes(g,life,t,reduced,layer){
  if(reduced)return;
  const age=t-life.flashAt,celebration=age>=0&&age<2.1;
  g.save();g.globalCompositeOperation='screen';
  const people=life.people;
  for(let i=0;i<people.length;i++){
    const p=people[i];if(p.layer!==layer||!p.phone&&!(celebration&&i%9===0))continue;
    const cycle=celebration?(age-p.delay)*2.7:(t*.11+p.phase),phase=cycle-Math.floor(cycle);
    if(phase>.038||cycle<0)continue;
    const alpha=(1-phase/.038)*(celebration?.67:.33);
    glow(g,p.x,p.y-p.h*.55,celebration?15:8,alpha);
  }
  g.restore();
}

/** Draw before players with layer:'back', after hoops with layer:'front'. */
export function drawArenaLife(g,life,t=0,state={},options={}){
  if(!g||!life||!palettes[life.arenaId])return;
  t=Number.isFinite(t)?t:0;const layer=options.layer==='front'?'front':'back',reduced=!!options.reducedMotion;
  update(life,t,state);
  g.save();
  if(layer==='back')venueLife(g,life,t,reduced);
  drawCrowd(g,life,t,reduced,layer);cameraFlashes(g,life,t,reduced,layer);
  g.restore();
}
