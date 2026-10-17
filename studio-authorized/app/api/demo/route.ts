import {requireViewer,accessResponse} from '../../../lib/access';
import {demoJpeg} from '../../../lib/demo-data';
export const dynamic='force-dynamic';
export async function GET(){try{await requireViewer();const bytes=Uint8Array.from(atob(demoJpeg),c=>c.charCodeAt(0));return new Response(bytes,{headers:{'Content-Type':'image/jpeg','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}catch(e){return accessResponse(e);}}
