'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

const navigation = [
  { href: '/', label: '首页' },
  { href: '/learn/minecraft/简单通关/00-目录', label: 'Minecraft' },
  { href: '/learn/blender/overview', label: 'Blender' },
  { href: '/learn/laravel/overview', label: 'Laravel' },
  { href: '/threejs', label: 'Three.js' },
];

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="site-brand" href="/" aria-label="DogeOW 教程网首页">
          <span className="site-brand-mark">D/OW</span>
          <span className="site-brand-copy">
            <strong>教程网</strong>
            <small>tutorial.dogeow.com</small>
          </span>
        </Link>

        <nav className="site-nav" aria-label="主导航">
          {navigation.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link className={active ? 'active' : ''} href={item.href} key={item.href}>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header-actions">
          <Link className="site-search-link" href="/#search">
            搜索
            <kbd>/</kbd>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
