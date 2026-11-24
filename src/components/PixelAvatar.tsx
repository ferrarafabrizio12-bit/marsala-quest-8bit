import React from 'react';
import type { AvatarConfig } from '../../shared/cosmetics';
import { getAvatarPixelRects } from '../utils/avatarPixels';

interface PixelAvatarProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  avatar,
  size = 48,
  className = '',
}) => {
  const rects = getAvatarPixelRects(avatar);
  const height = Math.round(size * 1.25);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 16 20"
      className={className}
      style={{
        imageRendering: 'pixelated',
        filter: 'drop-shadow(2px 2px 0px #000)',
      }}
      aria-label="Avatar esploratore"
    >
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </svg>
  );
};