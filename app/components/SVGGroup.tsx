import AnimatedSVG from "./AnimatedSVG";
import Phantom from "./Phantom";
import Drum from "./Drum";
import Initialize from "./Initialize";

const aspectRatios = [462 / 84, 271 / 82, 515 / 43];

export default function SVGGroup() {
  return (
    <div className="flex flex-col">
      <AnimatedSVG order={0} aspectRatio={aspectRatios[0]}>
        <Phantom className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG order={1} aspectRatio={aspectRatios[1]}>
        <Drum className="w-full h-full" />
      </AnimatedSVG>
      <AnimatedSVG order={2} aspectRatio={aspectRatios[2]}>
        <Initialize className="w-full h-full" />
      </AnimatedSVG>
    </div>
  );
}
