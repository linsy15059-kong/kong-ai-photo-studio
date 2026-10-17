import {env} from 'cloudflare:workers';
import {getDB,AccessError} from './access';
import {normalizeEmail} from './access-rules';
const enc=new TextEncoder();
type RuntimeEnv={AUTH_SESSION_SECRET?:string;API_KEY_ENCRYPTION_SECRET?:string;OWNER_LOGIN_PASSWORD?:string;OWNER_EMAIL?:string};
const runtime=()=>env as Cloudflare.Env & RuntimeEnv;
const secret=()=>{const s=runtime().AUTH_SESSION_SECRET||runtime().API_KEY_ENCRYPTION_SECRET;if(!s)throw new AccessError('登录安全配置未完成，请联系管理员。',503,'auth_secret_missing');return s;};
const b64=(bytes:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
async function digest(value:string){return b64(await crypto.subtle.digest('SHA-256',enc.encode(secret()+':'+value)));}
export async function hashPassword(password:string){return digest(password);}
function token(){return b64(crypto.getRandomValues(new Uint8Array(32)));}
export function sessionToken(cookie:string|null){return cookie?.match(/(?:^|;\s*)studio_session=([^;]+)/)?.[1]||'';}
export async function sessionEmail(cookie:string|null){const t=sessionToken(cookie);if(!t)return null;const row=await getDB().prepare('SELECT email FROM auth_sessions WHERE token_hash=? AND expires_at>?').bind(await digest(t),Math.floor(Date.now()/1000)).first<{email:string}>();return row?.email?normalizeEmail(row.email):null;}
export async function loginWithPassword(email:string,password:string){const normalized=normalizeEmail(email),owner=normalizeEmail(String(runtime().OWNER_EMAIL||''));if(owner&&normalized===owner){const configured=runtime().OWNER_LOGIN_PASSWORD;if(!configured)throw new AccessError('管理员登录密码尚未配置，请联系站点管理员。',503,'owner_password_missing');if((await digest(password))!==(await digest(configured)))throw new AccessError('邮箱或密码不正确。',401,'invalid_credentials');}else{const member=await getDB().prepare('SELECT status,password_hash FROM members WHERE email=?').bind(normalized).first<{status:string;password_hash:string|null}>();if(!member||member.status!=='approved'||!member.password_hash||(await digest(password))!==member.password_hash)throw new AccessError('账号尚未授权，或邮箱与密码不正确。',401,'invalid_credentials');}const t=token(),now=Math.floor(Date.now()/1000);await getDB().prepare('INSERT INTO auth_sessions(token_hash,email,created_at,expires_at) VALUES(?,?,?,?)').bind(await digest(t),normalized,new Date().toISOString(),now+60*60*24*30).run();return t;}
