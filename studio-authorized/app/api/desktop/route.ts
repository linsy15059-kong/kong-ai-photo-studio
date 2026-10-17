import {getDB,accessResponse,AccessError} from '../../../lib/access';
import {acquireLease,desktopSession,devicesFor,hashSecret,nowSeconds,randomSecret,requireLease} from '../../../lib/desktop-license';
import {tools} from '../../../lib/photo-tools';
import {finishTask} from '../../../lib/usage';
export const dynamic='force-dynamic';
const ok=(data:unknown)=>Response.json(data,{headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request){try{
 if(Number(request.headers.get('content-length')||0)>4096)throw new AccessError('请求过大。',413,'too_large');
 const b=await request.json() as Record<string,string>,db=getDB(),n=nowSeconds();
 if(b.action==='pair-start'){
  if(!/^[a-f0-9]{64}$/.test(b.secret||'')||!/^[a-f0-9-]{36}$/i.test(b.deviceId||''))throw new AccessError('设备信息无效。',400,'invalid_device');
  const ip=request.headers.get('cf-connecting-ip')||'unknown',bucket=await hashSecret(ip+':'+Math.floor(n/60));
  const permit=await db.prepare('INSERT INTO desktop_rate(bucket,calls,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET calls=calls+1 WHERE calls<10 RETURNING calls').bind(bucket,n+600).first();
  if(!permit)throw new AccessError('登录请求过多，请稍后重试。',429,'rate_limit');
  const pairId=randomSecret().slice(0,16);await db.batch([db.prepare('DELETE FROM desktop_pairs WHERE expires_at<?').bind(n),db.prepare('DELETE FROM desktop_rate WHERE expires_at<?').bind(n),db.prepare('INSERT INTO desktop_pairs(id,secret_hash,device_id,name,expires_at) VALUES(?,?,?,?,?)').bind(pairId,await hashSecret(b.secret),b.deviceId,String(b.name||'Windows 电脑').slice(0,60),n+600)]);
  return ok({pairId,expiresIn:600});
 }
 if(b.action==='pair-poll'){
  const pair=await db.prepare('SELECT email FROM desktop_pairs WHERE id=? AND secret_hash=? AND expires_at>?').bind(String(b.pairId),await hashSecret(String(b.secret)),n).first<{email:string|null}>();
  if(!pair)throw new AccessError('登录窗口已过期，请重新发起登录。',410,'pair_expired');return ok({approved:!!pair.email,email:pair.email||''});
 }
 const s=await desktopSession(request);
 if(b.action==='devices')return ok({devices:await devicesFor(s.email),email:s.email,deviceId:s.device_id,serverTime:n});
 if(b.action==='release'){
  const id=String(b.deviceId||s.device_id);await db.batch([db.prepare('DELETE FROM desktop_devices WHERE email=? AND device_id=?').bind(s.email,id),db.prepare('DELETE FROM desktop_slots WHERE email=? AND device_id=?').bind(s.email,id)]);return ok({ok:true});
 }
 if(b.action==='offline'){await db.prepare('DELETE FROM desktop_slots WHERE email=? AND device_id=?').bind(s.email,s.device_id).run();return ok({ok:true});}
 if(b.action==='heartbeat'||b.action==='status'){await acquireLease(s);return ok({ok:true,email:s.email,maxDevices:2,leaseSeconds:90,serverTime:n});}
 await requireLease(s);
 if(b.action==='begin'){
  if(!/^[a-z0-9-]{36}$/i.test(b.id||'')||!tools.some(t=>t.id===b.tool)||!['high','medium'].includes(b.quality))throw new AccessError('任务信息无效。',400,'invalid_task');
  try{const inserted=await db.prepare("INSERT INTO tasks(id,user_id,email,tool,preset,status,created_at,quality) SELECT ?,?,?,?,?,'running',?,? WHERE NOT EXISTS(SELECT 1 FROM tasks WHERE user_id=? AND status='running' AND created_at>?) RETURNING id").bind(b.id,'desktop:'+s.email+':'+s.device_id,s.email,b.tool,String(b.preset||'').slice(0,100),new Date().toISOString(),b.quality,'desktop:'+s.email+':'+s.device_id,new Date(Date.now()-600000).toISOString()).first();if(!inserted)throw new AccessError('当前设备已有生成任务，请等待完成。',409,'task_running');}catch(e){if(e instanceof AccessError)throw e;throw new AccessError('任务已提交或记录服务不可用，未请求出图。',409,'duplicate_task');}
  return ok({ok:true});
 }
 if(b.action==='finish'){
  const own=await db.prepare('SELECT id FROM tasks WHERE id=? AND email=? AND user_id=?').bind(String(b.id),s.email,'desktop:'+s.email+':'+s.device_id).first();if(!own)throw new AccessError('任务不存在。',404,'task_missing');
  if(!['success','failed','cancelled'].includes(b.status))throw new AccessError('状态无效。',400,'invalid_status');
  await finishTask(b.id,b.status,'client_reported',b.status==='success'?'桌面端报告已返回图片；费用由客户 API 支付。':'桌面端报告请求未完成。');return ok({ok:true});
 }
 throw new AccessError('操作无效。',400,'invalid_action');
 }catch(e){return accessResponse(e);}}
