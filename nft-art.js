import { NFT_PROFILES_A } from './nft-profiles-a.js';
import { NFT_PROFILES_B } from './nft-profiles-b.js';
import { NFT_PROFILES_C } from './nft-profiles-c.js';

// The game samples the verified, unmodified NFT portraits themselves. These
// masks are rendering geometry, not replacement artwork or generated likenesses.
export const NFT_PROFILES=Object.freeze({...NFT_PROFILES_A,...NFT_PROFILES_B,...NFT_PROFILES_C});
const decoded=new Map(),pending=new Map(),listeners=new Set();
export function getNFTArt(id){return decoded.get(id)||null;}
export function onNFTArtReady(listener){if(typeof listener!=='function')throw new TypeError('Artwork listener must be a function.');listeners.add(listener);return()=>listeners.delete(listener);}
export function installNFTArt(id,image){
  const profile=NFT_PROFILES[id];
  if(!profile)throw new RangeError(`Unknown NFT character: ${id}`);
  if(!(image?.naturalWidth||image?.width)||!(image?.naturalHeight||image?.height))throw new TypeError('NFT artwork must be decoded before installation.');
  const art={image,profile};decoded.set(id,art);
  for(const listener of listeners){try{listener(id,art);}catch(error){console.warn('NFT artwork listener failed:',error);}}
  return art;
}
function loadOne(id){
  if(decoded.has(id))return Promise.resolve(decoded.get(id));
  if(pending.has(id))return pending.get(id);
  if(!NFT_PROFILES[id]||typeof Image==='undefined')return Promise.resolve(null);
  const request=new Promise(resolve=>{
    const image=new Image();image.decoding='async';
    image.onload=()=>{image.onload=image.onerror=null;resolve(installNFTArt(id,image));};
    image.onerror=()=>{image.onload=image.onerror=null;pending.delete(id);resolve(null);};
    image.src=new URL(`./assets/characters/${id}.jpg`,import.meta.url).href;
  });
  pending.set(id,request);return request;
}
export async function loadNFTArt(ids=Object.keys(NFT_PROFILES)){
  const queue=[...new Set(typeof ids==='string'?[ids]:ids)].filter(id=>NFT_PROFILES[id]),loaded=[];
  // Decode at most three portraits together; selected players can load first.
  await Promise.all(Array.from({length:Math.min(3,queue.length)},async()=>{
    while(queue.length){const id=queue.shift();if(await loadOne(id))loaded.push(id);}
  }));
  return loaded;
}
