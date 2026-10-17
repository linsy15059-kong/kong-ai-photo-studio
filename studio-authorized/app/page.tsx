import {redirect} from 'next/navigation';
import Workbench from './workbench';
import {readViewer,ownerEmail} from '../lib/access';
import {canUse} from '../lib/access-rules';
export const dynamic='force-dynamic';
export default async function Page(){const v=await readViewer();if(!v||!canUse(v.email,ownerEmail(),v.member))redirect('/access');return <Workbench userName={v.user.displayName} isAdmin={v.admin} userEmail={v.email}/>;}
