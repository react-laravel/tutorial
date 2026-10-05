'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { Demo, Category } from '@/lib/demos';

const PreviewModal = dynamic(() => import('./PreviewModal'), {
  loading: () => (
    <div className="modal-backdrop">
      <div className="modal-shell modal-loading" role="status">正在打开示例…</div>
    </div>
  ),
});

type Props = { demos: Demo[]; categories: Category[]; initialOpenSlug?: string };

const BATCH = 48;

function syncOpenUrl(slug: string | null) {
  const url = new URL(window.location.href);
  if (slug) url.searchParams.set('open', slug);
  else url.searchParams.delete('open');
  const next = `${url.pathname}${url.search}${url.hash}`;
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (next !== current) window.history.replaceState(null, '', next);
}

export default function Home({ demos, categories, initialOpenSlug }: Props) {
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [openDemo, setOpenDemo] = useState<Demo | null>(null);
  const [limit, setLimit] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const displayIndex = useMemo(() => {
    const m = new Map<string, number>();
    demos.forEach((demo, idx) => m.set(demo.slug, idx + 1));
    return m;
  }, [demos]);

  const catStyle = useMemo(() => {
    const m = new Map<string, Category>();
    for (const category of categories) m.set(category.name, category);
    return m;
  }, [categories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return demos.filter((demo) => {
      if (activeCat && !demo.categories.includes(activeCat)) return false;
      if (!q) return true;
      const hay = `${demo.title} ${demo.desc} ${demo.slug} ${demo.features.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [demos, activeCat, query]);

  useEffect(() => {
    setLimit(BATCH);
  }, [activeCat, query]);

  const shown = visible.slice(0, limit);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || shown.length >= visible.length) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) setLimit((count) => count + BATCH);
    }, { rootMargin: '700px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, [shown.length, visible.length]);

  const stats = useMemo(
    () => ({ total: demos.length, categories: categories.length, visible: visible.length }),
    [demos.length, categories.length, visible.length],
  );

  const handleOpen = useCallback((demo: Demo, event: React.MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    setOpenDemo(demo);
    syncOpenUrl(demo.slug);
  }, []);

  const handleNavigate = useCallback((demo: Demo) => {
    setOpenDemo(demo);
    syncOpenUrl(demo.slug);
  }, []);

  const handleClose = useCallback(() => {
    setOpenDemo(null);
    syncOpenUrl(null);
  }, []);

  useEffect(() => {
    if (!initialOpenSlug) return;
    const target = demos.find((demo) => demo.slug === initialOpenSlug);
    if (target) setOpenDemo(target);
  }, [demos, initialOpenSlug]);

  return (
    <main className="threejs-page">
      <div className="container">
        <header className="header">
          <div className="header-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            RUN · EDIT · LEARN
          </div>
          <h1>Three.js 互动实验室</h1>
          <p>打开就能运行，源码可以直接修改。用 {stats.total} 个小实验理解浏览器里的 3D 图形编程。</p>
          <div className="header-stats">
            <div className="stat">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">示例总数</div>
            </div>
            <div className="stat">
              <div className="stat-value">{stats.categories}</div>
              <div className="stat-label">分类数量</div>
            </div>
            <div className="stat">
              <div className="stat-value">100%</div>
              <div className="stat-label">免费开源</div>
            </div>
          </div>
        </header>
      </div>

      <div className="controls">
        <div className="container">
          <div className="controls-inner">
            <div className="search-row">
              <div className="search-wrapper">
                <svg className="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="search"
                  className="search-input"
                  placeholder="搜索示例名称或描述..."
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  autoComplete="off"
                  enterKeyHint="search"
                />
              </div>
            </div>
            <div className="tag-filter-bar">
              <button
                type="button"
                className={'clear-btn' + (activeCat === null ? ' active' : '')}
                onClick={() => setActiveCat(null)}
                aria-pressed={activeCat === null}
              >
                全部
              </button>
              {categories.map((cat) => (
                <button
                  type="button"
                  key={cat.name}
                  className={'tag-btn' + (activeCat === cat.name ? ' active' : '')}
                  style={{ ['--tag-start' as string]: cat.start, ['--tag-end' as string]: cat.end }}
                  onClick={() => setActiveCat(activeCat === cat.name ? null : cat.name)}
                  aria-pressed={activeCat === cat.name}
                >
                  <span className="tag-dot" style={{ background: cat.dot }} />
                  <span className="tag-name">{cat.name}</span>
                  <span className="tag-count">{cat.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="results-bar">
          <span className="results-count">
            显示 <strong>{stats.visible}</strong> / {stats.total} 个示例
          </span>
        </div>

        {stats.visible === 0 ? (
          <div className="empty-state">未找到匹配的示例</div>
        ) : (
          <div className="cards-grid">
            {shown.map((demo) => {
              const idx = displayIndex.get(demo.slug);
              const primary = catStyle.get(demo.categories[0] || '');
              const gradientStart = primary?.start || primary?.dot || '#888';
              const gradientEnd = primary?.end || primary?.dot || '#555';
              return (
                <a
                  key={demo.slug}
                  href={`/demos/${demo.slug}/index.html`}
                  className={'card' + (demo.autoRegistered ? ' auto-tag' : '')}
                  data-name={demo.slug}
                  onClick={(event) => handleOpen(demo, event)}
                >
                  <div className="card-header">
                    {idx !== undefined && (
                      <span
                        className="card-index"
                        style={{ background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }}
                      >
                        {idx}
                      </span>
                    )}
                    <span className="card-tags-row">
                      {demo.categories.map((category) => (
                        <span key={category} className="card-tag" style={{ ['--tag-color' as string]: catStyle.get(category)?.dot || '#888' }}>
                          {category}
                        </span>
                      ))}
                    </span>
                  </div>
                  <h3 className="card-title">{demo.title}</h3>
                  <p className="card-desc">{demo.desc}</p>
                  <div className="card-footer">
                    <span className="card-dir">{demo.slug}</span>
                    <span className="card-arrow">→</span>
                  </div>
                </a>
              );
            })}
          </div>
        )}
        {shown.length < visible.length && <div ref={sentinelRef} className="cards-sentinel" aria-hidden="true" />}
      </div>

      {openDemo && (
        <PreviewModal
          demo={openDemo}
          siblings={visible}
          onNavigate={handleNavigate}
          onClose={handleClose}
        />
      )}
    </main>
  );
}
