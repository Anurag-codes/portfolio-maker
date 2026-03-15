import * as THREE from "three";
import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Text, Environment } from "@react-three/drei";
import { EffectComposer, N8AO, Bloom } from "@react-three/postprocessing";
import { usePortfolio } from "../context/PortfolioContext";

// ─── Orbital ring configs: radius, speed (rad/s), inclination (rad) ──────────
const RING_CONFIGS = [
  { radius: 4.2, speed: 0.32, inclination: 0.18 },
  { radius: 6.6, speed: 0.20, inclination: 0.72 },
  { radius: 9.0, speed: 0.13, inclination: -0.42 },
];

interface SkillData {
  name: string;
  image_url: string;
  order: number;
}

interface OrbData extends SkillData {
  radius: number;
  speed: number;
  inclination: number;
  offset: number;
  brightness: number;
}

function buildOrbitData(skills: SkillData[], brightness: number): OrbData[] {
  return skills.map((skill, i) => {
    const ringIdx = i % RING_CONFIGS.length;
    const ring = RING_CONFIGS[ringIdx];
    const countInRing = Math.ceil(skills.length / RING_CONFIGS.length);
    const posInRing = Math.floor(i / RING_CONFIGS.length);
    return {
      ...skill,
      ...ring,
      offset: (posInRing / (countInRing || 1)) * Math.PI * 2,
      brightness,
    };
  });
}

// ─── Pulsing sun at center ────────────────────────────────────────────────────
function Sun() {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.35;
      const pulse = 1 + Math.sin(clock.getElapsedTime() * 1.8) * 0.06;
      ref.current.scale.setScalar(pulse);
    }
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[1.1, 32, 32]} />
      <meshStandardMaterial
        emissive="#7c3aed"
        emissiveIntensity={3}
        color="#4c1d95"
        roughness={0}
        metalness={0.1}
      />
      <pointLight color="#a78bfa" intensity={8} distance={30} decay={2} />
    </mesh>
  );
}

// ─── Dashed orbital ring guide ────────────────────────────────────────────────
function OrbitRing({ radius, inclination }: { radius: number; inclination: number }) {
  // torus lies in XY plane by default; rotate to match orbit plane
  return (
    <mesh rotation={[Math.PI / 2 + inclination, 0, 0]}>
      <torusGeometry args={[radius, 0.018, 4, 160]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={0.09} />
    </mesh>
  );
}

// ─── One skill: sphere + billboard label ─────────────────────────────────────
const sphereGeo = new THREE.SphereGeometry(0.52, 24, 24);

function SkillOrb({ name, image_url, radius, speed, offset, inclination, brightness }: OrbData) {
  const groupRef = useRef<THREE.Group>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const textRef = useRef<any>(null);

  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    return loader.load(image_url || "/images/react2.webp");
  }, [image_url]);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: texture,
        emissiveMap: texture,
        emissive: "#ffffff",
        emissiveIntensity: 0.45 * brightness,
        metalness: 0.1,
        roughness: 0.75,
        clearcoat: 0.2,
      }),
    [texture, brightness]
  );

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime() * speed + offset;
    // Orbit in a tilted plane (inclined around X-axis)
    const x = Math.cos(t) * radius;
    const y = -Math.sin(t) * radius * Math.sin(inclination);
    const z = Math.sin(t) * radius * Math.cos(inclination);

    if (groupRef.current) groupRef.current.position.set(x, y, z);
    // Billboard: text always faces camera
    if (textRef.current) textRef.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={sphereGeo} material={material} castShadow />
      <Text
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={textRef as any}
        position={[0, -0.88, 0]}
        fontSize={0.22}
        color="#e8e8f0"
        anchorX="center"
        anchorY="top"
        outlineColor="#000000"
        outlineWidth={0.018}
        renderOrder={1}
      >
        {name}
      </Text>
    </group>
  );
}

// ─── Main exported component ──────────────────────────────────────────────────
const TechStack = () => {
  const { data } = usePortfolio();
  const skills: SkillData[] = data?.techstack_images ?? [];
  const brightness = data?.techstack_brightness ?? 1.0;
  const orbData = useMemo(() => buildOrbitData(skills, brightness), [skills, brightness]);

  return (
    <div className="techstack">
      <h2>My Techstack</h2>
      <Canvas
        shadows
        camera={{ position: [0, 9, 22], fov: 44, near: 1, far: 200 }}
        gl={{ alpha: true, antialias: true }}
        onCreated={(state) => {
          state.gl.toneMappingExposure = 1.0 + brightness * 0.4;
          state.camera.lookAt(0, -3, 0);
        }}
        className="tech-canvas"
      >
        <ambientLight intensity={0.25} />
        <directionalLight position={[10, 10, 5]} intensity={0.6} />

        {/* Central sun */}
        <Sun />

        {/* Orbital ring guides — always show all 3 */}
        {RING_CONFIGS.map((ring, i) => (
          <OrbitRing key={i} radius={ring.radius} inclination={ring.inclination} />
        ))}

        {/* Skill orbs */}
        {orbData.map((orb, i) => (
          <SkillOrb key={`${orb.name}-${i}`} {...orb} />
        ))}

        <Environment
          files="/models/char_enviorment.hdr"
          environmentIntensity={0.4}
          environmentRotation={[0, 4, 2]}
        />
        <EffectComposer enableNormalPass={false}>
          <N8AO color="#0f002c" aoRadius={2} intensity={1.1} />
          <Bloom
            luminanceThreshold={0.4}
            luminanceSmoothing={0.25}
            intensity={0.5 + brightness * 0.5}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default TechStack;

