import styles from "./HeroSection.module.css";

export default function HeroLogoText() {
  return (
    <div
      className="relative w-full select-none h-[19svh]"
      style={{ overflow: "visible", containerType: "inline-size" }}
    >
      <div className={`w-full text-neutral-300 ${styles.heroLogo}`}>
        <h1 className="text-[13.5cqi] leading-none font-bold whitespace-nowrap">
          PHANTOM DRUM
        </h1>
        {/* <h2 className="tracking-[0cqi] text-[7.5cqi] leading-[.8] mt-2 font-normal text-amber-400">
          INITIALIZE
        </h2> */}
      </div>
    </div>
  );
}
