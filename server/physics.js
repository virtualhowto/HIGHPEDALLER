export const TRACK_M=402.336;
export const CAR=Object.freeze({massKg:1450,powerW:185000,dragCdA:0.72,grip:0.98,finalRatio:3.9});
export function initialState(){return {distance:0,speed:0,elapsed:0,gear:1,rpm:900,finished:false,shiftLock:0};}
export function advance(state,input,car=CAR,dt=0.05){
 if(state.finished)return {...state};
 if(!Number.isFinite(dt)||dt<=0||dt>0.1)throw Error('Invalid simulation step');
 const s={...state};if(input.shift&&s.gear<6&&s.shiftLock<=0){s.gear++;s.shiftLock=0.22;}
 s.shiftLock=Math.max(0,s.shiftLock-dt);
 const ratios=[0,3.6,2.2,1.5,1.15,0.92,0.76];
 s.rpm=Math.max(900,s.speed/.31*ratios[s.gear]*car.finalRatio*60/(2*Math.PI));
 const factor=Math.max(.3,1-((s.rpm-5500)/7200)**2);
 const power=car.powerW*factor*(s.shiftLock>0?.15:1);
 const force=(input.throttle===true?1:0)*Math.min(power/Math.max(s.speed,3.5),car.massKg*9.81*car.grip);
 const drag=.5*1.225*car.dragCdA*s.speed*s.speed;
 const previous=s.distance;
 s.speed=Math.max(0,s.speed+(force-drag-.014*car.massKg*9.81)/car.massKg*dt);
 s.distance+=s.speed*dt;s.elapsed+=dt;
 if(s.distance>=TRACK_M){const fraction=Math.max(0,Math.min(1,(TRACK_M-previous)/(s.distance-previous)));s.elapsed-=dt*(1-fraction);s.distance=TRACK_M;s.finished=true;}
 return s;
}
