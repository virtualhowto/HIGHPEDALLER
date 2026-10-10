import {randomBytes} from 'node:crypto';
export function newCode(){return Array.from(randomBytes(6),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');}
export function validCode(x){return typeof x==='string'&&/^[A-HJ-NP-Z2-9]{6}$/.test(x.toUpperCase())?x.toUpperCase():null;}
export function cleanName(x){return typeof x==='string'?(x.replace(/[^\p{L}\p{N} _-]/gu,'').trim().slice(0,20)||'Racer'):'Racer';}
export function findRoom(rooms,mode,code){return [...rooms.values()].find(r=>r.mode===mode&&r.status==='waiting'&&r.players.length<2&&(mode!=='private'||r.code===code));}
