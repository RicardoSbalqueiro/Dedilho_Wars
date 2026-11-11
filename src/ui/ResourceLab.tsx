import {useState} from 'react';
import type {RefObject} from 'react';
import type {Game} from '../game/engine';
import {FORMS,RESOURCE_RULES,canTransform,formStats} from '../game/resources';
import {keyLabel} from '../game/input';
export function ResourceLab({gameRef}:{gameRef:RefObject<Game|null>}){
 const [,refresh]=useState(0),g=gameRef.current;
 if(!g)return null;
 const refill=()=>{
  for(const f of g.f){f.meter=200;f.stamina=120;f.exhaustT=f.staminaDelay=0;
   // Training tools obey Rick's non-rechargeable transformation rule too.
   if(f.formT===0&&f.formStartup===0){f.energy=100;f.blood=3;f.battery=100;}
  }refresh(v=>v+1);
 };
 return <section className="resource-lab"><h3>RECURSOS · WAR OF CHAMPIONS</h3>
  <p>HP dobrou sem dobrar o dano base. ULT custa 100; guardar 200 libera uma transformação. Ataques, dashes, saltos e bloqueios gastam fôlego. Exausto mantém defesa e golpes leves.</p>
  <p>Transformar tem 36 frames de preparação interrompível e 72 frames de compromisso. Nenhuma invulnerabilidade gratuita. A forma termina pelo tempo, stamina ou recurso próprio.</p>
  <div className="frame-comparison">{g.f.map(f=>{const form=FORMS[f.ch],stats=formStats(f);return <article className="frame-comparison-card" key={f.idx} style={{borderColor:f.def.color}}>
   <h3>P{f.idx+1} · {f.def.name}</h3><p>HP: {Math.ceil(f.hp)} / {f.maxHp} · ULT: {Math.floor(f.meter)}/200</p><p>Fôlego: {Math.ceil(f.stamina)} / {RESOURCE_RULES.staminaMax} · Exaustão: {(f.exhaustT/60).toFixed(1)}s</p>
   <h4>{form.name}</h4><p>{form.cost} · até {form.duration/60}s</p><p>{form.help}</p><p>Ativação: {keyLabel(g.cfg.bindings[f.idx].transform[0])} / FORMA · {canTransform(f)?'DISPONÍVEL':'aguarde estado e recursos legais'}</p>
   <p>Forma: {(f.formT/60).toFixed(1)}s · Recuperação: {(f.aftermathT/60).toFixed(1)}s · Dano ×{stats.damage} · Movimento ×{stats.speed} · Dano recebido ×{stats.defense}</p>
   {f.ch==='rickzera'&&<p>Energia independente: {Math.floor(f.energy)}/100. Segure {keyLabel(g.cfg.bindings[f.idx].charge[0])} / CARREGAR em neutro. Não pode recarregar durante Cruz de Energia, nem com este painel.</p>}
   {f.ch==='ulisses'&&<p>Sangue: {f.blood}/3 · Presas capturam um estoque. A regeneração consome um a cada 5 segundos.</p>}
   {f.ch==='jane'&&<p>Bateria: {Math.ceil(f.battery)}% · EVA amplia a área que pode ser atingida e dispara lasers com ESP 1/2.</p>}
  </article>})}</div>
  <button type="button" onClick={refill}>ABASTECER RECURSOS NO TREINO</button><p>Apenas no treinamento offline. O painel pausa a simulação; volte ao treino e use os comandos normais. Valores de custo/duração são experimentais e ficam em resources.ts.</p>
 </section>;
}
