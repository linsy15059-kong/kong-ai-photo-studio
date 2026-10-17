export function validateEdit(p,rules){
 if(!p||!/^[a-z0-9-]{36}$/i.test(p.requestId||''))throw Error('任务标识无效');
 const tool=rules.tools.find(t=>t.id===p.tool);if(!tool)throw Error('修改工具无效');
 const d=p.settings;if(!d||!tool.presets.includes(d.preset))throw Error('修改款式无效');
 for(const name of ['image','mask','reference']){const a=p[name];if(a===undefined&&name==='reference')continue;if(!(a instanceof ArrayBuffer)||a.byteLength<8||a.byteLength>(name==='reference'?5:12)*1024*1024)throw Error('图片大小或格式无效');const bytes=new Uint8Array(a);if(bytes[0]!==137||bytes[1]!==80||bytes[2]!==78||bytes[3]!==71)throw Error('输入必须是 PNG 图片');}
 if(!['high','medium'].includes(p.quality))throw Error('质量参数无效');
 const settings={preset:d.preset,detail:String(d.detail||'').slice(0,3000),fit:String(d.fit||'').slice(0,50),repairs:Array.isArray(d.repairs)?d.repairs.map(x=>String(x).slice(0,50)).slice(0,6):[],blur:String(d.blur||'').slice(0,50),color:String(d.color||'').slice(0,100)};
 return rules.invariants+'\n本次仅执行这一项修改：'+rules.instruction(p.tool,settings)+'\n整体补充（仅在本次选区与保留规则内生效）：'+String(p.extra||'').slice(0,3000)+(p.reference?'\n第二张图是本项替换对象的参考图。':'')+'\n输出一张完整照片，画幅与原图保持一致，不裁切或改变物体位置。';
}
export async function runCustomerEdit(p,{rules,key,cloud,fetchImpl=fetch,signal}){
 const prompt=validateEdit(p,rules);
 if(!key||!/^sk-[A-Za-z0-9_-]{20,}$/.test(key))throw Error('请在软件设置中配置你自己的 OpenAI API 密钥。');
 // Fail closed: obtaining a server permit is mandatory before a paid API request.
 await cloud({action:'heartbeat'});await cloud({action:'begin',id:p.requestId,tool:p.tool,preset:p.settings.preset,quality:p.quality});
 let delivered=false;
 try{
  const f=new FormData();f.append('model','gpt-image-2');f.append('image[]',new Blob([p.image],{type:'image/png'}),'original.png');f.append('mask',new Blob([p.mask],{type:'image/png'}),'mask.png');if(p.reference)f.append('image[]',new Blob([p.reference],{type:'image/png'}),'reference.png');f.append('prompt',prompt);f.append('n','1');f.append('size','auto');f.append('quality',p.quality);f.append('output_format','png');
  if(signal?.aborted)throw Error('任务已停止');
  const r=await fetchImpl('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:'Bearer '+key},body:f,signal:AbortSignal.any([signal||new AbortController().signal,AbortSignal.timeout(360000)])});
  let data;try{data=await r.json();}catch{throw Error('API 未返回有效数据，请检查网络。');}
  if(!r.ok){if(r.status===401)throw Error('你配置的 API 密钥无效，请更新自己的密钥。');if(r.status===402||['insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached'].includes(data.error?.code))throw Error('你的 API 余额不足或达到消费限额，请向服务商充值。');if(r.status===403)throw Error('你的 API 账户没有图像模型权限，请检查组织验证和地区可用性。');throw Error('你的 API 请求未完成（'+r.status+'），请检查账户与网络。');}
  const image=data.data?.[0]?.b64_json;if(typeof image!=='string'||!image)throw Error('API 未返回图片');delivered=true;return {image:'data:image/png;base64,'+image};
 }finally{
  // Telemetry is metadata only. A tracking outage after delivery must not discard a paid image.
  await cloud({action:'finish',id:p.requestId,status:delivered?'success':signal?.aborted?'cancelled':'failed'}).catch(()=>{});
 }
}
