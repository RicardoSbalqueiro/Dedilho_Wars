import {useSyncExternalStore} from 'react';
import {getMobileSettings,subscribeMobileSettings,setMobileSettings} from '../game/mobile-settings';
export function MobileOptions(){
 const p=useSyncExternalStore(subscribeMobileSettings,getMobileSettings);
 return <fieldset className="mobile-options"><legend>CONFORTO E DESEMPENHO</legend><p>Ajustes salvos neste dispositivo.</p>
 <div className="mobile-option-group"><span>Posição do direcional</span><div className="mobile-segment"><button type="button" aria-pressed={p.hand==='right'} onClick={()=>setMobileSettings({hand:'right'})}>À ESQUERDA</button><button type="button" aria-pressed={p.hand==='left'} onClick={()=>setMobileSettings({hand:'left'})}>À DIREITA</button></div></div>
 <label className="mobile-switch"><span>Botões maiores<small>Mais espaço para os polegares.</small></span><input type="checkbox" checked={p.largeButtons} onChange={e=>setMobileSettings({largeButtons:e.target.checked})}/></label>
 <label className="mobile-switch"><span>Vibração ao tocar<small>Quando disponível no aparelho.</small></span><input type="checkbox" checked={p.haptics} onChange={e=>setMobileSettings({haptics:e.target.checked})}/></label>
 <div className="mobile-option-group"><span>Qualidade gráfica</span><div className="mobile-segment"><button type="button" aria-pressed={p.graphics==='auto'} onClick={()=>setMobileSettings({graphics:'auto'})}>AUTOMÁTICA</button><button type="button" aria-pressed={p.graphics==='sharp'} onClick={()=>setMobileSettings({graphics:'sharp'})}>ALTA</button></div><small>Automática prioriza resposta e bateria. Alta oferece mais nitidez.</small></div>
 </fieldset>;
}
