import { build } from 'esbuild';
import { spawnSync } from 'node:child_process';
import { mkdirSync,rmSync } from 'node:fs';
mkdirSync('.sites-runtime',{recursive:true});
try {
 await build({entryPoints:['tests/combat.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/combat-test.mjs'});
 await build({entryPoints:['tests/challenges.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/challenges-test.mjs'});
 await build({entryPoints:['tests/expansion.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/expansion-test.mjs'});
 await build({entryPoints:['tests/viewers.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/viewers-test.mjs'});
 await build({entryPoints:['tests/trio.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/trio-test.mjs'});
 await build({entryPoints:['tests/responsiveness.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/responsiveness-test.mjs'});
 await build({entryPoints:['tests/turn-defense.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/turn-defense-test.mjs'});
 await build({entryPoints:['tests/ultimate-clash.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/ultimate-clash-test.mjs'});
 await build({entryPoints:['tests/balance.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/balance-test.mjs'});
 await build({entryPoints:['tests/combos.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/combos-test.mjs'});
 await build({entryPoints:['tests/animation.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/animation-test.mjs'});
 await build({entryPoints:['tests/timing.test.ts'],bundle:true,platform:'node',format:'esm',outfile:'.sites-runtime/timing-test.mjs'});
 for(const path of ['.sites-runtime/combat-test.mjs','.sites-runtime/challenges-test.mjs','.sites-runtime/expansion-test.mjs','.sites-runtime/viewers-test.mjs','.sites-runtime/trio-test.mjs','.sites-runtime/responsiveness-test.mjs','.sites-runtime/turn-defense-test.mjs','.sites-runtime/ultimate-clash-test.mjs','.sites-runtime/balance-test.mjs','.sites-runtime/combos-test.mjs','.sites-runtime/animation-test.mjs','.sites-runtime/timing-test.mjs','tests/api.test.mjs']){const r=spawnSync(process.execPath,[path],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1)}
} finally {rmSync('.sites-runtime/combat-test.mjs',{force:true})}
