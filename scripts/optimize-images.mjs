#!/usr/bin/env bun
import { mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname, basename } from 'node:path';
import sharp from 'sharp';

const IMG_DIR = join(process.cwd(), 'img');
const targets = ['home-light.png', 'home-dark.png'];

async function ensureDir(p) {
  try { await mkdir(p, { recursive: true }); } catch {}
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function convertOne(inputPath) {
  const outBase = inputPath.slice(0, -extname(inputPath).length);
  const avifOut = `${outBase}.avif`;
  const webpOut = `${outBase}.webp`;

  const img = sharp(inputPath).trim();

  // AVIF: good general-purpose lossy compression
  await img
    .clone()
    .avif({ quality: 55, effort: 4 })
    .toFile(avifOut);

  // WebP: near-lossless for crisp logos/text, smaller than PNG
  await img
    .clone()
    .webp({ quality: 90, effort: 4, lossless: true })
    .toFile(webpOut);

  return { avifOut, webpOut };
}

async function main() {
  await ensureDir(IMG_DIR);
  const results = [];
  for (const name of targets) {
    const p = join(IMG_DIR, name);
    if (!(await exists(p))) {
      console.warn(`[optimize-images] Skip missing: ${name}`);
      continue;
    }
    console.log(`[optimize-images] Processing ${name}…`);
    const res = await convertOne(p);
    results.push({ input: p, ...res });
    console.log(`[optimize-images] Wrote ${basename(res.avifOut)} and ${basename(res.webpOut)}`);
  }
  if (!results.length) {
    console.log('[optimize-images] No targets processed');
  }
}

main().catch((err) => {
  console.error('[optimize-images] Failed:', err);
  process.exit(1);
});
