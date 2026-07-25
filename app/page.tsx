import TutorialLanding, {
  type LandingTopic,
  type SearchItem,
} from '@/components/TutorialLanding';
import { demos } from '@/lib/demos';
import { tutorialMeta } from '@/lib/tutorials';

export default function Page() {
  const counts = tutorialMeta.reduce<Record<string, number>>((result, document) => {
    result[document.topic] = (result[document.topic] || 0) + 1;
    return result;
  }, {});

  const topics: LandingTopic[] = [
    {
      id: 'minecraft',
      eyebrow: 'SURVIVAL HANDBOOK',
      title: 'Minecraft 生存',
      description: '从开局、建家、采矿到村民、生电与首领战，一套能长期玩的完整生存手册。',
      href: '/learn/minecraft/简单通关/00-目录',
      count: counts.minecraft || 0,
      unit: '篇教程',
      mark: 'MC',
      tone: 'topic-minecraft',
      tags: ['稳妥通关', '生存机制', '自动化'],
    },
    {
      id: 'blender',
      eyebrow: 'ZERO TO FIRST RENDER',
      title: 'Blender 5.1',
      description: '面向零基础的 14 天课程，覆盖建模、材质、灯光、渲染和三个完整实战。',
      href: '/learn/blender/overview',
      count: counts.blender || 0,
      unit: '篇教程',
      mark: 'B3',
      tone: 'topic-blender',
      tags: ['零基础', '建模', '渲染'],
    },
    {
      id: 'laravel',
      eyebrow: 'READ THE FRAMEWORK',
      title: 'Laravel 请求生命周期',
      description: '从 public/index.php 开始，像单步调试一样跟完一次请求的真实调用路径。',
      href: '/learn/laravel/overview',
      count: counts.laravel || 0,
      unit: '篇源码笔记',
      mark: 'L',
      tone: 'topic-laravel',
      tags: ['Laravel 13', '源码', 'HTTP'],
    },
    {
      id: 'threejs',
      eyebrow: 'RUN · EDIT · LEARN',
      title: 'Three.js 互动实验室',
      description: '每个示例都能直接运行、查看源码并现场修改，让 3D 图形知识真正动起来。',
      href: '/threejs',
      count: demos.length,
      unit: '个互动示例',
      mark: '3D',
      tone: 'topic-three',
      tags: ['WebGL', '可运行', '源码编辑'],
    },
  ];

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

  return (
    <TutorialLanding
      topics={topics}
      items={[...tutorialItems, ...demoItems]}
      tutorialCount={tutorialMeta.length}
      demoCount={demos.length}
    />
  );
}
