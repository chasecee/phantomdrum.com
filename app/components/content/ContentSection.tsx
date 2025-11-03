import SocialLinks from "./SocialLinks";
import Bio from "./Bio";
import Random from "./Random";

export default function ContentSection() {
  return (
    <div className="py-20 px-8 pb-[100svw]">
      <div className="max-w-4xl mx-auto space-y-16">
        <SocialLinks />
        <Bio />
        <Random />
      </div>
    </div>
  );
}
