import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture, Center, Resize } from '@react-three/drei';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { DoubleSide, Group, Object3D, Quaternion, Texture, Vector3 } from 'three';
import type { Profile, Relative } from '@eulogy/shared';

export type Shot = 'wide' | 'pulpit' | 'front_row';
export type Beat = 'approach' | 'speak' | 'return' | 'silence';
type Vec = [number, number, number];
const cameraPositions: Record<Shot, [Vec, Vec]> = {
  wide: [
    [0, 3.1, 9.8],
    [0, 2, -2.2],
  ],
  pulpit: [
    [2.9, 2.15, 1.7],
    [1.35, 1.4, -2.5],
  ],
  front_row: [
    [-0.1, 1.8, -3.65],
    [0, 1.1, 1.5],
  ],
};
function Camera({ shot }: { shot: Shot }) {
  const look = useRef(new Vector3(0, 2, -2.2));
  const [eye, target] = useMemo(
    () => cameraPositions[shot].map((v) => new Vector3(...v)) as [Vector3, Vector3],
    [shot],
  );
  useFrame(({ camera }, dt) => {
    const f = 1 - Math.exp(-3 * dt);
    camera.position.lerp(eye, f);
    look.current.lerp(target, f);
    camera.lookAt(look.current);
  });
  return null;
}
function Monument({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return (
    <group position={[-2.4, 1.0, -3.3]}>
      <Resize scale={0.85}>
        <Center>
          <primitive object={scene} />
        </Center>
      </Resize>
    </group>
  );
}
function Portrait({ url }: { url: string }) {
  const image = useTexture(url);
  return (
    <mesh position={[-2.4, 1.4, -3.22]}>
      <planeGeometry args={[0.65, 0.82]} />
      <meshBasicMaterial map={image} />
    </mesh>
  );
}
function Box({ at, size, color, map }: { at: Vec; size: Vec; color: string; map?: Texture }) {
  return (
    <mesh position={at}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} map={map} roughness={0.76} />
    </mesh>
  );
}
// Both RPM rigs use different local bind rotations. Aim each bone in model space once.
function seatedRig(body: Object3D) {
  const poses: { bone: Object3D; seated: Quaternion; standing: Quaternion }[] = [];
  function point(boneName: string, childName: string, direction: Vec) {
    const bone = body.getObjectByName(boneName);
    const child = body.getObjectByName(childName);
    if (!bone?.parent || !child) return;
    const standing = bone.quaternion.clone();
    const parentWorld = bone.parent.getWorldQuaternion(new Quaternion());
    const inv = parentWorld.clone().invert();
    const from = child
      .getWorldPosition(new Vector3())
      .sub(bone.getWorldPosition(new Vector3()))
      .normalize()
      .applyQuaternion(inv);
    const to = new Vector3(...direction).normalize().applyQuaternion(inv);
    bone.quaternion.premultiply(new Quaternion().setFromUnitVectors(from, to));
    poses.push({ bone, standing, seated: bone.quaternion.clone() });
    bone.updateWorldMatrix(false, true);
  }
  for (const [side, sign] of [
    ['Left', 1],
    ['Right', -1],
  ] as const) {
    point(side + 'UpLeg', side + 'Leg', [sign * 0.1, -0.16, 1]);
    point(side + 'Leg', side + 'Foot', [0, -1, -0.1]);
    point(side + 'Arm', side + 'ForeArm', [sign * 0.13, -1, 0.12]);
    point(side + 'ForeArm', side + 'Hand', [-sign * 0.34, -0.3, 0.9]);
  }
  for (const pose of poses) pose.bone.quaternion.copy(pose.standing);
  body.updateWorldMatrix(false, true);
  return poses;
}
const seats = [-2.65, -1.45, 1.45, 2.65];
function Guest({
  relative,
  index,
  active,
  beat,
}: {
  relative: Relative;
  index: number;
  active: boolean;
  beat: Beat;
}) {
  const file =
    relative.relation === 'cofounder' || relative.relation === 'friend' ? 'visitor' : 'mourner';
  const { scene } = useGLTF('/avatars/' + file + '.glb');
  const body = useMemo(() => clone(scene), [scene]);
  const poses = useMemo(() => seatedRig(body), [body]);
  const head = useMemo(() => body.getObjectByName('Head'), [body]);
  const root = useRef<Group>(null);
  const seat = seats[index] ?? 0;
  const target = useMemo(() => new Vector3(), []);
  useFrame(({ clock }, dt) => {
    if (!root.current) return;
    const standing = active && (beat === 'approach' || beat === 'speak');
    const f = 1 - Math.exp(-4 * dt);
    const t = clock.elapsedTime;
    target.set(standing ? 1.25 : seat, standing ? 0.08 : -0.54, standing ? -2.72 : 1.25);
    root.current.position.lerp(target, f);
    root.current.rotation.y += ((standing ? 0 : Math.PI) - root.current.rotation.y) * f;
    for (const pose of poses) pose.bone.quaternion.slerp(standing ? pose.standing : pose.seated, f);
    if (head) head.rotation.x = standing ? 0.035 * Math.sin(t * 3.6) : 0.2;
  });
  return (
    <group ref={root} position={[seat, -0.54, 1.25]} rotation={[0, Math.PI, 0]}>
      <primitive object={body} dispose={null} />
    </group>
  );
}
export default function ChapelScene({
  profile,
  speaker,
  shot,
  beat,
}: {
  profile: Profile;
  speaker: string;
  shot: Shot;
  beat: Beat;
}) {
  const [rose, floor, wood] = useTexture([
    '/textures/rose.png',
    '/textures/floor.png',
    '/textures/wood.png',
  ]);
  return (
    <>
      <color attach="background" args={['#15151c']} />
      <fog attach="fog" args={['#15151c', 10, 33]} />
      <hemisphereLight args={['#eacfae', '#705b54', 1.25]} />
      <spotLight position={[0, 6, 0]} angle={0.75} penumbra={1} intensity={200} color="#ffcf92" />
      <pointLight position={[0, 4, -5]} intensity={80} color="#ae88ca" distance={14} />
      <pointLight position={[1, 2, -1]} intensity={22} color="#ffc58d" />
      <Box at={[0, -0.14, 0]} size={[12, 0.25, 25]} color="#857d74" map={floor} />
      <Box at={[0, 0.008, 2]} size={[1.45, 0.015, 14]} color="#613b3f" />
      <Box at={[0, 3.7, -7.4]} size={[13, 8, 0.4]} color="#5a514e" />
      <mesh position={[0, 4.1, -7.12]}>
        <circleGeometry args={[2.48, 64]} />
        <meshBasicMaterial color="#302a2c" />
      </mesh>
      <mesh position={[0, 4.1, -7.08]}>
        <planeGeometry args={[4.9, 4.9]} />
        <meshBasicMaterial map={rose} transparent side={DoubleSide} toneMapped={false} />
      </mesh>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, 0, -6.4 + i * 3.15]}>
          {[-1, 1].map((s) => (
            <group key={s} position={[s * 4.55, 0, 0]}>
              <mesh position={[0, 2.2, 0]}>
                <cylinderGeometry args={[0.28, 0.42, 4.4, 12]} />
                <meshStandardMaterial color="#66605d" />
              </mesh>
              <Box at={[0, 4.3, 0]} size={[0.85, 0.24, 0.85]} color="#837569" />
            </group>
          ))}
          <mesh position={[0, 4.38, 0]}>
            <torusGeometry args={[4.55, 0.2, 6, 32, Math.PI]} />
            <meshStandardMaterial color="#716762" />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].flatMap((row) =>
        [-1, 1].map((s) => (
          <group key={row + '-' + s} position={[s * 2.25, 0, 1.45 + row * 1.85]}>
            <Box at={[0, 0.38, 0]} size={[3.05, 0.18, 0.7]} color="#855d45" map={wood} />
            <Box at={[0, 0.75, 0.3]} size={[3.05, 0.62, 0.12]} color="#583b2d" />
            {[-1.15, 1.15].map((x) => (
              <Box key={x} at={[x, 0.21, 0]} size={[0.15, 0.42, 0.56]} color="#53382b" />
            ))}
          </group>
        )),
      )}
      <Box at={[0, 0.14, -4.25]} size={[5.1, 0.28, 2.45]} color="#73665d" />
      <Box at={[-0.8, 0.57, -4.05]} size={[2.35, 0.6, 0.94]} color="#633e30" />
      <Box at={[-0.8, 0.9, -4.05]} size={[2.43, 0.13, 1.01]} color="#9e7556" />
      <Box at={[1.3, 0.56, -2.25]} size={[0.61, 1.1, 0.47]} color="#82593e" />
      <Box at={[1.3, 1.14, -2.25]} size={[0.8, 0.1, 0.6]} color="#a07956" />
      {[-3.1, -2.7, -2.3, 2.3, 2.7, 3.1].map((x, i) => (
        <group key={x} position={[x, 0, -4.95]}>
          <Box at={[0, 0.69, 0]} size={[0.09, 1.38, 0.09]} color="#bb9c68" />
          <mesh position={[0, 1.43 + (i % 2) * 0.02, 0]}>
            <sphereGeometry args={[0.065, 8, 6]} />
            <meshBasicMaterial color="#ffda8d" toneMapped={false} />
          </mesh>
        </group>
      ))}
      {profile.relatives.map((r, i) => (
        <Guest key={r.id} relative={r} index={i} active={speaker === r.id} beat={beat} />
      ))}
      {profile.bustUrl || profile.portraits?.[2] ? (
        <>
          <Box at={[-2.4, 0.5, -3.3]} size={[0.68, 1, 0.6]} color="#70675c" />
          {profile.bustUrl ? (
            <Monument url={profile.bustUrl} />
          ) : (
            <Portrait url={profile.portraits![2]!} />
          )}
        </>
      ) : null}
      <Camera shot={shot} />
    </>
  );
}
