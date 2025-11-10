"use client";

import {
  useRef,
  useEffect,
  useState,
  RefObject,
  useMemo,
  memo,
  useCallback,
  MutableRefObject,
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
  getBoxGeometry,
} from "@/app/lib/three/geometryCache";
import {
  getCubeLabelAsset,
  type LabelGeometryAsset,
} from "@/app/lib/three/labelGeometry";
import type { GroupRef, Rotation } from "./types";

interface SingleTextCubeProps {
  groupRef: GroupRef;
  targetRotationRef: MutableRefObject<Rotation>;
  targetScaleRef: MutableRefObject<number>;
  labelAsset?: LabelGeometryAsset;
  size: number;
  heightRatio: number;
  widthRatio: number;
  color: string;
  textColor: string;
  textSize: number;
  maxWidth?: number;
  dragRotationRef: MutableRefObject<number>;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}

interface MultiCubeSceneProps {
  groupRefs: GroupRef[];
  targetRotationRefs: Array<MutableRefObject<Rotation>>;
  targetScaleRef: MutableRefObject<number>;
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
  dragRotationRefs: Array<MutableRefObject<number>>;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}

export interface AnimatedMultiCubeProps {
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

function SmoothRotation({
  groupRef,
  targetRotationRef,
  targetScaleRef,
  dragRotationRef,
}: {
  groupRef: GroupRef;
  targetRotationRef: MutableRefObject<Rotation>;
  targetScaleRef: MutableRefObject<number>;
  dragRotationRef: MutableRefObject<number>;
}) {
  useFrame(() => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const targetRotation = targetRotationRef.current;
    const targetScale = targetScaleRef.current;
    const dragRotation = dragRotationRef.current;
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

const SingleTextCube = memo(function SingleTextCube({
  groupRef,
  targetRotationRef,
  targetScaleRef,
  labelAsset,
  size,
  heightRatio,
  widthRatio,
  color,
  textColor,
  textSize,
  maxWidth,
  dragRotationRef,
  fillMode,
  strokeWidth,
  matchTextColor,
}: SingleTextCubeProps) {
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
        targetRotationRef={targetRotationRef}
        targetScaleRef={targetScaleRef}
        dragRotationRef={dragRotationRef}
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
        {textFaces.map((face, index) =>
          labelAsset ? (
            <mesh
              key={index}
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
  targetRotationRefs,
  targetScaleRef,
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
  dragRotationRefs,
  fillMode,
  strokeWidth,
  matchTextColor,
}: MultiCubeSceneProps) {
  const cubeHeight = size * heightRatio;
  const relativeSpacing = spacing * cubeHeight;
  const startY =
    (texts.length * cubeHeight + (texts.length - 1) * relativeSpacing) / 2 -
    cubeHeight / 2;
  const cubePositions = useMemo(
    () =>
      Array.from({ length: texts.length }, (_, index) => ({
        y: startY - index * (cubeHeight + relativeSpacing),
        z: index * 0.05,
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
      const asset = getCubeLabelAsset(slug);
      if (asset) {
        map.set(slug, asset);
      }
    });
    return map;
  }, [uniqueSlugs]);

  return (
    <Canvas camera={cameraConfig} gl={glConfig} dpr={[1, 1.75]}>
      <EffectComposer>
        <DotScreen angle={Math.PI / 12} scale={1.1} />
      </EffectComposer>
      {texts.map((text, index) => {
        const pos = cubePositions[index];
        const labelSlug = labelSlugs[index];
        const labelAsset = labelAssets.get(labelSlug);
        const groupKey = labelSlug ?? `${index}-${text}`;
        const rotationRef =
          targetRotationRefs[index] ?? targetRotationRefs[0];
        const dragRotationRef =
          dragRotationRefs[index] ?? dragRotationRefs[0];
        return (
          <group key={groupKey} position={[0, pos.y, pos.z]}>
            <SingleTextCube
              groupRef={groupRefs[index]}
              targetRotationRef={rotationRef}
              targetScaleRef={targetScaleRef}
              labelAsset={labelAsset}
              size={size}
              heightRatio={heightRatio}
              widthRatio={widthRatio}
              color={colors[index % colors.length]}
              textColor={textColor}
              textSize={textSize}
              maxWidth={maxWidth}
              dragRotationRef={dragRotationRef}
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
  const groupRefs = useMemo<GroupRef[]>(
    () => Array.from({ length: texts.length }, () => ({ current: null })),
    [texts.length]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const [dynamicSize, setDynamicSize] = useState(2);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const finalSize = size ?? dynamicSize;
  const targetScaleRef = useRef<number>(from?.scale ?? 1);
  const targetYPercentRef = useRef<number>(from?.yPercent ?? 0);
  const targetRotationRefs = useMemo(
    () =>
      Array.from({ length: texts.length }, () => ({
        current: {
          x: from?.rotation?.x ?? 0,
          y: from?.rotation?.y ?? 0,
          z: from?.rotation?.z ?? 0,
        },
      })),
    [
      texts.length,
      from?.rotation?.x,
      from?.rotation?.y,
      from?.rotation?.z,
    ]
  );
  const dragRotationRefs = useMemo(
    () => Array.from({ length: texts.length }, () => ({ current: 0 })),
    [texts.length]
  );
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const dragStartRotationsRef = useRef<number[]>([]);
  const draggedCubeIndexRef = useRef(-1);
  const isHorizontalDragRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
  }, []);

  useEffect(() => {
    targetScaleRef.current = from?.scale ?? 1;
    targetYPercentRef.current = from?.yPercent ?? 0;
    targetRotationRefs.forEach((ref) => {
      ref.current.x = from?.rotation?.x ?? 0;
      ref.current.y = from?.rotation?.y ?? 0;
      ref.current.z = from?.rotation?.z ?? 0;
    });
    dragRotationRefs.forEach((ref) => {
      ref.current = 0;
    });
    if (containerRef.current) {
      containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
    }
  }, [
    from?.rotation?.x,
    from?.rotation?.y,
    from?.rotation?.z,
    from?.scale,
    from?.yPercent,
    targetRotationRefs,
    dragRotationRefs,
  ]);

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
          targetYPercentRef.current =
            fromYPercent +
            ((to.yPercent ?? fromYPercent) - fromYPercent) * progress;
          if (containerRef.current) {
            containerRef.current.style.transform = `translateY(${targetYPercentRef.current}%)`;
          }

          for (let index = 0; index < texts.length; index++) {
            const offset = stagger ? index * staggerDelay : 0;
            const prog = stagger
              ? Math.max(
                  0,
                  Math.min(1, (progress - offset) / (1 - totalStaggerDelay))
                )
              : progress;

            const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
            const rotX =
              lerp(fromRotation.x ?? 0, to.rotation.x ?? 0, prog) ?? 0;
            const rotY =
              lerp(fromRotation.y ?? 0, to.rotation.y ?? 0, prog) ?? 0;
            const rotZ =
              lerp(fromRotation.z ?? 0, to.rotation.z ?? 0, prog) ?? 0;
            const scale = lerp(fromScale, to.scale ?? 1, prog);

            const rotationRef = targetRotationRefs[index];
            if (rotationRef) {
              rotationRef.current.x = rotX;
              rotationRef.current.y = rotY;
              rotationRef.current.z = rotZ;
            }
            if (index === 0) {
              targetScaleRef.current = scale;
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
    targetRotationRefs,
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
      dragStartRotationsRef.current = dragRotationRefs.map(
        (ref) => ref.current
      );
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
      const next =
        (dragStartRotationsRef.current[cubeIndex] ?? 0) + rotationDelta;
      const rotationRef = dragRotationRefs[cubeIndex];
      if (rotationRef) {
        rotationRef.current = next;
      }
    };

    const handleEnd = () => {
      isDraggingRef.current = false;
      draggedCubeIndexRef.current = -1;
      isHorizontalDragRef.current = false;
      container.style.cursor = "grab";
    };

    const handleMouseDown = (event: MouseEvent) => {
      handleStart(event.clientX, event.clientY);
      isHorizontalDragRef.current = true;
    };
    const handleMouseMove = (event: MouseEvent) => handleMove(event.clientX);

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length === 1) {
        handleStart(event.touches[0].clientX, event.touches[0].clientY);
      }
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (
        !isDraggingRef.current ||
        event.touches.length !== 1 ||
        draggedCubeIndexRef.current === -1
      )
        return;

      const deltaX = Math.abs(
        event.touches[0].clientX - dragStartRef.current.x
      );
      const deltaY = Math.abs(
        event.touches[0].clientY - dragStartRef.current.y
      );

      if (!isHorizontalDragRef.current) {
        if (deltaY > deltaX && deltaY > 15) {
          handleEnd();
          return;
        }
        if (deltaX > 5 || (deltaX > deltaY && deltaX > 3)) {
          isHorizontalDragRef.current = true;
          event.preventDefault();
        } else {
          return;
        }
      } else {
        event.preventDefault();
      }

      handleMove(event.touches[0].clientX);
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
  }, [texts.length, dragRotationRefs]);

  const defaultColors = useMemo(
    () => ["#C4A070", "#B88B70", "#C85A3D", "#A85A5A"],
    []
  );
  const initialTranslateY = from?.yPercent ?? 0;

  const interpolateColor = useCallback(
    (color1: string, color2: string, t: number): string => {
      const parseHex = (hex: string) =>
        [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((value) =>
          parseInt(value, 16)
        );
      const [r1, g1, b1] = parseHex(color1);
      const [r2, g2, b2] = parseHex(color2);
      const [r, g, b] = [
        r1 + (r2 - r1) * t,
        g1 + (g2 - g1) * t,
        b1 + (b2 - b1) * t,
      ].map((value) => Math.round(value).toString(16).padStart(2, "0"));
      return `#${r}${g}${b}`;
    },
    []
  );

  const generateGradientColors = useCallback(
    (count: number): string[] => {
      if (count <= defaultColors.length) return defaultColors.slice(0, count);
      const gradientColors = [...defaultColors];
      const steps = count - defaultColors.length;
      for (let index = 0; index < steps; index++) {
        const t = (index + 1) / (steps + 1);
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
        transform: `translateY(${initialTranslateY}%)`,
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
        targetRotationRefs={targetRotationRefs}
        targetScaleRef={targetScaleRef}
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
        dragRotationRefs={dragRotationRefs}
        fillMode={fillMode}
        strokeWidth={strokeWidth}
        matchTextColor={matchTextColor}
      />
    </div>
  );
}

