"use client";

import { useMemo, useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Text, Edges } from "@react-three/drei";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { EffectComposer, DotScreen } from "@react-three/postprocessing";
import {
  OrthographicCamera,
  BufferGeometry,
  AlwaysStencilFunc,
  ReplaceStencilOp,
} from "three";

interface HalftoneButtonProps {
  text: string;
  href: string;
  color: string;
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
  text,
  color,
  fontSize,
  targetScale,
}: {
  text: string;
  color: string;
  fontSize: number;
  targetScale: number;
}) {
  const [currentScale, setCurrentScale] = useState(1);

  useFrame(() => {
    setCurrentScale((prev) => prev + (targetScale - prev) * 0.15);
  });

  return (
    <Text
      position={[0, 0, 0.08]}
      fontSize={fontSize * currentScale}
      color={color}
      anchorX="center"
      anchorY="middle"
      font="/fonts/space-mono-v17-latin-700.ttf"
      renderOrder={3}
    >
      {text.toUpperCase()}
    </Text>
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

  const fontSize = useMemo(() => {
    const baseSize = Math.max(0.8 / text.length, 0.15);
    return baseSize * 3.5;
  }, [text.length]);

  const { boxWidth, boxHeight, radius } = useMemo(() => {
    const width = BASE_HEIGHT * aspect;
    const boxWidth = width * 0.99;
    const boxHeight = BASE_HEIGHT * 0.95;
    const radius = Math.min(boxWidth, boxHeight) * 0.05;
    return { boxWidth, boxHeight, radius };
  }, [aspect]);

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
        text={text}
        color={color}
        fontSize={fontSize}
        targetScale={textScale}
      />
    </>
  );
}

export default function HalftoneButton({
  text,
  href,
  color,
}: HalftoneButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const strokeWidth = isHovered ? 18 : 8;
  const textScale = isHovered ? 1.4 : 1.2;

  return (
    <Link
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
      </div>
    </Link>
  );
}
