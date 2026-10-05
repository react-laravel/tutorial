import tutorialsMetaData from '@/data/tutorials-meta.json';

export type TutorialHeading = {
  depth: number;
  text: string;
  id: string;
};

export type TutorialMeta = {
  id: string;
  slug: string;
  sourcePath: string;
  topic: 'minecraft' | 'blender' | 'laravel';
  topicTitle: string;
  section: string;
  sectionTitle: string;
  title: string;
  description: string;
  headings: TutorialHeading[];
  minutes: number;
  characters: number;
};

export type TutorialDoc = TutorialMeta & {
  content: string;
};

export const tutorialMeta = tutorialsMetaData as TutorialMeta[];
