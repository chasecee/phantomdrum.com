"use client";

import {
  useRef,
  useEffect,
  useState,
  RefObject,
  useMemo,
  memo,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { EffectComposer, DotScreen } from "@react-three/postprocessing";
import { DoubleSide } from "three";
import {
  cubeLabelSlugMap,
  cubeLabelSlugify,
} from "@/config/cubeLabels";
import { getScrollTrigger } from "@/app/lib/gsap";
import {
  getCylinderGeometry,
} from "@/app/lib/three/geometryCache";
import {
  getCubeLabelAsset,
  type LabelGeometryAsset,
} from "@/app/lib/three/labelGeometry";
import type { GroupRef, Rotation } from "./types";

interface PolyColumnProps {
  groupRef: GroupRef;
  targetRotation: Rotation;
  targetScale: number;
  labelAssets: Map<string, LabelGeometryAsset>;
  faceSlugs: Array<string | null>;
  faceTexts: string[];
  radius: number;
  height: number;
  bodyColor: string;
  edgeColor: string;
  textSize: number;
  strokeWidth: number;
}

export interface AnimatedPolyColumnProps {
  texts: string[];
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  to?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
    yPercent?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  radius?: number;
  height?: number;
  bodyColor?: string;
  edgeColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  strokeWidth?: number;
}

function SmoothColumnMotion({
  groupRef,
  targetRotation,
  targetScale,
}: {
  groupRef: GroupRef;
  targetRotation: Rotation;
  targetScale: number;
}) {
  useFrame(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.rotation.x += (targetRotation.x - g.rotation.x) * 0.1;
    g.rotation.y += (targetRotation.y - g.rotation.y) * 0.1;
    g.rotation.z += (targetRotation.z - g.rotation.z) * 0.1;
    const scaleDelta = (targetScale - g.scale.x) * 0.1;
    g.scale.x += scaleDelta;
    g.scale.y += scaleDelta;
    g.scale.z += scaleDelta;
  });
  return null;
}

const PolyColumn = memo(function PolyColumn({
  groupRef,
  targetRotation,
  targetScale,
  labelAssets,
  faceSlugs,
  faceTexts,
  radius,
  height,
  bodyColor,
  edgeColor,
  textSize,
  strokeWidth,
}: PolyColumnProps) {
  const segments = faceTexts.length;
  const geometry = useMemo(
    () => getCylinderGeometry(radius, height, segments),
    [radius, height, segments]
  );
  const angleStep = useMemo(
    () => (segments > 0 ? (Math.PI * 2) / segments : 0),
    [segments]
  );
  const angles = useMemo(
    () => Array.from({ length: segments }, (_, index) => index * angleStep),
    [segments, angleStep]
  );
  const apothem = useMemo(
    () => radius * Math.cos(Math.PI / segments),
    [radius, segments]
  );
  const textOffset = apothem * 0.05;
  const faceWidth = useMemo(
    () => 2 * apothem * Math.tan(Math.PI / segments),
    [apothem, segments]
  );
  const textMaxWidth = faceWidth * 0.85;
  const verticalAllowance = height * Math.max(0.25, Math.min(0.65, textSize));

  return (
    <>
      <SmoothColumnMotion
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
      />
      <group ref={groupRef}>
        <mesh geometry={geometry} renderOrder={0}>
          <meshBasicMaterial color={bodyColor} depthWrite />
        </mesh>
        <Edges
          geometry={geometry}
          color={edgeColor}
          lineWidth={strokeWidth}
          renderOrder={1}
          depthTest
          depthWrite={false}
          polygonOffset
          polygonOffsetFactor={-1}
          polygonOffsetUnits={-1}
        />
        {angles.map((angle, index) => {
          const slug = faceSlugs[index];
          const text = faceTexts[index];
          if (!slug || !text) return null;
          const labelAsset = labelAssets.get(slug);
          if (!labelAsset) return null;
          const scale =
            labelAsset.width > 0 && labelAsset.height > 0
              ? Math.min(
                  textMaxWidth / labelAsset.width,
                  verticalAllowance / labelAsset.height
                )
              : 1;
          return (
            <group key={`${slug}-${index}`} rotation={[0, angle, 0]}>
              <mesh
                geometry={labelAsset.geometry}
                position={[0, 0, apothem + textOffset]}
                scale={[scale, scale, 1]}
                renderOrder={2}
              >
                <meshBasicMaterial
                  color={edgeColor}
                  depthWrite={false}
                  polygonOffset
                  polygonOffsetFactor={-0.5}
                  polygonOffsetUnits={-0.5}
                  toneMapped={false}
                  side={DoubleSide}
                />
              </mesh>
            </group>
          );
        })}
      </group>
    </>
  );
});

export function AnimatedPolyColumnScene({
  texts,
  trigger,
  start,
  end,
  scrub = 1,
  from,
  to,
  showMarkers = false,
  invalidateOnRefresh = true,
  radius,
  height,
  bodyColor,
  edgeColor,
  textSize = 0.45,
  cameraPosition = [0, 0, 12],
  cameraFov = 18,
  className,
  strokeWidth = 5,
}: AnimatedPolyColumnProps) {
  const columnGroupRef = useRef<GroupRef["current"]>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [dynamicRadius, setDynamicRadius] = useState(() => radius ?? 1);
  const [dynamicHeight, setDynamicHeight] = useState(() => height ?? 2.2);
  const [targetRotation, setTargetRotation] = useState<Rotation>(() => ({
    x: from?.rotation?.x ?? 0,
    y: from?.rotation?.y ?? 0,
    z: from?.rotation?.z ?? 0,
  }));
  const [targetScale, setTargetScale] = useState(from?.scale ?? 1);
  const [targetYPercent, setTargetYPercent] = useState(from?.yPercent ?? 0);

  const finalRadius = radius ?? dynamicRadius;
  const finalHeight = height ?? dynamicHeight;
  const finalBodyColor = bodyColor ?? "#0E0E0E";
  const finalEdgeColor = edgeColor ?? "#C4A070";

  useEffect(() => {
    if (radius !== undefined || height !== undefined) {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    }
  }, [radius, height]);

  useEffect(() => {
    if (radius !== undefined && height !== undefined) {
      return;
    }
    const updateDimensions = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const minDim = Math.min(rect.width, rect.height);
      if (radius === undefined) {
        setDynamicRadius(Math.max(minDim * 0.25, 0.6));
      }
      if (height === undefined) {
        setDynamicHeight(Math.max(minDim * 1.4, 2));
      }
    };
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    resizeObserverRef.current = observer;
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      resizeObserverRef.current = null;
    };
  }, [radius, height]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      !trigger?.current
    )
      return;

    let scrollTrigger: ReturnType<
      typeof import("gsap/ScrollTrigger").ScrollTrigger.create
    > | null = null;
    let isActive = true;

    const init = async () => {
      if (!isActive) return;
      const ScrollTrigger = await getScrollTrigger();
      if (!isActive || !containerRef.current || !trigger?.current) return;
      const fromRotation = {
        x: from?.rotation?.x ?? 0,
        y: from?.rotation?.y ?? 0,
        z: from?.rotation?.z ?? 0,
      };
      const toRotation = {
        x: to?.rotation?.x ?? fromRotation.x,
        y: to?.rotation?.y ?? fromRotation.y + Math.PI * 2,
        z: to?.rotation?.z ?? fromRotation.z,
      };
      const fromScale = from?.scale ?? 1;
      const toScale = to?.scale ?? fromScale;
      const fromYPercent = from?.yPercent ?? 0;
      const toYPercent = to?.yPercent ?? fromYPercent;
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      scrollTrigger = ScrollTrigger.create({
        trigger: trigger.current,
        start,
        end,
        scrub: typeof scrub === "number" ? scrub : scrub ? 1 : false,
        invalidateOnRefresh,
        markers: showMarkers,
        onUpdate: (self) => {
          const progress = self.progress;
          setTargetRotation({
            x: lerp(fromRotation.x, toRotation.x, progress),
            y: lerp(fromRotation.y, toRotation.y, progress),
            z: lerp(fromRotation.z, toRotation.z, progress),
          });
          setTargetScale(lerp(fromScale, toScale, progress));
          setTargetYPercent(lerp(fromYPercent, toYPercent, progress));
        },
      });
    };

    init();
    return () => {
      isActive = false;
      scrollTrigger?.kill();
    };
  }, [trigger, start, end, scrub, showMarkers, invalidateOnRefresh, from, to]);

  const faceTexts = useMemo(() => texts, [texts]);

  const faceSlugs = useMemo(
    () =>
      faceTexts.map((text) =>
        text ? cubeLabelSlugMap.get(text) ?? cubeLabelSlugify(text) : null
      ),
    [faceTexts]
  );

  const uniqueSlugs = useMemo(
    () =>
      Array.from(
        new Set(faceSlugs.filter((slug): slug is string => Boolean(slug)))
      ),
    [faceSlugs]
  );

  const labelAssets = useMemo(() => {
    const map = new Map<string, LabelGeometryAsset>();
    uniqueSlugs.forEach((slug) => {
      const asset = getCubeLabelAsset(slug);
      if (asset) {
        map.set(slug, asset);
      }
    });
    return map;
  }, [uniqueSlugs]);

  const glConfig = useMemo(
    () => ({
      antialias: true,
      alpha: true,
      depth: true,
      stencil: false,
      powerPreference: "high-performance" as const,
    }),
    []
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: `translateY(${targetYPercent}%)`,
      }}
      role="region"
      aria-label="Animated column"
    >
      <div className="sr-only" aria-live="polite">
        <ul>
          {texts.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      </div>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        gl={glConfig}
      >
        <EffectComposer>
          <DotScreen angle={Math.PI / 12} scale={1.1} />
        </EffectComposer>
        <PolyColumn
          groupRef={columnGroupRef}
          targetRotation={targetRotation}
          targetScale={targetScale}
          labelAssets={labelAssets}
          faceSlugs={faceSlugs}
          faceTexts={faceTexts}
          radius={finalRadius}
          height={finalHeight}
          bodyColor={finalBodyColor}
          edgeColor={finalEdgeColor}
          textSize={textSize}
          strokeWidth={strokeWidth}
        />
      </Canvas>
    </div>
  );
}

