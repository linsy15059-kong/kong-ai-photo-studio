import {requireViewer,sameOrigin,accessResponse,AccessError} from '../../../lib/access';
import {beginTask,finishTask} from '../../../lib/usage';
import {customerCredentials} from '../../../lib/customer-api';
import { tools, instruction, invariants, ToolId, Draft } from '../../../lib/photo-tools';
export const dynamic='force-dynamic';
const fail=(error:string,status=400)=>Response.json({error},{status,headers:{'Cache-Control':'no-store'}});
export async function POST(request:Request) {
 let taskId='';let begun=false;
 try {
 const viewer=await requireViewer();sameOrigin(request);
 if(Number(request.headers.get('content-length')||0)>28*1024*1024)return fail('图片过大，请缩小后重试。',413);
 const credentials=await customerCredentials(viewer.email),key=credentials.key;
  const f=await request.formData();const image=f.get('image'),reference=f.get('reference');
  if(!(image instanceof File))return fail('请上传原图。');
  if(!['image/png','image/jpeg','image/webp'].includes(image.type))return fail('原图格式需为 JPG、PNG 或 WebP。');
  if(image.size>12*1024*1024)return fail('图片过大，请缩小后重试。',413);
  const id=String(f.get('tool')) as ToolId;if(!tools.some(t=>t.id===id))return fail('请选择有效的修改工具。');
  const raw=JSON.parse(String(f.get('settings')||'{}'));
  const d={preset:String(raw.preset||'').slice(0,100),detail:String(raw.detail||'').slice(0,3000),fit:String(raw.fit||'').slice(0,50),repairs:Array.isArray(raw.repairs)?raw.repairs.map((x:unknown)=>String(x).slice(0,50)).slice(0,6):[],blur:String(raw.blur||'').slice(0,50),color:String(raw.color||'').slice(0,100)} as Draft;
  if(!tools.find(t=>t.id===id)?.presets.some(p=>p===d.preset))return fail('请选择有效款式。');
  const extra=String(f.get('extra')||'').slice(0,3000);
  const prompt=invariants+'\n本次仅执行这一项修改：'+instruction(id,d)+'\n用户整体补充要求：'+extra+(reference instanceof File?'\n第二张图是本项替换对象的参考图。':'')+'\n根据文字要求编辑整张图片。只修改明确指定的对象或瑕疵，尽可能让其余部分保持原样。输出一张完整照片，画幅与原图保持一致，不要裁切或改变无关物体的位置。';
  const body=new FormData();body.append('model',credentials.model);body.append('image[]',image,'original.png');
  if(reference instanceof File&&reference.size){if(reference.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(reference.type))return fail('参考图需为 5MB 以内的 JPG、PNG 或 WebP。');body.append('image[]',reference,'reference.png');}
  body.append('prompt',prompt);body.append('n','1');body.append('size','auto');body.append('quality',f.get('quality')==='medium'?'medium':'high');body.append('output_format','png');
  taskId=String(f.get('requestId')||'');if(!/^[a-z0-9-]{36}$/i.test(taskId))return fail('请求标识无效，请刷新页面后重试。');
  await beginTask(viewer,taskId,id,d.preset,f.get('quality')==='medium'?'medium':'high');begun=true;
  const res=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body,signal:AbortSignal.any([request.signal,AbortSignal.timeout(360000)])});
  const data=await res.json() as {data?:{b64_json?:string}[];error?:{code?:string;type?:string};usage?:{input_tokens?:number;output_tokens?:number}};
  if(!res.ok){const code=data.error?.code;await finishTask(taskId,'failed',code||'http_'+res.status,code==='credit_balance_exhausted'?'API 账户余额不足':'API 出图请求失败（'+res.status+'）');
   if(code==='insufficient_quota'||code==='credit_balance_exhausted'||code==='billing_hard_limit_reached'||data.error?.type==='insufficient_quota')return fail('API 账户余额不足或达到用量限额。请为 OpenAI API 账户充值后再试。',402);
   if(res.status===429)return fail('出图请求较多，请稍后重试；也可检查 API 账户余额和用量限额。',429);
   if(res.status===401)return fail('出图服务密钥不可用，请联系管理员更新。',503);
   if(res.status===403)return fail('API 账户暂未获得图像模型权限，请在 OpenAI Platform 检查组织验证。',403);
   return fail('出图服务未完成本次修改（'+res.status+'）。请检查选区和提示词后重试。',502);
  }
  const b64=data.data?.[0]?.b64_json;if(!b64){await finishTask(taskId,'failed','empty_result','服务未返回图片');return fail('服务未返回有效图片，请重试。',502);}
  await finishTask(taskId,'success','','',data.usage);
  return Response.json({image:'data:image/png;base64,'+b64},{headers:{'Cache-Control':'no-store'}});
 }catch(e){if(begun){try{await finishTask(taskId,request.signal.aborted?'cancelled':'failed',e instanceof Error?e.name:'unknown_error','请求未完成');}catch{}}if(e instanceof AccessError)return accessResponse(e);return fail(e instanceof Error&&['TimeoutError','AbortError'].includes(e.name)?'本次生成超时，请重试。':'生成未完成，请检查网络和图片格式后重试。',502);}
}
