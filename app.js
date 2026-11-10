import { ROSTER } from './roster.js';
import { CourtRenderer, createAttractState, drawPortrait, drawArenaThumbnail } from './render.js';
import { createGame } from './engine.js';
import { ArcadeAudio } from './audio.js';
import { ArcadeShow } from './arcade-show.js';
import { ARENAS, getArena } from './arenas.js';
import { loadPremiumArenaArt, onArenaArtReady } from './premium-arenas.js';
import { onSpriteArtReady } from './sprites.js';
import { loadNFTArt } from './nft-art.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const read = (key,fallback) => { try { const value=JSON.parse(localStorage.getItem(`mw-jam-${key}`)); return value??fallback; } catch { return fallback; } };
const save = (key,value) => { try { localStorage.setItem(`mw-jam-${key}`,JSON.stringify(value)); } catch {} };
const savedDuo = read('duo',['chief','bloodbath']);
let selected = (Array.isArray(savedDuo)?savedDuo:[]).filter(id=>ROSTER.some(c=>c.id===id)).slice(0,2);
if(selected.length!==2 || selected[0]===selected[1]) selected=['chief','bloodbath'];
const normalizeSettings=value=>({difficulty:value?.difficulty==='pro'?'pro':'arcade',duration:[90,120,180].includes(Number(value?.duration))?Number(value.duration):120});
let settings = normalizeSettings(read('settings',null));
let matchSettings={...settings};
let selectedArena=getArena(read('arena','casino'));
let matchArena=selectedArena;
let filter='all', game=null, gameRenderer=null, toastTimer, previousTime=null, previewVisible=true;
let previewGame=null, previewStaticState=null, cardSprites=[], lastCardFrame=0;
let gamePaintDirty=true, previewPaintDirty=true;
let touchVector={x:0,y:0}, touchShoot=false, touchTurbo=false, touchPointer=null, queuedShoot=false, queuedShotTurbo=false;
let resultsShown=false, lastAnnouncement='', lastPossession=-1;
let scoreFlash={team:-1,remaining:0};
const keys = new Set();
const resetPointers = [];
const audio = new ArcadeAudio({muted:read('muted',true)});
const previewRenderer = new CourtRenderer($('#preview-canvas'),{arena:selectedArena.id});
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const arcadeShow = new ArcadeShow({canvas:$('#arcade-show-canvas'),reduceMotion});
const active = () => !$('#game-screen').hidden;
const isDefense = () => game?.state.possession===1;
const turboHeld = () => touchTurbo||keys.has('shift')||keys.has('l');
// The HUD changes much less often than the game renders. Keep its nodes and
// last values so a 60 Hz match does not rebuild unchanged text every frame.
const hud = Object.fromEntries(['game-screen','home-score','away-score','game-time','period-label','shot-clock','match-difficulty','player-name','turbo-fill','fire-status','announcement','shot-meter','shot-fill','attack-hint'].map(id=>[id,{node:document.getElementById(id),values:{}}]));
hud.pass={node:$('#touch-pass span'),values:{}};hud.shoot={node:$('#touch-shoot span'),values:{}};
function hudText(id,value){const item=hud[id];if(item.values.text!==value){item.node.textContent=value;item.values.text=value;}}
function hudStyle(id,key,value){const item=hud[id];if(item.values[key]!==value){item.node.style[key]=value;item.values[key]=value;}}
function hudClass(id,key,value){const item=hud[id];if(item.values[key]!==value){item.node.classList.toggle(key,value);item.values[key]=value;}}
function hudHidden(id,value){const item=hud[id];if(item.values.hidden!==value){item.node.hidden=value;item.values.hidden=value;}}

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2300);}
function clickSound(){audio.unlock();audio.event('click');}
function setSoundUI(){
  $$('.sound-toggle').forEach(button=>{button.setAttribute('aria-label',audio.muted?'Turn sound on':'Turn sound off');button.setAttribute('aria-pressed',String(!audio.muted));button.title=audio.muted?'Sound off — click to enable':'Sound on';});
  const wave=$('.sound-waves');if(wave)wave.setAttribute('d',audio.muted?'m16 9 5 6m0-6-5 6':'M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14');
  $$('.game-tools .sound-toggle').forEach(b=>{b.textContent=audio.muted?'♪':'♫';b.style.color=audio.muted?'#8e9480':'#d4e690';});
}
function showDialog(name){
  clickSound();
  if(name==='roster') renderRoster();
  if(name==='settings'){$('#difficulty').value=settings.difficulty;$('#duration').value=String(settings.duration);$('#arena-setting').value=selectedArena.id;updateDifficultyDescription();}
  const dialog=$(`#${name}-dialog`);if(!dialog.open)dialog.showModal();
}
function closeDialogs(){ $$('dialog[open]').forEach(d=>d.close()); }
function updateDifficultyDescription(){
  $('#difficulty-description').textContent=$('#difficulty').value==='pro'?'Faster rivals guard tighter, shoot better, and challenge the ball more often.':'Rivals give you more room and attempt fewer steals and blocks. Get a feel for the shooting rhythm.';
}

function renderArenas(){
  const cards=ARENAS.filter(a=>a.featured).map(arena=>{
    const button=document.createElement('button');button.className='arena-card';button.dataset.arena=arena.id;
    button.style.setProperty('--venue-accent',arena.accent);button.setAttribute('aria-label',`Select ${arena.name}. ${arena.description}`);
    const art=document.createElement('div');art.className='arena-art';
    const canvas=document.createElement('canvas');canvas.width=600;canvas.height=340;canvas.setAttribute('aria-hidden','true');
    const index=document.createElement('span');index.className='arena-card-index';index.textContent=`DESTINATION ${arena.number}`;
    const check=document.createElement('span');check.className='arena-card-check';check.textContent='SELECTED ✓';art.append(canvas,index,check);
    const caption=document.createElement('div');caption.className='arena-card-caption';
    const number=document.createElement('span');number.className='arena-index';number.textContent=arena.number;
    const copy=document.createElement('span');const name=document.createElement('strong');name.textContent=arena.name;
    const tag=document.createElement('span');tag.className='arena-tag';tag.textContent=arena.tagline;copy.append(name,tag);
    const arrow=document.createElement('span');arrow.className='arena-card-arrow';arrow.textContent='↗';caption.append(number,copy,arrow);
    button.append(art,caption);button.addEventListener('click',()=>{clickSound();selectArena(arena.id);});
    drawArenaThumbnail(canvas,arena.id);return button;
  });
  $('#arena-grid').replaceChildren(...cards);
  $('#arena-setting').replaceChildren(...ARENAS.map(arena=>{const option=document.createElement('option');option.value=arena.id;option.textContent=arena.name;return option;}));
  updateArenaUI();
}
function updateArenaUI(){
  $$('.arena-card').forEach(card=>{const chosen=card.dataset.arena===selectedArena.id;card.classList.toggle('selected',chosen);card.setAttribute('aria-pressed',String(chosen));});
  const classic=selectedArena.id==='blacktop';$('#classic-arena-button').setAttribute('aria-pressed',String(classic));$('#classic-arena-button').classList.toggle('selected',classic);
  $('#selected-arena-name').textContent=selectedArena.name;$('#selected-arena-description').textContent=selectedArena.description;
  $('#preview-arena-label').textContent=`${selectedArena.name} · ${selectedArena.tagline}`;$('#preview-arena-name').textContent=selectedArena.name;
  $('#preview-canvas').setAttribute('aria-label',`Animated preview of the ${selectedArena.name} basketball arena`);
  $('#arena-setting').value=selectedArena.id;$('.arena-selection-bar').style.setProperty('--venue-accent',selectedArena.accent);
}
function selectArena(id){
  selectedArena=getArena(id);save('arena',selectedArena.id);previewRenderer.setArena(selectedArena.id);previewPaintDirty=true;audio.setArena(selectedArena.id);updateArenaUI();
}

function characterCard(character){
  const button=document.createElement('button');button.className='character-card';button.dataset.id=character.id;
  button.style.setProperty('--character-glow',`${character.color}38`);
  const slot=selected.indexOf(character.id);button.classList.toggle('selected',slot>=0);
  button.setAttribute('aria-pressed',String(slot>=0));
  button.setAttribute('aria-label',`${character.name}, ${character.role}. Speed ${character.stats.speed}, dunk ${character.stats.dunk}, shot ${character.stats.shot} out of 10.${slot>=0?' Selected.':' Select for your duo.'}`);
  button.title=`${character.name} · Speed ${character.stats.speed} / Dunk ${character.stats.dunk} / Shot ${character.stats.shot}`;
  const art=document.createElement('div');art.className='character-art';
  const portrait=document.createElement('img');portrait.className='nft-reference';portrait.src=character.artwork;portrait.alt='';portrait.width=750;portrait.height=750;portrait.loading='lazy';portrait.decoding='async';
  portrait.addEventListener('error',()=>{const fallback=document.createElement('canvas');fallback.width=240;fallback.height=200;fallback.setAttribute('aria-hidden','true');portrait.replaceWith(fallback);drawPortrait(fallback,character);},{once:true});
  art.append(portrait);
  const sprite=document.createElement('canvas');sprite.className='roster-sprite';sprite.width=240;sprite.height=220;sprite.setAttribute('aria-hidden','true');
  art.append(sprite);drawPortrait(sprite,character);const cardSprite={canvas:sprite,character,button,hover:false};cardSprites.push(cardSprite);
  button.addEventListener('pointerenter',()=>{cardSprite.hover=true;});button.addEventListener('pointerleave',()=>{cardSprite.hover=false;});
  const number=document.createElement('span');number.className='character-number';number.textContent=`1/1 · #${character.tokenId}`;art.append(number);
  const badge=document.createElement('span');badge.className='character-badge';badge.textContent=slot===0?'CAPTAIN':'TEAMMATE';art.append(badge);
  const info=document.createElement('div');info.className='character-info';
  const copy=document.createElement('span');const name=document.createElement('span');name.className='character-name';name.textContent=character.name;
  const role=document.createElement('span');role.className='character-role';role.textContent=character.role;copy.append(name,role);
  const arrow=document.createElement('span');arrow.className='character-arrow';arrow.textContent=slot>=0?'✓':'↗';info.append(copy,arrow);
  const ratings=document.createElement('div');ratings.className='character-stats';ratings.setAttribute('aria-hidden','true');
  for(const [key,label] of [['speed','SPD'],['dunk','DNK'],['shot','SHT']]){
    const stat=document.createElement('span');stat.className='character-stat';
    const title=document.createElement('span');title.textContent=label;
    const value=document.createElement('b');value.textContent=character.stats[key];
    const track=document.createElement('span');track.className='stat-track';
    const fill=document.createElement('i');fill.style.width=`${character.stats[key]*10}%`;track.append(fill);stat.append(title,value,track);ratings.append(stat);
  }
  button.append(art,info,ratings);
  button.addEventListener('click',()=>selectCharacter(character.id));return button;
}
function selectCharacter(id){
  clickSound();const index=selected.indexOf(id);
  if(index>=0) selected.splice(index,1);
  else if(selected.length<2) selected.push(id);
  else {selected[1]=id;toast(`${ROSTER.find(c=>c.id===id).name} joins your captain`);}
  if(selected.includes(id))audio.event({type:'character-select',slot:selected.indexOf(id)});
  if(selected.length===2)save('duo',selected);
  renderRoster();
}
function renderRoster(){
  const featured=$('#featured-roster'),full=$('#full-roster');
  cardSprites=[];
  const focusedId=document.activeElement?.dataset?.id;
  const focusedContainer=document.activeElement?.closest('#featured-roster,#full-roster')?.id;
  featured.replaceChildren(...ROSTER.slice(0,5).map(characterCard));
  const filtered=ROSTER.filter(c=>filter==='all'||(filter==='power'&&c.stats.dunk>=9)||(filter==='speed'&&c.stats.speed>=9)||(filter==='shooter'&&c.stats.shot>=9));
  full.replaceChildren(...filtered.map(characterCard));
  $('#squad-names').textContent=selected.length?selected.map(id=>ROSTER.find(c=>c.id===id).name).join(' + '):'PICK TWO BALLERS';
  $('#selection-count').textContent=`${selected.length} / 2 SELECTED`;
  $('#roster-play').disabled=selected.length!==2;
  for(let i=0;i<2;i++){
    const character=ROSTER.find(c=>c.id===selected[i]);
    const portrait=$(`#hero-player-${i+1}-art`),name=$(`#hero-player-${i+1}-name`);
    portrait.hidden=!character;
    if(character){portrait.src=character.artwork;portrait.alt=character.name;}
    name.textContent=character?.name||'SELECT PLAYER';
  }
  $('#hero-duo-meta').textContent=selected.length===2?'YOUR TWO. THEIR PROBLEM.':`${2-selected.length} PLAYER${selected.length?'':'S'} TO GO`;
  const sourceLinks=$('#selected-nft-links');sourceLinks.replaceChildren();
  if(!selected.length)sourceLinks.textContent='Pick two 1/1s to take the court.';
  selected.forEach((id,index)=>{const c=ROSTER.find(c=>c.id===id);if(index)sourceLinks.append(document.createTextNode(' + '));const a=document.createElement('a');a.href=c.nftUrl;a.target='_blank';a.rel='noopener noreferrer';a.textContent=`${c.name} #${c.tokenId} ↗`;a.setAttribute('aria-label',`View the original ${c.name} NFT, token ${c.tokenId}, on OpenSea`);sourceLinks.append(a);});
  const duo=selected.length===2?selected.map(id=>ROSTER.find(c=>c.id===id)):ROSTER.slice(0,2);
  const rivals=ROSTER.filter(c=>!duo.includes(c)).slice(0,2);
  previewGame=createGame({team:duo,opponents:rivals,demo:true,duration:60});previewGame.start();previewGame.state.presentation='demo';
  previewStaticState=createAttractState([...duo,...ROSTER.filter(c=>!duo.includes(c))],1);previewPaintDirty=true;
  if(focusedId&&focusedContainer) document.querySelector(`#${focusedContainer} [data-id="${focusedId}"]`)?.focus({preventScroll:true});
}
function clearInput(){
  resetPointers.forEach(reset=>reset());
  if(touchPointer!==null&&$('#joystick').hasPointerCapture?.(touchPointer))$('#joystick').releasePointerCapture(touchPointer);
  keys.clear();touchVector={x:0,y:0};touchShoot=false;touchTurbo=false;touchPointer=null;queuedShoot=false;queuedShotTurbo=false;
  $('#joystick-knob').style.transform='translate(0,0)';
  $$('.touch-action').forEach(b=>b.classList.remove('active'));
}
function startGame(){
  clickSound();
  if(selected.length!==2){closeDialogs();showDialog('roster');return;}
  closeDialogs();clearInput();audio.stopMusic();arcadeShow.clear();
  previewRenderer.releasePlayerLayers();
  const team=selected.map(id=>ROSTER.find(c=>c.id===id));
  const pool=ROSTER.filter(c=>!selected.includes(c.id));
  const first=Math.floor(Math.random()*pool.length);const opponentA=pool.splice(first,1)[0];const opponentB=pool[Math.floor(Math.random()*pool.length)];
  matchSettings={...settings};previousTime=null;
  game=createGame({team,opponents:[opponentA,opponentB],duration:matchSettings.duration,difficulty:matchSettings.difficulty});
  $('#game-screen').hidden=false;document.body.classList.add('playing');$('.site-shell').inert=true;
  $('#pause-overlay').hidden=true;$('#result-overlay').hidden=true;resultsShown=false;lastAnnouncement='';lastPossession=-1;
  $('#pause-button').setAttribute('aria-label','Pause game');
  matchArena=selectedArena;
  if(!gameRenderer) gameRenderer=new CourtRenderer($('#game-canvas'),{arena:matchArena.id});else gameRenderer.setArena(matchArena.id);
  $('#game-screen').dataset.arena=matchArena.id;$('#game-screen').style.setProperty('--arena-accent',matchArena.accent);audio.setArena(matchArena.id);
  scoreFlash={team:-1,remaining:0};
  gameRenderer.resize();
  gamePaintDirty=true;
  arcadeShow.beginMatch({team,opponents:[opponentA,opponentB],arena:matchArena});
  $('#skip-intro').hidden=false;$('#game-screen').classList.add('match-intro');
  audio.event('matchup');$('#skip-intro').focus({preventScroll:true});
  gameRenderer.draw(game.state,0);arcadeShow.draw(game.state);
  updateHUD();
}
function finishIntro(){
  if(!game||game.state.phase!=='ready'||!$('#pause-overlay').hidden||document.hidden)return;
  arcadeShow.skipIntro();clearInput();$('#skip-intro').hidden=true;$('#game-screen').classList.remove('match-intro');
  previousTime=null;game.start();audio.startMusic();$('#game-canvas').focus({preventScroll:true});
}
function pauseGame(){
  if(!game||!$('#pause-overlay').hidden||(game.state.phase!=='playing'&&!arcadeShow.introActive))return;
  game.pause();clearInput();arcadeShow.clearEffects();gamePaintDirty=true;audio.stopMusic();$('#pause-overlay').hidden=false;$('#pause-button').setAttribute('aria-label','Resume game');$('#resume-button').focus({preventScroll:true});
  $('#pause-eyebrow').textContent=`${(game.state.difficulty||matchSettings.difficulty).toUpperCase()} · GAME PAUSED`;
}
function resumeGame(){
  if(!game||$('#pause-overlay').hidden)return;
  closeDialogs();clearInput();previousTime=null;game.resume();$('#pause-overlay').hidden=true;$('#pause-button').setAttribute('aria-label','Pause game');audio.unlock();
  if(arcadeShow.introActive){audio.event('matchup');$('#skip-intro').focus({preventScroll:true});}
  else{audio.startMusic();$('#game-canvas').focus({preventScroll:true});}
}
function quitGame(){
  if(game)game.pause();clearInput();audio.stopMusic();arcadeShow.clear();$('#skip-intro').hidden=true;$('#game-screen').classList.remove('match-intro');$('#game-screen').hidden=true;document.body.classList.remove('playing');$('.site-shell').inert=false;game=null;
  gameRenderer?.releasePlayerLayers();previewPaintDirty=true;
  $('.hero-actions .play-button').focus({preventScroll:true});
}
function contextualPass(){if(game?.state.phase==='playing'){game.action(isDefense()?'steal':'pass',{turbo:turboHeld()});}}
function shootPress(){
  if(game?.state.phase!=='playing')return;
  // Keep taps that begin and end between animation frames. The following frame
  // sees the press; the next sees the release if the button is no longer held.
  queuedShoot=true;queuedShotTurbo=turboHeld();
  if(isDefense())game.action('block',{turbo:turboHeld()});
}
function showResult(){
  if(resultsShown)return;resultsShown=true;clearInput();audio.finishMusic();
  const s=game.state,won=s.scores[0]>s.scores[1];
  $('#result-title').innerHTML=won?'COURT <span>OWNED.</span>':'RUN IT <span>BACK.</span>';
  $('#result-eyebrow').textContent=won?`${matchArena.name} IS YOURS`:`REMATCH AT ${matchArena.name}?`;
  $('#result-score').textContent=`${String(s.scores[0]).padStart(2,'0')} — ${String(s.scores[1]).padStart(2,'0')}`;
  const savedBest=Number(read('best',0));const best=Number.isFinite(savedBest)&&savedBest>=0?savedBest:0;if(s.scores[0]>best)save('best',s.scores[0]);
  $('#result-message').textContent=won?'Big buckets. Bigger bragging rights.':`Your duo has another gear. Best score: ${Math.max(best,s.scores[0])}.`;
  $('#result-dunks').textContent=s.stats.dunks;$('#result-threes').textContent=s.stats.threes;$('#result-steals').textContent=s.stats.steals;
  const mvp=arcadeShow.finish(s);arcadeShow.drawMVP($('#result-mvp-canvas'),s);
  $('#result-mvp-label').textContent=mvp?`Match MVP: ${mvp.character?.name||mvp.name||'MetaWinner'}. ${mvp.points??0} points.`:'Match complete.';
  $('#result-overlay').hidden=false;$('#rematch-button').focus({preventScroll:true});
}
function updateHUD(){
  const s=game.state,p=s.players.find(p=>p.id===s.controlled),seconds=Math.max(0,Math.ceil(s.time));
  hudText('home-score',String(s.scores[0]).padStart(2,'0'));hudText('away-score',String(s.scores[1]).padStart(2,'0'));
  hudClass('home-score','score-pop',scoreFlash.remaining>0&&scoreFlash.team===0);
  hudClass('away-score','score-pop',scoreFlash.remaining>0&&scoreFlash.team===1);
  hudClass('game-screen','team-on-fire',s.players.some(player=>player.team===0&&player.onFire));
  hudClass('game-screen','clutch-time',seconds<=15&&s.phase==='playing');
  hudText('game-time',`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`);
  hudStyle('game-time','color',seconds<=15?'#ff9b6e':'');
  hudText('period-label',s.overtime?'OVERTIME':matchArena.shortName);
  hudText('match-difficulty',(s.difficulty||matchSettings.difficulty).toUpperCase());
  hudText('shot-clock',`SHOT ${Math.max(0,Math.ceil(s.shotClock)).toString().padStart(2,'0')}`);
  hudText('player-name',p?.character?.name||'METAWINNER');hudStyle('turbo-fill','width',`${Math.round(p?.stamina??100)}%`);
  hudText('fire-status',p?.onFire?'ON FIRE!':p?.streak===2?'1 TO FIRE':'TURBO');hudStyle('fire-status','color',p?.onFire?'#ff653b':'');
  const announcement=arcadeShow.introActive?`${s.players.filter(p=>p.team===0).map(p=>p.character.name).join(' + ')} VERSUS ${s.players.filter(p=>p.team===1).map(p=>p.character.name).join(' + ')}`:s.announcementTime>0?s.announcement:'';
  if(announcement!==lastAnnouncement){hudText('announcement',announcement);lastAnnouncement=announcement;}
  hudHidden('shot-meter',!s.charge.active);hudStyle('shot-fill','width',`${Math.round(s.charge.amount*200)/2}%`);
  hudStyle('shot-fill','background',s.charge.amount>=.65&&s.charge.amount<=.85?'#d4e690':'#ff653b');
  hudText('pass',isDefense()?(turboHeld()?'SHOVE':'STEAL'):(turboHeld()?'FAST PASS':'PASS'));
  hudText('shoot',isDefense()?'BLOCK':'SHOOT');
  if(lastPossession!==s.possession){
    lastPossession=s.possession;
    hudText('attack-hint',isDefense()?'← DEFEND YOUR BASKET':'YOUR BASKET →');
  }
  if(s.phase==='ended')showResult();
}
function frame(timestamp){
  // The engine divides slow frames into safe 1/60 s steps. Passing the full
  // bounded interval keeps the clock honest at 5–20 Hz; resume discards gaps.
  const dt=previousTime===null?1/60:Math.max(0,Math.min((timestamp-previousTime)/1000,.2));previousTime=timestamp;
  if(active()&&game&&!document.hidden){
    const dx=(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0);
    const dy=(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0);
    const advancing=$('#pause-overlay').hidden&&game.state.phase!=='ended';
    if(advancing){
      game.step(dt,{x:dx||touchVector.x,y:dy||touchVector.y,turbo:turboHeld()||(queuedShoot&&queuedShotTurbo),shoot:queuedShoot||touchShoot||keys.has(' ')||keys.has('j')});
      const status=arcadeShow.update(dt,game.state);
      if(status?.introDone&&game.state.phase==='ready')finishIntro();
      scoreFlash.remaining=Math.max(0,scoreFlash.remaining-dt);
    }
    queuedShoot=false;
    game.drainEvents().forEach(event=>{
      arcadeShow.event(event,game.state);
      if(event.type==='score')scoreFlash={team:event.team,remaining:.5};
      audio.event(event.type==='start'?'tipoff':event.type==='end'?(event.winner===0?'victory':'defeat'):event);
    });
    if(advancing||gamePaintDirty){gameRenderer.draw(game.state,game.state.elapsed);arcadeShow.draw(game.state);updateHUD();gamePaintDirty=false;}
  }else if(!active()&&previewVisible&&!document.hidden&&!$('dialog[open]')){
    if(reduceMotion){if(previewPaintDirty){previewRenderer.draw(previewStaticState,1);previewPaintDirty=false;}}
    else{previewGame.step(dt);previewGame.drainEvents();previewRenderer.draw(previewGame.state,previewGame.state.elapsed);}
  }
  if(!active()&&!document.hidden&&timestamp-lastCardFrame>33&&!reduceMotion&&(!$('dialog[open]')||$('#roster-dialog').open)){
    lastCardFrame=timestamp;
    for(const item of cardSprites){const visible=$('#roster-dialog').open?item.canvas.closest('#full-roster'):item.canvas.closest('#featured-roster');if(visible&&(selected.includes(item.character.id)||item.hover||document.activeElement===item.button))drawPortrait(item.canvas,item.character,{time:timestamp/1000});}
  }
  requestAnimationFrame(frame);
}

$$('[data-open]').forEach(b=>b.addEventListener('click',()=>showDialog(b.dataset.open)));
$$('.close-modal').forEach(b=>b.addEventListener('click',()=>{clickSound();b.closest('dialog').close();}));
$$('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}));
$$('.play-button').forEach(b=>b.addEventListener('click',()=>{if(active()&&!$('#pause-overlay').hidden)resumeGame();else startGame();}));
$('#all-roster-button').addEventListener('click',()=>showDialog('roster'));
$('#edit-squad').addEventListener('click',()=>showDialog('roster'));
$('#roster-play').addEventListener('click',startGame);
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{filter=b.dataset.filter;$$('[data-filter]').forEach(tab=>tab.classList.toggle('active',tab===b));renderRoster();clickSound();}));
$$('.sound-toggle').forEach(button=>button.addEventListener('click',()=>{audio.unlock();audio.toggle();save('muted',audio.muted);setSoundUI();if(!audio.muted){audio.event('select');if(active()&&game?.state.phase==='playing')audio.startMusic();}}));
$('#difficulty').addEventListener('change',updateDifficultyDescription);
$('#save-settings').addEventListener('click',()=>{settings=normalizeSettings({difficulty:$('#difficulty').value,duration:$('#duration').value});save('settings',settings);selectArena($('#arena-setting').value);$('#settings-dialog').close();clickSound();toast(`${settings.difficulty.toUpperCase()} · ${settings.duration}s · ${selectedArena.name}`);});
$('#classic-arena-button').addEventListener('click',()=>{clickSound();selectArena('blacktop');});
$('#pause-button').addEventListener('click',()=>!$('#pause-overlay').hidden?resumeGame():pauseGame());
$('#skip-intro').addEventListener('click',finishIntro);
$('#resume-button').addEventListener('click',resumeGame);
$('#restart-button').addEventListener('click',startGame);
$('#rematch-button').addEventListener('click',startGame);
$('#quit-button').addEventListener('click',quitGame);
$('#game-home').addEventListener('click',event=>{event.preventDefault();pauseGame();});
$('#result-roster').addEventListener('click',()=>{quitGame();showDialog('roster');});
$('#result-arena').addEventListener('click',()=>{quitGame();$('#arenas').scrollIntoView({behavior:reduceMotion?'auto':'smooth'});$('.arena-card').focus({preventScroll:true});});
$('#game-help').addEventListener('click',()=>{pauseGame();showDialog('guide');});
$('#touch-switch').addEventListener('click',()=>{game?.action('switch');});

const gameKeys=new Set(['arrowleft','arrowright','arrowup','arrowdown','w','a','s','d',' ','enter','j','k','x','shift','l','e','escape','p']);
const interactiveTarget=target=>target?.closest?.('button,a,input,select,textarea,[contenteditable="true"]');
window.addEventListener('keydown',event=>{
  if(!active()||$('dialog[open]'))return;
  const key=event.key.toLowerCase();
  const overlay=!$('#pause-overlay').hidden?$('#pause-overlay'):!$('#result-overlay').hidden?$('#result-overlay'):arcadeShow.introActive?$('#skip-intro').parentElement:null;
  if(key==='tab'&&overlay){
    const buttons=[...overlay.querySelectorAll('button:not([disabled])')];
    const i=buttons.indexOf(document.activeElement);
    if(event.shiftKey&&i<=0){event.preventDefault();buttons.at(-1)?.focus();}
    else if(!event.shiftKey&&(i<0||i===buttons.length-1)){event.preventDefault();buttons[0]?.focus();}
    return;
  }
  if(!gameKeys.has(key))return;
  if(key==='escape'||key==='p'){event.preventDefault();if(!event.repeat)!$('#pause-overlay').hidden?resumeGame():pauseGame();return;}
  if(arcadeShow.introActive){
    if((key===' '||key==='enter')&&!event.repeat&&$('#pause-overlay').hidden&&!interactiveTarget(event.target)){event.preventDefault();finishIntro();}
    return;
  }
  if(game.state.phase!=='playing'||interactiveTarget(event.target))return;
  event.preventDefault();
  if(event.repeat)return;
  keys.add(key);
  if(key==='k'||key==='x')contextualPass();if(key==='e')game.action('switch');if(key===' '||key==='j')shootPress();
});
window.addEventListener('keyup',event=>{const key=event.key.toLowerCase();keys.delete(key);if(active()&&game?.state.phase==='playing'&&!$('dialog[open]')&&!interactiveTarget(event.target)&&gameKeys.has(key))event.preventDefault();});
window.addEventListener('blur',()=>{clearInput();if(active())pauseGame();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(active())pauseGame();}});

function bindHeldButton(selector,setter,onPress){
  const button=$(selector);let pointer=null;
  resetPointers.push(()=>{const id=pointer;pointer=null;if(id!==null&&button.hasPointerCapture?.(id))button.releasePointerCapture(id);setter(false);button.classList.remove('active');});
  button.addEventListener('pointerdown',event=>{
    if(pointer!==null||game?.state.phase!=='playing')return;
    event.preventDefault();pointer=event.pointerId;button.setPointerCapture(pointer);button.classList.add('active');setter(true);onPress?.();audio.unlock();
  });
  const release=event=>{if(pointer!==event.pointerId)return;pointer=null;setter(false);button.classList.remove('active');};
  button.addEventListener('pointerup',release);button.addEventListener('pointercancel',release);button.addEventListener('lostpointercapture',release);
}
bindHeldButton('#touch-shoot',value=>{touchShoot=value;},shootPress);
bindHeldButton('#touch-turbo',value=>{touchTurbo=value;});
bindHeldButton('#touch-pass',()=>{},contextualPass);
const joystick=$('#joystick');
function moveJoystick(event){
  const box=joystick.getBoundingClientRect(),radius=Math.max(1,box.width*.34);
  let x=(event.clientX-box.left-box.width/2)/radius,y=(event.clientY-box.top-box.height/2)/radius;
  const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
  touchVector={x:Math.abs(x)<.1?0:x,y:Math.abs(y)<.1?0:y};$('#joystick-knob').style.transform=`translate(${x*radius}px,${y*radius}px)`;
}
joystick.addEventListener('pointerdown',event=>{if(touchPointer!==null||game?.state.phase!=='playing')return;event.preventDefault();touchPointer=event.pointerId;joystick.setPointerCapture(event.pointerId);moveJoystick(event);});
joystick.addEventListener('pointermove',event=>{if(event.pointerId===touchPointer){event.preventDefault();moveJoystick(event);}});
function releaseJoystick(event){if(event.pointerId!==touchPointer)return;touchPointer=null;touchVector={x:0,y:0};$('#joystick-knob').style.transform='translate(0,0)';}
joystick.addEventListener('pointerup',releaseJoystick);joystick.addEventListener('pointercancel',releaseJoystick);joystick.addEventListener('lostpointercapture',releaseJoystick);
window.addEventListener('resize',()=>{previewRenderer.resize();gameRenderer?.resize();previewPaintDirty=true;gamePaintDirty=true;clearInput();});
if('IntersectionObserver' in window)new IntersectionObserver(entries=>{previewVisible=entries[0].isIntersecting;}).observe($('#preview-canvas'));
renderRoster();renderArenas();audio.setArena(selectedArena.id);setSoundUI();
onArenaArtReady(id=>{const canvas=document.querySelector(`.arena-card[data-arena="${id}"] canvas`);if(canvas)drawArenaThumbnail(canvas,id);previewPaintDirty=true;gamePaintDirty=true;});
onSpriteArtReady(id=>{for(const item of cardSprites)if(!id||item.character.id===id)drawPortrait(item.canvas,item.character);previewPaintDirty=true;gamePaintDirty=true;if(game&&resultsShown)arcadeShow.drawMVP($('#result-mvp-canvas'),game.state);});
document.fonts?.ready.then(()=>{previewPaintDirty=true;gamePaintDirty=true;if(game&&resultsShown)arcadeShow.drawMVP($('#result-mvp-canvas'),game.state);});
loadNFTArt([...selected,...ROSTER.slice(0,4).map(c=>c.id)]).then(()=>loadNFTArt());
loadPremiumArenaArt(selectedArena.id).then(()=>loadPremiumArenaArt());
requestAnimationFrame(frame);
