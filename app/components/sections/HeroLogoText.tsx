import styles from "./HeroSection.module.css";

export default function HeroLogoText() {
  return (
    <div
      className="relative w-full"
      style={{ overflow: "visible", containerType: "inline-size" }}
    >
      <div className={`w-full text-neutral-300 translate-y-1 `}>
        <h1 className="text-[23cqi] leading-[.9] font-bold">
          PHANTOM
          <br />
          DRUM
        </h1>
        <h2 className="text-[16.2cqi] leading-[.8] mt-3 font-normal text-amber-400">
          INITIALIZE
        </h2>
      </div>
    </div>
  );
}
