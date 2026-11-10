import { getBasketballPose, MOTION_FRAMES, MOTION_METRICS } from './basketball-motion.js';
import * as basketballMotion from './basketball-motion.js';
import { getCharacterArt } from './character-art.js';
import { getNFTArt, onNFTArtReady, loadNFTArt } from './nft-art.js';
import { getCharacterCostume } from './character-costumes.js';
import { getNFTSpriteTexture } from './nft-sprite-texture.js';

// Native-resolution authored pixel poses. A sprite's origin is the floor below
// its pelvis; all anatomy and attachments use this coordinate space.
export const SPRITE_METRICS=Object.freeze({...MOTION_METRICS,headHeight:28,cellWidth:144,cellHeight:180,originX:72,originY:158});
export const SPRITE_FRAME_COUNTS=MOTION_FRAMES;
const DENSITY=2;
const INK='#111c27',ORANGE='#ff7544',clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
function tone(hex,amount){const n=parseInt(hex.slice(1),16),r=n>>16,g=n>>8&255,b=n&255,t=amount>0?255:0,a=Math.abs(amount);return '#'+[r,g,b].map(v=>Math.round(mix(v,t,a)).toString(16).padStart(2,'0')).join('');}
function ramp(base,shadow,light){return [tone(shadow,.0),shadow,base,light,tone(light,.32)];}
function P(x,y){return {x,y};}
function pixelPoly(g,ps,color){if(!ps.length)return;g.beginPath();g.moveTo(ps[0].x,ps[0].y);for(let i=1;i<ps.length;i++)g.lineTo(ps[i].x,ps[i].y);g.closePath();g.fillStyle=color;g.fill();}
function pixelLine(g,a,b,color,width=1){g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.strokeStyle=color;g.lineWidth=width*.72;g.lineCap='round';g.lineJoin='round';g.stroke();}
function polyOutline(g,ps,fill,edge=INK){pixelPoly(g,ps,fill);g.strokeStyle=edge;g.lineWidth=.65;g.lineJoin='round';g.stroke();}
function gradient(g,x0,y0,x1,y1,colors){const gr=g.createLinearGradient(x0,y0,x1,y1);for(let i=0;i<colors.length;i++)gr.addColorStop(i/(colors.length-1),colors[i]);return gr;}
function ellipse(g,x,y,rx,ry,fill,stroke){g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fillStyle=fill;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=.65;g.stroke();}}
function curve(g,points,color,width=1){g.beginPath();g.moveTo(points[0],points[1]);g.bezierCurveTo(...points.slice(2));g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.stroke();}
function dot(g,x,y,c){rect(g,x,y,1,1,c);}
function limb(g,a,b,wa,wm,wb,colors,back=false){
  const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,n=P(-dy/d,dx/d),u=P(dx/d,dy/d),at=(t,w)=>P(a.x+dx*t+n.x*w,a.y+dy*t+n.y*w);
  // A continuous organic contour: broad muscle belly, a narrow tendon, and
  // rounded overlaps at both ends. The joint is not a separate hinge cap.
  const a0=at(0,-wa),a1=at(0,wa),b0=at(1,-wb),b1=at(1,wb),c0=at(.22,-wm*1.08),c1=at(.68,-wm*.7),c2=at(.64,wm*.86),c3=at(.20,wm*1.04);
  g.beginPath();g.moveTo(a0.x,a0.y);g.bezierCurveTo(c0.x,c0.y,c1.x,c1.y,b0.x,b0.y);g.quadraticCurveTo(b.x+u.x*wb*.7,b.y+u.y*wb*.7,b1.x,b1.y);g.bezierCurveTo(c2.x,c2.y,c3.x,c3.y,a1.x,a1.y);g.quadraticCurveTo(a.x-u.x*wa*.65,a.y-u.y*wa*.65,a0.x,a0.y);g.closePath();
  g.fillStyle=back?tone(colors[2],-.17):colors[2];g.fill();g.strokeStyle=colors[0];g.lineWidth=.85;g.stroke();
  // Authored planes of light rather than a glossy tube gradient. The broken
  // highlight follows the muscle belly and the narrow tendon keeps its volume.
  g.save();g.clip();
  pixelPoly(g,[at(0,wa*.25),at(.22,wm*.28),at(.56,wm*.13),at(.84,wb*.25),at(1,wb*.3),at(1,wb+1),at(0,wa+1)],colors[1]);
  if(!back){pixelPoly(g,[at(.08,-wa*.8),at(.23,-wm*.78),at(.49,-wm*.55),at(.65,-wm*.18),at(.46,-wm*.13),at(.18,-wm*.27)],colors[3]);pixelPoly(g,[at(.14,-wm*.7),at(.25,-wm*.7),at(.34,-wm*.48),at(.24,-wm*.39)],colors[4]);pixelPoly(g,[at(.69,-wb*.42),at(.87,-wb*.55),at(.97,-wb*.16),at(.77,-wb*.02)],colors[3]);}
  g.restore();
}
function joint(g,p,r,colors,material){
  ellipse(g,p.x,p.y,r*.91,r*.80,colors[2]);
  pixelPoly(g,[P(p.x-r*.65,p.y-r*.1),P(p.x-r*.15,p.y-r*.45),P(p.x+r*.48,p.y-r*.18),P(p.x+r*.12,p.y+r*.12),P(p.x-r*.45,p.y+r*.25)],colors[3]);
  curve(g,[p.x-r*.5,p.y+.5,p.x-r*.1,p.y+1.3,p.x+r*.2,p.y+1.2,p.x+r*.54,p.y+.4],colors[1],.8);
}
function shoe(g,p,angle,colors,accent,heavy=false,style='athletic',look){
  if(look)colors=ramp(look.boot,tone(look.boot,-.43),tone(look.boot,.34));
  g.save();g.translate(p.x,p.y);g.rotate(angle);const width=(heavy?1.09:style==='lean'?.98:1.03),height=heavy?1.02:.95;g.scale(width,height);
  g.beginPath();g.moveTo(-5.3,1.2);g.lineTo(-5,-4.2);g.quadraticCurveTo(-4.1,-6.5,-.9,-6.5);g.lineTo(2,-5.5);g.quadraticCurveTo(2.8,-3.3,5.2,-2.1);g.bezierCurveTo(7.9,-1.4,10,-1.2,10.4,.65);g.quadraticCurveTo(9.8,2.25,5,2.35);g.lineTo(-4.9,2.3);g.closePath();g.fillStyle=gradient(g,-2,-7,3,3,[colors[3],colors[2],colors[1]]);g.fill();g.strokeStyle=colors[0];g.lineWidth=.65;g.stroke();
  // Sculpted toe box, high ankle cuff and split outsole replace the white slab.
  curve(g,[-5,1.35,-1,1.65,6.8,1.9,10.1,.9],look?.sole||accent,1.3);
  curve(g,[3.6,-2.1,6.4,-2.1,9.6,-1.5,9.8,.2],colors[3],.7);
  curve(g,[-4.4,-5.6,-2.5,-6.4,-.9,-6.2,1,-5.4],colors[4],1);
  pixelPoly(g,[P(-4.2,-3.6),P(-1.1,-4.6),P(3.5,-1.4),P(1.6,-.8),P(-2.5,-2.5)],look?.metal||accent);
  for(let i=0;i<3;i++)pixelLine(g,P(i*.9-.6,-5.1+i*.77),P(i*.9+2,-5.25+i*.77),look?.sole||accent,.7);
  for(let i=0;i<4;i++)pixelLine(g,P(-3+i*3,2),P(-2.7+i*3,2.8),colors[1],.55);
  if(heavy||look?.legwear==='greaves'){polyOutline(g,[P(-4.6,-4),P(-4.4,-8.8),P(.6,-9),P(2.5,-5.1),P(-1,-3.6)],colors[2],colors[0]);pixelLine(g,P(-3.5,-7.8),P(.5,-7.8),look?.metal||colors[3],1.1);rect(g,-5.3,-1.5,1.9,3.3,colors[1]);}else ellipse(g,5.9,-.1,1.6,.5,colors[3]);
  g.restore();
}
const frameCaches={game:{items:new Map(),bytes:0,max:64*1024*1024},portrait:{items:new Map(),bytes:0,max:16*1024*1024}};
function artFor(c){return getCharacterArt(c.id);}
function poseState(o){
  let state=o.pose||o.anim||(o.shooting?'shoot':o.running?'run':'idle');const moving=o.running||Number(o.moveSpeed??o.speed)>10;
  if(state==='stun')state='stunned';
  if(['idle','run','dribble'].includes(state)&&(o.dribbling||o.hasBall))state='dribble';
  else if(['idle','run'].includes(state)&&(o.shuffling??o.defending))state=moving?'shuffle':'ready';
  else if(state==='idle'&&moving)state='run';
  return SPRITE_FRAME_COUNTS[state]?state:'idle';
}
function motionContext(o={},state){
  const speed=Number(o.moveSpeed??o.speed),moving=state==='run'||state==='shuffle'||state==='dribble'&&(o.running||!Number.isFinite(speed)||speed>10),dir=o.moveDirection||o.velocity||{},backward=state==='shuffle'&&(dir.x||0)*(o.facing||1)<-.05;
  return {moving,backward,turbo:!!o.turbo,worldToSprite:Math.round((o.worldToSprite??.653)*50)/50,landFrom:o.landFrom==='dunk'?'dunk':'shoot',released:!!o.released,dunkStage:o.dunkStage==='release'?'release':'flight',gatherLow:o.gatherLow??Number(o.gatherStartHeight)<30};
}
function contextKey(c){return `${+c.moving}:${+c.backward}:${+c.turbo}:${Math.round(c.worldToSprite*50)}:${c.landFrom==='dunk'?1:0}:${+c.released}:${c.dunkStage==='release'?1:0}:${+c.gatherLow}`;}
// Rendering callers use this to start short pose transitions without exposing
// sprite-cache internals or treating every dribble sample as a new state.
export function getSpriteMotionKey(character,o={}){const state=poseState(o),context=motionContext(o,state);return `${state}:${+context.moving}:${+context.backward}${state==='dunk'?':'+context.dunkStage:state==='shoot'?':'+ +context.released:''}`;}
function frameIndex(state,o,art){
  const count=SPRITE_FRAME_COUNTS[state],context=motionContext(o,state),stride=o.stridePhase??o.locomotionPhase??o.gaitPhase;
  if(['idle','ready','run','dribble','shuffle'].includes(state)){
    let phase;
    if(['run','shuffle'].includes(state)||state==='dribble'&&context.moving)phase=Number.isFinite(stride)?stride:(o.time||0)*(state==='shuffle'?1.8:1.55*art.animation.stride);
    else if(state==='dribble')phase=Number.isFinite(o.dribblePhase)?o.dribblePhase:(o.time||0)*(o.dribbleFrequency||1.8);
    else phase=(o.time||0)*.5*art.animation.idle;
    const frame=((Math.floor(phase*count)%count)+count)%count;return state==='idle'&&o.team==null?Math.floor(frame/2)*2:frame;
  }
  return Math.min(count-1,Math.floor(clamp(state==='dunk'&&context.dunkStage==='release'?o.dunkReleasePhase??0:o.actionPhase??o.phase??0,0,.9999)*count));
}
function lerpPoint(a,b,t){return P(mix(a.x,b.x,t),mix(a.y,b.y,t));}
function makePose(art,state,index,hand,context={}){
  const loop=['idle','ready','run','dribble','shuffle'].includes(state),phase=loop?index/SPRITE_FRAME_COUNTS[state]:index/(SPRITE_FRAME_COUNTS[state]-1),pose=getBasketballPose(art,state,phase,{...context,hand});
  if(context.released&&state==='shoot'){pose.wristNear=Math.max(.6,pose.wristNear);pose.openNear=1;}
  return pose;
}
function poseForOptions(character,o={}){
  const art=artFor(character),state=poseState(o),index=frameIndex(state,o,art),context=motionContext(o,state);
  if(state==='dribble')context.dribblePhase=o.dribblePhase??(o.time||0)*(o.dribbleFrequency||1.8);
  let hand=null;
  if(o.ballHand&&['shoot','dunk','dribble','pass'].includes(state)){
    hand={x:o.ballHand.x,y:o.ballHand.y/art.body.height};
    const amount=clamp(state==='dribble'?o.dribbleHandContact??1:o.ballHandContact??o.gatherHandContact??1,0,1);
    if(amount<1){
      const base=makePose(art,state,index,null,context),cs=Math.cos(base.tilt),sn=Math.sin(base.tilt),initial=P(base.handNear.x*cs-base.handNear.y*sn,base.handNear.x*sn+base.handNear.y*cs);
      hand=amount>0?lerpPoint(initial,hand,amount):null;
    }
  }
  let pose=makePose(art,state,index,hand,context),transitioning=false;
  if(o.transitionFrom&&Number.isFinite(o.transitionProgress)&&o.transitionProgress<1&&typeof basketballMotion.blendBasketballPoses==='function'){
    const previous=o.transitionFrom.poseSnapshot||poseForOptions(character,{...o.transitionFrom,transitionFrom:null}).pose,progress=clamp(o.transitionProgress,0,1);
    const toFacing=(state==='pass'?o.passFacing??o.facing:o.facing)===-1?-1:1,fromFacing=o.transitionFrom.facing===-1?-1:o.transitionFrom.facing===1?1:toFacing;
    pose=basketballMotion.blendBasketballPoses(previous,pose,progress,{hand,fromFacing,toFacing});transitioning=true;
  }
  return {art,state,index,context,pose,transitioning};
}
// Capture only the displayed skeleton when a transition is interrupted. This
// keeps transitions continuous without retaining recursive option histories.
export function getSpritePoseSnapshot(character,o={},prepared){return JSON.parse(JSON.stringify((prepared||poseForOptions(character,o)).pose));}
// A renderer can evaluate expensive IK once for a player frame, then reuse this
// opaque record for bounds, attachments and its final raster. Never reuse it
// after skeleton-affecting options change; draw position and scale are harmless.
export function prepareSpritePose(character,o={}){return poseForOptions(character,o);}
function plate(g,a,b,width,pal,back=false){
  const d=Math.hypot(b.x-a.x,b.y-a.y)||1,n=P(-(b.y-a.y)/d,(b.x-a.x)/d),q=(t,s)=>P(mix(a.x,b.x,t)+n.x*s,mix(a.y,b.y,t)+n.y*s);
  const ps=[q(.08,-width),q(.06,width*.55),q(.74,width),q(.96,width*.2),q(.86,-width*.7)];polyOutline(g,ps,back?pal.shadow:pal.base,pal.shadow);
  // Separate bevel, front and undersurface clusters make a plated costume
  // read as manufactured armor instead of a polished plastic tube.
  pixelPoly(g,[ps[1],ps[2],ps[3],q(.65,width*.18),q(.13,width*.05)],pal.shadow);
  if(!back){pixelPoly(g,[ps[0],ps[1],q(.2,width*.25),q(.62,-width*.35),ps[4]],pal.highlight);pixelPoly(g,[q(.15,-width*.7),q(.23,-width*.34),q(.57,-width*.2),q(.68,-width*.5)],pal.base);}
  pixelLine(g,ps[0],ps[4],back?pal.base:pal.highlight,.8);pixelLine(g,ps[0],ps[1],back?pal.base:pal.highlight,.8);
}
function accessoriesBehind(g,c,a,p){
  const q=a.palette,s=p.shoulder,h=p.hip,t=p.index;
  if(['gold-mage','manga','sheikh','ice','fire','mask','chaos','cowboy'].includes(c.id)){
    const flow=Math.sin((p.p||0)*Math.PI*2)*5,co=a.material==='ink'?'#5e5966':q.shadow;
    polyOutline(g,[P(s.x-9,s.y+2),P(s.x-15,s.y+9),P(h.x-17+flow,-23),P(h.x-10+flow,-15),P(h.x-5,-38)],co,tone(co,-.25));
    pixelLine(g,P(s.x-11,s.y+9),P(h.x-11+flow,-20),q.base);pixelLine(g,P(s.x-8,s.y+10),P(h.x-8+flow,-28),q.highlight);
  }
  if(['bloodbath','poison'].includes(c.id)){
    for(let j=0;j<3;j++){const x=s.x-12,y=s.y+4+j*6,flow=Math.sin((p.p||0)*Math.PI*2+j)*2;
      const points=[x,y,x-14-j*2,y-10+flow,x-21+j*3,y-3+flow,x-18+j*2,y+7];curve(g,points,q.skinShadow,3.1-j*.5);curve(g,points,j===0?q.highlight:q.base,1.7-j*.35);
      pixelPoly(g,[P(x-18+j*2,y+7),P(x-22+j*2,y+3),P(x-16+j*2,y+4)],j===0?q.highlight:q.base);
    }
  }
  if(c.id==='elemental'){
    const wind=Math.sin((p.p||0)*Math.PI*2)*1.7;
    for(const side of [-1,1]){const x=s.x+side*14,y=s.y+5;curve(g,[x,y,x+side*9,y-13+wind,x+side*11,y-20,x+side*6,y-24+wind],'#31563e',2.5);curve(g,[x,y,x+side*9,y-13+wind,x+side*11,y-20,x+side*6,y-24+wind],'#89a974',1.1);
      for(let j=0;j<3;j++){const lx=x+side*(7+j%2*2),ly=y-7-j*6;pixelPoly(g,[P(lx,ly),P(lx+side*6,ly-3),P(lx+side*4,ly+2)],j%2?'#95b97b':'#557d54');}
    }
  }
  if(c.id==='medusa'){
    for(const side of [-1,1]){const x=s.x+side*13,y=s.y+2,move=Math.sin((p.p||0)*Math.PI*2+side)*2;curve(g,[x,y,x+side*12,y-1,x+side*13,y-10+move,x+side*9,y-13+move],q.shadow,4);curve(g,[x,y,x+side*12,y-1,x+side*13,y-10+move,x+side*9,y-13+move],q.highlight,2.4);ellipse(g,x+side*8.4,y-13+move,3.1,1.8,q.highlight,q.shadow);dot(g,x+side*7.5,y-13.6+move,'#bdcf93');}
  }
  if(c.id==='neural'){
    for(const side of [-1,1]){const x=s.x+side*14,y=s.y+2,glow=side<0?q.visor:q.accent;pixelLine(g,P(x,y),P(x+side*10,y-10),q.shadow,3);pixelLine(g,P(x,y),P(x+side*10,y-10),glow,.9);const ox=x+side*14,oy=y-14+Math.sin((p.p||0)*Math.PI*2+side)*1.5;ellipse(g,ox,oy,3.6,2.3,q.shadow,glow);ellipse(g,ox-.8,oy-.6,1.3,.8,glow);}
  }
  if(['gold-mage','manga'].includes(c.id)){
    const gold=c.id==='manga'?'#c3c1ca':q.metal,shade=c.id==='manga'?'#686671':q.shadow;
    pixelLine(g,P(s.x-15,s.y+25),P(s.x-23,s.y-30),shade,3);pixelLine(g,P(s.x-15,s.y+24),P(s.x-22,s.y-30),gold);
    const tip=P(s.x-22,s.y-30);polyOutline(g,[P(tip.x-3,tip.y+3),P(tip.x-5,tip.y-1),P(tip.x-4,tip.y-6),P(tip.x-1,tip.y-9),P(tip.x+2,tip.y-8),P(tip.x+5,tip.y-5),P(tip.x+3,tip.y-2),P(tip.x+1,tip.y-5),P(tip.x-1,tip.y-5),P(tip.x-2,tip.y-1),P(tip.x+2,tip.y+2)],gold,shade);ellipse(g,tip.x+1,tip.y-.1,2.1,2.2,c.id==='manga'?'#ddd7df':q.accent,shade);pixelLine(g,P(tip.x-3,tip.y-5),P(tip.x-1,tip.y-7),c.id==='manga'?'#fff9ff':'#f4d989');
  }
  if(c.id==='cowboy'){
    const rope='#63c9c7';pixelLine(g,P(s.x+10,s.y),P(h.x+15,h.y+3),rope,2);
    const rx=h.x+14,ry=h.y+7;curve(g,[rx-3,ry-7,rx+10,ry-8,rx+10,ry+10,rx-2,ry+5],rope,1.5);curve(g,[rx-2,ry+5,rx-9,ry+2,rx-8,ry-8,rx-3,ry-7],rope,1.5);
  }
  if(c.id==='ice'){
    for(const side of [-1,1])for(let j=0;j<3;j++){const bx=s.x+side*(12+j*2),by=s.y+4+j*5;polyOutline(g,[P(bx,by+5),P(bx+side*(6+j),by-9-j*2),P(bx+side*4,by+1)],q.highlight,q.base);pixelLine(g,P(bx+side*2,by),P(bx+side*(6+j),by-9-j*2),q.visor);}
  }
  if(c.id==='fire'){
    for(let j=0;j<4;j++){const x=s.x-19+j*12,y=s.y-1+(j%2)*4;pixelLine(g,P(x-6,y+3),P(x+7,y-2),q.metal);pixelLine(g,P(x,y-4),P(x+2,y+5),q.shadow);pixelLine(g,P(x-2,y+1),P(x+4,y-2),q.highlight);}
  }
  if(c.id==='assimilator'){
    const xx=s.x-14,yy=s.y+2;curve(g,[xx,yy,xx-24,yy-12,xx-24,yy+21,xx,yy+19],q.skinShadow,3);curve(g,[xx,yy,xx-24,yy-12,xx-24,yy+21,xx,yy+19],q.highlight,.85);
  }
  if(c.id==='steampunk'){
    for(const side of [-1,1]){rect(g,s.x+side*13-2,s.y-5,4,14,q.shadow);rect(g,s.x+side*13-1,s.y-4,2,12,q.metal);rect(g,s.x+side*13-3,s.y-6,6,3,q.highlight);}
  }
  if(['gladiator','hockey-mask','hunter'].includes(c.id)){
    const sides=c.id==='hockey-mask'?[-1]:[-1,1];for(const side of sides){const x=s.x+side*13,y=s.y+3;
      pixelLine(g,P(x-side*7,y+12),P(x+side*9,y-12),q.skinShadow,4.4);pixelLine(g,P(x+side*1,y),P(x+side*9,y-12),q.metal,3.1);pixelLine(g,P(x-side*1,y-4),P(x+side*10,y+3),q.shadow,3);pixelLine(g,P(x-side*1,y-4),P(x+side*10,y+3),q.metal,1.4);
      for(let j=0;j<4;j++)pixelLine(g,P(x+side*(4+j),y-4-j*2),P(x+side*(7+j),y-3-j*2),q.skinShadow,1.4);
      ellipse(g,x+side*9,y-12,2.5,1.9,q.metal,q.shadow);
    }
  }
}
function limbDetail(g,c,a,start,end,near,isLeg){
  const p=a.palette,at=t=>lerpPoint(start,end,t),x=at(.45);
  if(['painted-metal','polished','padded','carbon','porcelain','bronze','gilded','cybernetic','scorched-metal'].includes(a.material)){
    // A narrow inset follows the curved limb. Broad polygon slabs hid the
    // muscle contour and made each forearm and calf look like a separate rod.
    plate(g,at(.2),at(.69),(isLeg?1.15:.9)*a.body.limbWidth,p,!near);
    if(['optimus','assimilator','neural','elemental'].includes(c.id)){const b=at(.45),e=at(.72);pixelLine(g,P(b.x-1,b.y),P(e.x-1,e.y),p.visor);}
  }
  if(['bloodbath','poison'].includes(c.id)){curve(g,[start.x-2,start.y+2,start.x+2,start.y+5,x.x-3,x.y+3,end.x-1,end.y-2],p.highlight,.7);curve(g,[start.x+2,start.y+1,start.x-1,start.y+5,x.x+3,x.y,end.x+1,end.y-2],p.shadow,.9);}
  if(['arachnia','elemental','manga'].includes(c.id)){const col=c.id==='elemental'?p.metal:p.accent;pixelLine(g,P(x.x-3,x.y-3),P(x.x+2,x.y),col);pixelLine(g,P(x.x+2,x.y),P(x.x-1,x.y+4),col);}
  if(c.id==='quarterback'){pixelLine(g,P(x.x-3,x.y-1),P(x.x+3,x.y),p.accent,2);}
  if(c.id==='medusa'){for(let j=0;j<4;j++){const v=at(.2+j*.17);pixelLine(g,P(v.x-2,v.y),P(v.x,v.y+1),p.highlight);pixelLine(g,P(v.x,v.y+1),P(v.x+2,v.y),p.shadow);}}
  if(c.id==='neural'){pixelLine(g,P(start.x-2,start.y+3),P(x.x+1,x.y),p.accent);pixelLine(g,P(x.x+1,x.y),P(end.x-1,end.y-2),p.visor);rect(g,x.x,x.y,2,2,p.highlight);}
  if(['sheikh','steampunk','gold-mage','cowboy','blue'].includes(c.id)){pixelLine(g,P(end.x-3,end.y-3),P(end.x+3,end.y-2),p.metal,2);}
}
function drawTorsoVolume(g,c,a,p,teamBand){
  const look=getCharacterCostume(c.id),q=a.palette,s=p.shoulder,h=p.hip,sw=look.chest/23,tw=look.waist/16.6,organic=a.material==='organic',cloth=['fabric','linen','leather','woven','ink'].includes(a.material),metal=!organic&&!cloth;
  const base=cloth?gradient(g,s.x-12,s.y,h.x+11,h.y,[q.base,q.base,q.shadow]):gradient(g,s.x-10,s.y-2,h.x+12,h.y+2,[q.highlight,q.base,q.base,q.shadow]);
  shape(g,b=>{b.moveTo(s.x-10*sw,s.y+3);b.quadraticCurveTo(s.x-7,s.y-1,s.x-3,s.y-2);b.lineTo(s.x+3,s.y-2);b.quadraticCurveTo(s.x+8,s.y-1,s.x+12*sw,s.y+4);b.quadraticCurveTo(s.x+11,s.y+15,h.x+8.4*tw,h.y+2);b.quadraticCurveTo(h.x,h.y+4,h.x-8.3*tw,h.y+1);b.quadraticCurveTo(s.x-8,s.y+15,s.x-10*sw,s.y+3);},base,q.skinShadow);
  shape(g,b=>{b.moveTo(s.x-9.8*sw,s.y+4);b.quadraticCurveTo(s.x-7,s.y+11,h.x-7,h.y);b.lineTo(h.x-2,h.y+1);b.quadraticCurveTo(s.x-4,s.y+14,s.x-3,s.y+7);},q.shadow);
  // Separate pectoral planes carry the form; the narrow side plane stays darker.
  const nearFill=cloth?q.base:gradient(g,s.x+1,s.y+3,s.x+9,s.y+14,[q.highlight,q.base]);
  shape(g,b=>{b.moveTo(s.x+1,s.y+3);b.quadraticCurveTo(s.x+9,s.y+1,s.x+11,s.y+7);b.quadraticCurveTo(s.x+10,s.y+13,s.x+3,s.y+13);b.quadraticCurveTo(s.x,s.y+9,s.x+1,s.y+3);},nearFill);
  shape(g,b=>{b.moveTo(s.x-8,s.y+4);b.quadraticCurveTo(s.x-3,s.y+1,s.x,s.y+4);b.lineTo(s.x-1,s.y+12);b.quadraticCurveTo(s.x-8,s.y+12,s.x-8,s.y+4);},gradient(g,s.x-8,s.y+3,s.x,s.y+12,[q.base,q.shadow]));
  if(organic){
    for(let j=0;j<4;j++){const y=s.y+6+j*4;curve(g,[s.x-8,y,s.x-5,y+3,s.x-3,y+3,s.x-1,y+1],q.highlight,.8);curve(g,[s.x+2,y+1,s.x+6,y+3,s.x+9,y+1,s.x+10,y-2],q.highlight,1);curve(g,[s.x-7,y+1,s.x-4,y+4,s.x-2,y+4,s.x-1,y+3],q.shadow,1.2);}
    curve(g,[s.x+1,s.y+3,s.x-2,s.y+11,h.x+3,h.y-3,h.x,h.y],q.skinShadow,.8);
  }else if(cloth){
    curve(g,[s.x-7,s.y+8,s.x-5,s.y+13,h.x-5,h.y-5,h.x-5,h.y],q.highlight,.55);
    curve(g,[s.x+8,s.y+10,s.x+6,s.y+15,h.x+4,h.y-5,h.x+7,h.y],q.shadow,.9);
    curve(g,[h.x-3,h.y-4,h.x,h.y-6,h.x+2,h.y-6,h.x+4,h.y-4],q.shadow,.6);
  }else{
    curve(g,[s.x-8,s.y+3,s.x-6,s.y+1,s.x-3,s.y+1,s.x-2,s.y+3],q.highlight,.7);
    curve(g,[s.x+2,s.y+3,s.x+6,s.y+1,s.x+9,s.y+4,s.x+10,s.y+6],q.highlight,.9);
    curve(g,[s.x+2,s.y+14,s.x+6,s.y+14,h.x+4,h.y-6,h.x+4,h.y-2],q.shadow,.65);
    for(const [x,y] of [[s.x-8,s.y+5],[s.x+9,s.y+7],[h.x-5,h.y-3]]){ellipse(g,x,y,.7,.8,q.shadow);ellipse(g,x-.15,y-.2,.3,.35,q.highlight);}
  }
  curve(g,[h.x-8,h.y+.1,h.x-2,h.y+1,h.x+4,h.y+1,h.x+8,h.y+.5],teamBand,2.1);
  curve(g,[h.x-7,h.y+2.1,h.x-2,h.y+3,h.x+4,h.y+3,h.x+7,h.y+2.5],q.shadow,1.3);
}
function torsoDetails(g,c,a,p,teamColors){
  const s=p.shoulder,h=p.hip,q=a.palette,x=s.x,y=s.y;
  const stripe=(x1,y1,x2,y2,col,w=1)=>pixelLine(g,P(x+x1,y+y1),P(x+x2,y+y2),col,w);
  switch(c.id){
    case 'chief':
      polyOutline(g,[P(x-9,y+1),P(x-2,y+5),P(x-3,y+12),P(x-8,y+16),P(x-12,y+9)],gradient(g,x-10,y,x-2,y+15,[q.highlight,q.base,q.shadow]),q.shadow);stripe(-9,2,-3,6,q.highlight);polyOutline(g,[P(x+6,y+2),P(x+12,y+7),P(x+9,y+17),P(x+4,y+12)],gradient(g,x+4,y+3,x+12,y+17,[q.highlight,q.base,q.shadow]),q.shadow);stripe(6,3,11,8,q.highlight);break;
    case 'bloodbath':
      for(let i=0;i<3;i++){curve(g,[x-8,y+5+i*4,x-7,y+9+i*4,x-2,y+9+i*4,x-1,y+7+i*4],q.shadow,1);curve(g,[x+2,y+7+i*4,x+5,y+10+i*4,x+9,y+7+i*4,x+9,y+5+i*4],q.highlight,.7);}break;
    case 'optimus':
      shape(g,b=>{b.moveTo(x-7,y+3);b.quadraticCurveTo(x,y-1,x+7,y+4);b.quadraticCurveTo(x+11,y+13,x+3,y+18);b.quadraticCurveTo(x-7,y+16,x-7,y+3);},gradient(g,x-6,y+3,x+7,y+16,[q.highlight,q.base,q.shadow]),q.shadow);stripe(-5,4,4,4,q.highlight);stripe(-7,7,-6,13,q.visor);stripe(7,7,6,13,q.visor);break;
    case 'quarterback':
      polyOutline(g,[P(x-10,y+2),P(x-2,y+3),P(x-3,y+11),P(x-9,y+9)],q.base,q.shadow);polyOutline(g,[P(x+2,y+3),P(x+11,y+3),P(x+10,y+10),P(x+3,y+12)],q.base,q.shadow);stripe(-9,3,-5,5,q.accent,2);stripe(5,5,9,3,q.accent,2);break;
    case 'arachnia':
      for(let i=0;i<3;i++){stripe(-8,5+i*5,0,9+i*3,q.accent);stripe(0,9+i*3,8,5+i*5,q.accent);}stripe(0,3,0,19,q.accent);break;
    case 'elemental':
      polyOutline(g,[P(x-7,y+3),P(x+5,y+4),P(x+8,y+16),P(x-4,y+17)],q.skin,q.shadow);stripe(-5,4,-1,9,q.metal);stripe(-1,9,-3,14,q.metal);stripe(4,5,1,10,q.metal);stripe(1,10,5,15,q.metal);break;
    case 'chaos':
      pixelPoly(g,[P(x-5,y+3),P(x+5,y+3),P(x+6,y+21),P(x-5,y+21)],q.skin);
      pixelPoly(g,[P(x-10,y+1),P(x-4,y+4),P(x-1,y+15),P(x-8,y+19)],q.base);pixelPoly(g,[P(x+9,y+2),P(x+4,y+4),P(x+1,y+15),P(x+7,y+19)],q.base);stripe(-8,4,-2,14,q.highlight);stripe(7,4,2,14,q.highlight);rect(g,x-7,y+7,3,3,'#f8e7b5');rect(g,x-6,y+6,1,5,'#e6e7f3');rect(g,x-3,y+1,6,2,'#722e4d');break;
    case 'poison':
      for(let i=0;i<3;i++){stripe(-8,6+i*4,-1,10+i*2,q.accent,2);stripe(1,10+i*2,8,6+i*4,q.accent,2);}stripe(-1,7,-1,18,q.accent,2);break;
    case 'sheikh':
      pixelPoly(g,[P(x-11,y+2),P(x-6,y+5),P(h.x-6,h.y+9),P(h.x-13,h.y+8)],q.base);pixelPoly(g,[P(x+8,y+2),P(x+12,y+5),P(h.x+13,h.y+10),P(h.x+7,h.y+6)],q.base);stripe(-7,6,-7,21,q.metal);stripe(8,6,8,21,q.metal);stripe(-9,7,-9,21,'#49795a');stripe(10,7,10,21,'#a84640');break;
    case 'hockey-mask':
      stripe(0,3,1,22,q.metal);for(const dx of [-7,4]){rect(g,x+dx,y+9,4,6,q.shadow);stripe(dx,9,dx+3,9,q.highlight);}stripe(-9,2,-4,7,q.base,2);stripe(7,2,3,7,q.base,2);break;
    case 'gladiator':
      polyOutline(g,[P(x-8,y+4),P(x+6,y+3),P(x+9,y+13),P(x+1,y+21),P(x-8,y+13)],q.base,q.shadow);stripe(-7,5,5,5,q.highlight);stripe(-5,10,0,8,q.metal);stripe(0,8,5,11,q.metal);rect(g,x-2,y+12,4,3,q.shadow);stripe(-4,17,3,18,q.highlight);break;
    case 'medusa':
      for(let yy=5;yy<21;yy+=4)for(let xx=-6;xx<7;xx+=4){stripe(xx,yy,xx+2,yy+1,q.highlight);stripe(xx+2,yy+1,xx+4,yy,q.shadow);}stripe(-8,4,-6,19,q.metal);stripe(7,4,6,19,q.metal);break;
    case 'gold-mage': case 'manga':
      pixelPoly(g,[P(x-11,y),P(x-5,y+3),P(x-6,y+20),P(x-12,y+16)],q.base);pixelPoly(g,[P(x+7,y+1),P(x+12,y+4),P(x+10,y+18),P(x+5,y+21)],q.base);stripe(-10,2,-7,18,q.highlight,2);stripe(10,4,7,17,q.highlight,2);for(let j=0;j<3;j++){rect(g,x-9,y+7+j*5,2,2,q.accent);rect(g,x+8,y+7+j*5,2,2,q.accent);}break;
    case 'ice': case 'fire':
      stripe(-8,2,-3,7,q.metal,2);stripe(8,2,3,7,q.metal,2);for(let j=0;j<3;j++){const xx=-8+j*8;pixelPoly(g,[P(x+xx,y+9),P(x+xx+2,y+5),P(x+xx+3,y+13)],q.highlight);}break;
    case 'steampunk':
      pixelPoly(g,[P(x-4,y+1),P(x,y+3),P(x+4,y+1),P(x+4,y+6),P(x,y+4),P(x-4,y+6)],'#65404b');
      stripe(-8,2,6,22,q.shadow,3);stripe(-7,2,7,22,q.metal);for(let j=0;j<3;j++){rect(g,x+5,y+7+j*4,2,2,q.metal);}rect(g,h.x-8,h.y-3,16,3,q.shadow);rect(g,h.x-2,h.y-4,5,5,q.metal);rect(g,h.x-1,h.y-3,3,3,q.shadow);break;
    case 'assimilator':
      for(let j=0;j<3;j++){stripe(-9,4+j*4,8,7+j*4,q.shadow,2);stripe(-8,4+j*4,7,7+j*4,q.highlight);}rect(g,x-9,y+8,5,6,q.base);rect(g,x-8,y+9,2,2,q.visor);break;
    case 'hunter':
      for(const dx of [-9,6]){rect(g,x+dx,y+4,4,5,'#c7c6aa');rect(g,x+dx+1,y+8,2,2,'#c7c6aa');dot(g,x+dx+1,y+5,q.shadow);dot(g,x+dx+3,y+5,q.shadow);}
      stripe(-9,2,6,23,q.shadow,3);for(let j=0;j<4;j++)rect(g,x-7+j*3,y+5+j*4,2,3,q.metal);for(const dx of [-9,7]){pixelPoly(g,[P(x+dx,y+2),P(x+dx-2,y-4),P(x+dx+3,y)],q.highlight);}break;
    case 'cowboy':
      pixelPoly(g,[P(x-11,y+1),P(x+9,y),P(x+13,y+9),P(x+2,y+16),P(x-13,y+10)],q.base);stripe(-9,3,10,6,q.highlight);stripe(-11,8,0,14,q.shadow);stripe(-8,2,6,22,q.shadow,3);for(let j=0;j<5;j++)rect(g,x-7+j*3,y+4+j*4,2,2,q.metal);break;
    case 'blue':
      stripe(-8,2,6,22,q.metal,2);stripe(8,2,-6,22,q.shadow,3);stripe(9,2,-5,22,q.highlight);for(const dx of [-12,11])pixelPoly(g,[P(x+dx,y+1),P(x+dx+(dx>0?5:-5),y-5),P(x+dx,y+8)],'#886aa8');break;
    case 'alien':
      for(let j=0;j<4;j++){stripe(-7,6+j*4,0,9+j*3,q.shadow);stripe(0,9+j*3,7,6+j*4,q.highlight);}rect(g,x-3,y+15,5,5,q.base);break;
    case 'digital-punk':
      for(const [xx,yy,col] of [[-7,5,'#8bd5e4'],[5,7,'#e4cd6c'],[-5,13,'#d68ca9'],[6,16,'#91c980']])rect(g,x+xx,y+yy,3,3,col);stripe(-10,2,-6,21,q.highlight);stripe(9,3,6,21,q.shadow,2);break;
    case 'mask':
      pixelPoly(g,[P(x-11,y),P(x-4,y+3),P(x-1,y+12),P(x-8,y+8)],q.highlight);pixelPoly(g,[P(x+5,y+2),P(x+13,y),P(x+10,y+8),P(x+3,y+12)],q.base);stripe(0,12,1,22,q.metal);break;
    case 'neural':
      for(const side of [-1,1]){stripe(side*8,3,side*5,10,q.visor);stripe(side*5,10,side*9,16,q.accent);stripe(side*9,16,side*3,21,q.visor);rect(g,x+side*5,y+9,2,2,q.highlight);}stripe(0,5,0,19,q.accent);break;
  }
}
const digitBits=['111101101101111','010110010010111','111001111100111','111001111001111','101101111001001','111100111001111','111100111101111','111001001001001','111101111101111','111101111001111'];
function number(g,c,x,y,color){const value=String(c.tokenId||c.number||'01').slice(-2).padStart(2,'0');for(let n=0;n<2;n++){const bits=digitBits[Number(value[n])]||digitBits[0];for(let k=0;k<15;k++)if(bits[k]==='1')rect(g,x+n*4+k%3,y+Math.floor(k/3),1,1,color);}}
function drawCostumeLimb(g,c,a,start,end,near,isLeg,upper,w){
  const look=getCharacterCostume(c.id),q=a.palette,kind=isLeg?look.legwear:look.sleeve,at=t=>lerpPoint(start,end,t),d=Math.hypot(end.x-start.x,end.y-start.y)||1,n=P(-(end.y-start.y)/d,(end.x-start.x)/d),xy=(t,x)=>{const p=at(t);return P(p.x+n.x*x,p.y+n.y*x);};
  const edge=near?look.metal:q.shadow,base=near?q.base:q.shadow;
  const seam=(t,width,col=look.metal)=>pixelLine(g,xy(t,-width*w),xy(t,width*w),near?col:q.shadow,1.05);
  if(upper&&!isLeg&&['ceramic','gridiron'].includes(kind)){
    pixelLine(g,xy(.17,-3.6*w),xy(.76,-2.6*w),near?q.base:q.shadow,1.25);
    if(kind==='gridiron'){seam(.34,3.1,q.accent);seam(.45,3.0,q.accent);}
    else pixelLine(g,xy(.2,-3*w),xy(.65,-2.6*w),q.visor,.65);
    return;
  }
  if(['plate','bronze','gridiron','machine','hunter','scorched','carbon','ceramic','porcelain','greaves','frost'].includes(kind)){
    const plateBase=['bronze','greaves'].includes(kind)?look.metal:kind==='porcelain'?q.skin:q.base;
    const palette={base:near?plateBase:tone(plateBase,-.17),shadow:q.skinShadow,highlight:near?tone(plateBase,.25):q.base};
    plate(g,at(upper?(isLeg?.49:.17):.18),at(.83),(isLeg?2.65:upper&&kind==='porcelain'?1.25:2.2)*w,palette,!near);
    const mid=at(.55);pixelPoly(g,[xy(.34,-1.25*w),xy(.4,-1.9*w),xy(.62,-1.25*w),xy(.68,-.3*w)],edge);
    seam(.83,isLeg?2:1.5,q.shadow);
    if(['ceramic','porcelain','machine','frost','scorched'].includes(kind))pixelLine(g,xy(.29,-1.65*w),xy(.68,-1.1*w),kind==='porcelain'?q.metal:q.visor,1.15);
    if(kind==='gridiron'){seam(.36,3.4,q.accent);seam(.45,3.3,q.accent);}
    if(kind==='hunter'){pixelPoly(g,[xy(.33,-2.7*w),xy(.23,-5.4*w),xy(.48,-2.3*w)],edge);}
    if(kind==='carbon'){pixelLine(g,xy(.25,-2*w),xy(.53,.6*w),q.accent,1.05);pixelLine(g,xy(.53,.6*w),xy(.76,-1.2*w),q.accent,1.05);}
  }else if(['sinew','alien','scales'].includes(kind)){
    for(let i=0;i<3;i++){const t=.2+i*.21,v=at(t);if(kind==='scales'){pixelPoly(g,[xy(t,-2.5*w),xy(t+.08,-.6*w),xy(t+.15,-1.5*w),xy(t+.07,-3*w)],near?q.highlight:q.base);pixelPoly(g,[xy(t,1.2*w),xy(t+.07,2.8*w),xy(t+.15,1.3*w)],q.shadow);}else{curve(g,[xy(t,-2*w).x,xy(t,-2*w).y,v.x-1,v.y+2,v.x+2,v.y+2,xy(t+.12,1.6*w).x,xy(t+.12,1.6*w).y],c.id==='poison'&&i===0?look.metal:near?q.highlight:q.base,1.0);}}
    if(kind==='alien')for(const t of [.3,.61]){const v=at(t);ellipse(g,v.x,v.y,1.1,1.4,look.metal);}
  }else{
    // Tailored cloth, leather and robes have angular compression folds and
    // contrasting cuffs, not the hard shin plates worn by the armored roster.
    for(const t of [.31,.58])pixelPoly(g,[xy(t,-2.5*w),xy(t+.10,.9*w),xy(t+.16,2.7*w),xy(t+.07,.7*w)],q.shadow);
    pixelLine(g,xy(.18,-2.6*w),xy(.72,-1.6*w),near?q.highlight:q.base,.85);
    if(!upper){seam(.77,2.0,look.metal);seam(.85,1.8,q.shadow);}
    if(['pinstripe','tailored','ink'].includes(kind)){for(const x of [-1.2,1.2])pixelLine(g,xy(.13,x*w),xy(.83,x*.65*w),kind==='ink'?q.highlight:tone(q.base,.2),.65);}
    if(['clockwork','gilded','robe'].includes(kind)){for(const t of [.34,.62]){const p=xy(t,-1.8*w);rect(g,p.x,p.y,1.5,1.5,edge);}seam(.9,1.5,look.metal);}
    if(['woven','poncho'].includes(kind)){for(const t of [.3,.48,.66])seam(t,1.8,near?look.metal:q.base);}
    if(kind==='punk'){for(const [t,col] of [[.28,'#70e0b3'],[.58,'#d278b4']]){const p=xy(t,-1.4*w);rect(g,p.x-1.2,p.y-1,2.2,2.2,near?col:q.base);}}
    if(kind==='neon'){pixelLine(g,xy(.12,-2.6*w),xy(.39,-1.3*w),q.visor,1.15);pixelLine(g,xy(.39,-1.3*w),xy(.57,.6*w),q.accent,1.15);pixelLine(g,xy(.57,.6*w),xy(.84,-1*w),q.visor,1.15);}
  }
}
function drawCostumeShoulder(g,c,a,shoulder,elbow,near){
  const look=getCharacterCostume(c.id),q=a.palette,original=getNFTArt(c.id),metal=['plate','gridiron','bronze','hunter','gilded','scorched','frost','machine','carbon','porcelain'].includes(look.sleeve);
  if(!metal&&look.sleeve!=='ceramic')return;
  const dx=elbow.x-shoulder.x,dy=elbow.y-shoulder.y,angle=clamp(Math.atan2(-dx,dy),-.65,.65),width=(metal?6.6:4.7)*a.body.shoulder;
  g.save();g.translate(shoulder.x,shoulder.y+1);g.rotate(angle);
  const points=[P(-width,-3),P(-width*.45,-5.4),P(width*.6,-5.2),P(width+1,-.5),P(width*.8,7.4),P(-width*.6,8.1),P(-width-1,3.7)];
  polyOutline(g,points,near?q.base:q.shadow,q.skinShadow);
  if(original&&metal){
    const {width:sw,height:sh}=imageDimensions(original.image),profile=original.profile.torso,ys=profile.polygon.map(p=>p[1]),xs=profile.polygon.map(p=>p[0]),top=profile.top[1],left=Math.min(...xs),right=Math.max(...xs),span=right-left;
    const cropW=span*.27,cropX=near?right-cropW:left,cropY=Math.min(.80,top+.035),cropH=Math.min(.25,1-cropY);
    g.save();clipPolygon(g,points);g.imageSmoothingEnabled=true;const texture=getNFTSpriteTexture(c.id,original);g.drawImage(texture,cropX*texture.width,cropY*texture.height,cropW*texture.width,cropH*texture.height,-width,-5.4,width*2,14);if(!near){g.fillStyle='#10152345';g.fillRect(-width-1,-6,width*2+2,15);}g.restore();
  }
  // The cap wraps over a separate upper arm: its underside occludes the arm,
  // while the broad upper bevel catches the same light as the source chest.
  g.save();clipPolygon(g,points);
  pixelPoly(g,[P(-width*.9,4.7),P(-width*.25,5.6),P(width*.75,4.6),P(width*.8,8.8),P(-width*.65,9.1)],near?q.shadow:q.skinShadow);
  pixelPoly(g,[P(-width*.82,-2.2),P(-width*.42,-4.6),P(width*.55,-4.5),P(width*.7,-2.5),P(-width*.3,-2.8)],near?tone(q.base,.18):q.base);
  g.restore();
  pixelLine(g,P(-width*.7,-3.6),P(width*.5,-3.6),near?look.metal:q.base,1.2);
  pixelLine(g,P(width*.72,-1.4),P(width*.63,5.4),near?q.shadow:q.skinShadow,1.2);
  if(['gridiron','hunter','gilded','bronze'].includes(look.sleeve)){const accent=look.sleeve==='gridiron'?q.accent:look.metal;pixelPoly(g,[P(-3,-.3),P(.5,-1.4),P(3,1),P(1,4),P(-2.6,3.5)],near?accent:q.base);}
  if(['hunter','frost','gilded'].includes(look.sleeve))pixelPoly(g,[P(-width*.8,-2),P(-width-3,-8),P(-width*.2,-3.4)],near?look.metal:q.base);
  g.restore();
}
function drawHand(g,hand,elbow,q,near,id,wrist=0,openness=0){
  g.save();g.translate(hand.x,hand.y);g.rotate(Math.atan2(hand.y-elbow.y,hand.x-elbow.x)+Math.PI*.5+wrist);g.scale(1.17,1.12);
  const col=near?q.base:q.shadow;shape(g,b=>{b.moveTo(-1.8,2);b.lineTo(-2.5,-.5);b.quadraticCurveTo(-2.9,-2.1,-1.4,-2.7);b.lineTo(.8,-2.7);b.quadraticCurveTo(2.8,-2,2.4,.3);b.lineTo(1.5,2);},gradient(g,-2,-2,2,2,[near?q.highlight:q.base,col,q.shadow]),q.skinShadow);
  if(openness>.4)for(let j=0;j<4;j++){const x=-1.6+j*.9;curve(g,[x,-1.7,x-.2,-3-openness,x+(j-1.5)*.35,-4-openness,x+(j-1.5)*.55,-4.5-openness],near?q.base:q.shadow,.8);}
  for(let j=0;j<3;j++)curve(g,[-1.5+j*1.1,-2,-1.7+j*1.1,-1.4,-1.3+j*1.1,-.5,-1.4+j*1.1,.1],q.shadow,.42);
  curve(g,[-2.1,-.8,-3.7,-.3,-3,1.6,-1.5,1],col,1.1);
  if(['bloodbath','poison'].includes(id))for(let j=0;j<3;j++)pixelLine(g,P(-1.2+j*1.1,-2.3),P(-1.3+j*1.1,-3.5),q.highlight,.6);
  g.restore();
}
function drawArticulatedArm(g,c,art,shoulder,elbow,hand,near,pose={}){
  const q=art.palette,look=getCharacterCostume(c.id),w=Math.max(1,art.body.limbWidth)*look.arm*(art.build==='heavy'?1.08:1.02)*(near?1:.89),organic=art.material==='organic',under=['ceramic','gridiron','porcelain','machine'].includes(look.sleeve),pal=under?ramp(q.skin,q.skinShadow,tone(q.skin,.30)):ramp(organic?q.skin:q.base,organic?q.skinShadow:q.shadow,q.highlight);
  if(near&&pose.shoulder&&pose.hip){
    const s=pose.shoulder,h=pose.hip,sw=look.chest*.47*(1-.22*(pose.torsoYaw||0)),hw=look.waist*.48;
    // A hand/forearm crossing the torso casts a small attached shadow. The
    // silhouette clip keeps the shadow off the floor and the player's outline.
    g.save();clipPolygon(g,[P(s.x-sw,s.y+2),P(s.x+sw,s.y+2),P(h.x+hw,h.y+2),P(h.x-hw,h.y+2)]);
    g.translate(.7,1.2);g.beginPath();g.moveTo(shoulder.x,shoulder.y);g.lineTo(elbow.x,elbow.y);g.lineTo(hand.x,hand.y);g.strokeStyle='#07101c';g.globalAlpha=.2;g.lineWidth=5.4*w;g.lineCap='round';g.lineJoin='round';g.stroke();g.restore();
  }
  // Deltoid, biceps and forearm share overlap volume; the elbow crease is a
  // small shaded fold instead of an armor diamond separating two sticks.
  limb(g,shoulder,elbow,4.05*w,4.65*w,2.65*w,pal,!near);
  const dx=elbow.x-shoulder.x,dy=elbow.y-shoulder.y,d=Math.hypot(dx,dy)||1,n=P(-dy/d,dx/d),cap=lerpPoint(shoulder,elbow,.18);
  const outer=lerpPoint(shoulder,elbow,.35);curve(g,[shoulder.x-n.x*2.3*w,shoulder.y-n.y*2.3*w,cap.x-n.x*4.1*w,cap.y-n.y*4.1*w,outer.x-n.x*4*w,outer.y-n.y*4*w,outer.x-n.x*2.8*w,outer.y-n.y*2.8*w],near?q.highlight:q.base,.55);
  drawCostumeLimb(g,c,art,shoulder,elbow,near,false,true,w);
  if(['fabric','linen','leather','woven','ink'].includes(art.material)){const a=lerpPoint(shoulder,elbow,.8),b=lerpPoint(shoulder,elbow,.91);pixelLine(g,P(a.x-n.x*2,a.y-n.y*2),P(b.x+n.x*2,b.y+n.y*2),q.shadow,.7);}
  drawCostumeShoulder(g,c,art,shoulder,elbow,near);
  drawForearm(g,c,art,elbow,hand,near,pose);
}
function drawForearm(g,c,art,elbow,hand,near,pose={}){
  const q=art.palette,look=getCharacterCostume(c.id),w=Math.max(1,art.body.limbWidth)*look.arm*(art.build==='heavy'?1.08:1.02)*(near?1:.89),organic=art.material==='organic',pal=ramp(organic?q.skin:q.base,organic?q.skinShadow:q.shadow,q.highlight);
  joint(g,elbow,2.65*w,near?pal:pal.map(color=>tone(color,-.17)),art.material);limb(g,elbow,hand,2.75*w,3.35*w,1.55*w,pal,!near);limbDetail(g,c,art,elbow,hand,near,false);drawCostumeLimb(g,c,art,elbow,hand,near,false,false,w);drawHand(g,hand,elbow,q,near,c.id,near?pose.wristNear:pose.wristFar,near?pose.openNear:pose.openFar);
}
const supportHands=(state,art)=>state==='pass'||state==='shoot'||state==='dunk'&&art.animation.dunkStyle==='power';
function renderPose(g,c,art,pose,team,omit={}){
  const original=getNFTArt(c.id),q=art.palette,skin=ramp(q.skin,q.skinShadow,q.highlight),armor=ramp(q.base,q.shadow,q.highlight),dark=[q.skinShadow,q.skinShadow,q.shadow,q.base,q.highlight];
  const jersey=team===0?ramp('#ef693e','#8b342f','#ffad69'):team===1?ramp('#b7d5c1','#426b68','#f0f2d5'):ramp(q.base,q.shadow,q.highlight),trim=c.id==='manga'?'#e6e2eb':team===0?'#ffe7a8':team===1?'#f3e8b7':q.accent;
  const look=getCharacterCostume(c.id),heavy=['heavy','power'].includes(art.build),w=Math.max(1,art.body.limbWidth)*(art.build==='heavy'?1.08:1),costume=ramp(q.base,q.shadow,q.highlight),teamBand=c.id==='manga'?'#c9c7cf':team===0?'#ff7544':team===1?'#90dfc6':q.accent;
  g.save();g.scale(1,art.body.height);if(pose.state==='stunned')g.rotate(pose.tilt);else if(pose.tilt)g.rotate(pose.tilt);
  accessoriesBehind(g,c,art,pose);
  const leg=(hip,knee,ankle,near)=>{const v=w*look.thigh*(near?1:.87),calf=w*look.calf*(near?1:.87),cloth=['denim','tailored','pinstripe'].includes(look.legwear),pal=art.material==='organic'?skin:cloth?ramp(tone(q.base,-.18),q.shadow,tone(q.base,.13)):costume;
    limb(g,hip,knee,4.75*v,5.8*v,2.9*v,pal,!near);
    joint(g,knee,2.95*v,near?pal:pal.map(color=>tone(color,-.17)),art.material);
    limb(g,knee,ankle,2.9*calf,4.1*calf,1.8*calf,pal,!near);
    limbDetail(g,c,art,knee,ankle,near,true);
    drawCostumeLimb(g,c,art,hip,knee,near,true,true,v);drawCostumeLimb(g,c,art,knee,ankle,near,true,false,calf);
    // The shorts cuff follows the thigh, rather than a horizontal orange bar
    // floating independently of the limb's direction.
    const end=lerpPoint(hip,knee,.43),dx=knee.x-hip.x,dy=knee.y-hip.y,d=Math.hypot(dx,dy)||1,n=P(-dy/d,dx/d);
    limb(g,hip,end,5.2*v,6.1*v,5.15*v,costume,!near);
    pixelLine(g,P(end.x-n.x*4.7*v,end.y-n.y*4.7*v),P(end.x+n.x*4.7*v,end.y+n.y*4.7*v),q.shadow,1.35);
    const accent=lerpPoint(hip,knee,.29);pixelLine(g,P(accent.x-n.x*5.2*v,accent.y-n.y*5.2*v),P(end.x-n.x*4.8*v,end.y-n.y*4.8*v),teamBand,1.25);
    shoe(g,ankle,(near?pose.footNear:pose.footFar)?.angle||0,near?armor:dark,trim,heavy,art.build,look);
  };
  leg(pose.hipFar,pose.kneeFar,pose.ankleFar,false);
  if(!omit.far)drawArticulatedArm(g,c,art,pose.shoulderFar,pose.elbowFar,pose.handFar,false,pose);
  leg(pose.hipNear,pose.kneeNear,pose.ankleNear,true);
  const s=pose.shoulder,h=pose.hip,tw=look.waist/17,sw=art.body.shoulder;
  // A continuous pelvis bridges the two upper legs under the source costume.
  shape(g,b=>{b.moveTo(h.x-7.8*tw,h.y-3);b.quadraticCurveTo(h.x,h.y-5,h.x+8.4*tw,h.y-2);b.lineTo(h.x+7.5*tw,h.y+8);b.quadraticCurveTo(h.x+3,h.y+9,h.x+1,h.y+5);b.quadraticCurveTo(h.x-3,h.y+9,h.x-7.5*tw,h.y+6);},gradient(g,h.x-8,h.y,h.x+8,h.y+7,[q.base,q.base,q.shadow]),q.shadow);
  if(original){g.save();g.translate(s.x,0);g.scale(1-.3*(pose.torsoYaw||0),1);g.translate(-s.x,0);drawTorsoVolume(g,c,art,pose,teamBand);g.restore();drawNFTTorso(g,original,pose,art);}
  else {drawTorsoVolume(g,c,art,pose,teamBand);torsoDetails(g,c,art,pose,jersey);}
  // Collar, shoulder volume and close arm are layered over the three-quarter chest.
  if(!original){rect(g,s.x-3,s.y-6,6,6,q.skinShadow);rect(g,s.x-2,s.y-6,4,4,q.base);pixelLine(g,P(s.x-4,s.y),P(s.x,s.y+3),trim);pixelLine(g,P(s.x,s.y+3),P(s.x+5,s.y+1),trim);}
  if(!original&&['chief','quarterback','gold-mage','gladiator','manga','ice','fire'].includes(c.id)){
    for(const [sp,near] of [[pose.shoulderFar,false],[pose.shoulderNear,true]]){const pad=heavy?6.3:5.0;polyOutline(g,[P(sp.x-pad,sp.y-2),P(sp.x+pad-1,sp.y-3),P(sp.x+pad+1,sp.y+5),P(sp.x+pad-2,sp.y+9),P(sp.x-pad,sp.y+7)],gradient(g,sp.x-pad,sp.y-3,sp.x+pad,sp.y+8,near?[q.highlight,q.base,q.shadow]:[q.base,q.shadow]),q.skinShadow);pixelLine(g,P(sp.x-pad+1,sp.y-1),P(sp.x+pad-2,sp.y-2),q.highlight);pixelLine(g,P(sp.x-pad+1,sp.y+1),P(sp.x-pad+1,sp.y+5),q.highlight);if(c.id==='chief')rect(g,sp.x-3,sp.y,5,2,q.skinShadow);if(c.id==='quarterback')rect(g,sp.x-2,sp.y+3,4,2,q.accent);}
  }
  if(!omit.far&&supportHands(pose.state,art))drawForearm(g,c,art,pose.elbowFar,pose.handFar,false,pose);
  if(!omit.near)drawArticulatedArm(g,c,art,pose.shoulderNear,pose.elbowNear,pose.handNear,true,pose);
  // Team number remains legible even when the character keeps its own armor.
  if(!original)number(g,c,h.x-3,h.y-8,trim);
  if(!original&&art.accessories.some(x=>x.includes('medallion'))){const mx=s.x+2,my=s.y+11;polyOutline(g,[P(mx-2,my-1),P(mx+1,my-2),P(mx+3,my),P(mx+1,my+2),P(mx-2,my+2)],q.metal,q.shadow);dot(g,mx,my,q.visor);}
  if(original)drawNFTHead(g,original,pose,c.id);else drawPremiumHelmet(g,c,art,pose);
  // Shooting forearm occupies a front plane, with individual wrist and finger pixels.
  if(!omit.near&&['shoot','dunk','block'].includes(pose.state))drawForearm(g,c,art,pose.elbowNear,pose.handNear,true,pose);
  g.restore();
}
function makeCanvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function cachedFrame(cache,key,create){let entry=cache.items.get(key);if(entry){cache.items.delete(key);cache.items.set(key,entry);return entry;}entry=create();cache.items.set(key,entry);cache.bytes+=entry.bytes;while(cache.bytes>cache.max&&cache.items.size>1){const oldest=cache.items.keys().next().value,removed=cache.items.get(oldest);cache.items.delete(oldest);cache.bytes-=removed.bytes;removed.canvas.width=1;removed.canvas.height=1;}return entry;}
function poseBounds(art,pose){
  const points=[];for(const value of Object.values(pose))if(value&&typeof value==='object'&&'x' in value)for(const dx of [-10,10])for(const dy of [-10,10])points.push(P(value.x+dx,value.y+dy));
  // Costume ornaments and head silhouettes are independent of limb articulation.
  for(const dx of [-39,33])for(const dy of [-49,32])points.push(P(pose.shoulder.x+dx,pose.shoulder.y+dy));
  if(['gold-mage','manga','sheikh','ice','fire','mask','chaos','cowboy'].includes(art.helmet))for(const dx of [-26,26])points.push(P(pose.hip.x+dx,-10));
  const original=getNFTArt(art.helmet);
  if(original){
    const head=sourceHeadGeometry(original,pose),cs=Math.cos(head.rotation),sn=Math.sin(head.rotation);
    for(const p of head.polygon){const x=(p.x-head.anchor.x)*head.scale,y=(p.y-head.anchor.y)*head.scale;points.push(P(head.target.x+x*cs-y*sn,head.target.y+x*sn+y*cs));}
    const torso=sourceTorsoGeometry(original,pose,art.helmet);for(const p of torso.polygon)points.push(P(torso.a*p.x+torso.c*p.y+torso.e,torso.b*p.x+torso.d*p.y+torso.f));
  }

  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;const cs=Math.cos(pose.tilt),sn=Math.sin(pose.tilt);
  for(const point of points){const x=point.x*cs-point.y*sn,y=(point.x*sn+point.y*cs)*art.body.height;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
  left=Math.floor(left-2);top=Math.floor(top-2);right=Math.ceil(right+2);bottom=Math.ceil(bottom+2);return {left,top,width:right-left,height:bottom-top};
}
function createFrame(c,art,state,index,team,splitArms=false,context={}){
  const pose=makePose(art,state,index,null,context),bounds=poseBounds(art,pose),canvas=makeCanvas(bounds.width*DENSITY,bounds.height*DENSITY),g=canvas.getContext('2d');
  g.scale(DENSITY,DENSITY);g.translate(-bounds.left,-bounds.top);renderPose(g,c,art,pose,team,splitArms?{near:true,far:supportHands(state,art)}:{});
  return {canvas,x:bounds.left,y:bounds.top,w:bounds.width,h:bounds.height,bytes:canvas.width*canvas.height*4};
}
export function getSpriteCacheStats(){return Object.fromEntries(Object.entries(frameCaches).map(([name,c])=>[name,{frames:c.items.size,bytes:c.bytes,max:c.max}]));}
export function getSpriteAttachment(character,o={},prepared){
  const {art,state,index,pose}=prepared||poseForOptions(character,o),cs=Math.cos(pose.tilt),sn=Math.sin(pose.tilt),tr=(point)=>({x:point.x*cs-point.y*sn,y:(point.x*sn+point.y*cs)*art.body.height});
  const feet=[{...tr(pose.ankleFar),grounded:pose.footFar.grounded,contact:pose.footFar.contact},{...tr(pose.ankleNear),grounded:pose.footNear.grounded,contact:pose.footNear.contact}];
  return {hand:tr(pose.handNear),head:tr(P(pose.shoulder.x,pose.shoulder.y-22)),feet,height:MOTION_METRICS.height*art.body.height,state,frame:index,reachError:pose.reachError||0,reachErrors:pose.reachErrors||[]};
}
export function getSpriteBounds(character,o={},prepared){const {art,pose}=prepared||poseForOptions(character,o);return poseBounds(art,pose);}
export function drawSprite(g,character,o={},prepared){
  const {art,state,index,context,pose,transitioning}=prepared||poseForOptions(character,o),scale=o.scale||1,facing=(state==='pass'?o.passFacing??o.facing:o.facing)===-1?-1:1;
  g.save();g.translate(o.x||0,o.y||0);g.scale(scale*facing,scale);g.imageSmoothingEnabled=true;
  // Short action changes are drawn directly from the blended skeleton. They
  // never allocate a raster tile or create an unbounded per-frame cache key.
  if(transitioning){renderPose(g,character,art,pose,o.team);g.restore();return;}
  const dynamic=state==='dribble'||!!(o.ballHand&&['shoot','dunk','pass'].includes(state)),key=`${character.id}:${o.team??'portrait'}:${state}:${index}:${dynamic?'split':'full'}:${contextKey(context)}`,cache=o.team==null?frameCaches.portrait:frameCaches.game;
  const frame=cachedFrame(cache,key,()=>createFrame(character,art,state,index,o.team,dynamic,context));
  const dynamicArm=(near,forearmOnly=false)=>{g.save();g.scale(1,art.body.height);if(pose.tilt)g.rotate(pose.tilt);if(forearmOnly)drawForearm(g,character,art,near?pose.elbowNear:pose.elbowFar,near?pose.handNear:pose.handFar,near,pose);else drawArticulatedArm(g,character,art,near?pose.shoulderNear:pose.shoulderFar,near?pose.elbowNear:pose.elbowFar,near?pose.handNear:pose.handFar,near,pose);g.restore();};
  if(dynamic&&supportHands(state,art))dynamicArm(false);
  g.drawImage(frame.canvas,0,0,frame.canvas.width,frame.canvas.height,frame.x,frame.y,frame.w,frame.h);
  if(dynamic&&supportHands(state,art))dynamicArm(false,true);
  if(dynamic)dynamicArm(true);g.restore();
}
// Optional cooperative warming keeps heavy first-use raster work off a game frame.
export async function warmSpriteCache(characters,{states=['idle','run'],team=0,budgetMs=5,onProgress}={}){
  const jobs=[];for(const c of characters)for(const state of states)for(let index=0;index<SPRITE_FRAME_COUNTS[state];index++)jobs.push({c,state,index});
  let done=0;while(done<jobs.length){const start=performance.now();do{const {c,state,index}=jobs[done++],art=artFor(c),context=motionContext({},state),key=`${c.id}:${team}:${state}:${index}:full:${contextKey(context)}`;cachedFrame(frameCaches.game,key,()=>createFrame(c,art,state,index,team,false,context));}while(done<jobs.length&&performance.now()-start<budgetMs);onProgress?.(done/jobs.length);if(done<jobs.length)await new Promise(resolve=>setTimeout(resolve,0));}
}

function shape(g,draw,fill,edge){g.beginPath();draw(g);g.closePath();g.fillStyle=fill;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=.65;g.lineJoin='round';g.stroke();}}
function helmetMark(g,x,y,color,scale=1){g.save();g.translate(x,y);g.scale(scale,scale);g.strokeStyle=color;g.lineWidth=1.15;g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(-4,4);g.lineTo(-4,-4);g.lineTo(0,0);g.lineTo(4,-4);g.lineTo(4,4);g.moveTo(-2.6,4);g.lineTo(0,1);g.lineTo(2.6,4);g.stroke();g.strokeStyle='#fffce8';g.lineWidth=.32;g.stroke();g.restore();}
const spriteArtListeners=new Set();
function invalidateCharacterArt(id){for(const cache of Object.values(frameCaches))for(const [key,frame] of cache.items)if(key.startsWith(`${id}:`)){cache.items.delete(key);cache.bytes-=frame.bytes;frame.canvas.width=1;frame.canvas.height=1;}}
onNFTArtReady(id=>{invalidateCharacterArt(id);for(const listener of spriteArtListeners)listener(id);});
export function onSpriteArtReady(listener){spriteArtListeners.add(listener);return()=>spriteArtListeners.delete(listener);}
// Compatibility names retained while callers migrate to the original-NFT loader.
export function loadPremiumHeadArt(ids){return loadNFTArt(ids);}
export function installPremiumHeadArt(){return false;}
function imageDimensions(image){return {width:image.naturalWidth||image.width,height:image.naturalHeight||image.height};}
function polygonPixels(polygon,width,height){return polygon.map(([x,y])=>P(x*width,y*height));}
function clipPolygon(g,polygon){g.beginPath();g.moveTo(polygon[0].x,polygon[0].y);for(let i=1;i<polygon.length;i++)g.lineTo(polygon[i].x,polygon[i].y);g.closePath();g.clip();}
function sourceHeadGeometry(original,pose){
  const {image,profile}=original,{width,height}=imageDimensions(image),head=profile.head,polygon=polygonPixels(head.polygon,width,height),anchor=P(head.anchor[0]*width,head.anchor[1]*height),top=Math.min(...polygon.map(p=>p.y)),scale=head.height*MOTION_METRICS.headScale/Math.max(1,anchor.y-top),rotation=Number.isFinite(pose.headRotation)?pose.headRotation:pose.state==='run'?Math.sin(pose.p*Math.PI*2)*.025:pose.state==='dunk'?(pose.shoulder.x-pose.hip.x)*.0025:0;
  return {polygon,anchor,scale,rotation,target:P(pose.shoulder.x+1,pose.shoulder.y+2)};
}
function drawNFTHead(g,original,pose,id){
  const head=sourceHeadGeometry(original,pose),texture=getNFTSpriteTexture(id,original),size=imageDimensions(original.image);
  // A small contact shadow seats the source helmet on the collar without
  // recoloring its face or putting a glowing outline around the whole sprite.
  g.save();g.globalAlpha=.28;ellipse(g,head.target.x+.7,head.target.y+1.4,5.2,2.0,'#08111b');g.restore();
  g.save();g.translate(head.target.x,head.target.y);if(head.rotation)g.rotate(head.rotation);g.scale(head.scale,head.scale);g.translate(-head.anchor.x,-head.anchor.y);
  g.save();clipPolygon(g,head.polygon);g.imageSmoothingEnabled=true;g.drawImage(texture,0,0,size.width,size.height);g.restore();
  g.beginPath();head.polygon.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();g.globalAlpha=.6;g.strokeStyle='#08121c';g.lineWidth=.65/head.scale;g.lineJoin='round';g.stroke();g.restore();
}
function sourceTorsoGeometry(original,pose,id){
  const {image,profile}=original,{width,height}=imageDimensions(image),torso=profile.torso,polygon=polygonPixels(torso.polygon,width,height),top=P(torso.top[0]*width,torso.top[1]*height),bottom=P(torso.bottom[0]*width,torso.bottom[1]*height),dx=bottom.x-top.x,dy=bottom.y-top.y,length=Math.hypot(dx,dy)||1,along=P(dx/length,dy/length),side=P(along.y,-along.x);
  const look=getCharacterCostume(id),sourceWidth=Math.max(...polygon.map(p=>p.x))-Math.min(...polygon.map(p=>p.x)),target=P(pose.shoulder.x,pose.shoulder.y+1),end=P(pose.hip.x,pose.hip.y+2),scaleX=look.chest*(1-.22*(pose.torsoYaw||0))/sourceWidth,tx=(end.x-target.x)/length,ty=(end.y-target.y)/length;
  const shoulderAxis=P(pose.shoulderNear.x-pose.shoulderFar.x,pose.shoulderNear.y-pose.shoulderFar.y),hipAxis=P(pose.hipNear.x-pose.hipFar.x,pose.hipNear.y-pose.hipFar.y),axis=P(shoulderAxis.x*.75+hipAxis.x*.25,shoulderAxis.y*.75+hipAxis.y*.25),axisLength=Math.hypot(axis.x,axis.y)||1,lateral=P(1,clamp(axis.y/axisLength,-.12,.12));
  const a=side.x*scaleX*lateral.x+along.x*tx,b=side.x*scaleX*lateral.y+along.x*ty,c=side.y*scaleX*lateral.x+along.y*tx,d=side.y*scaleX*lateral.y+along.y*ty,e=target.x-a*top.x-c*top.y,f=target.y-b*top.x-d*top.y;
  return {polygon,a,b,c,d,e,f};
}
function drawNFTTorso(g,original,pose,art){
  const look=getCharacterCostume(art.helmet),t=sourceTorsoGeometry(original,pose,art.helmet),s=pose.shoulder,h=pose.hip,yaw=pose.torsoYaw||0,shoulder=look.chest/2*(1-.22*yaw),waist=look.waist/2*(1-.12*yaw);
  g.save();g.beginPath();g.moveTo(s.x-shoulder,s.y-18);g.lineTo(s.x+shoulder,s.y-18);g.lineTo(s.x+shoulder,s.y+5);g.bezierCurveTo(s.x+shoulder,s.y+12,h.x+waist+2,h.y-7,h.x+waist,h.y+2.5);g.quadraticCurveTo(h.x,h.y+4,h.x-waist,h.y+2.5);g.bezierCurveTo(h.x-waist-2,h.y-7,s.x-shoulder,s.y+12,s.x-shoulder,s.y+5);g.closePath();g.clip();
  g.transform(t.a,t.b,t.c,t.d,t.e,t.f);clipPolygon(g,t.polygon);g.imageSmoothingEnabled=true;const texture=getNFTSpriteTexture(art.helmet,original),size=imageDimensions(original.image);g.drawImage(texture,0,0,size.width,size.height);g.restore();
  // A narrow shadow plane and an overlapping waist seam seat the NFT costume
  // on a turning torso, instead of leaving a bright rectangular chest bib.
  g.save();g.globalAlpha=.14+.23*yaw;shape(g,b=>{b.moveTo(s.x-shoulder*.94,s.y+4);b.quadraticCurveTo(s.x-shoulder*.65,s.y+17,h.x-waist,h.y+1);b.lineTo(h.x-waist*.55,h.y+2);b.quadraticCurveTo(s.x-shoulder*.38,s.y+16,s.x-shoulder*.48,s.y+4);},art.palette.skinShadow);g.restore();
  // The front shoulder/chest overlap is a short crease, not a full outline
  // around a photographic bib. It remains outside the original center badge.
  const near=pose.shoulderNear,frontElbow=pose.elbowNear,down=clamp((frontElbow.y-near.y)/22,0,1);
  g.save();g.globalAlpha=.18+.15*down;curve(g,[near.x-1,near.y+5,near.x-2.5,near.y+10,near.x-1.5,near.y+14,near.x-.5,near.y+17],art.palette.skinShadow,2.2);g.restore();
  g.save();g.globalAlpha=.45;curve(g,[s.x-shoulder*.91,s.y+6,s.x-shoulder*.85,s.y+15,h.x-waist,h.y-9,h.x-waist,h.y],art.palette.skinShadow,.8);g.restore();
  shape(g,b=>{b.moveTo(h.x-waist,h.y-1.5);b.quadraticCurveTo(h.x,h.y+.5,h.x+waist,h.y-1.5);b.lineTo(h.x+waist,h.y+3.5);b.quadraticCurveTo(h.x,h.y+5,h.x-waist,h.y+3.5);},gradient(g,h.x,h.y-2,h.x,h.y+4,[art.palette.base+'00',art.palette.base+'b0',art.palette.base]));
  curve(g,[h.x-waist,h.y+2.5,h.x-waist*.8,h.y+3.2,h.x-waist*.55,h.y+3.4,h.x-waist*.4,h.y+3.3],art.palette.shadow,.65);
}

function drawPremiumHelmet(g,c,a,p){
  const q=a.palette,id=c.id,heavy=a.build==='heavy',organic=['bloodbath','poison','alien'].includes(id),cloth=['sheikh','ice','fire'].includes(id),side=heavy?14:12.6;
  let shell=q.base,light=q.highlight,shade=q.shadow;
  if(id==='chaos'){shell='#d7e1cd';light='#f4f2dd';shade='#879c8c';}
  if(id==='hockey-mask'){shell='#b7c8a7';light='#e0e8ca';shade='#667d6e';}
  if(id==='alien'){shell='#8c9e7c';light='#c3cfa9';shade='#4d685a';}
  if(id==='cowboy'){shell='#9c9680';light='#ded2b4';shade='#595c4c';}
  g.save();g.translate(p.shoulder.x+1,p.shoulder.y-4);g.scale(.74,.74);g.rotate(p.state==='run'?Math.sin(p.p*Math.PI*2)*.035:p.state==='dunk'?(p.shoulder.x-p.hip.x)*.004:0);
  // Depth at the temple and the offset face plane establish a three-quarter head.
  ellipse(g,-10,-14,5.4,10,gradient(g,-15,-14,-6,-14,[shade,shell]),INK);
  if(['hunter','blue'].includes(id)){
    const hair=id==='hunter'?'#253730':q.shadow;
    for(let j=0;j<5;j++){const x=-12-j*1.6,phase=Math.sin(p.p*Math.PI*2+j)*1.2;curve(g,[x,-21,x-7,-15,x-5+phase,-1,x-2+phase,5+j*.7],hair,2.4);curve(g,[x-1,-21,x-5,-13,x-4+phase,-2,x-2+phase,4+j*.7],id==='hunter'?q.metal:q.highlight,.6);}
  }
  if(['bloodbath','poison'].includes(id)){
    for(const side of [-1,1])for(let j=0;j<3;j++){const x=side*(12+j*.8),y=-23+j*7,flex=Math.sin(p.p*Math.PI*2+j+side)*2;curve(g,[x,y,x+side*(7+j),y-9+flex,x+side*(11-j),y+9+flex,x+side*(4-j),y+4+j],q.shadow,2.4-j*.3);curve(g,[x,y,x+side*(6+j),y-8+flex,x+side*(10-j),y+8+flex,x+side*(4-j),y+4+j],q.highlight,.65);}
  }
  const shellGrad=gradient(g,-12,-29,14,-5,[light,shell,shell,shade]);
  if(id==='optimus')shape(g,b=>{b.moveTo(-12,-21);b.bezierCurveTo(-12,-32,5,-34,11,-27);b.bezierCurveTo(17,-20,14,-8,8,-2);b.quadraticCurveTo(1,2,-6,-3);b.quadraticCurveTo(-13,-9,-12,-21);},shellGrad,shade);
  else if(id==='alien')shape(g,b=>{b.moveTo(-12,-23);b.bezierCurveTo(-11,-36,8,-38,13,-26);b.bezierCurveTo(17,-15,8,-2,2,1);b.bezierCurveTo(-4,-1,-14,-12,-12,-23);},shellGrad,shade);
  else if(id==='bloodbath')shape(g,b=>{b.moveTo(-13,-23);b.bezierCurveTo(-11,-33,-2,-32,3,-29);b.bezierCurveTo(11,-34,17,-24,13,-17);b.lineTo(12,-5);b.quadraticCurveTo(3,3,-5,-2);b.bezierCurveTo(-14,-8,-17,-16,-13,-23);},shellGrad,shade);
  else if(id==='chief'||id==='quarterback'||id==='hunter')shape(g,b=>{b.moveTo(-13,-23);b.lineTo(-7,-30);b.lineTo(6,-31);b.lineTo(13,-26);b.lineTo(16,-16);b.lineTo(12,-4);b.lineTo(5,1);b.lineTo(-7,-2);b.lineTo(-14,-12);},shellGrad,shade);
  else shape(g,b=>{b.moveTo(-12,-22);b.quadraticCurveTo(-12,-31,0,-31);b.quadraticCurveTo(11,-32,14,-23);b.lineTo(13,-10);b.quadraticCurveTo(10,1,1,1);b.quadraticCurveTo(-11,0,-12,-11);},shellGrad,shade);
  // Curved brow and cheek facets replace a flat rectangular screen.
  if(!['bloodbath','alien','hockey-mask'].includes(id)){
    shape(g,b=>{b.moveTo(-8,-23);b.quadraticCurveTo(0,-26,11,-23);b.lineTo(11,-13);b.quadraticCurveTo(8,-5,2,-4);b.quadraticCurveTo(-6,-5,-8,-12);},gradient(g,-7,-24,9,-4,['#354b50','#0a1a23','#050e17']),shade);
    shape(g,b=>{b.moveTo(-8,-23);b.quadraticCurveTo(0,-26,11,-23);b.lineTo(9,-21);b.quadraticCurveTo(0,-23,-7,-20);},q.visor+'50');
    helmetMark(g,2,-15,q.visor,id==='hunter'?.88:1);
    curve(g,[-7,-20,-4,-22,0,-22,3,-23],'#d9ffff45',.55);
    shape(g,b=>{b.moveTo(-13,-21);b.lineTo(-9,-23);b.lineTo(-9,-10);b.lineTo(-5,-3);b.lineTo(-9,-2);b.lineTo(-14,-12);},gradient(g,-14,-12,-7,-12,[light,shell,shade]),shade);
    shape(g,b=>{b.moveTo(12,-21);b.lineTo(15,-17);b.lineTo(12,-4);b.lineTo(7,0);b.lineTo(8,-5);b.lineTo(11,-11);},shade);
    curve(g,[-11,-25,-6,-30,3,-30,9,-27],light,1.1);
  }
  const line=(pts,color,width=1)=>curve(g,pts,color,width),poly=(ps,col,edge)=>polyOutline(g,ps.map(v=>P(...v)),col,edge||shade);
  const rivet=(x,y,col=q.metal)=>{ellipse(g,x,y,1.05,1.05,shade);ellipse(g,x-.25,y-.3,.55,.55,col);};
  switch(id){
    case 'chief':
      poly([[-12,-22],[-7,-28],[-2,-29],[-2,-25],[-8,-21]],q.base);poly([[4,-29],[10,-27],[13,-22],[9,-23],[5,-25]],light);
      poly([[-8,-3],[-5,-7],[3,-6],[7,-2],[4,1],[-4,0]],q.base);line([-5,-4,-2,-3,2,-3,4,-3],light,.8);
      poly([[-15,-18],[-11,-18],[-11,-9],[-14,-9]],q.shadow);rivet(-12,-15);rivet(12,-10);break;
    case 'optimus':
      line([-10,-23,-13,-15,-8,-3,-2,-1],q.visor,1);line([11,-24,15,-13,10,-4,7,-2],q.visor,.9);
      line([-8,-28,-1,-31,7,-30,10,-27],'#ffffff',1.3);ellipse(g,-10,-13,1.3,3.2,'#f3fffe');
      line([-5,-1,-1,1,5,1,8,-2],q.highlight,1);break;
    case 'quarterback':
      poly([[-8,-30],[-4,-31],[-1,-25],[-4,-24]],'#e7eeee');poly([[5,-30],[7,-30],[9,-25],[7,-25]],q.accent);
      line([-11,-11,-5,-7,6,-7,12,-11],q.metal,1.8);line([-10,-7,-5,-3,6,-3,11,-7],q.metal,1.7);
      for(const x of [-7,0,7])line([x,-11,x+1,-7,x+1,-3,x+1,0],q.metal,1.2);rivet(-12,-12,q.accent);ellipse(g,-13,-18,1.8,2.8,q.shadow);break;
    case 'bloodbath':
      for(let j=0;j<4;j++){line([-12+j*3,-28,-8+j*2,-20,-4+j*2,-20,-4+j*1.5,-9],j%2?q.highlight:q.shadow,1.5);line([12-j*2,-26,9-j,-19,7-j,-16,8-j,-8],q.shadow,1.2);}
      poly([[-11,-21],[-2,-16],[-4,-12],[-10,-14]],'#e6ffff',q.shadow);poly([[4,-17],[13,-22],[11,-13],[6,-12]],'#e6ffff',q.shadow);
      shape(g,b=>{b.moveTo(-8,-7);b.quadraticCurveTo(2,-12,11,-8);b.lineTo(7,-1);b.quadraticCurveTo(-1,2,-8,-4);},'#210b18',q.shadow);
      for(let j=0;j<7;j++){poly([[-7+j*2.5,-6.8],[ -5.3+j*2.5,-6.7],[-6+j*2.5,-3.8]],'#f1c5ae');}
      for(let j=0;j<5;j++)poly([[-4+j*2.5,-1],[ -2.5+j*2.5,-1],[-3+j*2.5,-3.8]],'#df9b88');break;
    case 'arachnia':
      for(const side of [-1,1]){line([side*2,-29,side*7,-27,side*9,-25,side*11,-21],q.accent,.7);line([side*11,-21,side*14,-16,side*11,-7,side*7,-2],q.accent,.7);for(let j=0;j<3;j++)pixelLine(g,P(side*(9+j%2),-24+j*7),P(side*13,-20+j*7),q.accent,.75);}
      poly([[0,-29],[3,-26],[0,-23],[-2,-26]],q.visor);break;
    case 'elemental':
      for(const side of [-1,1]){line([side*8,-29,side*4,-25,side*9,-20,side*6,-15],q.metal,1);line([side*6,-15,side*10,-11,side*8,-5,side*11,-3],q.metal,.8);}
      line([-10,-25,-13,-17,-10,-7,-7,-4],q.highlight,1.4);break;
    case 'chaos':
      for(const side of [-1,1]){line([side*12,-28,side*17,-24,side*17,-10,side*14,-1],'#43a450',3.1);line([side*12,-28,side*16,-24,side*16,-13,side*15,-8],'#a0dd7e',.7);}
      line([-7,-7,-2,1,7,1,11,-9],'#ab3948',2.1);line([-8,-25,-5,-28,-2,-26,-1,-24],'#65465c',1.1);line([5,-25,8,-28,11,-26,12,-24],'#65465c',1.1);break;
    case 'poison':
      line([-9,-28,-2,-31,5,-30,10,-26],q.highlight,1.2);line([-10,-10,-9,-4,-5,-2,-3,1],q.accent,1.2);line([12,-9,11,-3,7,-2,5,1],q.accent,1.1);break;
    case 'sheikh':
      shape(g,b=>{b.moveTo(-14,-24);b.quadraticCurveTo(-9,-35,6,-33);b.lineTo(17,-25);b.lineTo(16,5);b.lineTo(11,3);b.lineTo(10,-23);b.quadraticCurveTo(-1,-29,-10,-22);b.lineTo(-12,6);b.lineTo(-18,7);},gradient(g,-17,-18,16,-18,[q.highlight,q.base,q.shadow]),q.shadow);
      line([-14,-26,-6,-30,8,-30,15,-25],'#343837',2.4);line([-15,-22,-14,-12,-16,-2,-14,4],q.highlight,.75);line([13,-20,14,-12,13,-3,14,2],q.metal,.75);break;
    case 'hockey-mask':
      shape(g,b=>{b.moveTo(-10,-24);b.quadraticCurveTo(0,-32,11,-25);b.lineTo(12,-12);b.quadraticCurveTo(10,-2,3,0);b.quadraticCurveTo(-10,-1,-11,-13);},shellGrad,shade);
      for(const side of [-1,1]){ellipse(g,side*6+1,-18,3.8,2.5,'#182a32');poly([[side*10,-12],[side*7,-10],[side*7,-8]],q.accent);}
      for(const [x,y] of [[-4,-26],[2,-27],[8,-25],[-9,-22],[-9,-10],[-5,-5],[1,-4],[6,-5],[9,-9],[1,-11],[1,-15]])ellipse(g,x,y,.85,1.1,'#415649');break;
    case 'gladiator':
      shape(g,b=>{b.moveTo(-4,-29);b.lineTo(-5,-40);b.quadraticCurveTo(3,-43,6,-35);b.lineTo(5,-29);},gradient(g,-5,-37,6,-37,['#4c3d30','#b28b5d','#332f28']),q.shadow);
      line([-4,-39,0,-40,3,-37,4,-32],q.metal,1);poly([[-12,-19],[-8,-18],[-8,-5],[-3,0],[-10,-2]],q.metal);poly([[11,-19],[14,-17],[12,-4],[7,0],[8,-6]],q.base);break;
    case 'medusa':
      for(let j=0;j<5;j++){const x=-12+j*6,y=-28-(j%2)*4,wave=Math.sin(p.p*Math.PI*2+j)*1.5;line([x,-21,x-5,-29,x+7,-32,x+wave,-37],q.highlight,2.9);line([x,-21,x-4,-29,x+6,-31,x+wave,-37],q.base,.75);ellipse(g,x+wave,-37,2.4,1.8,q.highlight,q.shadow);ellipse(g,x+wave+.9,-37.1,.4,.5,'#f6e28d');}
      line([-9,-2,-3,1,5,1,11,-3],q.metal,1.1);break;
    case 'gold-mage': case 'manga':
      for(const side of [-1,1]){shape(g,b=>{b.moveTo(side*8,-27);b.quadraticCurveTo(side*18,-31,side*17,-40);b.lineTo(side*12,-34);b.lineTo(side*4,-30);},gradient(g,side*5,-35,side*17,-30,[q.highlight,q.metal,q.shadow]),q.shadow);poly([[side*9,-17],[side*15,-19],[side*14,-8],[side*9,-1],[side*6,-4]],q.metal);ellipse(g,side*12,-10,1.4,2,q.accent);}
      poly([[-3,-29],[2,-33],[6,-28],[2,-24]],q.highlight);ellipse(g,2,-28,1.1,1.4,q.accent);break;
    case 'ice': case 'fire':
      shape(g,b=>{b.moveTo(-16,3);b.lineTo(-17,-20);b.quadraticCurveTo(-13,-35,0,-35);b.quadraticCurveTo(12,-34,17,-21);b.lineTo(17,4);b.lineTo(11,2);b.lineTo(11,-22);b.quadraticCurveTo(0,-29,-10,-22);b.lineTo(-10,3);},gradient(g,-16,-20,17,-20,[q.highlight,q.base,q.shadow]),q.shadow);
      poly([[-9,-8],[-5,-11],[8,-10],[12,-6],[8,0],[-4,1]],q.metal);for(let j=0;j<6;j++)line([-5+j*2.6,-8,-5+j*2.6,-6,-4+j*2.6,-3,-4+j*2.6,-1],q.shadow,.95);line([-13,-23,-11,-28,-5,-31,-1,-32],q.highlight,.8);break;
    case 'steampunk':
      for(const x of [-6,6]){ellipse(g,x,-28,5.2,4.2,q.shadow);ellipse(g,x,-28,4.2,3.2,q.metal);ellipse(g,x+.4,-28,3,2.3,'#334642');line([x-1,-29,x,-30,x+2,-29,x+2,-28],q.highlight,.7);}pixelLine(g,P(-1,-28),P(1,-28),q.metal,2);line([-13,-22,-19,-18,-19,-7,-16,-3],q.metal,2.1);for(let j=0;j<3;j++)rivet(-17,-13+j*3);break;
    case 'assimilator':
      poly([[-14,-21],[-5,-23],[-3,-14],[-11,-11],[-16,-15]],q.shadow);ellipse(g,-9,-17,4.6,3.8,'#738fd3',q.metal);ellipse(g,-8,-17,2.8,2.6,'#c0e2ff');ellipse(g,-7.4,-17,.9,1.8,'#fff6ff');line([-14,-12,-18,-9,-17,-3,-12,1],q.metal,2);rivet(10,-26);break;
    case 'hunter':
      poly([[-7,-7],[-10,-12],[-12,-8],[-8,2],[-3,0]],q.highlight);poly([[7,-7],[13,-12],[15,-8],[10,2],[5,0]],q.base);line([-10,-26,-5,-23,-3,-20,-1,-21],q.highlight,1.4);line([11,-26,7,-23,5,-20,3,-21],q.highlight,1.3);poly([[-2,-6],[3,-7],[6,-1],[1,2],[-3,-1]],q.shadow);break;
    case 'cowboy':
      shape(g,b=>{b.moveTo(-13,-28);b.lineTo(-11,-40);b.quadraticCurveTo(-1,-43,10,-39);b.lineTo(13,-28);},gradient(g,-12,-37,12,-30,['#d7c8ac','#b5a58d','#776f5c']),shade);
      shape(g,b=>{b.moveTo(-24,-31);b.quadraticCurveTo(-19,-24,-11,-26);b.quadraticCurveTo(0,-28,13,-26);b.quadraticCurveTo(21,-26,24,-32);b.quadraticCurveTo(24,-23,12,-23);b.lineTo(-12,-23);b.quadraticCurveTo(-24,-24,-24,-31);},gradient(g,-20,-29,20,-24,['#d7c9aa','#b2a48a','#6a6757']),shade);
      line([-11,-30,-5,-28,7,-29,12,-30],'#5a5b4c',2);break;
    case 'blue':
      for(const side of [-1,1]){poly([[side*12,-22],[side*20,-28],[side*17,-18],[side*13,-13]],'#8b77ba');pixelLine(g,P(side*14,-20),P(side*19,-26),'#c2a4d9',.7);}
      line([-3,-29,-9,-35,-5,-44,3,-42],'#284f67',6);line([-3,-30,-7,-35,-4,-43,3,-42],'#79bdc2',1);line([1,-30,-4,-34,-2,-40,3,-41],q.base,2);break;
    case 'alien':
      for(const side of [-1,1])shape(g,b=>{b.moveTo(side*2,-18);b.quadraticCurveTo(side*7,-25,side*11,-23);b.quadraticCurveTo(side*13,-14,side*5,-12);b.quadraticCurveTo(side*2,-13,side*2,-18);},gradient(g,side*2,-20,side*11,-14,['#0a1f24','#071116','#1b3838']),q.shadow);
      ellipse(g,-5,-19,1.1,2,'#75a89c');ellipse(g,7,-19,.8,1.5,'#89b1a1');line([0,-10,0,-8,2,-8,2,-10],q.shadow,.8);line([-2,-4,0,-3,3,-3,5,-4],q.shadow,.7);helmetMark(g,1,-28,q.visor,.55);break;
    case 'digital-punk':
      for(const [x,y,col] of [[-10,-26,'#66e6ab'],[9,-25,'#e589dd'],[-12,-14,'#56cbb8'],[10,-7,'#dfb666']]){poly([[x-1,y-2],[x+2,y-2],[x+2,y+2],[x-1,y+2]],col);pixelLine(g,P(x-1,y),P(x+2,y),'#e5ffef',.6);}pixelLine(g,P(-7,-14),P(10,-14),'#e75adb65',.5);break;
    case 'mask':
      for(const side of [-1,1]){poly([[side*12,-26],[side*16,-22],[side*15,-3],[side*12,-1]],q.metal);rivet(side*14,-18);}
      poly([[-9,-8],[11,-8],[10,0],[-7,1]],q.shadow);for(let j=0;j<7;j++)pixelLine(g,P(-7+j*2.5,-7),P(-6+j*2.3,-.5),'#9fc7cb',1.2);break;
    case 'neural':
      for(const side of [-1,1]){line([side*10,-28,side*15,-22,side*11,-16,side*15,-10],q.accent,.85);line([side*12,-27,side*16,-20,side*13,-14,side*15,-5],q.visor,.65);ellipse(g,side*14,-17,1.5,2.5,q.highlight);}
      line([-9,-1,-4,3,4,3,10,-1],'#5beaff',1);break;
  }
  g.restore();
}
