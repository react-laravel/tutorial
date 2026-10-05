'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

const navigation = [
  { href: '/', label: '首页', match: 'exact' as const },
  { href: '/learn/minecraft/简单通关/00-目录', label: 'Minecraft', match: '/learn/minecraft' },
  { href: '/learn/blender/overview', label: 'Blender', match: '/learn/blender' },
  { href: '/learn/laravel/overview', label: 'Laravel', match: '/learn/laravel' },
  { href: '/threejs', label: 'Three.js', match: '/threejs' },
];

function isActive(pathname: string, match: (typeof navigation)[number]['match']) {
  if (match === 'exact') return pathname === '/';
  return pathname === match || pathname.startsWith(`${match}/`);
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        return;
      }
      if (event.key !== '/') return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) return;
      if (document.querySelector('.modal-backdrop')) return;
      event.preventDefault();
      setMenuOpen(false);
      if (pathname === '/') {
        document.getElementById('global-search')?.focus();
        return;
      }
      router.push('/#search');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pathname, router]);

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
            const active = isActive(pathname, item.match);
            return (
              <Link className={active ? 'active' : ''} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}>
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
          <button
            type="button"
            className="site-menu-button"
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? '关闭' : '菜单'}
          </button>
          <ThemeToggle />
        </div>
      </div>

      <nav id="site-menu" className={menuOpen ? 'site-menu open' : 'site-menu'} aria-label="窄屏导航">
        {navigation.map((item) => {
          const active = isActive(pathname, item.match);
          return (
            <Link className={active ? 'active' : ''} href={item.href} key={item.href} aria-current={active ? 'page' : undefined}>
              {item.label}
            </Link>
          );
        })}
        <Link href="/#search">搜索</Link>
      </nav>
    </header>
  );
}
