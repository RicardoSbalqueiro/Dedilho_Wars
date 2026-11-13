export interface SenbukanBuild {state:'prepared'|'ready';engine:'unity';entry:string|null;builtAtUtc?:string}
export function parseSenbukanBuild(value:unknown):SenbukanBuild|null{
 if(!value||typeof value!=='object')return null;const v=value as Record<string,unknown>;
 if(v.engine!=='unity')return null;
 if(v.state==='prepared'&&v.entry===null)return {state:'prepared',engine:'unity',entry:null};
 if(v.state==='ready'&&v.entry==='/senbukan/unity/index.html'&&typeof v.builtAtUtc==='string'&&Number.isFinite(Date.parse(v.builtAtUtc)))return {state:'ready',engine:'unity',entry:v.entry,builtAtUtc:v.builtAtUtc};
 return null;
}
