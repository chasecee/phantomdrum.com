export default function LuminaryAwardsLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 420 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Luminary Awards"
      focusable="false"
    >
      <g
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
      >
        <path d="M165 40 C148 50 136 64 140 78 C146 84 156 82 164 76" />
        <path d="M160 48 C154 54 150 60 149 66" />
      </g>
      <g
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.7"
        transform="translate(420 0) scale(-1 1)"
      >
        <path d="M165 40 C148 50 136 64 140 78 C146 84 156 82 164 76" />
        <path d="M160 48 C154 54 150 60 149 66" />
      </g>
      <circle cx="210" cy="32" r="3.5" fill="#FFFFFF" opacity="0.85" />
      <path
        d="M210 36 L215 48 L228 48 L218 56 L222 68 L210 60 L198 68 L202 56 L192 48 L205 48 Z"
        fill="#FFFFFF"
        opacity="0.9"
      />
      <path
        d="M192 66 Q210 72 228 66"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.7"
      />
      <text
        x="210"
        y="112"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="22"
        fontWeight="600"
        letterSpacing="10"
        fill="#FFFFFF"
      >
        LUMINARY AWARDS
      </text>
      <text
        x="210"
        y="124"
        textAnchor="middle"
        fontFamily="serif"
        fontSize="10"
        fontWeight="400"
        letterSpacing="5"
        fill="#FFFFFF"
        opacity="0.7"
      >
        SOCIETY OF ELECTRO-DRAMATICS
      </text>
    </svg>
  );
}

