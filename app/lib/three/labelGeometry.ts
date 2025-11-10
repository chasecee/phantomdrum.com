"use client";

import { BufferAttribute, BufferGeometry, Float32BufferAttribute } from "three";
import labelGeometries from "@/app/generated/labelGeometries";
import buttonLabelGeometries from "@/app/generated/buttonLabelGeometries";

type LabelGeometrySource = {
  positions: Float32Array;
  uvs: Float32Array;
  indices?: Uint16Array | Uint32Array | null;
  width: number;
  height: number;
};

export type LabelGeometryAsset = {
  geometry: BufferGeometry;
  width: number;
  height: number;
};

const cubeSources = labelGeometries as Record<string, LabelGeometrySource>;
const buttonSources = buttonLabelGeometries as Record<
  string,
  LabelGeometrySource
>;

const cubeCache = new Map<string, LabelGeometryAsset>();
const buttonCache = new Map<string, LabelGeometryAsset>();

function buildAsset(
  slug: string,
  sources: Record<string, LabelGeometrySource>,
  cache: Map<string, LabelGeometryAsset>
): LabelGeometryAsset | null {
  const cached = cache.get(slug);
  if (cached) return cached;

  const source = sources[slug];
  if (!source) return null;

  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(source.positions, 3)
  );
  if (source.uvs.length) {
    geometry.setAttribute("uv", new Float32BufferAttribute(source.uvs, 2));
  }
  if (source.indices && source.indices.length) {
    geometry.setIndex(new BufferAttribute(source.indices, 1));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();

  const asset = {
    geometry,
    width: source.width,
    height: source.height,
  };
  cache.set(slug, asset);
  return asset;
}

export function getCubeLabelAsset(slug: string): LabelGeometryAsset | null {
  return buildAsset(slug, cubeSources, cubeCache);
}

export function getButtonLabelAsset(slug: string): LabelGeometryAsset | null {
  return buildAsset(slug, buttonSources, buttonCache);
}

