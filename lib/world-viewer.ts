import * as THREE from "three";
import { SparkRenderer, SplatMesh } from "@sparkjsdev/spark";

interface ViewerOptions {
  url: string;
  flipY?: boolean;
  metricScale?: number;
  onProgress: (message: string) => void;
  onReady: () => void;
  onError: () => void;
}

/** Loaded only when a completed world is opened in the 3D tab. */
export function createWorldViewer(
  host: HTMLDivElement,
  options: ViewerOptions,
) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x111318);
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    "Interactive 3D world. Drag to rotate, scroll to zoom, right-drag to pan. Use W A S D to move and R to reset.",
  );
  canvas.className =
    "h-full w-full touch-none outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";
  host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.01, 1000);
  let spark: SparkRenderer;
  try {
    spark = new SparkRenderer({ renderer });
  } catch (error) {
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    throw error;
  }
  scene.add(spark);
  let yaw = 0;
  let pitch = 0;
  const rotation = new THREE.Euler(0, 0, 0, "YXZ");
  const reset = () => {
    camera.position.set(0, 0, 0);
    yaw = 0;
    pitch = 0;
    camera.quaternion.setFromEuler(rotation.set(0, 0, 0));
    camera.fov = 70;
    camera.updateProjectionMatrix();
  };
  reset();

  let disposed = false;
  let failed = false;
  let loaded = false;
  let visible = true;
  let splats: SplatMesh | undefined;
  const controller = new AbortController();
  const keys = new Set<string>();
  const direction = new THREE.Vector3();
  const right = new THREE.Vector3();
  const motion = new THREE.Vector3();
  const move = (forward: number, sideways: number, vertical = 0) => {
    camera.getWorldDirection(direction);
    right.crossVectors(direction, camera.up).normalize();
    motion
      .copy(direction)
      .multiplyScalar(forward)
      .addScaledVector(right, sideways);
    motion.y += vertical;
    camera.position.add(motion);
  };
  const zoom = (closer: boolean) => {
    camera.fov = THREE.MathUtils.clamp(camera.fov + (closer ? -8 : 8), 25, 100);
    camera.updateProjectionMatrix();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    const key = event.key.toLowerCase();
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "q",
        "e",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
        "r",
        "+",
        "-",
        "=",
      ].includes(key)
    ) {
      event.preventDefault();
      if (key === "r") reset();
      else if (key === "+" || key === "=") zoom(true);
      else if (key === "-") zoom(false);
      else keys.add(key);
    }
  };
  const onKeyUp = (event: KeyboardEvent) =>
    keys.delete(event.key.toLowerCase());
  const clearKeys = () => {
    keys.clear();
    pointers.clear();
  };
  const focusCanvas = () => canvas.focus({ preventScroll: true });
  // Rotate at the viewer's position, instead of orbiting through nearby walls.
  const pointers = new Map<number, { x: number; y: number; pan: boolean }>();
  const pan = (dx: number, dy: number) => {
    camera.position.add(
      new THREE.Vector3(-dx * 0.006, dy * 0.006, 0).applyQuaternion(
        camera.quaternion,
      ),
    );
  };
  const pointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.button !== 2) return;
    event.preventDefault();
    focusCanvas();
    canvas.setPointerCapture(event.pointerId);
    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      pan: event.button === 2 || event.shiftKey,
    });
  };
  const pointerMove = (event: PointerEvent) => {
    const previous = pointers.get(event.pointerId);
    if (!previous) return;
    const before = Array.from(pointers.values());
    const next = { ...previous, x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, next);
    if (pointers.size === 1) {
      const dx = next.x - previous.x,
        dy = next.y - previous.y;
      if (previous.pan) pan(dx, dy);
      else {
        yaw -= dx * 0.004;
        pitch = THREE.MathUtils.clamp(
          pitch - dy * 0.004,
          -Math.PI / 2 + 0.01,
          Math.PI / 2 - 0.01,
        );
        camera.quaternion.setFromEuler(rotation.set(pitch, yaw, 0));
      }
    } else if (pointers.size === 2) {
      const after = Array.from(pointers.values());
      const distance = (points: typeof before) =>
        Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
      const oldDistance = distance(before),
        newDistance = distance(after);
      if (oldDistance > 1 && newDistance > 1) {
        camera.fov = THREE.MathUtils.clamp(
          (camera.fov * oldDistance) / newDistance,
          25,
          100,
        );
        camera.updateProjectionMatrix();
      }
      pan(
        (after[0].x + after[1].x - before[0].x - before[1].x) / 2,
        (after[0].y + after[1].y - before[0].y - before[1].y) / 2,
      );
    }
  };
  const pointerUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (canvas.hasPointerCapture(event.pointerId))
      canvas.releasePointerCapture(event.pointerId);
  };
  const preventMenu = (event: Event) => event.preventDefault();
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    camera.fov = THREE.MathUtils.clamp(
      camera.fov + event.deltaY * (event.deltaMode === 1 ? 1 : 0.04),
      25,
      100,
    );
    camera.updateProjectionMatrix();
  };
  const fail = () => {
    if (disposed || failed) return;
    failed = true;
    controller.abort();
    renderer.setAnimationLoop(null);
    options.onError();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    fail();
  };
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("keyup", onKeyUp);
  canvas.addEventListener("blur", clearKeys);
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("lostpointercapture", pointerUp);
  canvas.addEventListener("contextmenu", preventMenu);
  canvas.addEventListener("wheel", wheel, { passive: false });
  canvas.addEventListener("webglcontextlost", onContextLost);
  window.addEventListener("blur", clearKeys);

  const resize = () => {
    const width = Math.max(host.clientWidth, 1);
    const height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  resize();
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) clearKeys();
  });
  visibilityObserver.observe(host);
  let previousTime = 0;
  renderer.setAnimationLoop((time) => {
    const delta = Math.min((time - previousTime) / 1000, 0.05);
    previousTime = time;
    if (disposed || failed || !loaded || !visible || document.hidden) return;
    const forward =
      Number(keys.has("w") || keys.has("arrowup")) -
      Number(keys.has("s") || keys.has("arrowdown"));
    const sideways =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft"));
    const vertical = Number(keys.has("e")) - Number(keys.has("q"));
    if (forward || sideways || vertical)
      move(forward * delta * 2, sideways * delta * 2, vertical * delta * 2);
    try {
      renderer.render(scene, camera);
    } catch {
      fail();
    }
  });

  const load = async () => {
    const response = await fetch(options.url, {
      signal: controller.signal,
      credentials: "omit",
    });
    if (!response.ok || !response.body)
      throw new Error("World asset unavailable");
    const total = Number(response.headers.get("content-length") || 0);
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    let lastProgress = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.byteLength;
      if (Date.now() - lastProgress > 200) {
        options.onProgress(
          total
            ? `Loading 3D world · ${Math.min(100, Math.round((received / total) * 100))}%`
            : `Loading 3D world · ${(received / 1048576).toFixed(1)} MB`,
        );
        lastProgress = Date.now();
      }
    }
    if (disposed) return;
    options.onProgress("Preparing your 3D world…");
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    chunks.length = 0;
    const mesh = new SplatMesh({
      fileBytes: bytes,
      fileName: "world.spz",
      raycastable: false,
    });
    splats = mesh;
    if (options.flipY !== false) mesh.quaternion.set(1, 0, 0, 0);
    mesh.scale.setScalar(options.metricScale || 1);
    await mesh.initialized;
    if (disposed || failed) {
      mesh.dispose();
      return;
    }
    if (!mesh.numSplats) throw new Error("Empty world asset");
    scene.add(mesh);
    loaded = true;
    clearTimeout(loadTimeout);
    options.onReady();
  };
  const loadTimeout = window.setTimeout(() => {
    controller.abort();
    fail();
  }, 90_000);
  void load().catch(() => {
    if (!disposed) fail();
  });

  return {
    reset,
    zoom,
    move,
    dispose() {
      if (disposed) return;
      disposed = true;
      controller.abort();
      clearTimeout(loadTimeout);
      renderer.setAnimationLoop(null);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("blur", clearKeys);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerUp);
      canvas.removeEventListener("pointercancel", pointerUp);
      canvas.removeEventListener("lostpointercapture", pointerUp);
      canvas.removeEventListener("contextmenu", preventMenu);
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      window.removeEventListener("blur", clearKeys);
      if (splats?.isInitialized) splats.dispose();
      spark.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

export type WorldViewer = ReturnType<typeof createWorldViewer>;
