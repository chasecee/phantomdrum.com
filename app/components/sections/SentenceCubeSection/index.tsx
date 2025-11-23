"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import sentencePacks from "@/config/sentencePacks.generated";
import {
  AnimatedSentenceCubeScene,
  type AnimatedSentenceCubeHandle,
} from "../../content/three/AnimatedSentenceCubeScene";
import HalftoneEffect from "../../content/HalftoneEffect";
import { compositeWithNoiseBackground } from "@/app/lib/imageComposition";
import { uploadShareImage } from "@/app/lib/shareApi";
import { ShareButton } from "./ShareButton";
import { generateRandomIndices } from "./utils";

const DEFAULT_PACK_ID = "default";

const normalizeFaceTextForComparison = (text: string) =>
  text
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

const mapWordsToIndices = (words: string[], lists: string[][]) =>
  lists.map((list, columnIndex) => {
    const target = words[columnIndex] ?? "";
    const normalizedTarget = normalizeFaceTextForComparison(target);
    const match = list.findIndex(
      (entry) => normalizeFaceTextForComparison(entry) === normalizedTarget
    );
    return match >= 0 ? match : 0;
  });

export default function SentenceCubeSection() {
  const defaultPack =
    sentencePacks.find((pack) => pack.id === DEFAULT_PACK_ID) ??
    sentencePacks[0];
  const [lists] = useState<string[][]>(
    () => defaultPack?.lists.map((list) => [...list]) ?? []
  );
  const [cameraFov, setCameraFov] = useState(23);
  const [cameraZoom, setCameraZoom] = useState(26);
  const [sentence, setSentence] = useState("");
  const [sentenceWords, setSentenceWords] = useState<string[]>([]);
  const sceneRef = useRef<AnimatedSentenceCubeHandle>(null);
  const showDevControls = process.env.NODE_ENV !== "production";
  const randomIndicesRef = useRef<number[] | null>(null);
  const currentIndicesRef = useRef<number[]>([]);
  const hasSpunRef = useRef(false);
  const seedRef = useRef<string | null>(null);
  const [submitState, setSubmitState] = useState<
    "idle" | "submitting" | "success"
  >("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedShare, setSubmittedShare] = useState<{
    shareUrl: string;
    imageUrl: string;
    blob: Blob;
    words: string[];
  } | null>(null);
  const shareHandledRef = useRef<string | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const shareParam = searchParams.get("share");
  const resetSubmission = useCallback(() => {
    setSubmittedShare(null);
    setSubmitError(null);
    setSubmitState("idle");
  }, []);

  useEffect(() => {
    if (hasSpunRef.current || !lists.length || shareParam) return;
    if (!seedRef.current) {
      seedRef.current = `${
        defaultPack?.id ?? JSON.stringify(lists)
      }-${Date.now()}-${Math.random()}`;
    }
    randomIndicesRef.current = generateRandomIndices(lists, seedRef.current);
    const timeout = setTimeout(() => {
      if (sceneRef.current && randomIndicesRef.current) {
        sceneRef.current.spinToIndices(randomIndicesRef.current);
        currentIndicesRef.current = randomIndicesRef.current.slice();
        hasSpunRef.current = true;
      }
    }, 500);
    return () => {
      clearTimeout(timeout);
    };
  }, [lists, defaultPack?.id, shareParam]);

  useEffect(() => {
    if (!shareParam || shareHandledRef.current === shareParam) {
      return;
    }
    hasSpunRef.current = true;
    let isActive = true;
    let retryCount = 0;
    const maxRetries = 20;
    const retryDelay = 100;

    let retryInterval: NodeJS.Timeout | null = null;

    const attemptLoadShare = async () => {
      try {
        const response = await fetch(`/api/share/${shareParam}`);
        if (!response.ok) {
          shareHandledRef.current = shareParam;
          router.replace("/", { scroll: false });
          return;
        }
        const metadata = await response.json();
        if (!isActive) return;
        const words =
          metadata.words ??
          (metadata.sentence
            ? metadata.sentence.split(" ").map((entry: string) => entry.trim())
            : []);
        setSentence(metadata.sentence ?? "");
        setSentenceWords(words);

        const indices = mapWordsToIndices(words, lists);

        const applyShare = () => {
          if (!isActive) return false;
          if (sceneRef.current) {
            sceneRef.current.spinToIndices(indices);
            currentIndicesRef.current = indices.slice();
            shareHandledRef.current = shareParam;
            if (submitState !== "success") {
              resetSubmission();
            }
            sectionRef.current?.scrollIntoView({ behavior: "smooth" });
            return true;
          }
          return false;
        };

        if (applyShare()) {
          return;
        }

        retryInterval = setInterval(() => {
          if (!isActive) {
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
            return;
          }
          retryCount++;
          if (applyShare() || retryCount >= maxRetries) {
            if (retryInterval) {
              clearInterval(retryInterval);
              retryInterval = null;
            }
            if (retryCount >= maxRetries) {
              shareHandledRef.current = shareParam;
              console.error(
                "Failed to load share: scene not ready after retries"
              );
            }
          }
        }, retryDelay);
      } catch (error) {
        shareHandledRef.current = shareParam;
        console.error("Failed to hydrate share:", error);
      }
    };

    void attemptLoadShare();
    return () => {
      isActive = false;
      if (retryInterval) {
        clearInterval(retryInterval);
      }
    };
  }, [shareParam, lists, router, resetSubmission, submitState]);

  const handleSubmit = useCallback(async () => {
    if (submitState === "submitting" || !sceneRef.current) return;
    setSubmitState("submitting");
    setSubmitError(null);

    try {
      const imageData = await sceneRef.current.capture();
      const blob = await compositeWithNoiseBackground(
        imageData,
        {
          dotRadius: 2,
          dotSpacing: 4,
          shape: "octagon",
        },
        {
          outputFormat: "image/jpeg",
          quality: 0.75,
          scale: 0.75,
        }
      );
      const response = await uploadShareImage(blob, sentence, {
        words: sentenceWords,
      });
      setSubmittedShare({
        shareUrl: response.shareUrl,
        imageUrl: response.imageUrl,
        blob,
        words: sentenceWords,
      });
      setSubmittedShare({
        shareUrl: response.shareUrl,
        imageUrl: response.imageUrl,
        blob,
        words: sentenceWords,
      });
      setSubmitState("success");
      router.replace(`/?share=${response.shareId}`, { scroll: false });
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("sentence-cube:review-submitted", {
            detail: { sentence },
          })
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to submit review";
      setSubmitError(message);
      setSubmitState("idle");
    }
  }, [sceneRef, sentence, sentenceWords, submitState, router]);

  const getDistinctRandomIndices = useCallback(() => {
    const current = currentIndicesRef.current;
    if (!current.length) {
      const seed = `${Date.now()}-${Math.random()}`;
      return generateRandomIndices(lists, seed);
    }
    return current.map((currentIndex, columnIndex) => {
      const faces = lists[columnIndex] ?? [];
      const faceCount = faces.length;
      if (faceCount <= 1) {
        return currentIndex ?? 0;
      }
      const offset = Math.floor(Math.random() * (faceCount - 1)) + 1; // ensure at least 1
      const base = Number.isFinite(currentIndex) ? currentIndex : 0;
      return (base + offset) % faceCount;
    });
  }, [lists]);

  const handleSpin = useCallback(() => {
    if (!sceneRef.current) return;
    const nextIndices = getDistinctRandomIndices();
    randomIndicesRef.current = nextIndices;
    currentIndicesRef.current = nextIndices.slice();
    sceneRef.current.spinToIndices(nextIndices);
  }, [getDistinctRandomIndices]);

  const devControls = useMemo(() => {
    if (!showDevControls) {
      return null;
    }
    return (
      <div className="space-y-4 rounded border border-dashed border-amber-400/40 p-4 text-left text-xs text-white/70">
        <div className="space-y-1">
          <label
            htmlFor="sentence-cube-fov"
            className="uppercase tracking-[0.3em]"
          >
            FOV
          </label>
          <input
            id="sentence-cube-fov"
            type="range"
            min={5}
            max={40}
            step={0.5}
            value={cameraFov}
            onChange={(event) => setCameraFov(Number(event.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="font-mono text-amber-200">{cameraFov.toFixed(1)}</div>
        </div>
        <div className="space-y-1">
          <label
            htmlFor="sentence-cube-zoom"
            className="uppercase tracking-[0.3em]"
          >
            Zoom
          </label>
          <input
            id="sentence-cube-zoom"
            type="range"
            min={10}
            max={120}
            step={1}
            value={cameraZoom}
            onChange={(event) => setCameraZoom(Number(event.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="font-mono text-amber-200">
            {cameraZoom.toFixed(0)}
          </div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.4em] text-white/40">
          Dev Only
        </div>
        <div className="text-[0.6rem] uppercase tracking-[0.4em] text-white/60">
          Current sentence
          <p className="mt-2 text-[0.85rem] font-mono uppercase tracking-[0.5em] text-white">
            {sentence || "—"}
          </p>
        </div>
      </div>
    );
  }, [cameraFov, cameraZoom, showDevControls, sentence]);

  if (!lists.length) {
    return null;
  }

  return (
    <section ref={sectionRef} className="relative w-full px-6 text-white">
      <div className="mx-auto max-w-(--container-width) space-y-10">
        <div className="text-center">
          <p className="text-[clamp(1rem,3cqw,3rem)] uppercase text-white">
            LEAVE A REVIEW
          </p>
        </div>
        <div className="mx-auto w-full max-w-5xl aspect-3/2 relative">
          <HalftoneEffect
            dotRadius={{ base: 1, md: 2 }}
            dotSpacing={{ base: 2, md: 4 }}
            shape="octagon"
            className="CUBE_SECTION absolute inset-0"
          >
            <AnimatedSentenceCubeScene
              ref={sceneRef}
              lists={lists}
              className="w-full h-full "
              size={3.4}
              heightRatio={2.3}
              widthRatio={0.25}
              spacing={0.05}
              cameraPosition={[0, 0, cameraZoom]}
              cameraFov={cameraFov}
              strokeWidth={5}
              fillMode="outline"
              matchTextColor
              activeTextColor="#fff"
              onSentenceChange={(words, sentenceText) => {
                if (submitState === "success" && sentenceText !== sentence) {
                  resetSubmission();
                }
                setSentence(sentenceText);
                setSentenceWords(words);
                currentIndicesRef.current = mapWordsToIndices(words, lists);
              }}
            />
          </HalftoneEffect>
        </div>
        <div className="flex flex-col items-center gap-4">
          {submitState !== "success" ? (
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                type="button"
                onClick={handleSpin}
                disabled={submitState === "submitting"}
                className="sentence-cube-btn sentence-cube-btn--ghost disabled:opacity-50 disabled:cursor-not-allowed tracking-[0.4em]"
              >
                Spin
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitState === "submitting"}
                className="sentence-cube-btn sentence-cube-btn--primary disabled:opacity-50 disabled:cursor-not-allowed tracking-wider"
              >
                {submitState === "submitting"
                  ? "Submitting..."
                  : "Submit Review"}
              </button>
            </div>
          ) : (
            <div className="flex w-full flex-col items-center gap-3">
              <ShareButton
                sceneRef={sceneRef}
                sentence={sentence}
                sentenceWords={sentenceWords}
                initialShare={submittedShare ?? undefined}
                onReset={resetSubmission}
                resetLabel="Reset"
              />
            </div>
          )}
          {submitError && (
            <div className="sentence-cube-message sentence-cube-message--error">
              {submitError}
            </div>
          )}
          {submitState === "success" && (
            <div className="sentence-cube-message sentence-cube-message--success">
              Review submitted!
            </div>
          )}
        </div>
        {showDevControls ? (
          <div className="hidden sm:block">{devControls}</div>
        ) : null}
      </div>
    </section>
  );
}
