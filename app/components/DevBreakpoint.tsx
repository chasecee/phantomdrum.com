"use client";

export default function DevBreakpoint() {
  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed top-0 left-0 z-50 bg-black border border-white/20 px-3 py-1 text-xs font-mono text-white/60">
      <span className="sm:hidden">xs</span>
      <span className="hidden sm:inline md:hidden">sm</span>
      <span className="hidden md:inline lg:hidden">md</span>
      <span className="hidden lg:inline xl:hidden">lg</span>
      <span className="hidden xl:inline 2xl:hidden">xl</span>
      <span className="hidden 2xl:inline">2xl</span>
    </div>
  );
}
