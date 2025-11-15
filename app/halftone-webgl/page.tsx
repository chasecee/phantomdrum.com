import { CanvasHalftoneWebGL } from "../canvas/CanvasHalftoneWebGL";
import { HalftoneScrollSection } from "./HalftoneScrollSection";

export default function HalftoneWebGLDemoPage() {
  return (
    <div className="w-full min-h-[200svh] relative flex flex-col gap-16 bg-black text-white px-8 py-24">
      <section className="flex flex-col gap-4 max-w-3xl">
        <p className="text-xs tracking-[0.5em] uppercase text-amber-300">
          Prototype
        </p>
        <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-[0.2em] leading-tight">
          WebGL Halftone Surface
        </h1>
        <p className="text-base text-neutral-400">
          The image is rendered once into a GPU texture, then ScrollTrigger only
          tweaks shader uniforms. No ImageData copies, no main-thread paints,
          just buttery param scrubbing.
        </p>
      </section>

      <div className="w-full max-w-[520px] aspect-square border border-white/10 rounded-lg overflow-hidden">
        <CanvasHalftoneWebGL
          imageSrc="/img/chase.png"
          width={512}
          height={512}
          params={{
            halftoneSize: 10,
            dotSpacing: 20,
            rgbOffset: 1.5,
            effectIntensity: 1,
            brightness: 1,
            contrast: 1,
          }}
        />
      </div>

      <HalftoneScrollSection />

      <div className="h-[120vh]" />
    </div>
  );
}
