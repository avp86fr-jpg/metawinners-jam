import { getNFTArt } from './nft-art.js';

// Original arcade broadcast art. Every face is sampled from its own verified NFT.
// This layer is presentation only: it never changes the game, inputs or clock.
const W=1200,H=680,INK='#080b1c',PAPER='#fff6dc',ORANGE='#ff733d',CYAN='#6ae7ff';
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=v=>1-Math.pow(1-clamp(v),3);
const hash=v=>{const n=Math.sin(v*127.1+43.7)*43758.5453;return n-Math.floor(n);};
const side=team=>team===0?ORANGE:CYAN;
const SIGNATURES=Object.freeze({
  chief:'COMMAND THE COURT',bloodbath:'PAINT IT RED',optimus:'MAXIMUM OUTPUT',quarterback:'CALL THE SHOT',
  arachnia:'CAUGHT IN THE NET',elemental:'NATURAL DISASTER',chaos:'ORDER CANCELLED',poison:'A LETHAL TOUCH',
  sheikh:'ROYAL TREATMENT','hockey-mask':'COLD BLOODED FINISH',gladiator:'RULE THE ARENA',medusa:'STONE COLD',
  'gold-mage':'SOLID GOLD RANGE',ice:'TOO COOL TO MISS',steampunk:'FULL STEAM AHEAD',assimilator:'RESISTANCE IS USELESS',
  fire:'TURN UP THE HEAT',hunter:'TARGET LOCKED',cowboy:'QUICK DRAW',blue:'DEEP BLUE DAMAGE',alien:'OUT OF THIS WORLD',
  'digital-punk':'SYSTEM OVERLOAD',manga:'FINAL FORM',mask:'THE FACE OF TROUBLE',neural:'READ YOUR NEXT MOVE',
});
function path(g,points){g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();}
function polygon(g,points,fill,stroke,width=1){path(g,points);if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.lineWidth=width;g.strokeStyle=stroke;g.stroke();}}
function type(g,value,x,y,size,color=PAPER,{align='center',stroke=0,width,slant=0,weight=900}={}){
  g.save();g.translate(x,y);g.transform(1,0,slant,1,0,0);g.font=`${weight} ${size}px "Barlow Condensed", "Arial Narrow", sans-serif`;g.textAlign=align;g.textBaseline='alphabetic';g.lineJoin='round';
  const fit=width?Math.min(1,width/Math.max(1,g.measureText(String(value)).width)):1;g.scale(fit,1);
  if(stroke){g.strokeStyle=INK;g.lineWidth=stroke;g.strokeText(String(value),0,0);}
  g.fillStyle=color;g.fillText(String(value),0,0);g.restore();
}
function small(g,value,x,y,color=PAPER,align='center',size=15){type(g,value,x,y,size,color,{align,weight:700});}
function slash(g,x,y,w,h,color){polygon(g,[[x+18,y],[x+w,y],[x+w-18,y+h],[x,y+h]],color);}

export class ArcadeShow {
  constructor({canvas,reduceMotion=false}={}){
    if(!canvas?.getContext)throw new TypeError('ArcadeShow requires a canvas.');
    this.canvas=canvas;this.g=canvas.getContext('2d');this.reduceMotion=!!reduceMotion;
    this.introDuration=1.9;this.portraits=new Map();this.clear();
  }
  get introActive(){return !!this.match&&this.introTime<this.introDuration;}
  get announcement(){return this.burst?.text||'';}
  beginMatch({team=[],opponents=[],arena={}}={}){
    this.clear();this.match={team:team.slice(0,2),opponents:opponents.slice(0,2),arena};
    this.introTime=0;this.lines=[...this.match.team,...this.match.opponents].map((character,id)=>({id,character,team:id<2?0:1,points:0,dunks:0,threes:0,fire:0}));
    return this.introDuration;
  }
  skipIntro(){const active=this.introActive;this.introTime=this.introDuration;this.draw();return active;}
  clear(){this.match=null;this.introTime=Infinity;this.clock=0;this.burst=null;this.lines=[];this.previousScores=[0,0];this.largestDeficit=[0,0];this.clutchShown=false;this.mvp=null;this.g?.clearRect(0,0,this.canvas.width,this.canvas.height);}
  clearEffects(){this.burst=null;this.g?.clearRect(0,0,this.canvas.width,this.canvas.height);}
  dispose(){this.clear();this.portraits.clear();}
  update(dt,state){
    const step=clamp(Number(dt)||0,0,.2),wasIntro=this.introActive;
    if(wasIntro)this.introTime=Math.min(this.introDuration,this.introTime+step);
    if(state?.phase==='paused'&&!wasIntro){this.burst=null;return {introDone:false};}
    this.clock+=step;
    if(this.burst){
      const burst=this.burst,scorer=state?.players?.[burst.waitForLanding];
      if(burst.waitForLanding!=null){
        burst.landingWait+=step;
        if((!scorer?.leap&&!(scorer?.jump>8))||burst.landingWait>=.28)burst.waitForLanding=null;
      }
      if(burst.waitForLanding==null)burst.age+=step;
      if(burst.age>=burst.duration)this.burst=null;
    }
    if(!wasIntro&&state?.phase==='playing'&&state.time<=15&&!this.clutchShown){
      this.clutchShown=true;
      if(Math.abs((state.scores?.[0]||0)-(state.scores?.[1]||0))<=6&&!this.burst)this.push({kind:'clutch',text:'CLUTCH TIME',sub:'15 SECONDS. MAKE IT COUNT.',color:PAPER,priority:2,duration:.78});
    }
    return {introDone:wasIntro&&!this.introActive};
  }
  push(burst){
    // A single priority slot, never a backlog: fire supersedes the basket that lit it.
    if(this.burst&&this.burst.age<.18&&this.burst.priority>burst.priority)return;
    this.burst={age:0,duration:.76,priority:1,waitForLanding:null,landingWait:0,...burst};
  }
  event(event,state){
    if(!event||!state||!this.match||this.introActive||state.phase==='paused')return;
    const team=event.team===1?1:0;
    if(event.type==='score'){
      const scorer=state.players?.[state.lastScorer],record=this.lines.find(line=>line.id===scorer?.id);
      if(record){record.points+=Number(event.points)||2;if(event.dunk)record.dunks++;if(event.points===3)record.threes++;}
      const scores=state.scores||[0,0],before=this.previousScores[team]-this.previousScores[1-team],after=scores[team]-scores[1-team];
      const comeback=this.largestDeficit[team]>=4&&before<=0&&after>0;
      const clutch=state.time<=15&&before<=0&&after>0;
      const text=clutch?'ICE IN THE VEINS':comeback?'COMEBACK KINGS':event.dunk?'RIM WRECKER!':event.points===3?'DEEP TROUBLE!':'GET BUCKETS!';
      const waitForLanding=event.dunk&&(scorer?.leap||scorer?.jump>8)?scorer.id:null;
      this.push({kind:event.dunk?'dunk':'score',text,sub:`${scorer?.character?.name||'METAWINNER'}  /  ${SIGNATURES[scorer?.character?.id]||'COUNT IT'}`,character:scorer?.character,team,points:event.points,color:side(team),priority:event.dunk||clutch||comeback?3:1,duration:.78,waitForLanding});
      this.previousScores=[...scores];
      this.largestDeficit[0]=Math.max(this.largestDeficit[0],scores[1]-scores[0]);this.largestDeficit[1]=Math.max(this.largestDeficit[1],scores[0]-scores[1]);
    }else if(event.type==='fire'){
      const player=state.players?.[event.player],record=this.lines.find(line=>line.id===event.player);if(record)record.fire++;
      const pending=this.burst?.character?.id===player?.character?.id?this.burst:null;
      const waitForLanding=player?.leap||(player?.anim==='dunk'&&player?.jump>8)?player.id:null;
      this.push({kind:'fire',text:'ABSOLUTELY WILD!',sub:`${player?.character?.name||'METAWINNER'} IS ON FIRE`,character:player?.character,team,color:'#ffb23e',priority:5,duration:.8,waitForLanding,landingWait:pending?.landingWait||0,points:pending?.points});
    }else if(event.type==='block'&&event.success===true){
      this.push({kind:'block',text:'ACCESS DENIED!',sub:'GET THAT OUTTA HERE',team,color:side(team),priority:2,duration:.68});
    }else if(event.type==='steal'){
      this.push({kind:'steal',text:'MINE NOW!',sub:'POSSESSION STOLEN',team,color:side(team),priority:1,duration:.6});
    }else if(event.type==='whistle'&&event.overtime){
      this.push({kind:'clutch',text:'OVERTIME!',sub:'NOBODY GOES HOME YET',color:PAPER,priority:4,duration:.8});
    }else if(event.type==='end')this.finish(state);
  }
  finish(state){
    this.burst=null;const winner=state?.winner??((state?.scores?.[0]||0)>=(state?.scores?.[1]||0)?0:1);
    const eligible=this.lines.filter(p=>p.team===winner),rank=p=>p.points*10+p.dunks*2+p.threes+p.fire*3;
    const best=eligible.slice().sort((a,b)=>rank(b)-rank(a)||a.id-b.id)[0]||this.lines[0];
    this.mvp=best?{...best,name:best.character?.name||'METAWINNER'}:null;return this.mvp;
  }
  portrait(character,bust=false){
    const art=character&&getNFTArt(character.id);if(!art)return null;
    const key=`${character.id}:${bust?'bust':'head'}`,old=this.portraits.get(key);if(old?.source===art)return old;
    const source=art.image,sw=source.naturalWidth||source.width,sh=source.naturalHeight||source.height;
    const points=[...art.profile.head.polygon,...(bust?art.profile.torso.polygon:[])];
    const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0])),minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
    const canvas=this.canvas.ownerDocument?.createElement('canvas')||globalThis.document?.createElement('canvas');if(!canvas)return null;
    const scale=520/((maxY-minY)*sh),pad=9;canvas.width=Math.ceil((maxX-minX)*sw*scale)+pad*2;canvas.height=538;
    const g=canvas.getContext('2d');g.save();g.translate(pad-minX*sw*scale,pad-minY*sh*scale);g.scale(scale,scale);
    g.beginPath();for(const mask of [art.profile.head,...(bust?[art.profile.torso]:[])]){mask.polygon.forEach(([x,y],i)=>i?g.lineTo(x*sw,y*sh):g.moveTo(x*sw,y*sh));g.closePath();}g.clip();g.drawImage(source,0,0,sw,sh);g.restore();
    const entry={source:art,canvas};this.portraits.set(key,entry);while(this.portraits.size>32)this.portraits.delete(this.portraits.keys().next().value);return entry;
  }
  face(g,character,x,y,w,h,{bust=false,glow=true}={}){
    const asset=this.portrait(character,bust);if(!asset){type(g,character?.number||'MW',x+w/2,y+h*.7,h*.55,character?.accent||PAPER,{stroke:4});return;}
    const image=asset.canvas,scale=Math.min(w/image.width,h/image.height),dw=image.width*scale,dh=image.height*scale;
    g.save();if(glow){g.shadowColor=character.accent||ORANGE;g.shadowBlur=12;g.shadowOffsetY=2;}g.drawImage(image,x+(w-dw)/2,y+(h-dh),dw,dh);g.restore();
  }
  draw(state){
    const g=this.g;g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,this.canvas.width,this.canvas.height);g.save();g.scale(this.canvas.width/W,this.canvas.height/H);
    if(this.introActive)this.drawIntro(g);
    else if(this.burst&&state?.phase!=='paused'&&state?.phase!=='ended')this.drawBurst(g,state);
    g.restore();
  }
  drawIntro(g){
    const t=this.introTime,reduced=this.reduceMotion,fade=clamp((this.introDuration-t)/.2);g.globalAlpha=fade;
    const gradient=g.createLinearGradient(0,0,W,H);gradient.addColorStop(0,'#16112d');gradient.addColorStop(.48,'#080b1c');gradient.addColorStop(1,'#102b39');g.fillStyle=gradient;g.fillRect(0,0,W,H);
    // Splintered comic wedges and a radial broadcast grid, all original vector art.
    polygon(g,[[0,0],[390,0],[695,H],[0,H]],'#ff733d12');polygon(g,[[W,0],[870,0],[520,H],[W,H]],'#6ae7ff13');
    for(let i=0;i<19;i++){
      const angle=i/19*Math.PI*2+(reduced?0:t*.04),r=850;polygon(g,[[600,356],[600+Math.cos(angle)*r,356+Math.sin(angle)*r],[600+Math.cos(angle+.018)*r,356+Math.sin(angle+.018)*r]],i%2?'#faf3df07':'#ffae5b09');
    }
    for(let y=7;y<H;y+=7){g.fillStyle='#00000016';g.fillRect(0,y,W,1);}
    if(!reduced)for(let i=0;i<18;i++){const x=((hash(i)*1400+t*(80+hash(i+12)*90))%1400)-100,y=hash(i+81)*H;slash(g,x,y,28+hash(i+3)*70,2,i%2?'#ffb45a55':'#76e8ff55');}
    slash(g,395,21,410,25,'#f8efda');small(g,'2 VS 2  /  NO RULES. ALL ATTITUDE.',600,39,INK,'center',16);
    type(g,'METAWINNERS',602,85,44,PAPER,{stroke:5,slant:-.09});
    type(g,'GO WILD',607,165,101,'#ff713e',{stroke:13,slant:-.13});
    type(g,'GO WILD',603,159,101,'#ffe7a7',{stroke:3,slant:-.13});
    const roster=[...this.match.team,...this.match.opponents];
    roster.forEach((character,i)=>{
      const team=i<2?0:1,x=[50,286,684,920][i],y=207,w=230,h=359,color=side(team);
      const enter=reduced?1:ease((t-i*.055)/.32),dx=reduced?0:(1-enter)*(team?140:-140);g.save();g.translate(dx,0);g.globalAlpha=fade*(reduced?1:clamp(t/.12));
      const bg=g.createLinearGradient(x,y,x+w,y+h);bg.addColorStop(0,team?'#163d51':'#4a292f');bg.addColorStop(1,'#0b1025');
      polygon(g,[[x+15,y],[x+w,y],[x+w-15,y+h],[x,y+h]],bg,color,2);
      polygon(g,[[x+20,y+1],[x+125,y+1],[x+w-20,y+h-1],[x+90,y+h-1]],color+'0f');
      type(g,character.number,x+w-18,y+69,72,color+'22',{align:'right'});
      // Source bust and face retain the individual NFT materials, silhouette and color.
      this.face(g,character,x+5,y+15,w-10,300,{bust:true});
      slash(g,x-7,y+h-53,w+12,53,INK);g.fillStyle=color;g.fillRect(x+5,y+h-53,4,45);
      type(g,character.name,x+w/2-2,y+h-17,35,PAPER,{width:w-22,slant:-.08});
      small(g,character.role,x+w/2,y+h+24,color,'center',16);g.restore();
    });
    slash(g,80,180,360,24,ORANGE);small(g,'YOUR DUO',260,198,INK,'center',17);
    slash(g,760,180,360,24,CYAN);small(g,'RIVAL DUO',940,198,INK,'center',17);
    const impact=reduced?1:1+.12*(1-ease((t-.14)/.3));g.save();g.translate(600,394);g.scale(impact,impact);
    polygon(g,[[-53,-97],[13,-61],[64,-99],[43,-20],[82,15],[37,39],[17,105],[-16,64],[-68,88],[-45,23],[-79,-11],[-43,-42]],ORANGE,INK,7);
    type(g,'VS',4,34,96,PAPER,{stroke:10,slant:-.14});g.restore();
    slash(g,338,611,524,43,this.match.arena.accent||PAPER);
    type(g,this.match.arena.name||'THE ARENA',600,642,32,INK,{width:470,slant:-.06});
    small(g,'LIGHTS UP. LET IT RIP.',600,666,'#b9c2d2','center',14);
  }
  drawBurst(g,state){
    const b=this.burst,p=clamp(b.age/b.duration),reduced=this.reduceMotion;
    // Let the scorer finish the last fraction of a dunk before its headline.
    // The same single slot holds the burst; stats and this edge score react now.
    if(b.waitForLanding!=null){
      if(b.points){const x=b.team===0?100:1100;type(g,`+${b.points}`,x,86,66,PAPER,{stroke:7,slant:-.1});small(g,b.team===0?'YOUR DUO':'RIVALS',x,109,b.color,'center',14);}
      return;
    }
    // A made dunk enters inbound before its landing finishes. Keep that airborne
    // finish visible; only grounded dead balls earn the larger broadcast card.
    const airborne=state?.players?.some(player=>player.leap||player.jump>8);
    const inbound=!!state?.inbound&&!airborne;
    const alpha=Math.min(clamp(b.age/.065),clamp((1-p)/.19));g.globalAlpha=alpha;
    const entrance=reduced?1:ease(b.age/.13),scale=reduced?1:1+.07*(1-entrance),dy=reduced?0:-14*(1-entrance);
    // Restrict even the largest celebration to the arena header while inbounding.
    // During live possession everything stays in the top 128 pixels, above the ball.
    g.save();g.beginPath();g.rect(0,0,W,inbound?184:128);g.clip();g.translate(600,dy);g.scale(scale,scale);g.translate(-600,0);
    const color=b.color||ORANGE,big=inbound&&['fire','dunk'].includes(b.kind),top=big?40:25,height=big?104:76,width=big?616:510,left=600-width/2;
    if(big){
      polygon(g,[[left-42,top-13],[left+110,top+3],[left+160,top-18],[left+260,top+5],[left+width+70,top-11],[left+width-15,top+height-12],[left+width+33,top+height+16],[left+width-155,top+height+1],[left+94,top+height+23],[left-27,top+height]],color,INK,6);
    }
    slash(g,left+5,top+6,width,height,'#080b1cf0');slash(g,left+8,top+7,9,height-13,color);
    if(!reduced&&big)for(let i=0;i<12;i++){
      const direction=i%2?-1:1,x=600+direction*(width/2+12+hash(i)*70+p*65),y=top+hash(i+80)*(height+30);slash(g,x,y,10+hash(i+3)*20,3,color);
    }
    type(g,b.text,604,top+(big?65:47),big?62:45,color,{width:width-36,stroke:4,slant:-.11});
    small(g,b.sub,600,top+height-9,PAPER,'center',big?17:14);
    if(b.character&&big)this.face(g,b.character,b.team===0?left-106:left+width-1,top-21,111,height+43,{glow:false});
    if(b.points){
      const x=b.team===0?100:1100;type(g,`+${b.points}`,x,top+65,big?78:60,PAPER,{stroke:7,slant:-.1});
      small(g,b.team===0?'YOUR DUO':'RIVALS',x,top+88,color,'center',14);
    }
    g.restore();
  }
  drawMVP(canvas,state){
    if(!canvas?.getContext)return null;const mvp=this.mvp||this.finish(state);if(!mvp)return null;
    const g=canvas.getContext('2d'),color=side(mvp.team);g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,canvas.width,canvas.height);g.save();g.scale(canvas.width/720,canvas.height/180);
    const bg=g.createLinearGradient(0,0,720,180);bg.addColorStop(0,mvp.team?'#133d4d':'#4a2525');bg.addColorStop(.65,'#0c1020');g.fillStyle=bg;g.fillRect(0,0,720,180);
    polygon(g,[[0,0],[155,0],[240,180],[0,180]],color+'15');slash(g,8,8,176,24,color);small(g,'COURT MVP',94,26,INK,'center',18);
    this.face(g,mvp.character,12,34,168,143,{bust:true});
    small(g,mvp.team===0?'YOUR DUO / MOST VALUABLE WINNER':'RIVAL DUO / MOST VALUABLE WINNER',201,38,color,'left',14);
    type(g,mvp.name,201,100,57,PAPER,{align:'left',width:330,slant:-.08});
    small(g,`${mvp.dunks} DUNKS   /   ${mvp.threes} THREES   /   ${mvp.fire} FIRE RUNS`,201,140,'#ccd2df','left',17);
    g.fillStyle=color;g.fillRect(0,177,720,3);g.fillStyle='#fff6dc20';g.fillRect(563,29,1,121);
    type(g,mvp.points,641,115,89,PAPER,{slant:-.07});small(g,'POINTS',641,144,color,'center',17);g.restore();return mvp;
  }
}
