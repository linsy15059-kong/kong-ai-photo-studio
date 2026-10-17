import {env} from 'cloudflare:workers';
import {getChatGPTUser,ChatGPTUser} from '../app/chatgpt-auth';
import {normalizeEmail,isOwner,canUse,Member} from './access-rules';
export type Viewer={user:ChatGPTUser;email:string;admin:boolean;member:Member|null};
export class AccessError extends Error{constructor(message:string,public status:number,public code:string){super(message);}}
export function getDB(){if(!env.DB)throw new AccessError('云端权限服务暂不可用，请联系管理员。',503,'database_unavailable');return env.DB;}
export function ownerEmail(){const email=(env as Cloudflare.Env & {OWNER_EMAIL?:string}).OWNER_EMAIL||'';if(!email)throw new AccessError('管理员身份未配置，请联系站点所有者。',503,'owner_not_configured');return normalizeEmail(email);}
export async function readViewer():Promise<Viewer|null>{const user=await getChatGPTUser();if(!user)return null;const email=normalizeEmail(user.email),owner=ownerEmail();if(isOwner(email,owner))return{user,email,admin:true,member:null};const member=await getDB().prepare('SELECT * FROM members WHERE email = ?').bind(email).first<Member>();return {user,email,admin:false,member};}
export async function requireViewer(admin=false):Promise<Viewer>{const viewer=await readViewer();if(!viewer)throw new AccessError('请先登录与你的 Gmail 邮箱绑定的 ChatGPT 账户。',401,'login_required');if(admin&&!viewer.admin)throw new AccessError('只有站点管理员可以访问后台。',403,'admin_only');if(!canUse(viewer.email,ownerEmail(),viewer.member))throw new AccessError(viewer.member?.status==='suspended'?'你的使用权限已暂停，请联系管理员。':'该 Gmail 邮箱尚未获得授权，请联系管理员。',403,'not_approved');return viewer;}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new AccessError('请从本站页面提交请求。',403,'invalid_origin');}
export function accessResponse(e:unknown){if(e instanceof AccessError)return Response.json({error:e.message,code:e.code},{status:e.status,headers:{'Cache-Control':'private, no-store'}});return Response.json({error:'服务暂不可用，请稍后重试。',code:'server_error'},{status:503,headers:{'Cache-Control':'private, no-store'}});}
