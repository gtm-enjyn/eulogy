import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Group, MathUtils, Mesh, Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import type { Relative } from '@eulogy/shared';
import {
  aisleRoutes,
  lectern,
  riseSeconds,
  seatPositions,
  sitSeconds,
  turnSeconds,
  type Beat,
} from './chapelBlocking';

const clipNames = ['seated', 'stand', 'walk', 'idle', 'speak', 'sit'] as const;
type Motion = (typeof clipNames)[number];
type Face = { weights: number[]; jaw?: number; left?: number; right?: number };
const smooth = (t: number) => MathUtils.smoothstep(t, 0, 1);
const nearestAngle = (a: number, b: number) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a));
type Props = {
  profileId: string;
  relative: Relative;
  index: number;
  active: boolean;
  beat: Beat;
  reduced: boolean;
  level: () => number | null;
};

const julesCast: Record<string, string> = {
  maman: 'mother',
  papa: 'father',
  ines: 'sister',
  theo: 'friend',
};
const louisCast: Record<string, string> = {
  camille: 'mourner',
  lea: 'sister',
  anne: 'mother',
  jules: 'friend',
};
export function ChapelActor({ profileId, relative, index, active, beat, reduced, level }: Props) {
  const cast = profileId === 'jules-film' ? julesCast : profileId === 'louis-demo' ? louisCast : {};
  const model = cast[relative.id] ?? ['mother', 'sister', 'friend', 'father'][index]!;
  const asset = model === 'mourner' || model === 'visitor' ? model : 'cast/' + model;
  const { scene } = useGLTF('/avatars/' + asset + '.glb');
  const { animations } = useGLTF('/avatars/motion/' + model + '.glb');
  const rig = useMemo(() => {
    const body = clone(scene);
    const faces: Face[] = [];
    body.traverse((o) => {
      if (!(o instanceof Mesh)) return;
      o.frustumCulled = false;
      const dictionary = o.morphTargetDictionary;
      if (dictionary && o.morphTargetInfluences)
        faces.push({
          weights: o.morphTargetInfluences,
          jaw: dictionary.mouthOpen ?? dictionary.jawOpen ?? dictionary.viseme_aa,
          left: dictionary.eyeBlinkLeft ?? dictionary.eyesClosed,
          right: dictionary.eyeBlinkRight,
        });
    });
    const mixer = new AnimationMixer(body);
    const actions = new Map(
      animations.map((clip) => {
        const action = mixer.clipAction(clip);
        action.play();
        action.paused = true;
        action.setEffectiveWeight(0);
        return [clip.name, action] as const;
      }),
    );
    return { body, faces, mixer, actions };
  }, [scene, animations]);
  useEffect(() => {
    for (const action of rig.actions.values()) {
      action.reset().play();
      action.paused = true;
    }
    return () => {
      rig.mixer.stopAllAction();
    };
  }, [rig]);
  const root = useRef<Group>(null);
  const elapsed = useRef(0),
    previous = useRef(''),
    jaw = useRef(0);
  const point = useMemo(() => new Vector3(), []),
    tangent = useMemo(() => new Vector3(), []);
  const route = aisleRoutes[index]!;
  const seat = seatPositions[index]!;
  useFrame(({ clock }, dt) => {
    const actor = root.current;
    if (!actor) return;
    const state = active ? beat : 'seated';
    if (state !== previous.current) {
      elapsed.current = 0;
      previous.current = state;
    } else elapsed.current += dt;
    const t = elapsed.current,
      time = clock.elapsedTime,
      idleTime = time + index * 0.41;
    function set(name: Motion, seconds: number, weight: number, loop = true) {
      const action = rig.actions.get(name);
      if (!action) return;
      const duration = action.getClip().duration;
      action.time = loop ? seconds % duration : MathUtils.clamp(seconds, 0, duration);
      action.setEffectiveWeight(weight);
    }
    for (const name of clipNames) rig.actions.get(name)?.setEffectiveWeight(0);
    function standing(weight: number, talking = false) {
      const gesture = talking ? 0.5 : 0;
      set('idle', idleTime, weight * (1 - gesture));
      set('speak', idleTime * 0.91, weight * gesture);
    }
    let yaw = Math.PI;
    point.set(seat, 0, 1.24);
    if (state === 'speak' || (reduced && state === 'approach')) {
      point.copy(lectern);
      yaw = 0;
      standing(1, state === 'speak');
    } else if (state === 'approach' && t < riseSeconds) {
      const mix = smooth(t / 0.16);
      set('seated', idleTime, 1 - mix);
      set('stand', t, mix, false);
    } else if (
      state === 'approach' ||
      (state === 'return' && !reduced && t < turnSeconds + route.travel)
    ) {
      const forward = state === 'approach';
      const walkTime = MathUtils.clamp(t - (forward ? riseSeconds : turnSeconds), 0, route.travel);
      const u = walkTime / route.travel;
      const distance = forward ? u : 1 - u;
      route.path.getPointAt(distance, point);
      route.path.getTangentAt(distance, tangent);
      if (!forward) tangent.negate();
      const angle = Math.atan2(tangent.x, tangent.z);
      yaw = angle;
      const blend = Math.min(smooth(walkTime / 0.22), smooth((route.travel - walkTime) / 0.25));
      set('walk', walkTime * 1.22 + index * 0.11, blend);
      standing(1 - blend);
      if (forward && u === 1)
        yaw =
          angle +
          (nearestAngle(angle, 0) - angle) * smooth((t - riseSeconds - route.travel) / turnSeconds);
      if (!forward && t < turnSeconds) yaw = nearestAngle(0, angle) * smooth(t / turnSeconds);
    } else if (!reduced && state === 'return') {
      const sitTime = t - turnSeconds - route.travel,
        mix = smooth((sitTime - sitSeconds + 0.22) / 0.22);
      set('sit', sitTime, 1 - mix, false);
      set('seated', idleTime, mix);
    } else {
      set('seated', idleTime, 1);
    }
    rig.mixer.update(0);
    actor.position.copy(point);
    const turn = reduced ? 1 : 1 - Math.exp(-11 * Math.min(dt, 0.12));
    actor.rotation.y = MathUtils.lerp(actor.rotation.y, nearestAngle(actor.rotation.y, yaw), turn);
    const speaking = state === 'speak';
    const measured = speaking ? level() : 0;
    const target = measured ?? 0.19 + 0.16 * Math.sin(time * 15.4) * Math.sin(time * 8.1);
    jaw.current = MathUtils.damp(jaw.current, target, 20, Math.min(dt, 0.1));
    const blinkTime = (time + index * 0.81) % (3.8 + index * 0.13);
    const blink = blinkTime < 0.16 ? Math.sin((Math.PI * blinkTime) / 0.16) : 0;
    for (const face of rig.faces) {
      if (face.jaw !== undefined) face.weights[face.jaw] = jaw.current;
      if (face.left !== undefined) face.weights[face.left] = blink;
      if (face.right !== undefined) face.weights[face.right] = blink;
    }
  });
  return (
    <group ref={root} position={[seat, 0, 1.24]} rotation={[0, Math.PI, 0]}>
      <primitive object={rig.body} dispose={null} />
    </group>
  );
}
