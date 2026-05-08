// /lib/fonts.ts
// Font loading with in-memory cache for Vercel warm instances.
// Validates the OpenType signature so we fail loudly with a useful message
// instead of letting Satori bubble up "Unsupported OpenType signature <!DO".

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { FONT_REGISTRY } from './types.js';

interface SatoriFont {
  name: string;
  data: Buffer;
  weight: number;
  style: 'normal' | 'italic';
}

const fontCache: Map<string, SatoriFont[]> = new Map();

// ── Signature validator ──────────────────────────────────────
// A real .ttf/.otf starts with one of these magic numbers.
// Anything else (e.g. an HTML 404 page that begins with "<!DO") is rejected.
function isValidFontBuffer(buf: Buffer): boolean {
  if (buf.length < 4) return false;
  const sig = buf.subarray(0, 4);
  // TrueType: 00 01 00 00
  if (sig[0] === 0x00 && sig[1] === 0x01 && sig[2] === 0x00 && sig[3] === 0x00) return true;
  // OpenType (CFF): "OTTO"
  if (sig.toString('ascii') === 'OTTO') return true;
  // TrueType collection: "ttcf"
  if (sig.toString('ascii') === 'ttcf') return true;
  // PostScript-flavored: "true" or "typ1"
  const ascii = sig.toString('ascii');
  if (ascii === 'true' || ascii === 'typ1') return true;
  return false;
}

function tryLoadFontFile(file: string): Buffer | null {
  const fontPath = join(process.cwd(), 'fonts', file);
  if (!existsSync(fontPath)) {
    console.warn(`[fonts] File missing in /fonts/: ${file}`);
    return null;
  }
  const buf = readFileSync(fontPath);
  if (!isValidFontBuffer(buf)) {
    const head = buf.subarray(0, 16).toString('ascii').replace(/[^\x20-\x7E]/g, '·');
    console.error(`[fonts] Invalid font file (not OpenType/TrueType): ${file} — first bytes: "${head}"`);
    return null;
  }
  return buf;
}

export async function loadFonts(headingFont: string, bodyFont: string): Promise<SatoriFont[]> {
  const cacheKey = `${headingFont}|${bodyFont}`;
  if (fontCache.has(cacheKey)) {
    return fontCache.get(cacheKey)!;
  }

  const fonts: SatoriFont[] = [];
  const loadedFiles = new Set<string>();
  const requestedFamilies: { family: string; loaded: boolean }[] = [];

  // Helper to load one family
  const loadFamily = (family: string): boolean => {
    const files = FONT_REGISTRY[family] || FONT_REGISTRY['Inter'];
    let anyLoaded = false;
    for (const entry of files) {
      if (loadedFiles.has(entry.file)) continue;
      const data = tryLoadFontFile(entry.file);
      if (data) {
        fonts.push({ name: family, data, weight: entry.weight, style: entry.style });
        loadedFiles.add(entry.file);
        anyLoaded = true;
      }
    }
    return anyLoaded;
  };

  requestedFamilies.push({ family: headingFont, loaded: loadFamily(headingFont) });
  if (bodyFont !== headingFont) {
    requestedFamilies.push({ family: bodyFont, loaded: loadFamily(bodyFont) });
  }

  // Fallback to Inter if any requested family failed completely
  const allLoaded = requestedFamilies.every(r => r.loaded);
  if (!allLoaded) {
    const failed = requestedFamilies.filter(r => !r.loaded).map(r => r.family).join(', ');
    console.warn(`[fonts] Could not load: ${failed}. Falling back to Inter.`);
    if (fonts.length === 0 || !fonts.some(f => f.name === 'Inter')) {
      loadFamily('Inter');
    }
  }

  // Last-resort: ensure something is loaded
  if (fonts.length === 0) {
    throw new Error(
      `[fonts] CRITICAL: no fonts could be loaded. Requested: ${headingFont}/${bodyFont}. ` +
      `Check that /fonts/ contains valid .ttf files and that vercel.json includeFiles is set.`
    );
  }

  fontCache.set(cacheKey, fonts);
  return fonts;
}
