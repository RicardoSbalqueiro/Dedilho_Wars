import { spawnSync } from 'node:child_process';
const r=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','dist/server/wrangler.json','--persist-to','.wrangler/state'],{stdio:'inherit',env:{...process.env,WRANGLER_SEND_METRICS:'false',WRANGLER_LOG_PATH:'.wrangler/logs'}});process.exit(r.status||0);
