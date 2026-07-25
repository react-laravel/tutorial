import path from 'node:path';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  getTutorialBySourcePath,
  tutorialDocs,
  type TutorialDoc,
} from '@/lib/tutorials';

type Props = {
  document: TutorialDoc;
};

function textFromChildren(children: ReactNode): string {
  if (typeof children === 'string' || typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    return textFromChildren((children as { props: { children?: ReactNode } }).props.children);
  }
  return '';
}

function headingId(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function resolveHref(current: TutorialDoc, href?: string): string {
  if (!href || /^(?:https?:|mailto:|tel:|#)/i.test(href)) return href || '#';

  const [rawPath, hash] = href.split('#', 2);
  let decodedPath = rawPath;
  try {
    decodedPath = decodeURI(rawPath);
  } catch {
    // Keep the original href when it contains malformed escaping.
  }

  const currentDirectory = path.posix.dirname(current.sourcePath);
  const normalized = path.posix.normalize(path.posix.join(currentDirectory, decodedPath));
  const topicRoot = current.sourcePath.split('/')[0];
  const fromTopicRoot = path.posix.normalize(path.posix.join(topicRoot, decodedPath));
  const normalizedDirectory = normalized.replace(/\/+$/, '');
  const topicRootDirectory = fromTopicRoot.replace(/\/+$/, '');
  const candidates = decodedPath.endsWith('/')
    ? [
        `${normalizedDirectory}/README.md`,
        `${normalizedDirectory}/00-目录.md`,
        `${topicRootDirectory}/README.md`,
        `${topicRootDirectory}/00-目录.md`,
      ]
    : [
        normalized,
        normalized.endsWith('.md') ? normalized : `${normalized}.md`,
        fromTopicRoot,
        fromTopicRoot.endsWith('.md') ? fromTopicRoot : `${fromTopicRoot}.md`,
      ];
  let target = candidates.map(getTutorialBySourcePath).find(Boolean);

  if (!target && decodedPath.endsWith('/')) {
    target = tutorialDocs.find(
      (document) =>
        document.sourcePath.startsWith(`${normalizedDirectory}/`) ||
        document.sourcePath.startsWith(`${topicRootDirectory}/`),
    );
  }

  if (!target && normalized === `${topicRoot}/00-目录.md`) {
    target =
      tutorialDocs.find(
        (document) =>
          document.topic === current.topic &&
          (document.sourcePath.endsWith('/简单通关/00-目录.md') ||
            document.sourcePath.endsWith('/README.md')),
      ) || tutorialDocs.find((document) => document.topic === current.topic);
  }

  if (!target) return href;
  return `/learn/${encodeURI(target.slug)}${hash ? `#${hash}` : ''}`;
}

function isExternalHref(href: string): boolean {
  return /^(?:https?:|mailto:|tel:)/i.test(href);
}

export default function MarkdownArticle({ document }: Props) {
  const headingCounts = new Map<string, number>();
  const getHeadingId = (children: ReactNode) => {
    const base = headingId(textFromChildren(children)) || 'section';
    const count = (headingCounts.get(base) || 0) + 1;
    headingCounts.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={getHeadingId(children)}>{children}</h2>,
          h3: ({ children }) => <h3 id={getHeadingId(children)}>{children}</h3>,
          a: ({ href, children, ...props }) => {
            const resolved = resolveHref(document, href);
            const external = isExternalHref(resolved);
            return (
              <a
                href={resolved}
                {...props}
                {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
              >
                {children}
              </a>
            );
          },
          table: ({ children }) => (
            <div className="table-scroll">
              <table>{children}</table>
            </div>
          ),
          pre: ({ children }) => <pre className="article-code">{children}</pre>,
          code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'>) => (
            <code className={className} {...props}>{children}</code>
          ),
        }}
      >
        {document.content}
      </ReactMarkdown>
    </div>
  );
}
