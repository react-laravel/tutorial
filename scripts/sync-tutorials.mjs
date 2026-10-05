import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, '..');
const contentRoot = path.join(appRoot, 'tutorials');

const sources = [
  {
    directory: '我的世界生存',
    topic: 'minecraft',
    topicTitle: 'Minecraft 生存',
    sectionAliases: {},
  },
  {
    directory: 'blender',
    topic: 'blender',
    topicTitle: 'Blender 5.1',
    sectionAliases: {},
  },
  {
    directory: 'laravel-request-lifecycle',
    topic: 'laravel',
    topicTitle: 'Laravel 请求生命周期',
    sectionAliases: {
      '00-overview': '总览',
      '01-entry': '入口',
      '02-application': '应用构建',
      '03-request': '请求接管',
      '04-bootstrap': '启动引导',
      '05-routing': '路由调度',
      '06-response': '响应发送',
      appendix: '附录',
    },
  },
];

const collator = new Intl.Collator('zh-CN', { numeric: true, sensitivity: 'base' });

async function walkMarkdown(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries.sort((a, b) => collator.compare(a.name, b.name))) {
    if (entry.name.startsWith('.')) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walkMarkdown(fullPath)));
    else if (entry.isFile() && entry.name.toLowerCase().endsWith('.md')) files.push(fullPath);
  }

  return files;
}

function cleanInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[`*_~]/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function headingId(value) {
  return cleanInlineMarkdown(value)
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

function extractTitle(content, fallback) {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? cleanInlineMarkdown(match[1]) : fallback;
}

function firstDescriptionLine(content, allowLists) {
  const lines = content.split(/\r?\n/);
  let inFence = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (
      inFence ||
      !line ||
      line.startsWith('#') ||
      line.startsWith('>') ||
      line.startsWith('|') ||
      /^[-*_]{3,}$/.test(line)
    ) {
      continue;
    }

    let body = line;
    if (/^[-*+]\s+/.test(line) || /^\d+[.)]\s+/.test(line)) {
      if (!allowLists) continue;
      body = line.replace(/^[-*+]\s+/, '').replace(/^\d+[.)]\s+/, '');
    }

    const cleaned = cleanInlineMarkdown(body);
    if (cleaned.length >= 12) return cleaned.slice(0, 150);
  }

  return '';
}

function extractDescription(content) {
  return (
    firstDescriptionLine(content, false) ||
    firstDescriptionLine(content, true) ||
    'DogeOW 教程网收录的系统学习笔记。'
  );
}

function stripTitle(content) {
  return content.replace(/^#\s+.+(?:\r?\n)+/, '');
}

function sectionTitle(source, relativePath) {
  const parts = relativePath.split('/');
  if (parts.length === 1) return '课程导览';
  const section = parts[0];
  return (
    source.sectionAliases[section] ||
    section
      .replace(/^\d+[-_.]?/, '')
      .replace(/[-_]+/g, ' ')
      .trim()
  );
}

function buildSlug(source, relativePath) {
  const withoutExtension = relativePath.replace(/\.md$/i, '');
  if (withoutExtension.toLowerCase() === 'readme') return `${source.topic}/overview`;
  return `${source.topic}/${withoutExtension}`;
}

function extractHeadings(content) {
  const seen = new Map();
  return content
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{2,3})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => {
      const text = cleanInlineMarkdown(match[2]);
      const base = headingId(text) || 'section';
      const count = (seen.get(base) || 0) + 1;
      seen.set(base, count);
      return {
        depth: match[1].length,
        text,
        id: count === 1 ? base : `${base}-${count}`,
      };
    });
}

function readingStats(content) {
  const plain = content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#>*_`|[\]()~-]/g, ' ')
    .replace(/\s+/g, '');
  const characters = plain.length;
  return {
    characters,
    minutes: Math.max(1, Math.ceil(characters / 450)),
  };
}

const documents = [];

for (const source of sources) {
  const sourceRoot = path.join(contentRoot, source.directory);
  const files = await walkMarkdown(sourceRoot);

  for (const file of files) {
    const relativePath = path.relative(sourceRoot, file).split(path.sep).join('/');
    const rawContent = await readFile(file, 'utf8');
    const fallbackTitle = path.basename(relativePath, '.md').replace(/^\d+[-_.]?/, '');
    const stats = readingStats(rawContent);

    documents.push({
      id: `${source.topic}:${relativePath}`,
      slug: buildSlug(source, relativePath),
      sourcePath: `${source.directory}/${relativePath}`,
      topic: source.topic,
      topicTitle: source.topicTitle,
      section: relativePath.includes('/') ? relativePath.split('/')[0] : 'overview',
      sectionTitle: sectionTitle(source, relativePath),
      title: extractTitle(rawContent, fallbackTitle),
      description: extractDescription(rawContent),
      content: stripTitle(rawContent),
      headings: extractHeadings(rawContent),
      minutes: stats.minutes,
      characters: stats.characters,
    });
  }
}

const leadingSections = {
  minecraft: ['简单通关'],
};

function sectionRank(document) {
  if (document.section === 'overview' || document.sourcePath.endsWith('/README.md')) return -1;
  const preferred = leadingSections[document.topic] || [];
  const index = preferred.indexOf(document.section);
  return index >= 0 ? index : 100;
}

documents.sort((a, b) => {
  const sourceOrder = sources.findIndex((source) => source.topic === a.topic) -
    sources.findIndex((source) => source.topic === b.topic);
  if (sourceOrder) return sourceOrder;
  const rank = sectionRank(a) - sectionRank(b);
  return rank || collator.compare(a.sourcePath, b.sourcePath);
});

await writeFile(
  path.join(appRoot, 'data', 'tutorials.json'),
  `${JSON.stringify(documents, null, 2)}\n`,
  'utf8',
);

const metaDocuments = documents.map(({ content: _content, ...document }) => document);
await writeFile(
  path.join(appRoot, 'data', 'tutorials-meta.json'),
  `${JSON.stringify(metaDocuments, null, 2)}\n`,
  'utf8',
);

const counts = Object.fromEntries(
  sources.map((source) => [
    source.topic,
    documents.filter((document) => document.topic === source.topic).length,
  ]),
);

console.log(`Synced ${documents.length} tutorial documents`, counts);
