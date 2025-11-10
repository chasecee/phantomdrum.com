"use client";

import {
  useRef,
  useEffect,
  useState,
  RefObject,
  useMemo,
  memo,
  useCallback,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { EffectComposer, DotScreen } from "@react-three/postprocessing";
import {
  Group,
  BoxGeometry,
  CylinderGeometry,
  BufferGeometry,
  BufferAttribute,
  Float32BufferAttribute,
  DoubleSide,
  OrthographicCamera,
  AlwaysStencilFunc,
  ReplaceStencilOp,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  cubeLabelSlugMap,
  cubeLabelSlugify,
  buttonLabelSlugMap,
} from "@/config/cubeLabels";
import { getScrollTrigger } from "../../lib/gsap";
import labelGeometries from "@/app/generated/labelGeometries";
import buttonLabelGeometries from "@/app/generated/buttonLabelGeometries";

type CubeGroupRef = React.MutableRefObject<Group | null>;
type Rotation = { x: number; y: number; z: number };
type LabelGeometrySource = {
  positions: Float32Array;
  uvs: Float32Array;
  indices?: Uint16Array | Uint32Array | null | undefined;
  width: number;
  height: number;
};

type LabelGeometryAsset = {
  geometry: BufferGeometry;
  width: number;
  height: number;
};

const cubeLabelSources = labelGeometries as Record<string, LabelGeometrySource>;
const buttonLabelSources = buttonLabelGeometries as Record<
  string,
  LabelGeometrySource
>;

const cubeLabelGeometryCache = new Map<string, LabelGeometryAsset>();
const buttonLabelGeometryCache = new Map<string, LabelGeometryAsset>();

function buildLabelGeometryAsset(
  slug: string,
  sourceMap: Record<string, LabelGeometrySource>,
  cache: Map<string, LabelGeometryAsset>
): LabelGeometryAsset | null {
  const cached = cache.get(slug);
  if (cached) return cached;
  const source = sourceMap[slug];
  if (!source) return null;
  const geometry = new BufferGeometry();
  geometry.setAttribute(
    "position",
    new Float32BufferAttribute(source.positions, 3)
  );
  if (source.uvs && source.uvs.length) {
    geometry.setAttribute("uv", new Float32BufferAttribute(source.uvs, 2));
  }
  if (source.indices && source.indices.length) {
    geometry.setIndex(new BufferAttribute(source.indices, 1));
  }
  geometry.computeBoundingSphere();
  const asset = {
    geometry,
    width: source.width,
    height: source.height,
  };
  cache.set(slug, asset);
  return asset;
}

const boxGeometryCache = new Map<string, BoxGeometry>();
function getBoxGeometry(width: number, height: number, depth: number) {
  const key = `${width.toFixed(6)}:${height.toFixed(6)}:${depth.toFixed(6)}`;
  const cached = boxGeometryCache.get(key);
  if (cached) return cached;
  const geometry = new BoxGeometry(width, height, depth);
  boxGeometryCache.set(key, geometry);
  return geometry;
}

const cylinderGeometryCache = new Map<string, CylinderGeometry>();
function getCylinderGeometry(radius: number, height: number, segments: number) {
  const key = `${radius.toFixed(6)}:${height.toFixed(6)}:${segments}`;
  const cached = cylinderGeometryCache.get(key);
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
  cylinderGeometryCache.set(key, geometry);
  return geometry;
}

interface AnimatedMultiCubeProps {
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
  to: {
    rotation: { x: number; y: number; z: number };
    scale?: number;
    yPercent?: number;
  };
  showMarkers?: boolean;
  invalidateOnRefresh?: boolean;
  size?: number;
  heightRatio?: number;
  widthRatio?: number;
  colors?: string[];
  textColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  maxWidth?: number;
  spacing?: number;
  stagger?: boolean;
  staggerDelay?: number;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}

interface AnimatedPolyColumnProps {
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
  textColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  strokeWidth?: number;
  matchTextColor?: boolean;
}

interface HalftoneButtonSceneProps {
  text: string;
  href: string;
  color: string;
}

function SmoothRotation({
  groupRef,
  targetRotation,
  targetScale,
  dragRotation,
}: {
  groupRef: CubeGroupRef;
  targetRotation: Rotation;
  targetScale: number;
  dragRotation: number;
}) {
  useFrame(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    g.rotation.x += (targetRotation.x - g.rotation.x) * 0.1;
    g.rotation.y += (targetRotation.y + dragRotation - g.rotation.y) * 0.1;
    g.rotation.z += (targetRotation.z - g.rotation.z) * 0.1;
    const scaleDelta = (targetScale - g.scale.x) * 0.1;
    g.scale.x += scaleDelta;
    g.scale.y += scaleDelta;
    g.scale.z += scaleDelta;
  });
  return null;
}

function SmoothColumnMotion({
  groupRef,
  targetRotation,
  targetScale,
}: {
  groupRef: CubeGroupRef;
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

const SingleTextCube = memo(function SingleTextCube({
  groupRef,
  targetRotation,
  targetScale,
  labelAsset,
  size,
  heightRatio,
  widthRatio,
  color,
  textColor,
  textSize,
  maxWidth,
  dragRotation,
  fillMode,
  strokeWidth,
  matchTextColor,
}: {
  groupRef: CubeGroupRef;
  targetRotation: Rotation;
  targetScale: number;
  labelAsset?: LabelGeometryAsset;
  size: number;
  heightRatio: number;
  widthRatio: number;
  color: string;
  textColor: string;
  textSize: number;
  maxWidth?: number;
  dragRotation: number;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}) {
  const cubeHeight = size * heightRatio;
  const cubeWidth = size * widthRatio;
  const cubeDepth = size * widthRatio;
  const textMaxWidth = maxWidth ?? cubeWidth * 0.85;
  const verticalAllowance =
    cubeHeight * Math.min(0.9, Math.max(0.35, textSize + 0.4));
  const textOffset = size * 0.01;
  const labelScale =
    labelAsset && labelAsset.width > 0 && labelAsset.height > 0
      ? Math.min(
          textMaxWidth / labelAsset.width,
          verticalAllowance / labelAsset.height
        )
      : 1;
  const textFaces: Array<{
    pos: [number, number, number];
    rot: [number, number, number];
  }> = [
    { pos: [0, 0, cubeDepth / 2 + textOffset], rot: [0, 0, 0] },
    {
      pos: [cubeWidth / 2 + textOffset, 0, 0],
      rot: [0, Math.PI / 2, 0],
    },
    {
      pos: [0, 0, -cubeDepth / 2 - textOffset],
      rot: [0, Math.PI, 0],
    },
    {
      pos: [-cubeWidth / 2 - textOffset, 0, 0],
      rot: [0, -Math.PI / 2, 0],
    },
  ];
  const materialColor = fillMode === "outline" ? "black" : color;
  const finalTextColor = matchTextColor ? color : textColor;
  const boxGeometry = useMemo(
    () => getBoxGeometry(cubeWidth, cubeHeight, cubeDepth),
    [cubeWidth, cubeHeight, cubeDepth]
  );

  return (
    <>
      <SmoothRotation
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
        dragRotation={dragRotation}
      />
      <group ref={groupRef}>
        <mesh renderOrder={0} geometry={boxGeometry}>
          <meshBasicMaterial color={materialColor} depthWrite={true} />
        </mesh>
        {fillMode === "outline" && (
          <Edges
            geometry={boxGeometry}
            color={color}
            lineWidth={strokeWidth}
            renderOrder={1}
            depthTest={true}
            depthWrite={false}
            polygonOffset={true}
            polygonOffsetFactor={-1}
            polygonOffsetUnits={-1}
          />
        )}
        {textFaces.map((face, i) =>
          labelAsset ? (
            <mesh
              key={i}
              geometry={labelAsset.geometry}
              position={face.pos}
              rotation={face.rot}
              scale={[labelScale, labelScale, 1]}
              renderOrder={2}
            >
              <meshBasicMaterial
                color={finalTextColor}
                depthWrite={false}
                polygonOffset
                polygonOffsetFactor={-0.5}
                polygonOffsetUnits={-0.5}
                toneMapped={false}
                side={DoubleSide}
              />
            </mesh>
          ) : null
        )}
      </group>
    </>
  );
});

const MultiCubeScene = memo(function MultiCubeScene({
  groupRefs,
  targetRotations,
  targetScale,
  texts,
  size,
  heightRatio,
  widthRatio,
  colors,
  textColor,
  textSize,
  cameraPosition,
  cameraFov,
  maxWidth,
  spacing,
  dragRotations,
  fillMode,
  strokeWidth,
  matchTextColor,
}: {
  groupRefs: CubeGroupRef[];
  targetRotations: Rotation[];
  targetScale: number;
  texts: string[];
  size: number;
  heightRatio: number;
  widthRatio: number;
  colors: string[];
  textColor: string;
  textSize: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
  maxWidth?: number;
  spacing: number;
  dragRotations: number[];
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}) {
  const cubeHeight = size * heightRatio;
  const relativeSpacing = spacing * cubeHeight;
  const startY =
    (texts.length * cubeHeight + (texts.length - 1) * relativeSpacing) / 2 -
    cubeHeight / 2;
  const cubePositions = useMemo(
    () =>
      Array.from({ length: texts.length }, (_, i) => ({
        y: startY - i * (cubeHeight + relativeSpacing),
        z: i * 0.05,
      })),
    [texts.length, startY, cubeHeight, relativeSpacing]
  );
  const cameraConfig = useMemo(
    () => ({ position: cameraPosition, fov: cameraFov }),
    [cameraPosition, cameraFov]
  );
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
  const labelSlugs = useMemo(
    () =>
      texts.map((text) => cubeLabelSlugMap.get(text) ?? cubeLabelSlugify(text)),
    [texts]
  );
  const uniqueSlugs = useMemo(
    () => Array.from(new Set(labelSlugs)),
    [labelSlugs]
  );
  const labelAssets = useMemo(() => {
    const map = new Map<string, LabelGeometryAsset>();
    uniqueSlugs.forEach((slug) => {
      const asset = buildLabelGeometryAsset(
        slug,
        cubeLabelSources,
        cubeLabelGeometryCache
      );
      if (asset) {
        map.set(slug, asset);
      }
    });
    return map;
  }, [uniqueSlugs]);

  return (
    <Canvas camera={cameraConfig} gl={glConfig}>
      <EffectComposer>
        <DotScreen angle={Math.PI / 12} scale={1.1} />
      </EffectComposer>
      {texts.map((text, index) => {
        const pos = cubePositions[index];
        const labelSlug = labelSlugs[index];
        const labelAsset = labelAssets.get(labelSlug);
        const groupKey = labelSlug ?? `${index}-${text}`;
        return (
          <group key={groupKey} position={[0, pos.y, pos.z]}>
            <SingleTextCube
              groupRef={groupRefs[index]}
              targetRotation={targetRotations[index]}
              targetScale={targetScale}
              labelAsset={labelAsset}
              size={size}
              heightRatio={heightRatio}
              widthRatio={widthRatio}
              color={colors[index % colors.length]}
              textColor={textColor}
              textSize={textSize}
              maxWidth={maxWidth}
              dragRotation={dragRotations[index]}
              fillMode={fillMode}
              strokeWidth={strokeWidth}
              matchTextColor={matchTextColor}
            />
          </group>
        );
      })}
    </Canvas>
  );
});

export function AnimatedMultiCubeScene({
  texts,
  trigger,
  start,
  end,
  scrub = 1,
  from,
  to,
  showMarkers = false,
  invalidateOnRefresh = true,
  size,
  heightRatio = 0.3,
  widthRatio = 2,
  colors = [],
  textColor = "white",
  textSize = 0.4,
  cameraPosition = [0, 0, 20],
  cameraFov = 10,
  className,
  maxWidth,
  spacing = 0.1,
  stagger = false,
  staggerDelay = 0.1,
  fillMode = "fill",
  strokeWidth,
  matchTextColor,
}: AnimatedMultiCubeProps) {
  const groupRefs = useMemo<CubeGroupRef[]>(
    () => Array.from({ length: texts.length }, () => ({ current: null })),
    [texts.length]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicSize, setDynamicSize] = useState(2);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const finalSize = size ?? dynamicSize;
  const [targetRotations, setTargetRotations] = useState<Rotation[]>(() =>
    texts.map(() => ({
      x: from?.rotation?.x ?? 0,
      y: from?.rotation?.y ?? 0,
      z: from?.rotation?.z ?? 0,
    }))
  );
  const [targetScale, setTargetScale] = useState(from?.scale ?? 1);
  const [targetYPercent, setTargetYPercent] = useState(from?.yPercent ?? 0);
  const [dragRotations, setDragRotations] = useState<number[]>(() =>
    texts.map(() => 0)
  );
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragStartRotationsRef = useRef<number[]>([]);
  const dragRotationsRef = useRef<number[]>([]);
  const draggedCubeIndexRef = useRef(-1);
  const isHorizontalDragRef = useRef(false);

  useEffect(() => {
    if (size !== undefined) {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      return;
    }
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const minDim = Math.min(rect.width, rect.height);
      if (minDim > 0) setDynamicSize(Math.max(minDim * 0.4, 1));
    };
    updateSize();
    resizeObserverRef.current = new ResizeObserver(updateSize);
    if (containerRef.current)
      resizeObserverRef.current.observe(containerRef.current);
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [size]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      !trigger?.current
    )
      return;

    let masterScrollTrigger: ReturnType<
      typeof import("gsap/ScrollTrigger").ScrollTrigger.create
    > | null = null;
    let isActive = true;

    const initScrollTrigger = async () => {
      if (!isActive) return;

      const ScrollTrigger = await getScrollTrigger();

      if (!isActive || !containerRef.current || !trigger?.current) return;

      const fromRotation = from?.rotation ?? { x: 0, y: 0, z: 0 };
      const fromScale = from?.scale ?? 1;
      const fromYPercent = from?.yPercent ?? 0;
      const totalStaggerDelay = stagger ? (texts.length - 1) * staggerDelay : 0;

      masterScrollTrigger = ScrollTrigger.create({
        trigger: trigger.current,
        start,
        end,
        scrub: typeof scrub === "number" ? scrub : scrub ? 1 : false,
        invalidateOnRefresh,
        markers: showMarkers,
        onUpdate: (self) => {
          const progress = self.progress;
          setTargetYPercent(
            fromYPercent +
              ((to.yPercent ?? fromYPercent) - fromYPercent) * progress
          );

          for (let i = 0; i < texts.length; i++) {
            const offset = stagger ? i * staggerDelay : 0;
            const prog = stagger
              ? Math.max(
                  0,
                  Math.min(1, (progress - offset) / (1 - totalStaggerDelay))
                )
              : progress;

            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            const rotX = lerp(fromRotation.x ?? 0, to.rotation.x ?? 0, prog);
            const rotY = lerp(fromRotation.y ?? 0, to.rotation.y ?? 0, prog);
            const rotZ = lerp(fromRotation.z ?? 0, to.rotation.z ?? 0, prog);
            const scale = lerp(fromScale, to.scale ?? 1, prog);

            setTargetRotations((prev) => {
              if (
                prev[i]?.x === rotX &&
                prev[i]?.y === rotY &&
                prev[i]?.z === rotZ
              )
                return prev;
              const next = [...prev];
              next[i] = { x: rotX, y: rotY, z: rotZ };
              return next;
            });
            if (i === 0) {
              setTargetScale((prev) => (prev === scale ? prev : scale));
            }
          }
        },
      });
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => initScrollTrigger(), { timeout: 2000 });
    } else {
      setTimeout(() => initScrollTrigger(), 100);
    }

    return () => {
      isActive = false;
      masterScrollTrigger?.kill();
    };
  }, [
    trigger,
    start,
    end,
    scrub,
    showMarkers,
    invalidateOnRefresh,
    from,
    to,
    texts.length,
    stagger,
    staggerDelay,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const getCubeIndexFromY = (clientY: number): number => {
      const rect = container.getBoundingClientRect();
      const normalizedY = (clientY - rect.top) / rect.height;
      return Math.max(
        0,
        Math.min(texts.length - 1, Math.floor(normalizedY * texts.length))
      );
    };

    const handleStart = (clientX: number, clientY: number) => {
      isDraggingRef.current = true;
      dragStartRef.current = { x: clientX, y: clientY };
      draggedCubeIndexRef.current = getCubeIndexFromY(clientY);
      dragStartRotationsRef.current = [...dragRotationsRef.current];
      isHorizontalDragRef.current = false;
      container.style.cursor = "grabbing";
    };

    const handleMove = (clientX: number) => {
      if (!isDraggingRef.current || draggedCubeIndexRef.current === -1) return;
      if (!isHorizontalDragRef.current) return;

      const rotationDelta =
        ((clientX - dragStartRef.current.x) / container.offsetWidth) *
        Math.PI *
        2;
      const cubeIndex = draggedCubeIndexRef.current;
      const newRotations = [...dragRotationsRef.current];
      newRotations[cubeIndex] =
        dragStartRotationsRef.current[cubeIndex] + rotationDelta;
      dragRotationsRef.current = newRotations;
      setDragRotations(newRotations);
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      draggedCubeIndexRef.current = -1;
      isHorizontalDragRef.current = false;
      container.style.cursor = "grab";
    };

    const handleMouseDown = (e: MouseEvent) => {
      handleStart(e.clientX, e.clientY);
      isHorizontalDragRef.current = true;
    };
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (
        !isDraggingRef.current ||
        e.touches.length !== 1 ||
        draggedCubeIndexRef.current === -1
      )
        return;

      const deltaX = Math.abs(e.touches[0].clientX - dragStartRef.current.x);
      const deltaY = Math.abs(e.touches[0].clientY - dragStartRef.current.y);

      if (!isHorizontalDragRef.current) {
        if (deltaY > deltaX && deltaY > 15) {
          handleEnd();
          return;
        }
        if (deltaX > 5 || (deltaX > deltaY && deltaX > 3)) {
          isHorizontalDragRef.current = true;
          e.preventDefault();
        } else {
          return;
        }
      } else {
        e.preventDefault();
      }

      handleMove(e.touches[0].clientX);
    };
    container.style.cursor = "grab";
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    container.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleEnd);
    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleEnd);
    };
  }, [texts.length]);

  useEffect(() => {
    dragRotationsRef.current = dragRotations;
  }, [dragRotations]);

  const defaultColors = useMemo(
    () => ["#C4A070", "#B88B70", "#C85A3D", "#A85A5A"],
    []
  );

  const interpolateColor = useCallback(
    (color1: string, color2: string, t: number): string => {
      const parseHex = (hex: string) =>
        [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((x) =>
          parseInt(x, 16)
        );
      const [r1, g1, b1] = parseHex(color1);
      const [r2, g2, b2] = parseHex(color2);
      const [r, g, b] = [
        r1 + (r2 - r1) * t,
        g1 + (g2 - g1) * t,
        b1 + (b2 - b1) * t,
      ].map((x) => Math.round(x).toString(16).padStart(2, "0"));
      return `#${r}${g}${b}`;
    },
    []
  );

  const generateGradientColors = useCallback(
    (count: number): string[] => {
      if (count <= defaultColors.length) return defaultColors.slice(0, count);
      const gradientColors = [...defaultColors];
      const steps = count - defaultColors.length;
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / (steps + 1);
        gradientColors.push(
          interpolateColor(
            gradientColors[gradientColors.length - 1],
            "#8B5AAB",
            t
          )
        );
      }
      return gradientColors.reverse();
    },
    [defaultColors, interpolateColor]
  );

  const cubeColors = useMemo(
    () =>
      colors.length >= texts.length
        ? colors.slice(0, texts.length)
        : generateGradientColors(texts.length),
    [colors, texts.length, generateGradientColors]
  );

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: `translateY(${targetYPercent}%)`,
      }}
      role="region"
      aria-label="Animated text cubes"
    >
      <div className="sr-only" aria-live="polite">
        <ul>
          {texts.map((text, index) => (
            <li key={index}>{text}</li>
          ))}
        </ul>
      </div>
      <MultiCubeScene
        groupRefs={groupRefs}
        targetRotations={targetRotations}
        targetScale={targetScale}
        texts={texts}
        size={finalSize}
        heightRatio={heightRatio}
        widthRatio={widthRatio}
        colors={cubeColors}
        textColor={textColor}
        textSize={textSize}
        cameraPosition={cameraPosition}
        cameraFov={cameraFov}
        maxWidth={maxWidth}
        spacing={spacing}
        dragRotations={dragRotations}
        fillMode={fillMode}
        strokeWidth={strokeWidth}
        matchTextColor={matchTextColor}
      />
    </div>
  );
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
}: {
  groupRef: CubeGroupRef;
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
}) {
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
  const columnGroupRef = useRef<Group | null>(null);
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
      const asset = buildLabelGeometryAsset(
        slug,
        cubeLabelSources,
        cubeLabelGeometryCache
      );
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

const BASE_HEIGHT = 1.9;

function CameraController() {
  const { camera, size } = useThree();
  const camRef = useRef<OrthographicCamera | null>(null);

  useEffect(() => {
    if (camera instanceof OrthographicCamera) {
      camRef.current = camera;
    }
  }, [camera]);

  useFrame(() => {
    if (!camRef.current) return;
    const aspect = size.width / size.height;
    const height = BASE_HEIGHT;
    const width = height * aspect;
    const padding = 0.1;
    camRef.current.left = -width / 2 - padding;
    camRef.current.right = width / 2 + padding;
    camRef.current.top = height / 2 + padding;
    camRef.current.bottom = -height / 2 - padding;
    camRef.current.updateProjectionMatrix();
  });

  return null;
}

function EdgesWithTransition({
  geometry,
  color,
  targetWidth,
}: {
  geometry: BufferGeometry;
  color: string;
  targetWidth: number;
}) {
  const [currentWidth, setCurrentWidth] = useState(targetWidth);

  useFrame(() => {
    setCurrentWidth((prev) => prev + (targetWidth - prev) * 0.15);
  });

  const scaledWidth = useMemo(() => {
    const geometryHeight = BASE_HEIGHT * 0.95;
    const baseStrokeRatio = currentWidth / BASE_HEIGHT;
    return baseStrokeRatio * geometryHeight;
  }, [currentWidth]);

  return (
    <>
      <Edges
        geometry={geometry}
        color={color}
        lineWidth={scaledWidth}
        renderOrder={1000}
        depthTest={true}
        depthWrite={true}
        polygonOffset={true}
        polygonOffsetFactor={1}
        polygonOffsetUnits={1}
      />
    </>
  );
}

function TextWithTransition({
  labelAsset,
  color,
  baseScale,
  targetScale,
}: {
  labelAsset: LabelGeometryAsset | null;
  color: string;
  baseScale: number;
  targetScale: number;
}) {
  const [currentScale, setCurrentScale] = useState(1);

  useFrame(() => {
    setCurrentScale((prev) => prev + (targetScale - prev) * 0.15);
  });

  if (!labelAsset) {
    return null;
  }

  return (
    <mesh
      position={[0, 0, 0.08]}
      geometry={labelAsset.geometry}
      scale={[baseScale * currentScale, baseScale * currentScale, 1]}
      renderOrder={3}
    >
      <meshBasicMaterial
        color={color}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-0.5}
        polygonOffsetUnits={-0.5}
        toneMapped={false}
        side={DoubleSide}
      />
    </mesh>
  );
}

function ButtonScene({
  text,
  color,
  strokeWidth,
  textScale,
}: {
  text: string;
  color: string;
  strokeWidth: number;
  textScale: number;
}) {
  const { size } = useThree();
  const aspect = size.width / size.height;

  const { boxWidth, boxHeight, radius } = useMemo(() => {
    const width = BASE_HEIGHT * aspect;
    const boxWidth = width * 0.99;
    const boxHeight = BASE_HEIGHT * 0.95;
    const radius = Math.min(boxWidth, boxHeight) * 0.05;
    return { boxWidth, boxHeight, radius };
  }, [aspect]);

  const labelSlug = useMemo(
    () => buttonLabelSlugMap.get(text) ?? cubeLabelSlugify(text),
    [text]
  );
  const labelAsset = useMemo(() => {
    const asset = buildLabelGeometryAsset(
      labelSlug,
      buttonLabelSources,
      buttonLabelGeometryCache
    );
    return asset ?? null;
  }, [labelSlug]);
  const baseLabelScale = useMemo(() => {
    if (!labelAsset) return 1;
    const widthAllowance = boxWidth * 0.8;
    const heightAllowance = boxHeight * 0.45;
    return Math.min(
      widthAllowance / labelAsset.width,
      heightAllowance / labelAsset.height
    );
  }, [labelAsset, boxWidth, boxHeight]);

  const responsiveStrokeWidth = useMemo(() => {
    const baseStrokeWidth = strokeWidth;
    const scaleFactor = Math.min(size.width / 1000, size.height / 300);
    return baseStrokeWidth * Math.max(scaleFactor, 0.5);
  }, [strokeWidth, size.width, size.height]);

  const boxGeometry = useMemo(() => {
    return new RoundedBoxGeometry(boxWidth, boxHeight, 0.1, 2, radius);
  }, [boxWidth, boxHeight, radius]);

  return (
    <>
      <CameraController />
      <EffectComposer>
        <DotScreen angle={Math.PI / 12} scale={1.1} />
      </EffectComposer>
      <mesh geometry={boxGeometry} renderOrder={0}>
        <meshBasicMaterial
          color="black"
          depthWrite={true}
          stencilWrite={true}
          stencilRef={1}
          stencilFunc={AlwaysStencilFunc}
          stencilFail={ReplaceStencilOp}
          stencilZFail={ReplaceStencilOp}
          stencilZPass={ReplaceStencilOp}
          visible={false}
        />
      </mesh>
      <mesh geometry={boxGeometry} renderOrder={1.5} position={[0, 0, 0.01]}>
        <meshBasicMaterial
          color="black"
          transparent
          opacity={0}
          depthWrite={true}
          depthTest={true}
          stencilWrite={false}
        />
      </mesh>
      <mesh geometry={boxGeometry} renderOrder={1000} position={[0, 0, 0.02]}>
        <meshBasicMaterial
          color="black"
          transparent
          opacity={0}
          depthWrite={true}
          depthTest={true}
        />
      </mesh>
      <EdgesWithTransition
        geometry={boxGeometry}
        color={color}
        targetWidth={responsiveStrokeWidth}
      />
      <TextWithTransition
        labelAsset={labelAsset}
        color={color}
        baseScale={baseLabelScale}
        targetScale={textScale}
      />
    </>
  );
}

export function HalftoneButtonScene({
  text,
  href,
  color,
}: HalftoneButtonSceneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [shouldLoadCanvas, setShouldLoadCanvas] = useState(
    typeof IntersectionObserver === "undefined"
  );
  const containerRef = useRef<HTMLAnchorElement>(null);
  const strokeWidth = isHovered ? 18 : 8;
  const textScale = isHovered ? 1.4 : 1.2;

  useEffect(() => {
    if (!containerRef.current || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoadCanvas(true);
          observer.disconnect();
        }
      },
      { rootMargin: "50px" }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <a
      ref={containerRef}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="aspect-4/1 w-full font-mono font-bold uppercase relative overflow-hidden"
      style={{
        borderColor: color,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0">
        {shouldLoadCanvas ? (
          <Canvas
            orthographic
            camera={{
              position: [0, 0, 5],
              left: -2,
              right: 2,
              top: 0.95,
              bottom: -0.95,
              near: 0.1,
              far: 10,
            }}
            gl={{
              antialias: false,
              alpha: false,
              depth: true,
              stencil: true,
              powerPreference: "high-performance" as const,
            }}
            style={{ width: "100%", height: "100%" }}
          >
            <ButtonScene
              text={text}
              color={color}
              strokeWidth={strokeWidth}
              textScale={textScale}
            />
          </Canvas>
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>
    </a>
  );
}
