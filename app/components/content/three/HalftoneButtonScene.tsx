"use client";

import {
  useRef,
  useEffect,
  useState,
  useMemo,
  memo,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { EffectComposer, DotScreen } from "@react-three/postprocessing";
import {
  DoubleSide,
  AlwaysStencilFunc,
  ReplaceStencilOp,
  BufferGeometry,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { cubeLabelSlugify, buttonLabelSlugMap } from "@/config/cubeLabels";
import {
  getButtonLabelAsset,
  type LabelGeometryAsset,
} from "@/app/lib/three/labelGeometry";

interface EdgesWithTransitionProps {
  geometry: BufferGeometry;
  color: string;
  targetWidth: number;
}

interface TextWithTransitionProps {
  labelAsset: LabelGeometryAsset | null;
  color: string;
  baseScale: number;
  targetScale: number;
}

interface ButtonSceneProps {
  text: string;
  color: string;
  strokeWidth: number;
  textScale: number;
}

export interface HalftoneButtonSceneProps {
  text: string;
  href: string;
  color: string;
}

const BASE_HEIGHT = 1.9;

function CameraController() {
  const { camera, size } = useThree();
  const camRef = useRef(camera);

  useEffect(() => {
    camRef.current = camera;
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

const EdgesWithTransition = memo(function EdgesWithTransition({
  geometry,
  color,
  targetWidth,
}: EdgesWithTransitionProps) {
  const [currentWidth, setCurrentWidth] = useState(targetWidth);

  useFrame(() => {
    setCurrentWidth((previous) => previous + (targetWidth - previous) * 0.15);
  });

  const scaledWidth = useMemo(() => {
    const geometryHeight = BASE_HEIGHT * 0.95;
    const baseStrokeRatio = currentWidth / BASE_HEIGHT;
    return baseStrokeRatio * geometryHeight;
  }, [currentWidth]);

  return (
    <EdgesWithTransitionInner
      geometry={geometry}
      color={color}
      width={scaledWidth}
    />
  );
});

const EdgesWithTransitionInner = memo(function EdgesWithTransitionInner({
  geometry,
  color,
  width,
}: {
  geometry: BufferGeometry;
  color: string;
  width: number;
}) {
  return (
    <Edges
      geometry={geometry}
      color={color}
      lineWidth={width}
      renderOrder={1000}
      depthTest={true}
      depthWrite={true}
      polygonOffset={true}
      polygonOffsetFactor={1}
      polygonOffsetUnits={1}
    />
  );
});

const TextWithTransition = memo(function TextWithTransition({
  labelAsset,
  color,
  baseScale,
  targetScale,
}: TextWithTransitionProps) {
  const [currentScale, setCurrentScale] = useState(1);

  useFrame(() => {
    setCurrentScale((previous) => previous + (targetScale - previous) * 0.15);
  });

  if (!labelAsset) return null;

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
});

const ButtonScene = memo(function ButtonScene({
  text,
  color,
  strokeWidth,
  textScale,
}: ButtonSceneProps) {
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
  const labelAsset = useMemo(
    () => getButtonLabelAsset(labelSlug),
    [labelSlug]
  );

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
        labelAsset={labelAsset ?? null}
        color={color}
        baseScale={baseLabelScale}
        targetScale={textScale}
      />
    </>
  );
});

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
      style={{ borderColor: color }}
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

