export default function NatGeoLogo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 60"
      className={className}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="0" y="0" width="60" height="60" fill="currentColor" />
      <text
        x="70"
        y="25"
        fontSize="16"
        fontWeight="900"
        letterSpacing="-0.5"
        fontFamily="system-ui, sans-serif"
      >
        NATIONAL
      </text>
      <text
        x="70"
        y="45"
        fontSize="16"
        fontWeight="900"
        letterSpacing="-0.5"
        fontFamily="system-ui, sans-serif"
      >
        GEOGRAPHIC
      </text>
    </svg>
  );
}

