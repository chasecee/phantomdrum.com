import {
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
  Vector3,
  WebGLRenderer,
} from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { DotScreenShader } from "three/examples/jsm/shaders/DotScreenShader.js";
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

type WorkerMessage =
  | InitMessage
  | ConfigMessage
  | TargetsMessage
  | ResizeMessage
  | DisposeMessage;

type ColumnInstance = {
  group: Group;
  bodyMaterial: MeshBasicMaterial;
  edgeLine?: LineSegments;
  edgeMaterial?: LineBasicMaterial;
  edgeGeometry?: EdgesGeometry;
  labelMaterials: MeshBasicMaterial[];
  labelGroups: Group[];
};

const state = {
  config: null as PolyColumnConfig | null,
  renderer: null as WebGLRenderer | null,
  composer: null as EffectComposer | null,
  camera: null as PerspectiveCamera | null,
  scene: null as Scene | null,
  column: null as ColumnInstance | null,
  currentRotation: { x: 0, y: 0, z: 0 } as Rotation,
  targetRotation: { x: 0, y: 0, z: 0 } as Rotation,
  currentScale: 1,
  targetScale: 1,
  dragRotation: 0,
  syncedOnce: false,
};

const smoothing = 0.1;
const up = new Vector3(0, 1, 0);

const disposeColumn = () => {
  if (!state.column || !state.scene) return;
  state.column.labelMaterials.forEach((material) => material.dispose());
  if (state.column.edgeMaterial) {
    state.column.edgeMaterial.dispose();
  }
  if (state.column.edgeGeometry) {
    state.column.edgeGeometry.dispose();
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
  const faceWidth =
    segments > 0 ? 2 * apothem * Math.tan(angleStep / 2) : 0;
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
  const edgesGeometry = new EdgesGeometry(geometry);
  const edgeMaterial = new LineBasicMaterial({
    color: new Color(config.edgeColor),
    depthTest: true,
    depthWrite: false,
  });
  edgeMaterial.linewidth = config.strokeWidth;
  const edges = new LineSegments(edgesGeometry, edgeMaterial);
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
    edgeLine: edges,
    edgeMaterial,
    edgeGeometry: edgesGeometry,
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
  const composer = new EffectComposer(renderer);
  composer.setPixelRatio(dimensions.dpr);
  composer.setSize(
    Math.max(dimensions.width * dimensions.dpr, 1),
    Math.max(dimensions.height * dimensions.dpr, 1)
  );
  composer.addPass(new RenderPass(state.scene, state.camera));
  const dotScreen = new ShaderPass(DotScreenShader);
  dotScreen.uniforms["scale"].value = 2.5;
  dotScreen.uniforms["angle"].value = Math.PI / 12;
  composer.addPass(dotScreen);
  state.renderer = renderer;
  state.composer = composer;
  renderer.setAnimationLoop(updateFrame);
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
  if (!state.renderer || !state.camera || !state.composer) return;
  const aspect =
    dimensions.height > 0 ? dimensions.width / dimensions.height : 1;
  state.renderer.setPixelRatio(dimensions.dpr);
  state.renderer.setSize(dimensions.width, dimensions.height, false);
  state.composer.setPixelRatio(dimensions.dpr);
  state.composer.setSize(
    Math.max(dimensions.width * dimensions.dpr, 1),
    Math.max(dimensions.height * dimensions.dpr, 1)
  );
  state.camera.aspect = aspect;
  state.camera.updateProjectionMatrix();
};

const updateFrame = () => {
  if (!state.composer || !state.column) {
    state.composer?.render();
    return;
  }
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
  group.rotation.set(
    state.currentRotation.x,
    state.currentRotation.y,
    state.currentRotation.z
  );
  group.scale.setScalar(state.currentScale);
  state.composer.render();
};

const dispose = () => {
  disposeColumn();
  if (state.renderer) {
    state.renderer.setAnimationLoop(null);
    state.renderer.dispose();
  }
  state.composer?.dispose();
  state.renderer = null;
  state.composer = null;
  state.camera = null;
  state.scene = null;
  state.currentRotation = { x: 0, y: 0, z: 0 };
  state.targetRotation = { x: 0, y: 0, z: 0 };
  state.currentScale = 1;
  state.targetScale = 1;
  state.dragRotation = 0;
  state.syncedOnce = false;
  state.config = null;
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
      if (state.composer) {
        state.composer.render();
      }
      break;
    }
    case "config": {
      if (!state.renderer) return;
      state.config = message.config;
      updateCamera();
      rebuildColumn();
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
    case "dispose": {
      dispose();
      break;
    }
    default:
      break;
  }
};


