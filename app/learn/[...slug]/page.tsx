import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import DocsSidebar from '@/components/DocsSidebar';
import MarkdownArticle from '@/components/MarkdownArticle';
import {
  getTopicTutorials,
  getTutorialBySlug,
  getTutorialNeighbors,
} from '@/lib/tutorials';

type Props = {
  params: Promise<{ slug: string[] }>;
};

function decodeSlug(segments: string[]): string {
  return segments
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join('/');
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const document = getTutorialBySlug(decodeSlug(slug));
  if (!document) notFound();

  const canonical = `/learn/${encodeURI(document.slug)}`;
  return {
    title: document.title,
    description: document.description,
    alternates: { canonical },
    openGraph: {
      title: document.title,
      description: document.description,
      url: canonical,
    },
    twitter: {
      title: document.title,
      description: document.description,
    },
  };
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const document = getTutorialBySlug(decodeSlug(slug));
  if (!document) notFound();

  const topicDocuments = getTopicTutorials(document.topic);
  const { previous, next, position, total } = getTutorialNeighbors(document);
  const topicStart = topicDocuments[0];
  const sectionStart = topicDocuments.find((item) => item.section === document.section) ?? document;

  return (
    <main className="docs-page">
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <input id="course-nav-toggle" className="course-nav-toggle" type="checkbox" />
          <label htmlFor="course-nav-toggle">打开本课程目录</label>
          <div className="docs-sidebar-panel">
            <DocsSidebar current={document} documents={topicDocuments} />
          </div>
        </aside>

        <article className="docs-article">
          {document.headings.length > 0 && (
            <details className="mobile-page-outline">
              <summary>本页目录</summary>
              <nav aria-label="本页目录">
                {document.headings.map((heading) => (
                  <a
                    href={`#${heading.id}`}
                    className={heading.depth === 3 ? 'depth-three' : ''}
                    key={`${heading.id}-${heading.text}`}
                  >
                    {heading.text}
                  </a>
                ))}
              </nav>
            </details>
          )}

          <div className="article-breadcrumbs">
            <Link href="/">教程网</Link>
            <span>/</span>
            {topicStart && topicStart.slug !== document.slug ? (
              <Link href={`/learn/${encodeURI(topicStart.slug)}`}>{document.topicTitle}</Link>
            ) : (
              <span>{document.topicTitle}</span>
            )}
            <span>/</span>
            {sectionStart.slug !== document.slug ? (
              <Link href={`/learn/${encodeURI(sectionStart.slug)}`}>{document.sectionTitle}</Link>
            ) : (
              <span>{document.sectionTitle}</span>
            )}
          </div>

          <header className="article-header">
            <span className="article-series">{document.topicTitle} · {position}/{total}</span>
            <h1>{document.title}</h1>
            <p>{document.description}</p>
            <div className="article-meta">
              <span>约 {document.minutes} 分钟</span>
              <span>{document.characters.toLocaleString('zh-CN')} 字</span>
              <span>免费阅读</span>
            </div>
          </header>

          <MarkdownArticle document={document} />

          <nav className="article-pagination" aria-label="上一篇和下一篇">
            {previous ? (
              <Link href={`/learn/${encodeURI(previous.slug)}`}>
                <small>← 上一篇</small>
                <strong>{previous.title}</strong>
              </Link>
            ) : <span />}
            {next ? (
              <Link className="next" href={`/learn/${encodeURI(next.slug)}`}>
                <small>下一篇 →</small>
                <strong>{next.title}</strong>
              </Link>
            ) : <span />}
          </nav>
        </article>

        <aside className="article-outline">
          <span>本页目录</span>
          {document.headings.length > 0 ? (
            <nav aria-label="本页目录">
              {document.headings.map((heading) => (
                <a
                  href={`#${heading.id}`}
                  className={heading.depth === 3 ? 'depth-three' : ''}
                  key={`${heading.id}-${heading.text}`}
                >
                  {heading.text}
                </a>
              ))}
            </nav>
          ) : (
            <small>短篇教程，可直接向下阅读。</small>
          )}
        </aside>
      </div>
    </main>
  );
}
