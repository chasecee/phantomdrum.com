"use client";

import { useRef, useEffect, useState, RefObject, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
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
    const combinedY = targetRotation.y + dragRotation;
    g.rotation.x += (targetRotation.x - g.rotation.x) * 0.1;
    g.rotation.y += (combinedY - g.rotation.y) * 0.1;
    g.rotation.z += (targetRotation.z - g.rotation.z) * 0.1;
    g.scale.x += (targetScale - g.scale.x) * 0.1;
    g.scale.y += (targetScale - g.scale.y) * 0.1;
    g.scale.z += (targetScale - g.scale.z) * 0.1;
  });
  return null;
}

function SingleTextCube({
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
}) {
  const cubeHeight = size * heightRatio;
  const cubeWidth = size * widthRatio;
  const cubeDepth = size * widthRatio;
  const textMaxWidth = maxWidth ?? cubeWidth * 0.85;
  const textFont = font || "/fonts/space-mono-v17-latin-700.ttf";
  const textExtrusion = size * 0.001;

  const calculateFontSize = (text: string) =>
    Math.max(((size * 0.8) / text.length) * (100 / 65), textSize * 0.3) * 1.15;

  const fontSize = calculateFontSize(text);

  const textFaces = [
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

  return (
    <>
      <SmoothRotation
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
        dragRotation={dragRotation}
      />
      <group ref={groupRef}>
        <mesh>
          <boxGeometry args={[cubeWidth, cubeHeight, cubeDepth]} />
          <meshBasicMaterial color={color} />
        </mesh>
        {textFaces.map((face, i) => (
          <Text
            key={i}
            position={face.pos as [number, number, number]}
            rotation={face.rot as [number, number, number]}
            fontSize={fontSize}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={face.lh}
            maxWidth={textMaxWidth}
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {text}
          </Text>
        ))}
      </group>
    </>
  );
}

function MultiCubeScene({
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
}) {
  const cubeHeight = size * heightRatio;
  const relativeSpacing = spacing * cubeHeight;
  const startY =
    (texts.length * cubeHeight + (texts.length - 1) * relativeSpacing) / 2 -
    cubeHeight / 2;

  return (
    <Canvas
      camera={{ position: cameraPosition, fov: cameraFov }}
      gl={{ antialias: true, alpha: false }}
    >
      {texts.map((text, index) => {
        const yPosition = startY - index * (cubeHeight + relativeSpacing);
        return (
          <group key={index} position={[0, yPosition, 0]}>
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
            />
          </group>
        );
      })}
    </Canvas>
  );
}

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
}: AnimatedMultiCubeProps) {
  const groupRefs = useMemo<CubeGroupRef[]>(
    () => Array.from({ length: texts.length }, () => ({ current: null })),
    [texts.length]
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatedSize = size ?? 2;
  const [dynamicSize, setDynamicSize] = useState<number>(calculatedSize);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const finalSize = size !== undefined ? calculatedSize : dynamicSize;
  const [targetRotations, setTargetRotations] = useState<Rotation[]>(
    texts.map(() => ({
      x: from?.rotation?.x ?? 0,
      y: from?.rotation?.y ?? 0,
      z: from?.rotation?.z ?? 0,
    }))
  );
  const [targetScale, setTargetScale] = useState<number>(from?.scale ?? 1);
  const [targetYPercent, setTargetYPercent] = useState<number>(
    from?.yPercent ?? 0
  );
  const [dragRotations, setDragRotations] = useState<number[]>(
    texts.map(() => 0)
  );
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<number>(0);
  const dragStartRotationsRef = useRef<number[]>(texts.map(() => 0));
  const dragRotationsRef = useRef<number[]>(texts.map(() => 0));
  const draggedCubeIndexRef = useRef<number>(-1);

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
    if (containerRef.current) {
      resizeObserverRef.current.observe(containerRef.current);
    }

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
          const yPercent =
            fromYPercent +
            ((to.yPercent ?? fromYPercent) - fromYPercent) * progress;
          setTargetYPercent(yPercent);

          for (let i = 0; i < texts.length; i++) {
            const offset = stagger ? i * staggerDelay : 0;
            const prog = stagger
              ? Math.max(
                  0,
                  Math.min(1, (progress - offset) / (1 - totalStaggerDelay))
                )
              : progress;

            const rotX =
              (fromRotation.x ?? 0) +
              ((to.rotation.x ?? 0) - (fromRotation.x ?? 0)) * prog;
            const rotY =
              (fromRotation.y ?? 0) +
              ((to.rotation.y ?? 0) - (fromRotation.y ?? 0)) * prog;
            const rotZ =
              (fromRotation.z ?? 0) +
              ((to.rotation.z ?? 0) - (fromRotation.z ?? 0)) * prog;
            const scale = fromScale + ((to.scale ?? 1) - fromScale) * prog;

            setTargetRotations((prev) => {
              const next = [...prev];
              next[i] = { x: rotX, y: rotY, z: rotZ };
              return next;
            });
            if (i === 0) setTargetScale(scale);
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
    dragRotationsRef.current = dragRotations;

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
    const handleMouseUp = () => handleEnd();

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
      e.preventDefault();
      handleMove(e.touches[0].clientX);
    };

    container.style.cursor = "grab";
    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
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
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleEnd);
    };
  }, [texts.length, dragRotations]);

  const defaultColors = ["#C4A070", "#B88B70", "#A04A4B", "#7A3A3A"];
  const cubeColors =
    colors.length >= texts.length
      ? colors.slice(0, texts.length)
      : texts.map((_, i) => defaultColors[i % defaultColors.length]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        transform: `translateY(${targetYPercent}%)`,
      }}
    >
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
      />
    </div>
  );
}
