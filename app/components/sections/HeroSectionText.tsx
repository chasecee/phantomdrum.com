import Image from "next/image";
import styles from "./HeroSection.module.css";
export default function HeroSectionText() {
  return (
    <div className="relative aspect-1/2 w-full">
      <div className="relative top-6 z-10 mix-blend-difference-off px-6"></div>

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
