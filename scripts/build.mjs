import { build } from 'esbuild';
import { rmSync,mkdirSync,copyFileSync,writeFileSync,readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
rmSync('dist',{recursive:true,force:true});
const r=spawnSync(process.execPath,['node_modules/vite/bin/vite.js','build'],{stdio:'inherit'});if(r.status!==0)process.exit(r.status||1);
// Three.js embeds shader literals; normalize generated line endings for source review.
const htmlPath='dist/client/index.html';writeFileSync(htmlPath,readFileSync(htmlPath,'utf8').replace(/[ \t]+(?=\r?\n)/g,''));
mkdirSync('dist/server',{recursive:true});mkdirSync('dist/.openai',{recursive:true});
await build({entryPoints:['worker/index.js'],outfile:'dist/server/index.js',bundle:true,format:'esm',platform:'browser',target:'es2022'});copyFileSync('.openai/hosting.json','dist/.openai/hosting.json');
const manifest=JSON.parse(readFileSync('.openai/hosting.json','utf8'));
writeFileSync('dist/server/wrangler.json',JSON.stringify({name:'dedilho-wars',main:'index.js',compatibility_date:'2025-10-01',assets:{directory:'../client',binding:'ASSETS',not_found_handling:'single-page-application',run_worker_first:['/api/*']},d1_databases:[{binding:'DB',database_name:'dedilho-wars',database_id:'00000000-0000-0000-0000-000000000001',migrations_dir:'../../drizzle'}]},null,2));
if(manifest.static)throw new Error('Worker manifest must not contain static.directory');
console.log('Built Worker API, client assets and D1 configuration.');
