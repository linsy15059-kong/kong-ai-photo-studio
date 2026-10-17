import {requireViewer} from '../../../lib/access';
import LicenseCenter from './license-center';
export const dynamic='force-dynamic';
export default async function Page(){await requireViewer(true);return <LicenseCenter/>;}
