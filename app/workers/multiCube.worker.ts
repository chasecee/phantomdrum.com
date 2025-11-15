import {
  BoxGeometry,
  Color,
  DoubleSide,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { cubeLabelSlugMap, cubeLabelSlugify } from "@/config/cubeLabels";
import { getCubeLabelAsset } from "@/app/lib/three/labelGeometry";
import { getBoxGeometry } from "@/app/lib/three/geometryCache";

type Rotation = { x: number; y: number; z: number };

type MultiCubeConfig = {
  texts: string[];
  size: number;
  heightRatio: number;
  widthRatio: number;
  colors: string[];
  textColor: string;
  textSize: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
  maxWidth: number | null;
  spacing: number;
  fillMode: "fill" | "outline";
  strokeWidth: number | null;
  matchTextColor: boolean;
};

type Dimensions = { width: number; height: number; dpr: number };

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  config: MultiCubeConfig;
  dimensions: Dimensions;
};

type ConfigMessage = {
  type: "config";
  config: MultiCubeConfig;
};

type TargetsMessage = {
  type: "targets";
  rotations: Rotation[];
  dragRotations: number[];
  scale: number;
};

type ResizeMessage = {
  type: "resize";
  width: number;
  height: number;
  dpr: number;
};

type DisposeMessage = { type: "dispose" };

type VisibilityMessage = { type: "visibility"; isVisible: boolean };

type WorkerMessage =
  | InitMessage
  | ConfigMessage
  | TargetsMessage
  | ResizeMessage
  | DisposeMessage
  | VisibilityMessage;

type CubeInstance = {
  group: Group;
  boxMaterial: MeshBasicMaterial;
  edge?: {
    line: LineSegments2;
    material: LineMaterial;
    geometry: LineSegmentsGeometry;
  };
  labelMeshes: Mesh[];
  currentRotation: Rotation;
  currentScale: number;
};

const state = {
  config: null as MultiCubeConfig | null,
  renderer: null as WebGLRenderer | null,
  camera: null as PerspectiveCamera | null,
  scene: null as Scene | null,
  cubes: [] as CubeInstance[],
  rotations: [] as Rotation[],
  dragRotations: [] as number[],
  scaleTarget: 1,
  syncedOnce: false,
  dimensions: null as Dimensions | null,
  isVisible: false,
  isAnimating: false,
  idleFrames: 0,
};

const smoothing = 0.1;
const up = new Vector3(0, 1, 0);
const MOTION_EPSILON = 0.00035;
const IDLE_FRAMES_BEFORE_PAUSE = 45;

const buildRotationsArray = (length: number) => {
  const rotations: Rotation[] = [];
  for (let index = 0; index < length; index += 1) {
    rotations.push({ x: 0, y: 0, z: 0 });
  }
  return rotations;
};

const startAnimationLoop = () => {
  if (!state.renderer || state.isAnimating) return;
  state.idleFrames = 0;
  state.renderer.setAnimationLoop(updateFrame);
  state.isAnimating = true;
};

const stopAnimationLoop = () => {
  if (!state.renderer || !state.isAnimating) return;
  state.renderer.setAnimationLoop(null);
  state.isAnimating = false;
  state.idleFrames = 0;
};

const renderOnce = () => {
  if (!state.renderer || !state.scene || !state.camera) return;
  state.renderer.render(state.scene, state.camera);
};

const snapSceneToTargets = () => {
  if (!state.scene || state.cubes.length === 0) return;
  state.cubes.forEach((cube, index) => {
    const rotation = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
    const drag = state.dragRotations[index] ?? 0;
    cube.currentRotation.x = rotation.x;
    cube.currentRotation.y = rotation.y + drag;
    cube.currentRotation.z = rotation.z;
    cube.currentScale = state.scaleTarget;
    cube.group.rotation.set(
      cube.currentRotation.x,
      cube.currentRotation.y,
      cube.currentRotation.z
    );
    cube.group.scale.setScalar(cube.currentScale);
  });
  state.syncedOnce = true;
};

const clearCubes = () => {
  state.cubes.forEach((cube) => {
    cube.labelMeshes.forEach((mesh) => {
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    });
    cube.boxMaterial.dispose();
    if (cube.edge) {
      cube.edge.material.dispose();
      cube.edge.geometry.dispose();
    }
    state.scene?.remove(cube.group);
  });
  state.cubes = [];
};

const ensureRenderer = (canvas: OffscreenCanvas, dimensions: Dimensions) => {
  if (state.renderer) return;
  state.dimensions = { ...dimensions };
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    depth: true,
    logarithmicDepthBuffer: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(dimensions.dpr);
  renderer.setSize(dimensions.width, dimensions.height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = 0;
  state.renderer = renderer;
  state.scene = new Scene();
  state.camera = new PerspectiveCamera(
    state.config?.cameraFov ?? 10,
    Math.max(dimensions.width / Math.max(dimensions.height, 1), 0.0001),
    0.1,
    1000
  );
};

const handleResize = (dimensions: Dimensions) => {
  if (!state.renderer || !state.camera) return;
  const current = state.dimensions;
  if (
    current &&
    current.width === dimensions.width &&
    current.height === dimensions.height &&
    current.dpr === dimensions.dpr
  ) {
    return;
  }
  state.dimensions = { ...dimensions };
  const aspect =
    dimensions.height > 0 ? dimensions.width / dimensions.height : 1;
  state.renderer.setPixelRatio(dimensions.dpr);
  state.renderer.setSize(dimensions.width, dimensions.height, false);
  state.camera.aspect = aspect;
  state.camera.updateProjectionMatrix();
  const resolution = new Vector3(
    dimensions.width * dimensions.dpr,
    dimensions.height * dimensions.dpr,
    1
  );
  state.cubes.forEach((cube) => {
    if (cube.edge?.material) {
      cube.edge.material.resolution.copy(resolution);
    }
  });
};

const computeLabelSlug = (text: string) =>
  cubeLabelSlugMap.get(text) ?? cubeLabelSlugify(text);

const edgesGeometryToLineSegmentsGeometry = (
  edgesGeometry: EdgesGeometry
): LineSegmentsGeometry => {
  const positions: number[] = [];
  const positionAttribute = edgesGeometry.attributes.position;
  for (let i = 0; i < positionAttribute.count; i++) {
    const x = positionAttribute.getX(i);
    const y = positionAttribute.getY(i);
    const z = positionAttribute.getZ(i);
    positions.push(x, y, z);
  }
  const lineSegmentsGeometry = new LineSegmentsGeometry();
  lineSegmentsGeometry.setPositions(positions);
  return lineSegmentsGeometry;
};

const rebuildCubes = () => {
  if (!state.scene || !state.config) return;
  if (
    !state.config.colors ||
    !Array.isArray(state.config.colors) ||
    state.config.colors.length === 0
  ) {
    return;
  }
  clearCubes();
  const {
    texts,
    size,
    heightRatio,
    widthRatio,
    colors,
    textColor,
    textSize,
    maxWidth,
    spacing,
    fillMode,
    strokeWidth,
    matchTextColor,
  } = state.config;
  const cubeHeight = size * heightRatio;
  const cubeWidth = size * widthRatio;
  const cubeDepth = cubeWidth;
  const spacingUnits = spacing * cubeHeight;
  const totalHeight =
    texts.length * cubeHeight + Math.max(texts.length - 1, 0) * spacingUnits;
  const startY = totalHeight / 2 - cubeHeight / 2;
  const baseBoxGeometry: BoxGeometry = getBoxGeometry(
    cubeWidth,
    cubeHeight,
    cubeDepth
  );
  const textFaces: Array<{ position: Vector3; rotation: Rotation }> = [
    {
      position: new Vector3(0, 0, cubeDepth / 2 + size * 0.01),
      rotation: { x: 0, y: 0, z: 0 },
    },
    {
      position: new Vector3(cubeWidth / 2 + size * 0.01, 0, 0),
      rotation: { x: 0, y: Math.PI / 2, z: 0 },
    },
    {
      position: new Vector3(0, 0, -cubeDepth / 2 - size * 0.01),
      rotation: { x: 0, y: Math.PI, z: 0 },
    },
    {
      position: new Vector3(-cubeWidth / 2 - size * 0.01, 0, 0),
      rotation: { x: 0, y: -Math.PI / 2, z: 0 },
    },
  ];

  texts.forEach((text, index) => {
    const rawColor = colors[index % colors.length];
    const colorHex =
      (typeof rawColor === "string" ? rawColor.trim() : "#FFFFFF") || "#FFFFFF";
    const materialColor = fillMode === "outline" ? "black" : colorHex;
    const cubeGroup = new Group();
    cubeGroup.position.set(
      0,
      startY - index * (cubeHeight + spacingUnits),
      index * 0.05
    );
    state.scene?.add(cubeGroup);

    const boxColor = new Color(materialColor);
    const boxMaterial = new MeshBasicMaterial({
      color: boxColor.clone(),
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 1.5,
      polygonOffsetUnits: 1.5,
      toneMapped: false,
    });
    boxMaterial.color.copy(boxColor);

    const boxMesh = new Mesh(baseBoxGeometry, boxMaterial);
    boxMesh.renderOrder = 0;
    cubeGroup.add(boxMesh);

    let outline: CubeInstance["edge"];
    if (fillMode === "outline") {
      const scaledGeometry = baseBoxGeometry.clone().scale(1.0025, 1.0025, 1.0025);
      const edgesGeometry = new EdgesGeometry(scaledGeometry);
      const lineSegmentsGeometry = edgesGeometryToLineSegmentsGeometry(edgesGeometry);
      edgesGeometry.dispose();
      scaledGeometry.dispose();
      const outlineColor = new Color(colorHex);
      const lineWidth = strokeWidth ?? 1;
      const resolution = state.dimensions
        ? new Vector2(
            state.dimensions.width * state.dimensions.dpr,
            state.dimensions.height * state.dimensions.dpr
          )
        : new Vector2(1, 1);
      const outlineMaterial = new LineMaterial({
        color: outlineColor.getHex(),
        linewidth: lineWidth,
        resolution,
        depthTest: true,
        depthWrite: false,
      });
      const outlineLine = new LineSegments2(lineSegmentsGeometry, outlineMaterial);
      outlineLine.renderOrder = 1;
      cubeGroup.add(outlineLine);

      outline = {
        line: outlineLine,
        material: outlineMaterial,
        geometry: lineSegmentsGeometry,
      };
    }

    const labelSlug = computeLabelSlug(text);
    const labelAsset = labelSlug ? getCubeLabelAsset(labelSlug) : null;
    const labelMeshes: Mesh[] = [];
    const finalTextHex = matchTextColor
      ? colorHex
      : textColor?.trim() || "#FFFFFF";

    const textMaxWidth = maxWidth ?? cubeWidth * 0.85;
    const verticalAllowance =
      cubeHeight * Math.min(0.9, Math.max(0.35, textSize + 0.4));
    let labelScale = 1;
    if (labelAsset && labelAsset.width > 0 && labelAsset.height > 0) {
      labelScale = Math.min(
        textMaxWidth / labelAsset.width,
        verticalAllowance / labelAsset.height
      );
    }

    if (labelAsset) {
      const labelColor = new Color(finalTextHex);
      textFaces.forEach(({ position, rotation }) => {
        const labelMaterial = new MeshBasicMaterial({
          color: labelColor,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -0.5,
          polygonOffsetUnits: -0.5,
          toneMapped: false,
          side: DoubleSide,
        });
        const labelMesh = new Mesh(labelAsset.geometry, labelMaterial);
        labelMesh.position.copy(position);
        labelMesh.rotation.set(rotation.x, rotation.y, rotation.z, "XYZ");
        labelMesh.scale.set(labelScale, labelScale, 1);
        labelMesh.renderOrder = 2;
        cubeGroup.add(labelMesh);
        labelMeshes.push(labelMesh);
      });
    }

    state.cubes.push({
      group: cubeGroup,
      boxMaterial,
      edge: outline,
      labelMeshes,
      currentRotation: { x: 0, y: 0, z: 0 },
      currentScale: 1,
    });
  });

  state.rotations = buildRotationsArray(texts.length);
  state.dragRotations = Array.from({ length: texts.length }, () => 0);
  state.scaleTarget = 1;
  state.syncedOnce = false;
};

const updateCamera = () => {
  if (!state.camera || !state.config) return;
  state.camera.fov = state.config.cameraFov;
  state.camera.position.fromArray(state.config.cameraPosition);
  state.camera.up.copy(up);
  state.camera.lookAt(0, 0, 0);
  state.camera.updateProjectionMatrix();
};

const updateFrame = () => {
  if (!state.renderer || !state.scene || !state.camera) return;
  let maxDelta = 0;
  const hasCubes = state.cubes.length > 0;
  if (hasCubes) {
    const smoothingFactor = smoothing;
    state.cubes.forEach((cube, index) => {
      const target = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
      const drag = state.dragRotations[index] ?? 0;
      const current = cube.currentRotation;
      if (!state.syncedOnce) {
        current.x = target.x;
        current.y = target.y + drag;
        current.z = target.z;
        cube.currentScale = state.scaleTarget;
      } else {
        current.x += (target.x - current.x) * smoothingFactor;
        current.y += (target.y + drag - current.y) * smoothingFactor;
        current.z += (target.z - current.z) * smoothingFactor;
        cube.currentScale +=
          (state.scaleTarget - cube.currentScale) * smoothingFactor;
      }
      const deltaX = Math.abs(target.x - current.x);
      const deltaY = Math.abs(target.y + drag - current.y);
      const deltaZ = Math.abs(target.z - current.z);
      const deltaScale = Math.abs(state.scaleTarget - cube.currentScale);
      maxDelta = Math.max(maxDelta, deltaX, deltaY, deltaZ, deltaScale);
      cube.group.rotation.set(current.x, current.y, current.z);
      cube.group.scale.setScalar(cube.currentScale);
    });
    state.syncedOnce = true;
  }
  state.renderer.render(state.scene, state.camera);
  if (!hasCubes) {
    stopAnimationLoop();
    return;
  }
  if (maxDelta < MOTION_EPSILON) {
    state.idleFrames += 1;
  } else {
    state.idleFrames = 0;
  }
  const idleThreshold = state.isVisible
    ? IDLE_FRAMES_BEFORE_PAUSE
    : Math.min(10, IDLE_FRAMES_BEFORE_PAUSE);
  if (state.idleFrames >= idleThreshold) {
    stopAnimationLoop();
  }
};

const handleTargets = (message: TargetsMessage) => {
  const { rotations, dragRotations, scale } = message;
  state.scaleTarget = scale;
  if (rotations.length !== state.rotations.length) {
    state.rotations = rotations.map((rotation) => ({ ...rotation }));
    state.dragRotations = dragRotations.slice();
    state.syncedOnce = false;
    return;
  }
  rotations.forEach((rotation, index) => {
    state.rotations[index] = { ...rotation };
  });
  if (dragRotations.length === state.dragRotations.length) {
    dragRotations.forEach((value, index) => {
      state.dragRotations[index] = value;
    });
  } else {
    state.dragRotations = dragRotations.slice();
  }
  if (!state.syncedOnce && state.cubes.length === rotations.length) {
    state.cubes.forEach((cube, index) => {
      const target = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
      const drag = state.dragRotations[index] ?? 0;
      cube.currentRotation.x = target.x;
      cube.currentRotation.y = target.y + drag;
      cube.currentRotation.z = target.z;
      cube.currentScale = scale;
      cube.group.rotation.set(
        cube.currentRotation.x,
        cube.currentRotation.y,
        cube.currentRotation.z
      );
      cube.group.scale.setScalar(scale);
    });
  }
  if (state.isVisible) {
    startAnimationLoop();
  } else {
    stopAnimationLoop();
    snapSceneToTargets();
    renderOnce();
  }
};

const dispose = () => {
  if (state.renderer) {
    state.renderer.setAnimationLoop(null);
    state.renderer.dispose();
  }
  clearCubes();
  state.renderer = null;
  state.scene = null;
  state.camera = null;
  state.config = null;
  state.rotations = [];
  state.dragRotations = [];
  state.scaleTarget = 1;
  state.syncedOnce = false;
  state.isAnimating = false;
  state.idleFrames = 0;
};

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init": {
      state.config = message.config;
      if (
        !state.config.colors ||
        !Array.isArray(state.config.colors) ||
        state.config.colors.length === 0
      ) {
        state.config.colors = ["#FFFFFF"];
      }
      ensureRenderer(message.canvas, message.dimensions);
      updateCamera();
      rebuildCubes();
      handleResize(message.dimensions);
      if (state.renderer && state.scene && state.camera) {
        state.renderer.render(state.scene, state.camera);
      }
      if (state.isVisible) {
        startAnimationLoop();
      }
      break;
    }
    case "config": {
      if (!state.renderer) return;
      state.config = message.config;
      updateCamera();
      rebuildCubes();
      break;
    }
    case "targets": {
      if (!state.renderer) return;
      handleTargets(message);
      break;
    }
    case "resize": {
      if (!state.renderer) return;
      handleResize({
        width: message.width,
        height: message.height,
        dpr: message.dpr,
      });
      break;
    }
    case "visibility": {
      state.isVisible = message.isVisible;
      if (state.isVisible) {
        startAnimationLoop();
      } else {
        stopAnimationLoop();
        snapSceneToTargets();
        renderOnce();
      }
      break;
    }
    case "dispose": {
      dispose();
      break;
    }
    default:
      break;
  }
};
