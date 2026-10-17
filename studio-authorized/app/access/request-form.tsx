'use client';
import {useState} from 'react';
export default function AccessForm({status}:{status:string}){const [name,setName]=useState(''),[note,setNote]=useState(''),[state,setState]=useState(status),[busy,setBusy]=useState(false),[error,setError]=useState('');async function submit(){setBusy(true);setError('');try{const r=await fetch('/api/access',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,note})});const d=await r.json() as {error?:string};if(!r.ok)throw Error(d.error||'申请失败');setState('pending');}catch(e){setError((e as Error).message);}finally{setBusy(false);}}
 if(state==='pending')return <div className="access-state">申请已提交，请等待管理员批准。<button className="quiet" onClick={()=>location.reload()}>刷新授权状态 →</button></div>;
 if(state==='suspended'||state==='denied')return <div className="access-state">{state==='suspended'?'权限已暂停':'申请暂未批准'}，请联系管理员。</div>;
 return <div className="access-form"><label>姓名 / 摄影师昵称<input value={name} maxLength={50} onChange={e=>setName(e.target.value)} placeholder="方便管理员辨认你"/></label><label>申请备注<textarea value={note} maxLength={200} rows={3} onChange={e=>setNote(e.target.value)} placeholder="例如：团队、岗位或使用目的"/></label>{error&&<p className="form-error">{error}</p>}<button className="primary" disabled={busy||!name.trim()} onClick={submit}>{busy?'正在提交':'申请使用权限'}</button></div>;
}
