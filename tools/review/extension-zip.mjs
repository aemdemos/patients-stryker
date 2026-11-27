#!/usr/bin/env node
/*
 * Builds review-live-extension.zip (the download for the AOE team) from extension/: its files in
 * a folder review-live-extension/, nothing else (no _metadata or other folders Chrome writes).
 * Run after changing the extension (and bump its version in manifest.json).
 * usage: node tools/review/extension-zip.mjs
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(HERE, 'extension');
const OUT = join(HERE, 'review-live-extension.zip');
// (its files only: no folders Chrome writes, no dotfiles such as the lint setting)
const files = readdirSync(SRC).filter((f) => !f.startsWith('.') && statSync(join(SRC, f)).isFile()).sort();

const locals = [];
const centrals = [];
let offset = 0;
files.forEach((f) => {
  const data = readFileSync(join(SRC, f));
  const packed = zlib.deflateRawSync(data, { level: 9 });
  const name = Buffer.from(`review-live-extension/${f}`);
  const crc = zlib.crc32(data) >>> 0;
  const head = Buffer.alloc(30);
  head.writeUInt32LE(0x04034b50, 0);
  head.writeUInt16LE(20, 4);
  head.writeUInt16LE(0, 6);
  head.writeUInt16LE(8, 8);
  head.writeUInt32LE(0, 10);
  head.writeUInt32LE(crc, 14);
  head.writeUInt32LE(packed.length, 18);
  head.writeUInt32LE(data.length, 22);
  head.writeUInt16LE(name.length, 26);
  head.writeUInt16LE(0, 28);
  locals.push(head, name, packed);
  const c = Buffer.alloc(46);
  c.writeUInt32LE(0x02014b50, 0);
  c.writeUInt16LE(20, 4);
  c.writeUInt16LE(20, 6);
  c.writeUInt16LE(0, 8);
  c.writeUInt16LE(8, 10);
  c.writeUInt32LE(0, 12);
  c.writeUInt32LE(crc, 16);
  c.writeUInt32LE(packed.length, 20);
  c.writeUInt32LE(data.length, 24);
  c.writeUInt16LE(name.length, 28);
  c.writeUInt32LE(offset, 42);
  centrals.push(c, name);
  offset += head.length + name.length + packed.length;
});
const central = Buffer.concat(centrals);
const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50, 0);
end.writeUInt16LE(files.length, 8);
end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(central.length, 12);
end.writeUInt32LE(offset, 16);
writeFileSync(OUT, Buffer.concat([...locals, central, end]));
console.log(`${OUT}: ${files.length} files (${files.join(', ')})`);
