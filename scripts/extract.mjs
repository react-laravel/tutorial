#!/usr/bin/env node
// Merge demo card metadata with directories under public/demos.
// A legacy index.html at the project root is optional. When it is absent,
// titles already stored in data/demos.json are kept.

import { readFileSync, readdirSync, writeFileSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const APP_ROOT = path.resolve(path.dirname(__filename), '..');
const DEMOS_ROOT = path.join(APP_ROOT, 'public', 'demos');
const HTML_PATH = path.join(APP_ROOT, 'index.html');
const OUT_DIR = path.join(APP_ROOT, 'data');
const DEMOS_JSON = path.join(OUT_DIR, 'demos.json');
const CATEGORIES_JSON = path.join(OUT_DIR, 'categories.json');

function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

const categories = [];
let cards = [];

if (existsSync(HTML_PATH)) {
  const html = readFileSync(HTML_PATH, 'utf8');
  const tagBtnRe =
    /<button class="tag-btn" data-tag="([^"]+)" style="--tag-start:(#[0-9a-fA-F]+);--tag-end:(#[0-9a-fA-F]+)"[^>]*>[\s\S]*?<span class="tag-dot" style="background:(#[0-9a-fA-F]+)"><\/span>/g;
  for (const match of html.matchAll(tagBtnRe)) {
    categories.push({ name: match[1], start: match[2], end: match[3], dot: match[4] });
  }

  const cardRe =
    /<a href="\.\/([^"]+?)\/" class="card" data-categories="([^"]*)" data-name="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  for (const match of html.matchAll(cardRe)) {
    const slug = match[1];
    const categoriesCsv = match[2];
    const name = match[3];
    const inner = match[4];
    const titleMatch = inner.match(/<h3 class="card-title">([^<]+)<\/h3>/);
    const descMatch = inner.match(/<p class="card-desc">([^<]*)<\/p>/);
    const indexMatch = inner.match(/<span class="card-index"[^>]*>(\d+)<\/span>/);
    const features = [];
    const featRe = /<span class="feat-badge"[^>]*>([^<]+)<\/span>/g;
    for (const feature of inner.matchAll(featRe)) features.push(feature[1]);
    const extraMatch = inner.match(/<span class="feat-extra">\+(\d+)<\/span>/);
    cards.push({
      slug,
      name,
      title: titleMatch ? titleMatch[1] : prettify(slug),
      desc: descMatch ? descMatch[1] : '',
      categories: categoriesCsv ? categoriesCsv.split(',').filter(Boolean) : [],
      index: indexMatch ? Number(indexMatch[1]) : null,
      features,
      extraCount: extraMatch ? Number(extraMatch[1]) : 0,
    });
  }
} else {
  cards = readJson(DEMOS_JSON, []);
  categories.push(...readJson(CATEGORIES_JSON, []));
  console.log('No legacy index.html. Keeping metadata already stored in data/demos.json.');
}

function hasIndex(slug) {
  return existsSync(path.join(DEMOS_ROOT, slug, 'index.html'));
}

const removed = cards.filter((card) => !hasIndex(card.slug)).map((card) => card.slug);
cards = cards.filter((card) => hasIndex(card.slug));

const registered = new Set(cards.map((card) => card.slug));
const demoDirs = collectDemoDirs(DEMOS_ROOT);
const missing = demoDirs.filter((slug) => !registered.has(slug));

console.log(`Cards with index.html: ${cards.length}, directories: ${demoDirs.length}, new: ${missing.length}, removed: ${removed.length}`);

for (const slug of missing) {
  const title = titleFromIndex(slug);
  cards.push({
    slug,
    name: slug,
    title,
    desc: `${title}。可在画廊中直接运行。`,
    categories: ['其他效果'],
    index: null,
    features: [],
    extraCount: 0,
    autoRegistered: true,
  });
}

cards.sort((a, b) => {
  const aIndex = a.index ?? Number.MAX_SAFE_INTEGER;
  const bIndex = b.index ?? Number.MAX_SAFE_INTEGER;
  if (aIndex !== bIndex) return aIndex - bIndex;
  return a.slug.localeCompare(b.slug, 'zh-CN', { numeric: true, sensitivity: 'base' });
});

const categoryCount = new Map();
for (const card of cards) {
  for (const category of card.categories) categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
}
for (const category of categories) category.count = categoryCount.get(category.name) || 0;
if (!categories.find((category) => category.name === '其他效果')) {
  categories.push({
    name: '其他效果',
    start: '#94a3b8',
    end: '#64748b',
    dot: '#94a3b8',
    count: categoryCount.get('其他效果') || 0,
  });
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'demos.json'), `${JSON.stringify(cards, null, 2)}\n`);
writeFileSync(path.join(OUT_DIR, 'categories.json'), `${JSON.stringify(categories, null, 2)}\n`);
console.log(`Wrote ${cards.length} demos → data/demos.json`);
if (removed.length) console.log(`Dropped entries without index.html: ${removed.join(', ')}`);

function collectDemoDirs(root) {
  if (!existsSync(root)) return [];
  const found = [];
  for (const name of readdirSync(root)) {
    if (name.startsWith('.')) continue;
    const dir = path.join(root, name);
    let info;
    try {
      info = statSync(dir);
    } catch {
      continue;
    }
    if (!info.isDirectory()) continue;
    if (existsSync(path.join(dir, 'index.html'))) {
      found.push(name);
      continue;
    }
    for (const child of readdirSync(dir)) {
      if (child.startsWith('.')) continue;
      const childDir = path.join(dir, child);
      try {
        if (statSync(childDir).isDirectory() && existsSync(path.join(childDir, 'index.html'))) {
          found.push(`${name}/${child}`);
        }
      } catch {
        // Skip unreadable entries.
      }
    }
  }
  return found.sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true, sensitivity: 'base' }));
}

function titleFromIndex(slug) {
  try {
    const html = readFileSync(path.join(DEMOS_ROOT, slug, 'index.html'), 'utf8');
    const match = html.match(/<title>([^<]+)<\/title>/i);
    if (match) {
      const title = match[1].replace(/^\s*\d+\s*[·.\-]\s*/, '').trim();
      if (title) return title;
    }
  } catch {
    // Fall through to the slug label.
  }
  return prettify(slug.split('/').pop() || slug);
}

function prettify(slug) {
  return slug
    .replace(/^\d+-/, '')
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}
