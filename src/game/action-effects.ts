import type {CharId} from './data';
import {actionAtlasManifest,drawActionProp} from './action-atlas';

export function drawIllustratedEffect(c:CanvasRenderingContext2D,name:string,time:number,x:number,y:number,width:number,height:number,progress?:number):boolean{
 const clip=actionAtlasManifest().clips['fx/'+name];if(!clip)return false;
 const index=progress===undefined?((Math.floor(time/3)%clip.frames.length)+clip.frames.length)%clip.frames.length:Math.min(clip.frames.length-1,Math.floor(Math.max(0,Math.min(1,progress))*clip.frames.length));
 c.save();c.imageSmoothingEnabled=true;const drawn=drawActionProp(c,clip.atlas,clip.frames[index],x,y,width,height);c.restore();return drawn;
}
const FX:Record<string,[string,number,number]>={
 energy:['rick-orbs',76,60],energyFist:['rick-fist',92,65],rat:['bieu-rat',58,37],spray:['bieu-paint',100,80],roach:['aneninha-roach',74,45],
 burger:['nomad-burger',76,68],boomerang:['nomad-boomerang',78,58],mic:['renngotti-mic',65,65],shout:['renngotti-shout',110,145],
 math:['jao-formula',110,84],formula:['jao-formula',110,84],ball:['jao-ball',65,65],basketball:['jao-ball',65,65],java:['jane-java',100,56],ecg:['eneas-ecg',112,65],five:['eneas-56',62,70],six:['eneas-56',62,70],
 heart:['gabriel-kiss',65,65],wink:['gabriel-wink',57,57],blood:['ulisses-blood',92,68],sound:['felipence-note',75,93],territory:['hdsh-go',210,90],trend:['hdsh-trend',88,76],drop:['hdsh-drop',94,116],laser:['jane-laser',115,60],
};
/** Only paints the projectile's own existing world position. It cannot create a
 * projectile, extend its life, change its hitbox or cause an additional hit. */
export function drawProjectileIllustration(c:CanvasRenderingContext2D,kind:string,age:number,ch?:CharId):boolean{
 const spec=FX[kind];if(!spec||kind==='drop'&&age<30)return false;
 let [name,w,h]=spec;if(kind==='spray'&&ch==='aneninha')name='aneninha-paint';
 return drawIllustratedEffect(c,name,age,-w/2,-h/2,w,h);
}
