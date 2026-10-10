import test from 'node:test';import assert from 'node:assert/strict';import {advance,initialState,TRACK_M} from './physics.js';
test('starts at rest',()=>assert.equal(initialState().speed,0));
test('throttle accelerates',()=>assert.ok(advance(initialState(),{throttle:true}).speed>0));
test('coasting cannot create speed',()=>assert.equal(advance(initialState(),{throttle:false}).speed,0));
test('invalid step rejected',()=>assert.throws(()=>advance(initialState(),{},undefined,1)));
test('finish crosses at exactly quarter mile',()=>{const s=advance({...initialState(),distance:TRACK_M-.2,speed:60},{throttle:true});assert.equal(s.distance,TRACK_M);assert.ok(s.finished);});
test('finished state is immutable',()=>{const s={...initialState(),finished:true};assert.deepEqual(advance(s,{throttle:true}),s);});
