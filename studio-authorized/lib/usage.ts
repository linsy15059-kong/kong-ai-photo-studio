import {getDB,Viewer,AccessError} from './access';
import {chinaDay} from './access-rules';
export async function beginTask(v:Viewer,id:string,tool:string,preset:string,quality:string){
 const db=getDB(),now=new Date().toISOString();
 try{await db.prepare('INSERT INTO tasks (id,user_id,email,tool,preset,status,created_at,quality) VALUES (?,?,?,?,?,\'running\',?,?)').bind(id,v.user.userId,v.email,tool,preset,now,quality).run();}catch{const existing=await db.prepare('SELECT id FROM tasks WHERE id=?').bind(id).first();if(existing)throw new AccessError('这次请求已经提交，请勿重复生成。',409,'duplicate_request');throw new AccessError('任务记录服务暂不可用，未提交出图请求。',503,'tracking_unavailable');}
 const owner=v.admin?1:0;
 const quota=await db.prepare(`INSERT INTO daily_usage (email,day,calls)
 SELECT ?,?,1 WHERE ?=1 OR EXISTS(SELECT 1 FROM members WHERE email=? AND status='approved' AND daily_limit>0)
 ON CONFLICT(email,day) DO UPDATE SET calls=calls+1
 WHERE ?=1 OR (calls < COALESCE((SELECT daily_limit FROM members WHERE email=? AND status='approved'),0)) RETURNING calls`).bind(v.email,chinaDay(),owner,v.email,owner,v.email).first<{calls:number}>();
 if(!quota){await finishTask(id,'blocked','daily_limit','权限已变更或当日调用额度已用完。');throw new AccessError('你的权限已变更或今日出图额度已用完，请联系管理员。',429,'daily_limit');}
}
export async function finishTask(id:string,status:string,errorCode='',errorMessage='',usage?:{input_tokens?:number;output_tokens?:number}){
 const db=getDB();const now=new Date().toISOString();await db.prepare(`UPDATE tasks SET status=?,finished_at=?,duration_ms=CAST((julianday(?) - julianday(created_at))*86400000 AS INTEGER),error_code=?,error_message=?,input_tokens=?,output_tokens=? WHERE id=? AND status='running'`).bind(status,now,now,errorCode.slice(0,80),errorMessage.slice(0,240),usage?.input_tokens||0,usage?.output_tokens||0,id).run();
}
