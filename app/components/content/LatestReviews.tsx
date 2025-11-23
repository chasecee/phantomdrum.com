"use client";

import { useEffect, useMemo, useState } from "react";
import SmallQuote from "../../art/SmallQuote";

interface ReviewRecord {
  sentence: string;
  shareUrl: string;
  uploadedAt: string;
}

interface LatestReviewsProps {
  refreshKey?: number;
  limit?: number;
}

const RELATIVE_UNITS = [
  { label: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { label: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { label: "week", ms: 1000 * 60 * 60 * 24 * 7 },
  { label: "day", ms: 1000 * 60 * 60 * 24 },
  { label: "hour", ms: 1000 * 60 * 60 },
  { label: "minute", ms: 1000 * 60 },
  { label: "second", ms: 1000 },
];

function formatRelativeTime(timestamp: string): string {
  const target = new Date(timestamp).getTime();
  if (Number.isNaN(target)) {
    return "";
  }
  const diff = Date.now() - target;
  if (Math.abs(diff) < 30_000) {
    return "just now";
  }
  for (const unit of RELATIVE_UNITS) {
    if (Math.abs(diff) >= unit.ms) {
      const value = Math.round(Math.abs(diff) / unit.ms);
      const suffix = value === 1 ? "" : "s";
      return `${value} ${unit.label}${suffix} ago`;
    }
  }
  return "just now";
}

function toTitleCase(value: string): string {
  const sanitized = value
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return sanitized
    .split(" ")
    .map((word) => (word ? `${word[0].toUpperCase()}${word.slice(1)}` : ""))
    .join(" ")
    .trim();
}

export default function LatestReviews({
  refreshKey = 0,
  limit = 3,
}: LatestReviewsProps) {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [currentLimit, setCurrentLimit] = useState(limit);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    setCurrentLimit(limit);
    setHasMore(false);
  }, [limit]);

  useEffect(() => {
    const controller = new AbortController();

    const loadReviews = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/reviews?limit=${currentLimit}`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load reviews");
        }
        const data = await response.json();
        if (!controller.signal.aborted) {
          const reviews = Array.isArray(data.reviews) ? [...data.reviews] : [];
          setReviews(reviews);
          setHasMore(reviews.length === currentLimit);
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load reviews");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void loadReviews();

    return () => {
      controller.abort();
    };
  }, [currentLimit, refreshKey, refreshCounter]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      setRefreshCounter((value) => value + 1);
    };
    window.addEventListener("sentence-cube:review-submitted", handler);
    return () => {
      window.removeEventListener("sentence-cube:review-submitted", handler);
    };
  }, []);

  const reviewItems = useMemo(() => {
    return reviews.map((review) => {
      const uploadedDate = new Date(review.uploadedAt);
      const dateLabel = uploadedDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
      const relativeLabel = formatRelativeTime(review.uploadedAt);
      const displaySentence = toTitleCase(review.sentence);
      return (
        <SmallQuote
          key={`${review.sentence}-${review.uploadedAt}`}
          text={displaySentence || review.sentence}
          metaText={
            relativeLabel ? `${relativeLabel} · ${dateLabel}` : dateLabel
          }
          metaLink={review.shareUrl}
        />
      );
    });
  }, [reviews]);

  const handleLoadMore = () => {
    setCurrentLimit((value) => value + limit);
  };

  return (
    <section className="text-white px-6 py-[10cqw]">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <p className="text-[clamp(1rem,3cqw,3rem)] uppercase text-white">
            Latest Reviews
          </p>
        </div>

        <div className="grid w-full grid-cols-1 gap-10">
          {reviewItems.length ? (
            reviewItems
          ) : (
            <SmallQuote text="Silence is golden." metaText="Latest review" />
          )}
        </div>
        {error && (
          <p className="sentence-cube-message sentence-cube-message--error">
            {error}
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={handleLoadMore}
            className="sentence-cube-btn sentence-cube-btn--ghost tracking-[0.4em] disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Load more"}
          </button>
        )}
      </div>
    </section>
  );
}
