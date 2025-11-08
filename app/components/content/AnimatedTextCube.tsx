"use client";

import { useRef, useEffect, useState, RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { getGSAP, getScrollTrigger } from "../../lib/gsap";

interface AnimatedTextCubeProps {
  texts: string[];
  trigger: RefObject<HTMLElement>;
  start: string;
  end: string;
  scrub?: number | boolean;
  from?: {
    rotation?: { x?: number; y?: number; z?: number };
    scale?: number;
  };
  to: {
    rotation: { x: number; y: number; z: number };
    scale?: number;
  };
  ease?: string;
  pin?: boolean;
  showMarkers?: boolean;
  markerColor?: string;
  toggleActions?: string;
  invalidateOnRefresh?: boolean;
  size?: number;
  heightRatio?: number;
  colors?: string[];
  textColor?: string;
  textSize?: number;
  cameraPosition?: [number, number, number];
  cameraFov?: number;
  className?: string;
  maxWidth?: number;
  font?: string | object;
  materialType?: "basic" | "lambert" | "phong" | "standard" | "toon";
}

function SmoothRotation({
  groupRef,
  targetRotation,
  targetScale,
  dragRotation,
}: {
  groupRef: React.MutableRefObject<THREE.Group | null>;
  targetRotation: { x: number; y: number; z: number };
  targetScale: number;
  dragRotation: number;
}) {
  useFrame(() => {
    if (groupRef.current) {
      const combinedRotationY = targetRotation.y + dragRotation;
      groupRef.current.rotation.x +=
        (targetRotation.x - groupRef.current.rotation.x) * 0.1;
      groupRef.current.rotation.y +=
        (combinedRotationY - groupRef.current.rotation.y) * 0.1;
      groupRef.current.rotation.z +=
        (targetRotation.z - groupRef.current.rotation.z) * 0.1;

      groupRef.current.scale.x +=
        (targetScale - groupRef.current.scale.x) * 0.1;
      groupRef.current.scale.y +=
        (targetScale - groupRef.current.scale.y) * 0.1;
      groupRef.current.scale.z +=
        (targetScale - groupRef.current.scale.z) * 0.1;
    }
  });

  return null;
}

function TextCube({
  groupRef,
  targetRotation,
  targetScale,
  texts,
  size,
  heightRatio,
  colors,
  textColor,
  textSize,
  maxWidth,
  font,
  dragRotation,
  materialType = "standard",
}: {
  groupRef: React.MutableRefObject<THREE.Group | null>;
  targetRotation: { x: number; y: number; z: number };
  targetScale: number;
  texts: string[];
  size: number;
  heightRatio: number;
  colors: string[];
  textColor: string;
  textSize: number;
  maxWidth?: number;
  font?: string | object;
  dragRotation: number;
  materialType?: "basic" | "lambert" | "phong" | "standard" | "toon";
}) {
  const faceTexts = texts.slice(0, 6);
  const faceMapping = [
    faceTexts[0],
    faceTexts[1],
    faceTexts[2],
    faceTexts[3],
    faceTexts[4],
    faceTexts[5],
  ];
  const defaultColors = [
    "#3b82f6",
    "#2563eb",
    "#1d4ed8",
    "#1e40af",
    "#60a5fa",
    "#3b82f6",
  ];
  const cubeColors = colors.length >= 6 ? colors : defaultColors;
  const cubeHeight = size * heightRatio;
  const textMaxWidth = maxWidth ?? size * 0.9;
  const textFont = font || "/fonts/space-mono-v17-latin-700.ttf";
  const textExtrusion = size * 0.05;

  const addLineBreaks = (text: string): string => {
    const words = text.split(" ");
    const lines: string[] = [];
    for (let i = 0; i < words.length; i += 2) {
      lines.push(words.slice(i, i + 2).join(" "));
    }
    return lines.join("\n");
  };

  const calculateFontSize = (text: string): number => {
    const textWithBreaks = addLineBreaks(text);
    const lines = textWithBreaks.split("\n");
    const maxLineLength = Math.max(...lines.map((line) => line.length));
    const chars = maxLineLength;
    const baseSize = size * 0.8;
    const calculatedSize = (baseSize / chars) * (100 / 65);
    return Math.max(calculatedSize, textSize * 0.3) * 1.15;
  };

  return (
    <>
      <SmoothRotation
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
        dragRotation={dragRotation}
      />
      <group ref={groupRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[size, cubeHeight, size]} />
          {cubeColors.map((color, i) => {
            const commonProps = {
              key: i,
              color,
              attach: `material-${i}` as const,
            };

            switch (materialType) {
              case "basic":
                return <meshBasicMaterial {...commonProps} />;
              case "lambert":
                return <meshLambertMaterial {...commonProps} />;
              case "phong":
                return <meshPhongMaterial {...commonProps} shininess={30} />;
              case "toon":
                return <meshToonMaterial {...commonProps} />;
              case "standard":
              default:
                return (
                  <meshStandardMaterial
                    {...commonProps}
                    roughness={1}
                    metalness={1}
                    emissive={color}
                    emissiveIntensity={0.1}
                  />
                );
            }
          })}
        </mesh>
        {faceMapping[0] && (
          <Text
            position={[0, 0, size / 2 + textExtrusion]}
            fontSize={calculateFontSize(faceMapping[0] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[0] || "")}
          </Text>
        )}
        {faceMapping[1] && (
          <Text
            position={[size / 2 + textExtrusion, 0, 0]}
            rotation={[0, Math.PI / 2, 0]}
            fontSize={calculateFontSize(faceMapping[1] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[1] || "")}
          </Text>
        )}
        {faceMapping[2] && (
          <Text
            position={[0, 0, -size / 2 - textExtrusion]}
            rotation={[0, Math.PI, 0]}
            fontSize={calculateFontSize(faceMapping[2] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[2] || "")}
          </Text>
        )}
        {faceMapping[3] && (
          <Text
            position={[-size / 2 - textExtrusion, 0, 0]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={calculateFontSize(faceMapping[3] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[3] || "")}
          </Text>
        )}
        {faceMapping[4] && (
          <Text
            position={[0, cubeHeight / 2 + textExtrusion, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            fontSize={calculateFontSize(faceMapping[4] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[4] || "")}
          </Text>
        )}
        {faceMapping[5] && (
          <Text
            position={[0, -cubeHeight / 2 - textExtrusion, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            fontSize={calculateFontSize(faceMapping[5] || "")}
            color={textColor}
            anchorX="center"
            anchorY="middle"
            lineHeight={0.8}
            maxWidth={textMaxWidth}
            castShadow
            {...(typeof textFont === "string" ? { font: textFont } : {})}
            overflowWrap="break-word"
          >
            {addLineBreaks(faceMapping[5] || "")}
          </Text>
        )}
      </group>
    </>
  );
}

function CubeScene({
  groupRef,
  targetRotation,
  targetScale,
  texts,
  size,
  heightRatio,
  colors,
  textColor,
  textSize,
  cameraPosition,
  cameraFov,
  maxWidth,
  font,
  dragRotation,
  materialType,
}: {
  groupRef: React.MutableRefObject<THREE.Group | null>;
  targetRotation: { x: number; y: number; z: number };
  targetScale: number;
  texts: string[];
  size: number;
  heightRatio: number;
  colors: string[];
  textColor: string;
  textSize: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
  maxWidth?: number;
  font?: string | object;
  dragRotation: number;
  materialType?: "basic" | "lambert" | "phong" | "standard" | "toon";
}) {
  return (
    <Canvas
      camera={{ position: cameraPosition, fov: cameraFov }}
      shadows
      gl={{ antialias: true, alpha: false }}
    >
      <fog attach="fog" args={["#000000", 20, 30]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-normalBias={0.02}
      />
      <pointLight position={[-10, -10, -5]} intensity={0.8} color="#3b82f6" />
      <TextCube
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
        texts={texts}
        size={size}
        heightRatio={heightRatio}
        colors={colors}
        textColor={textColor}
        textSize={textSize}
        maxWidth={maxWidth}
        font={font}
        dragRotation={dragRotation}
        materialType={materialType}
      />
    </Canvas>
  );
}

export default function AnimatedTextCube({
  texts,
  trigger,
  start,
  end,
  scrub = 1,
  from,
  to,
  ease = "none",
  pin = false,
  showMarkers = false,
  markerColor = "cyan",
  toggleActions,
  invalidateOnRefresh = true,
  size,
  heightRatio = 1,
  colors = [],
  textColor = "white",
  textSize = 0.4,
  cameraPosition = [0, 0, 3],
  cameraFov = 40,
  className,
  maxWidth,
  font,
  materialType = "standard",
}: AnimatedTextCubeProps) {
  const groupRef = useRef<THREE.Group | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [calculatedSize, setCalculatedSize] = useState<number>(size ?? 2);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const [targetRotation, setTargetRotation] = useState<{
    x: number;
    y: number;
    z: number;
  }>({
    x: from?.rotation?.x ?? 0,
    y: from?.rotation?.y ?? 0,
    z: from?.rotation?.z ?? 0,
  });
  const [targetScale, setTargetScale] = useState<number>(from?.scale ?? 1);
  const [dragRotation, setDragRotation] = useState<number>(0);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<number>(0);
  const dragStartRotationRef = useRef<number>(0);
  const dragRotationRef = useRef<number>(0);
  const scrollProgressRef = useRef<number>(0);
  const targetRotationYRef = useRef<number>(0);

  useEffect(() => {
    if (size !== undefined) {
      setCalculatedSize(size);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      return;
    }

    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const minDimension = Math.min(rect.width, rect.height);
      const calculated = Math.max(minDimension * 0.4, 1);
      if (calculated > 0) {
        setCalculatedSize(calculated);
      }
    };

    const initObserver = () => {
      updateSize();
      resizeObserverRef.current = new ResizeObserver(updateSize);
      if (containerRef.current) {
        resizeObserverRef.current.observe(containerRef.current);
      }
    };

    const timeoutId = setTimeout(initObserver, 0);

    return () => {
      clearTimeout(timeoutId);
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
    };
  }, [size]);

  useEffect(() => {
    dragRotationRef.current = dragRotation;
  }, [dragRotation]);

  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  useEffect(() => {
    targetRotationYRef.current = targetRotation.y;
  }, [targetRotation.y]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !containerRef.current ||
      !trigger?.current
    )
      return;

    let animation: ReturnType<typeof import("gsap").gsap.to> | null = null;
    let isActive = true;

    const initAnimation = async () => {
      if (!isActive) return;

      const [gsap, ScrollTrigger] = await Promise.all([
        getGSAP(),
        getScrollTrigger(),
      ]);

      if (!isActive || !containerRef.current || !trigger?.current) return;

      const markerConfig = showMarkers
        ? {
            markers: {
              startColor: markerColor,
              endColor: markerColor,
              fontSize: "12px",
              fontWeight: "bold",
            },
          }
        : { markers: false };

      const scrollTriggerConfig: Record<string, unknown> = {
        trigger: trigger.current,
        start,
        end,
        pin: pin ?? false,
        invalidateOnRefresh: invalidateOnRefresh ?? true,
        anticipatePin: 1,
        ...markerConfig,
      };

      if (toggleActions) {
        scrollTriggerConfig.toggleActions = toggleActions;
      } else {
        scrollTriggerConfig.scrub =
          typeof scrub === "number" ? scrub : scrub ? 1 : false;
      }

      const fromRotation = from?.rotation ?? { x: 0, y: 0, z: 0 };
      const fromScale = from?.scale ?? 1;

      const data = {
        rotationX: fromRotation.x,
        rotationY: fromRotation.y,
        rotationZ: fromRotation.z,
        scale: fromScale,
      };

      animation = gsap.to(data, {
        rotationX: to.rotation.x,
        rotationY: to.rotation.y,
        rotationZ: to.rotation.z,
        scale: to.scale ?? 1,
        ease: ease,
        scrollTrigger: scrollTriggerConfig,
        onUpdate: function () {
          const progress = this.progress();
          setScrollProgress(progress);
          const rotationY = data.rotationY ?? fromRotation.y ?? 0;
          setTargetRotation({
            x: (data.rotationX ?? fromRotation.x) as number,
            y: rotationY,
            z: (data.rotationZ ?? fromRotation.z) as number,
          });
          setTargetScale((data.scale ?? fromScale) as number);
        },
      });

      ScrollTrigger.refresh();
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(() => initAnimation(), { timeout: 2000 });
    } else {
      setTimeout(() => initAnimation(), 100);
    }

    return () => {
      isActive = false;
      if (animation) {
        if (animation.scrollTrigger) {
          animation.scrollTrigger.kill();
        }
        animation.kill();
      }
    };
  }, [
    trigger,
    start,
    end,
    scrub,
    pin,
    showMarkers,
    markerColor,
    ease,
    toggleActions,
    invalidateOnRefresh,
    from,
    to,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      dragStartRef.current = e.clientX;
      dragStartRotationRef.current = dragRotationRef.current;
      container.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const deltaX = e.clientX - dragStartRef.current;
      const rotationDelta = (deltaX / container.offsetWidth) * Math.PI * 2;
      let newRotation = dragStartRotationRef.current + rotationDelta;

      const currentProgress = scrollProgressRef.current;
      const totalRotation = targetRotationYRef.current + newRotation;
      const maxRotation = -Math.PI * 1.5;

      if (currentProgress >= 1 && totalRotation < maxRotation) {
        newRotation = maxRotation - targetRotationYRef.current;
      }

      dragRotationRef.current = newRotation;
      setDragRotation(newRotation);
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        container.style.cursor = "grab";
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        dragStartRef.current = e.touches[0].clientX;
        dragStartRotationRef.current = dragRotationRef.current;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return;
      e.preventDefault();
      const deltaX = e.touches[0].clientX - dragStartRef.current;
      const rotationDelta = (deltaX / container.offsetWidth) * Math.PI * 2;
      let newRotation = dragStartRotationRef.current + rotationDelta;

      const currentProgress = scrollProgressRef.current;
      const totalRotation = targetRotationYRef.current + newRotation;
      const maxRotation = -Math.PI * 1.5;

      if (currentProgress >= 1 && totalRotation < maxRotation) {
        newRotation = maxRotation - targetRotationYRef.current;
      }

      dragRotationRef.current = newRotation;
      setDragRotation(newRotation);
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
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
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef} className={className}>
      <CubeScene
        groupRef={groupRef}
        targetRotation={targetRotation}
        targetScale={targetScale}
        texts={texts}
        size={calculatedSize}
        heightRatio={heightRatio}
        colors={colors}
        textColor={textColor}
        textSize={textSize}
        cameraPosition={cameraPosition}
        cameraFov={cameraFov}
        maxWidth={maxWidth}
        font={font}
        dragRotation={dragRotation}
        materialType={materialType}
      />
    </div>
  );
}
