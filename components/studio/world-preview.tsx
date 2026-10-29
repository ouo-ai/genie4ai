"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Loader2,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
} from "lucide-react";
import type { GenerationAssets } from "@/lib/generation-types";
import type { WorldViewer } from "@/lib/world-viewer";

type World = NonNullable<GenerationAssets["world"]>;

function InteractiveWorld({ world, url }: { world: World; url: string }) {
  const host = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const viewer = useRef<WorldViewer | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState("Loading 3D viewer…");
  const [attempt, setAttempt] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [fullscreenError, setFullscreenError] = useState(false);
  const helpId = useId();

  useEffect(() => {
    let cancelled = false;
    let instance: WorldViewer | undefined;
    setPhase("loading");
    setProgress("Loading 3D viewer…");
    import("@/lib/world-viewer")
      .then(({ createWorldViewer }) => {
        if (cancelled || !host.current) return;
        instance = createWorldViewer(host.current, {
          url,
          flipY: world.flipY,
          metricScale: world.metricScale,
          onProgress: (message) => {
            if (!cancelled) setProgress(message);
          },
          onReady: () => {
            if (!cancelled) setPhase("ready");
          },
          onError: () => {
            if (!cancelled) setPhase("error");
          },
        });
        viewer.current = instance;
      })
      .catch(() => {
        if (!cancelled) setPhase("error");
      });
    return () => {
      cancelled = true;
      instance?.dispose();
      viewer.current = null;
    };
  }, [url, world.flipY, world.metricScale, attempt]);

  useEffect(() => {
    const changed = () =>
      setExpanded(document.fullscreenElement === frame.current);
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);

  const toggleFullscreen = async () => {
    setFullscreenError(false);
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (frame.current?.requestFullscreen)
        await frame.current.requestFullscreen();
      else setFullscreenError(true);
    } catch {
      setFullscreenError(true);
    }
  };
  const buttonClass =
    "inline-flex size-9 items-center justify-center rounded-lg border border-white/15 bg-black/65 text-white backdrop-blur-sm transition-colors hover:bg-black/90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-primary";

  return (
    <div>
      <div
        ref={frame}
        className="relative isolate h-80 w-full overflow-hidden rounded-xl border border-border bg-[#111318] sm:aspect-video sm:h-auto [&:fullscreen]:aspect-auto [&:fullscreen]:h-full [&:fullscreen]:w-full [&:fullscreen]:rounded-none"
        role="region"
        aria-label="3D world preview"
        aria-describedby={helpId}
        data-preview-state={phase}
      >
        <div ref={host} className="absolute inset-0" />
        {phase !== "ready" && (
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/90 px-6 text-center"
            role={phase === "error" ? "alert" : "status"}
          >
            {phase === "loading" ? (
              <>
                <Loader2 className="size-6 animate-spin text-primary" />
                <p className="text-sm">{progress}</p>
              </>
            ) : (
              <>
                <p className="text-sm">
                  The 3D preview could not load. Try again, or download your
                  files below.
                </p>
                <button
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                  className="rounded-full border border-border px-4 py-2 text-sm hover:bg-card"
                >
                  Retry 3D preview
                </button>
              </>
            )}
          </div>
        )}
        <div className="absolute top-3 left-3 hidden rounded-full bg-black/65 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:block">
          Interactive 3D
        </div>
        <div className="absolute top-3 right-3 flex gap-1.5">
          <button
            type="button"
            disabled={phase !== "ready"}
            className={buttonClass}
            aria-label="Zoom in"
            title="Zoom in"
            onClick={() => viewer.current?.zoom(true)}
          >
            <Plus className="size-4" />
          </button>
          <button
            type="button"
            disabled={phase !== "ready"}
            className={buttonClass}
            aria-label="Zoom out"
            title="Zoom out"
            onClick={() => viewer.current?.zoom(false)}
          >
            <Minus className="size-4" />
          </button>
          <button
            type="button"
            disabled={phase !== "ready"}
            className={buttonClass}
            aria-label="Reset view"
            title="Reset view"
            onClick={() => viewer.current?.reset()}
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            type="button"
            className={buttonClass}
            aria-label={expanded ? "Exit fullscreen" : "Enter fullscreen"}
            title="Fullscreen"
            onClick={toggleFullscreen}
          >
            {expanded ? (
              <Minimize2 className="size-4" />
            ) : (
              <Maximize2 className="size-4" />
            )}
          </button>
        </div>
        {phase === "ready" && (
          <div
            className="absolute bottom-3 left-3 grid grid-cols-3 gap-1"
            aria-label="Move through the world"
          >
            <span />
            <button
              type="button"
              className={buttonClass}
              aria-label="Move forward"
              onClick={() => viewer.current?.move(0.5, 0)}
            >
              <ArrowUp className="size-4" />
            </button>
            <span />
            <button
              type="button"
              className={buttonClass}
              aria-label="Move left"
              onClick={() => viewer.current?.move(0, -0.5)}
            >
              <ArrowLeft className="size-4" />
            </button>
            <button
              type="button"
              className={buttonClass}
              aria-label="Move backward"
              onClick={() => viewer.current?.move(-0.5, 0)}
            >
              <ArrowDown className="size-4" />
            </button>
            <button
              type="button"
              className={buttonClass}
              aria-label="Move right"
              onClick={() => viewer.current?.move(0, 0.5)}
            >
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
      <p
        id={helpId}
        className="mt-2 text-xs leading-relaxed text-muted-foreground"
      >
        Drag to rotate · Scroll or pinch to zoom · Right-drag or two-finger drag
        to pan. Click the scene, then use WASD or arrow keys to move; Q/E move
        down/up. R resets the view.
      </p>
      {fullscreenError && (
        <p className="mt-2 text-xs text-muted-foreground" role="status">
          Fullscreen is unavailable in this browser. You can still explore the
          preview here.
        </p>
      )}
    </div>
  );
}

export function WorldPreview({
  world,
  thumbnailUrl,
}: {
  world: World;
  thumbnailUrl?: string;
}) {
  const splats = world.splatUrls || [];
  const initial =
    splats.find((item) => item.label === "500k") ||
    splats.find((item) => item.label === "150k") ||
    splats.find((item) => item.label === "100k") ||
    splats[0];
  const [selected, setSelected] = useState(initial?.url || "");
  const [view, setView] = useState<"3d" | "panorama">(
    initial ? "3d" : "panorama",
  );
  const qualityId = useId();
  const pano = world.panoUrl || thumbnailUrl;

  return (
    <section className="space-y-3" aria-label="Generated world preview">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="flex gap-1 rounded-full border border-border bg-background/50 p-1"
          aria-label="Preview mode"
        >
          {initial && (
            <button
              type="button"
              aria-pressed={view === "3d"}
              onClick={() => setView("3d")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${view === "3d" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              3D world
            </button>
          )}
          {pano && (
            <button
              type="button"
              aria-pressed={view === "panorama"}
              onClick={() => setView("panorama")}
              className={`rounded-full px-4 py-1.5 text-xs font-medium ${view === "panorama" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Panorama
            </button>
          )}
        </div>
        {view === "3d" && splats.length > 1 && (
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor={qualityId} className="text-muted-foreground">
              Preview detail
            </label>
            <select
              id={qualityId}
              value={selected}
              onChange={(event) => setSelected(event.target.value)}
              className="max-w-36 rounded-lg border border-border bg-background px-2 py-2 text-foreground"
            >
              {splats.map((item) => (
                <option key={item.label} value={item.url}>
                  {item.label === "full_res"
                    ? "Full resolution"
                    : `${item.label} splats`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      {view === "3d" && selected ? (
        <InteractiveWorld key={selected} world={world} url={selected} />
      ) : (
        pano && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pano}
            alt="Your generated world panorama"
            className="w-full rounded-xl border border-border object-contain"
          />
        )
      )}
    </section>
  );
}
