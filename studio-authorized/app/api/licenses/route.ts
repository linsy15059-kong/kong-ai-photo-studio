import {requireViewer,getDB,sameOrigin,accessResponse,AccessError,ownerEmail} from '../../../lib/access';
import {isGmail,normalizeEmail} from '../../../lib/access-rules';
import {hashSecret,randomSecret,nowSeconds} from '../../../lib/desktop-license';
export const dynamic='force-dynamic';
const ok=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'private, no-store'}});
export async function GET(){try{await requireViewer(true);const db=getDB();const data=await db.batch([db.prepare('SELECT l.email,l.status,l.version,l.created_at,l.activated_at,l.note,COUNT(DISTINCT CASE WHEN s.expires_at>? THEN s.device_id END) AS online FROM commercial_licenses l LEFT JOIN desktop_slots s ON s.email=l.email GROUP BY l.email ORDER BY l.created_at DESC LIMIT 500').bind(nowSeconds()),db.prepare('SELECT d.email,d.device_id,d.name,d.created_at,COALESCE(s.expires_at,0) AS lease_until FROM desktop_devices d LEFT JOIN desktop_slots s ON s.email=d.email AND s.device_id=d.device_id ORDER BY d.created_at DESC LIMIT 1000')]);return ok({licenses:data[0].results,devices:data[1].results,serverTime:nowSeconds()});}catch(e){return accessResponse(e);}}
export async function POST(request:Request){try{sameOrigin(request);const v=await requireViewer(true);if(Number(request.headers.get('content-length')||0)>2048)throw new AccessError('请求过大。',413,'too_large');const b=await request.json() as Record<string,string>,email=normalizeEmail(String(b.email||''));if(!isGmail(email))throw new AccessError('请输入有效的 Gmail 邮箱。',400,'invalid_email');const db=getDB(),now=new Date().toISOString();
 if(b.action==='issue'){
  const exists=await db.prepare('SELECT email FROM commercial_licenses WHERE email=?').bind(email).first();if(exists)throw new AccessError('该邮箱已有授权，请恢复或停用已有授权。',409,'license_exists');
  const code='PHOTO-'+randomSecret().slice(0,24).toUpperCase(),codeHash=await hashSecret(code);const statements=[db.prepare("INSERT INTO commercial_licenses(email,code_hash,status,version,created_at,note) VALUES(?,?,'active','1',?,?)").bind(email,codeHash,now,String(b.note||'').slice(0,200))];
  if(email!==ownerEmail())statements.push(db.prepare("INSERT INTO members(email,name,status,daily_limit,created_at,updated_at,granted_by,note) VALUES(?,'','approved',30,?,?,?,'桌面版一次性授权') ON CONFLICT(email) DO UPDATE SET status='approved',updated_at=excluded.updated_at").bind(email,now,now,v.email));
  statements.push(db.prepare('INSERT INTO audit(id,actor_email,action,target_email,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),v.email,'license_issue',email,'桌面版 V1；最多两台同时在线',now));await db.batch(statements);return ok({ok:true,code,email});
 }
 if(b.action==='reissue'){
  const license=await db.prepare('SELECT activated_at FROM commercial_licenses WHERE email=?').bind(email).first<{activated_at:string|null}>();if(!license||license.activated_at)throw new AccessError('只可重新签发尚未激活的授权码。',400,'cannot_reissue');const code='PHOTO-'+randomSecret().slice(0,24).toUpperCase();await db.prepare('UPDATE commercial_licenses SET code_hash=? WHERE email=? AND activated_at IS NULL').bind(await hashSecret(code),email).run();return ok({ok:true,code,email});
 }
 if(b.action==='revoke'||b.action==='restore'){
  await db.batch([db.prepare('UPDATE commercial_licenses SET status=? WHERE email=?').bind(b.action==='revoke'?'revoked':'active',email),db.prepare('DELETE FROM desktop_slots WHERE email=?').bind(email),db.prepare('INSERT INTO audit(id,actor_email,action,target_email,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),v.email,'license_'+b.action,email,'桌面授权状态修改',now)]);return ok({ok:true});
 }
 if(b.action==='release'){
  await db.batch([db.prepare('DELETE FROM desktop_devices WHERE email=? AND device_id=?').bind(email,String(b.deviceId)),db.prepare('DELETE FROM desktop_slots WHERE email=? AND device_id=?').bind(email,String(b.deviceId)),db.prepare('INSERT INTO audit(id,actor_email,action,target_email,detail,created_at) VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),v.email,'device_release',email,String(b.deviceId).slice(0,36),now)]);return ok({ok:true});
 }
 throw new AccessError('操作无效。',400,'invalid_action');
 }catch(e){return accessResponse(e);}}
