import Link from "next/link";
import HalftoneEffect from "./HalftoneEffect";

const PRESAVE_URL = "https://distrokid.com/hyperfollow/phantomdrum/initialize";
const PRESAVE_COLOR = "#fbbf24";

export default function PreSaveSection() {
  return (
    <div className="w-full flex flex-col items-start justify-center px-6 mb-[10vw] gap-4">
      <div className="w-full mix-blend-difference-off">
        <HalftoneEffect
          dotRadius={{ base: 1.5, md: 2 }}
          dotSpacing={{ base: 3.5, md: 5 }}
          shape="octagon"
          className="LISTEN_SECTION"
          applyToChild
        >
          <Link
            href={PRESAVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="button"
            style={{ color: PRESAVE_COLOR }}
          >
            <div className="button-background" />
            <span className="button-text">PRE SAVE</span>
          </Link>
        </HalftoneEffect>
      </div>
    </div>
  );
}
