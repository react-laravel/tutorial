import tutorialsData from '@/data/tutorials.json';

export type TutorialHeading = {
  depth: number;
  text: string;
  id: string;
};

export type TutorialDoc = {
  id: string;
  slug: string;
  sourcePath: string;
  topic: 'minecraft' | 'blender' | 'laravel';
  topicTitle: string;
  section: string;
  sectionTitle: string;
  title: string;
  description: string;
  content: string;
  headings: TutorialHeading[];
  minutes: number;
  characters: number;
};

export type TutorialMeta = Omit<TutorialDoc, 'content'>;

export const tutorialDocs = tutorialsData as TutorialDoc[];

export const tutorialMeta: TutorialMeta[] = tutorialDocs.map(({ content: _content, ...document }) => document);

const docsBySlug = new Map(tutorialDocs.map((document) => [document.slug, document]));
const docsBySourcePath = new Map(tutorialDocs.map((document) => [document.sourcePath, document]));

export function getTutorialBySlug(slug: string): TutorialDoc | undefined {
  return docsBySlug.get(slug);
}

export function getTutorialBySourcePath(sourcePath: string): TutorialDoc | undefined {
  return docsBySourcePath.get(sourcePath);
}

export function getTopicTutorials(topic: TutorialDoc['topic']): TutorialDoc[] {
  return tutorialDocs.filter((document) => document.topic === topic);
}

export function getTutorialNeighbors(document: TutorialDoc) {
  const topicDocuments = getTopicTutorials(document.topic);
  const index = topicDocuments.findIndex((item) => item.slug === document.slug);

  return {
    previous: index > 0 ? topicDocuments[index - 1] : null,
    next: index >= 0 && index < topicDocuments.length - 1 ? topicDocuments[index + 1] : null,
    position: index + 1,
    total: topicDocuments.length,
  };
}
