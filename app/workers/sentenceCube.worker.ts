import {
  Color,
  CylinderGeometry,
  DoubleSide,
  EdgesGeometry,
  Group,
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

type Rotation = { x: number; y: number; z: number };

type SentenceCubeConfig = {
  columns: { faces: string[] }[];
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
  config: SentenceCubeConfig;
  dimensions: Dimensions;
};

type ConfigMessage = { type: "config"; config: SentenceCubeConfig };

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

type ColumnInstance = {
  group: Group;
  bodyGeometry: CylinderGeometry;
  bodyMaterial: MeshBasicMaterial;
  outline?: {
    line: LineSegments2;
    material: LineMaterial;
    geometry: LineSegmentsGeometry;
  };
  labelMeshes: Mesh[];
  currentRotation: Rotation;
  currentScale: number;
  faceCount: number;
  faceOffset: number;
  angleStep: number;
};

const MIN_FACE_COUNT = 3;
const TEXT_FACE_INSET = -0.01;
const MOTION_EPSILON = 0.00035;
const IDLE_FRAMES_BEFORE_PAUSE = 45;
const up = new Vector3(0, 1, 0);

const state = {
  config: null as SentenceCubeConfig | null,
  renderer: null as WebGLRenderer | null,
  camera: null as PerspectiveCamera | null,
  scene: null as Scene | null,
  columns: [] as ColumnInstance[],
  rotations: [] as Rotation[],
  dragRotations: [] as number[],
  scaleTarget: 1,
  syncedOnce: false,
  dimensions: null as Dimensions | null,
  isVisible: false,
  isAnimating: false,
  idleFrames: 0,
};

const buildRotationsArray = (length: number) =>
  Array.from({ length }, () => ({ x: 0, y: 0, z: 0 }));

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
  if (!state.scene || state.columns.length === 0) return;
  state.columns.forEach((column, index) => {
    const rotation = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
    const drag = state.dragRotations[index] ?? 0;
    column.currentRotation.x = rotation.x + drag;
    column.currentRotation.y = rotation.y;
    column.currentRotation.z = rotation.z;
    column.currentScale = state.scaleTarget;
    const rotationX = column.currentRotation.x + column.faceOffset;
    column.group.rotation.set(
      rotationX,
      column.currentRotation.y,
      column.currentRotation.z
    );
    column.group.scale.setScalar(column.currentScale);
  });
  state.syncedOnce = true;
};

const clearColumns = () => {
  state.columns.forEach((column) => {
    column.labelMeshes.forEach((mesh) => {
      const material = mesh.material;
      if (Array.isArray(material)) {
        material.forEach((item) => item.dispose());
      } else {
        material.dispose();
      }
    });
    column.bodyGeometry.dispose();
    column.bodyMaterial.dispose();
    if (column.outline) {
      column.outline.material.dispose();
      column.outline.geometry.dispose();
    }
    state.scene?.remove(column.group);
  });
  state.columns = [];
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
  state.columns.forEach((column) => {
    if (column.outline?.material) {
      column.outline.material.resolution.copy(resolution);
    }
  });
};

const computeLabelSlug = (text: string) =>
  cubeLabelSlugMap.get(text) ?? cubeLabelSlugify(text);

const getFaceDistance = (radius: number, faceCount: number) =>
  faceCount > 0 ? radius * Math.cos(Math.PI / faceCount) : radius;

const buildReelGeometry = (
  faces: number,
  radius: number,
  length: number
): CylinderGeometry => {
  const geometry = new CylinderGeometry(
    radius,
    radius,
    length,
    faces,
    1,
    false
  );
  geometry.rotateZ(Math.PI / 2);
  return geometry;
};

const buildOutline = (
  geometry: EdgesGeometry,
  colorHex: string,
  lineWidth: number
) => {
  const lineSegmentsGeometry = new LineSegmentsGeometry();
  const positionAttribute = geometry.attributes.position;
  const positions: number[] = [];
  for (let i = 0; i < positionAttribute.count; i += 1) {
    positions.push(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );
  }
  lineSegmentsGeometry.setPositions(positions);
  const outlineColor = new Color(colorHex);
  const resolution = state.dimensions
    ? new Vector2(
        state.dimensions.width * state.dimensions.dpr,
        state.dimensions.height * state.dimensions.dpr
      )
    : new Vector2(1, 1);
  const lineMaterial = new LineMaterial({
    color: outlineColor.getHex(),
    linewidth: lineWidth,
    resolution,
    depthTest: true,
    depthWrite: false,
  });
  const outlineLine = new LineSegments2(lineSegmentsGeometry, lineMaterial);
  outlineLine.renderOrder = 1;
  return {
    line: outlineLine,
    material: lineMaterial,
    geometry: lineSegmentsGeometry,
  };
};

const rebuildColumns = () => {
  if (!state.scene || !state.config) return;
  clearColumns();
  const {
    columns,
    size,
    heightRatio,
    widthRatio,
    colors,
    textColor,
    textSize,
    spacing,
    maxWidth,
    fillMode,
    strokeWidth,
    matchTextColor,
  } = state.config;
  if (!columns.length) {
    state.rotations = [];
    state.dragRotations = [];
    state.scaleTarget = 1;
    state.syncedOnce = false;
    return;
  }
  const reelRadius = Math.max(size * heightRatio * 0.5, size * 0.35);
  const reelLength = Math.max(size * widthRatio, size * 0.75);
  const spacingUnits = spacing * reelLength;
  const totalWidth =
    columns.length * reelLength +
    Math.max(columns.length - 1, 0) * spacingUnits;
  const startX = -totalWidth / 2 + reelLength / 2;

  const faceDistances = columns.map((column) =>
    getFaceDistance(
      reelRadius,
      Math.max(column.faces?.length ?? 0, MIN_FACE_COUNT)
    )
  );

  columns.forEach((column, index) => {
    const faces = column.faces ?? [];
    const faceCount = Math.max(faces.length, MIN_FACE_COUNT);
    const faceDistance = faceDistances[index];
    const angleStep = (Math.PI * 2) / faceCount;
    const faceOffset = angleStep * 0.5;
    const colorValue = colors[index % colors.length] ?? "#FFFFFF";
    const colorHex =
      (typeof colorValue === "string" ? colorValue.trim() : "#FFFFFF") ||
      "#FFFFFF";

    const columnGroup = new Group();
    columnGroup.position.set(
      startX + index * (reelLength + spacingUnits),
      0,
      0
    );
    state.scene?.add(columnGroup);

    const bodyGeometry = buildReelGeometry(faceCount, reelRadius, reelLength);
    const bodyMaterial = new MeshBasicMaterial({
      color: new Color(fillMode === "outline" ? "#000000" : colorHex),
      depthWrite: true,
      polygonOffset: true,
      polygonOffsetFactor: 1.5,
      polygonOffsetUnits: 1.5,
      toneMapped: false,
    });

    const bodyMesh = new Mesh(bodyGeometry, bodyMaterial);
    bodyMesh.renderOrder = 0;
    columnGroup.add(bodyMesh);

    let outline: ColumnInstance["outline"];
    if (fillMode === "outline") {
      const scaledGeometry = bodyGeometry.clone().scale(1.01, 1.01, 1.01);
      const edgesGeometry = new EdgesGeometry(scaledGeometry);
      scaledGeometry.dispose();
      outline = buildOutline(edgesGeometry, colorHex, strokeWidth ?? 3);
      edgesGeometry.dispose();
      if (outline) {
        outline.line.renderOrder = 1;
        columnGroup.add(outline.line);
      }
    }

    const labelMeshes: Mesh[] = [];
    faces.forEach((text, faceIndex) => {
      const slug = computeLabelSlug(text);
      const asset = slug ? getCubeLabelAsset(slug) : null;
      if (!asset) {
        return;
      }
      const normalizedTextSize = Math.max(textSize, 0.1);
      const faceWidth = reelLength * 0.95 * normalizedTextSize;
      const baseVerticalAllowance = faceDistance * 1.9 * normalizedTextSize;
      const isMultiLine = asset.height > baseVerticalAllowance * 1.5;
      const verticalAllowance = isMultiLine
        ? Math.max(baseVerticalAllowance * 2.5, asset.height * 1.1)
        : baseVerticalAllowance;
      let labelScale = 1;
      if (asset.width > 0 && asset.height > 0) {
        labelScale = Math.min(
          (maxWidth ?? faceWidth * 0.9) / asset.width,
          verticalAllowance / asset.height
        );
      }
      const labelMaterialColor = matchTextColor ? colorHex : textColor;
      const labelMaterial = new MeshBasicMaterial({
        color: new Color(labelMaterialColor),
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -0.5,
        polygonOffsetUnits: -0.5,
        toneMapped: false,
        side: DoubleSide,
      });
      const labelMesh = new Mesh(asset.geometry, labelMaterial);
      const angle = faceIndex * angleStep + faceOffset;
      const labelOffset = Math.max(faceDistance - TEXT_FACE_INSET, 0);
      const y = Math.sin(angle) * labelOffset;
      const z = Math.cos(angle) * labelOffset;
      labelMesh.position.set(0, y, z);
      labelMesh.rotation.set(-angle, 0, 0, "XYZ");
      labelMesh.scale.set(labelScale, labelScale, 1);
      labelMesh.renderOrder = 2;
      columnGroup.add(labelMesh);
      labelMeshes.push(labelMesh);
    });

    state.columns.push({
      group: columnGroup,
      bodyGeometry,
      bodyMaterial,
      outline,
      labelMeshes,
      currentRotation: { x: 0, y: 0, z: 0 },
      currentScale: 1,
      faceCount,
      faceOffset,
      angleStep,
    });
  });

  state.rotations = buildRotationsArray(columns.length);
  state.dragRotations = Array.from({ length: columns.length }, () => 0);
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
  const hasColumns = state.columns.length > 0;
  if (hasColumns) {
    const smoothing = 0.12;
    state.columns.forEach((column, index) => {
      const target = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
      const drag = state.dragRotations[index] ?? 0;
      const current = column.currentRotation;
      if (!state.syncedOnce) {
        current.x = target.x + drag;
        current.y = target.y;
        current.z = target.z;
        column.currentScale = state.scaleTarget;
      } else {
        current.x += (target.x + drag - current.x) * smoothing;
        current.y += (target.y - current.y) * smoothing;
        current.z += (target.z - current.z) * smoothing;
        column.currentScale +=
          (state.scaleTarget - column.currentScale) * smoothing;
      }
      const deltaX = Math.abs(target.x + drag - current.x);
      const deltaY = Math.abs(target.y - current.y);
      const deltaZ = Math.abs(target.z - current.z);
      const deltaScale = Math.abs(state.scaleTarget - column.currentScale);
      maxDelta = Math.max(maxDelta, deltaX, deltaY, deltaZ, deltaScale);
      const rotationX = current.x + column.faceOffset;
      column.group.rotation.set(rotationX, current.y, current.z);
      column.group.scale.setScalar(column.currentScale);
    });
    state.syncedOnce = true;
  }
  state.renderer.render(state.scene, state.camera);
  if (!hasColumns) {
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
  if (!state.syncedOnce && state.columns.length === rotations.length) {
    state.columns.forEach((column, index) => {
      const target = state.rotations[index] ?? { x: 0, y: 0, z: 0 };
      const drag = state.dragRotations[index] ?? 0;
      column.currentRotation.x = target.x + drag;
      column.currentRotation.y = target.y;
      column.currentRotation.z = target.z;
      column.currentScale = scale;
      const rotationX = column.currentRotation.x + column.faceOffset;
      column.group.rotation.set(
        rotationX,
        column.currentRotation.y,
        column.currentRotation.z
      );
      column.group.scale.setScalar(scale);
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
  clearColumns();
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
      ensureRenderer(message.canvas, message.dimensions);
      updateCamera();
      rebuildColumns();
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
      const prevConfig = state.config;
      state.config = message.config;
      const cameraChanged =
        !prevConfig ||
        prevConfig.cameraFov !== message.config.cameraFov ||
        prevConfig.cameraPosition[0] !== message.config.cameraPosition[0] ||
        prevConfig.cameraPosition[1] !== message.config.cameraPosition[1] ||
        prevConfig.cameraPosition[2] !== message.config.cameraPosition[2];
      const columnsChanged =
        !prevConfig ||
        JSON.stringify(prevConfig.columns) !==
          JSON.stringify(message.config.columns);
      if (columnsChanged) {
        rebuildColumns();
      }
      if (cameraChanged) {
        updateCamera();
      }
      renderOnce();
      if (state.isVisible) {
        startAnimationLoop();
      }
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
