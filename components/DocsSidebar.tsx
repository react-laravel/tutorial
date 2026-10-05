import Link from 'next/link';
import ScrollActiveIntoView from '@/components/ScrollActiveIntoView';
import type { TutorialDoc } from '@/lib/tutorials';

type Props = {
  current: TutorialDoc;
  documents: TutorialDoc[];
};

function groupedBySection(documents: TutorialDoc[]) {
  const groups = new Map<string, { title: string; documents: TutorialDoc[] }>();
  for (const document of documents) {
    const existing = groups.get(document.section);
    if (existing) existing.documents.push(document);
    else groups.set(document.section, { title: document.sectionTitle, documents: [document] });
  }
  return Array.from(groups.entries());
}

export default function DocsSidebar({ current, documents }: Props) {
  const groups = groupedBySection(documents);

  return (
    <nav className="docs-sidebar-nav" aria-label={`${current.topicTitle} 教程目录`}>
      <ScrollActiveIntoView />
      <div className="docs-course-label">
        <span>{current.topicTitle}</span>
        <small>{documents.length} 篇</small>
      </div>
      {groups.map(([section, group]) => (
        <details
          className="docs-section"
          key={section}
          open={group.documents.some((document) => document.slug === current.slug) || documents.length < 30}
        >
          <summary>
            <span>{group.title}</span>
            <small>{group.documents.length}</small>
          </summary>
          <div className="docs-section-links">
            {group.documents.map((document) => (
              <Link
                href={`/learn/${encodeURI(document.slug)}`}
                className={document.slug === current.slug ? 'active' : ''}
                aria-current={document.slug === current.slug ? 'page' : undefined}
                key={document.slug}
              >
                {document.title}
              </Link>
            ))}
          </div>
        </details>
      ))}
    </nav>
  );
}
