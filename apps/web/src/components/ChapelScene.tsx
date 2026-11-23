import { Html, OrbitControls } from '@react-three/drei';
import type { Relative } from '@eulogy/shared';

const PEW_ROWS = 3;
const RELATIVE_SLOTS: [number, number, number][] = [
  [-1.5, 0.6, 1],
  [-0.5, 0.6, 1],
  [0.5, 0.6, 1],
  [1.5, 0.6, 1],
];

export default function ChapelScene({ relatives }: { relatives: Relative[] }) {
  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 6, 22]} />
      <ambientLight intensity={0.35} />
      {/* warm key light over the coffin/pulpit, cool fill from the rose window behind */}
      <spotLight position={[0, 6, -3]} angle={0.5} penumbra={1} intensity={260} color="#ffb870" castShadow />
      <pointLight position={[0, 2.5, 2]} intensity={40} color="#ffd9a8" distance={12} decay={2} />
      <pointLight position={[0, 4, -7]} intensity={60} color="#4a6cff" distance={16} decay={2} />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 20]} />
        <meshStandardMaterial color="#1a1613" roughness={0.9} />
      </mesh>

      {/* pews: 3 rows x 2 sides */}
      {Array.from({ length: PEW_ROWS }).flatMap((_, row) =>
        [-2.2, 2.2].map((x) => (
          <mesh key={`pew-${row}-${x}`} position={[x, 0.3, 1 + row * 1.6]}>
            <boxGeometry args={[2.6, 0.6, 0.5]} />
            <meshStandardMaterial color="#3a2a1e" roughness={0.8} />
          </mesh>
        )),
      )}

      {/* pulpit */}
      <mesh position={[0, 0.7, -4]}>
        <boxGeometry args={[1, 1.4, 0.8]} />
        <meshStandardMaterial color="#4a3727" roughness={0.7} />
      </mesh>

      {/* relatives */}
      {relatives.slice(0, 4).map((r, i) => {
        const pos = RELATIVE_SLOTS[i] ?? [0, 0.6, 1];
        return (
          <group key={r.id} position={pos}>
            <mesh>
              <capsuleGeometry args={[0.22, 0.7, 4, 12]} />
              <meshStandardMaterial color="#8a8a93" roughness={0.6} />
            </mesh>
            <Html position={[0, 0.9, 0]} center>
              <div className="label3d">{r.name}</div>
            </Html>
          </group>
        );
      })}

      <OrbitControls
        target={[0, 0.8, -1]}
        maxPolarAngle={Math.PI / 2.05}
        minDistance={2}
        maxDistance={14}
      />
    </>
  );
}
