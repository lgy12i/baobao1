/**
 * ProductImage · 统一商品图片渲染组件
 *
 * 功能：
 *  1. 多层 onError fallback：主图失败 → 切换 images 下一张 → 最终 SVG emoji 渐变占位
 *  2. loading="lazy"：浏览器原生懒加载，减少首屏压力，不卡顿
 *  3. fetchpriority="auto"：避免抢占首屏关键资源
 *  4. 统一容器 aspect-square：避免布局抖动（CLS）
 *  5. shimmer skeleton 占位：图片请求时平滑过渡，无跳动
 *
 * 面试点：
 *  - 为什么不用 IntersectionObserver？原生 loading="lazy" 已被全主流浏览器支持，零依赖
 *  - 为什么要降级 SVG 占位？外部图链有重定向、跨域、CORS 预检风险；内嵌 SVG 100% 可用
 *  - 为什么 aspect-square + skeleton？CLS (Cumulative Layout Shift) 直接影响用户体验 + SEO
 */
import { useState, useEffect } from 'react';

interface Props {
  images?: string[];       // 图片数组（至少一张）
  index?: number;          // 默认取第几张
  alt?: string;
  className?: string;      // 给外层容器的额外类
  imgClassName?: string;   // 给 <img> 的额外类
  square?: boolean;        // 是否 1:1 方形（默认 true）
  cover?: boolean;         // object-cover 或 contain（默认 cover）
}

// 根据商品名生成占位 SVG（和后端一致），不依赖网络
// 根据商品名生成占位 SVG（和后端一致），不依赖网络
function pickEmoji(alt) {
  const fallbackList = ['📦', '🛍️', '👗', '📱', '🎮', '👟', '🧿', '📚', '💄', '🍎', '⚽'];
  try {
    const cps = Array.from(alt || '');
    for (let i = 0; i < cps.length; i++) {
      const cp = cps[i].codePointAt(0) || 0;
      if (cp >= 0x1F300 && cp <= 0x1FAFF) return cps[i];
    }
    return fallbackList[Math.abs((alt || '').length) % fallbackList.length];
  } catch (e) {
    return '📦';
  }
}
function buildPlaceholder(alt) {
  if (alt === void 0) alt = '📦';
  const emoji = pickEmoji(alt);
  let hash = 0;
  for (let i = 0; i < alt.length; i++) hash = ((hash << 5) - hash) + alt.charCodeAt(i);
  hash = Math.abs(hash) || 1;
  const h1 = hash % 360;
  const h2 = (hash * 7) % 360;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="hsl(${h1},70%,60%)"/>
        <stop offset="100%" stop-color="hsl(${h2},75%,40%)"/>
      </linearGradient></defs>
      <rect width="400" height="400" fill="url(#g)"/>
      <text x="200" y="220" font-size="160" text-anchor="middle" dominant-baseline="central">${emoji}</text>
      <text x="200" y="360" font-size="14" text-anchor="middle" fill="rgba(255,255,255,0.85)">宝宝商城 · 商品图</text>
    </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export default function ProductImage({
  images,
  index = 0,
  alt = '',
  className = '',
  imgClassName = '',
  square = true,
  cover = true
}: Props) {
  const safe = Array.isArray(images) ? images : images ? [images] : [];
  const safeAlt = alt || '商品图';
  const placeholder = images?.[0] ? '' : buildPlaceholder(safeAlt);

  // fallback index：主图失败 → 下一张 → 再下一张 → placeholder
  const [attempt, setAttempt] = useState(0);
  // 关键：images 变化时重置
  useEffect(() => { setAttempt(0); }, [images, index]);

  const total = safe.length;
  const onError = () => {
    // 在 images 数组里依次降级
    if (attempt < total) {
      setAttempt(attempt + 1);
    }
  };

  // 计算最终 src：
  // attempt 0..total-1 → images[i]
  // attempt >= total   → placeholder
  let src: string;
  if (placeholder || attempt >= total) {
    src = placeholder || buildPlaceholder(safeAlt);
  } else {
    src = safe[(index + attempt) % Math.max(1, total)];
  }

  const [loaded, setLoaded] = useState(false);
  const onLoad = () => setLoaded(true);

  const aspectCls = square ? 'aspect-square' : '';
  const objectCls = cover ? 'object-cover' : 'object-contain';

  return (
    <div className={`relative overflow-hidden ${aspectCls} ${className}`}>
      {/* shimmer skeleton */}
      {!loaded && (
        <div className="absolute inset-0 shimmer-bg" />
      )}
      <img
        src={src}
        alt={safeAlt}
        loading="lazy"
        decoding="async"
        fetchPriority="auto"
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={onError}
        onLoad={onLoad}
        className={`w-full h-full transition-all duration-500 ${objectCls} ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        } ${imgClassName}`}
      />
    </div>
  );
}
