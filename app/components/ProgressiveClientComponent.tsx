"use client";

import { useEffect, useState, startTransition } from "react";

interface ProgressiveClientComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

function ProgressiveClientComponent({
  children,
  fallback = null,
}: ProgressiveClientComponentProps) {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const deferHydration = () => {
      if (document.readyState === "complete") {
        requestAnimationFrame(() => {
          startTransition(() => {
            setShouldRender(true);
          });
        });
      } else {
        window.addEventListener(
          "load",
          () => {
            requestAnimationFrame(() => {
              startTransition(() => {
                setShouldRender(true);
              });
            });
          },
          { once: true }
        );
      }
    };

    if (typeof requestIdleCallback !== "undefined") {
      requestIdleCallback(deferHydration, { timeout: 2000 });
    } else {
      setTimeout(deferHydration, 100);
    }
  }, []);

  if (!shouldRender) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default ProgressiveClientComponent;
