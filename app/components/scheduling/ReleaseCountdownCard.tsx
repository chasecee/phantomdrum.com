"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type ReleaseCountdownCardProps = {
  releaseDateIso: string;
  label: string;
  metaLabel?: string;
  title: string;
  variant?: "countdown" | "released";
  cover: {
    src: string;
    alt: string;
  };
  timezone?: {
    id: string;
    label: string;
  };
};

const SECOND_MS = 1000;
const MINUTE_MS = SECOND_MS * 60;
const HOUR_MS = MINUTE_MS * 60;
const DAY_MS = HOUR_MS * 24;

type CountdownSnapshot = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isComplete: boolean;
};

function useCountdown(targetDate: Date): CountdownSnapshot {
  const target = targetDate.getTime();
  if (Number.isNaN(target)) {
    throw new Error("ReleaseCountdownCard received an invalid release date");
  }

  const [now, setNow] = useState(() => target);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, SECOND_MS);

    return () => window.clearInterval(interval);
  }, [target]);

  const delta = Math.max(target - now, 0);
  const days = Math.floor(delta / DAY_MS);
  const hours = Math.floor((delta % DAY_MS) / HOUR_MS);
  const minutes = Math.floor((delta % HOUR_MS) / MINUTE_MS);
  const seconds = Math.floor((delta % MINUTE_MS) / SECOND_MS);

  return {
    days,
    hours,
    minutes,
    seconds,
    isComplete: delta === 0,
  };
}

export default function ReleaseCountdownCard({
  releaseDateIso,
  label,
  metaLabel = "Album",
  title,
  variant = "countdown",
  cover,
  timezone = {
    id: "America/Denver",
    label: "MST",
  },
}: ReleaseCountdownCardProps) {
  const releaseDate = useMemo(() => new Date(releaseDateIso), [releaseDateIso]);
  const countdown = useCountdown(releaseDate);
  const showCountdown = variant === "countdown" && !countdown.isComplete;

  const formattedTimestamp = useMemo(() => {
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone.id,
    });
    const timeFormatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezone.id,
    });
    return `${dateFormatter.format(releaseDate)} • ${timeFormatter.format(
      releaseDate
    )} ${timezone.label}`;
  }, [releaseDate, timezone.id, timezone.label]);

  const countdownUnits = [
    { label: "Days", value: countdown.days },
    { label: "Hours", value: countdown.hours },
    { label: "Mins", value: countdown.minutes },
    { label: "Secs", value: countdown.seconds },
  ];

  return (
    <div className="w-full px-6">
      <div className="mx-auto w-full max-w-xs rounded-[32px] border border-white/10 bg-[#7A150B] p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.55)]">
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-white/80">
          <span className="rounded-full bg-indigo-500 px-3 py-1 text-[11px]">
            {label}
          </span>
          <InfoGlyph />
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

        {showCountdown ? (
          <div className="mt-6 grid grid-cols-4 gap-2">
            {countdownUnits.map((unit) => (
              <div
                key={`${unit.label}-${unit.value}`}
                className="rounded-2xl bg-black/20 px-2 py-3 text-center countdown-pulse"
              >
                <div className="text-2xl font-semibold tabular-nums">
                  {unit.value.toString().padStart(2, "0")}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-widest text-white/70">
                  {unit.label}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl bg-black/20 px-4 py-3 text-center text-sm font-semibold uppercase tracking-widest text-white release-pulse">
            Available Now
          </div>
        )}

        <div className="mt-6 flex items-center gap-2 text-sm text-white/80">
          <ClockGlyph />
          <span>{formattedTimestamp}</span>
        </div>
      </div>
    </div>
  );
}

function InfoGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="text-white/70"
    >
      <circle cx="9" cy="9" r="8.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8.25 8.25H9.75V13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="5" r="0.75" fill="currentColor" />
    </svg>
  );
}

function ClockGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      className="text-white/70"
    >
      <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M9 5.5V9.25L11.25 11.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
