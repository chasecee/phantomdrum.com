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
      <div className="flex justify-center  pb-16 pt-6 ">
        <span className="arrow-float inline-flex items-center justify-center text-amber-300 p-5 ">
          <svg
            className="h-[25vw] w-[25vw]"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M9 3h6v11h5l-8 9-8-9h5z" fill="#000000" />
            <path
              d="M9 3h6v11h5l-8 9-8-9h5z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </HalftoneEffect>
  );
}
