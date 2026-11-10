import { drawCourtPolish } from './court-polish.js';

// Original illustrated venues are mapped in three bands so their hardwood and
// reflections remain visible beneath the game's precise, shared court geometry.
const VENUES = Object.freeze({
  casino:  { file:'casino-premium.png',  rear:294, front:815, cropTop:0,   paint:'#46162e70', ink:'#fff1cf', emblem:'#ffe0a1' },
  stadium: { file:'stadium-premium.png', rear:450, front:806, cropTop:127, paint:'#0c28546e', ink:'#fff6e4', emblem:'#eef6ff' },
  miami:   { file:'miami-premium.png',   rear:330, front:793, cropTop:0,   paint:'#086b7468', ink:'#fff5e5', emblem:'#f4fbda' },
  bugatti: { file:'bugatti-premium.png', rear:309, front:790, cropTop:0,   paint:'#10334b70', ink:'#dcefff', emblem:'#9de6ff' },
});
const artwork=new Map(), requests=new Map(), listeners=new Set();
const dimensions=image=>({width:image?.naturalWidth||image?.width||0,height:image?.naturalHeight||image?.height||0});

/** Loaded browser/native image, or null while the procedural fallback is used. */
export function getArenaArtwork(id){return artwork.get(id)||null;}

/** Native Canvas QA can install decoded images without a browser Image global. */
export function installArenaArtwork(id,image){
  if(!VENUES[id])throw new RangeError(`Unknown premium arena: ${id}`);
  const {width,height}=dimensions(image);
  if(!image||width<=0||height<=0)throw new TypeError('Arena artwork must be a decoded, nonempty image.');
  artwork.set(id,image);
  for(const listener of listeners){
    try{listener(id,image);}catch(error){console.warn('Arena artwork listener failed:',error);}
  }
  return image;
}

/** Subscribe to individual asset completion; returns an unsubscribe function. */
export function onArenaArtReady(callback){
  if(typeof callback!=='function')throw new TypeError('Arena artwork callback must be a function.');
  listeners.add(callback);return()=>listeners.delete(callback);
}

function loadOne(id){
  if(!VENUES[id])return Promise.resolve(null);
  if(artwork.has(id))return Promise.resolve(artwork.get(id));
  if(requests.has(id))return requests.get(id);
  if(typeof Image==='undefined')return Promise.resolve(null);
  const request=new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    let finished=false;
    const finish=loaded=>{
      if(finished)return;finished=true;image.onload=null;image.onerror=null;
      if(!loaded){requests.delete(id);resolve(null);return;}
      try{resolve(installArenaArtwork(id,image));}catch{requests.delete(id);resolve(null);}
    };
    image.onload=()=>finish(true);image.onerror=()=>finish(false);
    image.src=new URL(`./assets/arenas/${VENUES[id].file}`,import.meta.url).href;
  });
  requests.set(id,request);return request;
}

/** Explicit/lazy loading. Pass a venue ID or an array to prioritize selected art. */
export async function loadPremiumArenaArt(ids=Object.keys(VENUES)){
  const selected=[...new Set(typeof ids==='string'?[ids]:Array.isArray(ids)?ids:[])].filter(id=>VENUES[id]);
  const result=await Promise.all(selected.map(async id=>(await loadOne(id))?id:null));
  return result.filter(Boolean);
}

/** Paint a loaded 1200×680 venue. False leaves the caller's fallback untouched. */
export function drawPremiumArena(g,id){
  const image=artwork.get(id),venue=VENUES[id];if(!image||!venue)return false;
  const {width,height}=dimensions(image),sy=height/941;
  const top=venue.cropTop*sy,rear=venue.rear*sy,front=venue.front*sy;
  g.save();g.imageSmoothingEnabled=true;
  if('imageSmoothingQuality'in g)g.imageSmoothingQuality='high';
  g.drawImage(image,0,top,width,rear-top,0,0,1200,208);
  g.drawImage(image,0,rear,width,front-rear,0,208,1200,400);
  g.drawImage(image,0,front,width,height-front,0,608,1200,72);
  drawCourtPolish(g,id);g.restore();return true;
}
