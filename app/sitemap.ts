import type { MetadataRoute } from 'next';
import { tutorialMeta } from '@/lib/tutorial-meta';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://tutorial.dogeow.com';
  return [
    {
      url: baseUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/threejs`,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    ...tutorialMeta.map((document) => ({
      url: `${baseUrl}/learn/${encodeURI(document.slug)}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ];
}
