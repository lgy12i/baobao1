import { useEffect, useState } from 'react';

interface Props {
  images?: string[];
  index?: number;
  alt?: string;
  className?: string;
  imgClassName?: string;
  square?: boolean;
  cover?: boolean;
}

function pickEmoji(alt: string) {
  const fallbackList = ['📦', '🛍️', '👗', '📱', '🎮', '👟', '🧿', '📚', '💄', '🍎', '⚽'];
  const emoji = Array.from(alt || '').find((character) => {
    const codePoint = character.codePointAt(0) || 0;
    return codePoint >= 0x1f300 && codePoint <= 0x1faff;
  });
  return emoji || fallbackList[Math.abs((alt || '').length) % fallbackList.length];
}

function buildPlaceholder(alt = '📦') {
  const emoji = pickEmoji(alt);
  let hash = 0;
  for (let i = 0; i < alt.length; i += 1) {
    hash = ((hash << 5) - hash) + alt.charCodeAt(i);
  }
  hash = Math.abs(hash) || 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hash % 360},70%,60%)"/><stop offset="100%" stop-color="hsl(${(hash * 7) % 360},75%,40%)"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><text x="200" y="220" font-size="160" text-anchor="middle" dominant-baseline="central">${emoji}</text><text x="200" y="360" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.85)">宝宝商城 · 商品图</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ProductImage({
  images,
  index = 0,
  alt = '',
  className = '',
  imgClassName = '',
  square = true,
  cover = true,
}: Props) {
  const safeImages = Array.isArray(images) ? images : [];
  const safeAlt = alt || '商品图';
  const placeholder = safeImages[0] ? '' : buildPlaceholder(safeAlt);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setAttempt(0);
    setLoaded(false);
  }, [images, index]);

  const total = safeImages.length;
  const source = placeholder || attempt >= total
    ? (placeholder || buildPlaceholder(safeAlt))
    : safeImages[(index + attempt) % total];

  return (
    <div className={`relative overflow-hidden ${square ? 'aspect-square' : ''} ${className}`}>
      {!loaded && <div className="absolute inset-0 shimmer-bg" />}
      <img
        src={source}
        alt={safeAlt}
        loading="lazy"
        decoding="async"
        fetchPriority="auto"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setAttempt((current) => current < total ? current + 1 : current)}
        onLoad={() => setLoaded(true)}
        className={`w-full h-full transition-all duration-500 ${cover ? 'object-cover' : 'object-contain'} ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'} ${imgClassName}`}
      />
    </div>
  );
}
