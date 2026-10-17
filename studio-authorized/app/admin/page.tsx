import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {readViewer} from '../../lib/access';
import AdminCenter from './admin-center';
export const dynamic='force-dynamic';
export default async function AdminPage(){const v=await readViewer();if(!v)redirect('/access');if(!v.admin)return <main className="access-shell"><div className="access-card"><h1>此页面仅限管理员</h1><p>你的账户没有后台管理权限。</p><a className="primary" href="/">返回工作台</a></div></main>;return <AdminCenter ownerEmail={v.email} externalLoginEnabled={(env as Cloudflare.Env & {EXTERNAL_LOGIN_ENABLED?:string}).EXTERNAL_LOGIN_ENABLED==='true'}/>;}
