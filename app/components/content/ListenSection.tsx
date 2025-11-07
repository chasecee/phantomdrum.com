import ListenButton from "./ListenButton";

export default function ListenSection() {
  return (
    <div className="w-full flex flex-col items-start justify-center my-[20vw] px-6 gap-4">
      <p className="text-[5vw] font-mono font-bold uppercase">Listen Now:</p>
      <div className="grid grid-cols-2 gap-6 w-full">
        <ListenButton
          text=" spotify"
          href="https://open.spotify.com"
          color="#1DB954"
        />
        <ListenButton
          text="apple music"
          href="https://music.apple.com"
          color="#FA243C"
        />
      </div>
    </div>
  );
}

