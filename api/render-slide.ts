import type { VercelRequest, VercelResponse } from '@vercel/node';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { generateSlideJSX } from '../lib/templates';
import { loadFonts } from '../lib/fonts';

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

    // Validar request
    if (!body.slide_number || !body.slide_type || !body.title || !body.brand) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        details: 'Required: slide_number, slide_type, title, brand'
      });
    }

    // Cargar fuentes
    const fonts = await loadFonts(body.brand.font_family);

    // Fetch asset image si existe
    let assetImageData: Buffer | null = null;
    if (body.asset_url) {
      try {
        const response = await fetch(body.asset_url);
        
        // 🛑 CORRECCIÓN CLAVE: Verificar response.ok
        if (response.ok) { // Si el fetch es exitoso (código 200)
          assetImageData = Buffer.from(await response.arrayBuffer());
        } else {
          // Si el fetch falla (403, 404, 500), loguea y establece assetImageData a null
          console.warn(`Failed to fetch asset image (Status: ${response.status})`); 
        }
      } catch (e) {
        console.error('Network fetch error:', e);
        // Si hay un error de red (DNS, timeout), continúa sin el asset
      }
    }

    // Generar JSX del slide
    const slideJSX = generateSlideJSX({
      ...body,
      assetImageData: assetImageData ? `data:image/png;base64,${assetImageData.toString('base64')}` : null
    });

    // Renderizar a SVG con Satori
    const svg = await satori(slideJSX, {
      width: body.output?.width || 1080,
      height: body.output?.height || 1350,
      fonts: fonts,
    });

    // Convertir SVG a PNG con Resvg
    const resvg = new Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: body.output?.width || 1080,
      },
    });

    const pngData = resvg.render();
    const pngBuffer = pngData.asPng();

    // Convertir a base64
    const imageBase64 = pngBuffer.toString('base64');

    const renderTime = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      image_base64: imageBase64,
      dimensions: {
        width: body.output?.width || 1080,
        height: body.output?.height || 1350,
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
