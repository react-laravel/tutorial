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
  if (!document) return {};

  return {
    title: `${document.title} | DogeOW 教程网`,
    description: document.description,
    alternates: { canonical: `/learn/${encodeURI(document.slug)}` },
  };
}

export default async function TutorialPage({ params }: Props) {
  const { slug } = await params;
  const document = getTutorialBySlug(decodeSlug(slug));
  if (!document) notFound();

  const topicDocuments = getTopicTutorials(document.topic);
  const { previous, next, position, total } = getTutorialNeighbors(document);

  return (
    <main className="docs-page">
      <div className="docs-layout">
        <aside className="docs-sidebar">
          <DocsSidebar current={document} documents={topicDocuments} />
        </aside>

        <article className="docs-article">
          <details className="mobile-doc-nav">
            <summary>打开本课程目录</summary>
            <DocsSidebar current={document} documents={topicDocuments} />
          </details>

          <div className="article-breadcrumbs">
            <Link href="/">教程网</Link>
            <span>/</span>
            <span>{document.topicTitle}</span>
            <span>/</span>
            <span>{document.sectionTitle}</span>
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
              {document.headings.slice(0, 18).map((heading) => (
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
