import { createAvatar } from '@dicebear/core';
import { shapes, bottts, avataaars, personas } from '@dicebear/collection';

export async function GET({ url }) {
  const style = url.searchParams.get('style') || 'shapes';
  const seed = url.searchParams.get('seed') || 'default';
  const color = url.searchParams.get('color');

  const styleMap = {
    shapes,
    bottts,
    avataaars,
    personas
  };

  const selectedStyle = styleMap[style as keyof typeof styleMap] || shapes;

  const options: any = {
    seed: seed,
    backgroundColor: 'transparent'
  };

  if (color) {
    options.color = `#${color}`;
  }

  try {
    const avatar = createAvatar(selectedStyle, options);
    const svg = avatar.toString();
    
    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
      }
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, {
      status: 500
    });
  }
}
