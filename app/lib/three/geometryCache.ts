"use client";

import { BoxGeometry, CylinderGeometry } from "three";

const boxCache = new Map<string, BoxGeometry>();
export function getBoxGeometry(
  width: number,
  height: number,
  depth: number
): BoxGeometry {
  const key = `${width.toFixed(6)}:${height.toFixed(6)}:${depth.toFixed(6)}`;
  const cached = boxCache.get(key);
  if (cached) return cached;
  const geometry = new BoxGeometry(width, height, depth);
  boxCache.set(key, geometry);
  return geometry;
}

const cylinderCache = new Map<string, CylinderGeometry>();
export function getCylinderGeometry(
  radius: number,
  height: number,
  segments: number
): CylinderGeometry {
  const key = `${radius.toFixed(6)}:${height.toFixed(6)}:${segments}`;
  const cached = cylinderCache.get(key);
  if (cached) return cached;
  const geometry = new CylinderGeometry(
    radius,
    radius,
    height,
    segments,
    1,
    false
  );
  geometry.rotateY(Math.PI / segments);
  cylinderCache.set(key, geometry);
  return geometry;
}

