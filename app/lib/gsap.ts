"use client";

let gsapInstance: typeof import("gsap").gsap | null = null;
let scrollTriggerInstance: typeof import("gsap/ScrollTrigger").ScrollTrigger | null = null;
let isRegistered = false;
let initPromise: Promise<void> | null = null;

async function initGSAP() {
  if (typeof window === "undefined" || isRegistered) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const [{ gsap }, { ScrollTrigger }] = await Promise.all([
      import("gsap"),
      import("gsap/ScrollTrigger"),
    ]);
    
    gsap.registerPlugin(ScrollTrigger);
    gsapInstance = gsap;
    scrollTriggerInstance = ScrollTrigger;
    isRegistered = true;
  })();
  
  return initPromise;
}

export async function getGSAP() {
  if (!gsapInstance) {
    await initGSAP();
  }
  return gsapInstance!;
}

export async function getScrollTrigger() {
  if (!scrollTriggerInstance) {
    await initGSAP();
  }
  return scrollTriggerInstance!;
}

export const gsap = new Proxy({} as typeof import("gsap").gsap, {
  get(_target, prop) {
    if (!gsapInstance && typeof window !== "undefined") {
      initGSAP();
    }
    return gsapInstance?.[prop as keyof typeof gsapInstance];
  },
});

export const ScrollTrigger = new Proxy({} as typeof import("gsap/ScrollTrigger").ScrollTrigger, {
  get(_target, prop) {
    if (!scrollTriggerInstance && typeof window !== "undefined") {
      initGSAP();
    }
    return scrollTriggerInstance?.[prop as keyof typeof scrollTriggerInstance];
  },
});

