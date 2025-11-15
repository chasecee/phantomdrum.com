import {
  Color,
  DoubleSide,
  EdgesGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { getCylinderGeometry } from "@/app/lib/three/geometryCache";
import {
  getCubeLabelAsset,
  type LabelGeometryAsset,
} from "@/app/lib/three/labelGeometry";
import { cubeLabelSlugMap, cubeLabelSlugify } from "@/config/cubeLabels";

type Rotation = { x: number; y: number; z: number };

type PolyColumnConfig = {
  texts: string[];
  radius: number;
  height: number;
  bodyColor: string;
  edgeColor: string;
  textSize: number;
  strokeWidth: number;
  labelRotation: number;
  fitVertical: boolean;
  verticalPadding: number;
  cameraPosition: [number, number, number];
  cameraFov: number;
};

type Dimensions = { width: number; height: number; dpr: number };

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  config: PolyColumnConfig;
  dimensions: Dimensions;
};

type ConfigMessage = {
  type: "config";
  config: PolyColumnConfig;
};

type TargetsMessage = {
  type: "targets";
  rotation: Rotation;
  scale: number;
  drag: number;
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
  bodyMaterial: MeshBasicMaterial;
  edge?: {
    line: LineSegments2;
    material: LineMaterial;
    geometry: LineSegmentsGeometry;
  };
  labelMaterials: MeshBasicMaterial[];
  labelGroups: Group[];
};

const state = {
  config: null as PolyColumnConfig | null,
  renderer: null as WebGLRenderer | null,
  camera: null as PerspectiveCamera | null,
  scene: null as Scene | null,
  column: null as ColumnInstance | null,
  currentRotation: { x: 0, y: 0, z: 0 } as Rotation,
  targetRotation: { x: 0, y: 0, z: 0 } as Rotation,
  currentScale: 1,
  targetScale: 1,
  dragRotation: 0,
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

const snapColumnToTargets = () => {
  if (!state.column) return;
  const group = state.column.group;
  state.currentRotation = {
    x: state.targetRotation.x,
    y: state.targetRotation.y + state.dragRotation,
    z: state.targetRotation.z,
  };
  state.currentScale = state.targetScale;
  group.rotation.set(
    state.currentRotation.x,
    state.currentRotation.y,
    state.currentRotation.z
  );
  group.scale.setScalar(state.currentScale);
  state.syncedOnce = true;
};

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

const disposeColumn = () => {
  if (!state.column || !state.scene) return;
  state.column.labelMaterials.forEach((material) => material.dispose());
  if (state.column.edge) {
    state.column.edge.material.dispose();
    state.column.edge.geometry.dispose();
  }
  state.column.bodyMaterial.dispose();
  state.column.labelGroups.forEach((group) => {
    state.scene?.remove(group);
  });
  state.scene.remove(state.column.group);
  state.column = null;
};

const computeLabelScale = (
  label: LabelGeometryAsset | null,
  width: number,
  height: number,
  textSize: number,
  labelRotation: number,
  fitVertical: boolean,
  verticalPadding: number,
  segments: number,
  radius: number,
  columnHeight: number
) => {
  if (!label || label.width <= 0 || label.height <= 0 || segments <= 0) {
    return { scale: 1, textMaxWidth: 0, apothem: radius };
  }
  const angleStep = (Math.PI * 2) / segments;
  const apothem = radius * Math.cos(Math.PI / Math.max(segments, 3));
  const faceWidth = segments > 0 ? 2 * apothem * Math.tan(angleStep / 2) : 0;
  const textMaxWidth = faceWidth * (fitVertical ? 0.95 : 0.85);
  const resolvedPadding = Math.min(Math.max(verticalPadding, 0), 0.5);
  const verticalAllowance = fitVertical
    ? columnHeight * Math.max(0.1, 1 - resolvedPadding)
    : columnHeight * Math.max(0.25, Math.min(0.65, textSize));
  const cos = Math.cos(labelRotation);
  const sin = Math.sin(labelRotation);
  const rotatedWidth =
    Math.abs(label.width * cos) + Math.abs(label.height * sin);
  const rotatedHeight =
    Math.abs(label.width * sin) + Math.abs(label.height * cos);
  const scale = Math.min(
    textMaxWidth / Math.max(rotatedWidth, Number.EPSILON),
    verticalAllowance / Math.max(rotatedHeight, Number.EPSILON)
  );
  return { scale, textMaxWidth, apothem };
};

const rebuildColumn = () => {
  if (!state.scene || !state.config) return;
  disposeColumn();
  const config = state.config;
  const segments = config.texts.length;
  if (segments === 0) {
    state.column = null;
    return;
  }
  const geometry = getCylinderGeometry(config.radius, config.height, segments);
  const columnGroup = new Group();
  const bodyMaterial = new MeshBasicMaterial({
    color: new Color(config.bodyColor),
    depthWrite: true,
  });
  const cylinder = new Mesh(geometry, bodyMaterial);
  cylinder.renderOrder = 0;
  columnGroup.add(cylinder);
  
  const scaledGeometry = geometry.clone().scale(1.0025, 1.0025, 1.0025);
  const edgesGeometry = new EdgesGeometry(scaledGeometry);
  const lineSegmentsGeometry = edgesGeometryToLineSegmentsGeometry(edgesGeometry);
  edgesGeometry.dispose();
  scaledGeometry.dispose();
  
  const edgeColor = new Color(config.edgeColor);
  const lineWidth = config.strokeWidth;
  const resolution = state.dimensions
    ? new Vector2(
        state.dimensions.width * state.dimensions.dpr,
        state.dimensions.height * state.dimensions.dpr
      )
    : new Vector2(1, 1);
  const edgeMaterial = new LineMaterial({
    color: edgeColor.getHex(),
    linewidth: lineWidth,
    resolution,
    depthTest: true,
    depthWrite: false,
  });
  const edges = new LineSegments2(lineSegmentsGeometry, edgeMaterial);
  edges.renderOrder = 1;
  columnGroup.add(edges);
  const labelMaterials: MeshBasicMaterial[] = [];
  const labelGroups: Group[] = [];
  const angleStep = segments > 0 ? (Math.PI * 2) / segments : 0;
  const apothem = config.radius * Math.cos(Math.PI / Math.max(segments, 3));
  const textOffset = apothem * 0.01;
  config.texts.forEach((text, index) => {
    const slug = text
      ? cubeLabelSlugMap.get(text) ?? cubeLabelSlugify(text)
      : null;
    if (!slug) return;
    const labelAsset = getCubeLabelAsset(slug);
    if (!labelAsset) return;
    const { scale } = computeLabelScale(
      labelAsset,
      config.radius,
      config.height,
      config.textSize,
      config.labelRotation,
      config.fitVertical,
      config.verticalPadding,
      segments,
      config.radius,
      config.height
    );
    const material = new MeshBasicMaterial({
      color: new Color(config.edgeColor),
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -0.5,
      polygonOffsetUnits: -0.5,
      toneMapped: false,
      side: DoubleSide,
    });
    const mesh = new Mesh(labelAsset.geometry, material);
    mesh.position.set(0, 0, apothem + textOffset);
    mesh.scale.set(scale, scale, 1);
    mesh.rotation.set(0, 0, config.labelRotation);
    mesh.renderOrder = 2;
    const faceGroup = new Group();
    faceGroup.rotation.set(0, index * angleStep, 0);
    faceGroup.add(mesh);
    columnGroup.add(faceGroup);
    labelMaterials.push(material);
    labelGroups.push(faceGroup);
  });
  state.scene.add(columnGroup);
  state.column = {
    group: columnGroup,
    bodyMaterial,
    edge: {
      line: edges,
      material: edgeMaterial,
      geometry: lineSegmentsGeometry,
    },
    labelMaterials,
    labelGroups,
  };
  state.currentRotation = { x: 0, y: 0, z: 0 };
  state.targetRotation = { x: 0, y: 0, z: 0 };
  state.currentScale = 1;
  state.targetScale = 1;
  state.dragRotation = 0;
  state.syncedOnce = false;
};

const ensureScene = () => {
  if (!state.scene) {
    state.scene = new Scene();
  }
  if (!state.camera) {
    state.camera = new PerspectiveCamera(18, 1, 0.1, 1000);
  }
};

const ensureRenderer = (canvas: OffscreenCanvas, dimensions: Dimensions) => {
  if (state.renderer) return;
  ensureScene();
  if (!state.scene || !state.camera) return;
  state.dimensions = { ...dimensions };
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    depth: true,
    powerPreference: "high-performance",
    stencil: false,
  });
  renderer.setPixelRatio(dimensions.dpr);
  renderer.setSize(dimensions.width, dimensions.height, false);
  renderer.setClearColor(0x000000, 0);
  state.renderer = renderer;
};

const updateCamera = () => {
  if (!state.camera || !state.config) return;
  state.camera.fov = state.config.cameraFov;
  state.camera.position.fromArray(state.config.cameraPosition);
  state.camera.up.copy(up);
  state.camera.lookAt(0, 0, 0);
  state.camera.updateProjectionMatrix();
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
  const resolution = new Vector2(
    dimensions.width * dimensions.dpr,
    dimensions.height * dimensions.dpr
  );
  if (state.column?.edge?.material) {
    state.column.edge.material.resolution.copy(resolution);
  }
};

const updateFrame = () => {
  if (!state.renderer || !state.scene || !state.camera) return;
  let maxDelta = 0;
  if (state.column) {
    const group = state.column.group;
    if (!state.syncedOnce) {
      state.currentRotation = {
        x: state.targetRotation.x,
        y: state.targetRotation.y + state.dragRotation,
        z: state.targetRotation.z,
      };
      state.currentScale = state.targetScale;
      state.syncedOnce = true;
    } else {
      state.currentRotation.x +=
        (state.targetRotation.x - state.currentRotation.x) * smoothing;
      const targetY = state.targetRotation.y + state.dragRotation;
      state.currentRotation.y +=
        (targetY - state.currentRotation.y) * smoothing;
      state.currentRotation.z +=
        (state.targetRotation.z - state.currentRotation.z) * smoothing;
      state.currentScale +=
        (state.targetScale - state.currentScale) * smoothing;
    }
    const rotationYTarget = state.targetRotation.y + state.dragRotation;
    const deltaX = Math.abs(state.targetRotation.x - state.currentRotation.x);
    const deltaY = Math.abs(rotationYTarget - state.currentRotation.y);
    const deltaZ = Math.abs(state.targetRotation.z - state.currentRotation.z);
    const deltaScale = Math.abs(state.targetScale - state.currentScale);
    maxDelta = Math.max(deltaX, deltaY, deltaZ, deltaScale);
    group.rotation.set(
      state.currentRotation.x,
      state.currentRotation.y,
      state.currentRotation.z
    );
    group.scale.setScalar(state.currentScale);
  }
  state.renderer.render(state.scene, state.camera);
  if (!state.column) {
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

const dispose = () => {
  disposeColumn();
  if (state.renderer) {
    state.renderer.setAnimationLoop(null);
    state.renderer.dispose();
  }
  state.renderer = null;
  state.camera = null;
  state.scene = null;
  state.currentRotation = { x: 0, y: 0, z: 0 };
  state.targetRotation = { x: 0, y: 0, z: 0 };
  state.currentScale = 1;
  state.targetScale = 1;
  state.dragRotation = 0;
  state.syncedOnce = false;
  state.config = null;
  state.isVisible = false;
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
      rebuildColumn();
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
      rebuildColumn();
      if (state.isVisible) {
        startAnimationLoop();
      } else {
        snapColumnToTargets();
        renderOnce();
      }
      break;
    }
    case "targets": {
      if (!state.renderer) return;
      state.targetRotation = { ...message.rotation };
      state.targetScale = message.scale;
      state.dragRotation = message.drag;
      if (!state.syncedOnce) {
        state.currentRotation = {
          x: state.targetRotation.x,
          y: state.targetRotation.y + state.dragRotation,
          z: state.targetRotation.z,
        };
        state.currentScale = state.targetScale;
        if (state.column) {
          state.column.group.rotation.set(
            state.currentRotation.x,
            state.currentRotation.y,
            state.currentRotation.z
          );
          state.column.group.scale.setScalar(state.currentScale);
        }
      }
      if (state.isVisible) {
        startAnimationLoop();
      } else {
        stopAnimationLoop();
        snapColumnToTargets();
        renderOnce();
      }
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
        snapColumnToTargets();
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
