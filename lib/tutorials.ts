import tutorialsData from '@/data/tutorials.json';
import type { TutorialDoc } from '@/lib/tutorial-meta';

export type { TutorialDoc, TutorialHeading, TutorialMeta } from '@/lib/tutorial-meta';

export const tutorialDocs = tutorialsData as TutorialDoc[];

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
