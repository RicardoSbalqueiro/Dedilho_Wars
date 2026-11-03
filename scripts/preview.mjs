import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
mkdirSync('.sites-runtime/config',{recursive:true});mkdirSync('.wrangler/logs',{recursive:true});
const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js','dev','--local','--config','dist/server/wrangler.json','--ip','127.0.0.1','--port','8787','--persist-to','.wrangler/state'],{stdio:'inherit',env:{...process.env,XDG_CONFIG_HOME:resolve('.sites-runtime/config'),WRANGLER_LOG_PATH:resolve('.wrangler/logs'),WRANGLER_SEND_METRICS:'false',CLOUDFLARE_CF_FETCH_ENABLED:'false'}});
for(const event of ['SIGTERM','SIGINT'])process.on(event,()=>child.kill(event));
child.on('exit',code=>process.exit(code||0));
