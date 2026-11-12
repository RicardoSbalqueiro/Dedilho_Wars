import assert from 'node:assert/strict';
import {menuBrawlFrame} from '../src/game/menu-brawl';
import {CHAR_IDS,CHARS} from '../src/game/data';
import {CAMPAIGNS} from '../src/game/campaigns';
import {FORMS} from '../src/game/resources';
import {selectAnimeSpriteFrame} from '../src/game/anime-sprite';
import {AudioEngine} from '../src/game/audio';
let cases=0;
function test(name:string,fn:()=>void){try{fn();cases++}catch(cause){throw new Error(name,{cause})}}
const baseline=JSON.stringify(CHARS),rivals=new Map(CHAR_IDS.map(ch=>[ch,new Set<string>()]));
test('whole roster shares one ground plane through a changing free-for-all, never Ultimates or aerial poses',()=>{
 for(let t=0;t<3600;t+=7)for(const rally of [false,true]){
  const actors=menuBrawlFrame(t,rally);assert.deepEqual(actors.map(a=>a.ch),CHAR_IDS);assert.equal(new Set(actors.map(a=>a.ch)).size,18);
  for(const a of actors){assert.equal(a.y,470);assert.equal(a.move.kind,'normal');assert(!a.move.air&&!a.move.grab);assert.notEqual(a.target,a.ch);assert(a.x>=0&&a.x<=960);assert(!a.options.spriteAir);
   assert.notEqual(selectAnimeSpriteFrame(CHARS[a.ch].poses.idle,a.options),8);assert.equal(a.form,a.formAge<FORMS[a.ch].duration);rivals.get(a.ch)!.add(a.target);
  }
 }
 for(const r of rivals.values())assert(r.size>=3,'rivals change, rather than fixed duels');assert.equal(JSON.stringify(CHARS),baseline);
});
test('menu samples are deterministic at the same time and reject invalid clocks',()=>{assert.deepEqual(menuBrawlFrame(300),menuBrawlFrame(300));assert.deepEqual(menuBrawlFrame(NaN),menuBrawlFrame(0));assert.deepEqual(menuBrawlFrame(-20),menuBrawlFrame(0));assert.deepEqual(menuBrawlFrame(Infinity),menuBrawlFrame(0))});
test('four named campaign placeholders and distinct illustrated rear views',()=>{
 assert.deepEqual(CAMPAIGNS.map(c=>[c.fighter,c.title]),[['Karatê Caetano','Senbukan'],['Rickzera','Resenha'],['Renngotti','Got'],['Bieubatman','Campeões']]);assert(CAMPAIGNS.every(c=>c.status==='Em breve'&&c.pose.startsWith('De costas')));assert.equal(new Set(CAMPAIGNS.map(c=>c.art)).size,4);
});

class FakeAudio {
 static all:FakeAudio[]=[];src='';currentTime=0;duration=150;volume=1;paused=true;loop=false;preload='';
 private listeners=new Map<string,(()=>void)[]>();
 constructor(src=''){this.src=src;FakeAudio.all.push(this)}
 addEventListener(type:string,fn:()=>void){this.listeners.set(type,[...(this.listeners.get(type)||[]),fn])}
 emit(type:string){for(const fn of this.listeners.get(type)||[])fn()}
 getAttribute(name:string){return name==='src'?this.src:null}
 play(){this.paused=false;this.emit('playing');return Promise.resolve()}
 pause(){this.paused=true;this.emit('pause')}
}
(globalThis as any).Audio=FakeAudio;
(globalThis as any).window={setInterval(){return 0}};
let saved:string|null=null;
(globalThis as any).localStorage={getItem:()=>saved,setItem:(_key:string,value:string)=>{saved=value}};
const fresh=()=>{saved=null;return new AudioEngine()};
test('campaign overrides selected radio, locks every switching control, preserves volume and restores prior track/time',()=>{
 const a=fresh();a.music('menu');a.selectRadio('caetano');const prior=FakeAudio.all.at(-1)!;prior.currentTime=37;
 prior.emit('waiting');a.startCampaignMusic();const theme=FakeAudio.all.at(-1)!;assert(theme.src.includes('campaign-theme'));assert(theme.loop&&!theme.paused&&prior.paused);
 a.selectRadio('sofa');a.nextRadio();a.toggleRadio();a.seekRadio(99);a.music('fight');assert.equal(a.getRadioSnapshot().station,'caetano');assert.equal(prior.currentTime,37);assert(!theme.paused);
 a.setSettings({music:.21});assert.equal(theme.volume,.21);assert.equal(prior.volume,.21);
 prior.emit('playing');assert(prior.paused,'late radio playing event cannot overlap the campaign');
 a.stopCampaignMusic();assert(theme.paused);assert(!prior.paused);assert.equal(prior.currentTime,37);assert.equal(a.getRadioSnapshot().station,'caetano');assert(!a.getCampaignMusicSnapshot().active);
});
test('leaving campaign respects previously paused radio and a late theme callback cannot restart it',()=>{
 const a=fresh();a.selectRadio('sofa');a.toggleRadio();const prior=FakeAudio.all.at(-1)!;assert(prior.paused);
 a.startCampaignMusic();const theme=FakeAudio.all.at(-1)!;assert(!theme.paused);a.stopCampaignMusic();assert(theme.paused&&prior.paused);theme.emit('playing');assert(theme.paused);assert(!a.getCampaignMusicSnapshot().active);
});
console.log(`Living menus: ${cases} cases passed (18 grounded fighters, changing rivals, normal-only attacks, forms, campaign placeholders and exclusive/restored audio).`);
