import {SenbukanGame} from './SenbukanGame';

/** The campaign card opens the playable browser arena. Unity sources remain separate. */
export function SenbukanTestArea({onBack}:{onBack:()=>void}){
 return <SenbukanGame onBack={onBack}/>;
}
