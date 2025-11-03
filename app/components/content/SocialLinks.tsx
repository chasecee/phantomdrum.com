import Spotify from "../svgs/Spotify";
import AppleMusic from "../svgs/AppleMusic";
import Instagram from "../svgs/Instagram";
import YouTube from "../svgs/YouTube";

const links = [
  { name: "Spotify", url: "#", Icon: Spotify, color: "#1DB954" },
  { name: "Apple Music", url: "#", Icon: AppleMusic, color: "#FF4E6B" },
  { name: "Instagram", url: "#", Icon: Instagram, color: "#C13584" },
  { name: "YouTube", url: "#", Icon: YouTube, color: "#E52D27" },
] as const;

export default function SocialLinks() {
  return (
    <div className="flex gap-4 justify-center items-center flex-wrap">
      {links.map((link) => (
        <a
          key={link.name}
          href={link.url}
          className="group flex items-center gap-2 px-4 py-2 border border-white/20 hover:border-(--brand-color) text-white/60 transition-[color,border-color] duration-200"
          style={
            {
              "--brand-color": link.color,
            } as React.CSSProperties
          }
        >
          <link.Icon className="w-4 h-4 group-hover:text-(--brand-color) transition-[color] duration-200" />
          <span className="text-sm group-hover:text-(--brand-color) transition-[color] duration-200">
            {link.name}
          </span>
        </a>
      ))}
    </div>
  );
}
