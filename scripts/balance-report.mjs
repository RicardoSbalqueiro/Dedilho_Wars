import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
const out='.sites-runtime/balance-report.mjs';
try {
 await build({entryPoints:['scripts/balance-report.ts'],bundle:true,platform:'node',format:'esm',outfile:out});
 const r=spawnSync(process.execPath,[out,...process.argv.slice(2)],{stdio:'inherit'});
 process.exitCode=r.status||0;
}finally{rmSync(out,{force:true})}
