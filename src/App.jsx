import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useRef, useMemo, useEffect, useState } from "react";
import * as THREE from "three";
import { Noise } from "noisejs";

// Initialize Perlin Noise
const noise = new Noise(Math.random());

const width = 50, height = 50, segments = 300;

function ProceduralTerrain({ onUpdate }) {
  const mesh = useRef();
  const frameRef = useRef(0);

  const terrainGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(width, height, segments, segments);
  }, []);

  useFrame(() => {
    const vertices = terrainGeometry.attributes.position.array;
    frameRef.current += 0.01;

    for (let i = 0; i < vertices.length; i += 3) {
      const x = vertices[i] / width;
      const y = vertices[i + 1] / height;
      const timeFactor = frameRef.current;

      const elevation = noise.perlin2(x * 10, y * 10 + timeFactor) * 5;
      vertices[i + 2] = elevation;
    }

    terrainGeometry.attributes.position.needsUpdate = true;
    terrainGeometry.computeVertexNormals();

    if (onUpdate) {
      onUpdate((x, y) => noise.perlin2(x * 10, y * 10 + frameRef.current) * 5);
    }
  });

  return (
    <mesh ref={mesh} geometry={terrainGeometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial color="green" wireframe={false} />
    </mesh>
  );
}

function GrassField({ getTerrainHeight }) {
  const count = 5000; // Lowered count for testing
  const meshRef = useRef(null);

  useEffect(() => {
    if (!meshRef.current || !getTerrainHeight) {
      console.log("GrassField: Mesh or getTerrainHeight not available!");
      return;
    }
    console.log("GrassField: Generating grass...");
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * width;
      const y = (Math.random() - 0.5) * height;
      const z = getTerrainHeight(x / width, y / height) + 0.5; // Increased offset

      dummy.position.set(x, z, y);
      dummy.rotation.y = Math.random() * Math.PI;
      dummy.scale.set(0.2, 1, 0.2); // Increased size
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [getTerrainHeight]);

  return (
    <>
      {/* Single test grass instance */}
      <mesh position={[0, 2, 0]}>
        <boxGeometry args={[0.1, 1, 0.1]} />
        <meshStandardMaterial color="red" />
      </mesh>

      {/* Instanced Grass */}
      <instancedMesh ref={meshRef} args={[null, null, count]}>
        <boxGeometry attach="geometry" args={[0.1, 1, 0.1]} />
        <meshStandardMaterial attach="material" color="lightgreen" />
      </instancedMesh>
    </>
  );
}

export default function App() {
  const [getTerrainHeight, setGetTerrainHeight] = useState(null);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas camera={{ position: [0, 10, 20], fov: 50 }}>
        <ambientLight intensity={0.8} /> {/* Increased Light */}
        <directionalLight position={[10, 20, 10]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <fog attach="fog" args={["#cfcfcf", 10, 50]} />

        <ProceduralTerrain onUpdate={setGetTerrainHeight} />
        {getTerrainHeight && <GrassField getTerrainHeight={getTerrainHeight} />}
        <OrbitControls />
      </Canvas>
    </div>
  );
}
