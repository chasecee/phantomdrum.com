import {
  HalftoneRendererCore,
  type HalftoneRendererConfig,
  type HalftoneRendererParams,
} from "../halftone-webgl/scroll-section/HalftoneRendererCore";

type InitMessage = {
  type: "init";
  canvas: OffscreenCanvas;
  config: {
    width: number;
    height: number;
    dpr: number;
    imageSrc: string;
    fitMode: "cover" | "contain";
    padding: number;
  };
  params: HalftoneParams;
};

type ParamsMessage = {
  type: "params";
  params: HalftoneParams;
};

type ImageMessage = {
  type: "image";
  imageSrc: string;
  fitMode: "cover" | "contain";
};

type ResizeMessage = {
  type: "resize";
  width: number;
  height: number;
  dpr: number;
  padding: number;
};

type VisibilityMessage = {
  type: "visibility";
  isVisible: boolean;
};

type DisposeMessage = { type: "dispose" };

type WorkerMessage =
  | InitMessage
  | ParamsMessage
  | ImageMessage
  | ResizeMessage
  | VisibilityMessage
  | DisposeMessage;

type HalftoneParams = HalftoneRendererParams;

let renderer: HalftoneRendererCore | null = null;

const withRenderer = <T>(callback: (instance: HalftoneRendererCore) => T) => {
  if (!renderer) return;
  return callback(renderer);
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const message = event.data;
  switch (message.type) {
    case "init": {
      renderer?.dispose();
      renderer = new HalftoneRendererCore(message.canvas);
      const config: HalftoneRendererConfig = {
        width: message.config.width,
        height: message.config.height,
        dpr: message.config.dpr,
        imageSrc: message.config.imageSrc,
        fitMode: message.config.fitMode ?? "cover",
        padding: message.config.padding ?? 0,
      };
      await renderer.init(config, message.params);
      break;
    }
    case "params": {
      withRenderer((instance) => instance.updateParams(message.params));
      break;
    }
    case "image": {
      await withRenderer((instance) =>
        instance.updateImage(message.imageSrc, message.fitMode)
      );
      break;
    }
    case "resize": {
      withRenderer((instance) =>
        instance.resize(
          message.width,
          message.height,
          message.dpr,
          message.padding ?? 0
        )
      );
      break;
    }
    case "visibility": {
      withRenderer((instance) => instance.setVisibility(message.isVisible));
      break;
    }
    case "dispose": {
      renderer?.dispose();
      renderer = null;
      break;
    }
    default:
      break;
  }
};
