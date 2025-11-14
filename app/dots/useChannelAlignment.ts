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
      gsap.fromTo(
        refs.red.current,
        { x: -startOffset, y: -startOffset },
        {
          x: -endOffset,
          y: -endOffset,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );

      gsap.fromTo(
        refs.green.current,
        { x: 0, y: startOffset },
        {
          x: 0,
          y: endOffset,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );

      gsap.fromTo(
        refs.blue.current,
        { x: startOffset, y: startOffset },
        {
          x: endOffset,
          y: endOffset,
          ease: "none",
          scrollTrigger: scrollTriggerConfig,
        }
      );
    });

    return () => ctx.revert();
  }, [refs, startOffset, endOffset, enabled, scrollStart, scrollEnd]);
}

