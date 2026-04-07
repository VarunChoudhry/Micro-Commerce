const PLACEHOLDER_IMAGE =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
      <defs>
        <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#f1ba63"/>
          <stop offset="100%" stop-color="#c8553d"/>
        </linearGradient>
      </defs>
      <rect width="640" height="420" rx="36" fill="url(#g)"/>
      <circle cx="490" cy="110" r="84" fill="rgba(255,255,255,0.18)"/>
      <rect x="72" y="86" width="260" height="22" rx="11" fill="rgba(255,255,255,0.72)"/>
      <rect x="72" y="128" width="180" height="18" rx="9" fill="rgba(255,255,255,0.55)"/>
      <rect x="72" y="240" width="210" height="28" rx="14" fill="rgba(255,255,255,0.8)"/>
    </svg>
  `);

export function getPlaceholderImage(): string {
  return PLACEHOLDER_IMAGE;
}

export function toProductImageSource(imageBase64?: string | null): string {
  if (!imageBase64?.trim()) {
    return PLACEHOLDER_IMAGE;
  }

  const trimmed = imageBase64.trim();
  if (trimmed.startsWith('data:image')) {
    return trimmed;
  }

  return `data:${detectMimeType(trimmed)};base64,${trimmed}`;
}

function detectMimeType(imageBase64: string): string {
  if (imageBase64.startsWith('/9j/')) {
    return 'image/jpeg';
  }

  if (imageBase64.startsWith('iVBORw0KGgo')) {
    return 'image/png';
  }

  if (imageBase64.startsWith('R0lGOD')) {
    return 'image/gif';
  }

  if (imageBase64.startsWith('UklGR')) {
    return 'image/webp';
  }

  return 'image/jpeg';
}