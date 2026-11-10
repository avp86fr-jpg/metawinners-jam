// Original arena illustrations. Detailed scenery is painted once and cached by
// CourtRenderer; ambient passes only animate a few venue-specific highlights.
const TAU=Math.PI*2;
const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
function ellipse(g,x,y,rx,ry,color,stroke,width=1){g.beginPath();g.ellipse(x,y,rx,ry,0,0,TAU);if(color){g.fillStyle=color;g.fill();}if(stroke){g.strokeStyle=stroke;g.lineWidth=width;g.stroke();}}
function glow(g,x,y,r,color){const v=g.createRadialGradient(x,y,0,x,y,r);v.addColorStop(0,color);v.addColorStop(1,'#00000000');g.fillStyle=v;g.fillRect(x-r,y-r,r*2,r*2);}
function diamond(g,x,y,s,color,h){h.poly(g,[{x,y:y-s},{x:x+s*.68,y},{x,y:y+s},{x:x-s*.68,y}],color);}
function suit(g,x,y,size,kind,color,h){
  if(kind==='diamond'){diamond(g,x,y,size,color,h);return;}
  if(kind==='heart'){ellipse(g,x-size*.35,y-size*.25,size*.43,size*.43,color);ellipse(g,x+size*.35,y-size*.25,size*.43,size*.43,color);h.poly(g,[{x:x-size*.75,y:y-size*.08},{x:x+size*.75,y:y-size*.08},{x,y:y+size}],color);return;}
  if(kind==='spade'){h.poly(g,[{x,y:y-size},{x:x-size*.7,y:y+size*.1},{x:x+size*.7,y:y+size*.1}],color);ellipse(g,x-size*.3,y+size*.12,size*.43,size*.42,color);ellipse(g,x+size*.3,y+size*.12,size*.43,size*.42,color);h.poly(g,[{x:x-size*.25,y:y+size*.8},{x,y:y+size*.1},{x:x+size*.25,y:y+size*.8}],color);return;}
  ellipse(g,x,y-size*.45,size*.42,size*.42,color);ellipse(g,x-size*.4,y+size*.1,size*.42,size*.42,color);ellipse(g,x+size*.4,y+size*.1,size*.42,size*.42,color);h.poly(g,[{x:x-size*.25,y:y+size*.8},{x,y:y+size*.1},{x:x+size*.25,y:y+size*.8}],color);
}
function slot(g,x,y,scale,h){
  const {rect:r,text}=h;g.save();g.translate(x,y);g.scale(scale,scale);
  r(g,2,0,38,12,'#bc8c48');r(g,5,3,32,8,'#442340');text(g,'777',21,10,7,'#ffe29e');
  r(g,0,12,42,65,'#10131d');r(g,2,14,38,57,'#9b754e');r(g,5,17,32,39,'#48243a');
  r(g,8,21,26,12,'#f5dfac');for(let j=0;j<3;j++){r(g,9+j*8,22,7,10,'#e9d8bd');text(g,'7',12+j*8,30,8,j===1?'#a93851':'#171f2a');}
  r(g,8,37,26,14,'#291c31');text(g,'WIN',21,47,8,'#f1bc63');
  r(g,2,58,38,4,'#d4b16b');r(g,7,65,27,6,'#251723');r(g,10,66,10,2,'#e2d0a3');r(g,25,65,5,4,'#a94062');
  r(g,0,77,42,14,'#342335');r(g,3,80,36,9,'#151720');r(g,41,26,3,19,'#c6a36e');r(g,40,23,5,5,'#dfbc79');
  g.restore();
}
function chandelier(g,x,y,h){
  const {rect:r,line,poly}=h;line(g,[{x,y:0},{x,y:y-18}],'#b48d54',2);
  poly(g,[{x:x-50,y:y-17},{x:x+50,y:y-17},{x:x+34,y:y+7},{x:x-34,y:y+7}],'#302232','#c8a46c',2);
  for(let i=-3;i<=3;i++){line(g,[{x:x+i*12,y:y-13},{x:x+i*9,y:y+20}],'#9a7b56',1);r(g,x+i*9-2,y+14,4,9,'#ffdaa0');}
  line(g,[{x:x-35,y:y+8},{x:x+35,y:y+8}],'#e6ba71',3);glow(g,x,y+12,85,'#f2ba5e24');
}
function roulette(g,x,y,h){
  const {rect:r,line}=h;
  r(g,x-39,y+20,8,42,'#281a24');r(g,x+29,y+20,8,42,'#281a24');
  ellipse(g,x,y+8,78,34,'#1d1823','#aa7a43',3);ellipse(g,x,y,78,32,'#253f39','#b58c4e',4);
  ellipse(g,x-26,y,31,22,'#221b23','#e6c376',2);
  for(let j=0;j<18;j++){const a=j/18*TAU,b=(j+1)/18*TAU;g.beginPath();g.moveTo(x-26,y);g.ellipse(x-26,y,27,18,0,a,b);g.closePath();g.fillStyle=j===0?'#91a66c':j%2?'#a73d4f':'#1a1d27';g.fill();}
  ellipse(g,x-26,y,12,8,'#ad8550','#ebce8a',1);r(g,x-28,y-3,4,6,'#f3d795');
  g.strokeStyle='#d0c49466';g.lineWidth=1;for(let i=0;i<4;i++)g.strokeRect(x+15+i*8,y-14,8,27);
  for(let row=0;row<3;row++){line(g,[{x:x+15,y:y-14+row*9},{x:x+47,y:y-14+row*9}],'#d0c49466',1);}
  for(let i=0;i<3;i++)ellipse(g,x+20+i*9,y+18,5,2,['#e5d3a7','#b84c54','#4b8592'][i]);
}
function cardTable(g,x,y,h){
  const {rect:r,text}=h;r(g,x-48,y+17,8,45,'#271d29');r(g,x+40,y+17,8,45,'#271d29');
  ellipse(g,x,y+8,80,35,'#241923','#b18a53',3);ellipse(g,x,y,80,31,'#21544a','#d7b46d',4);
  text(g,'VIP 21',x+17,y-7,9,'#d7cca0');text(g,'CLUB',x+17,y+7,9,'#e5cf93');
  for(const side of [-1,1]){r(g,x+side*45-7,y-5,10,16,'#eee2c0');r(g,x+side*45-3,y-1,2,5,'#b84553');ellipse(g,x+side*50,y+15,5,2,'#c75758');ellipse(g,x+side*50,y+12,5,2,'#e0bd6e');}
}
function chipStack(g,x,y,color,h){
  for(let j=0;j<5;j++){ellipse(g,x,y-j*4,22,7,color,'#101a20',1);for(const dx of [-14,0,14])h.rect(g,x+dx-2,y-j*4-2,4,4,'#e6d6b9');}
  ellipse(g,x,y-20,13,4,'#e4d3aa');h.text(g,'MW',x,y-18,6,'#292831');
}

// Small shaded spectator sprites use a deliberately limited 16-bit palette.
// Every seat gets a stable seed for skin, hair, body shape, clothes and pose.
const SKINS=[['#d7a477','#9d674e','#f0c99a'],['#aa7958','#684a3e','#c79a72'],['#765340','#45372f','#997257'],['#e0b48c','#a67b60','#f2d0ab'],['#b48c70','#795949','#d4ae89']];
const SHIRTS=[['#dc684a','#813e36','#f39463'],['#4d8fa4','#295269','#7dc1cb'],['#c8a353','#806835','#e7cc7f'],['#718a58','#415837','#a7b875'],['#8667a3','#4a3c6b','#b397c8'],['#d9d3b3','#8b927e','#f1e6c7'],['#405a85','#29354c','#7697bb'],['#b15c78','#643a54','#d98b9a']];
function fan(g,x,y,s,seed,h,pose=0,back=false,luxury=false){
  const r=(a,b,w,hh,c)=>h.rect(g,Math.round(x+a*s),Math.round(y+b*s),Math.max(1,Math.round(w*s)),Math.max(1,Math.round(hh*s)),c);
  const skin=SKINS[Math.floor(noise(seed+3)*SKINS.length)],shirt=SHIRTS[Math.floor(noise(seed+17)*SHIRTS.length)];
  const main=luxury&&noise(seed+29)>.4?'#474354':shirt[0],shade=luxury&&noise(seed+29)>.4?'#252836':shirt[1],light=luxury&&noise(seed+29)>.4?'#747077':shirt[2];
  const hair=['#201c26','#493428','#a2814e','#3c3435'][Math.floor(noise(seed+6)*4)],hat=noise(seed+9)>.83;
  // Black outline, separated legs, jersey hem and shaded arms.
  r(-1,8,12,9,'#17222c');r(0,8,10,8,shade);r(1,7,8,8,main);r(1,8,2,5,light);r(8,9,2,6,shade);r(2,16,3,5,'#233344');r(6,16,3,5,'#1b2937');r(1,20,4,2,'#17222b');r(6,20,4,2,'#17222b');
  if(pose===1){r(-3,3,3,8,shade);r(-3,2,3,3,skin[0]);r(10,3,3,8,shade);r(10,2,3,3,skin[0]);r(-3,2,1,3,skin[2]);r(12,2,1,3,skin[1]);}
  else if(pose===2){r(-3,7,4,4,main);r(-3,5,3,3,skin[0]);r(10,8,3,6,shade);r(10,12,3,3,skin[0]);}
  else {r(-2,10,3,5,main);r(-2,14,3,3,skin[0]);r(10,10,3,5,shade);r(10,14,3,3,skin[0]);}
  r(2,-1,7,8,'#1c2430');r(2,0,7,6,skin[1]);r(3,0,5,6,skin[0]);r(3,0,2,4,skin[2]);r(2,-1,7,2,hair);r(1,1,2,3,hair);r(8,1,2,3,hair);
  if(back){r(2,0,7,6,hair);r(3,1,5,5,noise(seed+6)>.6?'#584c3b':hair);r(3,6,5,2,skin[1]);r(2,8,7,2,shade);}
  else {r(4,2,1,1,'#252632');r(7,2,1,1,'#252632');r(5,4,2,1,skin[1]);r(4,6,3,2,skin[1]);if(noise(seed+21)>.82)r(3,2,6,2,'#293746');}
  if(hat){r(1,-2,9,3,main);r(0,0,11,1,light);}
  if(luxury){r(4,8,3,5,'#eee0bb');r(5,8,1,5,'#28242e');r(2,10,1,2,'#c6ac73');}
  else if(noise(seed+14)>.5){r(4,10,3,4,shirt[2]);r(5,11,1,2,shirt[1]);}
}
function seat(g,x,y,s,color,h){
  h.rect(g,x-2*s,y,15*s,11*s,'#101f2c');h.rect(g,x-s,y,13*s,9*s,color);h.rect(g,x,y+s,11*s,2*s,'#ffffff18');h.rect(g,x,y+10*s,11*s,4*s,color);h.rect(g,x,y+13*s,2*s,6*s,'#1c2a34');h.rect(g,x+9*s,y+13*s,2*s,6*s,'#1c2a34');
}
function crowdDeck(g,y,rows,spacing,seed,h,luxury=false,curve=0){
  const r=h.rect;
  for(let row=0;row<rows;row++){
    const sy=y+row*spacing,step=17+row,sc=.75+row*.1;
    for(let x=-10;x<1220;x+=step){
      const xx=x+(row%2)*8,yy=sy+Math.round(curve*Math.pow((xx-600)/600,2));
      const n=seed+row*103+Math.floor(x);
      seat(g,xx,yy+9*sc,sc,luxury?'#672d3d':noise(n)>.3?'#26496a':'#34546a',h);
      fan(g,xx,yy,sc,n,h,noise(n+4)>.88?1:0,false,luxury);
    }
    // Solid riser establishes depth and keeps each seating row distinct.
    r(g,0,sy+spacing-3,1200,3,luxury?'#3c2634':'#132a3e');r(g,0,sy+spacing-3,1200,1,luxury?'#b68a4d':'#4a687d');
  }
}
function stairs(g,x,y,w,height,h,tone='#293e4f'){
  const {rect:r,line}=h;r(g,x,y,w,height,'#111c2b');for(let sy=y;sy<y+height;sy+=9){r(g,x+1,sy,w-2,4,tone);r(g,x+1,sy,w-2,1,'#82929b40');}
  line(g,[{x:x+4,y},{x:x+4,y:y+height}],'#8c929356',1);line(g,[{x:x+w-4,y},{x:x+w-4,y:y+height}],'#8c929356',1);
}
function beveledPanel(g,x,y,w,hh,fill,edge,h){
  const {rect:r,poly}=h;r(g,x,y,w,hh,'#0d1624');r(g,x+3,y+3,w-6,hh-6,fill);r(g,x+3,y+3,w-6,3,edge);r(g,x+3,y+3,3,hh-6,edge);r(g,x+w-6,y+5,3,hh-8,'#00000050');r(g,x+6,y+hh-6,w-9,3,'#00000050');
  poly(g,[{x:x+w,y:y+hh},{x:x+w+7,y:y+hh-6},{x:x+w+7,y:y+3},{x:x+w,y}], '#050f19');
}
function adPanel(g,x,y,w,hh,label,bg,fg,h,size=13){
  const {rect:r,text}=h;beveledPanel(g,x,y,w,hh,bg,'#e5ece31e',h);text(g,label,x+w/2,y+hh*.68,size,fg);
  for(let i=0;i<w-8;i+=6)r(g,x+5+i,y+hh-6,2,1,fg+'30');
}
function cameraOperator(g,x,y,side,h,palette='stadium'){
  const {rect:r,line,poly}=h;g.save();g.translate(x,y);g.scale(side,1);
  const suit=palette==='casino'?'#5b4b50':'#3a5c75';
  // Shoulder-mounted TV camera and tripod; operator has headset and folded knee.
  r(g,-22,-28,15,22,'#111b28');r(g,-20,-26,11,18,suit);r(g,-18,-36,10,10,'#b88e6d');r(g,-20,-37,13,4,'#2b2b35');r(g,-21,-34,3,9,'#8797a1');r(g,-7,-29,22,14,'#0a1520');r(g,-5,-27,18,9,'#526475');r(g,13,-26,7,8,'#263d4c');r(g,18,-25,5,6,'#0a121c');r(g,-3,-30,8,3,'#171e29');r(g,3,-28,2,2,'#db7759');
  r(g,-11,-17,4,4,'#b88e6d');line(g,[{x:5,y:-15},{x:4,y:14},{x:-8,y:24}],'#596774',3);line(g,[{x:4,y:14},{x:19,y:24}],'#596774',3);line(g,[{x:4,y:14},{x:4,y:27}],'#293947',2);
  r(g,-19,-6,5,23,'#172636');r(g,-12,-6,5,23,'#25374a');r(g,-21,16,9,4,'#101c27');r(g,-13,16,11,4,'#101c27');poly(g,[{x:24,y:-23},{x:54,y:-34},{x:54,y:-7},{x:24,y:-18}], '#d5f1f106');g.restore();
}
function scorerTable(g,x,y,w,h,casino=false){
  const {rect:r,line}=h;
  // Seated officials, papers, illuminated monitors, cables and a padded fascia.
  for(let i=0;i<3;i++){const sx=x+15+i*(w-32)/3;seat(g,sx,y-10,1.2,casino?'#753b44':'#254e66',h);fan(g,sx,y-22,1.2,710+i*17,h,0,false,casino);}
  r(g,x-5,y+1,w+10,25,'#101e29');r(g,x-6,y,w+12,4,casino?'#b49362':'#7396a5');r(g,x,y+4,w,18,casino?'#382733':'#17384e');
  for(let i=0;i<3;i++){const sx=x+10+i*(w-18)/3;r(g,sx,y-9,18,12,'#12202b');r(g,sx+2,y-7,14,8,'#4e7b82');r(g,sx+2,y-7,14,2,'#94b6b0');r(g,sx+6,y+2,8,2,'#151f2c');r(g,sx+22,y,11,3,'#d8d1b2');}
  line(g,[{x:x+20,y:y+23},{x:x+28,y:y+31},{x:x+w-12,y:y+31}], '#15212b',2);
}
function ornateColumn(g,x,y,height,h){
  const {rect:r,poly}=h;
  r(g,x-14,y,28,height,'#3a292b');r(g,x-9,y,18,height,'#8b6b43');r(g,x-7,y,4,height,'#e0b574');r(g,x-1,y,4,height,'#b48b54');r(g,x+5,y,3,height,'#4e3c32');
  for(let j=0;j<4;j++){r(g,x-20+j*2,y+j*4,40-j*4,4,['#a98250','#efc780','#bc955d','#674b35'][j]);r(g,x-20+j*2,y+height-16+j*4,40-j*4,4,['#654a35','#b48b54','#efc780','#76573c'][j]);}
  poly(g,[{x:x-15,y:y+15},{x:x-4,y:y+26},{x:x+6,y:y+26},{x:x+15,y:y+15}], '#c5a06a');
}
function hangingPennant(g,x,y,w,height,label,number,h,warm=false){
  const {poly,rect:r,line,text}=h;line(g,[{x,y:0},{x,y}],'#839092',2);
  poly(g,[{x:x-w/2,y},{x:x+w/2,y},{x:x+w/2,y:y+height-14},{x,y:y+height},{x:x-w/2,y:y+height-14}],warm?'#733947':'#194864',warm?'#e0b46f':'#74c4d4',2);
  r(g,x-w/2+4,y+4,4,height-22,warm?'#a05856':'#39758a');r(g,x+w/2-8,y+4,4,height-22,warm?'#492638':'#123549');text(g,label,x,y+21,10,warm?'#edcd95':'#c4e1dd');text(g,number,x,y+48,24,warm?'#f9e6bc':'#8fdae2');line(g,[{x:x-w/2+8,y:y+height-24},{x:x+w/2-8,y:y+height-24}],warm?'#c9a16a':'#508eaa',2);
}
function roofTruss(g,y,h){
  const {rect:r,line}=h;r(g,0,y,1200,5,'#121d2b');r(g,0,y+4,1200,3,'#68808c');r(g,0,y+26,1200,4,'#1b2d40');r(g,0,y+26,1200,1,'#496473');
  for(let x=0;x<1200;x+=48){line(g,[{x,y:y+7},{x:x+24,y:y+26},{x:x+48,y:y+7}],'#0d1d2e',5);line(g,[{x,y:y+6},{x:x+24,y:y+24},{x:x+48,y:y+6}],'#4a6576',2);r(g,x+22,y+3,4,4,'#a9bcc0');}
}
function floodlamp(g,x,y,h,warm=false){
  const {rect:r,line,poly}=h;line(g,[{x,y:0},{x,y}],'#52626f',3);r(g,x-28,y,56,16,'#0a1726');r(g,x-28,y,56,3,'#7b8990');
  for(let i=0;i<6;i++){r(g,x-23+i*8,y+5,6,7,warm?'#e4c48e':'#c8e2df');r(g,x-22+i*8,y+5,4,2,'#f5eacc');}
  poly(g,[{x:x-23,y:y+17},{x:x+23,y:y+17},{x:x+135,y:205},{x:x-135,y:205}],warm?'#f8c37708':'#91c5d907');
}
function foregroundCrowd(g,h,luxury=false){
  const {rect:r}=h;
  // Near silhouettes frame the court. Their varied heads and shoulders give the
  // same deep, occupied foreground found in classic arcade basketball arenas.
  for(let row=0;row<2;row++){
    const y=row?654:612,step=row?35:29,sc=row?2.7:1.9;
    for(let x=-30;x<1240;x+=step){const xx=x+(row?15:0),seed=x+row*227+811;seat(g,xx,y+19,sc,luxury?'#62313f':'#263d54',h);fan(g,xx,y,sc,seed,h,0,true,luxury);}
    if(!row){r(g,0,646,1200,5,'#14222d');r(g,0,645,1200,2,luxury?'#88643f':'#476071');}
  }
}
function sideBench(g,x,y,side,h,luxury=false,count=5){
  g.save();g.translate(x,y);g.scale(side,1);const {rect:r,line}=h;
  for(let j=0;j<count;j++){const yy=j*40;seat(g,-9,yy,1.8,luxury?'#7b3949':'#284c67',h);fan(g,-9,yy-18,1.6,j*77+42,h,0,false,luxury);}
  const height=count*40-2;r(g,27,-8,4,height,luxury?'#b48f5d':'#4b6a7b');r(g,29,-8,1,height,luxury?'#ead299':'#95b3ba');line(g,[{x:27,y:-8},{x:27,y:height-8}],luxury?'#e2ba7b':'#93b3bc',2);g.restore();
}
function baselineSeats(g,h,luxury=false){
  // Closer heads are substantially larger than the distant decks, with room
  // for the broadcast desk in the middle. This gives the stadium real depth.
  const {rect:r}=h;
  g.save();g.beginPath();g.rect(0,0,1200,202);g.clip();
  for(let i=0;i<22;i++){
    const x=i<11?203+i*20:779+(i-11)*20,seed=2300+i*31;
    seat(g,x,191,1.7,luxury?'#743c49':'#345067',h);
    fan(g,x,173,1.65,seed,h,noise(seed+8)>.82?1:0,false,luxury);
  }
  r(g,434,183,334,26,luxury?'#33212e':'#142235');
  for(let i=0;i<5;i++){
    const x=458+i*64;seat(g,x,184,1.6,luxury?'#663540':'#28485b',h);
    fan(g,x,165,1.65,3210+i*19,h,0,false,luxury);
  }
  g.restore();
  r(g,427,201,346,32,'#0d1c29');r(g,424,198,352,5,luxury?'#d1ad70':'#c3c7b6');r(g,430,204,340,26,luxury?'#754252':'#98aaa5');
  adPanel(g,433,207,118,21,luxury?'ROYAL CLUB':'MW SPORTS',luxury?'#302637':'#213e54',luxury?'#edd3a3':'#e9e6c6',h,11);
  adPanel(g,651,207,116,21,luxury?'VIP ACCESS':'PLAY LOUD',luxury?'#302637':'#2b4a60',luxury?'#edd3a3':'#dbe7d9',h,10);
  r(g,556,207,90,20,'#182b3a');h.text(g,'MW • 25',601,222,13,luxury?'#e7bc74':'#e9ce8c');
  for(let i=0;i<5;i++){
    const x=449+i*66;r(g,x,188,22,13,'#101a29');r(g,x+2,190,18,8,luxury?'#547976':'#588fa1');r(g,x+3,190,16,2,'#b2c6b1');r(g,x+8,201,9,2,'#253044');r(g,x+27,198,16,3,'#dedac0');
  }
  // Red broadcast tally and striped desk corners read at the low resolution.
  r(g,593,195,13,3,'#c8544e');r(g,425,203,3,27,luxury?'#efcf8c':'#f2e8bc');r(g,773,203,3,27,luxury?'#efcf8c':'#f2e8bc');
}
function floorLighting(g,h,warm){
  // A narrow bounce of light stays on the apron outside the painted floor.
  const {line}=h;line(g,[{x:151,y:565},{x:1049,y:565}],warm?'#efd19b36':'#a5e4e830',2);line(g,[{x:142,y:574},{x:1058,y:574}],warm?'#e3ac7026':'#4cbfd426',3);
}

export function drawCasinoBase(g,h){
  const {rect:r,poly,line,text,drawCourt}=h;
  r(g,0,0,1200,680,'#211d2d');
  // Recessed ceiling panels, shadowed coffers and three-dimensional cornices.
  for(let x=0;x<1200;x+=120){beveledPanel(g,x+6,0,108,82,'#302438','#9e7946',h);r(g,x+17,10,84,2,'#513e45');for(let j=0;j<5;j++)line(g,[{x:x+22+j*16,y:20},{x:x+15+j*16,y:78}],'#6f4e4628',2);}
  r(g,0,80,1200,12,'#181824');r(g,0,82,1200,3,'#d4a464');r(g,0,89,1200,3,'#70533d');
  // Crimson velvet folds are shaded in a stepped palette rather than flat fills.
  for(let x=0;x<1200;x+=44){r(g,x,93,44,109,'#4c293b');r(g,x+6,93,7,109,'#794052');r(g,x+14,93,10,109,'#9b5261');r(g,x+25,93,7,109,'#673246');r(g,x+37,93,7,109,'#352438');}
  for(const x of [28,211,989,1172])ornateColumn(g,x,12,222,h);
  chandelier(g,158,44,h);chandelier(g,1042,44,h);
  for(let j=0;j<5;j++){const cx=155+j*7;diamond(g,cx,80+(j%2)*4,4,'#f2d699',h);diamond(g,1200-cx,80+(j%2)*4,4,'#e1b978',h);}
  // A broad gilded marquee with extruded letter shadows and warm bulb rim.
  poly(g,[{x:345,y:19},{x:855,y:19},{x:887,y:57},{x:855,y:103},{x:345,y:103},{x:313,y:57}],'#171827','#a37442',5);
  poly(g,[{x:350,y:24},{x:850,y:24},{x:878,y:58},{x:850,y:97},{x:350,y:97},{x:322,y:58}],'#b88b50','#f2d18e',2);
  poly(g,[{x:359,y:31},{x:841,y:31},{x:862,y:58},{x:841,y:88},{x:359,y:88},{x:338,y:58}],'#512e40','#6e3f44',3);
  text(g,'CASINO ROYALE',603,71,32,'#211b2c');text(g,'CASINO ROYALE',600,67,32,'#ffdfa0');
  suit(g,378,60,13,'spade','#f4d393',h);suit(g,822,60,13,'diamond','#ee927a',h);
  for(let i=0;i<31;i++){r(g,367+i*15,25,4,3,'#f9d58c');r(g,367+i*15,93,4,3,'#d9aa63');}
  text(g,'METAWINNERS EXHIBITION',600,117,10,'#e6bd7d');
  // Two elevated spectator balconies make this a proper basketball event.
  crowdDeck(g,122,3,26,200,h,true,0);
  for(const x of [238,952])stairs(g,x,120,18,78,h,'#6b4951');
  // Side casino bays remain visible beside the court: large slot cabinets and
  // gaming tables sit beyond the arena barricades, never on the playing surface.
  for(let i=0;i<2;i++){slot(g,48+i*58,135,1.2,h);slot(g,1038+i*58,135,1.2,h);}
  // Perspective marble apron and red carpet around the temporary hardwood.
  for(let x=-200;x<1400;x+=100){poly(g,[{x,y:204},{x:x+80,y:204},{x:600+(x-600)*1.55+125,y:680},{x:600+(x-600)*1.55,y:680}],Math.floor(x/100)%2?'#41303b':'#28232f');}
  for(let y=234;y<680;y+=49)line(g,[{x:0,y},{x:1200,y}],'#ac845a24',2);
  for(const x of [12,1188])ornateColumn(g,x,240,342,h);
  drawCourt(g,{surround:'#31252e',apron:'#703449',left:'#bd8751',right:'#b27c48',key:'#74394c',line:'#f7deb0',center:'#683448',logo:'#f0d69e',detail:'#75462430',material:'wood',woodTone:'warm',label:'ALL IN. ALL GAME.',labelColor:'#edd0a1'});
  // Lit gold advertising fascia sits entirely behind the baseline.
  r(g,200,202,800,28,'#171c29');r(g,200,201,800,3,'#dcb16e');r(g,200,228,800,3,'#725036');
  const ads=[['ROYALE','#4e293c','#edcb91'],['25 LEGENDS','#262b38','#e2b775'],['METAWINNERS','#562f3e','#f7dca5'],['ALL IN','#282535','#dbb579'],['JAM','#563040','#ffdfa1']];
  ads.forEach((a,i)=>adPanel(g,204+i*158,206,154,20,a[0],a[1],a[2],h,i===2?10:12));
  baselineSeats(g,h,true);
  scorerTable(g,46,264,109,h,true);scorerTable(g,1045,264,109,h,true);
  roulette(g,104,335,h);cardTable(g,1096,335,h);
  // VIP courtside guests, ushers and broadcast crew create an occupied frame.
  sideBench(g,51,415,1,h,true,4);sideBench(g,1149,415,-1,h,true,4);
  cameraOperator(g,93,557,1,h,'casino');cameraOperator(g,1107,557,-1,h,'casino');
  for(const x of [118,1082]){fan(g,x-6,570,1.7,x,h,0,false,true);r(g,x-7,587,17,2,'#d2ad6f');}
  for(const side of [0,1]){const x=side?1119:81;for(const y of [407,465,524]){r(g,x-3,y-25,6,32,'#755339');r(g,x-2,y-25,2,30,'#d7b272');ellipse(g,x,y+7,12,4,'#79583e');ellipse(g,x,y-26,5,5,'#edce91');}g.beginPath();g.moveTo(x,381);g.quadraticCurveTo(x+(side?-18:18),413,x,439);g.quadraticCurveTo(x+(side?-18:18),472,x,498);g.strokeStyle='#a54d60';g.lineWidth=6;g.stroke();g.strokeStyle='#d18a83';g.lineWidth=1;g.stroke();}
  floorLighting(g,h,true);
  // Front-row VIP backs and deep leather seats form a dramatic foreground.
  foregroundCrowd(g,h,true);
  chipStack(g,171,620,'#904454',h);chipStack(g,1028,622,'#467572',h);
  adPanel(g,443,586,314,21,'THE HOUSE OF HIGHLIGHTS','#31232f','#cba774',h,10);
}

export function drawCasinoAmbient(g,t,state,h){
  const {rect:r}=h;g.save();
  const chase=Math.floor(t*4)%8;for(let i=0;i<31;i++)if((i+chase)%8<3){r(g,367+i*15,25,4,3,'#fff0bb');r(g,367+(30-i)*15,93,4,3,'#ffeba8');}
  const cheer=state?.effects?.some(e=>e.type==='burst');
  // A few deliberately selected front spectators move arms; the cached base
  // supplies the rest of the packed house without redrawing hundreds of people.
  g.save();g.beginPath();g.rect(0,0,1200,202);g.clip();for(let i=0;i<22;i++){const x=i<11?203+i*20:779+(i-11)*20,pose=cheer?1:(Math.floor(t*1.2+i)%7===0?2:0);fan(g,x,173,1.65,2300+i*31,h,pose,false,true);}g.restore();
  for(let i=0;i<4;i++){const x=i<2?48+i*58:1038+(i-2)*58;g.globalAlpha=.16+.1*Math.sin(t*2+i);r(g,x+9,180,31,13,i%2?'#e5b7ff':'#ffd28c');}g.globalAlpha=1;
  const a=t*.9;ellipse(g,78+Math.cos(a)*24,335+Math.sin(a)*15,2,2,'#fff2cd');
  if(cheer){for(let i=0;i<22;i++){const x=272+noise(i+5)*656,y=101+((t*38+i*13)%78);diamond(g,x,y,2+noise(i+2)*3,'#f9db8f',h);}}
  g.restore();
}

export function drawStadiumBase(g,h){
  const {rect:r,poly,line,text,drawCourt}=h;
  r(g,0,0,1200,680,'#18283d');
  // Arena roof and structural depth are rendered as hard palette steps.
  r(g,0,0,1200,43,'#091727');for(let x=0;x<1200;x+=64){poly(g,[{x,y:0},{x:x+28,y:0},{x:x+110,y:54},{x:x+82,y:54}],'#1a2c40');line(g,[{x:x+28,y:0},{x:x+110,y:54}],'#415b71',2);}
  roofTruss(g,13,h);
  // Far seats descend through six densely populated decks. Varied clothing,
  // hair, caps and shaded skin keep the crowd from reading as repeated ticks.
  crowdDeck(g,48,6,25,470,h,false,0);
  // Shaded upper deck overhang, broad stepped aisles and entry tunnels.
  for(const x of [166,366,817,1017])stairs(g,x,45,23,151,h,'#405164');
  r(g,0,93,1200,5,'#102338');r(g,0,93,1200,2,'#64818c');
  r(g,0,143,1200,5,'#11283d');r(g,0,143,1200,2,'#5b8190');
  for(const x of [204,965]){r(g,x,152,31,49,'#0b1b2c');r(g,x-4,150,39,4,'#7b8c91');r(g,x+4,154,23,4,'#253a4e');text(g,'EXIT',x+15,163,7,'#76c6a1');}
  hangingPennant(g,298,35,46,82,'CHAMPS','25',h);hangingPennant(g,902,35,46,82,'LEGENDS','01',h);
  for(const x of [65,226,974,1135])floodlamp(g,x,31,h);
  // A beveled hanging jumbotron has side faces, chassis vents and CRT scanlines.
  line(g,[{x:528,y:0},{x:528,y:34}],'#8499a1',4);line(g,[{x:672,y:0},{x:672,y:34}],'#8499a1',4);
  poly(g,[{x:443,y:30},{x:462,y:18},{x:738,y:18},{x:757,y:30},{x:742,y:129},{x:458,y:129}],'#0b1625','#77919f',2);
  poly(g,[{x:443,y:30},{x:462,y:40},{x:476,y:116},{x:458,y:129}],'#344b5f');poly(g,[{x:757,y:30},{x:738,y:40},{x:724,y:116},{x:742,y:129}],'#1b3046');
  beveledPanel(g,460,29,280,93,'#10273e','#84a5ae',h);r(g,467,37,266,48,'#21516b');r(g,467,84,266,29,'#0e1d30');
  text(g,'WINNERS',602,62,27,'#0b2237');text(g,'WINNERS',600,60,27,'#e7e8c8');text(g,'STADIUM',600,78,12,'#80d4e0');
  for(let y=38;y<84;y+=4)r(g,469,y,262,1,'#0a1b2e32');r(g,469,116,262,3,'#44bdd3');
  for(let x=475;x<730;x+=12)r(g,x,23,7,3,'#182b3e');
  r(g,0,204,1200,476,'#162b3d');
  // Perspective service lanes lead toward the bleachers along both sides.
  for(let side=0;side<2;side++){const s=side?1:-1;for(let j=0;j<6;j++){let y=263+j*52,x=600+s*(493+j*4);poly(g,[{x:x-30,y},{x:x+30,y},{x:x+33,y:y+35},{x:x-33,y:y+35}],j%2?'#203c51':'#1b3449');line(g,[{x:x-30,y},{x:x+30,y}],'#4b637129',2);}}
  drawCourt(g,{surround:'#142d42',apron:'#1d4e69',left:'#d6a766',right:'#ca9b5e',key:'#24516b',line:'#f7e4af',center:'#244e67',logo:'#e9e5bf',detail:'#85582e30',material:'wood',woodTone:'maple',label:'25 LEGENDS. ONE BIG STAGE.',labelColor:'#d1e5dd'});
  // Close baseline audience peers over a padded row of authentic arcade ads.
  r(g,197,213,806,19,'#111e31');r(g,197,211,806,4,'#93a4aa');
  const panels=[['MW JAM','#d9d5ba','#244961'],['BUCKETS!','#245d81','#d1edf1'],['METAWINNERS','#dc9258','#232938'],['PLAY LOUD','#9cb4aa','#203849'],['ON FIRE','#a94d45','#ffe2a9'],['MW JAM','#c2c1aa','#2b4861']];
  panels.forEach((a,i)=>adPanel(g,201+i*133,216,129,17,a[0],a[1],a[2],h,i===2?9:11));
  baselineSeats(g,h,false);
  // Team benches, coolers, officials and camera crews fill the perimeter.
  sideBench(g,38,350,1,h);sideBench(g,1162,350,-1,h);
  for(const x of [90,1090]){r(g,x,350,24,26,'#1c3244');r(g,x+2,353,20,18,'#ce6c45');r(g,x+3,350,18,5,'#e4bf87');r(g,x+6,378,13,3,'#31495b');for(let j=0;j<3;j++)r(g,x+4+j*6,345,4,7,'#d5e1d4');}
  scorerTable(g,42,286,107,h);scorerTable(g,1051,286,107,h);
  cameraOperator(g,99,553,1,h);cameraOperator(g,1101,553,-1,h);
  for(const x of [116,1084]){fan(g,x-8,571,1.8,621+x,h);r(g,x-5,586,14,2,'#ccd3c3');for(let j=0;j<4;j++)r(g,x-5+j*4,579,2,13,'#273543');}
  floorLighting(g,h,false);
  // A close foreground crowd turns the full frame into a packed arena bowl.
  foregroundCrowd(g,h,false);
  adPanel(g,444,585,312,22,'HOME OF THE HIGHLIGHT REEL','#173345','#9cc8d0',h,10);
}

export function drawStadiumAmbient(g,t,state,h){
  const {rect:r,text}=h;g.save();
  const scores=state?.scores||[0,0],cheer=state?.effects?.some(e=>e.type==='burst');
  r(g,470,87,260,23,'#0e1d30');text(g,'HOME',498,102,9,'#81c7cd');text(g,'AWAY',702,102,9,'#81c7cd');text(g,String(scores[0]).padStart(2,'0'),551,106,23,'#e8d08e');text(g,String(scores[1]).padStart(2,'0'),650,106,23,'#e8d08e');r(g,596,97,7,2,'#d6d6b6');
  g.save();g.beginPath();g.rect(0,0,1200,202);g.clip();for(let i=0;i<22;i++){const x=i<11?203+i*20:779+(i-11)*20,pose=cheer?1:(Math.floor(t*1.5+i)%9===0?2:0);fan(g,x,173,1.65,2300+i*31,h,pose);}g.restore();
  // Sparse flashbulbs and waving arms animate the densely painted crowd.
  for(let i=0;i<12;i++){const phase=(t*.42+noise(i)*9)%9;if(phase<.045){const x=30+noise(i+3)*1140,y=56+noise(i+81)*135;r(g,x-4,y,10,2,'#e1faff');r(g,x,y-4,2,10,'#e1faff');}}
  if(cheer){for(let i=0;i<28;i++){const x=58+noise(i+81)*1084,y=37+((t*65+i*23)%146);r(g,x,y,3,4+(i%3),i%3?'#a1dbe6':'#f1d47f');}}
  g.restore();
}
