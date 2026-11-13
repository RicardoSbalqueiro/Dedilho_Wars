import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseSenbukanBuild} from '../src/game/senbukan-test';
const prepared={state:'prepared',engine:'unity',entry:null};
assert.deepEqual(parseSenbukanBuild(prepared),prepared);
assert.equal(parseSenbukanBuild({state:'ready',engine:'unity',entry:'/senbukan/unity/index.html'}),null,'a ready build requires actual build metadata');
const ready={state:'ready',engine:'unity',entry:'/senbukan/unity/index.html',builtAtUtc:'2026-11-13T12:00:00Z'};
assert.deepEqual(parseSenbukanBuild(ready),ready);
for(const entry of ['https://example.com/unity','javascript:alert(1)','//example.com','/senbukan/unity/../index.html','/index.html'])assert.equal(parseSenbukanBuild({...ready,entry}),null);
for(const bad of [null,[],{},'ready',{...ready,engine:'three'},{...ready,builtAtUtc:'invalid'},{...prepared,entry:'/senbukan/unity/index.html'}])assert.equal(parseSenbukanBuild(bad),null);
assert.deepEqual(parseSenbukanBuild(JSON.parse(readFileSync('public/senbukan/build.json','utf8'))),prepared,'this release contains no Unity build');
for(const name of ['Caetano','DojoStudent','DojoSenbukan']){
 const f=readFileSync('unity/SenbukanPrototype/Assets/Senbukan/Art/'+name+'.fbx');assert(f.subarray(0,18).toString().startsWith('Kaydara FBX Binary'));
}
for(const name of ['dojo_senbukan','fighters_senbukan'])assert(readFileSync('blender/'+name+'.blend').subarray(0,7).toString()==='BLENDER');
console.log('Senbukan: Unity build gate rejects unsafe/stale entries; prepared status and authored Blender/FBX sources verified. Unity execution remains pending.');
