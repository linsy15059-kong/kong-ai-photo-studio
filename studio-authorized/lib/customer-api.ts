import {env} from 'cloudflare:workers';
import {getDB,AccessError} from './access';

const enc=new TextEncoder();
const b64=(bytes:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const bytes=(value:string)=>{const s=value.replace(/-/g,'+').replace(/_/g,'/');const padded=s+'='.repeat((4-s.length%4)%4);return Uint8Array.from(atob(padded),c=>c.charCodeAt(0));};
function secret(){const s=(env as Cloudflare.Env & {API_KEY_ENCRYPTION_SECRET?:string}).API_KEY_ENCRYPTION_SECRET;if(!s)throw new AccessError('客户密钥加密服务未配置，请联系管理员。',503,'key_encryption_unavailable');return s;}
async function cryptoKey(){const digest=await crypto.subtle.digest('SHA-256',enc.encode(secret()));return crypto.subtle.importKey('raw',digest,{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function encryptCustomerKey(value:string){const iv=crypto.getRandomValues(new Uint8Array(12)),key=await cryptoKey(),cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,enc.encode(value));return [b64(iv),b64(cipher)].join('.');}
export async function decryptCustomerKey(value:string){const [ivText,cipherText]=value.split('.');if(!ivText||!cipherText)throw new AccessError('客户密钥记录无效。',503,'key_record_invalid');const key=await cryptoKey();const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(ivText)},key,bytes(cipherText));return new TextDecoder().decode(plain);}
export async function saveCustomerKey(email:string,key:string,model:string){await getDB().prepare(`INSERT INTO customer_api_keys(email,encrypted_key,model,updated_at) VALUES(?,?,?,?) ON CONFLICT(email) DO UPDATE SET encrypted_key=excluded.encrypted_key,model=excluded.model,updated_at=excluded.updated_at`).bind(email,await encryptCustomerKey(key),model,new Date().toISOString()).run();}
export async function clearCustomerKey(email:string){await getDB().prepare('DELETE FROM customer_api_keys WHERE email=?').bind(email).run();}
export async function customerKeyStatus(email:string){const row=await getDB().prepare('SELECT model,updated_at FROM customer_api_keys WHERE email=?').bind(email).first<{model:string;updated_at:string}>();return {configured:!!row,model:row?.model||'gpt-image-2',updatedAt:row?.updated_at||''};}
export async function customerCredentials(email:string){const row=await getDB().prepare('SELECT encrypted_key,model FROM customer_api_keys WHERE email=?').bind(email).first<{encrypted_key:string;model:string}>();if(!row)throw new AccessError('请先在「API设置」中配置你自己的 API Key。',400,'api_key_required');return {key:await decryptCustomerKey(row.encrypted_key),model:row.model||'gpt-image-2'};}
