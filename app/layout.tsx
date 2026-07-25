import type { Metadata } from 'next';
import './globals.css';
import './site.css';
import SiteHeader from '@/components/SiteHeader';

export const metadata: Metadata = {
  metadataBase: new URL('https://tutorial.dogeow.com'),
  title: {
    default: 'DogeOW 教程网｜把复杂的事，讲到能动手',
    template: '%s | DogeOW 教程网',
  },
  description: 'DogeOW 免费教程网：Minecraft 生存、Blender 5.1、Laravel 源码阅读与 Three.js 互动示例。',
  applicationName: 'DogeOW 教程网',
  keywords: ['DogeOW', '教程', 'Minecraft', 'Blender', 'Laravel', 'Three.js'],
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    siteName: 'DogeOW 教程网',
    title: 'DogeOW 教程网｜把复杂的事，讲到能动手',
    description: '系统教程、清晰路径与可运行示例，全部免费开放。',
    images: [
      {
        url: '/og.png',
        width: 1734,
        height: 907,
        alt: 'DogeOW 教程网｜把复杂的事，讲到能动手',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DogeOW 教程网｜把复杂的事，讲到能动手',
    description: '系统教程、清晰路径与可运行示例，全部免费开放。',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const themeScript = `(function(){try{var t=localStorage.getItem('dogeow-tutorial-theme');if(!t)t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.classList.toggle('dark',t==='dark');}catch(e){}})();`;
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <SiteHeader />
        {children}
        <footer className="site-footer">
          <div>
            <span className="site-brand-mark">D/OW</span>
            <p>DogeOW 教程网 · 把复杂的事，讲到能动手。</p>
          </div>
          <small>免费阅读 · 持续整理 · {new Date().getFullYear()}</small>
        </footer>
      </body>
    </html>
  );
}
