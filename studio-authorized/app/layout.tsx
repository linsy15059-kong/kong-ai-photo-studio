import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'摄影定调工作台',description:'保留产品质感与原有光线的摄影局部编辑工作台。',manifest:'/manifest.webmanifest',icons:{icon:'/favicon.svg',apple:'/app-icon.png'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
