import {api} from '../../online/api';
import {TRAINING_VERSION} from './catalog';
import type {Activity,TrainingAccount,TrainingResult,TrainingSpec,InputSlice} from './types';
import type {CharId} from '../data';
export const trainingAccount=(signal?:AbortSignal)=>api<TrainingAccount>('/training',undefined,signal);
export const authorizeTraining=(a:Activity,p1:CharId)=>api<{id:string;spec:TrainingSpec;expires:number}>('/training/start',{activityId:a.id,p1});
export const submitTraining=(id:string,inputs:InputSlice[])=>api<{result:TrainingResult;duplicate:boolean}>(`/training/${id}/submit`,{inputs});
export const abandonTraining=(id:string)=>api(`/training/${id}/abandon`,{});
export function localSpec(activityId:string,p1:CharId):TrainingSpec{
 const seed=crypto.getRandomValues(new Uint32Array(1))[0];return {activityId,p1,seed,version:TRAINING_VERSION};
}
