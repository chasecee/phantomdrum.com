import HalftoneButton from "./HalftoneButton";

export default function ListenSection() {
  return (
    <div className="w-full flex flex-col items-start justify-center my-[10vw] px-6 gap-4">
      <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full mix-blend-difference">
        <HalftoneButton
          text="Spotify"
          href="https://open.spotify.com"
          color="#1DB954"
        />
        <HalftoneButton
          text="Apple Music"
          href="https://music.apple.com"
          color="#D51F35"
        />
      </div>
    </div>
  );
}
