import {requireViewer,sameOrigin,getDB,accessResponse,AccessError} from '../../../../lib/access';
import {hashSecret,nowSeconds} from '../../../../lib/desktop-license';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{sameOrigin(request);if(Number(request.headers.get('content-length')||0)>2048)throw new AccessError('请求过大。',413,'too_large');const v=await requireViewer();const b=await request.json() as Record<string,string>;const db=getDB(),n=nowSeconds();const pair=await db.prepare('SELECT * FROM desktop_pairs WHERE id=? AND expires_at>? AND email IS NULL').bind(String(b.pairId),n).first<{id:string;secret_hash:string;device_id:string;name:string}>();if(!pair)throw new AccessError('登录申请已处理或已过期，请从软件重新登录。',410,'pair_expired');
 const license=await db.prepare("SELECT * FROM commercial_licenses WHERE email=? AND status='active' AND version='1'").bind(v.email).first<{code_hash:string;activated_at:string|null}>();
 if(!license)throw new AccessError('此邮箱尚未购买或开通桌面版授权，请联系管理员。',403,'license_missing');
 if(!license.activated_at&&(await hashSecret(String(b.code||'').trim().toUpperCase()))!==license.code_hash)throw new AccessError('激活码不正确，或与当前邮箱不匹配。',403,'invalid_code');
 const now=new Date().toISOString();await db.batch([
 db.prepare('UPDATE commercial_licenses SET activated_at=COALESCE(activated_at,?) WHERE email=?').bind(now,v.email),
 db.prepare('UPDATE desktop_pairs SET email=? WHERE id=? AND email IS NULL').bind(v.email,pair.id),
 db.prepare('DELETE FROM desktop_devices WHERE email=? AND device_id=? AND EXISTS(SELECT 1 FROM desktop_pairs WHERE id=? AND email=?)').bind(v.email,pair.device_id,pair.id,v.email),
 db.prepare('INSERT INTO desktop_devices(token_hash,email,device_id,name,created_at,expires_at) SELECT secret_hash,email,device_id,name,?,? FROM desktop_pairs WHERE id=? AND email=? ON CONFLICT(token_hash) DO NOTHING').bind(now,n+30*86400,pair.id,v.email)
 ]);return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return accessResponse(e);}}
