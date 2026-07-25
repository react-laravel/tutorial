import Home from '@/components/Home';
import { categories, demos } from '@/lib/demos';

type Props = {
  searchParams: Promise<{ open?: string }>;
};

export const metadata = {
  title: 'Three.js 互动实验室',
  description: '562 个可运行、可查看源码、可直接修改预览的 Three.js 示例。',
};

export default async function ThreeJsPage({ searchParams }: Props) {
  const { open } = await searchParams;
  return <Home demos={demos} categories={categories} initialOpenSlug={open} />;
}
