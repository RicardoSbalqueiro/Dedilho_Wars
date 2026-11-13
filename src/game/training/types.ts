import type {CharId} from '../data';
import type {TrainingNpcId} from './npc';
import type {StageId} from '../stage';
export type TrainingTier=0|1|2|3|4|5|6;
export type AIStyle='aggressive'|'defensive'|'technical'|'unpredictable'|'adaptive';
export type TrainingSection='academy'|'challenges'|'circuit'|'mastery'|'lab'|'progress';
export type Grade='D'|'C'|'B'|'A'|'S';
export type TrainingKind='lesson'|'challenge'|'tower'|'exam'|'mastery'|'combo'|'rival';
export type Category='Fundamentos'|'Ofensiva'|'Defensiva'|'Recursos'|'Sobrevivência'|'Maestria';
export type Metric='walk'|'jump'|'dash'|'turn'|'crouch'|'hits'|'normalHits'|'specialHits'|'uniqueSpecials'|'lowHits'|'airHits'|'headHits'|'grabs'|'damage'|'blocks'|'perfects'|'lowBlocks'|'antiAir'|'punishes'|'guardBreaks'|'bestCombo'|'comboUlt'|'superHits'|'forms'|'formHits'|'staminaRecovered'|'energyCharged'|'resourceRecovered'|'cooldowns'|'route'|'wins'|'activeTicks';
export interface Goal {metric:Metric;target:number}
export interface Activity {
 id:string;title:string;description:string;hint:string;kind:TrainingKind;section:TrainingSection;category:Category;goals:Goal[];
 tier:TrainingTier;style:AIStyle;opponent:CharId;character?:CharId;stage:StageId;finite:boolean;xp:number;unique?:boolean;
 evaluation:'mobility'|'precision'|'defense'|'resource'|'combo'|'combat'|'survival';maxTicks:number;
 script?:'punch'|'low'|'mixed'|'air'|'whiff'|'projectile'|'guard';meter?:number;distance?:number;health?:number;
 constraints?:{noSpecial?:boolean;noExhaust?:boolean;noDamage?:boolean;maxDamage?:number;minHp?:number;noForm?:boolean};
 npc?:TrainingNpcId;floor?:number;boss?:boolean;exam?:number;routeId?:string;
}
export interface LabConfig {dummy:'idle'|'aggressive'|'defensive'|'adaptive'|'script'|'p2'|'record'|'playback';hp:number;heal:boolean;stamina:boolean;meter:number;resource:number;guard:'normal'|'hold'|'low';distance:number;side:0|1;script:'punch'|'low'|'mixed'|'air'|'whiff'|'projectile'|'guard';tier:TrainingTier}
export interface TrainingSpec {activityId:string;p1:CharId;p2?:CharId;npc?:TrainingNpcId;stage?:StageId;style?:AIStyle;seed:number;version:string;lab?:LabConfig;verifiedSession?:string}
export interface CombatEvent {type:'start'|'hit'|'block'|'jump'|'free'|'whiff'|'damage'|'chip'|'guardBreak'|'super'|'metric';tick:number;actor:0|1;target:0|1;move:string;serial:number;amount:number;hits:number;combo:string;low:boolean;air:boolean;targetAir:boolean;perfect:boolean;metric?:string;token?:string}
export type InputSlice=[ticks:number,held:number,pressed:number];
export interface TrainingMetrics extends Record<Metric,number>{attempts:number;connected:number;whiffs:number;damageTaken:number;staminaUsed:number;exhausts:number;specialStarts:number;formStarts:number;minHp:number;enemyStarts:number;winStreak:number}
export interface TrainingResult {id:string;activityId:string;character:CharId;opponent:CharId;success:boolean;reason:string;grade:Grade;score:number;metrics:TrainingMetrics;breakdown:{label:string;value:number;help:string}[];recommendations:string[];activeSeconds:number;at:number;xp:number;masteryGained:number;promoted:boolean;verified:boolean;rewardNote?:string}
export interface Completion {count:number;wins:number;best:Grade;score:number;first:number;last:number}
export interface RivalRecord {character:CharId;tier:TrainingTier;style:AIStyle;wins:number;losses:number;streak:number;best:number;last:string}
export interface RotationMission {id:string;title:string;start:number;end:number;target:number;metric:'veteranWins'|'defense'|'characters'|'gradeA'|'bosses'|'streak';xp:number;period:'daily'|'weekly'}
export interface MissionProgress {value:number;chars:CharId[];claimed:boolean}
export interface TrainingProgress {version:1;revision:number;xp:number;rank:number;exams:string[];completions:Record<string,Completion>;mastery:Partial<Record<CharId,number>>;uses:Partial<Record<CharId,number>>;history:TrainingResult[];tower:number;streak:number;bestStreak:number;rivals:Partial<Record<CharId,RivalRecord>>;missions:Record<string,MissionProgress>;rewards:string[];repeatDay:string;repeatXp:number;repeatCount:Record<string,number>;activeSeconds:number;legacy:string[]}
export interface TrainingAccount {progress:TrainingProgress;accountXp:number;trainingXp:number;username:string;missions:RotationMission[]}
