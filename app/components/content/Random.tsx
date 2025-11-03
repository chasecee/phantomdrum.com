"use client";

import { useState, useEffect, useRef } from "react";

const quotes = [
  "Sound is the vocabulary of nature.",
  "Silence is also music.",
  "In rhythm we trust.",
  "Every beat tells a story.",
] as const;

export default function Random() {
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % quotes.length;
      setIndex(indexRef.current);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p className="text-white/40 italic text-sm">{quotes[index]}</p>
    </div>
  );
}

