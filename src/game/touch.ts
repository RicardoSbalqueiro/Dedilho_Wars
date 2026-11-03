import type { Action } from './input';
// Independent from physical keys, so releasing a finger never releases a keyboard key.
const pointers=new Map<number,Action[]>();
export const touchInput={
 held:new Set<Action>(),
 pressed:new Set<Action>(),
 set(id:number,actions:Action[]){const before=this.held;for(const a of actions)if(!before.has(a))this.pressed.add(a);if(actions.length)pointers.set(id,actions);else pointers.delete(id);this.held=new Set([...pointers.values()].flat())},
 consume(){const out=[...this.pressed];this.pressed.clear();return out},
 clear(){pointers.clear();this.held.clear();this.pressed.clear()},
};
