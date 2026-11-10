import { ROSTER } from './roster.js';
import { getArena, drawArenaBase, drawArenaAmbient } from './arenas.js';
import { ARENA_HELPERS } from './arena-drawing.js';
import { drawSprite, getSpriteBounds, getSpriteAttachment, getSpriteMotionKey, getSpritePoseSnapshot, prepareSpritePose } from './sprites.js';
import { getArenaArtwork, drawPremiumArena } from './premium-arenas.js';
import { getNFTArt } from './nft-art.js';
import { createArenaLife, drawArenaLife } from './arena-life.js';
import { drawPremiumHoop } from './hoop-art.js';

const W=1200,H=680, PIXEL_W=1200,PIXEL_H=680, HEIGHT_SCALE=1.35;
const spriteScale=p=>1.30+(p?.y??300)/2400;
const visualHeight=z=>(Number(z)||0)*HEIGHT_SCALE;
const ENABLE_POSE_TRANSITIONS=true;
// Final player layers have four reusable slots. Reflections and speed echoes
// sample the same completed pose instead of rebuilding its live arms each time.
const PLAYER_LAYER_DENSITY=2,PLAYER_LAYER_LIMIT=768;
const INK='#101b1e', CREAM='#eee9d4', ORANGE='#ff7544';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const mix=(a,b,t)=>a+(b-a)*t;
const point=(x,y)=>({x:600+(x-500)*(.78+y/2000),y:190+y*.68});
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
function poly(g,ps,fill,stroke,width=1){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function line(g,ps,color,width=2,close=false){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));if(close)g.closePath();g.strokeStyle=color;g.lineWidth=width;g.stroke();}
function groundBox(g,x,y,w,h,fill,stroke,width=2){poly(g,[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)],fill,stroke,width);}
function groundCircle(g,x,y,r,start=0,end=Math.PI*2,color=CREAM,width=2,fill){const ps=[];for(let i=0;i<=70;i++){let a=mix(start,end,i/70);ps.push(point(x+Math.cos(a)*r,y+Math.sin(a)*r));}if(fill)poly(g,ps,fill);line(g,ps,color,width);}
function text(g,s,x,y,size=16,color=CREAM,align='center',weight=800){g.font=`${weight} ${size}px "Arial Black", Arial, "DejaVu Sans", sans-serif`;g.textAlign=align;g.fillStyle=color;g.fillText(s,x,y);}
let playerShadow;
function shadowTile(){
  if(playerShadow)return playerShadow;
  const c=document.createElement('canvas');c.width=128;c.height=48;const g=c.getContext('2d');
  g.translate(64,24);g.scale(1,.31);const fade=g.createRadialGradient(0,0,1,0,0,60);
  fade.addColorStop(0,'#080912ad');fade.addColorStop(.45,'#0909124a');fade.addColorStop(1,'#09091200');
  g.fillStyle=fade;g.fillRect(-64,-64,128,128);playerShadow=c;return c;
}

// The independently authored cast is rasterized into cached animation frames.
export function drawCharacter(g,c=ROSTER[0],o={},prepared){drawSprite(g,c,o,prepared);}

const portraitCache=new Map();
const portraitFits=new Map();
function portraitFit(character,w,h){
  const source=getNFTArt(character.id),key=`${character.id}:${w}:${h}`,cached=portraitFits.get(key);
  if(cached?.source===source)return cached.scale;
  let top=0,left=0,right=0,bottom=0;
  for(let i=0;i<12;i++){const b=getSpriteBounds(character,{pose:'idle',time:i/3});top=Math.min(top,b.top);left=Math.min(left,b.left);right=Math.max(right,b.left+b.width);bottom=Math.max(bottom,b.top+b.height);}
  const scale=Math.min(1.62,164/Math.max(1,-top),88*w/h/Math.max(1,-left,right),12/Math.max(1,bottom));
  portraitFits.set(key,{source,scale});return scale;
}
function motionOptions(p,state,t){
  const moving=(p.moveSpeed??Math.hypot(p.vx||0,p.vy||0))>2;
  return {time:t+(p.id||0)*.7,pose:p.anim,phase:p.jumpPhase||p.actionPhase||clamp((p.animTime||0)/(p.actionDuration||.72),0,1),actionPhase:p.actionPhase,running:moving,hasBall:state.ball?.owner===p.id,speed:p.moveSpeed??Math.hypot(p.vx||0,p.vy||0),moveSpeed:p.moveSpeed,moveDirection:p.moveDirection,shuffling:p.shuffling,passFacing:p.passFacing,dribbleFrequency:p.dribbleFrequency,worldToSprite:(.78+p.y/2000)/spriteScale(p),velocity:{x:p.vx||0,y:p.vy||0},stridePhase:p.stridePhase,dribblePhase:p.dribblePhase,dribbleHandContact:p.dribbleHandContact,gatherPhase:p.gatherPhase,gatherStartHeight:p.gatherStartHeight,dunkStage:p.dunkStage,dunkReleasePhase:p.dunkReleasePhase,defending:p.defending??p.team!==state.possession,turbo:(p.turboCarry||0)>0,jumping:visualHeight(p.jump),released:p.shotSetup?.released,team:p.team,facing:p.facing||1};
}
export function drawPortrait(canvas,character,options={}){
  const g=canvas.getContext('2d');if(!g)return;
  const w=canvas.width||200,h=canvas.height||200;
  g.clearRect(0,0,w,h);g.imageSmoothingEnabled=false;g.save();g.scale(w/200,h/200);
  const grd=g.createRadialGradient(100,95,8,100,110,130);grd.addColorStop(0,character.color+'63');grd.addColorStop(1,'#0a0c22');g.fillStyle=grd;g.fillRect(0,0,200,200);
  poly(g,[{x:12,y:22},{x:62,y:12},{x:174,y:173},{x:125,y:184}],character.color+'19');
  for(let y=130;y<200;y+=12)line(g,[{x:0,y},{x:200,y}],character.accent+'14',1);
  for(let x=-120;x<360;x+=35)line(g,[{x:100+(x-100)*.35,y:130},{x,y:200}],character.accent+'14',1);
  text(g,character.number,187,68,62,'#ffffff0a','right');
  g.fillStyle='#060818c0';g.beginPath();g.ellipse(100,184,47,10,0,0,Math.PI*2);g.fill();
  g.strokeStyle=character.accent+'80';g.lineWidth=1;g.stroke();
  rect(g,12,18,3,28,character.accent);rect(g,185,155,3,28,character.accent);
  // Card canvases can be rectangular and detached; sprite proportions stay square.
  g.save();g.translate(100,183);g.scale(h/w,1);
  drawCharacter(g,character,{x:0,y:0,scale:portraitFit(character,w,h),time:options.time||0,team:undefined});g.restore();
  g.restore();
}
export function portraitData(character){
  if(portraitCache.has(character.id))return portraitCache.get(character.id);
  const c=document.createElement('canvas');c.width=240;c.height=240;drawPortrait(c,character);const url=c.toDataURL('image/png');portraitCache.set(character.id,url);return url;
}

export function createAttractState(roster=ROSTER,t=0){
  const jump=75+Math.sin(t*2.4)*22;
  return {phase:'attract',players:[
    {id:0,team:0,character:roster[0],x:345+Math.sin(t*.7)*12,y:340,vx:1,vy:0,facing:1,anim:'dribble',jump:0,stamina:100,hasBall:false},
    {id:1,team:0,character:roster[1],x:765+Math.sin(t)*7,y:300,vx:0,vy:0,facing:1,anim:'dunk',jump,jumpPhase:.43+Math.sin(t*1.2)*.13,stamina:100,hasBall:true},
    {id:2,team:1,character:roster[2],x:590+Math.sin(t*.8)*9,y:218,vx:-1,vy:0,facing:-1,anim:'run',jump:0,stamina:100,hasBall:false},
    {id:3,team:1,character:roster[5],x:672+Math.sin(t*.6)*15,y:418,vx:-1,vy:0,facing:-1,anim:'run',jump:8+Math.sin(t*2)*8,stamina:100,hasBall:false},
  ],controlled:0,scores:[12,8],time:88,ball:{x:786,y:300,z:jump+106,owner:1},effects:[],fire:[0,0],charge:{active:false,amount:0}};
}

function drawBlacktopBase(g){
    const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#111e22');bg.addColorStop(.48,'#223237');bg.addColorStop(1,'#172626');g.fillStyle=bg;g.fillRect(0,0,W,H);
    // Distant city, windows, industrial court lights.
    for(let i=0;i<20;i++){const x=i*70-40,h=45+hash(i)*130,y=200-h;rect(g,x,y,64,h,'#111c20');for(let yy=y+12;yy<190;yy+=15)for(let xx=x+8;xx<x+58;xx+=12)if(hash(i*29+xx+yy)>.6)rect(g,xx,yy,3,5,hash(xx)>.6?'#c6925148':'#6c96984a');}
    const moon=g.createRadialGradient(880,38,2,880,38,180);moon.addColorStop(0,'#b7d8bf15');moon.addColorStop(1,'#b7d8bf00');g.fillStyle=moon;g.fillRect(680,0,400,220);
    // Court banner and wire fence.
    rect(g,30,158,1140,74,'#111d21');rect(g,30,158,1140,4,'#4d5b56');
    g.strokeStyle='#b5b9a313';g.lineWidth=1;for(let x=-90;x<1250;x+=26){line(g,[{x,y:156},{x:x+80,y:235}],'#b5b9a313',1);line(g,[{x:x+80,y:156},{x,y:235}],'#b5b9a313',1);}
    for(const x of [70,1130]){rect(g,x-3,37,6,195,'#5a6458');rect(g,x-33,34,66,15,'#19272b');for(let j=0;j<4;j++)rect(g,x-27+j*15,38,10,7,'#efe9c7');poly(g,[{x:x-28,y:50},{x:x+28,y:50},{x:x+145,y:260},{x:x-145,y:260}],'#f9e9ae04');}
    // Pixel spectators in alternating rows.
    for(let row=0;row<2;row++)for(let i=0;i<61;i++){const x=30+i*19+row*5,y=204+row*15,h=7+Math.floor(hash(i+row*99)*7);rect(g,x,y-h,8,h,'#313b38');rect(g,x+1,y-h-6,6,6,['#79816d','#b18a66','#8d8270','#8a998b'][Math.floor(hash(i*3)*4)]+'75');rect(g,x-2,y-h+4,12,h-4,['#c17e4b','#688f91','#b1b39a','#78678b'][i%4]+'50');}
    // Low court wall and its typography.
    groundBox(g,0,-15,1000,45,'#142429');groundBox(g,0,20,1000,15,'#2c4647');
    text(g,'NIGHT COURT  /  EST. 2026',600,194,10,'#b5baa085');text(g,'METAWINNERS',340,194,12,'#d6d7bd');text(g,'PLAY LOUD.',865,194,12,'#d6d7bd');
    ARENA_HELPERS.drawCourt(g,{surround:'#101f30',apron:'#71324e',left:'#274a51',right:'#29464b',key:'#b55d3c',center:'#142f3e',line:'#e6d7aa',logo:'#ffcf71',material:'paint',label:'NIGHT LEAGUE  /  METAWINNERS'});
    // Small foreground weeds and pavement seams.
    for(let i=0;i<16;i++){let x=hash(i+50)*1200,y=606+hash(i+100)*65;rect(g,x,y,5,2,'#52605230');}
    const vg=g.createRadialGradient(600,360,190,600,360,720);vg.addColorStop(0,'#07101500');vg.addColorStop(1,'#07101590');g.fillStyle=vg;g.fillRect(0,0,W,H);
  }

// Immutable venue backgrounds are shared by thumbnails, previews and matches.
const arenaBackgrounds=new Map();
const arenaCeilings=new Map();
function arenaCeiling(arena){
  const artwork=getArenaArtwork(arena.id),cached=arenaCeilings.get(arena.id);
  if(cached?.artwork===artwork)return cached.canvas;
  const c=document.createElement('canvas');c.width=W;c.height=400;const g=c.getContext('2d');
  if(artwork){
    // Extend the actual venue above the camera during high-flying dunks.
    g.imageSmoothingEnabled=true;g.drawImage(artwork,0,0,artwork.width,Math.min(300,artwork.height),0,0,W,400);
    const fade=g.createLinearGradient(0,0,0,400);fade.addColorStop(0,'#030611f0');fade.addColorStop(1,'#03061128');g.fillStyle=fade;g.fillRect(0,0,W,400);
    arenaCeilings.set(arena.id,{artwork,canvas:c});return c;
  }
  const sky=arena.id==='miami',warm=arena.id==='casino',base=sky?'#b476a7':warm?'#171321':'#081525';
  g.fillStyle=base;g.fillRect(0,0,W,400);
  if(sky){
    const grad=g.createLinearGradient(0,0,0,400);grad.addColorStop(0,'#675787');grad.addColorStop(1,base);g.fillStyle=grad;g.fillRect(0,0,W,400);
    for(let i=0;i<22;i++)rect(g,hash(i+770)*W,30+hash(i+71)*320,40+hash(i)*180,3+i%3*2,'#f1b3b41b');
  }else{
    const metal=warm?'#71503d':'#29465c',lit=warm?'#f4ca76':'#a7edff';
    for(let y=25;y<400;y+=76){line(g,[{x:0,y},{x:W,y}],metal,4);for(let x=-40;x<W;x+=100){line(g,[{x,y},{x:x+50,y:y+38},{x:x+100,y}],metal,2);}}
    for(let x=90;x<W;x+=250){rect(g,x-30,300,60,14,'#080b1b');for(let k=0;k<4;k++)rect(g,x-24+k*13,304,9,5,lit);}
    const shade=g.createLinearGradient(0,0,0,400);shade.addColorStop(0,'#050619ee');shade.addColorStop(1,'#05061900');g.fillStyle=shade;g.fillRect(0,0,W,400);
  }
  arenaCeilings.set(arena.id,{artwork,canvas:c});return c;
}
function arenaBackground(id){
  const arena=getArena(id),artwork=getArenaArtwork(arena.id),cached=arenaBackgrounds.get(arena.id);if(cached?.artwork===artwork)return cached.canvas;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
  const g=canvas.getContext('2d');if(!drawPremiumArena(g,arena.id)&&!drawArenaBase(g,arena.id,ARENA_HELPERS))drawBlacktopBase(g);
  arenaBackgrounds.set(arena.id,{artwork,canvas});return canvas;
}
export function drawArenaThumbnail(canvas,id='casino'){
  const g=canvas.getContext('2d'),arena=getArena(id);if(!g)return;
  const w=canvas.width||600,h=canvas.height||340,scale=Math.min(w/W,h/H);
  g.save();g.setTransform(1,0,0,1,0,0);g.fillStyle='#101719';g.fillRect(0,0,w,h);
  g.translate((w-W*scale)/2,(h-H*scale)/2);g.scale(scale,scale);g.imageSmoothingEnabled=true;
  g.drawImage(arenaBackground(arena.id),0,0);
  const view={arena};for(const side of [0,1]){CourtRenderer.prototype.drawHoop.call(view,g,side,0,false);CourtRenderer.prototype.drawHoop.call(view,g,side,0,true);}
  g.restore();
}

export class CourtRenderer {
  constructor(canvas,{arena='casino',reducedMotion}={}){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.scene=document.createElement('canvas');this.scene.width=PIXEL_W;this.scene.height=PIXEL_H;this.sceneContext=this.scene.getContext('2d');this.reducedMotion=reducedMotion??(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);this.camera={x:600,y:340,zoom:1};this.playerMotion=new Map();this.playerLayers=new Map();this.labelWidths=new Map();this.ballTrail=[];this.setArena(arena);this.resize();}
  setArena(id){const previous=this.arena?.id;this.arena=getArena(id);this.artwork=getArenaArtwork(this.arena.id);this.base=arenaBackground(this.arena.id);this.ceiling=arenaCeiling(this.arena);if(previous!==this.arena.id||!this.life)this.life=createArenaLife(this.arena.id);return this;}
  resize(){
    const dpr=Math.min(window.devicePixelRatio||1,2),bounds=this.canvas.getBoundingClientRect();
    const cw=Math.max(1,bounds.width||W),ch=Math.max(1,bounds.height||H);
    const fit=typeof getComputedStyle==='function'?getComputedStyle(this.canvas).objectFit:'contain';
    // Keep the intrinsic bitmap at the court's 30:17 aspect ratio. Giving the
    // bitmap the CSS box's portrait ratio defeats object-fit and squashes play.
    const fitScale=fit==='cover'?Math.max(cw/W,ch/H):Math.min(cw/W,ch/H);
    const width=Math.max(30,Math.round(Math.min(2,fitScale*dpr)*W/30)*30),height=width*17/30;
    if(this.canvas.width!==width||this.canvas.height!==height){this.canvas.width=width;this.canvas.height=height;}
    this.ctx.imageSmoothingEnabled=true;
  }
  drawBase(g){if(!drawPremiumArena(g,this.arena.id)&&!drawArenaBase(g,this.arena.id,ARENA_HELPERS))drawBlacktopBase(g);}
  preparePlayerFrames(state,t){
    if(this.motionState!==state||t<this.motionTime){this.playerMotion.clear();this.motionState=state;}
    this.motionTime=t;this.playerFrames=new Map();
    for(const p of state.players||[]){
      const pos=point(p.x,p.y),jump=visualHeight(p.jump),sc=spriteScale(p),art=p.character||ROSTER[p.id%ROSTER.length];
      const previous=this.playerMotion.get(p.id)||{airborne:false,landingAt:-99,pose:p.anim};
      if(jump>8)previous.airborne=true;
      if(previous.airborne&&jump<.01){previous.airborne=false;previous.landingAt=t;previous.landingPose=previous.pose;}
      const engineLanding=p.anim==='land',landingDuration=engineLanding?p.actionDuration||.18:.24;
      const landingAge=engineLanding?(p.actionPhase||0)*landingDuration:t-previous.landingAt;
      const landing=engineLanding||landingAge>=0&&landingAge<landingDuration&&jump<.01&&['idle','run','dribble'].includes(p.anim);
      const airborneAction=p.anim==='block'&&['pass','shoot'].includes(p.airborneAction)?p.airborneAction:null;
      const airbornePhase=airborneAction?(airborneAction==='pass'?.40:.48)+(airborneAction==='pass'?.60:.52)*clamp(p.airborneActionPhase||0,0,1):null;
      const flight=state.ball?.flight,holdingShot=state.ball?.owner===p.id&&p.shotSetup;
      const dunkHand=flight?.kind==='dunk'&&flight.shooter===p.id;
      const holdingPass=flight?.kind==='pass'&&flight.heldBy===p.id;
      const holdingAirborne=state.ball?.owner===p.id&&!!p.airborneCatch;
      const dribbling=state.ball?.owner===p.id&&!p.shotSetup&&!p.leap&&!holdingAirborne&&p.jump<2;
      let ballHand=null;
      if(holdingShot||dunkHand||dribbling||holdingPass||holdingAirborne){
        const hand=point(state.ball.x,state.ball.y),relativeHeight=state.ball.z-(p.jump||0);
        // Fingers push the top of a dribble and support an overhead gather from
        // underneath. Putting every palm at ball center forced unnatural reach.
        let palm=dribbling?-6:mix(-6,5,clamp((relativeHeight-52)/52,0,1));
        if(dunkHand)palm=mix(palm,-5,clamp(((p.jumpPhase||0)-.78)/.18,0,1));
        if(holdingPass)palm=2;
        const facing=holdingPass?p.passFacing||p.facing||1:p.facing||1;
        ballHand={x:(hand.x-pos.x)/sc*facing,y:(hand.y-visualHeight(state.ball.z)-pos.y+jump)/sc+palm};
      }
      const visualPhase=holdingAirborne?0:airbornePhase;
      const options={...motionOptions(p,state,t),x:pos.x,y:pos.y-jump,scale:sc,pose:landing?'land':holdingAirborne?'pass':airborneAction||p.anim,phase:landing?landingAge/landingDuration:visualPhase??(p.jumpPhase||p.actionPhase||0),actionPhase:landing?landingAge/landingDuration:visualPhase??p.actionPhase,passFacing:holdingAirborne?p.facing:p.passFacing,gatherLow:holdingAirborne?false:undefined,released:airborneAction==='shoot'||!!p.shotSetup?.released,landFrom:previous.landingPose,ballHand,ballHandContact:holdingAirborne?1:holdingShot||dunkHand||holdingPass?p.gatherHandContact??1:1,dribbling,knockDirection:(Math.sign(p.knockback?.vx||-p.facing)||-1)*(p.facing||1)};
      const effectiveFacing=(options.pose==='pass'?options.passFacing??options.facing:options.facing)===-1?-1:1;
      const key=`${getSpriteMotionKey(art,options)}:${effectiveFacing}`;
      if(ENABLE_POSE_TRANSITIONS&&previous.options&&key!==previous.key){previous.transitionFrom={poseSnapshot:getSpritePoseSnapshot(art,previous.options,previous.prepared),facing:previous.facing};previous.transitionAt=t;}
      const transitionAge=t-(previous.transitionAt??-99);
      if(ENABLE_POSE_TRANSITIONS&&previous.transitionFrom&&transitionAge<.12){options.transitionFrom=previous.transitionFrom;options.transitionProgress=clamp(transitionAge/.12,0,1);}
      const prepared=prepareSpritePose(art,options);
      previous.options=options;previous.prepared=prepared;previous.key=key;previous.pose=p.anim;previous.facing=effectiveFacing;previous.time=t;
      const bounds=this.artwork||p.id===state.controlled||p.jump>15?getSpriteBounds(art,options,prepared):null;
      this.playerMotion.set(p.id,previous);this.playerFrames.set(p.id,{options,prepared,landing,landingAge,bounds});
    }
    for(const id of this.playerLayers.keys())if(!this.playerFrames.has(id))this.playerLayers.delete(id);
  }
  rasterPlayer(p,frame){
    const options=frame.options,scale=PLAYER_LAYER_DENSITY,bounds=frame.bounds??=getSpriteBounds(p.character||ROSTER[p.id%ROSTER.length],options,frame.prepared);
    const facing=(options.pose==='pass'?options.passFacing??options.facing:options.facing)===-1?-1:1;
    const left=facing<0?-bounds.left-bounds.width:bounds.left,top=bounds.top;
    const width=Math.ceil(bounds.width*scale),height=Math.ceil(bounds.height*scale);
    // Invalid or unusually large third-party art falls back to direct drawing.
    if(!Number.isFinite(width+height)||width<1||height<1||width>PLAYER_LAYER_LIMIT||height>PLAYER_LAYER_LIMIT)return;
    let layer=this.playerLayers.get(p.id);
    if(!layer){if(this.playerLayers.size>=4)this.playerLayers.delete(this.playerLayers.keys().next().value);const canvas=document.createElement('canvas');canvas.width=canvas.height=32;layer={canvas,g:canvas.getContext('2d')};this.playerLayers.set(p.id,layer);}
    if(layer.canvas.width<width)layer.canvas.width=Math.ceil(width/32)*32;
    if(layer.canvas.height<height)layer.canvas.height=Math.ceil(height/32)*32;
    const g=layer.g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,layer.canvas.width,layer.canvas.height);
    g.setTransform(scale,0,0,scale,-left*scale,-top*scale);
    drawCharacter(g,p.character||ROSTER[p.id%ROSTER.length],{...options,x:0,y:0,scale:1},frame.prepared);
    frame.raster={canvas:layer.canvas,left,top,width:bounds.width,height:bounds.height,pixelWidth:width,pixelHeight:height};
  }
  drawPlayer(g,p,frame,x=frame.options.x,y=frame.options.y){
    const image=frame.raster,sc=frame.options.scale;
    if(image)g.drawImage(image.canvas,0,0,image.pixelWidth,image.pixelHeight,x+image.left*sc,y+image.top*sc,image.width*sc,image.height*sc);
    else drawCharacter(g,p.character||ROSTER[p.id%ROSTER.length],{...frame.options,x,y},frame.prepared);
  }
  releasePlayerLayers(){
    for(const layer of this.playerLayers.values())layer.canvas.width=layer.canvas.height=1;
    this.playerLayers.clear();
    for(const frame of this.playerFrames?.values()||[])delete frame.raster;
  }
  drawPlayerLabels(g,players,state){
    if(state.phase==='attract'){this.labelPlacements=[];return;}
    const boxes=[],placements=[];
    const zoom=this.camera?.zoom||1,camera=this.camera||{x:600,y:340};
    const view={left:camera.x-W/(2*zoom)+10/zoom,right:camera.x+W/(2*zoom)-10/zoom,top:camera.y-H/(2*zoom)+14/zoom,bottom:camera.y+H/(2*zoom)-12/zoom};
    g.save();g.font='800 11px "Barlow Condensed", "Arial Narrow", sans-serif';g.textAlign='center';
    const fontReady=typeof document.fonts?.check==='function'?document.fonts.check('800 11px "Barlow Condensed"'):true;
    if(this.labelFontReady!==fontReady){this.labelWidths.clear();this.labelFontReady=fontReady;}
    const ordered=players.slice().sort((a,b)=>(b.id===state.controlled)-(a.id===state.controlled)||a.id-b.id);
    for(const p of ordered){
      const pos=point(p.x,p.y),label=p.character?.name||'PLAYER';
      let width=this.labelWidths.get(label);if(width==null){width=Math.ceil(g.measureText(label).width)+12;if(this.labelWidths.size>=32)this.labelWidths.clear();this.labelWidths.set(label,width);}
      // Don't drag an offscreen opponent's name onto the edge of the camera.
      if(p.id!==state.controlled&&(pos.x<view.left-35||pos.x>view.right+35||pos.y<view.top-25||pos.y>view.bottom+45))continue;
      const intersects=b=>boxes.some(a=>b.left<a.right+4&&b.right>a.left-4&&b.top<a.bottom+3&&b.bottom>a.top-3);
      let box,found=false;
      // Prefer a short stack, then a side column for staggered overlapping feet.
      // Each label includes spacing for the selected player's stamina bar.
      for(const dx of [0,-width-8,width+8]){
        for(const offset of [0,22,44,66,-22,-44,-66]){const x=clamp(pos.x+dx,view.left+width/2,view.right-width/2),y=clamp(pos.y+23+offset,view.top+11,view.bottom-9);box={left:x-width/2,right:x+width/2,top:y-11,bottom:y+5,x,y};if(!intersects(box)){found=true;break;}}
        if(found)break;
      }
      boxes.push(box);placements.push({p,pos,label,box});
    }
    for(const {p,pos,label,box} of placements){
      const selected=p.id===state.controlled,color=p.team===0?ORANGE:'#78d7ef';
      if(Math.abs(box.y-pos.y-23)>.5||box.x!==pos.x)line(g,[{x:pos.x,y:pos.y+8},{x:box.x,y:box.top}],color+'70',.75);
      rect(g,box.left,box.top,box.right-box.left,16,selected?'#11101dde':'#11101da8');
      rect(g,box.left,box.top,2,16,color);g.fillStyle=selected?'#ffe1ad':'#f5efdf';g.fillText(label,box.x,box.y+1);
      if(selected){rect(g,box.left+3,box.bottom+2,box.right-box.left-6,2,'#0c1c20');rect(g,box.left+3,box.bottom+2,(box.right-box.left-6)*clamp((p.stamina??100)/100,0,1),2,ORANGE);}
    }
    g.restore();this.labelPlacements=placements.map(({p,box})=>({id:p.id,...box}));
  }
  recordBallTrail(screen,t,state){
    const previous=this.lastBallScreen,interval=1/60,maxAge=8*interval;
    if(this.ballState!==state||t<this.lastBallTime||previous&&Math.hypot(screen.x-previous.x,screen.y-previous.y)>240||t-this.lastBallTime>.25)this.ballTrail=[];
    if(!this.ballTrail.length)this.ballTrail.push({...screen,t});
    else if(t>this.lastBallTime){
      let next=this.ballTrail.at(-1).t+interval,steps=0;
      // A slow frame can span more samples than the retained history. Skip the
      // discarded part on the same grid, rather than letting the tail lag.
      const oldest=t-maxAge;if(next<oldest-1e-8)next+=Math.ceil((oldest-next-1e-8)/interval)*interval;
      // Time-spaced samples keep one trail length at every display cadence.
      // Only presentation positions are interpolated; the ball/hand stay physical.
      while(next<=t+1e-8&&steps++<9){const q=clamp((next-this.lastBallTime)/(t-this.lastBallTime),0,1);this.ballTrail.push({x:mix(previous.x,screen.x,q),y:mix(previous.y,screen.y,q),t:next});next+=interval;}
    }
    while(this.ballTrail.length>9||this.ballTrail[0]?.t<t-maxAge-1e-8)this.ballTrail.shift();
    this.lastBallTime=t;this.lastBallScreen={...screen};this.ballState=state;
  }
  drawHoop(g,side,t,foreground=false){
    return drawPremiumHoop(g,{arena:this.arena,side,time:t,foreground,point,heightScale:HEIGHT_SCALE,reducedMotion:this.reducedMotion,rimImpact:this.rimImpact,state:this.frameState});
  }
  updateCamera(state,t){
    const camera=this.camera;
    if(state.phase==='attract'||this.reducedMotion){Object.assign(camera,state.phase==='attract'?{x:600,y:340,zoom:1}:{x:600,y:195,zoom:.76});this.lastFrameTime=t;this.cameraState=state;return camera;}
    const cp=(state.players||[]).find(p=>p.id===state.controlled)||state.players?.[0];
    const ball=state.ball||cp||{x:500,y:300,z:0},bp=point(ball.x,ball.y),pp=cp?point(cp.x,cp.y):bp;
    const owner=state.players?.find(p=>p.id===ball.owner),direction=(owner?.team??state.possession??0)===0?1:-1;
    const focusMin=Math.min(bp.x,pp.x),focusMax=Math.max(bp.x,pp.x);
    const margin=cp?.anim==='stunned'?150:100;
    const bounds=cp?this.playerFrames?.get(cp.id)?.bounds||getSpriteBounds(cp.character||ROSTER[0],motionOptions(cp,state,t)):{top:-120};
    let top=Math.min(bp.y-visualHeight(ball.z)-20,pp.y-visualHeight(cp?.jump)+spriteScale(cp)*bounds.top-12);
    if(state.charge?.active)top-=30;
    let bottom=Math.max(bp.y+18,pp.y+38);
    for(const p of state.players||[]){if(p.jump>15&&Math.abs(p.x-ball.x)<260){const pos=point(p.x,p.y),b=this.playerFrames?.get(p.id)?.bounds||getSpriteBounds(p.character||ROSTER[0],motionOptions(p,state,t));top=Math.min(top,pos.y-visualHeight(p.jump)+spriteScale(p)*b.top-20);}}
    const targetZoom=clamp(Math.min(1.44,W/(focusMax-focusMin+margin*2),H/(bottom-top+100)),.82,1.44);
    const halfX=W/(2*targetZoom),halfY=H/(2*targetZoom);
    const visibleMin=focusMax+margin-halfX,visibleMax=focusMin-margin+halfX;
    let targetX=bp.x+direction*82;
    if(visibleMin<=visibleMax)targetX=clamp(targetX,visibleMin,visibleMax);
    targetX=clamp(targetX,Math.min(halfX,W/2),Math.max(W-halfX,W/2));
    let targetY=350;
    const topLimit=top+(H/2-28)/targetZoom,bottomLimit=bottom-(H/2-28)/targetZoom;
    if(bottomLimit<=topLimit)targetY=clamp(targetY,bottomLimit,topLimit);
    targetY=clamp(targetY,halfY-300,H-halfY);
    const reset=this.cameraState!==state||!Number.isFinite(this.lastFrameTime)||t<this.lastFrameTime;
    const dt=reset?1/60:clamp(t-this.lastFrameTime,0,.1);
    if(reset)Object.assign(camera,{x:targetX,y:targetY,zoom:targetZoom});
    else{
      const a=1-Math.exp(-dt*6),za=1-Math.exp(-dt*(targetZoom<camera.zoom?13:3.5));
      camera.x=mix(camera.x,targetX,a);camera.y=mix(camera.y,targetY,a);camera.zoom=mix(camera.zoom,targetZoom,za);
      // A long pass or player switch must never strand the controlled avatar offscreen.
      if((focusMax-focusMin+margin*1.6)*camera.zoom>W||((bottom-top)+42)*camera.zoom>H)camera.zoom=targetZoom;
      const hx=W/(2*camera.zoom),hy=H/(2*camera.zoom),lo=focusMax+margin*.8-hx,hi=focusMin-margin*.8+hx;
      if(lo<=hi)camera.x=clamp(camera.x,lo,hi);
      camera.x=clamp(camera.x,Math.min(hx,W/2),Math.max(W-hx,W/2));
      const lowY=bottom-(H/2-16)/camera.zoom,highY=top+(H/2-16)/camera.zoom;
      if(lowY<=highY)camera.y=clamp(camera.y,lowY,highY);
      camera.y=clamp(camera.y,hy-300,H-hy);
    }
    this.cameraState=state;this.lastFrameTime=t;return camera;
  }
  draw(state,t=0){
    if(!state)state=createAttractState(ROSTER,t);
    if(this.artwork!==getArenaArtwork(this.arena.id))this.setArena(this.arena.id);
    this.frameState=state;this.preparePlayerFrames(state,t);
    const g=this.sceneContext;g.setTransform(PIXEL_W/W,0,0,PIXEL_H/H,0,0);g.clearRect(0,0,W,H);g.imageSmoothingEnabled=true;
    const camera=this.updateCamera(state,t),fxTime=this.reducedMotion?0:t;
    // Impact shake is local to the scene so interface remains readable.
    const impact=(state.effects||[]).find(e=>(e.type==='dunk'||e.type==='shake'||e.type==='burst'&&state.announcement==='BOOMSHAKA!')&&e.life>.25);
    g.save();g.translate(W/2,H/2);g.scale(camera.zoom,camera.zoom);g.translate(-camera.x,-camera.y);
    if(impact&&!this.reducedMotion){const a=Math.min(4,impact.life*6);g.translate(Math.sin(t*94)*a,Math.cos(t*73)*a*.5);}
    this.rimImpact=impact?{side:(impact.x||0)>500?1:0,strength:Math.min(3,impact.life*4)}:null;
    g.fillStyle={casino:'#171321',stadium:'#081525',miami:'#b77a9c',bugatti:'#0b1c2a',blacktop:'#111e22'}[this.arena.id];g.fillRect(-W,-400,W*3,H+800);
    g.drawImage(this.ceiling,0,-400);
    g.drawImage(this.base,0,0);
    if(this.artwork){drawArenaLife(g,this.life,fxTime,state,{reducedMotion:this.reducedMotion,layer:'back'});}else drawArenaAmbient(g,this.arena.id,fxTime,state,ARENA_HELPERS);
    this.drawHoop(g,0,t);this.drawHoop(g,1,t);
    const players=[...(state.players||[])].sort((a,b)=>a.y-b.y);
    for(const p of players){
      const pos=point(p.x,p.y),jump=visualHeight(p.jump),sc=spriteScale(p);
      const selected=p.id===state.controlled;
      const col=p.team===0?ORANGE:'#78d7ef',shadowWidth=88+Math.min(18,jump*.09);
      g.save();g.globalAlpha=1/(1+jump/145);g.drawImage(shadowTile(),pos.x-shadowWidth/2,pos.y-12,shadowWidth,30);g.restore();
      g.strokeStyle=col+(selected?'e8':'82');g.lineWidth=selected?2.5:1.35;g.beginPath();g.ellipse(pos.x,pos.y+3,selected?32:25,selected?10:7.5,0,selected?0:.12,selected?Math.PI*2:Math.PI-.12);g.stroke();
      if(selected){g.fillStyle=ORANGE+'15';g.fill();}
      const hot=p.onFire!==undefined?p.onFire:(state.fire?.[p.team]||0)>0;
      if(hot){
        for(let j=0;j<13;j++){let q=(fxTime*1.6+j/13)%1,x=pos.x+(hash(j+9)-.5)*55,y=pos.y-jump-8-q*85;g.globalAlpha=(1-q)*.75;rect(g,x,y,4+q*5,7+q*12,j%3?'#ff8a38':'#ffe197');}g.globalAlpha=1;
      }
      const art=p.character||ROSTER[p.id%ROSTER.length];
      const frame=this.playerFrames.get(p.id),{options:spriteOptions,landing,landingAge}=frame,pose=spriteOptions.pose;
      const echo=!this.reducedMotion&&((p.turboCarry>.7&&Math.hypot(p.vx||0,p.vy||0)>260)||p.anim==='dunk'&&jump>30);
      if(this.artwork||echo)this.rasterPlayer(p,frame);
      if(this.artwork&&jump<140){
        g.save();g.beginPath();const ps=[point(62,64),point(938,64),point(938,536),point(62,536)];ps.forEach((v,i)=>i?g.lineTo(v.x,v.y):g.moveTo(v.x,v.y));g.closePath();g.clip();
        g.translate(pos.x,pos.y+4+jump*.055);g.scale(1,-.18);g.globalAlpha=(this.arena.id==='bugatti'?.11:.075)/(1+jump/70);this.drawPlayer(g,p,frame,0,0);g.restore();
      }
      if(jump<4){const attachment=getSpriteAttachment(art,spriteOptions,frame.prepared);for(const foot of attachment.feet||[]){if(foot.grounded===false)continue;const facing=(spriteOptions.pose==='pass'?spriteOptions.passFacing??spriteOptions.facing:spriteOptions.facing)||1,x=pos.x+foot.x*sc*facing,pressure=clamp(foot.contact??1,0,1);g.save();g.globalAlpha=.35+.45*pressure;g.fillStyle='#080a1266';g.beginPath();g.ellipse(x,pos.y+3+clamp((foot.y+2.5)*sc,-2,2),sc*(6.5+pressure*2.5),2.2+pressure*.6,0,0,Math.PI*2);g.fill();g.restore();}}
      if(echo){
        for(let n=2;n>0;n--){g.globalAlpha=.1/n;this.drawPlayer(g,p,frame,pos.x-(p.facing||1)*n*17,pos.y-jump+n*5);}g.globalAlpha=1;
      }
      this.drawPlayer(g,p,frame);
      if(landing&&!this.reducedMotion){const q=spriteOptions.actionPhase;for(let j=0;j<6;j++){g.globalAlpha=(1-q)*.35;rect(g,pos.x+(j-2.5)*(7+q*12),pos.y+3-q*(3+j%2*3),3+q*4,2,'#dfd8bd');}g.globalAlpha=1;}
      if(selected){const top=pos.y-jump+sc*frame.bounds.top;poly(g,[{x:pos.x-5,y:top-7},{x:pos.x+5,y:top-7},{x:pos.x,y:top}],ORANGE);}
      if(pose==='stunned'){for(let j=0;j<3;j++){const a=fxTime*9+j*2.1;rect(g,pos.x+Math.cos(a)*25,pos.y-34+Math.sin(a)*9,3,3,'#ffde6e');}}
    }
    this.drawPlayerLabels(g,players,state);
    // Ball motion is taken from the simulation, including swats and loose deflections.
    const ball=state.ball;
    if(ball){
      const b=point(ball.x,ball.y),z=visualHeight(ball.z),screen={x:b.x,y:b.y-z};
      const owner=state.players?.find(p=>p.id===(ball.owner??ball.flight?.shooter));
      const fire=owner?.onFire!==undefined?owner.onFire:(state.fire?.[owner?.team]||0)>0;
      this.recordBallTrail(screen,t,state);
      g.fillStyle='#07111745';g.beginPath();g.ellipse(b.x,b.y+4,9,4,0,0,Math.PI*2);g.fill();
      if((ball.flight||fire)&&!this.reducedMotion){
        for(let i=0;i<this.ballTrail.length-1;i++){const trail=this.ballTrail[i],q=(i+1)/this.ballTrail.length;g.globalAlpha=q*(fire?.54:.15);g.fillStyle=fire?(i%2?'#ff6f2e':'#ffd66b'):ORANGE;g.beginPath();g.arc(trail.x,trail.y,3+q*(fire?9:5),0,Math.PI*2);g.fill();}g.globalAlpha=1;
      }
      if(fire){
        for(let j=0;j<5;j++){const pulse=3+Math.sin(fxTime*17+j)*2,x=screen.x-13+j*6;poly(g,[{x:x-4,y:screen.y-2},{x:x+Math.sin(fxTime*9+j)*3,y:screen.y-24-pulse-j%2*7},{x:x+5,y:screen.y-1}],j%2?'#ffb547':'#f46c2d');}
        g.fillStyle='#ffc45b30';g.beginPath();g.arc(screen.x,screen.y,19,0,Math.PI*2);g.fill();
      }
      const bounce=ball.owner!=null&&!owner?.shotSetup?Math.max(0,1-Math.abs((owner?.dribblePhase??0)-.5)/.055):0;
      this.ball(g,screen.x,screen.y,10+(ball.owner!=null?0:1),t*4,bounce);
    }
    this.drawHoop(g,0,t,true);this.drawHoop(g,1,t,true);
    if(this.artwork)drawArenaLife(g,this.life,fxTime,state,{reducedMotion:this.reducedMotion,layer:'front'});
    this.effects(g,state.effects||[],t);
    const cp=(state.players||[]).find(p=>p.id===state.controlled);
    if(state.charge?.active&&cp){const p=point(cp.x,cp.y),amount=clamp(state.charge.amount,0,1),b=this.playerFrames?.get(cp.id)?.bounds||getSpriteBounds(cp.character,motionOptions(cp,state,t)),meterY=p.y-visualHeight(cp.jump)+spriteScale(cp)*b.top-18;rect(g,p.x-38,meterY,76,10,'#0c181c');rect(g,p.x-36,meterY+2,72,6,'#52635a');rect(g,p.x+10.8,meterY+2,14.4,6,'#d8f492');rect(g,p.x-36,meterY+2,72*amount,6,amount>=.65&&amount<=.85?'#dcff96':ORANGE);text(g,'RELEASE',p.x,meterY-7,9,'#f1e8d0');}
    if(state.phase==='attract'){
      // Cabinet preview badge, visibly part of the game rather than a fake CTA.
      if(this.arena.id==='blacktop'){
      rect(g,497,58,206,59,'#101b1ee0');rect(g,497,58,206,2,ORANGE);
      text(g,'HOME',530,77,9,'#a6b8a8');text(g,'AWAY',670,77,9,'#a6b8a8');
      text(g,'12',530,103,25,CREAM);text(g,':',600,101,24,'#738477');text(g,'08',670,103,25,CREAM);text(g,'1:28',600,80,11,ORANGE);
      }
      g.save();g.translate(864,155);g.rotate(-.09);text(g,'BOOM!',2,3,43,'#132329');text(g,'BOOM!',0,0,43,this.arena.accent);text(g,'SHAKE THE BLOCK.',0,20,10,CREAM);g.restore();
      if(this.arena.id==='blacktop')text(g,'2 ON 2  ·  ALL GAS. NO BRAKES.',600,634,11,'#c2c9b6');
    }
    g.restore();
    if(state.presentation==='demo'){
      rect(g,435,16,330,50,'#080b24ed');rect(g,435,16,330,3,this.arena.accent);
      text(g,'CPU EXHIBITION',600,35,12,'#a6b9d0');text(g,String(state.scores[0]).padStart(2,'0'),477,57,25,ORANGE);text(g,String(state.scores[1]).padStart(2,'0'),723,57,25,'#6de1ff');
      const seconds=Math.max(0,Math.ceil(state.time));text(g,`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`,600,57,18,'#fff2d0');
    }
    const output=this.ctx;output.setTransform(1,0,0,1,0,0);output.imageSmoothingEnabled=true;output.clearRect(0,0,this.canvas.width,this.canvas.height);output.drawImage(this.scene,0,0,this.canvas.width,this.canvas.height);
  }
  drawVenueLight(g,t){
    // Keep architecture calm; movement belongs to athletes, the ball and light.
    if(this.reducedMotion)return;
    if(this.arena.id==='stadium'||this.arena.id==='casino')for(let i=0;i<4;i++){
      const phase=(t*.47+i*.29)%1;if(phase>.965){const x=100+hash(i+Math.floor(t*.47))*1000,y=80+hash(i+31)*105;g.globalAlpha=(phase-.965)/.035*.65;line(g,[{x:x-5,y},{x:x+5,y}],'#fff3d9',1);line(g,[{x,y:y-4},{x,y:y+4}],'#fff3d9',1);}
    }
    g.globalAlpha=1;
  }
  ball(g,x,y,r,rotation=0,bounce=0){
    g.save();g.translate(x,y);g.scale(1+bounce*.11,1-bounce*.13);
    const leather=g.createRadialGradient(-r*.35,-r*.4,r*.1,0,0,r*1.1);leather.addColorStop(0,'#ffd080');leather.addColorStop(.45,'#ef953e');leather.addColorStop(1,'#a84a22');
    g.fillStyle=leather;g.beginPath();g.arc(0,0,r,0,Math.PI*2);g.fill();g.strokeStyle='#472a21';g.lineWidth=1.2;g.stroke();
    g.rotate(rotation);g.strokeStyle='#77371e';g.lineWidth=1.15;g.beginPath();g.moveTo(-r,0);g.quadraticCurveTo(0,2.5,r,0);g.moveTo(0,-r);g.quadraticCurveTo(2.5,0,0,r);g.stroke();g.beginPath();g.ellipse(0,0,r*.46,r,0,0,Math.PI*2);g.stroke();
    g.fillStyle='#4c2b1d38';for(let i=0;i<13;i++){const a=i*2.4,d=2+i%4*1.6;g.fillRect(Math.cos(a)*d,Math.sin(a)*d,.65,.65);}g.restore();
  }
  effects(g,effects,t){
    for(const e of effects){const p=point(e.x??500,e.y??300),ratio=clamp(e.life/(e.maxLife||1),0,1);g.save();g.globalAlpha=Math.min(1,ratio*2);const color=e.color||ORANGE;
      if(['score','dunk','fire','burst','steal','block'].includes(e.type)){
        const centerY=p.y-(e.type==='burst'||e.type==='dunk'?visualHeight(160):110);
        for(let i=0;i<16;i++){const a=i/16*Math.PI*2+hash(i)*.4,r=(1-ratio)*110+15;rect(g,p.x+Math.cos(a)*r,centerY+Math.sin(a)*r*.6,4+ratio*5,4+ratio*5,i%3?color:'#ffe5a7');}
        if(e.type==='burst'&&ratio>.62){const spread=(1-ratio)*120+12;for(let i=0;i<8;i++){const a=i*Math.PI/4;line(g,[{x:p.x+Math.cos(a)*spread*.3,y:centerY+Math.sin(a)*spread*.3},{x:p.x+Math.cos(a)*spread,y:centerY+Math.sin(a)*spread}],i%2?color:'#fff6c8',3);}}
        g.strokeStyle=color;g.lineWidth=3*ratio;g.beginPath();g.ellipse(p.x,p.y,80*(1-ratio)+15,25*(1-ratio)+5,0,0,Math.PI*2);g.stroke();
      }
      if(e.type==='spark'){for(let i=0;i<3;i++){const off=(1-ratio)*20;rect(g,p.x+(hash(i+2)-.5)*off,p.y-off*hash(i+5),3*ratio+1,3*ratio+1,color);}}
      if(e.text){const scoring=e.text.startsWith('+'),size=scoring?26:18;g.save();g.translate(p.x+(scoring?0:82),p.y-(scoring?visualHeight(160):215)-(1-ratio)*32);g.rotate(-.04);text(g,e.text,1,2,size,INK);text(g,e.text,0,0,size,color);g.restore();}
      g.restore();
    }
  }
}
