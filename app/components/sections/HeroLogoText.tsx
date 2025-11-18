import Image from "next/image";
import heroLogo from "@/public/img/optimized/herologo.webp";
import styles from "./HeroSection.module.css";
import HalftoneEffect from "../content/HalftoneEffect";

export default function HeroLogoText() {
  return (
    <HalftoneEffect
      dotRadius={{ sm: 1, md: 1.5, lg: 2 }}
      dotSpacing={{ sm: 3, md: 4.5, lg: 6.5 }}
    >
      <div
        className="select-none"
        style={
          {
            containerType: "inline-size",
            "--aspect-width": "1042",
            "--aspect-height": "600",
            "--scale-multiplier": "0.18",
          } as React.CSSProperties
        }
      >
        <div
          style={
            {
              lineHeight: "1",
              // height:
              //   "calc(100cqw * var(--aspect-w) / var(--aspect-width) * var(--scale-multiplier))",
              height: "auto",
            } as React.CSSProperties
          }
        >
          <div
            className={`aspect-1042/600 p-8 text-neutral-300 ${styles.heroLogo}`}
          >
            <h1 className="sr-only ttext-[13.5cqi] leading-none font-bold whitespace-nowrap">
              PHANTOM DRUM
            </h1>

            <Image
              src={heroLogo}
              alt="Phantom Drum"
              priority
              width={1042}
              height={600}
              sizes="100vw"
              className="relative w-full max-h-[calc(100svh-4rem)]"
            />
            {/* <h2 className="tracking-[0cqi] text-[7.5cqi] leading-[.8] mt-2 font-normal text-amber-400">
          INITIALIZE
        </h2> */}
          </div>
        </div>
      </div>
    </HalftoneEffect>
  );
}
