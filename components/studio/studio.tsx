"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { Upload, ArrowUpRight, Box, Loader2 } from "lucide-react";
import { api, useAccount } from "@/components/site-provider";
import type { WorldJob } from "@/lib/generation-types";
import { WorldPreview } from "./world-preview";
export function Studio() {
  const { account, refresh, loading } = useAccount(),
    [mode, setMode] = useState<"image" | "text">("image"),
    [prompt, setPrompt] = useState(""),
    [image, setImage] = useState(""),
    [fileName, setFileName] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [job, setJob] = useState<WorldJob | null>(null);
  const jobId = job?.operationId,
    jobStatus = job?.status;
  useEffect(() => {
    if (!jobId || !jobStatus || !["pending", "uncertain"].includes(jobStatus))
      return;
    let stopped = false;
    const timer = setInterval(async () => {
      try {
        const data = await api(`/api/status?id=${encodeURIComponent(jobId)}`);
        if (!stopped) {
          setJob(data);
          if (data.status !== "pending") void refresh();
        }
      } catch {}
    }, 9000);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [jobId, jobStatus, refresh]);
  async function upload(file?: File) {
    setError("");
    if (!file) return;
    if (
      !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      file.size > 3145728
    ) {
      setError("Choose a JPG, PNG or WebP image of up to 3 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setFileName(file.name);
    };
    reader.onerror = () => setError("The image could not be read.");
    reader.readAsDataURL(file);
  }
  async function generate(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const requestId = crypto.randomUUID();
    try {
      setJob(
        await api("/api/generate", {
          requestId,
          mode,
          prompt,
          ...(mode === "image" ? { imageDataUrl: image } : {}),
        }),
      );
      await refresh();
    } catch (e) {
      setError(
        `${e instanceof Error ? e.message : "Submission could not be confirmed."} Check your job history before submitting again.`,
      );
      await refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">GENIE 4 AI / WORLD STUDIO</p>
          <h1>
            Give your idea
            <br />a place to exist.
          </h1>
        </div>
        <div className="studio-balance">
          <strong>{account?.generationsRemaining || 0}</strong>
          <span>
            generations available
            <br />
            <Link href="/account">Manage credits ↗</Link>
          </span>
        </div>
      </div>
      {!loading && !account?.user && (
        <p className="notice">
          <Link href="/account">Create an account or sign in ↗</Link> to choose
          a plan and generate worlds.
        </p>
      )}
      {account && !account.serviceAvailable && (
        <p className="notice" role="status">
          World generation is temporarily unavailable. New generations and
          purchases are paused. Your existing worlds remain accessible.
        </p>
      )}
      <div className="studio-layout">
        <form className="studio-input" onSubmit={generate}>
          <div className="billing-switch">
            <button
              type="button"
              aria-pressed={mode === "image"}
              onClick={() => setMode("image")}
            >
              Image to world
            </button>
            <button
              type="button"
              aria-pressed={mode === "text"}
              onClick={() => setMode("text")}
            >
              Text to world
            </button>
          </div>
          {mode === "image" && (
            <label className="upload-zone" htmlFor="world-image">
              {image ? (
                <>
                  <Image
                    unoptimized
                    width={600}
                    height={300}
                    src={image}
                    alt="Your selected world source"
                  />
                  <span>{fileName} · Choose another</span>
                </>
              ) : (
                <>
                  <Upload size={28} />
                  <strong>Start with a single frame</strong>
                  <span>Choose JPG, PNG or WebP · Max 3 MB</span>
                </>
              )}
              <input
                id="world-image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => upload(e.target.files?.[0])}
              />
            </label>
          )}
          <label>
            Describe the world{" "}
            {mode === "image" && <span className="muted">(optional)</span>}
            <textarea
              rows={5}
              maxLength={1500}
              placeholder="A quiet courtyard after rain, warm light spilling through tall windows…"
              value={prompt}
              required={mode === "text"}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>
          <p className="fine">
            Use images you own or have permission to use. Avoid sensitive
            personal information. Your input is sent to World Labs.
          </p>
          <button
            className="action"
            disabled={
              busy ||
              loading ||
              !account?.user ||
              !account.serviceAvailable ||
              (account.balanceCents || 0) < 500 ||
              (mode === "image" && !image)
            }
          >
            {busy ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Submitting once…
              </>
            ) : (
              <>
                Generate world <ArrowUpRight size={17} />
              </>
            )}
          </button>
          <p className="fine">
            Uses $5 generation credits · Confirmed failures restore credits.
            <br />
            Generation may take several minutes. Keep your job ID.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </form>
        <div className="studio-output" aria-live="polite">
          {!job ? (
            <div className="world-empty">
              <div className="wire-cube">
                <Box size={88} strokeWidth={0.55} />
              </div>
              <p className="eyebrow">A PLACE WAITING TO HAPPEN</p>
              <h2>
                Your next world
                <br />
                starts here.
              </h2>
              <p>
                Generate a scene, then explore it in 3D
                <br />
                and download the available assets.
              </p>
              <span>POWERED BY WORLD LABS MARBLE 1.1</span>
            </div>
          ) : (
            <>
              <div className="job-heading">
                <span className="eyebrow">
                  {job.status === "completed"
                    ? "YOUR WORLD IS READY"
                    : job.status === "pending"
                      ? "BUILDING YOUR WORLD"
                      : job.status.toUpperCase()}
                </span>
                <span className="job-id">{job.operationId.slice(0, 8)}</span>
              </div>
              {job.status === "completed" ? (
                <>
                  <WorldPreview
                    key={job.operationId}
                    world={{
                      splatUrls: job.splats,
                      panoUrl: job.panoramaUrl,
                      colliderMeshUrl: job.colliderUrl,
                      flipY: job.flipY,
                      metricScale: job.metricScale,
                    }}
                    thumbnailUrl={job.thumbnailUrl}
                  />
                  <div className="downloads">
                    {[
                      ...(job.splats || []).map((s) => ({
                        label: `SPZ ${s.label}`,
                        url: s.url,
                      })),
                      ...(job.panoramaUrl
                        ? [{ label: "Panorama", url: job.panoramaUrl }]
                        : []),
                      ...(job.colliderUrl
                        ? [{ label: "Collider mesh", url: job.colliderUrl }]
                        : []),
                    ].map((a) => (
                      <a
                        className="asset-link"
                        key={a.url}
                        href={a.url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {a.label} ↗
                      </a>
                    ))}
                  </div>
                  <p className="fine">
                    Download assets you want to keep. Provider links may expire.
                    AI-generated geometry can contain artifacts.
                  </p>
                </>
              ) : (
                <div className="world-empty">
                  {job.status === "pending" && (
                    <Loader2 className="animate-spin" size={32} />
                  )}
                  <h2>
                    {job.status === "pending"
                      ? "A world is taking shape."
                      : job.status === "uncertain"
                        ? "Submission needs review."
                        : "This world could not finish."}
                  </h2>
                  <p>
                    {job.error ||
                      "You can leave this page and open this job again from your history."}
                  </p>
                  <p className="fine">Job ID: {job.operationId}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <section className="job-history">
        <div className="section-heading">
          <h2>Your worlds</h2>
          <button className="text-link" onClick={() => refresh()}>
            Refresh history ↻
          </button>
        </div>
        {!account?.jobs?.length ? (
          <p className="muted">Your submitted worlds will appear here.</p>
        ) : (
          <div className="history-grid">
            {account.jobs.map((item) => (
              <button
                key={item.operationId}
                className={`history-item ${item.operationId === job?.operationId ? "selected" : ""}`}
                onClick={() => setJob(item)}
              >
                {item.thumbnailUrl ? (
                  <Image
                    unoptimized
                    width={55}
                    height={50}
                    src={item.thumbnailUrl}
                    alt="Generated world thumbnail"
                  />
                ) : (
                  <Box size={24} />
                )}
                <span>
                  <strong>
                    {new Date(item.createdAt || "").toLocaleString()}
                  </strong>
                  <small>
                    {item.status} · {item.operationId.slice(0, 8)}
                    {item.refunded ? " · credits restored" : ""}
                  </small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
