import {build} from 'esbuild';
import {spawnSync} from 'node:child_process';
import {mkdirSync,rmSync} from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});const out='.sites-runtime/animation-report.mjs';
try{await build({entryPoints:['scripts/animation-report.ts'],bundle:true,platform:'node',format:'esm',outfile:out});const r=spawnSync(process.execPath,[out,...process.argv.slice(2)],{stdio:'inherit'});if(r.status!==0)process.exitCode=r.status||1;}finally{rmSync(out,{force:true});}
