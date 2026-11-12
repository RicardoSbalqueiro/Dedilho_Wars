import assert from 'node:assert/strict';
import {canvasSize} from '../src/game/canvas';
import {PaintCadence,normalizeMobileSettings,DEFAULT_MOBILE_SETTINGS} from '../src/game/mobile-settings';
import {FrameTimer} from '../src/game/timing';
import {touchInput} from '../src/game/touch';
let cases=0;function test(name:string,fn:()=>void){try{fn();cases++}catch(cause){throw new Error(name,{cause})}}
for(const [w,h,dpr]of [[320,180,3],[360,202.5,3],[390,219.375,3],[430,241.875,3],[693,390,3],[960,540,2],[1024,576,2]])test(`mobile ${w}px DPR${dpr}: bounded native backing pixels with unchanged world geometry`,()=>{
 const auto=canvasSize(960,540,w,h,dpr,'scene','auto'),high=canvasSize(960,540,w,h,dpr,'scene','sharp');
 assert(auto.width>=960&&auto.width<=1920);assert(auto.width*auto.height<=1920*1080);assert(Math.abs(auto.width/auto.height-16/9)<.004);assert(auto.width<=high.width);assert(high.width<=2880);
 assert.equal(auto.scaleX,auto.width/960);assert.equal(auto.scaleY,auto.height/540);
});
test('portrait auto avoids forced Full HD oversampling while desktop retains 4K',()=>{
 const auto=canvasSize(960,540,390,219.375,3,'scene','auto'),desktop=canvasSize(960,540,390,219.375,3,'scene');assert.equal(auto.width,1170);assert(auto.width*auto.height<desktop.width*desktop.height*.4);assert.equal(canvasSize(960,540,3840,2160,1,'scene').width,3840);
});
for(const rate of [5,30,60,90,120,144,240])for(const cap of [30,60])test(`${rate}Hz: ${cap}fps drawing never changes 600 simulation ticks or drifts at90Hz`,()=>{
 const clock=new FrameTimer(),paint=new PaintCadence(cap);let ticks=0,draws=0;
 for(let i=0;i<=rate*10;i++){const now=i*1000/rate;ticks+=clock.sample(now);if(paint.due(now))draws++;}
 assert.equal(ticks,600);assert(Math.abs(draws-(Math.min(rate,cap)*10+1))<=1,JSON.stringify({rate,cap,draws}));
});
test('render cadence accepts resume and invalid clocks without a paint burst',()=>{const c=new PaintCadence(30);assert(!c.due(NaN));assert(c.due(0));assert(!c.due(1));assert(c.due(30000));assert(!c.due(30001));assert(c.due(0))});
test('bad, old and unavailable mobile preferences retain safe defaults',()=>{for(const raw of [null,[],undefined,{hand:'up',largeButtons:'yes',haptics:1,graphics:'ultra'}])assert.deepEqual(normalizeMobileSettings(raw),DEFAULT_MOBILE_SETTINGS);assert.deepEqual(normalizeMobileSettings({hand:'left',largeButtons:true,haptics:true,graphics:'sharp'}),{hand:'left',largeButtons:true,haptics:true,graphics:'sharp'})});
test('independent fingers keep low guard and diagonals until their own release/cancel; a quick tap remains buffered',()=>{
 touchInput.clear();touchInput.set(10,['down','left']);touchInput.set(11,['block']);touchInput.set(12,['p']);touchInput.set(12,[]);assert(touchInput.held.has('block')&&touchInput.held.has('down')&&touchInput.held.has('left'));assert(touchInput.consume().includes('p'));touchInput.set(11,[]);assert(touchInput.held.has('down')&&!touchInput.held.has('block'));touchInput.clear();assert.equal(touchInput.held.size,0);assert.equal(touchInput.pressed.size,0);
});
console.log(`Mobile: ${cases} regressions passed (native-pixel budget, 30/60Hz drawing independent of simulation, settings and simultaneous fingers).`);
