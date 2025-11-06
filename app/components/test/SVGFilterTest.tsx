"use client";

import { useId } from "react";

export default function SVGFilterTest() {
  const filterId1 = useId().replace(/:/g, "-");
  const filterId2 = useId().replace(/:/g, "-");
  const filterId3 = useId().replace(/:/g, "-");
  const filterId4 = useId().replace(/:/g, "-");
  const filterId5 = useId().replace(/:/g, "-"); // Sine wave test

  const displacementScale = 0.05;

  // Create vertical gradient: top normal (gray), center offset right (white), bottom normal (gray)
  const verticalOffsetPattern = `data:image/svg+xml,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
      <defs>
        <linearGradient id="vertOffsetGrad${filterId3}" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
          <stop offset="0" stop-color="rgb(128,128,128)"/>
          <stop offset="0.5" stop-color="rgb(255,255,255)"/>
          <stop offset="1" stop-color="rgb(128,128,128)"/>
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#vertOffsetGrad${filterId3})"/>
    </svg>
  `)}`;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold mb-4">Minimal SVG Filter Test</h1>

      {/* Test 1: RippleText approach (feTurbulence + feComposite) - works in Chrome */}
      <div>
        <h2 className="font-bold mb-2">
          Test 1: feTurbulence + feComposite (RippleText approach)
        </h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient
              id={`rippleGrad${filterId1}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0" stopColor="white" stopOpacity="0" />
              <stop offset="0.125" stopColor="white" stopOpacity="0.382683" />
              <stop offset="0.25" stopColor="white" stopOpacity="0.707107" />
              <stop offset="0.375" stopColor="white" stopOpacity="0.92388" />
              <stop offset="0.5" stopColor="white" stopOpacity="1" />
              <stop offset="0.625" stopColor="white" stopOpacity="0.92388" />
              <stop offset="0.75" stopColor="white" stopOpacity="0.707107" />
              <stop offset="0.875" stopColor="white" stopOpacity="0.382683" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <filter
              id={filterId1}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              filterUnits="objectBoundingBox"
              primitiveUnits="objectBoundingBox"
            >
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.02 0.01"
                numOctaves="1"
                seed="1"
                result="wave"
              />
              <feImage
                href={`data:image/svg+xml,${encodeURIComponent(`
                  <svg xmlns="http://www.w3.org/2000/svg" width="1" height="1">
                    <rect width="1" height="1" fill="url(#rippleGrad${filterId1})"/>
                  </svg>
                `)}`}
                result="sineGradient"
                x="0"
                y="0"
                width="1"
                height="1"
                preserveAspectRatio="none"
              />
              <feComposite
                in="wave"
                in2="sineGradient"
                operator="multiply"
                result="maskedWave"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="maskedWave"
                scale={displacementScale * 20}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId1})`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          RippleText Approach Test
        </div>
      </div>

      {/* Test 2: Add x/y channel selectors */}
      <div>
        <h2 className="font-bold mb-2">Test 2: With channel selectors</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter id={filterId2} primitiveUnits="objectBoundingBox">
              <feImage
                href={verticalOffsetPattern}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId2})`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          With Channel Selectors
        </div>
      </div>

      {/* Test 3: Add filter region */}
      <div>
        <h2 className="font-bold mb-2">Test 3: With filter region</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter
              id={filterId3}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              primitiveUnits="objectBoundingBox"
            >
              <feImage
                href={verticalOffsetPattern}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId3})`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          With Filter Region
        </div>
      </div>

      {/* Test 4: Add filterUnits */}
      <div>
        <h2 className="font-bold mb-2">Test 4: With filterUnits</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter
              id={filterId4}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              filterUnits="objectBoundingBox"
              primitiveUnits="objectBoundingBox"
            >
              <feImage
                href={verticalOffsetPattern}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId4})`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          With FilterUnits
        </div>
      </div>

      {/* Test 5: Add colorInterpolationFilters */}
      <div>
        <h2 className="font-bold mb-2">
          Test 5: With colorInterpolationFilters
        </h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter
              id={filterId5}
              x="-20%"
              y="-20%"
              width="140%"
              height="140%"
              filterUnits="objectBoundingBox"
              primitiveUnits="objectBoundingBox"
              colorInterpolationFilters="sRGB"
            >
              <feImage
                href={verticalOffsetPattern}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
                colorInterpolationFilters="sRGB"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId5})`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          With Color Interpolation
        </div>
      </div>

      {/* Test 6: Inline SVG pattern instead of data URI */}
      <div>
        <h2 className="font-bold mb-2">Test 6: Inline SVG pattern</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient
              id={`grad${filterId1}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0" stopColor="rgb(128,128,128)" />
              <stop offset="0.5" stopColor="rgb(255,255,255)" />
              <stop offset="1" stopColor="rgb(128,128,128)" />
            </linearGradient>
            <pattern
              id={`pattern${filterId1}`}
              x="0"
              y="0"
              width="1"
              height="1"
              patternUnits="objectBoundingBox"
            >
              <rect width="1" height="1" fill={`url(#grad${filterId1})`} />
            </pattern>
            <filter
              id={`${filterId1}-inline`}
              primitiveUnits="objectBoundingBox"
            >
              <feImage
                href={`#pattern${filterId1}`}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId1}-inline)`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          Inline SVG Pattern
        </div>
      </div>

      {/* Test 7: feImage with embedded SVG content (Chrome workaround) */}
      <div>
        <h2 className="font-bold mb-2">Test 7: feImage with embedded SVG</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <filter
              id={`${filterId1}-embedded`}
              primitiveUnits="objectBoundingBox"
            >
              <feImage result="img" x="0" y="0" width="1" height="1">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="100"
                  height="100"
                >
                  <linearGradient
                    id={`embedGrad${filterId1}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                    gradientUnits="objectBoundingBox"
                  >
                    <stop offset="0" stopColor="rgb(128,128,128)" />
                    <stop offset="0.5" stopColor="rgb(255,255,255)" />
                    <stop offset="1" stopColor="rgb(128,128,128)" />
                  </linearGradient>
                  <rect
                    width="100"
                    height="100"
                    fill={`url(#embedGrad${filterId1})`}
                  />
                </svg>
              </feImage>
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <div
          style={{
            filter: `url(#${filterId1}-embedded)`,
            fontSize: "24px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          Embedded SVG Content
        </div>
      </div>

      {/* Test 8: SVG foreignObject wrapping HTML (Chrome workaround) */}
      <div>
        <h2 className="font-bold mb-2">
          Test 8: SVG foreignObject wrapping HTML
        </h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient
              id={`foGrad${filterId1}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0" stopColor="rgb(128,128,128)" />
              <stop offset="0.5" stopColor="rgb(255,255,255)" />
              <stop offset="1" stopColor="rgb(128,128,128)" />
            </linearGradient>
            <pattern
              id={`foPattern${filterId1}`}
              x="0"
              y="0"
              width="1"
              height="1"
              patternUnits="objectBoundingBox"
            >
              <rect width="1" height="1" fill={`url(#foGrad${filterId1})`} />
            </pattern>
            <filter id={`${filterId1}-fo`} primitiveUnits="objectBoundingBox">
              <feImage
                href={`#foPattern${filterId1}`}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <svg
          width="400"
          height="80"
          style={{ filter: `url(#${filterId1}-fo)` }}
        >
          <foreignObject x="0" y="0" width="400" height="80">
            <div
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "white",
              }}
            >
              SVG foreignObject HTML
            </div>
          </foreignObject>
        </svg>
      </div>

      {/* Test 9: SVG text element */}
      <div>
        <h2 className="font-bold mb-2">Test 9: Filter on SVG text element</h2>
        <svg width="0" height="0" style={{ position: "absolute" }}>
          <defs>
            <linearGradient
              id={`svgGrad${filterId1}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
              gradientUnits="objectBoundingBox"
            >
              <stop offset="0" stopColor="rgb(128,128,128)" />
              <stop offset="0.5" stopColor="rgb(255,255,255)" />
              <stop offset="1" stopColor="rgb(128,128,128)" />
            </linearGradient>
            <pattern
              id={`svgPattern${filterId1}`}
              x="0"
              y="0"
              width="1"
              height="1"
              patternUnits="objectBoundingBox"
            >
              <rect width="1" height="1" fill={`url(#svgGrad${filterId1})`} />
            </pattern>
            <filter id={`${filterId1}-svg`} primitiveUnits="objectBoundingBox">
              <feImage
                href={`#svgPattern${filterId1}`}
                result="img"
                x="0"
                y="0"
                width="1"
                height="1"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="img"
                scale={displacementScale}
                xChannelSelector="R"
                yChannelSelector="R"
              />
            </filter>
          </defs>
        </svg>
        <svg
          width="400"
          height="80"
          style={{ filter: `url(#${filterId1}-svg)` }}
        >
          <text x="10" y="50" fontSize="24" fontWeight="bold" fill="white">
            SVG Text Element
          </text>
        </svg>
      </div>
    </div>
  );
}
