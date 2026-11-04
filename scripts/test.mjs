import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync,rmSync } from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
try {
 await build({entryPoints:['tests/combat.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/combat-test.mjs'});
 await build({entryPoints:['tests/challenges.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/challenges-test.mjs'});
 await build({entryPoints:['tests/expansion.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/expansion-test.mjs'});
 await build({entryPoints:['tests/viewers.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/viewers-test.mjs'});
 for(const path of ['.sites-runtime/combat-test.mjs','.sites-runtime/challenges-test.mjs','.sites-runtime/expansion-test.mjs','.sites-runtime/viewers-test.mjs','tests/api.test.mjs']){const r=spawnSync(process.execPath,[path],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
} finally {rmSync('.sites-runtime/combat-test.mjs',{force:true})}
