import { useLayoutEffect, useMemo, useRef } from 'react';
import { Environment, useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, InstancedMesh, Mesh, Object3D } from 'three';

const shaftVertex = /* glsl */ `
  varying vec2 rayUv;
  void main() {
    rayUv = uv;
    vec3 floorCenter = vec3(-0.68, 0.23, -4.10);
    vec3 opening = vec3(-1.38, 7.76, -4.96);
    vec3 center = mix(floorCenter, opening, uv.y);
    vec2 viewDirection = normalize(cameraPosition.xz - center.xz);
    vec2 across = vec2(viewDirection.y, -viewDirection.x);
    float diameter = mix(3.58, 0.55, uv.y);
    center.xz += across * (uv.x - 0.5) * diameter;
    gl_Position = projectionMatrix * viewMatrix * vec4(center, 1.0);
  }
`;
const shaftFragment = /* glsl */ `
  varying vec2 rayUv;
  void main() {
    float radius = abs(rayUv.x * 2.0 - 1.0);
    float width = exp(-3.65 * radius * radius) * (1.0 - smoothstep(0.76, 1.0, radius));
    float ends = smoothstep(0.0, 0.18, rayUv.y) * (1.0 - smoothstep(0.89, 1.0, rayUv.y));
    float density = mix(0.085, 0.29, rayUv.y) * width * ends;
    gl_FragColor = vec4(1.0, 0.60, 0.29, density);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
const shadowVertex = /* glsl */ `
  varying vec2 surfaceUv;
  void main() {
    surfaceUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const shadowFragment = /* glsl */ `
  varying vec2 surfaceUv;
  void main() {
    vec2 uvFromCenter = abs(2.0 * surfaceUv - 1.0);
    float penumbra = 1.0 - smoothstep(0.20, 1.0, pow(pow(uvFromCenter.x, 4.0) + pow(uvFromCenter.y, 4.0), 0.25));
    gl_FragColor = vec4(0.014, 0.013, 0.011, penumbra * 0.56);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

// Each patch rests on the same stone tread as the furniture that casts it.
const contactShadows: ReadonlyArray<readonly [number, number, number, number, number]> = [
  ...Array.from({ length: 5 }, (_, row) =>
    [-1, 1].map((side) => [side * 2.25, 0.004, 1.45 + row * 1.83, 3.38, 1.15] as const),
  ).flat(),
  [-0.8, 0.275, -4.42, 1.33, 0.82],
  [-0.8, 0.191, -3.75, 1.33, 0.44],
  [-0.8, 0.115, -3.34, 1.27, 0.38],
  [1.3, 0.005, -2.25, 0.88, 0.71],
  [0, 0.365, -7.05, 3.43, 1.65],
];

function ContactShadows() {
  const mesh = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!mesh.current) return;
    const placement = new Object3D();
    placement.rotation.x = -Math.PI / 2;
    contactShadows.forEach(([x, y, z, width, depth], i) => {
      placement.position.set(x, y, z);
      placement.scale.set(width, depth, 1);
      placement.updateMatrix();
      mesh.current!.setMatrixAt(i, placement.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
    mesh.current.computeBoundingSphere();
  }, []);
  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, contactShadows.length]} renderOrder={1}>
      <planeGeometry />
      <shaderMaterial
        vertexShader={shadowVertex}
        fragmentShader={shadowFragment}
        transparent
        depthWrite={false}
      />
    </instancedMesh>
  );
}

const taperPositions = [
  [2.92, -5.2, 1.597],
  [2.59, -5.68, 1.74],
  [2.23, -6.12, 1.68],
  [1.67, -5.49, 1.01],
  [1.92, -5.38, 0.78],
  [2.1, -5.48, 0.93],
  [1.38, -5.51, 0.74],
  [1.73, -5.78, 1.1],
  [2.44, -5.11, 0.647],
  [2.65, -4.99, 0.587],
  [1.22, -7.03, 1.93],
] as const;
const candlePoints = new Float32Array(
  [-1, 1].flatMap((side) => taperPositions.flatMap(([x, z, y]) => [side * x, y + 0.042, z])),
);
const candleVertex = /* glsl */ `
  uniform float pixelHeight;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(0.22 * pixelHeight * projectionMatrix[1][1] / -viewPosition.z, 2.0, 54.0);
  }
`;
const candleFragment = /* glsl */ `
  void main() {
    vec2 offset = 2.0 * gl_PointCoord - 1.0;
    float radius = length(offset);
    float glow = exp(-4.7 * radius) * (1.0 - smoothstep(0.78, 1.0, radius));
    gl_FragColor = vec4(1.0, 0.40, 0.10, glow * 0.80);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;
function CandleGlows() {
  const pixelHeight = useThree((state) => state.size.height * state.viewport.dpr);
  const uniforms = useMemo(() => ({ pixelHeight: { value: pixelHeight } }), [pixelHeight]);
  return (
    <points renderOrder={3}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[candlePoints, 3]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={candleVertex}
        fragmentShader={candleFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export default function ChapelArchitecture() {
  const { scene } = useGLTF('/scenery/chapel/nave.glb');
  const renderer = useThree((state) => state.gl);
  const interior = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((part) => {
      if (!(part instanceof Mesh)) return;
      part.castShadow = !/glass|candlelight/i.test(part.name);
      part.receiveShadow = true;
    });
    return model;
  }, [scene]);
  useLayoutEffect(() => {
    const previous = renderer.shadowMap.enabled;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.needsUpdate = true;
    return () => {
      renderer.shadowMap.enabled = previous;
    };
  }, [renderer]);
  const chancel = useMemo(() => {
    const target = new Object3D();
    target.position.set(-0.61, 0.3, -4.12);
    return target;
  }, []);
  const lectern = useMemo(() => {
    const target = new Object3D();
    target.position.set(0.8, 1.2, -1.75);
    return target;
  }, []);
  return (
    <>
      <color attach="background" args={['#202629']} />
      <fog attach="fog" args={['#343936', 12.5, 31]} />
      <Environment files="/scenery/chapel/chapel-day-512.hdr" environmentIntensity={0.105} />
      <hemisphereLight args={['#b2c6d1', '#554134', 0.42]} />
      <directionalLight
        position={[-10.5, 6.4, -1.0]}
        color="#d6e6f0"
        intensity={2.75}
        castShadow
        shadow-autoUpdate={false}
        shadow-needsUpdate={true}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={11}
        shadow-camera-bottom={-9}
        shadow-camera-near={0.3}
        shadow-camera-far={30}
        shadow-bias={-0.00018}
        shadow-normalBias={0.015}
      />
      <primitive object={chancel} />
      <spotLight
        target={chancel}
        position={[-1.38, 7.76, -4.96]}
        color="#ffd49a"
        intensity={290}
        castShadow
        shadow-autoUpdate={false}
        shadow-needsUpdate={true}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.25}
        shadow-camera-far={14}
        shadow-bias={-0.00015}
        shadow-normalBias={0.012}
        angle={0.48}
        penumbra={0.94}
        distance={15}
      />
      <primitive object={lectern} />
      <spotLight
        target={lectern}
        position={[1.8, 4.45, 1.8]}
        color="#ffe0bb"
        intensity={39}
        angle={0.89}
        penumbra={0.97}
        distance={11}
      />
      <pointLight position={[0.25, 2.45, -6.65]} color="#ffbb82" intensity={14} distance={7.5} />
      <primitive object={interior} dispose={null} />
      <ContactShadows />
      <CandleGlows />
      <mesh frustumCulled={false} renderOrder={2}>
        <planeGeometry />
        <shaderMaterial
          vertexShader={shaftVertex}
          fragmentShader={shaftFragment}
          transparent
          side={DoubleSide}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
    </>
  );
}
