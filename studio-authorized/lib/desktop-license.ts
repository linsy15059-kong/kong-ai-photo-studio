import {getDB,ownerEmail,AccessError} from './access';
export const LEASE_SECONDS=90;
export const hashSecret=async(value:string)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const randomSecret=()=>Array.from(crypto.getRandomValues(new Uint8Array(32))).map(x=>x.toString(16).padStart(2,'0')).join('');
export const nowSeconds=()=>Math.floor(Date.now()/1000);
export const leaseSQL=`INSERT INTO desktop_slots(email,slot,device_id,expires_at)
 SELECT ?,s.slot,?,? FROM (SELECT 1 AS slot UNION ALL SELECT 2) s
 LEFT JOIN desktop_slots l ON l.email=? AND l.slot=s.slot
 WHERE l.email IS NULL OR l.expires_at<=? OR l.device_id=?
 ORDER BY CASE WHEN l.device_id=? THEN 0 ELSE 1 END,s.slot LIMIT 1
 ON CONFLICT(email,slot) DO UPDATE SET device_id=excluded.device_id,expires_at=excluded.expires_at
 WHERE desktop_slots.expires_at<=? OR desktop_slots.device_id=excluded.device_id RETURNING slot`;
export type DesktopSession={token_hash:string;email:string;device_id:string;name:string;expires_at:number};
export async function desktopSession(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer /,'')||'';if(!/^[a-f0-9]{64}$/.test(token))throw new AccessError('请重新登录桌面软件。',401,'desktop_login_required');const session=await getDB().prepare(`SELECT d.* FROM desktop_devices d JOIN commercial_licenses l ON l.email=d.email WHERE d.token_hash=? AND d.expires_at>? AND l.status='active' AND l.version='1' AND l.activated_at IS NOT NULL AND (d.email=? OR EXISTS(SELECT 1 FROM members m WHERE m.email=d.email AND m.status='approved'))`).bind(await hashSecret(token),nowSeconds(),ownerEmail()).first<DesktopSession>();if(!session)throw new AccessError('软件授权已失效、被停用或登录已过期，请重新登录。',401,'desktop_unauthorized');return session;}
export async function acquireLease(s:DesktopSession){const n=nowSeconds();const slot=await getDB().prepare(leaseSQL).bind(s.email,s.device_id,n+LEASE_SECONDS,s.email,n,s.device_id,s.device_id,n).first();if(!slot)throw new AccessError('已有两台设备同时使用，请先退出其中一台，或在设备管理中退出旧设备。',409,'device_limit');return slot;}
export async function requireLease(s:DesktopSession){const active=await getDB().prepare('SELECT slot FROM desktop_slots WHERE email=? AND device_id=? AND expires_at>?').bind(s.email,s.device_id,nowSeconds()).first();if(!active)throw new AccessError('当前设备未占用在线名额，请连接网络并重新进入工作台。',409,'device_lease_expired');}
export async function devicesFor(email:string){return (await getDB().prepare('SELECT d.device_id,d.name,d.created_at,MAX(COALESCE(s.expires_at,0)) AS lease_until FROM desktop_devices d LEFT JOIN desktop_slots s ON s.email=d.email AND s.device_id=d.device_id WHERE d.email=? GROUP BY d.device_id ORDER BY MAX(COALESCE(s.expires_at,0)) DESC,d.created_at DESC LIMIT 30').bind(email).all()).results;}
