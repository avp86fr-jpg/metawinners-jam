// A small, shared, palette-limited costume texture for the game sprites.
// The collection portrait and matchup artwork continue using the untouched JPG.
const SIZE=128,LIMIT=64,cache=new Map();
function groupSurfaceColors(data,profile){
  // Remove sub-pixel photographic grain before selecting the sprite palette.
  // Strong color boundaries (visor marks, eyes, chest gems and trim) never mix.
  // Body materials receive more grouping than the identity-critical face.
  const source=new Uint8ClampedArray(data),neck=profile.head.anchor[1]*SIZE;
  for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++){
    const i=(y*SIZE+x)*4;if(source[i+3]<240)continue;
    const body=y>neck,threshold=body?102:68,baseWeight=threshold*3;
    let weight=baseWeight,r=source[i]*weight,g=source[i+1]*weight,b=source[i+2]*weight;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const j=i+(dy*SIZE+dx)*4;if(source[j+3]<240)continue;
      const delta=Math.abs(source[j]-source[i])+Math.abs(source[j+1]-source[i+1])+Math.abs(source[j+2]-source[i+2]);
      if(delta>=threshold)continue;
      const w=(threshold-delta)*(dx&&dy?1:2);weight+=w;r+=source[j]*w;g+=source[j+1]*w;b+=source[j+2]*w;
    }
    const amount=body?.92:.65;data[i]=Math.round(source[i]+(r/weight-source[i])*amount);data[i+1]=Math.round(source[i+1]+(g/weight-source[i+1])*amount);data[i+2]=Math.round(source[i+2]+(b/weight-source[i+2])*amount);
  }
}
function paletteFor(data){
  const bins=new Map();
  for(let i=0;i<data.length;i+=4){if(data[i+3]<64)continue;const r=data[i]>>3,g=data[i+1]>>3,b=data[i+2]>>3,key=r<<10|g<<5|b;const old=bins.get(key);if(old)old.n++;else bins.set(key,{r:r*8+4,g:g*8+4,b:b*8+4,n:1});}
  const box=colors=>{let lo=[255,255,255],hi=[0,0,0],n=0;for(const c of colors){for(const [j,k] of ['r','g','b'].entries()){lo[j]=Math.min(lo[j],c[k]);hi[j]=Math.max(hi[j],c[k]);}n+=c.n;}const range=hi.map((v,i)=>v-lo[i]);return {colors,n,range,score:Math.max(...range)*Math.sqrt(n)};};
  const boxes=[box([...bins.values()])];
  while(boxes.length<LIMIT){boxes.sort((a,b)=>b.score-a.score);const current=boxes.findIndex(b=>b.colors.length>1);if(current<0)break;const b=boxes.splice(current,1)[0],channel=['r','g','b'][b.range.indexOf(Math.max(...b.range))];b.colors.sort((a,z)=>a[channel]-z[channel]);let n=0,cut=1;for(;cut<b.colors.length;cut++){n+=b.colors[cut-1].n;if(n>=b.n/2)break;}cut=Math.min(b.colors.length-1,cut);boxes.push(box(b.colors.slice(0,cut)),box(b.colors.slice(cut)));}
  return boxes.map(b=>['r','g','b'].map(k=>Math.round(b.colors.reduce((sum,c)=>sum+c[k]*c.n,0)/b.n)));
}
export function getNFTSpriteTexture(id,original){
  const hit=cache.get(id);if(hit?.source===original)return hit.canvas;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=SIZE;const g=canvas.getContext('2d');
  g.beginPath();for(const shape of [original.profile.head,original.profile.torso]){shape.polygon.forEach(([x,y],i)=>i?g.lineTo(x*SIZE,y*SIZE):g.moveTo(x*SIZE,y*SIZE));g.closePath();}g.save();g.clip();g.drawImage(original.image,0,0,SIZE,SIZE);g.restore();
  const image=g.getImageData(0,0,SIZE,SIZE),data=image.data;groupSurfaceColors(data,original.profile);
  const palette=paletteFor(data),nearest=new Map();
  for(let i=0;i<data.length;i+=4){if(!data[i+3])continue;const key=(data[i]>>3)<<10|(data[i+1]>>3)<<5|(data[i+2]>>3);let color=nearest.get(key);if(!color){let score=Infinity;for(const p of palette){const d=(p[0]-data[i])**2*.9+(p[1]-data[i+1])**2*1.1+(p[2]-data[i+2])**2;if(d<score){score=d;color=p;}}nearest.set(key,color);}data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];}
  g.putImageData(image,0,0);cache.set(id,{source:original,canvas});while(cache.size>25)cache.delete(cache.keys().next().value);return canvas;
}
export function getNFTSpriteTextureStats(){return {textures:cache.size,bytes:cache.size*SIZE*SIZE*4,max:25*SIZE*SIZE*4};}
