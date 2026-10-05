import { demos } from '@/lib/demos';
import { tutorialMeta } from '@/lib/tutorial-meta';

type SearchItem = {
  id: string;
  type: '教程' | '示例';
  title: string;
  description: string;
  href: string;
  topic: string;
  section: string;
  keywords: string;
};

export const dynamic = 'force-static';

export function GET() {
  const tutorialItems: SearchItem[] = tutorialMeta.map((document) => ({
    id: document.id,
    type: '教程',
    title: document.title,
    description: document.description,
    href: `/learn/${encodeURI(document.slug)}`,
    topic: document.topicTitle,
    section: document.sectionTitle,
    keywords: `${document.sourcePath} ${document.topic}`,
  }));

  const demoItems: SearchItem[] = demos.map((demo) => ({
    id: `three:${demo.slug}`,
    type: '示例',
    title: demo.title,
    description: demo.desc,
    href: `/threejs?open=${encodeURIComponent(demo.slug)}`,
    topic: 'Three.js 互动实验室',
    section: demo.categories.join(' · '),
    keywords: `${demo.slug} ${demo.features.join(' ')}`,
  }));

  return Response.json([...tutorialItems, ...demoItems], {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
