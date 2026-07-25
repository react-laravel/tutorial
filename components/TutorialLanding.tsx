'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';

export type LandingTopic = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  count: number;
  unit: string;
  mark: string;
  tone: string;
  tags: string[];
};

export type SearchItem = {
  id: string;
  type: '教程' | '示例';
  title: string;
  description: string;
  href: string;
  topic: string;
  section: string;
  keywords: string;
};

type Props = {
  topics: LandingTopic[];
  items: SearchItem[];
  tutorialCount: number;
  demoCount: number;
};

const quickSearches = ['稳妥通关', 'Blender 建模', 'Laravel 路由', 'Three.js 光照'];

function scoreItem(item: SearchItem, query: string): number {
  const title = item.title.toLowerCase();
  const section = item.section.toLowerCase();
  const haystack = `${title} ${section} ${item.description} ${item.keywords}`.toLowerCase();
  if (!haystack.includes(query)) return -1;
  if (title === query) return 100;
  if (title.startsWith(query)) return 70;
  if (title.includes(query)) return 50;
  if (section.includes(query)) return 30;
  return 10;
}

export default function TutorialLanding({ topics, items, tutorialCount, demoCount }: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const normalizedQuery = query.trim().toLowerCase();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key === '/' && target?.tagName !== 'INPUT' && target?.tagName !== 'TEXTAREA') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    if (!normalizedQuery) return [];
    return items
      .map((item) => ({ item, score: scoreItem(item, normalizedQuery) }))
      .filter((result) => result.score >= 0)
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title, 'zh-CN'))
      .slice(0, 18)
      .map((result) => result.item);
  }, [items, normalizedQuery]);

  return (
    <main className="landing-page">
      <section className="landing-hero">
        <div className="site-container">
          <div className="hero-grid">
            <div className="hero-copy">
              <span className="hero-kicker">
                <span className="live-dot" />
                DogeOW 学习资料库
              </span>
              <h1>
                把复杂的事，
                <br />
                讲到<span>能动手。</span>
              </h1>
              <p>
                从一晚能读完的源码笔记，到可以一路练习的完整课程。
                所有教程免费开放，按你真正会遇到的顺序整理。
              </p>
            </div>

            <aside className="hero-note" aria-label="教程网说明">
              <span className="hero-note-index">01</span>
              <p>不是链接堆砌。</p>
              <strong>每个主题都整理成可以顺着学下去的路径。</strong>
              <span className="hero-note-line" />
              <small>持续补充 · 免费阅读</small>
            </aside>
          </div>

          <div className="hero-search" id="search">
            <label htmlFor="global-search">搜索全部教程与可运行示例</label>
            <div className="hero-search-box">
              <span className="search-glyph" aria-hidden="true">⌕</span>
              <input
                id="global-search"
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例如：村民交易、UV 展开、路由调度、着色器…"
                autoComplete="off"
              />
              {query ? (
                <button type="button" onClick={() => setQuery('')} aria-label="清空搜索">
                  清空
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </div>
            <div className="quick-searches" aria-label="快捷搜索">
              <span>试试：</span>
              {quickSearches.map((value) => (
                <button type="button" onClick={() => setQuery(value)} key={value}>
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="hero-stats" aria-label="内容统计">
            <div>
              <strong>{tutorialCount}</strong>
              <span>篇系统教程</span>
            </div>
            <div>
              <strong>{demoCount}</strong>
              <span>个互动示例</span>
            </div>
            <div>
              <strong>4</strong>
              <span>条学习主线</span>
            </div>
            <div>
              <strong>0</strong>
              <span>付费门槛</span>
            </div>
          </div>
        </div>
      </section>

      {normalizedQuery ? (
        <section className="search-results-section">
          <div className="site-container">
            <div className="section-heading">
              <div>
                <span className="section-number">SEARCH</span>
                <h2>搜索结果</h2>
              </div>
              <p>找到 {results.length} 个最相关结果</p>
            </div>
            {results.length > 0 ? (
              <div className="search-result-list">
                {results.map((item) => (
                  <Link className="search-result-card" href={item.href} key={item.id}>
                    <span className="result-type">{item.type}</span>
                    <div>
                      <small>{item.topic} / {item.section}</small>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </div>
                    <span className="result-arrow" aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <strong>没有找到“{query}”</strong>
                <p>换一个更短的关键词试试，例如“村民”“建模”或“路由”。</p>
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section className="topics-section">
            <div className="site-container">
              <div className="section-heading">
                <div>
                  <span className="section-number">02 / DIRECTIONS</span>
                  <h2>选择一个方向</h2>
                </div>
                <p>不必先设计完美路线，选一个现在最想解决的问题。</p>
              </div>

              <div className="topic-grid">
                {topics.map((topic, index) => (
                  <Link className={`topic-card ${topic.tone}`} href={topic.href} key={topic.id}>
                    <div className="topic-card-top">
                      <span className="topic-index">0{index + 1}</span>
                      <span className="topic-mark">{topic.mark}</span>
                    </div>
                    <span className="topic-eyebrow">{topic.eyebrow}</span>
                    <h3>{topic.title}</h3>
                    <p>{topic.description}</p>
                    <div className="topic-tags">
                      {topic.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                    <div className="topic-card-footer">
                      <span><strong>{topic.count}</strong> {topic.unit}</span>
                      <span>开始学习 →</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="paths-section">
            <div className="site-container paths-grid">
              <div className="paths-intro">
                <span className="section-number">03 / START HERE</span>
                <h2>第一次来？<br />从这三条路径开始。</h2>
                <p>我们已经把先后顺序排好。你只需要打开第一篇，然后继续向下读。</p>
              </div>

              <div className="path-list">
                <Link href="/learn/minecraft/简单通关/00-目录" className="path-item">
                  <span className="path-count">18 步</span>
                  <div>
                    <small>MINECRAFT · 新手路线</small>
                    <h3>从第一棵树，到击败末影龙</h3>
                    <p>以“少暴毙、少走弯路”为目标的稳妥通关流程。</p>
                  </div>
                  <span aria-hidden="true">01</span>
                </Link>
                <Link href="/learn/blender/overview" className="path-item">
                  <span className="path-count">14 天</span>
                  <div>
                    <small>BLENDER · 零基础课程</small>
                    <h3>做出你的第一个完整 3D 作品</h3>
                    <p>界面、建模、材质、灯光、渲染，顺序练完整条工作流。</p>
                  </div>
                  <span aria-hidden="true">02</span>
                </Link>
                <Link href="/learn/laravel/overview" className="path-item">
                  <span className="path-count">16 站</span>
                  <div>
                    <small>LARAVEL · 源码阅读</small>
                    <h3>跟着一次 HTTP 请求走完整个框架</h3>
                    <p>从 public/index.php 开始，读到响应发送与终止逻辑。</p>
                  </div>
                  <span aria-hidden="true">03</span>
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
