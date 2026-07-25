import path from 'node:path';
import tutorials from '../data/tutorials.json' with { type: 'json' };

const bySourcePath = new Map(tutorials.map((document) => [document.sourcePath, document]));
const unresolved = [];

for (const document of tutorials) {
  const linkPattern = /\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of document.content.matchAll(linkPattern)) {
    const href = match[1];
    if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) continue;

    const rawPath = href.split('#', 1)[0];
    let decodedPath = rawPath;
    try {
      decodedPath = decodeURI(rawPath);
    } catch {
      // Keep malformed input unchanged so it is reported below.
    }

    const normalized = path.posix.normalize(
      path.posix.join(path.posix.dirname(document.sourcePath), decodedPath),
    );
    const topicRoot = document.sourcePath.split('/')[0];
    const fromTopicRoot = path.posix.normalize(path.posix.join(topicRoot, decodedPath));
    const normalizedDirectory = normalized.replace(/\/+$/, '');
    const topicRootDirectory = fromTopicRoot.replace(/\/+$/, '');
    const candidates = decodedPath.endsWith('/')
      ? [
          `${normalizedDirectory}/README.md`,
          `${normalizedDirectory}/00-目录.md`,
          `${topicRootDirectory}/README.md`,
          `${topicRootDirectory}/00-目录.md`,
        ]
      : [
          normalized,
          normalized.endsWith('.md') ? normalized : `${normalized}.md`,
          fromTopicRoot,
          fromTopicRoot.endsWith('.md') ? fromTopicRoot : `${fromTopicRoot}.md`,
        ];

    const directoryTarget =
      decodedPath.endsWith('/') &&
      tutorials.some(
        (candidate) =>
          candidate.sourcePath.startsWith(`${normalizedDirectory}/`) ||
          candidate.sourcePath.startsWith(`${topicRootDirectory}/`),
      );
    const topicIndexFallback =
      normalized === `${topicRoot}/00-目录.md` &&
      tutorials.some((candidate) => candidate.topic === document.topic);

    if (
      !candidates.some((candidate) => bySourcePath.has(candidate)) &&
      !directoryTarget &&
      !topicIndexFallback
    ) {
      unresolved.push({ source: document.sourcePath, href });
    }
  }
}

if (unresolved.length > 0) {
  console.error(`Found ${unresolved.length} unresolved internal tutorial links:`);
  for (const item of unresolved.slice(0, 40)) {
    console.error(`- ${item.source} -> ${item.href}`);
  }
  process.exitCode = 1;
} else {
  console.log(`Checked ${tutorials.length} documents: all internal tutorial links resolve.`);
}
