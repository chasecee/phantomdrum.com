interface RippleTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function RippleText({
  children,
  className = "",
}: RippleTextProps) {
  return <div className={className}>{children}</div>;
}
