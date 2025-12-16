// /lib/templates.ts
// Versión sin JSX - usa objetos directamente para Satori

interface SlideProps {
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
  assetImageData?: string | null;
  use_asset_as?: 'featured' | 'background' | null;
}

// Satori acepta objetos con esta estructura
interface SatoriNode {
  type: string;
  props: {
    style?: React.CSSProperties;
    children?: (SatoriNode | string)[] | SatoriNode | string;
    src?: string;
    [key: string]: any;
  };
}

export function generateSlideJSX(props: SlideProps): SatoriNode {
  const styles = getTemplateStyles(props.template, props.brand);
  
  const children: (SatoriNode | string)[] = [];
  
  // Background image (if using as background)
  if (props.use_asset_as === 'background' && props.assetImageData) {
    children.push({
      type: 'img',
      props: {
        src: props.assetImageData,
        style: styles.backgroundImage,
      }
    });
    
    // Overlay for readability
    children.push({
      type: 'div',
      props: {
        style: styles.overlay,
        children: [],
      }
    });
  }
  
  // Content wrapper children
  const contentChildren: (SatoriNode | string)[] = [];
  
  // Slide number (for content slides)
  if (props.slide_type === 'content') {
    contentChildren.push({
      type: 'span',
      props: {
        style: styles.slideNumber,
        children: `${props.slide_number}/${props.total_slides}`,
      }
    });
  }
  
  // Featured asset (centered)
  if (props.use_asset_as === 'featured' && props.assetImageData) {
    contentChildren.push({
      type: 'img',
      props: {
        src: props.assetImageData,
        style: styles.featuredAsset,
      }
    });
  }
  
  // Emoji (if no asset)
  if (props.emoji && !props.assetImageData) {
    contentChildren.push({
      type: 'span',
      props: {
        style: styles.emoji,
        children: props.emoji,
      }
    });
  }
  
  // Title
  contentChildren.push({
    type: 'h1',
    props: {
      style: props.slide_type === 'cover' ? styles.titleLarge : styles.titleMedium,
      children: props.title,
    }
  });
  
  // Subtitle
  if (props.subtitle) {
    contentChildren.push({
      type: 'p',
      props: {
        style: styles.subtitle,
        children: props.subtitle,
      }
    });
  }
  
  // Body text
  if (props.body_text) {
    contentChildren.push({
      type: 'p',
      props: {
        style: styles.bodyText,
        children: props.body_text,
      }
    });
  }
  
  // Swipe indicator (cover only)
  if (props.slide_type === 'cover') {
    contentChildren.push({
      type: 'span',
      props: {
        style: styles.swipeIndicator,
        children: 'Desliza →',
      }
    });
  }
  
  // CTA arrow (cta only)
  if (props.slide_type === 'cta') {
    contentChildren.push({
      type: 'span',
      props: {
        style: styles.ctaArrow,
        children: '👆',
      }
    });
  }
  
  // Brand logo (cta slide only)
  if (props.slide_type === 'cta' && props.brand.logoUrl) {
    contentChildren.push({
      type: 'img',
      props: {
        src: props.brand.logoUrl,
        style: styles.brandLogo,
      }
    });
  }
  
  // Content wrapper
  children.push({
    type: 'div',
    props: {
      style: styles.contentWrapper,
      children: contentChildren,
    }
  });
  
  // Main container
  return {
    type: 'div',
    props: {
      style: styles.container,
      children: children,
    }
  };
}

interface StyleSet {
  container: React.CSSProperties;
  contentWrapper: React.CSSProperties;
  backgroundImage: React.CSSProperties;
  overlay: React.CSSProperties;
  featuredAsset: React.CSSProperties;
  titleLarge: React.CSSProperties;
  titleMedium: React.CSSProperties;
  subtitle: React.CSSProperties;
  bodyText: React.CSSProperties;
  emoji: React.CSSProperties;
  slideNumber: React.CSSProperties;
  swipeIndicator: React.CSSProperties;
  ctaArrow: React.CSSProperties;
  brandLogo: React.CSSProperties;
}

function getTemplateStyles(template: string, brand: { color_primary: string; color_secondary: string; font_family: string }): StyleSet {
  const baseStyles: StyleSet = {
    container: {
      width: '1080px',
      height: '1350px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      fontFamily: brand.font_family || 'Inter',
      overflow: 'hidden',
    },
    contentWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '60px',
      zIndex: 10,
      width: '100%',
      height: '100%',
    },
    backgroundImage: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      objectFit: 'cover',
      zIndex: 1,
    },
    overlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.4)',
      zIndex: 2,
    },
    featuredAsset: {
      width: '400px',
      height: '400px',
      objectFit: 'contain',
      marginBottom: '40px',
    },
    titleLarge: {
      fontSize: '72px',
      fontWeight: 700,
      textAlign: 'center',
      margin: '20px 0',
      lineHeight: 1.2,
      maxWidth: '900px',
    },
    titleMedium: {
      fontSize: '56px',
      fontWeight: 700,
      textAlign: 'center',
      margin: '16px 0',
      lineHeight: 1.3,
      maxWidth: '900px',
    },
    subtitle: {
      fontSize: '36px',
      textAlign: 'center',
      margin: '12px 0',
      opacity: 0.9,
      maxWidth: '800px',
    },
    bodyText: {
      fontSize: '32px',
      textAlign: 'center',
      lineHeight: 1.6,
      margin: '24px 0',
      maxWidth: '800px',
    },
    emoji: {
      fontSize: '120px',
      marginBottom: '30px',
    },
    slideNumber: {
      position: 'absolute',
      top: '40px',
      right: '40px',
      fontSize: '28px',
      opacity: 0.7,
      fontWeight: 600,
    },
    swipeIndicator: {
      position: 'absolute',
      bottom: '60px',
      fontSize: '32px',
      opacity: 0.8,
      fontWeight: 500,
    },
    ctaArrow: {
      fontSize: '80px',
      marginTop: '30px',
    },
    brandLogo: {
      width: '140px',
      height: '140px',
      objectFit: 'contain',
      marginTop: '40px',
      opacity: 0.95,
    },
  };

  // Aplicar colores según template
  switch (template) {
    case 'modern_gradient':
      return {
        ...baseStyles,
        container: {
          ...baseStyles.container,
          background: `linear-gradient(135deg, ${brand.color_primary} 0%, ${brand.color_secondary} 100%)`,
        },
        titleLarge: { ...baseStyles.titleLarge, color: '#FFFFFF' },
        titleMedium: { ...baseStyles.titleMedium, color: '#FFFFFF' },
        subtitle: { ...baseStyles.subtitle, color: '#FFFFFF' },
        bodyText: { ...baseStyles.bodyText, color: '#FFFFFF' },
        slideNumber: { ...baseStyles.slideNumber, color: '#FFFFFF' },
        swipeIndicator: { ...baseStyles.swipeIndicator, color: '#FFFFFF' },
        ctaArrow: { ...baseStyles.ctaArrow, color: '#FFFFFF' },
      };

    case 'minimal_clean':
      return {
        ...baseStyles,
        container: {
          ...baseStyles.container,
          backgroundColor: '#FFFFFF',
        },
        titleLarge: { ...baseStyles.titleLarge, color: brand.color_primary },
        titleMedium: { ...baseStyles.titleMedium, color: brand.color_primary },
        subtitle: { ...baseStyles.subtitle, color: '#4B5563' },
        bodyText: { ...baseStyles.bodyText, color: '#6B7280' },
        slideNumber: { ...baseStyles.slideNumber, color: brand.color_secondary },
        swipeIndicator: { ...baseStyles.swipeIndicator, color: brand.color_primary },
        ctaArrow: { ...baseStyles.ctaArrow, color: brand.color_primary },
      };

    case 'bold_contrast':
      return {
        ...baseStyles,
        container: {
          ...baseStyles.container,
          backgroundColor: brand.color_primary,
        },
        titleLarge: { ...baseStyles.titleLarge, color: '#FFFFFF', fontSize: '80px' },
        titleMedium: { ...baseStyles.titleMedium, color: '#FFFFFF', fontSize: '64px' },
        subtitle: { ...baseStyles.subtitle, color: brand.color_secondary },
        bodyText: { ...baseStyles.bodyText, color: '#FFFFFF' },
        slideNumber: { ...baseStyles.slideNumber, color: brand.color_secondary },
        swipeIndicator: { ...baseStyles.swipeIndicator, color: '#FFFFFF' },
        ctaArrow: { ...baseStyles.ctaArrow, color: '#FFFFFF' },
      };

    case 'soft_pastel':
      const pastelBg = adjustColorLightness(brand.color_primary, 0.92);
      const darkText = adjustColorLightness(brand.color_primary, 0.25);
      return {
        ...baseStyles,
        container: {
          ...baseStyles.container,
          backgroundColor: pastelBg,
        },
        titleLarge: { ...baseStyles.titleLarge, color: darkText },
        titleMedium: { ...baseStyles.titleMedium, color: darkText },
        subtitle: { ...baseStyles.subtitle, color: adjustColorLightness(brand.color_primary, 0.4) },
        bodyText: { ...baseStyles.bodyText, color: adjustColorLightness(brand.color_primary, 0.35) },
        slideNumber: { ...baseStyles.slideNumber, color: brand.color_primary },
        swipeIndicator: { ...baseStyles.swipeIndicator, color: darkText },
        ctaArrow: { ...baseStyles.ctaArrow, color: darkText },
      };

    default:
      return baseStyles;
  }
}

// Utility function to adjust color lightness
function adjustColorLightness(hex: string, lightness: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust towards white (lightness > 0.5) or black (lightness < 0.5)
  const adjust = (value: number) => {
    if (lightness > 0.5) {
      return Math.round(value + (255 - value) * ((lightness - 0.5) * 2));
    } else {
      return Math.round(value * (lightness * 2));
    }
  };
  
  const newR = Math.min(255, Math.max(0, adjust(r)));
  const newG = Math.min(255, Math.max(0, adjust(g)));
  const newB = Math.min(255, Math.max(0, adjust(b)));
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}
