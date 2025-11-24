import Image from "next/image";

type ReleaseCountdownCardProps = {
  label: string;
  metaLabel?: string;
  title: string;
  cover: {
    src: string;
    alt: string;
  };
};

export default function ReleaseCountdownCard({
  label,
  metaLabel = "Album",
  title,
  cover,
}: ReleaseCountdownCardProps) {
  return (
    <div className="w-full px-6">
      <div className="mx-auto w-full max-w-xs rounded-[32px] border border-white/10 bg-[#7A150B] p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
        <div className="text-xs font-semibold uppercase tracking-wider text-white/80">
          <span className="rounded-full bg-indigo-500 px-3 py-1 text-[11px]">
            {label}
          </span>
        </div>

        <div className="relative mt-5 aspect-square w-full overflow-hidden rounded-2xl border border-white/15">
          <Image
            src={cover.src}
            alt={cover.alt}
            fill
            sizes="(min-width: 768px) 320px, 80vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="mt-6 text-[13px] uppercase tracking-[0.4em] text-white/60">
          {metaLabel}
        </div>
        <div className="mt-1 text-3xl font-bold leading-tight">{title}</div>

        <div className="mt-6 rounded-2xl bg-black/20 px-4 py-3 text-center text-sm font-semibold uppercase tracking-widest text-white release-pulse">
          Available Now
        </div>
      </div>
    </div>
  );
}
