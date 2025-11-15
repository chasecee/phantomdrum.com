import Image from "next/image";
import styles from "./HeroSection.module.css";
export default function HeroSectionText() {
  return (
    <div className="relative aspect-1/2 w-full">
      <div className="relative top-6 z-10 mix-blend-difference-off px-6">
        <div
          className="relative w-full aspect-887/488"
          style={{ overflow: "visible", containerType: "inline-size" }}
        >
          {/* <HalftoneEffect blur={0} dotRadius={2} dotSpacing={4}> */}
          <div className={`w-full text-neutral-300 ${styles.heroLogo}`}>
            <h1 className="text-[23cqi] leading-[.9] font-bold">
              PHANTOM
              <br />
              DRUM
            </h1>
            <h2 className="text-[16.2cqi] leading-[.8] mt-3 font-normal text-amber-400">
              INITIALIZE
            </h2>
          </div>
          {/* </HalftoneEffect> */}
        </div>
      </div>

      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className={`absolute inset-0 aspect-square w-full ${styles.heroImage}`}
        >
          <Image
            src="/img/optimized/planet-cropped.webp"
            alt="Phantom Drum Globe"
            fill
            className="object-cover object-center"
            priority
            fetchPriority="high"
            sizes="100vw"
          />
        </div>
      </div>
    </div>
  );
}
