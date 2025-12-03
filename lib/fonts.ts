import { readFileSync } from 'fs';
import { join } from 'path';

interface SatoriFont {
  name: string;
  data: Buffer;
  weight: number;
  style: 'normal' | 'italic';
}

const fontCache: Map<string, SatoriFont[]> = new Map();

export async function loadFonts(fontFamily: string): Promise<SatoriFont[]> {
  // Check cache
  if (fontCache.has(fontFamily)) {
    return fontCache.get(fontFamily)!;
  }

  const fonts: SatoriFont[] = [];
  
  try {
    // Map font family to file names
    const fontFiles = getFontFiles(fontFamily);
    
    for (const fontFile of fontFiles) {
      try {
        const fontPath = join(process.cwd(), 'fonts', fontFile.file);
        const fontData = readFileSync(fontPath);
        
        fonts.push({
          name: fontFamily,
          data: fontData,
          weight: fontFile.weight,
          style: 'normal',
        });
      } catch (e) {
        console.warn(`Failed to load font ${fontFile.file}:`, e);
      }
    }
    
    // If no fonts loaded, fall back to Inter
    if (fonts.length === 0 && fontFamily !== 'Inter') {
      return loadFonts('Inter');
    }
    
    // Cache fonts
    fontCache.set(fontFamily, fonts);
    
    return fonts;
  } catch (error) {
    console.error('Error loading fonts:', error);
    
    // Return empty array - Satori will use fallback
    return [];
  }
}

function getFontFiles(fontFamily: string): { file: string; weight: number }[] {
  const fontMap: Record<string, { file: string; weight: number }[]> = {
    'Inter': [
      { file: 'Inter-Regular.ttf', weight: 400 },
      { file: 'Inter-Bold.ttf', weight: 700 },
    ],
    'Roboto': [
      { file: 'Roboto-Regular.ttf', weight: 400 },
      { file: 'Roboto-Bold.ttf', weight: 700 },
    ],
    'Open Sans': [
      { file: 'OpenSans-Regular.ttf', weight: 400 },
      { file: 'OpenSans-Bold.ttf', weight: 700 },
    ],
    'Montserrat': [
      { file: 'Montserrat-Regular.ttf', weight: 400 },
      { file: 'Montserrat-Bold.ttf', weight: 700 },
    ],
    'Poppins': [
      { file: 'Poppins-Regular.ttf', weight: 400 },
      { file: 'Poppins-Bold.ttf', weight: 700 },
    ],
  };
  
  return fontMap[fontFamily] || fontMap['Inter'];
}
