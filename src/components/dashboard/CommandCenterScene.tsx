'use client';

import { useRef, useState } from 'react';
import { Canvas, useFrame, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useAction, useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

// Geo-fence zone in 3D
function GeoZone({ position, radius, color, label }: {
    position: [number, number, number];
    radius: number;
    color: string;
    label: string;
}) {
    const ringRef = useRef<THREE.Mesh>(null);
    const pillarRef = useRef<THREE.Mesh>(null);

    useFrame(({ clock }) => {
        if (ringRef.current) {
            ringRef.current.rotation.z = clock.elapsedTime * 0.3;
            const sc = 1 + Math.sin(clock.elapsedTime * 1.5) * 0.05;
            ringRef.current.scale.set(sc, sc, 1);
        }
        if (pillarRef.current) {
            const h = 0.5 + Math.sin(clock.elapsedTime * 2 + position[0]) * 0.15;
            pillarRef.current.scale.y = h;
            pillarRef.current.position.y = h / 2;
        }
    });

    return (
        <group position={position}>
            {/* Base ring */}
            <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                <ringGeometry args={[radius * 0.8, radius, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
            </mesh>

            {/* Pulsing circle */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <circleGeometry args={[radius * 0.8, 64]} />
                <meshBasicMaterial color={color} transparent opacity={0.08} side={THREE.DoubleSide} />
            </mesh>

            {/* Activity pillar */}
            <mesh ref={pillarRef}>
                <cylinderGeometry args={[0.04, 0.04, 1, 8]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} transparent opacity={0.8} />
            </mesh>

            {/* Top dot */}
            <mesh position={[0, 0.8, 0]}>
                <sphereGeometry args={[0.06, 16, 16]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
}

// Ground terrain grid
function TerrainGrid({ onPlaneClick }: { onPlaneClick: (e: ThreeEvent<MouseEvent>) => void }) {
    return (
        <group>
            <gridHelper args={[20, 40, '#1a2a4a', '#0d1a30']} position={[0, 0, 0]} />
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} onClick={onPlaneClick}>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#080d18" />
            </mesh>
        </group>
    );
}

// Particle field
function Particles() {
    const pointsRef = useRef<THREE.Points>(null);
    const count = 200;

    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 16;
        positions[i * 3 + 1] = Math.random() * 3 + 0.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 16;
    }

    useFrame(({ clock }) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y = clock.elapsedTime * 0.02;
        }
    });

    return (
        <points ref={pointsRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[positions, 3]} />
            </bufferGeometry>
            <pointsMaterial size={0.03} color="#4f7dff" transparent opacity={0.4} sizeAttenuation />
        </points>
    );
}

export default function CommandCenterScene() {
    // We map Convex projects into 3D space for the visualization
    const projects = useQuery(api.projects.list) || [];
    // @ts-ignore
    const calculateProximity = useAction(api.geospatial?.calculateProximity || (() => { }));

    const [simulatedCitizen, setSimulatedCitizen] = useState<[number, number, number] | null>(null);
    const [isCalculating, setIsCalculating] = useState(false);

    // Map Mumbai coordinates to our 3D grid (-10 to 10)
    // Mumbai center ~ 19.0760, 72.8777
    const mapTo3D = (lat: number, lng: number): [number, number, number] => {
        const x = (lng - 72.8777) * 100;
        const z = -(lat - 19.0760) * 100;
        return [x, 0, z];
    };

    // Unmap 3D grid back to GPS coordinates for the Geoapify API
    const unmapFrom3D = (x: number, z: number) => {
        const lng = (x / 100) + 72.8777;
        const lat = -(z / 100) + 19.0760;
        return { lat, lng };
    };

    const handlePlaneClick = async (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (isCalculating) return;

        const { x, z } = e.point;
        setSimulatedCitizen([x, 0, z]);

        setIsCalculating(true);
        const { lat, lng } = unmapFrom3D(x, z);

        try {
            // Pick a random citizen ID to simulate a mobile app user
            const citizenId = `user_${Math.floor(Math.random() * 1000)}`;
            const result = await calculateProximity({
                citizenId,
                citizenLat: lat,
                citizenLng: lng
            });

            if (result.triggered) {
                alert("Geo-Fence Triggered! Gemini AI has dispatched an SMS alert. Check your Notifications tab.");
            } else {
                console.log("Citizen is too far from any project (>2km).");
            }
        } catch (error) {
            console.error("Proximity Calculation Failed", error);
        } finally {
            setTimeout(() => {
                setIsCalculating(false);
                setSimulatedCitizen(null);
            }, 3000); // clear the pin after 3s
        }
    };

    return (
        <Canvas
            camera={{ position: [6, 5, 6], fov: 50 }}
            gl={{ antialias: true }}
            style={{ background: '#060a14' }}
        >
            <ambientLight intensity={0.3} />
            <directionalLight position={[5, 8, 5]} intensity={0.5} color="#4f7dff" />
            <pointLight position={[0, 3, 0]} intensity={0.3} color="#00d4ff" />

            <TerrainGrid onPlaneClick={handlePlaneClick} />
            <Particles />

            {/* Render actual projects from Convex as 3D Zones */}
            {projects.map((project, i) => {
                if (!project.location) return null;
                const pos = mapTo3D(project.location.lat, project.location.lng);
                // Color code by status
                const color = project.status === 'active' || project.status === 'in_progress' ? '#00d4ff' : '#22c55e';
                return <GeoZone key={project._id} position={pos} radius={0.8} color={color} label={project.name} />
            })}

            {/* Render Simulation Pin */}
            {simulatedCitizen && (
                <group position={simulatedCitizen}>
                    <mesh position={[0, 0.5, 0]}>
                        <sphereGeometry args={[0.15, 16, 16]} />
                        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} />
                    </mesh>
                    <Html position={[0, 1, 0]} center>
                        <div style={{ background: 'rgba(0,0,0,0.8)', padding: '4px 8px', borderRadius: '4px', color: 'white', fontSize: '10px', whiteSpace: 'nowrap' }}>
                            Simulated Citizen GPS Ping
                            {isCalculating && <span style={{ display: 'block', color: 'var(--accent-cyan)' }}>Calculating routing...</span>}
                        </div>
                    </Html>
                </group>
            )}

            <OrbitControls
                enableZoom={true}
                enablePan={true}
                autoRotate
                autoRotateSpeed={0.5}
                maxPolarAngle={Math.PI / 2.2}
                minDistance={3}
                maxDistance={15}
            />
        </Canvas>
    );
}
