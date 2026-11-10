// Basketball choreography in native sprite space. z is anatomical depth, used
// for foreshortening; x/y remain the renderer's orthographic coordinates.
export const MOTION_METRICS=Object.freeze({height:108,overheadHand:118,headScale:.82,strideLength:150,shuffleStrideLength:55});
export const MOTION_FRAMES=Object.freeze({idle:48,ready:48,run:48,dribble:48,shuffle:48,shoot:48,dunk:48,block:32,steal:24,pass:24,shove:24,stunned:40,land:32});
const TAU=Math.PI*2,P=(x,y,z=0)=>({x,y,z}),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t);return t*t*(3-2*t);},fract=n=>((n%1)+1)%1;
const add=(a,b)=>P(a.x+b.x,a.y+b.y,(a.z||0)+(b.z||0)),sub=(a,b)=>P(a.x-b.x,a.y-b.y,(a.z||0)-(b.z||0)),mul=(a,n)=>P(a.x*n,a.y*n,(a.z||0)*n),dot=(a,b)=>a.x*b.x+a.y*b.y+(a.z||0)*(b.z||0),len=a=>Math.sqrt(dot(a,a)),unit=a=>mul(a,1/(len(a)||1));
const lerp=(a,b,t)=>P(mix(a.x,b.x,t),mix(a.y,b.y,t),mix(a.z||0,b.z||0,t));
function directionBlend(a,b,t){
  const cosine=clamp(dot(a,b),-1,1);
  if(cosine>.9995)return unit(lerp(a,b,t));
  if(cosine<-.9995){let tangent=sub(P(0,0,1),mul(a,a.z||0));if(len(tangent)<.001)tangent=sub(P(1,0,0),mul(a,a.x));return add(mul(a,Math.cos(Math.PI*t)),mul(unit(tangent),Math.sin(Math.PI*t)));}
  const angle=Math.acos(cosine),sine=Math.sin(angle);return add(mul(a,Math.sin((1-t)*angle)/sine),mul(b,Math.sin(t*angle)/sine));
}
function track(t,keys){let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],q=smooth((t-a[0])/(b[0]-a[0]));return P(mix(a[1],b[1],q),mix(a[2],b[2],q),mix(a[3]||0,b[3]||0,q));}
function scalar(t,keys){return track(t,keys.map(([p,v])=>[p,v,0])).x;}
function segment(angle,length,depth=0){const plane=Math.sqrt(Math.max(0,length*length-depth*depth));return P(Math.sin(angle)*plane,Math.cos(angle)*plane,depth);}
function armFK(root,upperAngle,forearmAngle,upperLength,lowerLength,depth=0){const elbow=add(root,segment(upperAngle,upperLength)),hand=add(elbow,segment(forearmAngle,lowerLength,depth));return {elbow,hand};}
function solveChain(root,requested,upper,lower,pole){
  let delta=sub(requested,root),distance=len(delta),target=requested,error=0;
  const max=upper+lower-.025,min=Math.abs(upper-lower)+.025;
  if(distance>max){error=distance-max;target=add(root,mul(delta,max/distance));delta=sub(target,root);distance=max;}
  if(distance<min){if(distance<.00001)delta=P(0,1,0);target=add(root,mul(unit(delta),min));delta=sub(target,root);distance=min;}
  const direction=unit(delta),along=(upper*upper-lower*lower+distance*distance)/(2*distance),center=add(root,mul(direction,along)),radius=Math.sqrt(Math.max(0,upper*upper-along*along));
  let outward=sub(pole,center);outward=sub(outward,mul(direction,dot(outward,direction)));
  if(len(outward)<.001)outward=P(-direction.y,direction.x,.05);
  return {joint:add(center,mul(unit(outward),radius)),end:target,reachError:error};
}
// Compatibility helper: no limb is ever scaled to reach an impossible target.
export function solveBasketballIK(root,end,upper,lower,bend=-1){const dx=end.x-root.x,dy=end.y-root.y;return solveChain(root,end,upper,lower,P(root.x-dy*bend,root.y+dx*bend,root.z||0)).joint;}
function armToTarget(root,target,upper,lower,hint,side=1){
  const planar=Math.hypot(target.x-root.x,target.y-root.y),available=Math.sqrt(Math.max(0,(upper+lower-.05)**2-planar*planar));
  // A hand in front of the sternum has depth. Keeping the elbow in that plane
  // avoids forcing a 2D right-angle wing merely to preserve a projected length.
  // Blend the close-chest and extended-arm planes. A hard 29px threshold
  // used to move the elbow abruptly while the palm barely moved at all.
  const depth=mix(Math.min(22,available*.72),Math.min(8,available*.35),smooth((planar-24)/10));
  const requested=P(target.x,target.y,(root.z||0)+side*depth),pole=P(hint.x,hint.y,(root.z||0)+side*3);
  const result=solveChain(root,requested,upper,lower,pole);return {...result,requested};
}
export function basketballFoot(phase,{worldToSprite=.653,stride=150,stance=.50,lift=15,offset=0,reverse=false}={}){
  const p=fract(phase),speed=stride*worldToSprite,reach=speed*stance*.5,sign=reverse?-1:1;
  if(p<stance){const q=p/stance,toe=smooth((q-.79)/.21),heel=1-smooth(q/.15);return {x:offset+sign*(reach-speed*p),y:-2.5-toe*2.0,angle:sign*(toe*.24-heel*.10),grounded:true,contact:1-toe*.2,phase:p};}
  const q=(p-stance)/(1-stance),v=1-q,tangent=speed*(1-stance)/3,x=v*v*v*(-reach)+3*v*v*q*(-reach-tangent)+3*v*q*q*(reach+tangent)+q*q*q*reach;
  // The heel recovers behind the hip. The foot is already lowering as it
  // advances, so the knee does not march up horizontally across the body.
  const rise=scalar(q,[[0,2],[.18,lift],[.35,lift*.88],[.61,lift*.30],[.83,lift*.07],[1,0]]);
  return {x:offset+sign*x,y:-2.5-rise,angle:sign*scalar(q,[[0,.24],[.24,.52],[.55,.16],[.82,-.08],[1,-.10]]),grounded:false,contact:0,phase:p};
}
function defaultFeet(){return {angle:0,grounded:true,contact:1};}
export function getBasketballPose(art,state,phase,options={}){
  const p=clamp(phase),loop=fract(phase),body=art.body,legExtra=(body.legLength-1)*42,upperLeg=25.5+legExtra*.5,lowerLeg=26+legExtra*.5,armUpper=21,armLower=20,cyc=TAU*loop;
  const moving=options.moving!==false,wts=options.worldToSprite??.653,deep=options.gatherLow!==false;
  let hip=P(-1,-51-legExtra),shoulder=P(1,-81-legExtra),ankleFar=P(-10,-2.5,-3),ankleNear=P(11,-2.5,3),torsoYaw=.28,turn=0,tilt=0;
  let footFar=defaultFeet(),footNear=defaultFeet(),nearAngles=[.03,.16,1],farAngles=[-.08,-.06,-1],nearTarget=null,farTarget=null,nearHint=null,farHint=null;
  let wristNear=0,wristFar=0,openNear=.2,openFar=.2,defense=false;
  if(state==='idle'){
    // A relaxed athlete keeps a soft elbow and a broad, planted base. The
    // near hand clears the chest instead of reading as one straight hanging rod.
    const breath=Math.sin(cyc)*.30*art.animation.idle;shoulder.y+=breath;shoulder.x+=Math.sin(cyc)*.18;turn=Math.sin(cyc)*.16;
    nearAngles=[-.05,.90+Math.sin(cyc)*.025,3];farAngles=[-.18,-.50,-3];
    wristNear=-.10;openNear=.35;openFar=.25;footFar.angle=-.025;
  }else if(state==='ready'||state==='shuffle'){
    defense=true;torsoYaw=.20;hip=P(-3,-44-legExtra);shoulder=P(4,-74-legExtra);ankleFar=P(-14,-2.5,-8);ankleNear=P(15,-2.5,8);
    nearAngles=[.56,2.35,8];farAngles=[-.28,-1.12,-7];openNear=.78;openFar=.65;wristNear=-.65;wristFar=-.2;
    if(state==='shuffle'){
      footFar=basketballFoot(loop,{worldToSprite:wts,stride:55,stance:.63,lift:3.2,offset:-12,reverse:options.backward});footNear=basketballFoot(loop+.5,{worldToSprite:wts,stride:55,stance:.63,lift:3.2,offset:12,reverse:options.backward});
      ankleFar=P(footFar.x,footFar.y,-8);ankleNear=P(footNear.x,footNear.y,8);hip.y+=Math.cos(cyc*2)*.45;shoulder.y+=Math.cos(cyc*2)*.32;hip.x+=Math.sin(cyc)*.75;nearAngles[0]+=.06*Math.sin(cyc);farAngles[1]-=.06*Math.sin(cyc);turn=Math.sin(cyc)*.55;
    }
  }else if(state==='run'||state==='dribble'){
    torsoYaw=.50;turn=Math.sin(cyc)*1.15;
    if(moving){
      const recovery=options.turbo?2.0:0;
      footFar=basketballFoot(loop,{worldToSprite:wts,offset:-1.5,lift:(state==='dribble'?12.5:15.5)+recovery});footNear=basketballFoot(loop+.5,{worldToSprite:wts,offset:1.5,lift:(state==='dribble'?13:16)+recovery});
      ankleFar=P(footFar.x,footFar.y,-2.5);ankleNear=P(footNear.x,footNear.y,2.5);hip=P(-1.5-Math.sin(cyc)*.55,-48-legExtra+Math.cos(cyc*2)*.72);shoulder=P(5.3+Math.sin(cyc)*.7+(options.turbo?1.8:0),-78-legExtra+Math.cos(cyc*2)*.52);torsoYaw+=Math.sin(cyc)*.07;
      // The elbow remains flexed through the backward drive. Previously the
      // recovery arm nearly straightened at the hip, producing a dangling limb.
      const swing=Math.cos(cyc),pump=options.turbo?1.12:1;
      nearAngles=[.53*swing*pump,mix(.90,2.05,(swing+1)*.5),3];farAngles=[-.51*swing*pump,mix(.92,2.00,(1-swing)*.5),-3];
    }else{hip=P(-3,-46-legExtra);shoulder=P(4,-76-legExtra);ankleFar=P(-11,-2.5,-3);ankleNear=P(12,-2.5,3);nearAngles=[.12,1.15,3];farAngles=[-.18,-.60,-3];}
    if(state==='dribble'){
      torsoYaw=.50;hip.y+=1.0;shoulder.y+=1.2;shoulder.x+=1.1;
      const dp=fract(options.dribblePhase??phase);nearTarget=track(dp,[[0,17,-45],[.16,20,-36],[.37,21,-31],[.60,20,-35],[.82,17,-42],[1,17,-45]]);nearHint=P(shoulder.x+5,shoulder.y+20);
      // The free hand guards the space beside the torso; it does not cross the
      // sternum or lift its elbow to shoulder level.
      farAngles=[-.18+.08*Math.sin(cyc),1.50+.06*Math.cos(cyc),-7];openFar=.65;openNear=.75;wristNear=scalar(dp,[[0,.05],[.16,.18],[.35,.16],[.62,-.08],[.86,-.10],[1,.05]]);wristFar=.42;
    }
  }else if(state==='shoot'){
    torsoYaw=.49;
    hip=track(p,deep?[[0,-7,-41],[.11,-7,-42],[.28,-4,-47],[.44,-1,-54],[.72,0,-54],[.90,1,-48],[1,0,-46]]:[[0,-5,-43],[.13,-5,-42],[.29,-2,-48],[.44,-1,-54],[.72,0,-54],[.9,1,-48],[1,0,-46]]);
    shoulder=track(p,deep?[[0,5,-65],[.11,5,-67],[.28,4,-76],[.44,2,-84],[.72,2,-84],[.90,3,-77],[1,3,-75]]:[[0,4,-72],[.13,5,-70],[.29,3,-77],[.44,2,-84],[.72,2,-84],[.90,3,-77],[1,3,-75]]);
    ankleFar=track(p,[[0,-9,-2.5,-3],[.28,-8,-2.5,-3],[.45,-6,-3.2,-3],[.72,-6,-4,-3],[1,-8,-2.5,-3]]);ankleNear=track(p,[[0,11,-2.5,3],[.28,10,-2.5,3],[.45,8,-3.2,3],[.72,8,-4,3],[1,10,-2.5,3]]);
    const handKeys=[[0,17,deep?-37:-51],[.13,18,-49],[.29,17,-93],[.48,13,-117],[.76,14,-118],[.9,19,-101],[1,20,-75]];
    nearTarget=track(p,handKeys);nearHint=P(shoulder.x+8,Math.max(shoulder.y+5,nearTarget.y+22));
    if(p<.47){farTarget=P(nearTarget.x-8,nearTarget.y+2);farHint=P(shoulder.x-1,Math.max(shoulder.y+12,nearTarget.y+24));}
    else{const atRelease=track(.47,handKeys),relax=smooth((p-.47)/.11);farTarget=track(p,[[.47,atRelease.x-8,atRelease.y+2],[.58,10,-105],[.72,13,-78],[.88,7,-49],[1,3,-40]]);farHint=P(shoulder.x-1+2*relax,Math.max(shoulder.y+12-2*relax,farTarget.y+24-relax));}
    footFar.grounded=footNear.grounded=p<.12||p>.96;footFar.angle=footNear.angle=scalar(p,[[0,0],[.18,0],[.30,.18],[.45,.12],[.60,.08],[.82,.08],[.95,0],[1,0]]);wristNear=mix(-.1,.75,smooth((p-.43)/.12));openNear=mix(.45,.9,smooth((p-.40)/.10));openFar=.7;
  }else if(state==='dunk'){
    const release=options.dunkStage==='release',r=clamp(options.dunkReleasePhase??p),style=art.animation.dunkStyle;torsoYaw=.58;
    if(release){
      hip=P(0,-49-legExtra);shoulder=P(3,-79-legExtra);ankleFar=P(-7,-2.5,-3);ankleNear=P(8,-2.5,3);nearAngles=[mix(2.85,.12,smooth(r)),mix(3.04,1.15,smooth(r)),2];farAngles=[mix(.35,-.18,smooth(r)),mix(1.4,-.60,smooth(r)),-2];footFar.grounded=footNear.grounded=false;openNear=.8;
    }else{
      hip=track(p,[[0,deep?-7:-4,deep?-41:-43],[.13,-5,-43],[.31,0,-49],[.58,2,-50],[.83,1,-50],[1,0,-50]]);shoulder=track(p,[[0,6,deep?-65:-72],[.13,6,-72],[.31,4,-79],[.58,2,-80],[.83,3,-80],[1,3,-80]]);
      ankleFar=track(p,[[0,-12,-2.5,-3],[.16,-15,-5,-3],[.43,-20,-14,-3],[.68,-15,-11,-3],[1,-7,-2.5,-3]]);ankleNear=track(p,[[0,10,-2.5,3],[.16,12,-3,3],[.43,13,-6,3],[.68,10,-6,3],[1,8,-2.5,3]]);
      nearTarget=track(p,[[0,17,deep?-37:-54],[.12,17,-74],[.28,16,-111],[.58,14,-117],[1,14,-118]]);nearHint=P(shoulder.x+8,nearTarget.y+21);
      farAngles=[.05,1.25,-5];
      if(style==='power'){farTarget=P(nearTarget.x-8,nearTarget.y+2);farHint=P(shoulder.x-2,nearTarget.y+23);ankleFar.x=mix(ankleFar.x,-10,Math.sin(Math.PI*p)*.4);}
      else if(style==='tomahawk'){shoulder.x-=Math.sin(Math.PI*p)*2.5;farAngles=[-.28,.35,-3];}
      else if(style==='reverse'){torsoYaw=.67;shoulder.x-=Math.sin(Math.PI*p)*4;hip.x+=Math.sin(Math.PI*p)*1.5;ankleFar.x+=Math.sin(Math.PI*p)*8;farAngles=[-.22,.75,-3];}
      else if(style==='windmill'){turn=Math.sin(p*TAU)*.7;farAngles=[-.35*Math.sin(p*Math.PI),mix(.4,1.4,(Math.cos(p*TAU)+1)*.5),-4];}
      else if(style==='scissor'){ankleFar.x-=Math.sin(Math.PI*p)*2;ankleNear.x+=Math.sin(Math.PI*p)*2;}
      footFar.grounded=footNear.grounded=p<.08;footFar.angle=.18*Math.sin(Math.PI*p);footNear.angle=.06;openNear=.7;openFar=.6;wristNear=.25*smooth((p-.72)/.16);
    }
  }else if(state==='block'){
    torsoYaw=.35;const reach=scalar(p,[[0,0],[.16,.4],[.38,1],[.68,1],[.86,.6],[1,0]]);hip.y+=3-3*reach;shoulder=P(3,-76-4*reach);nearTarget=P(19,-73-45*reach);nearHint=P(shoulder.x+8,nearTarget.y+22);farAngles=[mix(.1,2.7,reach),mix(1.3,2.9,reach),-3];ankleFar=P(-8,-2.5-3*reach,-3);ankleNear=P(9,-2.5-3*reach,3);footFar.grounded=footNear.grounded=p<.1||p>.92;openNear=openFar=1;
  }else if(state==='steal'||state==='shove'){
    torsoYaw=.48;const reach=Math.sin(Math.PI*p);hip=P(-5,-45-legExtra);shoulder=P(4+reach*7,-74-legExtra+reach*3);ankleFar=P(-13,-2.5,-3);ankleNear=P(14,-2.5,3);nearTarget=P(22+reach*14,state==='steal'?-43-reach*8:-64);nearHint=P(shoulder.x+8,shoulder.y+18);farAngles=state==='shove'?[.35+reach*.8,1.4,-4]:[.02,.9,-5];openNear=openFar=.9;
  }else if(state==='pass'){
    torsoYaw=.43;const release=deep?.40:.273,push=smooth((p-release*.58)/(release*.42));
    if(deep){hip=track(p,[[0,-7,-41],[.14,-6,-43],[release,-2,-49],[.64,-1,-50],[1,-1,-50]]);shoulder=track(p,[[0,5,-65],[.14,5,-69],[release,4,-78],[.64,3,-80],[1,1,-80]]);}
    else{shoulder.x+=Math.sin(p*Math.PI)*2;hip.x-=Math.sin(p*Math.PI)*.7;}
    const handKeys=[[0,deep?16:12,deep?-37:-63],[release*.58,15,-52],[release,31,-64],[release+.20,36,-65],[.80,27,-58],[1,16,-45]],guideRelease=release+.25;
    nearTarget=track(p,handKeys);if(p<guideRelease)farTarget=P(nearTarget.x-7,nearTarget.y+1);else{const atRelease=track(guideRelease,handKeys);farTarget=track(p,[[guideRelease,atRelease.x-7,atRelease.y+1],[.88,10,-46],[1,1,-40]]);}nearHint=P(shoulder.x+9,shoulder.y+17);farHint=P(shoulder.x+2,shoulder.y+18);farAngles=[.03,.2,-3];openNear=openFar=.85;wristNear=push*.5;wristFar=push*.35;
  }else if(state==='stunned'){
    const fall=p<.24?smooth(p/.24):p>.73?smooth((1-p)/.27):1;tilt=fall*1.10;hip=P(0,-37);shoulder=P(-2,-66);ankleFar=P(-13,-2.5,-3);ankleNear=P(16,-2.5,3);nearAngles=[mix(.2,2.1,fall),mix(.4,2.4,fall),4];farAngles=[mix(0,-1.3,fall),mix(.2,-1.7,fall),-4];footFar.grounded=footNear.grounded=fall<.1;openNear=openFar=.9;
  }else if(state==='land'){
    const compression=scalar(p,[[0,2],[.24,7.5],[.48,4.5],[.76,.8],[1,0]]);hip=P(-1-compression*.38,-51+compression-legExtra);shoulder=P(1+compression*.28,-81+compression-legExtra);ankleFar=P(-10,-2.5,-3);ankleNear=P(11,-2.5,3);nearAngles=[.12,.35*(1-smooth(p))+1.15,3];farAngles=[-.18,-.30*(1-smooth(p))-.60,-3];openNear=openFar=.4;
  }
  if(!['idle','ready','shuffle','run','dribble','steal','shove','land'].includes(state)&&!(state==='dunk'&&options.dunkStage==='release')){hip.y-=legExtra;shoulder.y-=legExtra;if(nearTarget)nearTarget.y-=legExtra;if(farTarget)farTarget.y-=legExtra;}
  const shoulderSpread=mix(9.8,6.3,torsoYaw)*body.shoulder,hipSpread=mix(5.9,3.5,torsoYaw)*body.torsoWidth;
  let shoulderFar=P(shoulder.x-shoulderSpread,shoulder.y+.4+turn*.7,-6),shoulderNear=P(shoulder.x+shoulderSpread,shoulder.y+1.0-turn*.7,6),hipFar=P(hip.x-hipSpread,hip.y-turn*.22,-3),hipNear=P(hip.x+hipSpread,hip.y+.5+turn*.22,3);
  // Keep extension just shy of lockout without turning foot contact into stretch.
  let settle=0;for(const [root,ankle] of [[hipFar,ankleFar],[hipNear,ankleNear]]){const dx=ankle.x-root.x,dz=ankle.z-root.z,maxY=Math.sqrt(Math.max(1,(upperLeg+lowerLeg-.08)**2-dx*dx-dz*dz));settle=Math.max(settle,ankle.y-root.y-maxY);}
  if(settle>0){for(const point of [hip,shoulder,hipFar,hipNear,shoulderFar,shoulderNear])point.y+=settle;if(nearTarget)nearTarget.y+=settle;if(farTarget)farTarget.y+=settle;}
  const neutral=state==='idle';
  const kneePoleFar=defense?P(ankleFar.x,hipFar.y+21,23):neutral?P(ankleFar.x+7,hipFar.y+22,21):P(hipFar.x+26,hipFar.y+20,hipFar.z),kneePoleNear=defense?P(ankleNear.x,hipNear.y+21,25):neutral?P(ankleNear.x+7,hipNear.y+22,23):P(hipNear.x+26,hipNear.y+20,hipNear.z);
  const farLeg=solveChain(hipFar,ankleFar,upperLeg,lowerLeg,kneePoleFar),nearLeg=solveChain(hipNear,ankleNear,upperLeg,lowerLeg,kneePoleNear);
  let farArm=armFK(shoulderFar,...farAngles.slice(0,2),armUpper,armLower,farAngles[2]),nearArm=armFK(shoulderNear,...nearAngles.slice(0,2),armUpper,armLower,nearAngles[2]);const reachErrors=[];
  if(options.hand){const cs=Math.cos(tilt),sn=Math.sin(tilt);nearTarget=P(options.hand.x*cs+options.hand.y*sn,-options.hand.x*sn+options.hand.y*cs);if(['shoot','pass'].includes(state)||state==='dunk'&&art.animation.dunkStyle==='power')farTarget=P(nearTarget.x-8,nearTarget.y+2);}
  if(nearTarget){const solved=armToTarget(shoulderNear,nearTarget,armUpper,armLower,nearHint||P(shoulderNear.x+5,shoulderNear.y+20),1);nearArm={elbow:solved.joint,hand:solved.end};if(solved.reachError>.01)reachErrors.push({side:'near',error:solved.reachError,requested:nearTarget,actual:solved.end});}
  if(farTarget){const solved=armToTarget(shoulderFar,farTarget,armUpper,armLower,farHint||P(shoulderFar.x+4,shoulderFar.y+20),1);farArm={elbow:solved.joint,hand:solved.end};if(solved.reachError>.01)reachErrors.push({side:'far',error:solved.reachError,requested:farTarget,actual:solved.end});}
  return {hip,shoulder,shoulderFar,shoulderNear,hipFar,hipNear,kneeFar:farLeg.joint,kneeNear:nearLeg.joint,ankleFar:farLeg.end,ankleNear:nearLeg.end,elbowFar:farArm.elbow,elbowNear:nearArm.elbow,handFar:farArm.hand,handNear:nearArm.hand,footFar,footNear,wristNear,wristFar,openNear,openFar,tilt,turn,torsoYaw,headRotation:-turn*.025,squash:1,p:phase,index:phase*8,state,upperLeg,lowerLeg,armUpper,armLower,supportContact:!!farTarget&&(state==='pass'||state==='shoot'&&p<.48||state==='dunk'&&art.animation.dunkStyle==='power'),reachErrors};
}
// Short action changes blend bone directions and root placement, not finished
// sprite images. Grounded feet are re-solved to their blended planted targets.
export function blendBasketballPoses(from,to,weight,{hand,fromFacing=1,toFacing=1}={}){
  // A reversal changes the local basis, not the world location of the previous
  // feet. Mirror the source skeleton into that new basis before the pivot.
  if(fromFacing*toFacing<0){
    from={...from};
    for(const key of ['hip','shoulder','hipFar','hipNear','shoulderFar','shoulderNear','kneeFar','kneeNear','ankleFar','ankleNear','elbowFar','elbowNear','handFar','handNear'])from[key]=P(-from[key].x,from[key].y,from[key].z||0);
    for(const key of ['tilt','turn','headRotation','wristNear','wristFar'])from[key]=-(from[key]||0);
    from.footFar={...from.footFar,angle:-(from.footFar.angle||0)};from.footNear={...from.footNear,angle:-(from.footNear.angle||0)};
  }
  const t=smooth(weight),out={...to};
  for(const key of ['hip','shoulder','hipFar','hipNear','shoulderFar','shoulderNear'])out[key]=lerp(from[key],to[key],t);
  for(const key of ['tilt','turn','torsoYaw','headRotation','wristNear','wristFar','openNear','openFar'])out[key]=mix(from[key]||0,to[key]||0,t);
  for(const side of ['Far','Near']){
    const hip=out['hip'+side],target=lerp(from['ankle'+side],to['ankle'+side],t),pole=lerp(from['knee'+side],to['knee'+side],t),leg=solveChain(hip,target,out.upperLeg,out.lowerLeg,pole);out['knee'+side]=leg.joint;out['ankle'+side]=leg.end;
    const root=out['shoulder'+side],u0=unit(sub(from['elbow'+side],from['shoulder'+side])),u1=unit(sub(to['elbow'+side],to['shoulder'+side])),l0=unit(sub(from['hand'+side],from['elbow'+side])),l1=unit(sub(to['hand'+side],to['elbow'+side]));out['elbow'+side]=add(root,mul(directionBlend(u0,u1,t),out.armUpper));out['hand'+side]=add(out['elbow'+side],mul(directionBlend(l0,l1,t),out.armLower));
    out['foot'+side]={...to['foot'+side],grounded:(t<.5?from:to)['foot'+side].grounded,contact:mix(from['foot'+side].contact||0,to['foot'+side].contact||0,t),angle:mix(from['foot'+side].angle||0,to['foot'+side].angle||0,t)};
  }
  out.reachErrors=[];
  if(hand){
    const cs=Math.cos(out.tilt),sn=Math.sin(out.tilt),target=P(hand.x*cs+hand.y*sn,-hand.x*sn+hand.y*cs);
    for(const side of to.supportContact?['Near','Far']:['Near']){
      const palm=side==='Near'?target:P(target.x-8,target.y+2),solved=armToTarget(out['shoulder'+side],palm,out.armUpper,out.armLower,out['elbow'+side],1);
      out['elbow'+side]=solved.joint;out['hand'+side]=solved.end;
      if(solved.reachError>.01)out.reachErrors.push({side:side.toLowerCase(),error:solved.reachError,requested:palm,actual:solved.end});
    }
  }
  return out;
}
