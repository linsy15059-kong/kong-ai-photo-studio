export const normalizeEmail=(email:string)=>email.trim().toLowerCase();
export const isGmail=(email:string)=>/^[a-z0-9](?:[a-z0-9._%+-]*[a-z0-9])?@gmail\.com$/.test(normalizeEmail(email))&&email.length<=254;
export type Member={email:string;name:string;status:string;daily_limit:number;created_at:string;updated_at:string;granted_by:string;note:string};
export function canUse(email:string,ownerEmail:string,member:Member|null){const e=normalizeEmail(email),owner=normalizeEmail(ownerEmail);return !!e&&!!owner&&(e===owner||(isGmail(e)&&member?.email===e&&member.status==='approved'));}
export function isOwner(email:string,ownerEmail:string){return !!ownerEmail.trim()&&normalizeEmail(email)===normalizeEmail(ownerEmail);}
export function chinaDay(now=new Date()){return new Date(now.getTime()+8*3600000).toISOString().slice(0,10);}
export function validLimit(value:unknown){return typeof value==='number'&&Number.isInteger(value)&&value>=0&&value<=1000;}
