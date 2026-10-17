import {env} from 'cloudflare:workers';
import {requireViewer,accessResponse,getDB} from '../../../lib/access';
import {chinaDay} from '../../../lib/access-rules';
import {customerKeyStatus} from '../../../lib/customer-api';
export const dynamic='force-dynamic';
export async function GET(){try{const v=await requireViewer();const usage=await getDB().prepare('SELECT calls FROM daily_usage WHERE email=? AND day=?').bind(v.email,chinaDay()).first<{calls:number}>();const api=await customerKeyStatus(v.email);return Response.json({ready:api.configured,admin:v.admin,email:v.email,dailyLimit:v.admin?null:v.member?.daily_limit,callsToday:usage?.calls||0,model:api.model},{headers:{'Cache-Control':'private, no-store'}});}catch(e){return accessResponse(e);}}
