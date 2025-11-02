"use client";

import { useState, useEffect } from "react";

const quotes = [
  "Sound is the vocabulary of nature.",
  "Silence is also music.",
  "In rhythm we trust.",
  "Every beat tells a story.",
];

export default function Random() {
  const [quote, setQuote] = useState(quotes[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="text-center">
      <p className="text-white/40 italic text-sm">{quote}</p>
    </div>
  );
}

