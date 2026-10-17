import {getChatGPTUser,chatGPTSignOutPath} from '../chatgpt-auth';
import {readViewer} from '../../lib/access';
import {canUse} from '../../lib/access-rules';
import {ownerEmail} from '../../lib/access';
import {redirect} from 'next/navigation';
import AccessForm from './request-form';
import LoginForm from './login-form';
export const dynamic='force-dynamic';
export default async function AccessPage(){const user=await getChatGPTUser();if(!user)return <main className="access-shell"><div className="access-card"><span className="eyebrow">PRIVATE PHOTO STUDIO</span><h1>摄影定调工作台</h1><p>使用管理员分配的 Gmail 和密码登录。无需 ChatGPT 账号，也不会跳转 OpenAI 授权页面。</p><LoginForm/></div></main>;
 const viewer=await readViewer();if(viewer&&canUse(viewer.email,ownerEmail(),viewer.member))redirect('/');return <main className="access-shell"><div className="access-card"><span className="eyebrow">ACCESS BY APPROVAL</span><h1>等待管理员授权</h1><p>当前邮箱：<strong>{user.email}</strong></p><p>只有管理员批准并设置密码的 Gmail 邮箱才能使用工作台。请联系管理员完成白名单授权。</p><AccessForm status={viewer?.member?.status||'none'}/><a className="quiet" href={chatGPTSignOutPath('/access')} target="_top">退出并切换账号 →</a></div></main>;
}
