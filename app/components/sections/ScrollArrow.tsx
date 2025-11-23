"use client";

import HalftoneEffect from "../content/HalftoneEffect";

export default function ScrollArrow() {
  return (
    <HalftoneEffect
      dotRadius={{ base: 1.5, md: 2 }}
      dotSpacing={{ base: 3.5, md: 5 }}
      shape="circle"
      className="SCROLL_ARROW"
      applyToChild
    >
      <div className="flex justify-center pb-16 pt-6">
        <div className="neon-sign" aria-hidden="true">
          <div className="neon-sign__hanger" />
          <div className="neon-sign__frame">
            <svg
              className="neon-sign__arrow"
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              role="presentation"
            >
              <path d="M9 3h6v11h5l-8 9-8-9h5z" fill="currentColor" />
              <path
                d="M9 3h6v11h5l-8 9-8-9h5z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <span className="sr-only">Scroll to check in.</span>
      </div>
    </HalftoneEffect>
  );
}
