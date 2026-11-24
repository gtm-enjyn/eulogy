import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Center, Resize, useGLTF, useTexture } from '@react-three/drei';
import { Vector3 } from 'three';
import type { Profile } from '@eulogy/shared';
import ChapelArchitecture from './ChapelArchitecture';
import { ChapelActor } from './ChapelActor';
import { seatPositions, type Beat, type Shot } from './chapelBlocking';

const cameraAngles = {
  wide: { eye: [0, 2.6, 9.35], aim: [0, 2.55, -3.9], fov: 48 },
  pulpit: { eye: [-0.78, 1.78, 0.3], aim: [1.23, 1.41, -2.64], fov: 33 },
  front_row: { eye: [0, 1.39, -2.0], aim: [0, 1.03, 1.4], fov: 55 },
} as const;

function Camera({
  shot,
  seat,
  reduced,
}: {
  shot: Shot;
  seat: number | undefined;
  reduced: boolean;
}) {
  const look = useRef(new Vector3(0, 2.55, -3.9));
  const { eye, target, fov } = useMemo(() => {
    const a = cameraAngles[shot];
    const target = new Vector3(...a.aim),
      eye = new Vector3(...a.eye);
    if (shot === 'front_row' && seat !== undefined) {
      target.x = seat;
      eye.x = seat * 0.72;
      eye.z = -1.55;
    }
    return { eye, target, fov: a.fov };
  }, [shot, seat]);
  useFrame(({ camera }, dt) => {
    const factor = reduced ? 1 : 1 - Math.exp(-4.1 * Math.min(dt, 0.16));
    camera.position.lerp(eye, factor);
    look.current.lerp(target, factor);
    camera.lookAt(look.current);
    if ('fov' in camera && Math.abs(camera.fov - fov) > 0.02) {
      camera.fov += (fov - camera.fov) * factor;
      camera.updateProjectionMatrix();
    }
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
export default function ChapelScene({
  profile,
  speaker,
  focus,
  shot,
  beat,
  reduced,
  level,
}: {
  profile: Profile;
  speaker: string | undefined;
  focus: string | undefined;
  shot: Shot;
  beat: Beat;
  reduced: boolean;
  level: () => number | null;
}) {
  const seat = seatPositions[profile.relatives.findIndex((relative) => relative.id === focus)];
  return (
    <>
      <ChapelArchitecture />
      {profile.relatives.map((relative, index) => (
        <ChapelActor
          key={relative.id}
          profileId={profile.id}
          relative={relative}
          index={index}
          active={speaker === relative.id}
          beat={beat}
          reduced={reduced}
          level={level}
        />
      ))}
      {(profile.bustUrl || profile.portraits?.[2]) && (
        <>
          <mesh position={[-2.4, 0.5, -3.3]}>
            <boxGeometry args={[0.68, 1, 0.6]} />
            <meshStandardMaterial color="#70675c" />
          </mesh>
          {profile.bustUrl ? (
            <Monument url={profile.bustUrl} />
          ) : (
            <Portrait url={profile.portraits![2]!} />
          )}
        </>
      )}
      <Camera shot={shot} seat={seat} reduced={reduced} />
    </>
  );
}
