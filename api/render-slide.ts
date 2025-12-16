// /api/render-slide.ts
//import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateSlideJSX } from '../lib/templates.js';

interface RenderSlideRequest {
  slide_number: number;
  total_slides: number;
  slide_type: 'cover' | 'content' | 'cta';
  title: string;
  subtitle?: string;
  body_text?: string;
  emoji?: string;
  brand: {
    name: string;
    color_primary: string;
    color_secondary: string;
    font_family: string;
    logoUrl: string | null;
  };
  template: string;
  asset_url?: string | null;
  use_asset_as?: 'featured' | 'background' | null;
  output?: {
    width: number;
    height: number;
    format: string;
  };
}

interface SatoriFont {
  name: string;
  data: Buffer;
  weight: number;
  style: 'normal' | 'italic';
}

// Font loading function
async function loadFonts(fontFamily: string): Promise<SatoriFont[]> {
  const fonts: SatoriFont[] = [];
  
  const fontMap: Record<string, { file: string; weight: number }[]> = {
    'Inter': [
      { file: 'Inter-Regular.ttf', weight: 400 },
      { file: 'Inter-Bold.ttf', weight: 700 },
    ],
    'Roboto': [
      { file: 'Roboto-Regular.ttf', weight: 400 },
      { file: 'Roboto-Bold.ttf', weight: 700 },
    ],
  };
  
  const fontFiles = fontMap[fontFamily] || fontMap['Inter'];
  
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
  
  // Fallback: if no fonts loaded and not already trying Inter, try Inter
  if (fonts.length === 0 && fontFamily !== 'Inter') {
    return loadFonts('Inter');
  }
  
  return fonts;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const startTime = Date.now();

  try {
    const body = req.body as RenderSlideRequest;

    // Validate request
    if (!body.slide_number || !body.slide_type || !body.title || !body.brand) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Required: slide_number, slide_type, title, brand'
      });
    }

    // Load fonts
    const fonts = await loadFonts(body.brand.font_family || 'Inter');

    // Fetch asset image if exists
    let assetImageData: string | null = null;
    if (body.asset_url) {
      try {
        const response = await fetch(body.asset_url);
        if (response.ok) {
          const buffer = Buffer.from(await response.arrayBuffer());
          assetImageData = `data:image/png;base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        console.warn('Failed to fetch asset image:', e);
        // Continue without asset
      }
    }

    // Generate slide structure
    const slideStructure = generateSlideJSX({
      ...body,
      assetImageData: assetImageData,
    });

    const width = body.output?.width || 1080;
    const height = body.output?.height || 1350;

    // Render to SVG with Satori
    const svg = await satori(slideStructure as any, {
      width: width,
      height: height,
      fonts: fonts,
    });

    // Convert SVG to PNG with Resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: width,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Convert to base64
    const imageBase64 = pngBuffer.toString('base64');

    const renderTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      image_base64: imageBase64,
      dimensions: {
        width: width,
        height: height,
      },
      render_time_ms: renderTime,
    });

  } catch (error) {
    console.error('Render error:', error);
    return res.status(500).json({
      success: false,
      error: 'Render failed',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
