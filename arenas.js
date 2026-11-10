import { drawCasinoBase, drawCasinoAmbient, drawStadiumBase, drawStadiumAmbient } from './casino-stadium.js';
import { drawMiamiBase, drawMiamiAmbient, drawBugattiBase, drawBugattiAmbient } from './miami-showroom.js';

export const ARENAS = [
  { id:'casino', name:'CASINO ROYALE', shortName:'CASINO', tagline:'HIGH STAKES. HIGHER DUNKS.', description:'Gold lights, velvet nights, and a court built for the jackpot.', accent:'#e9bd62', secondary:'#693b65', number:'01', featured:true,
    hoop:{post:'#a78d52',frame:'#e9bd62',glass:'#75636b',line:'#ffebae',rim:'#f3c773',net:'#f5e4b6',label:'#342633'} },
  { id:'stadium', name:'WINNERS STADIUM', shortName:'STADIUM', tagline:'MAKE THE WHOLE ARENA ROAR.', description:'A packed arena, championship hardwood, and your name under the lights.', accent:'#58d9fb', secondary:'#184d76', number:'02', featured:true,
    hoop:{post:'#799ca8',frame:'#d4e5e9',glass:'#6b9fad',line:'#edfafd',rim:'#ff8b58',net:'#e0f5ed',label:'#183b50'} },
  { id:'miami', name:'MIAMI BEACH', shortName:'MIAMI', tagline:'SUNSET. SWISH. REPEAT.', description:'Palms, ocean air, and pastel courts on the edge of the Atlantic.', accent:'#ff8fa7', secondary:'#67e1dd', number:'03', featured:true,
    hoop:{post:'#436d73',frame:'#f7e9cd',glass:'#a9e5de',line:'#fff5dc',rim:'#ff7f75',net:'#fff0d8',label:'#356d75'} },
  { id:'bugatti', name:'BUGATTI SHOWROOM', shortName:'SHOWROOM', tagline:'PRECISION MEETS POWER.', description:'Sculpted hypercars, polished floors, and a court with first-class handling.', accent:'#45d7ff', secondary:'#e1e8ee', number:'04', featured:true,
    hoop:{post:'#798c9c',frame:'#bfcfdc',glass:'#b9e1ea',line:'#c8f5ff',rim:'#49dcff',net:'#d5ecf4',label:'#20354a'} },
  { id:'blacktop', name:'THE BLACKTOP', shortName:'BLACKTOP', tagline:'WHERE IT ALL STARTED.', description:'The original city court. Four ballers, two hoops, and no excuses.', accent:'#ff7544', secondary:'#386052', number:'05', featured:false,
    hoop:{post:'#5b7169',frame:'#aec2b9',glass:'#829b93',line:'#e4e6cd',rim:'#ff8153',net:'#dce1c7',label:'#26443e'} },
];
export function getArena(id){return ARENAS.find(a=>a.id===id)||ARENAS[0];}
const painters={casino:drawCasinoBase,stadium:drawStadiumBase,miami:drawMiamiBase,bugatti:drawBugattiBase};
const animators={casino:drawCasinoAmbient,stadium:drawStadiumAmbient,miami:drawMiamiAmbient,bugatti:drawBugattiAmbient};
export function drawArenaBase(g,id,helpers){const fn=painters[getArena(id).id];if(!fn)return false;g.save();fn(g,helpers);g.restore();return true;}
export function drawArenaAmbient(g,id,t,state,helpers){const fn=animators[getArena(id).id];if(!fn)return;g.save();fn(g,t,state,helpers);g.restore();}
