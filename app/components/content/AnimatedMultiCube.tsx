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
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Edges } from "@react-three/drei";
import { EffectComposer, DotScreen } from "@react-three/postprocessing";
import * as THREE from "three";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type CubeGroupRef = React.MutableRefObject<THREE.Group | null>;
type Rotation = { x: number; y: number; z: number };

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
  font?: string | object;
  spacing?: number;
  stagger?: boolean;
  staggerDelay?: number;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
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

const SingleTextCube = memo(function SingleTextCube({
  groupRef,
  targetRotation,
  targetScale,
  text,
  size,
  heightRatio,
  widthRatio,
  color,
  textColor,
  textSize,
  maxWidth,
  font,
  dragRotation,
  fillMode,
  strokeWidth,
  matchTextColor,
}: {
  groupRef: CubeGroupRef;
  targetRotation: Rotation;
  targetScale: number;
  text: string;
  size: number;
  heightRatio: number;
  widthRatio: number;
  color: string;
  textColor: string;
  textSize: number;
  maxWidth?: number;
  font?: string | object;
  dragRotation: number;
  fillMode?: "fill" | "outline";
  strokeWidth?: number;
  matchTextColor?: boolean;
}) {
  const cubeHeight = size * heightRatio;
  const cubeWidth = size * widthRatio;
  const cubeDepth = size * widthRatio;
  const textMaxWidth = maxWidth ?? cubeWidth * 0.85;
  const textFont = font || "/fonts/space-mono-v17-latin-700.ttf";
  const textExtrusion = size * 0.001;
  const fontSize =
    Math.max(((size * 0.8) / text.length) * (100 / 65), textSize * 0.3) * 1.2;
  const textFaces: Array<{
    pos: [number, number, number];
    rot: [number, number, number];
    lh: number;
  }> = [
    { pos: [0, 0, cubeDepth / 2 + textExtrusion], rot: [0, 0, 0], lh: 0.9 },
    {
      pos: [cubeWidth / 2 + textExtrusion, 0, 0],
      rot: [0, Math.PI / 2, 0],
      lh: 0.8,
    },
    {
      pos: [0, 0, -cubeDepth / 2 - textExtrusion],
      rot: [0, Math.PI, 0],
      lh: 0.8,
    },
    {
      pos: [-cubeWidth / 2 - textExtrusion, 0, 0],
      rot: [0, -Math.PI / 2, 0],
      lh: 0.8,
    },
  ];
  const materialColor = fillMode === "outline" ? "black" : color;
  const finalTextColor = matchTextColor ? color : textColor;
  const boxGeometry = useMemo(
    () => new THREE.BoxGeometry(cubeWidth, cubeHeight, cubeDepth),
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
        {textFaces.map((face, i) => (
          <Text
            key={i}
            position={face.pos}
            rotation={face.rot}
            fontSize={fontSize}
            color={finalTextColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={face.lh}
            maxWidth={textMaxWidth}
            renderOrder={2}
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {text}
          </Text>
        ))}
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
  font,
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
  font?: string | object;
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

  return (
    <Canvas camera={cameraConfig} gl={glConfig}>
      <EffectComposer>
        <DotScreen angle={Math.PI / 12} scale={1.1} />
      </EffectComposer>
      {texts.map((text, index) => {
        const pos = cubePositions[index];
        return (
          <group key={index} position={[0, pos.y, pos.z]}>
            <SingleTextCube
              groupRef={groupRefs[index]}
              targetRotation={targetRotations[index]}
              targetScale={targetScale}
              text={text}
              size={size}
              heightRatio={heightRatio}
              widthRatio={widthRatio}
              color={colors[index % colors.length]}
              textColor={textColor}
              textSize={textSize}
              maxWidth={maxWidth}
              font={font}
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

export default function AnimatedMultiCube({
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
  font,
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
  const dragStartRef = useRef(0);
  const dragStartRotationsRef = useRef<number[]>([]);
  const dragRotationsRef = useRef<number[]>([]);
  const draggedCubeIndexRef = useRef(-1);

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

    let masterScrollTrigger: ScrollTrigger | null = null;

    requestAnimationFrame(() => {
      if (!containerRef.current || !trigger?.current) return;

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

      ScrollTrigger.refresh();
    });

    return () => {
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
      dragStartRef.current = clientX;
      draggedCubeIndexRef.current = getCubeIndexFromY(clientY);
      dragStartRotationsRef.current = [...dragRotationsRef.current];
      container.style.cursor = "grabbing";
    };

    const handleMove = (clientX: number) => {
      if (!isDraggingRef.current || draggedCubeIndexRef.current === -1) return;
      const deltaX = clientX - dragStartRef.current;
      const rotationDelta = (deltaX / container.offsetWidth) * Math.PI * 2;
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
      container.style.cursor = "grab";
    };

    const handleMouseDown = (e: MouseEvent) =>
      handleStart(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchStart = (e: TouchEvent) =>
      e.touches.length === 1 &&
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    const handleTouchMove = (e: TouchEvent) => {
      if (
        !isDraggingRef.current ||
        e.touches.length !== 1 ||
        draggedCubeIndexRef.current === -1
      )
        return;
      e.preventDefault();
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
        font={font}
        spacing={spacing}
        dragRotations={dragRotations}
        fillMode={fillMode}
        strokeWidth={strokeWidth}
        matchTextColor={matchTextColor}
      />
    </div>
  );
}
