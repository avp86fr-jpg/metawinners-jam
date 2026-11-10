// Two destination courts drawn entirely in Canvas. The detailed scenery is
// rendered once; ambient passes touch only small strips outside the play area.
const PI=Math.PI;
const rect=(g,x,y,w,h,c)=>{g.fillStyle=c;g.fillRect(x,y,w,h);};
const poly=(g,p,c,stroke,width=1)=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(c){g.fillStyle=c;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}};
const line=(g,p,c,w=1)=>{g.beginPath();p.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=c;g.lineWidth=w;g.stroke();};
const hash=n=>{const f=Math.sin(n*127.1+53.7)*43758.5453;return f-Math.floor(f);};
const ellipse=(g,x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,PI*2);g.fill();};
function glow(g,x,y,r,c){const gr=g.createRadialGradient(x,y,1,x,y,r);gr.addColorStop(0,c);gr.addColorStop(1,'#00000000');g.fillStyle=gr;g.fillRect(x-r,y-r,r*2,r*2);}
function label(g,s,x,y,size,color,weight=800){g.font=`${weight} ${size}px "Arial Black",Arial,"DejaVu Sans",sans-serif`;g.fillStyle=color;g.textAlign='center';g.fillText(s,x,y);}
function shade(hex,k){const n=parseInt(hex.slice(1),16),r=Math.min(255,Math.max(0,(n>>16)*k)),gg=Math.min(255,Math.max(0,((n>>8)&255)*k)),b=Math.min(255,Math.max(0,(n&255)*k));return `rgb(${r|0},${gg|0},${b|0})`;}
function fan(g,x,y,seed,scale,palette,raised=false){
  g.save();g.translate(Math.round(x),Math.round(y));g.scale(scale,scale);
  const skin=['#d5aa81','#aa7758','#edc4a1','#8b624e','#c18a62'][seed%5],shirt=palette[seed%palette.length],hair=['#262b36','#523c30','#a4774e','#293839'][seed%4];
  // Deliberately chunky, shaded spectator sprites: seats, legs, jerseys, faces.
  rect(g,-8,-10,16,8,'#182b35');rect(g,-6,-8,5,9,'#213141');rect(g,2,-8,5,9,'#293d49');rect(g,-7,0,7,3,'#b5b8ab');rect(g,2,0,7,3,'#d2d3ba');
  rect(g,-7,-23,14,15,shade(shirt,.5));rect(g,-6,-22,12,13,shirt);rect(g,3,-20,3,10,shade(shirt,.72));rect(g,-5,-22,4,2,shade(shirt,1.25));
  if(raised){rect(g,-11,-32,4,16,skin);rect(g,8,-30,4,14,skin);rect(g,-12,-34,5,5,skin);rect(g,8,-33,5,5,skin);}
  else {rect(g,-10,-21,4,12,shade(skin,.78));rect(g,7,-21,4,11,skin);rect(g,-9,-11,6,4,skin);rect(g,4,-12,6,4,skin);}
  rect(g,-5,-32,10,10,shade(skin,.7));rect(g,-4,-32,8,9,skin);rect(g,-4,-32,8,3,hair);rect(g,-5,-30,2,4,hair);rect(g,-2,-28,2,1,'#3d3836');rect(g,2,-28,2,1,'#3d3836');rect(g,0,-24,3,1,shade(skin,.68));
  if(seed%6===0){rect(g,-6,-34,12,3,shirt);rect(g,2,-32,6,2,shade(shirt,1.25));}
  if(seed%7===0){rect(g,-3,-28,7,2,'#172a35');rect(g,-4,-29,9,1,'#87b7c5');}
  if(seed%3===0){rect(g,-2,-18,4,6,'#e3dbc2');rect(g,-1,-17,2,4,shirt);}
  g.restore();
}
function rearFans(g,summer=true,y=208,rows=2){
  const shirts=summer?['#ee9caa','#539da1','#d4c092','#a7658d','#415d73','#e3ded0','#ba645b']:['#456a86','#aeb7b8','#35515e','#6b6e88','#8b4d58','#718690','#243d52'];
  for(let row=rows-1;row>=0;row--){
    const yy=y-row*22;rect(g,163,yy-12,874,18,summer?'#635f60':'#172c3e');rect(g,163,yy+2,874,4,summer?'#b39b84':'#517185');
    for(let i=0;i<48;i++){const x=174+i*18+row*4;fan(g,x,yy,(i*7+row*13)%101,.77,shirts,(i+row*5)%11===0);}
  }
}
function boards(g,theme){
  const beach=theme==='miami',names=beach?['SUNSET JAM','METAWINNERS','MIAMI BEACH','HEAT CHECK!','2 ON 2 LIVE']:['BUGATTI','HYPERCOURT','METAWINNERS','PURE PERFORMANCE','COURTSIDE'];
  const colors=beach?['#253f58','#bd668c','#267d85','#a76069','#2d566e']:['#20364a','#34566c','#1b3449','#315269','#243e55'];
  const y=212,w=174;
  for(let i=0;i<5;i++){
    const x=164+i*w;poly(g,[[x,y],[x+w-3,y],[x+w+2,y+19],[x-5,y+19]],'#102b38');rect(g,x+1,y+1,w-6,16,colors[i]);rect(g,x+1,y+1,w-6,2,beach?'#e3b29e':'#77bfd5');
    for(let k=0;k<w-8;k+=8)rect(g,x+3+k,y+17,3,1,beach?'#f3ccaf':'#91bed0');
    label(g,names[i],x+w/2-2,y+13,9,beach?'#ffe2b6':'#d8eef1');
  }
}
function sideFans(g,summer){
  const shirts=summer?['#db8097','#639fa4','#edbe83','#d9d3b5','#446b7e']:['#365b77','#788f9f','#414c65','#a6acb4','#705969'];
  for(const side of [-1,1]){
    const x=side<0?54:1146;
    for(let r=0;r<4;r++){
      const yy=292+r*65;poly(g,[[x-43,yy-23],[x+42,yy-23],[x+48,yy+16],[x-49,yy+16]],summer?'#695f5d':'#172d3d');
      rect(g,x-42,yy+8,83,4,summer?'#c1a98e':'#6b92a1');
      fan(g,x-20,yy+5,13+r*11+(side<0?0:27),1.06,shirts,r===1);fan(g,x+20,yy+5,21+r*17+(side<0?0:19),1.06,shirts,r===3);
    }
  }
}
function pixelSpark(g,x,y,color){rect(g,x-2,y-7,4,14,color);rect(g,x-7,y-2,14,4,color);rect(g,x-4,y-4,8,8,'#fff6df');}

function palmTrunk(g,x,y,cx,cy,scale=1){
  const bend=x<600?12:-12;
  poly(g,[[x-8*scale,y],[x+8*scale,y],[cx+4*scale,cy],[cx-4*scale,cy]],'#594e51');
  line(g,[[x-5*scale,y],[x+bend*.4,y-(y-cy)*.48],[cx-2*scale,cy]],'#8d6960',3*scale);
  for(let i=1;i<14;i++){const a=i/14,xx=x+(cx-x)*a,yy=y+(cy-y)*a;line(g,[[xx-5*scale,yy],[xx+4*scale,yy-3*scale]],'#bd8a693d',2);}
  ellipse(g,cx,cy+4,10*scale,8*scale,'#263e44');
}
function palmFronds(g,x,y,scale=1,phase=0){
  const dirs=[[-108,-12,-66,-40],[-105,31,-76,-7],[-69,74,-54,21],[-20,91,-26,40],[33,80,19,23],[85,45,63,-1],[103,-4,66,-34],[46,-58,26,-39],[-29,-65,-19,-34]];
  for(let i=0;i<dirs.length;i++){
    const [ex,ey,mx,my]=dirs[i],sway=Math.sin(phase+i*.8)*2.5;
    const points=[],spine=[];
    for(let j=0;j<=10;j++){const a=j/10,cx=2*(1-a)*a*mx+a*a*(ex+sway),cy=2*(1-a)*a*my+a*a*(ey+sway*.5),dx=2*(1-a)*mx+2*a*(ex-mx),dy=2*(1-a)*my+2*a*(ey-my),l=Math.hypot(dx,dy)||1,w=Math.sin(a*PI)*(j%2?9:6);spine.push([x+cx*scale,y+cy*scale]);points.push([x+(cx-dy/l*w)*scale,y+(cy+dx/l*w)*scale]);}
    for(let j=10;j>=0;j--){const a=j/10,cx=2*(1-a)*a*mx+a*a*(ex+sway),cy=2*(1-a)*a*my+a*a*(ey+sway*.5),dx=2*(1-a)*mx+2*a*(ex-mx),dy=2*(1-a)*my+2*a*(ey-my),l=Math.hypot(dx,dy)||1,w=Math.sin(a*PI)*(j%2?12:7);points.push([x+(cx+dy/l*w)*scale,y+(cy-dx/l*w)*scale]);}
    poly(g,points,i%2?'#254b44':'#356b50','#1a3b3b',scale);line(g,spine,i%2?'#689b69':'#83b77d',1.7*scale);
    for(let j=2;j<9;j++){const p=spine[j];line(g,[p,[p[0]+(i%2?5:-5)*scale,p[1]+6*scale]],'#16392f',scale);}
  }
}
function hotel(g,x,y,w,height,color,accent,name){
  poly(g,[[x+w,y],[x+w+10,y+7],[x+w+10,y+height],[x+w,y+height]],shade(color,.63));
  poly(g,[[x,y],[x+8,y-5],[x+w+10,y+2],[x+w,y+5]],shade(color,1.16));
  rect(g,x,y,w,height,color);rect(g,x-7,y+10,w+14,6,accent);rect(g,x-7,y+height-25,w+14,7,accent);
  rect(g,x,y,3,height,shade(color,1.18));rect(g,x+w-3,y,3,height,shade(color,.72));
  rect(g,x+w*.34,y-14,w*.32,14,color);rect(g,x+w*.41,y-22,w*.18,8,accent);
  for(let row=0;row<Math.floor((height-30)/18);row++)for(let col=0;col<4;col++){
    const xx=x+10+col*(w-20)/4,yy=y+27+row*18;rect(g,xx-1,yy-1,(w-28)/4+2,12,shade(color,.7));rect(g,xx,yy,(w-28)/4,10,(row+col)%3?'#3e6579':'#e7c68b');rect(g,xx,yy,(w-28)/4,2,'#a3d6ce');rect(g,xx+2,yy+2,2,7,'#c8d9c774');rect(g,xx-2,yy+10,(w-28)/4+4,2,accent);
  }
  rect(g,x+w*.42,y+height-22,w*.18,22,'#3b6e78');label(g,name,x+w/2,y+9,9,'#fff0cf');
}
function umbrella(g,x,y,r,color){
  ellipse(g,x+8,y+75,r*.85,10,'#846b7230');line(g,[[x,y],[x,y+76]],'#9a7563',3);
  const apex=[x,y-20],count=6;
  for(let i=0;i<count;i++){
    const a1=PI+i/count*PI,a2=PI+(i+1)/count*PI;
    const p1=[x+Math.cos(a1)*r,y+Math.sin(a1)*r*.55],p2=[x+Math.cos(a2)*r,y+Math.sin(a2)*r*.55];
    poly(g,[apex,p1,p2],i%2?'#fff0cf':color,'#ddc1a3',1);
  }
  g.beginPath();g.moveTo(x-r,y);g.quadraticCurveTo(x,y+10,x+r,y);g.strokeStyle='#fff2d0';g.lineWidth=2;g.stroke();
  poly(g,[[x-24,y+70],[x+22,y+70],[x+35,y+91],[x-12,y+91]],'#e6d4ad');
  line(g,[[x-19,y+73],[x+25,y+73]],color,5);line(g,[[x-15,y+81],[x+29,y+81]],color,5);
}

export function drawMiamiBase(g,h){
  g.save();
  const sky=g.createLinearGradient(0,0,0,250);sky.addColorStop(0,'#b476a7');sky.addColorStop(.48,'#f4a6b0');sky.addColorStop(1,'#ffd99d');g.fillStyle=sky;g.fillRect(0,0,1200,680);
  for(let y=0;y<167;y+=8)for(let x=0;x<1200;x+=8)if(hash(x+y*13)>.71)rect(g,x,y,3,2,'#e7b9bf10');
  // A striped peach sun and soft art-deco clouds establish the beach instantly.
  glow(g,800,91,165,'#ffdb9260');ellipse(g,800,95,60,60,'#ffdc9f');
  for(let j=0;j<5;j++)rect(g,739,114+j*9,122,3+j*.5,'#e7a5aa');
  for(const [x,y,w] of [[90,32,200],[430,51,170],[940,39,195]]){rect(g,x,y,w,5,'#f9c0bf50');rect(g,x+23,y-4,w*.65,5,'#f9c0bf40');for(let j=0;j<6;j++)rect(g,x+j*w/6+8,y+5,w/9,2,'#b681a330');}
  // Low South Beach skyline to the west, not a generic city wall.
  hotel(g,180,79,83,105,'#f1b7b8','#9bd0c6','OCEAN');hotel(g,270,97,69,88,'#ead6ac','#ed9eac','PALMS');hotel(g,126,112,50,72,'#a2d6d1','#f4b5b1','');
  rect(g,351,133,59,51,'#b7cdd0');for(let j=0;j<3;j++)rect(g,357,140+j*12,47,4,'#dfb9ad');
  // Azure horizon, then low waves. Court starts below the shoreline.
  const water=g.createLinearGradient(0,169,0,241);water.addColorStop(0,'#367f95');water.addColorStop(.4,'#4daab0');water.addColorStop(1,'#8dd7c5');g.fillStyle=water;g.fillRect(0,169,1200,86);
  rect(g,0,170,1200,2,'#ffe6bba0');
  for(let i=0;i<160;i++){const x=hash(i+5)*1200,yy=174+hash(i+35)*57;rect(g,x,yy,3+hash(i+72)*34,2,i%3?'#c9f2d45c':'#fff1d172');}
  for(let i=0;i<7;i++)rect(g,750-i*9,172+i*7,100+i*18,3,'#ffdab840');
  // Small sailboats and distant gulls keep the horizon alive even when paused.
  poly(g,[[1022,181],[1059,181],[1052,188],[1031,188]],'#3f7385');poly(g,[[1042,153],[1042,178],[1026,178]],'#ffe5ce');line(g,[[1043,152],[1043,182]],'#667d83',1);
  const sand=g.createLinearGradient(0,230,0,680);sand.addColorStop(0,'#e9c594');sand.addColorStop(1,'#b9987c');g.fillStyle=sand;g.fillRect(0,232,1200,448);
  for(let i=0;i<130;i++)rect(g,hash(i+100)*1200,244+hash(i+323)*436,2+hash(i)*3,1,'#fbe0ac35');
  line(g,[[0,238],[155,232],[290,239],[420,234],[570,240],[760,232],[940,239],[1200,232]],'#fff0c880',3);
  // Lifeguard tower, far enough back that it never covers the right hoop.
  line(g,[[1065,208],[1073,155]],'#965e65',4);line(g,[[1102,208],[1093,155]],'#965e65',4);
  rect(g,1055,139,52,33,'#df8998');rect(g,1059,146,44,12,'#548e9a');rect(g,1077,143,4,20,'#f9d9bd');
  poly(g,[[1047,140],[1116,140],[1105,128],[1058,128]],'#f2c9ad');line(g,[[1050,176],[1112,176]],'#c78980',4);
  line(g,[[1067,177],[1057,207]],'#b0756b',3);for(let i=0;i<4;i++)line(g,[[1060+i*2,199-i*6],[1077+i*2,199-i*6]],'#eac29e',2);
  line(g,[[1105,129],[1105,101]],'#916d6f',2);poly(g,[[1106,102],[1125,108],[1106,114]],'#f1768f');label(g,'BEACH',1082,168,6,'#ffecc6');
  // Low boardwalk sleepers under the playable pastel court.
  h.groundBox(g,-48,20,1096,583,'#a78772');
  for(let y=25;y<610;y+=17)h.line(g,[h.point(-48,y),h.point(1048,y)],'#e9c49938',2);
  h.drawCourt(g,{surround:'#86705e',apron:'#ba7189',left:'#c18b51',right:'#b9824b',key:'#357882',line:'#f5e3bf',center:'#246a79',logo:'#f9e4b8',material:'wood',woodTone:'maple',detail:'#b0d8ca22',label:'MIAMI BEACH  /  SUNSET SESSION',labelColor:'#ffe4bc'});
  for(let y=30;y<584;y+=18){h.line(g,[h.point(-38,y),h.point(36,y)],'#e7c49e39',1.3);h.line(g,[h.point(964,y),h.point(1038,y)],'#e7c49e39',1.3);}
  // Exhibition bleachers, scorers' LED wall and summer crowds frame the game.
  rearFans(g,true,208,2);boards(g,'miami');sideFans(g,true);
  for(const x of [148,1052]){rect(g,x-4,96,8,118,'#45545b');rect(g,x-2,96,2,118,'#a3b7af');rect(g,x-32,90,64,13,'#334f58');for(let j=0;j<5;j++){rect(g,x-27+j*12,93,8,6,'#fbe6ba');rect(g,x-26+j*12,94,6,2,'#fff8d9');}poly(g,[[x-27,103],[x+28,103],[x+75,205],[x-75,205]],'#ffedc30c');}
  // Palm trunks and cabana details stay safely outside the court boundary.
  palmTrunk(g,67,385,88,87,1.02);palmFronds(g,88,87,1.02);
  palmTrunk(g,1135,382,1100,76,1.13);palmFronds(g,1100,76,1.13);
  // Leaning surfboards complete the promenade without entering the court.
  g.save();g.translate(25,342);g.rotate(-.13);ellipse(g,0,0,12,47,'#74c7c2');rect(g,-3,-42,6,84,'#f7d4b5');rect(g,-11,-9,22,7,'#de8da4');g.restore();
  g.save();g.translate(1172,337);g.rotate(.13);ellipse(g,0,0,11,44,'#e6a1b0');rect(g,-2,-39,4,78,'#f9ddba');g.restore();
  umbrella(g,46,544,44,'#d9789d');umbrella(g,1156,550,43,'#5cbbb7');
  // A pale boardwalk edge and sun-bleached foreground details.
  h.line(g,[h.point(-40,590),h.point(1040,590)],'#755f5e',6);
  poly(g,[[97,614],[146,602],[158,629],[108,639]],'#e3c6a3');line(g,[[103,619],[150,608]],'#e689a4',6);line(g,[[107,630],[154,619]],'#e689a4',6);
  ellipse(g,1090,614,14,12,'#f2dbc3');line(g,[[1082,605],[1098,623]],'#e88698',3);line(g,[[1077,616],[1103,613]],'#70bfbc',3);
  rect(g,174,610,26,18,'#496e7e');rect(g,172,608,30,5,'#d4dfca');rect(g,185,614,5,7,'#cee2d0');rect(g,1003,612,28,17,'#d79485');rect(g,1001,608,32,6,'#e4dab9');
  label(g,'SOUTH BEACH  •  ALL HEAT. NO CHILL.',600,648,10,'#544f58');
  g.restore();
}

export function drawMiamiAmbient(g,t,state,h){
  g.save();
  // Wave slivers remain visible beside the packed exhibition bleachers.
  g.save();g.beginPath();g.rect(0,169,147,63);g.rect(1055,169,145,63);g.clip();
  for(let row=0;row<3;row++){
    const y=181+row*9;
    for(let j=0;j<8;j++){const x=((j*167+t*(12+row*3)+row*47)%1330)-80;const len=35+Math.sin(t*.6+j)*14;line(g,[[x,y],[x+len*.4,y+1.5],[x+len,y]],row===2?'#ecf6d978':'#b7f4e86b',1.5);}
  }
  g.restore();
  const birdX=390+(t*13)%500,birdY=66+Math.sin(t*.7)*8;
  for(let i=0;i<2;i++){const x=birdX+i*34,y=birdY+i*10;line(g,[[x-8,y+Math.sin(t*3+i)*3],[x,y],[x+8,y+Math.sin(t*3+i)*3]],'#795e7b',1.5);}
  // Frond tips shift a few pixels; leave the large static foliage cached.
  for(const [x,y,s] of [[88,87,1.02],[1100,76,1.13]]){
    const sway=Math.sin(t*1.1+x)*2;line(g,[[x,y],[x-45*s,y-27*s],[x-103*s+sway,y-12*s]],'#79a9785c',1.2);line(g,[[x,y],[x+63*s,y-34*s],[x+103*s+sway,y-4*s]],'#8eac865c',1.2);
  }
  for(let i=0;i<5;i++)if(Math.sin(t*1.3+i*2.9)>.994)pixelSpark(g,190+i*193,172+(i%2)*14,'#c9f8e9');
  if(state?.effects?.some(e=>e.type==='burst')){
    for(let i=0;i<12;i++){const x=150+hash(i+2)*900,y=35+hash(i+41)*120+Math.sin(t*5+i)*5;const a=.3+.4*Math.max(0,Math.sin(t*7+i));g.globalAlpha=a;rect(g,x,y,3,10,i%2?'#ffe7a0':'#aef7e1');rect(g,x-3.5,y+3.5,10,3,i%2?'#ffe7a0':'#aef7e1');}
  }
  g.restore();
}

function hypercar(g,x,y,scale,color,trim='#b9e7ef',reverse=false){
  g.save();g.translate(x,y);g.scale(scale*(reverse?-1:1),scale);
  // Rounded fenders and a low roof are shaded in clipped bands, then detailed
  // with clustered specular highlights. The 600px framebuffer supplies pixels.
  ellipse(g,0,9,140,14,'#020810cc');ellipse(g,4,13,121,10,'#65acbf20');
  const body=()=>{g.beginPath();g.moveTo(-128,-10);g.bezierCurveTo(-130,-29,-113,-38,-78,-39);g.lineTo(-55,-44);g.bezierCurveTo(-31,-69,11,-72,35,-60);g.lineTo(62,-44);g.bezierCurveTo(88,-40,117,-34,128,-19);g.lineTo(127,-4);g.quadraticCurveTo(15,8,-123,-4);g.closePath();};
  body();g.fillStyle='#020812';g.fill();g.save();body();g.clip();
  const paint=g.createLinearGradient(0,-64,0,9);paint.addColorStop(0,shade(color,1.4));paint.addColorStop(.37,shade(color,1.18));paint.addColorStop(.55,color);paint.addColorStop(.83,shade(color,.55));paint.addColorStop(1,'#060e18');g.fillStyle=paint;g.fillRect(-132,-70,270,85);
  poly(g,[[-122,-28],[-87,-34],[-52,-39],[-33,-34],[-22,-27],[37,-29],[57,-40],[111,-29],[119,-22],[66,-26],[42,-17],[-23,-18],[-53,-27],[-93,-23]],shade(color,1.22));
  poly(g,[[-125,-8],[-91,-14],[-37,-14],[-20,-8],[41,-8],[66,-14],[112,-13],[128,-7],[122,3],[-123,3]],shade(color,.5));
  for(let i=0;i<36;i++){const xx=-115+hash(i+1)*237,yy=-35+hash(i+17)*25;rect(g,Math.round(xx/2)*2,Math.round(yy/2)*2,2+Math.floor(hash(i+9)*4)*2,2,i%3?'#daedee18':'#050b1818');}
  g.restore();body();g.strokeStyle='#050c17';g.lineWidth=2;g.stroke();
  // Wraparound dark glazing; the roof highlight reads as metal rather than wire.
  g.beginPath();g.moveTo(-47,-41);g.quadraticCurveTo(-23,-64,15,-62);g.quadraticCurveTo(31,-62,54,-42);g.lineTo(29,-39);g.lineTo(-47,-41);g.fillStyle='#04121e';g.fill();
  poly(g,[[-37,-45],[-22,-57],[10,-60],[26,-53],[39,-44]],'#31576e');poly(g,[[-29,-48],[-20,-55],[9,-57],[23,-51]],'#638898');
  line(g,[[-44,-43],[-25,-59],[12,-63],[31,-58],[54,-43]],'#a0c9d3',2);line(g,[[-28,-59],[10,-61]],'#edf5ec',2);line(g,[[25,-58],[23,-41]],'#07121e',3);
  // Signature C intake surround, side scoop, shoulder and rocker reflections.
  g.beginPath();g.moveTo(34,-58);g.bezierCurveTo(68,-51,66,-19,42,-10);g.quadraticCurveTo(18,-5,-9,-9);g.strokeStyle='#07131f';g.lineWidth=7;g.stroke();g.strokeStyle=trim;g.lineWidth=3.5;g.stroke();
  poly(g,[[47,-40],[60,-37],[60,-23],[47,-13],[33,-13],[44,-25]],'#04101c');line(g,[[47,-15],[55,-23],[55,-34]],'#44616e',2);
  line(g,[[-118,-26],[-93,-30],[-58,-33],[-34,-29],[-20,-24],[28,-25]],'#d5e9ec66',2);line(g,[[-37,-12],[22,-12]],shade(color,1.45),2);line(g,[[-119,-7],[-34,-7],[15,-6],[121,-9]],trim,1.5);
  rect(g,-116,-27,31,7,'#091623');for(let i=0;i<6;i++)line(g,[[-113+i*5,-27],[-116+i*5,-20]],'#567280',1);rect(g,-4,-29,11,2,trim);
  // Horseshoe grille and four crystalline LED elements across the front.
  g.beginPath();g.moveTo(109,-7);g.bezierCurveTo(104,-19,106,-29,115,-28);g.bezierCurveTo(124,-27,127,-15,123,-7);g.closePath();g.fillStyle='#010711';g.fill();g.strokeStyle=trim;g.lineWidth=2;g.stroke();
  for(let j=0;j<4;j++)line(g,[[110+j*3,-21],[111+j*3,-11]],'#27404d',1);
  for(let i=0;i<4;i++){rect(g,82+i*6,-32+i*.7,5,5,'#224b68');rect(g,83+i*6,-31+i*.7,3,2,'#e0faff');}
  line(g,[[-125,-4],[-31,-1],[16,-2],[125,-5],[132,-10]],'#030b15',3);rect(g,-126,-24,6,3,'#e54c67');rect(g,-125,-23,4,1,'#ffaca2');
  for(const wx of [-74,72]){
    ellipse(g,wx,-5,24,24,'#01060c');ellipse(g,wx,-6,21,21,'#17232e');ellipse(g,wx,-5,18,18,'#94a5ac');ellipse(g,wx,-5,14,14,'#132433');
    for(let k=0;k<10;k++){const a=k/10*PI*2;line(g,[[wx+Math.cos(a)*4,-5+Math.sin(a)*4],[wx+Math.cos(a+.11)*16,-5+Math.sin(a+.11)*16]],k<5?'#d3e7e6':'#6e8c9d',2);}
    rect(g,wx+8,-9,3,8,'#c45654');ellipse(g,wx,-5,5,5,'#bcccd0');ellipse(g,wx,-5,2,2,'#213849');
    g.beginPath();g.arc(wx,-6,20,PI*1.15,PI*1.8);g.strokeStyle='#6e8590';g.lineWidth=2;g.stroke();
  }
  line(g,[[-92,-28],[-81,-32],[-70,-33],[-60,-30]],shade(color,1.5),2);line(g,[[56,-31],[67,-34],[80,-32],[90,-28]],shade(color,1.45),2);g.restore();
}
function displayPlatform(g,x,y,w){
  ellipse(g,x,y+9,w,19,'#0a1723');ellipse(g,x,y+3,w,16,'#335363');ellipse(g,x,y,w-3,14,'#213947');
  g.beginPath();g.ellipse(x,y+2,w-2,14,0,0,PI);g.strokeStyle='#4caec8';g.lineWidth=2;g.stroke();
}

export function drawBugattiBase(g,h){
  g.save();
  const bg=g.createLinearGradient(0,0,0,680);bg.addColorStop(0,'#07131f');bg.addColorStop(.37,'#1b3445');bg.addColorStop(1,'#111e2d');g.fillStyle=bg;g.fillRect(0,0,1200,680);
  // A high, curved glass showroom, not another outdoor arena.
  const glass=g.createLinearGradient(0,15,0,231);glass.addColorStop(0,'#0a1c2c');glass.addColorStop(.7,'#274659');glass.addColorStop(1,'#112737');g.fillStyle=glass;g.fillRect(25,22,1150,206);
  // Dim city reflections, stacked glazing and a dithered blue light falloff.
  for(let i=0;i<24;i++){const x=i*53-12,top=79+hash(i+9)*52;rect(g,x,top,42,115-top,'#101d2a80');for(let yy=top+7;yy<115;yy+=10)for(let xx=x+5;xx<x+39;xx+=9)if(hash(xx+yy+i)>.4)rect(g,xx,yy,3,3,'#6796a442');}
  for(let y=28;y<224;y+=6)for(let x=30;x<1170;x+=8)if(hash(x*7+y)>.7)rect(g,x,y,2,2,'#8ec9d20a');
  for(let i=0;i<12;i++){
    const x=30+i*100;poly(g,[[x,29],[x+94,29],[x+94,207],[x,225]],i%2?'#6fbed10b':'#09182618');line(g,[[x,25],[x,224]],'#061221',6);line(g,[[x+1,25],[x+1,224]],'#7796a663',2);
    if(i%3===0)poly(g,[[x+10,35],[x+34,35],[x+91,208],[x+67,208]],'#b9ebf112');
  }
  // Curved roof ribs and luminous strips recede toward the far wall.
  for(let i=0;i<3;i++){
    g.beginPath();g.moveTo(-30,88+i*29);g.bezierCurveTo(240,-48+i*21,960,-48+i*21,1230,88+i*29);g.strokeStyle=i===0?'#88b5c9':'#405c70';g.lineWidth=i===0?7:3;g.stroke();
  }
  // Rib connectors and hanging fixtures form a steel-lattice exhibition hall.
  for(let i=0;i<12;i++){const x=45+i*101,y=13+Math.abs(x-600)*.085;rect(g,x,y,8,24,'#122434');rect(g,x+1,y+1,2,20,'#9dbdcb');rect(g,x-6,y+23,21,7,'#071525');rect(g,x-4,y+24,17,2,'#cfedf0');}
  for(const x of [342,860]){line(g,[[x,21],[x,80]],'#294456',2);rect(g,x-33,78,66,10,'#07131f');rect(g,x-28,81,56,3,'#bedfe8');poly(g,[[x-28,88],[x+28,88],[x+101,202],[x-101,202]],'#b4e9f10c');}
  for(const side of [-1,1]){
    poly(g,[[600+side*225,15],[600+side*450,42],[600+side*480,54],[600+side*229,25]],'#c7f5fa');
    poly(g,[[600+side*228,24],[600+side*480,53],[600+side*510,82],[600+side*240,38]],'#69ccec10');
    line(g,[[600+side*330,8],[600+side*563,127]],'#adcddd66',2);
  }
  rect(g,468,16,264,56,'#07131ed9');rect(g,478,69,244,2,'#7cb7cd');
  label(g,'B U G A T T I',600,49,28,'#e2eff2',800);label(g,'HYPERCOURT  •  ATELIER SERIES',600,89,8,'#83b4cc',500);
  // Rear gallery lights and wall panels.
  for(const x of [102,1098]){rect(g,x-4,48,8,181,'#0e1f2d');rect(g,x-1,52,2,169,'#5ccbea');glow(g,x,143,87,'#4fb8d516');}
  rect(g,0,223,1200,5,'#425e6b');rect(g,0,228,1200,4,'#09141d');
  // Raised car gallery leaves a full courtside spectator row in front.
  displayPlatform(g,326,182,155);displayPlatform(g,873,182,155);displayPlatform(g,600,184,126);
  hypercar(g,326,166,1.06,'#067d9f','#b9f0ee');
  hypercar(g,873,166,1.06,'#45556b','#e86d78',true);
  hypercar(g,600,169,.82,'#a8bfc5','#57d9ed');
  for(const x of [326,600,873]){rect(g,x-55,193,110,9,'#081828');rect(g,x-53,194,106,1,'#6ab6cc');label(g,x===326?'BLEU / CARBON':x===873?'NOIR / ROUGE':'ATELIER / 01',x,200,6,'#b9dce7',600);}
  // Glossy floor seams stay around the court; the court itself stays readable.
  for(let x=-200;x<1400;x+=140)line(g,[[600+(x-600)*.25,229],[x,680]],'#91c1d31a',1);
  for(let y=258;y<680;y+=45)line(g,[[0,y],[1200,y]],'#a6d8e319',1);
  h.drawCourt(g,{surround:'#122435',apron:'#354a5a',left:'#1d3446',right:'#223c4c',key:'#355970',line:'#71d3df',center:'#112b3a',logo:'#d2eef0',detail:'#8ac9dc0d',label:'BUGATTI SHOWROOM  /  HYPERCOURT',labelColor:'#b0d9e4'});
  rearFans(g,false,208,1);boards(g,'bugatti');sideFans(g,false);
  // Inlaid chrome edges and turquoise floor runners frame the arena.
  for(const x of [-2,1002])h.line(g,[h.point(x,35),h.point(x,564)],'#5dd1e0',2);
  h.line(g,[h.point(-35,591),h.point(1035,591)],'#8bafb9',2);
  // Velvet showroom ropes and chrome stanchions sit well outside sidelines.
  for(const x of [128,1072]){
    for(const y of [324,429,547]){ellipse(g,x,y+7,13,4,'#08121d');rect(g,x-3,y-27,6,34,'#658494');rect(g,x-2,y-27,2,30,'#b5d1da');ellipse(g,x,y-28,5,4,'#b2d0da');}
    g.beginPath();g.moveTo(x,296);g.bezierCurveTo(x+3,334,x-3,366,x,401);g.bezierCurveTo(x+3,443,x-3,479,x,519);g.strokeStyle='#2b5265';g.lineWidth=4;g.stroke();
  }
  // Courtside broadcast desks, floor monitors and shaded camera operators.
  for(const side of [-1,1]){
    const x=side<0?65:1135;poly(g,[[x-42,529],[x+42,529],[x+47,560],[x-45,560]],'#081825');rect(g,x-41,530,82,5,'#53788c');rect(g,x-37,535,73,21,'#1d3b51');rect(g,x-29,540,56,2,'#63a9c1');
    for(const dx of [-21,20]){rect(g,x+dx-10,513,20,15,'#020b15');rect(g,x+dx-8,515,16,10,'#347591');rect(g,x+dx-6,517,12,2,'#a9d6dc');rect(g,x+dx-2,528,4,4,'#8699a3');}
    label(g,'MW LIVE',x,552,7,'#99cfde');
  }
  // Concise showroom floor typography and geometric corner lights.
  label(g,'ENGINEERED FOR THE EXTRAORDINARY.',600,649,10,'#749baa',600);
  for(const x of [95,1105]){line(g,[[x-24,606],[x,620],[x+24,606]],'#77dae5',2);rect(g,x-17,635,34,2,'#67bfd263');}
  g.restore();
}

export function drawBugattiAmbient(g,t,state,h){
  g.save();
  const pulse=.14+Math.sin(t*.9)*.05;
  // A soft scanning reflection crosses the rear glass only.
  const scan=((t*29)%1400)-100;
  poly(g,[[scan,30],[scan+15,30],[scan+75,222],[scan+60,222]],`rgba(190,237,248,${pulse})`);
  // Lamps glint across the display cars' actual four-LED clusters.
  for(const [x,y,dir] of [[415,133,1],[785,133,-1],[669,143,1]]){
    const a=.4+.2*Math.sin(t*1.1+x);g.globalAlpha=a;
    for(let j=0;j<4;j++)rect(g,x+j*dir*5,y+j*.4,3,2,'#d3fcff');
  }
  g.globalAlpha=1;
  for(let i=0;i<4;i++)if(Math.sin(t*1.2+i*2.3)>.995)pixelSpark(g,221+i*243,190,'#a6e4f0');
  // Low floor runners shimmer, without tinting the playable surface.
  for(const side of [-1,1]){const x=side<0?43:1157;const yy=270+(t*36)%270;glow(g,x,yy,24,'#56c7eb25');}
  if(state?.effects?.some(e=>e.type==='burst')){
    const a=.12+.1*Math.sin(t*14);for(const x of [165,1035]){g.globalAlpha=a;poly(g,[[x-5,42],[x+5,42],[x+85,220],[x-85,220]],'#b7f1ff');}g.globalAlpha=1;
    line(g,[[478,70],[722,70]],'#c7fcff',3);
  }
  g.restore();
}
