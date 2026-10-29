"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useAspect, useTexture } from "@react-three/drei";
import { Component, Suspense, useMemo, useRef, type ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, ArrowDown } from "lucide-react";
import * as THREE from "three";

const TEXTUREMAP = { src: "/neural-surface.png" };
const DEPTHMAP = { src: "/neural-depth.webp" };

const WIDTH = 300;
const HEIGHT = 300;

const Scene = () => {
  const [rawMap, depthMap] = useTexture([TEXTUREMAP.src, DEPTHMAP.src]);
  const meshRef = useRef<THREE.Mesh>(null);

  const material = useMemo(() => {
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform sampler2D uDepthMap;
      uniform vec2 uPointer;
      uniform float uProgress;
      uniform float uTime;
      varying vec2 vUv;

      // Simple noise function
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
      }

      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
      }

      void main() {
        vec2 uv = vUv;

        // Depth-based displacement
        float depth = texture2D(uDepthMap, uv).r;
        vec2 displacement = depth * uPointer * 0.01;
        vec2 distortedUv = uv + displacement;

        // Base texture
        vec4 baseColor = texture2D(uTexture, distortedUv);

        // Create scanning effect
        float aspect = ${WIDTH}.0 / ${HEIGHT}.0;
        vec2 tUv = vec2(uv.x * aspect, uv.y);
        vec2 tiling = vec2(120.0);
        vec2 tiledUv = mod(tUv * tiling, 2.0) - 1.0;

        float brightness = noise(tUv * tiling * 0.5);
        float dist = length(tiledUv);
        float dot = smoothstep(0.5, 0.49, dist) * brightness;

        // Flow effect based on progress
        float flow = 1.0 - smoothstep(0.0, 0.02, abs(depth - uProgress));

        // Red scanning overlay
        vec3 mask = vec3(dot * flow * 10.0, 0.0, 0.0);

        // Combine effects
        vec3 final = baseColor.rgb + mask;

        gl_FragColor = vec4(final, 1.0);
      }
    `;

    return new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: rawMap },
        uDepthMap: { value: depthMap },
        uPointer: { value: new THREE.Vector2(0, 0) },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader,
      fragmentShader,
    });
  }, [rawMap, depthMap]);

  const [w, h] = useAspect(WIDTH, HEIGHT);

  useFrame(({ clock, pointer }) => {
    if (material.uniforms) {
      material.uniforms.uProgress.value =
        Math.sin(clock.getElapsedTime() * 0.5) * 0.5 + 0.5;
      material.uniforms.uPointer.value = pointer;
      material.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const scaleFactor = 0.3;
  return (
    <mesh
      ref={meshRef}
      scale={[w * scaleFactor, h * scaleFactor, 1]}
      material={material}
    >
      <planeGeometry />
    </mesh>
  );
};

class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
export const Hero3DWebGL = () => (
  <section className="genie-hero" aria-labelledby="hero-title">
    <div className="hero-visual" aria-hidden="true">
      <SceneBoundary>
        <Suspense fallback={null}>
          <Canvas
            flat
            gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
            camera={{ position: [0, 0, 1] }}
            dpr={[1, 1.5]}
          >
            <Scene />
          </Canvas>
        </Suspense>
      </SceneBoundary>
    </div>
    <div className="hero-shade" />
    <div className="shell hero-content">
      <p className="eyebrow">
        <span className="signal-dot" /> IMAGE → WORLD / CREATIVE STUDIO
      </p>
      <h1 id="hero-title">
        Genie 4 AI{" "}
        <span>
          A world beyond
          <br />
          the frame.
        </span>
      </h1>
      <p className="hero-description">
        Turn an image or a written idea into an explorable 3D world. Create with
        World Labs Marble, preview in your browser, and take the assets with
        you.
      </p>
      <div className="hero-actions">
        <Link className="action" href="/studio">
          Create a world <ArrowUpRight size={18} />
        </Link>
        <Link className="text-link" href="#pricing">
          Explore plans <ArrowDown size={15} />
        </Link>
      </div>
      <p className="hero-disclosure">
        Independent world-building studio. Not affiliated with Google DeepMind.
        <br />
        Generation uses Marble 1.1, not the Google Genie model.
      </p>
    </div>
    <div className="hero-bottom shell">
      <span>01 / IMAGINATION, IN DIMENSION</span>
      <span>WORLD LABS MARBLE 1.1</span>
    </div>
  </section>
);
export default Hero3DWebGL;
