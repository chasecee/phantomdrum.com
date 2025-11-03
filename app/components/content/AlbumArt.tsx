import Image from "next/image";

export default function AlbumArt() {
  return (
    <div className="w-full sticky top-0 mx-auto aspect-square overflow-hidden max-w-svh max-h-svh">
      <Image
        src="/img/art.png"
        alt="Album Art"
        width={1080}
        height={1080}
        className="w-full h-full object-cover"
        priority
      />
    </div>
  );
}
