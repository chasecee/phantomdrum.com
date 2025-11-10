"use client";

import { cubeLabels, buttonLabels } from "@/config/cubeLabels";

export default function CubeLabelPreview() {
  return (
    <section className="w-full px-6 my-[10vw] space-y-6">
      <h2 className="text-[clamp(1.5rem,4vw,3rem)] font-bold uppercase">
        Cube Label SVG Preview
      </h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {cubeLabels.map((label) => (
          <figure
            key={label.slug}
            className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
          >
            <figcaption className="text-sm uppercase tracking-[0.3em] text-white/60">
              {label.text}
            </figcaption>
            <img
              src={`/generated/cube-labels/${label.slug}.svg`}
              alt={label.text}
              className="w-full h-auto text-white"
              loading="lazy"
            />
          </figure>
        ))}
      </div>
      {buttonLabels.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-[clamp(1.25rem,3vw,2rem)] font-semibold uppercase text-white/80">
            Button Label SVG Preview
          </h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {buttonLabels.map((label) => (
              <figure
                key={label.slug}
                className="flex flex-col items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
              >
                <figcaption className="text-sm uppercase tracking-[0.3em] text-white/60">
                  {label.text}
                </figcaption>
                <img
                  src={`/generated/button-labels/${label.slug}.svg`}
                  alt={label.text}
                  className="w-full h-auto text-white"
                  loading="lazy"
                />
              </figure>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

