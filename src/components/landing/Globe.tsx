'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function GeoFenceMarker({ position, color = '#00d4ff' }: { position: [number, number, number]; color?: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2) * 0.15);
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 1.5) * 0.3);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 + Math.sin(clock.elapsedTime * 2) * 0.2;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.03, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.07, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function GlobeGrid() {
  const points = useMemo(() => {
    const pts: THREE.Vector3[][] = [];
    // Latitude lines
    for (let lat = -60; lat <= 60; lat += 30) {
      const line: THREE.Vector3[] = [];
      for (let lng = 0; lng <= 360; lng += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -1.52 * Math.sin(phi) * Math.cos(theta);
        const y = 1.52 * Math.cos(phi);
        const z = 1.52 * Math.sin(phi) * Math.sin(theta);
        line.push(new THREE.Vector3(x, y, z));
      }
      pts.push(line);
    }
    // Longitude lines
    for (let lng = 0; lng < 360; lng += 30) {
      const line: THREE.Vector3[] = [];
      for (let lat = -90; lat <= 90; lat += 5) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lng + 180) * (Math.PI / 180);
        const x = -1.52 * Math.sin(phi) * Math.cos(theta);
        const y = 1.52 * Math.cos(phi);
        const z = 1.52 * Math.sin(phi) * Math.sin(theta);
        line.push(new THREE.Vector3(x, y, z));
      }
      pts.push(line);
    }
    return pts;
  }, []);

  return (
    <>
      {points.map((linePoints, i) => (
        <Line key={i} points={linePoints} color="#1a2a50" lineWidth={0.5} transparent opacity={0.4} />
      ))}
    </>
  );
}

function GlobeMesh() {
  const globeRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (globeRef.current) {
      globeRef.current.rotation.y = clock.elapsedTime * 0.08;
    }
  });

  // Convert lat/lng to 3D sphere position
  const latLngToVector = (lat: number, lng: number, radius: number): [number, number, number] => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return [
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    ];
  };

  const markers = [
    { lat: 19.076, lng: 72.8777, color: '#00d4ff' },   // Mumbai
    { lat: 28.6139, lng: 77.209, color: '#4f7dff' },    // Delhi
    { lat: 13.0827, lng: 80.2707, color: '#a855f7' },   // Chennai
    { lat: 22.5726, lng: 88.3639, color: '#22c55e' },   // Kolkata
    { lat: 12.9716, lng: 77.5946, color: '#f97316' },   // Bangalore
    { lat: 17.385, lng: 78.4867, color: '#00d4ff' },    // Hyderabad
    { lat: 23.0225, lng: 72.5714, color: '#4f7dff' },   // Ahmedabad
    { lat: 26.9124, lng: 75.7873, color: '#a855f7' },   // Jaipur
  ];

  return (
    <group ref={globeRef}>
      {/* Globe shell */}
      <Sphere args={[1.5, 64, 64]}>
        <meshPhongMaterial
          color="#0a1628"
          transparent
          opacity={0.85}
          shininess={10}
        />
      </Sphere>

      {/* Inner glow */}
      <Sphere args={[1.48, 64, 64]}>
        <meshBasicMaterial color="#0d1f3c" transparent opacity={0.3} />
      </Sphere>

      {/* Grid lines */}
      <GlobeGrid />

      {/* Geo-fence markers */}
      {markers.map((m, i) => (
        <GeoFenceMarker
          key={i}
          position={latLngToVector(m.lat, m.lng, 1.52)}
          color={m.color}
        />
      ))}
    </group>
  );
}

export default function Globe() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        camera={{ position: [0, 1, 4], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={0.6} color="#4f7dff" />
        <directionalLight position={[-5, -2, -5]} intensity={0.3} color="#00d4ff" />
        <pointLight position={[0, 0, 0]} intensity={0.5} color="#1a3a6a" />

        <GlobeMesh />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          maxPolarAngle={Math.PI * 0.7}
          minPolarAngle={Math.PI * 0.3}
        />
      </Canvas>
    </div>
  );
}
