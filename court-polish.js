import { point, groundBox, groundCircle, line, poly } from './arena-drawing.js';

// This pass is part of the renderer's immutable arena background cache. All
// measurements are visual world coordinates; engine collision and scoring stay
// unchanged, including the radial 285-unit three-point boundary.
const COLORS={
  casino:{wood:'#654939',veil:'#4e424334',board:[164,117,77],grain:'#30211b',key:'#402335e8',apron:'#311d2ad9',ink:'#f1dfb8',accent:'#c9a15e',brand:'#ead4a5',label:'CASINO ROYALE',woodAlpha:.075,gloss:.08},
  stadium:{wood:'#d0b084',veil:'#e0ceb32b',board:[190,151,104],grain:'#704d2f',key:'#183657e8',apron:'#102b4edb',ink:'#f7f1dc',accent:'#7bacc8',brand:'#f1e8ce',label:'WINNERS STADIUM',woodAlpha:.04,gloss:.075},
  miami:{wood:'#b88454',veil:'#d5b38f13',board:[189,142,97],grain:'#6d462d',key:'#176668e8',apron:'#17545adb',ink:'#fff1d8',accent:'#ed9f83',brand:'#ffdfb5',label:'MIAMI BEACH',woodAlpha:.055,gloss:.065},
  bugatti:{wood:'#344b59',veil:'#40505d57',board:[109,128,136],grain:'#0e2331',key:'#102c42ee',apron:'#122c3ddd',ink:'#d9e9ec',accent:'#79b9cf',brand:'#c1dee6',label:'BUGATTI SHOWROOM',woodAlpha:.13,gloss:.085},
};
const hash=n=>{const k=Math.sin(n*127.1+311.7)*43758.5453;return k-Math.floor(k);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const rgba=(rgb,alpha,variation=0)=>`rgba(${rgb.map(v=>Math.round(clamp(v+variation,0,255))).join(',')},${alpha})`;
function courtPath(g,x=62,y=64,w=876,h=472){
  const ps=[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)];
  g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();
}
function worldPoly(g,points,fill,stroke,width=1){poly(g,points.map(([x,y])=>point(x,y)),fill,stroke,width);}
function worldText(g,value,x,y,size,color,{weight=800,align='center'}={}){
  const p=point(x,y);g.save();g.translate(p.x,p.y);g.scale(.78+y/2000,.68);
  g.font=`${weight} ${size}px "Barlow Condensed", "Arial Narrow", "DejaVu Sans", sans-serif`;g.textAlign=align;g.fillStyle=color;g.fillText(value,0,0);g.restore();
}

function apron(g,p){
  // A measured paint surround gives the floor a clean, televised-court edge.
  // Each band stays outside the unchanged playable rectangle.
  groundBox(g,44,47,912,17,p.apron);
  groundBox(g,44,536,912,17,p.apron);
  groundBox(g,44,64,18,472,p.apron);
  groundBox(g,938,64,18,472,p.apron);
  groundBox(g,44,47,912,506,null,'#081521a0',1.8);
  line(g,[point(45,48),point(955,48)],p.accent+'89',1.1);
  line(g,[point(45,552),point(955,552)],p.accent+'72',1.1);
  // Slight front-edge depth, without a neon outline around the whole floor.
  line(g,[point(44,554),point(956,554)],'#07121a55',2.1);
}
function woodFinish(g,id,p){
  g.save();courtPath(g);g.clip();
  groundBox(g,62,64,876,472,p.veil);
  const rows=45,step=472/rows;
  for(let row=0;row<rows;row++){
    const y=64+row*step,offset=(row%4)*47;
    for(let col=-1,x=62-offset; x<938; x+=164,col++){
      const left=Math.max(62,x),right=Math.min(938,x+164),key=row*71+col*13;
      if(right<=left)continue;
      const v=(hash(key+201)-.5)*24;
      groundBox(g,left,y,right-left,step,rgba(p.board,p.woodAlpha+hash(key)*p.woodAlpha*.5,v));
      // Irregular fine grain and staggered joints avoid a mechanical tile grid.
      line(g,[point(left,y),point(right,y)],id==='bugatti'?'#061b2a2b':'#382a1918',.55);
      line(g,[point(right,y+.6),point(right,y+step-.6)],id==='bugatti'?'#081a2737':'#36231923',.55);
      for(let grain=0;grain<2;grain++){
        const gx=left+hash(key+grain*33+9)*Math.max(1,right-left-22),gy=y+2.1+grain*3.8;
        const end=Math.min(right-1,gx+19+hash(key+grain*7)*60);
        line(g,[point(gx,gy),point((gx+end)/2,gy+.28),point(end,gy-.12)],p.grain+(id==='bugatti'?'21':'13'),.5);
      }
    }
  }
  // Broad lacquer reflection, broken by wood grain instead of narrow hot bands.
  const coat=g.createLinearGradient(0,234,0,557);
  coat.addColorStop(0,'rgba(243,238,214,.025)');coat.addColorStop(.34,`rgba(241,232,208,${p.gloss})`);
  coat.addColorStop(.61,'rgba(238,232,212,.015)');coat.addColorStop(1,'rgba(9,21,31,.055)');
  g.fillStyle=coat;g.fillRect(120,230,960,330);
  if(id==='bugatti'){
    // Smoked ash grain and the showroom's overhead rings, reflected softly.
    for(const [x,y,r] of [[267,184,74],[500,135,105],[744,184,74]]){
      for(let offset=0;offset<3;offset++)groundCircle(g,x,y,r+offset*2,0,Math.PI*2,`rgba(177,215,226,${.018-offset*.004})`,3-offset*.6);
    }
    for(let i=0;i<8;i++){
      const x=135+i*108,a=point(x,83),b=point(x-11,197),reflection=g.createLinearGradient(a.x,a.y,b.x,b.y);
      reflection.addColorStop(0,'#bcdde500');reflection.addColorStop(.42,'#c9e7eb0b');reflection.addColorStop(1,'#bcdde500');
      g.lineCap='round';line(g,[a,b],reflection,7);
    }
  }
  g.restore();
}
function paintKeys(g,p){
  // Satin paint remains translucent enough for the original timber and light.
  groundBox(g,62,224,180,152,p.key);
  groundBox(g,758,224,180,152,p.key);
  for(const x of [62,758]){
    const a=point(x,224),b=point(x+180,376),paint=g.createLinearGradient(a.x,a.y,b.x,b.y);
    paint.addColorStop(0,'#edf5e216');paint.addColorStop(.45,'#eff6e405');paint.addColorStop(1,'#050e2326');
    groundBox(g,x+2,226,176,148,paint);
  }
  // Narrow inside accents give each venue a considered color system.
  for(const [x0,x1] of [[65,239],[761,935]])for(const y of [228,372])line(g,[point(x0,y),point(x1,y)],p.accent+'62',.8);
}
function linework(g,p){
  const marks=(ink,width)=>{
    groundBox(g,62,224,180,152,null,ink,width);
    groundBox(g,758,224,180,152,null,ink,width);
    groundCircle(g,242,300,57,-Math.PI/2,Math.PI/2,ink,width);
    groundCircle(g,758,300,57,Math.PI/2,Math.PI*1.5,ink,width);
    const angle=Math.asin(236/285);
    groundCircle(g,95,300,285,-angle,angle,ink,width);
    groundCircle(g,905,300,285,Math.PI-angle,Math.PI+angle,ink,width);
    // Split at the center crest so the brand is painted cleanly on the wood.
    line(g,[point(500,64),point(500,222)],ink,width);
    line(g,[point(500,378),point(500,536)],ink,width);
    groundCircle(g,500,300,78,0,Math.PI*2,ink,width);
    // Rebound positions belong on the two lane sides, not on the endlines.
    for(const x of [108,151,194,906,863,820])for(const y of [224,376])line(g,[point(x,y+(y===224?-8:0)),point(x,y+(y===224?0:8))],ink,width);
    // Four-foot-style restricted semicircles share the exact physics rim centers.
    groundCircle(g,95,300,38,-Math.PI/2,Math.PI/2,ink,width*.85);
    groundCircle(g,905,300,38,Math.PI/2,Math.PI*1.5,ink,width*.85);
  };
  g.save();g.lineCap='butt';g.lineJoin='round';
  marks('#091a2448',3.6);marks(p.ink,1.85);
  // Dashed rear halves complete the free-throw circles inside the key paint.
  for(const side of [0,1]){
    const x=side?758:242,start=side?-Math.PI/2:Math.PI/2;
    for(let dash=0;dash<11;dash++){
      const a=start+dash*Math.PI/11+.025,b=a+Math.PI/11*.52;
      groundCircle(g,x,300,57,a,b,p.ink+'aa',1.4);
    }
  }
  // Heavier boundary clarifies the playable area against all four materials.
  groundBox(g,62,64,876,472,null,'#0b182c80',4.1);
  groundBox(g,62,64,876,472,null,p.ink,2.55);
  g.restore();
}
function centerBrand(g,id,p){
  g.save();
  groundCircle(g,500,300,71,0,Math.PI*2,'#00000000',0,p.apron);
  groundCircle(g,500,300,67,0,Math.PI*2,p.accent+'b0',.9);
  // A simple original athletic monogram, laid onto the actual floor perspective.
  const crestY=292;
  worldPoly(g,[[450,crestY+12],[458,crestY-23],[472,crestY-23],[483,crestY-5],[495,crestY-23],[508,crestY-23],[499,crestY+12],[487,crestY+12],[491,crestY-4],[481,crestY+9],[474,crestY+9],[468,crestY-3],[464,crestY+12]],p.brand);
  worldPoly(g,[[500,crestY-23],[514,crestY-23],[515,crestY-3],[527,crestY-23],[538,crestY-23],[537,crestY-3],[550,crestY-23],[563,crestY-23],[539,crestY+12],[526,crestY+12],[526,crestY-4],[515,crestY+12],[503,crestY+12]],p.brand);
  // Small metallic bars frame the name; no billboard-sized center logo.
  line(g,[point(459,313),point(541,313)],p.accent,.9);
  worldText(g,'METAWINNERS',500,331,12.4,p.brand,{weight:900});
  if(id==='casino'){
    for(const side of [-1,1])for(let i=0;i<3;i++)line(g,[point(500+side*(53+i*4),282+i*8),point(500+side*(58+i*4),282+i*8)],p.accent,.8);
  }else if(id==='miami'){
    line(g,[point(471,345),point(487,342),point(500,345),point(513,342),point(529,345)],p.accent,1.5);
  }else{
    for(const x of [487,500,513])worldPoly(g,[[x,339],[x+2,343],[x+6,343],[x+3,346],[x+4,350],[x,348],[x-4,350],[x-3,346],[x-6,343],[x-2,343]],p.accent);
  }
  g.restore();
}

/** Cached-background polish; accepts an existing 1200×680 arena composite. */
export function drawCourtPolish(g,id){
  const p=COLORS[id];if(!p)return false;
  g.save();apron(g,p);woodFinish(g,id,p);paintKeys(g,p);linework(g,p);centerBrand(g,id,p);
  // A low-key floor inscription sits beyond the sideline, never across play.
  worldText(g,p.label,500,578,12.5,p.ink+'b0',{weight:800});
  g.restore();return true;
}
