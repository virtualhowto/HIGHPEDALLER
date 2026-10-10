import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {WebSocketServer} from 'ws';
import {advance,initialState,TRACK_M} from './physics.js';
import {cleanName,findRoom,newCode,validCode} from './rooms.js';
const PORT=Number(process.env.PORT||8080),MAX=Number(process.env.MAX_CONNECTIONS||100);
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../web');
const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
const mime={html:'text/html; charset=utf-8',js:'application/javascript; charset=utf-8',css:'text/css; charset=utf-8'};
const clients=new Map(),rooms=new Map();let serial=0;
const send=(ws,x)=>{if(ws.readyState===1)ws.send(JSON.stringify(x));};
const cast=(room,x)=>room.players.forEach(p=>send(p.ws,x));
const server=http.createServer(async(req,res)=>{
 const u=req.url?.split('?')[0];
 if(u==='/healthz'||u==='/readyz'){res.writeHead(200,{'content-type':'application/json'});res.end(JSON.stringify({ok:true,online:clients.size,rooms:rooms.size}));return;}
 const name=files[u];if(!name){res.writeHead(404);res.end('Not found');return;}
 try{const contents=await readFile(path.join(ROOT,name));res.writeHead(200,{'content-type':mime[name.split('.').at(-1)],'cache-control':'no-store','x-content-type-options':'nosniff','x-frame-options':'DENY','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; connect-src 'self' ws: wss:; script-src 'self'; style-src 'self'"});res.end(contents);}catch{res.writeHead(500);res.end('Unable to render');}
});
const wss=new WebSocketServer({noServer:true,maxPayload:1024,perMessageDeflate:false});
server.on('upgrade',(req,socket,head)=>{
 const origin=req.headers.origin,host=req.headers.host,allowed=process.env.ALLOWED_ORIGIN;
 const ok=allowed?origin===allowed:(!origin||origin===`http://${host}`||origin===`https://${host}`);
 if(req.url!=='/ws'||!ok||clients.size>=MAX){socket.end('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');return;}
 wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws));
});
wss.on('connection',ws=>{
 const p={id:String(++serial),ws,name:'Racer',room:null,input:{throttle:false,shift:false},state:initialState(),lastInput:0};clients.set(ws,p);send(ws,{type:'hello',id:p.id});
 ws.on('message',buf=>{
  let m;try{m=JSON.parse(buf.toString());}catch{return;}
  if(!m||typeof m!=='object')return;
  if(m.type==='join'&&!p.room){
   const mode=m.mode==='private'?'private':'public',code=validCode(m.code);
   if(mode==='private'&&m.code&&!code){send(ws,{type:'error',message:'Invalid room code'});return;}
   let r=mode==='public'?findRoom(rooms,'public'):code?findRoom(rooms,'private',code):null;
   if(!r&&mode==='private'&&code){send(ws,{type:'error',message:'Room not found or full'});return;}
   if(!r){r={id:String(++serial),code:mode==='private'?newCode():null,mode,players:[],status:'waiting',startAt:0};rooms.set(r.id,r);}
   p.name=cleanName(m.name);p.room=r.id;r.players.push(p);send(ws,{type:'joined',room:r.id,code:r.code,mode});cast(r,{type:'lobby',players:r.players.map(x=>x.name),code:r.code});
   if(r.players.length===2){r.status='countdown';r.startAt=Date.now()+4000;cast(r,{type:'countdown',startAt:r.startAt});}return;
  }
  if(m.type==='input'&&p.room){const now=Date.now();if(now-p.lastInput<25)return;p.lastInput=now;const r=rooms.get(p.room);if(r?.status==='running')p.input={throttle:m.throttle===true,shift:m.shift===true};return;}
  if(m.type==='restart'&&p.room){const r=rooms.get(p.room);if(r?.status==='finished'&&r.players.length===2){r.players.forEach(x=>{x.state=initialState();x.input={throttle:false,shift:false};});r.status='countdown';r.startAt=Date.now()+4000;cast(r,{type:'countdown',startAt:r.startAt});}}
 });
 ws.on('close',()=>{clients.delete(ws);if(!p.room)return;const r=rooms.get(p.room);if(!r)return;r.players=r.players.filter(x=>x!==p);if(!r.players.length)rooms.delete(r.id);else{r.status='finished';cast(r,{type:'abandoned',message:'Opponent disconnected'});}});
});
const timer=setInterval(()=>{
 for(const [id,r] of rooms){
  if(!r.players.length){rooms.delete(id);continue;}
  if(r.status==='countdown'){if(Date.now()>=r.startAt){r.status='running';cast(r,{type:'start'});}continue;}
  if(r.status!=='running')continue;
  r.players.forEach(p=>{if(!p.state.finished)p.state=advance(p.state,p.input);p.input.shift=false;});
  cast(r,{type:'state',track:TRACK_M,players:r.players.map(p=>({id:p.id,name:p.name,...p.state}))});
  if(r.players.every(p=>p.state.finished)){r.status='finished';cast(r,{type:'results',players:r.players.map(p=>({id:p.id,name:p.name,time:p.state.elapsed})).sort((a,b)=>a.time-b.time)});}
 }
},50);
server.listen(PORT,'0.0.0.0',()=>console.log('High Pedaller listening on',PORT));
const stop=()=>{clearInterval(timer);for(const ws of clients.keys())ws.close(1001,'Restarting');server.close(()=>process.exit(0));setTimeout(()=>process.exit(1),10000).unref();};
process.on('SIGTERM',stop);process.on('SIGINT',stop);
