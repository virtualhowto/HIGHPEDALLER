import test from 'node:test';import assert from 'node:assert/strict';import {newCode,validCode,cleanName,findRoom} from './rooms.js';
test('codes validate',()=>assert.equal(validCode(newCode())?.length,6));
test('invalid codes rejected',()=>assert.equal(validCode('!bad'),null));
test('names sanitized',()=>assert.equal(cleanName('<bad>'),'bad'));
test('private and public rooms separate',()=>{const rooms=new Map([['a',{mode:'private',code:'ABCDEF',status:'waiting',players:[]}]]);assert.equal(findRoom(rooms,'public'),undefined);});
