/* eslint-disable react/no-unknown-property */
import * as THREE from "three";
import { useRef, useState, useEffect, memo, type ReactNode } from "react";
import { Canvas, createPortal, useFrame, useThree } from "@react-three/fiber";
import { useFBO, useGLTF, MeshTransmissionMaterial } from "@react-three/drei";
import { easing } from "maath";

/**
 * FluidGlass — a real refractive glass lens (three.js) that follows the
 * pointer over whatever sits behind it. Mount only behind <ClientOnly>-style
 * lazy boundaries; it is decorative and inert to assistive tech.
 */
export default function FluidGlass({
  children,
  scale = 0.22,
  ior = 1.15,
  thickness = 5,
  chromaticAberration = 0.1,
  anisotropy = 0.01,
  background = "#0d1a12",
}: {
  children?: ReactNode;
  scale?: number;
  ior?: number;
  thickness?: number;
  chromaticAberration?: number;
  anisotropy?: number;
  background?: string;
}) {
  return (
    <Canvas camera={{ position: [0, 0, 20], fov: 15 }} gl={{ alpha: true, antialias: true }}>
      <Lens
        modeProps={{ scale, ior, thickness, chromaticAberration, anisotropy }}
        background={background}
      >
        {children}
      </Lens>
    </Canvas>
  );
}

const Lens = memo(function Lens({
  children,
  modeProps,
  background,
}: {
  children?: ReactNode;
  modeProps: Record<string, number>;
  background: string;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const { nodes } = useGLTF("/assets/3d/lens.glb") as unknown as {
    nodes: Record<string, THREE.Mesh>;
  };
  const buffer = useFBO();
  const [scene] = useState(() => new THREE.Scene());
  const geoWidthRef = useRef(1);

  useEffect(() => {
    const geo = nodes.Cylinder?.geometry;
    if (!geo) return;
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    geoWidthRef.current = bb.max.x - bb.min.x || 1;
  }, [nodes]);

  useFrame((state, delta) => {
    const { gl, viewport, pointer, camera } = state;
    if (!ref.current) return;
    const v = viewport.getCurrentViewport(camera, [0, 0, 15]);
    const destX = (pointer.x * v.width) / 2;
    const destY = (pointer.y * v.height) / 2;
    easing.damp3(ref.current.position, [destX, destY, 15], 0.15, delta);

    gl.setRenderTarget(buffer);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.setClearColor(new THREE.Color(background), 1);
  });

  const { scale, ior, thickness, anisotropy, chromaticAberration } = modeProps;

  return (
    <>
      {createPortal(children, scene)}
      <mesh scale={[viewportScale(), viewportScale(), viewportScale()]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial map={buffer.texture} transparent />
      </mesh>
      <mesh
        ref={ref}
        scale={scale}
        rotation-x={Math.PI / 2}
        geometry={nodes.Cylinder?.geometry}
      >
        <MeshTransmissionMaterial
          buffer={buffer.texture}
          ior={ior}
          thickness={thickness}
          anisotropy={anisotropy}
          chromaticAberration={chromaticAberration}
        />
      </mesh>
    </>
  );
});

function viewportScale() {
  return 1;
}

useGLTF.preload("/assets/3d/lens.glb");
