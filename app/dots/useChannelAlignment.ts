import { useEffect, RefObject } from "react";
import gsap from "gsap";

interface ChannelRefs {
  red: RefObject<HTMLElement | null>;
  green: RefObject<HTMLElement | null>;
  blue: RefObject<HTMLElement | null>;
  container: RefObject<HTMLElement | null>;
}

export function useChannelAlignment(
  refs: ChannelRefs,
  startOffset: number = 40,
  endOffset: number = 0,
  enabled: boolean = true,
  scrollStart: string = "top bottom",
  scrollEnd: string = "bottom top"
) {
  useEffect(() => {
    if (
      !enabled ||
      !refs.container.current ||
      !refs.red.current ||
      !refs.green.current ||
      !refs.blue.current
    )
      return;

    const scrollTriggerConfig = {
      trigger: refs.container.current,
      start: scrollStart,
      end: scrollEnd,
      scrub: true,
    };

    const ctx = gsap.context(() => {
      const redStart = -startOffset;
      const redEnd = -endOffset;
      const greenStart = startOffset * 0.5;
      const greenEnd = endOffset * 0.5;
      const blueStart = startOffset;
      const blueEnd = endOffset;

      gsap.fromTo(
        refs.red.current,
        { y: redStart },
        {
          y: redEnd,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );

      gsap.fromTo(
        refs.green.current,
        { y: greenStart },
        {
          y: greenEnd,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );

      gsap.fromTo(
        refs.blue.current,
        { y: blueStart },
        {
          y: blueEnd,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );
    });

    return () => ctx.revert();
  }, [refs, startOffset, endOffset, enabled, scrollStart, scrollEnd]);
}

