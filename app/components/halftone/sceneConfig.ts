import type { HalftoneSceneConfig } from "./types";

export const experienceHalftoneSceneConfig: HalftoneSceneConfig = {
  aspectRatio: 1,
  width: {
    min: 320,
    max: 1280,
    viewportRatio: 1,
  },
  scroll: {
    start: "30% 60%",
    end: "60% 10%",
    scrub: true,
    markers: process.env.NODE_ENV === "development" ? true : false,
  },
  baseLayerIndex: 1,
  layers: [
    {
      id: "planet",
      imageSrc: "/img/optimized/planet-cropped.webp",
      imageFit: "contain",
      className: "",
      padding: 0.1,
      params: {
        initial: {
          halftoneSize: "6%",
          dotSpacing: "0.2%",
          rgbOffset: "0%",
          rgbOffsetAngle: 0,
          effectIntensity: 0.2,
          patternRotation: 55,
          zoom: 1.2,
          brightness: 1,
          contrast: 1,
          translateY: "0%",
        },
        target: {
          halftoneSize: "4%",
          dotSpacing: "0.1%",
          rgbOffset: "5%",
          rgbOffsetAngle: 0,
          effectIntensity: 0.35,
          patternRotation: 40,
          zoom: 0.8,
          brightness: 1,
          contrast: 1,
          translateY: "0%",
        },
      },
    },
  ],
};
