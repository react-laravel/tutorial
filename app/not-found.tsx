import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="not-found-page">
      <span>404 / LOST LESSON</span>
      <h1>这篇教程还不在这里。</h1>
      <p>可能是链接改名了，也可能是你发现了一条尚未整理的学习路线。</p>
      <Link href="/">返回教程网首页</Link>
    </main>
  );
}
