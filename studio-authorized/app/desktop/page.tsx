import {redirect} from 'next/navigation';
import {getDB,readViewer} from '../../lib/access';
import {chatGPTSignInPath,chatGPTSignOutPath} from '../chatgpt-auth';
import {nowSeconds} from '../../lib/desktop-license';
import PairForm from './pair-form';
export const dynamic='force-dynamic';
export default async function DesktopPage({searchParams}:{searchParams:Promise<{pair?:string}>}){const {pair}=await searchParams;const v=await readViewer();if(!v)redirect(chatGPTSignInPath('/desktop?pair='+encodeURIComponent(pair||'')));const request=await getDB().prepare('SELECT name,email FROM desktop_pairs WHERE id=? AND expires_at>?').bind(pair||'',nowSeconds()).first<{name:string;email:string|null}>();return <main className="access-shell"><div className="access-card"><span className="eyebrow">DESKTOP ACTIVATION</span><h1>摄影定调工作台 · 桌面版</h1>{request?<><p>确认邮箱：<strong>{v.email}</strong></p><p>请求登录的设备：<strong>{request.name}</strong></p><p>仅在你刚刚从桌面软件发起登录时确认。每个账号最多两台设备同时使用。</p><PairForm pairId={pair||''} approved={!!request.email}/></>:<p>登录请求已过期，请回到桌面软件重新发起登录。</p>}<a className="quiet" href={chatGPTSignOutPath('/desktop?pair='+encodeURIComponent(pair||''))}>切换 Gmail 对应的登录账号</a><a className="quiet" href="/">返回网页版</a></div></main>;}
