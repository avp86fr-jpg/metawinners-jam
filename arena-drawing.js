// Shared perspective geometry. Every venue uses the same playable court.
export const W=1200,H=680;
export const point=(x,y)=>({x:600+(x-500)*(.78+y/2000),y:190+y*.68});
export const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
export function poly(g,ps,fill,stroke,width=1){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));g.closePath();if(fill){g.fillStyle=fill;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
export function line(g,ps,color,width=2,close=false){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y));if(close)g.closePath();g.strokeStyle=color;g.lineWidth=width;g.stroke();}
export function groundBox(g,x,y,w,h,fill,stroke,width=2){poly(g,[point(x,y),point(x+w,y),point(x+w,y+h),point(x,y+h)],fill,stroke,width);}
export function groundCircle(g,x,y,r,start=0,end=Math.PI*2,color='#eee9d4',width=2,fill){const ps=[];for(let i=0;i<=70;i++){const a=start+(end-start)*i/70;ps.push(point(x+Math.cos(a)*r,y+Math.sin(a)*r));}if(fill)poly(g,ps,fill);line(g,ps,color,width);}
export function text(g,s,x,y,size=16,color='#eee9d4',align='center',weight=800){g.font=`${weight} ${size}px "Arial Black", Arial, "DejaVu Sans", sans-serif`;g.textAlign=align;g.fillStyle=color;g.fillText(s,x,y);}
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function tint(hex,amount){
  const rgb=hex.replace('#','').slice(0,6).match(/../g)?.map(v=>parseInt(v,16))||[120,100,70];
  return '#'+rgb.map(v=>Math.max(0,Math.min(255,Math.round(v+amount))).toString(16).padStart(2,'0')).join('');
}
export function drawCourt(g,palette={}){
  const p={surround:'#142326',apron:'#bc6045',left:'#385950',right:'#34514c',key:'#bb674e',line:'#d9d2b4',center:'#27473f',logo:'#c7c7a6',detail:'#ffffff08',material:'paint',label:'BUILT DIFFERENT. PLAY DIFFERENT.',labelColor:'#e4d4b5',...palette};
  groundBox(g,-40,20,1080,570,p.surround);groundBox(g,40,45,920,510,p.apron);groundBox(g,62,64,876,472,p.left);
  groundBox(g,500,64,438,472,p.right);
  // Staggered parquet boards and broken grain mimic the clustered texture of a
  // 16-bit court. Everything is cached with the arena, never rebuilt per frame.
  if(p.material==='wood'){
    const wood=p.woodTone==='maple'?'#ba8149':p.woodTone==='warm'?'#a56b3c':p.left;
    for(let row=0,y=64;y<536;y+=11,row++){
      const offset=(row%3)*41;
      for(let col=-1,x=62-offset;x<938;x+=126,col++){
        const x0=Math.max(62,x),x1=Math.min(938,x+125),y1=Math.min(536,y+10);
        groundBox(g,x0,y,x1-x0,y1-y,tint(wood,(hash(row*79+col+41)-.5)*37));
        line(g,[point(x0+1,y+1),point(x1,y+1)],'#f5d19355',1.2);
        line(g,[point(x1,y+1),point(x1,y1)],'#51372655',1);
        for(let k=0;k<3;k++){
          const gx=x0+hash(row*419+col*37+k)*Math.max(1,x1-x0-18),gy=y+3+k*2;
          line(g,[point(gx,gy),point(Math.min(x1,gx+14+hash(k+col*31)*36),gy)],k%2?'#e8bd7844':'#65422235',1);
        }
      }
    }
  }else{
    for(let y=70;y<535;y+=8)line(g,[point(65,y),point(935,y)],p.detail,1);
    for(let i=0;i<1400;i++){const q=point(65+hash(i)*870,70+hash(i+201)*460);rect(g,Math.round(q.x/2)*2,Math.round(q.y/2)*2,2,1,i%3?'#effbff0a':'#06112212');}
  }
  // Court edge has depth and a contrasting apron, like a televised show court.
  line(g,[point(40,45),point(960,45)],'#f2ebdb77',3);
  line(g,[point(40,555),point(960,555)],'#080c2566',5);
  groundBox(g,62,64,876,472,null,p.line,2.5);
  groundBox(g,62,205,192,190,p.key,p.line,2.5);groundBox(g,746,205,192,190,p.key,p.line,2.5);
  groundCircle(g,254,300,95,-Math.PI/2,Math.PI/2,p.line,2.3);groundCircle(g,746,300,95,Math.PI/2,Math.PI*1.5,p.line,2.3);
  const angle=Math.asin(236/285);groundCircle(g,95,300,285,-angle,angle,p.line,2.3);groundCircle(g,905,300,285,Math.PI-angle,Math.PI+angle,p.line,2.3);
  line(g,[point(500,64),point(500,536)],p.line,2.3);groundCircle(g,500,300,95,0,Math.PI*2,p.line,2.3,p.center);
  const cp=point(500,300);g.save();g.translate(cp.x,cp.y);g.transform(1,0,-.10,.69,0,0);
  poly(g,[{x:-90,y:-22},{x:-60,y:-48},{x:0,y:-60},{x:60,y:-48},{x:90,y:-22},{x:64,y:40},{x:0,y:63},{x:-64,y:40}],p.center,p.logo,3);
  for(const side of [-1,1])for(let i=0;i<3;i++)line(g,[{x:side*(75+i*5),y:-14+i*13},{x:side*(110+i*5),y:-20+i*13}],p.logo,4);
  text(g,'MW',1,21,62,'#080d2799');text(g,'MW',0,17,62,p.logo);text(g,'WORLD TOUR',0,41,13,p.logo);g.restore();
  // Broken specular marks stay low contrast so the ball never disappears.
  for(let i=0;i<10;i++){const x=120+hash(i+451)*760,y=100+hash(i+31)*390;line(g,[point(x,y),point(x+16,y)],'#fff4c21c',2);}
  for(const x of [66,930])for(const y of [205,250,350,395])line(g,[point(x-7,y),point(x+7,y)],p.line,2);
  const tag=point(500,573);g.save();g.translate(tag.x,tag.y);g.scale(1,.8);text(g,p.label,0,0,14,p.labelColor);g.restore();
  line(g,[point(-40,590),point(1040,590)],'#050b1240',7);
}
export const ARENA_HELPERS={W,H,point,rect,poly,line,groundBox,groundCircle,text,drawCourt};
