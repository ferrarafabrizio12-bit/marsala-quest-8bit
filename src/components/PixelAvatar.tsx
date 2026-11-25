import React, { useMemo } from "react";
import type { AvatarConfig } from "../../shared/cosmetics";
import { buildAvatarPixelGrid } from "../utils/avatarPixels";

interface PixelAvatarProps {
  avatar: AvatarConfig;
  size?: number;
  className?: string;
}

export const PixelAvatar: React.FC<PixelAvatarProps> = ({
  avatar,
  size = 48,
  className = "",
}) => {
  const grid = useMemo(() => buildAvatarPixelGrid(avatar), [avatar]);
  const height = Math.round(size * 1.25);

  return (
    <svg
      width={size}
      height={height}
      viewBox="0 0 16 20"
      shapeRendering="crispEdges"
      className={`inline-block select-none ${className}`}
      aria-label="Avatar 8-Bit"
    >
      {grid.map((row, y) =>
        row.map((fill, x) =>
          fill ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={1}
              height={1}
              fill={fill}
            />
          ) : null,
        ),
      )}
    </svg>
  );
};
