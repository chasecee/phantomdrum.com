import Image from "next/image";

export default function AlbumArt() {
  return (
    <div className="w-full sticky top-0 mx-auto aspect-square bg-white/5 border border-white/10 overflow-hidden">
      <Image
        src="/img/art.png"
        alt="Album Art"
        width={1080}
        height={1080}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
