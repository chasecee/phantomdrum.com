"use client";

"use client";

import { useCallback, useState } from "react";
import type { AnimatedSentenceCubeHandle } from "../../content/three/AnimatedSentenceCubeScene";
import {
  CompositeOptions,
  compositeWithNoiseBackground,
} from "@/app/lib/imageComposition";
import { uploadShareImage } from "@/app/lib/shareApi";

const SHARE_CAPTURE_OPTIONS: CompositeOptions = {
  outputFormat: "image/jpeg",
  quality: 0.75,
  scale: 0.75,
};

interface ShareButtonProps {
  sceneRef: React.RefObject<AnimatedSentenceCubeHandle | null>;
  sentence: string;
  sentenceWords?: string[];
  initialShare?: {
    blob: Blob;
    shareUrl: string;
    imageUrl: string;
    words?: string[];
  };
  onReset?: () => void;
  resetLabel?: string;
}

export function ShareButton({
  sceneRef,
  sentence,
  sentenceWords,
  initialShare,
  onReset,
  resetLabel,
}: ShareButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const resolvedResetLabel = resetLabel ?? "Reset";

  const canUseClipboard = useCallback(() => {
    if (typeof window === "undefined") return false;
    if (!window.isSecureContext) return false;
    if (typeof navigator === "undefined") return false;
    return typeof navigator.clipboard?.writeText === "function";
  }, []);

  const resolveBlob = useCallback(
    async (options: CompositeOptions = {}) => {
      const requestedFormat = options.outputFormat ?? "image/png";
      const initialBlobMatchesFormat =
        initialShare?.blob &&
        (!options.outputFormat || initialShare.blob.type === requestedFormat);
      if (initialBlobMatchesFormat) {
        return initialShare.blob;
      }
      if (!sceneRef.current) {
        throw new Error("Scene not ready");
      }
      const imageData = await sceneRef.current.capture();
      return compositeWithNoiseBackground(
        imageData,
        {
          dotRadius: 2,
          dotSpacing: 4,
          shape: "octagon",
        },
        options
      );
    },
    [initialShare, sceneRef]
  );

  const handleDownload = useCallback(async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const blob = await resolveBlob({ outputFormat: "image/png" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = "png";
      link.download = `sentence-cube-${Date.now()}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  }, [resolveBlob]);

  const handleShare = useCallback(async () => {
    setIsSharing(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const blob = await resolveBlob(SHARE_CAPTURE_OPTIONS);
      const shareUrl =
        initialShare?.shareUrl ??
        (
          await uploadShareImage(blob, sentence, {
            words: sentenceWords ?? initialShare?.words,
          })
        ).shareUrl;

      if (navigator.share && navigator.canShare) {
        try {
          const shareData: ShareData = {
            title: sentence || "Sentence Cube",
            text: `${sentence}`,
            url: shareUrl,
            files: [
              new File([blob], `sentence-cube-${Date.now()}.png`, {
                type: "image/png",
              }),
            ],
          };

          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setSuccessMessage("Shared!");
            setTimeout(() => setSuccessMessage(null), 3000);
            return;
          }
        } catch (shareError) {
          if ((shareError as Error).name !== "AbortError") {
            console.error("Share error:", shareError);
          }
        }
      }

      if (canUseClipboard()) {
        await navigator.clipboard.writeText(shareUrl);
        setSuccessMessage("Link copied to clipboard!");
        setTimeout(() => setSuccessMessage(null), 3000);
        return;
      }
      setSuccessMessage(
        `Clipboard unavailable on this origin. Share link: ${shareUrl}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share");
    } finally {
      setIsSharing(false);
    }
  }, [resolveBlob, initialShare, sentence, sentenceWords, canUseClipboard]);

  const handleReset = useCallback(() => {
    if (isDownloading || isSharing) {
      return;
    }
    setError(null);
    setSuccessMessage(null);
    onReset?.();
  }, [isDownloading, isSharing, onReset]);

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex w-full flex-wrap items-center justify-center gap-4">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading || isSharing}
          className="sentence-cube-btn sentence-cube-btn--ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? "Processing..." : "Download"}
        </button>
        <button
          type="button"
          onClick={handleShare}
          disabled={isDownloading || isSharing}
          className="sentence-cube-btn sentence-cube-btn--ghost disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? "Processing..." : "Share Link"}
        </button>
        {onReset && (
          <button
            type="button"
            onClick={handleReset}
            disabled={isDownloading || isSharing}
            className="sentence-cube-btn sentence-cube-btn--danger disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resolvedResetLabel}
          </button>
        )}
      </div>
      {error && (
        <div className="sentence-cube-message sentence-cube-message--error">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="sentence-cube-message sentence-cube-message--success">
          {successMessage}
        </div>
      )}
    </div>
  );
}
