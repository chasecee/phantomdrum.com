export default function RoyalAcademyLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 95"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="47.5" cy="47.5" r="45" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="47.5" cy="47.5" r="37" fill="none" stroke="currentColor" strokeWidth="1" />
      <path d="M 47.5 15 L 52 30 L 67 30 L 55 38 L 60 53 L 47.5 45 L 35 53 L 40 38 L 28 30 L 43 30 Z" fill="currentColor" />
      <path d="M 20 75 Q 47.5 70 75 75" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M 25 82 Q 47.5 78 70 82" fill="none" stroke="currentColor" strokeWidth="1" />
      <text
        x="105"
        y="22"
        fontSize="10"
        fontWeight="200"
        letterSpacing="4"
        fontFamily="serif"
        opacity="0.8"
      >
        EST. MDCCCXLII
      </text>
      <text
        x="105"
        y="38"
        fontSize="13"
        fontWeight="400"
        letterSpacing="3"
        fontFamily="serif"
      >
        THE ROYAL ACADEMY
      </text>
      <text
        x="105"
        y="54"
        fontSize="13"
        fontWeight="400"
        letterSpacing="3"
        fontFamily="serif"
      >
        OF PRETTY GOOD
      </text>
      <text
        x="105"
        y="70"
        fontSize="13"
        fontWeight="400"
        letterSpacing="3"
        fontFamily="serif"
      >
        SOUNDS & NOISES
      </text>
      <text
        x="105"
        y="84"
        fontSize="8"
        fontWeight="200"
        letterSpacing="2"
        fontFamily="serif"
        opacity="0.6"
      >
        BY APPOINTMENT TO HER MAJESTY
      </text>
    </svg>
  );
}

