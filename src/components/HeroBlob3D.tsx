"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { MeshDistortMaterial, Sphere } from "@react-three/drei";
import type { Mesh } from "three";

function AnimatedBlob() {
  const meshRef = useRef<Mesh>(null);
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useFrame((_, delta) => {
    if (reduceMotion || !meshRef.current) return;
    meshRef.current.rotation.x += delta * 0.09;
    meshRef.current.rotation.y += delta * 0.14;
  });

  return (
    <Sphere ref={meshRef} args={[1.4, 96, 96]}>
      <MeshDistortMaterial
        color="#c026d3"
        attach="material"
        distort={0.55}
        speed={reduceMotion ? 0 : 2.2}
        roughness={0.35}
        metalness={0.05}
        transparent
        opacity={0.55}
      />
    </Sphere>
  );
}

/**
 * Purely decorative — a slowly-morphing gradient-lit blob behind the hero
 * copy, layered on top of the existing CSS glow as a progressive
 * enhancement (see page.tsx: only mounted client-side, lg+ only, and this
 * component itself is the thing dynamic-imported with ssr:false so a
 * WebGL failure can never break the server-rendered page underneath it).
 */
export function HeroBlob3D() {
  return (
    <Canvas
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      camera={{ position: [0, 0, 4.8], fov: 40 }}
      className="pointer-events-none"
    >
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 3, 3]} intensity={1.8} color="#f472b6" />
      <directionalLight position={[-3, -2, 2]} intensity={1.4} color="#fb923c" />
      <pointLight position={[0, 0, 3]} intensity={0.6} color="#e879f9" />
      <Suspense fallback={null}>
        <AnimatedBlob />
      </Suspense>
    </Canvas>
  );
}
