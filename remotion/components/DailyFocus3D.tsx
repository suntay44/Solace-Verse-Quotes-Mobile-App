import { ThreeCanvas } from '@remotion/three';
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const categories = [
  { label: 'Meditation', color: '#7EA58B', position: [-2.45, 0.58, 0.18] as const },
  { label: 'Bible Verse', color: '#D4B477', position: [0, 0.86, 0.3] as const },
  { label: 'Daily Quotes', color: '#88AFC5', position: [2.45, 0.58, 0.18] as const },
];

const softClamp = {
  extrapolateLeft: 'clamp' as const,
  extrapolateRight: 'clamp' as const,
};

const Scene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: {
      damping: 18,
      mass: 0.8,
      stiffness: 72,
    },
  });
  const orbit = frame / 56;
  const pulse = Math.sin(frame / 18) * 0.5 + 0.5;
  const cardFloat = Math.sin(frame / 32) * 0.12;
  const ringRotation = frame / 82;
  const glowScale = interpolate(pulse, [0, 1], [0.92, 1.12]);

  return (
    <>
      <ambientLight intensity={0.74} />
      <directionalLight position={[4, 5, 6]} intensity={1.3} color="#FFF5DF" />
      <pointLight position={[-3, 2, 4]} intensity={1.7} color="#D7EADF" />
      <pointLight position={[3, -1, 4]} intensity={1.15} color="#CADDF0" />

      <group position={[0, 1.05, 0]} scale={0.64}>
      <group
        position={[0, -0.16 + cardFloat, 0]}
        rotation={[
          -0.08 + Math.sin(frame / 60) * 0.025,
          Math.sin(frame / 75) * 0.22,
          Math.sin(frame / 94) * 0.035,
        ]}
        scale={0.72 + entrance * 0.28}
      >
        <mesh position={[0, 0, -0.2]}>
          <boxGeometry args={[5.7, 3.28, 0.16]} />
          <meshStandardMaterial
            color="#FBF7EF"
            metalness={0.08}
            opacity={0.58}
            roughness={0.24}
            transparent
          />
        </mesh>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[5.18, 2.75, 0.08]} />
          <meshStandardMaterial
            color="#FFFFFF"
            emissive="#F6E5B7"
            emissiveIntensity={0.05}
            metalness={0.02}
            opacity={0.38}
            roughness={0.2}
            transparent
          />
        </mesh>
        <mesh position={[0, -0.48, 0.12]}>
          <boxGeometry args={[3.65, 0.26, 0.08]} />
          <meshStandardMaterial color="#31473A" opacity={0.78} roughness={0.42} transparent />
        </mesh>
        <mesh position={[-0.84, 0.28, 0.14]}>
          <boxGeometry args={[2.85, 0.16, 0.08]} />
          <meshStandardMaterial color="#31473A" opacity={0.46} roughness={0.42} transparent />
        </mesh>
        <mesh position={[-1.1, -0.02, 0.14]}>
          <boxGeometry args={[2.32, 0.14, 0.08]} />
          <meshStandardMaterial color="#6F7F68" opacity={0.42} roughness={0.42} transparent />
        </mesh>
      </group>

      <mesh rotation={[Math.PI / 2, 0, ringRotation]} scale={glowScale}>
        <torusGeometry args={[2.62, 0.012, 16, 160]} />
        <meshStandardMaterial color="#F4DFB0" emissive="#F4DFB0" emissiveIntensity={0.35} />
      </mesh>
      <mesh rotation={[Math.PI / 2.32, 0.22, -ringRotation * 0.75]} scale={0.8 + entrance * 0.2}>
        <torusGeometry args={[3.18, 0.009, 16, 180]} />
        <meshStandardMaterial color="#DCE9DF" emissive="#DCE9DF" emissiveIntensity={0.22} />
      </mesh>
      <mesh rotation={[Math.PI / 2.7, -0.28, ringRotation * 0.56]} scale={1.05}>
        <torusGeometry args={[1.96, 0.01, 16, 140]} />
        <meshStandardMaterial color="#CADDF0" emissive="#CADDF0" emissiveIntensity={0.2} />
      </mesh>

      {categories.map((category, index) => {
        const delay = index * 12;
        const tokenIn = interpolate(frame, [18 + delay, 46 + delay], [0, 1], {
          ...softClamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
        const floatY = Math.sin((frame + index * 20) / 28) * 0.13;

        return (
          <group
            key={category.label}
            position={[
              category.position[0] * tokenIn,
              category.position[1] + floatY,
              category.position[2],
            ]}
            rotation={[0.24, orbit + index * 1.8, -0.08]}
            scale={0.2 + tokenIn * 0.8}
          >
            <mesh>
              <sphereGeometry args={[0.42, 36, 36]} />
              <meshStandardMaterial
                color={category.color}
                emissive={category.color}
                emissiveIntensity={0.14 + pulse * 0.08}
                metalness={0.08}
                roughness={0.28}
              />
            </mesh>
            <mesh position={[0, 0, 0.08]} scale={1.04}>
              <torusGeometry args={[0.47, 0.012, 12, 80]} />
              <meshStandardMaterial color="#FFFFFF" opacity={0.34} transparent />
            </mesh>
          </group>
        );
      })}

      {Array.from({ length: 18 }, (_, index) => {
        const angle = (index / 18) * Math.PI * 2 + frame / 105;
        const radius = 3.3 + Math.sin(frame / 44 + index) * 0.18;
        const y = -1.55 + (index % 6) * 0.54 + Math.sin(frame / 36 + index) * 0.05;

        return (
          <mesh key={index} position={[Math.cos(angle) * radius, y, Math.sin(angle) * 0.72 - 0.24]}>
            <sphereGeometry args={[0.035 + (index % 3) * 0.012, 16, 16]} />
            <meshStandardMaterial color="#FFF5D8" emissive="#FFF5D8" emissiveIntensity={0.42} />
          </mesh>
        );
      })}
      </group>
    </>
  );
};

export const DailyFocus3D = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [34, 68], [0, 1], softClamp);
  const subtitleOpacity = interpolate(frame, [70, 104], [0, 1], softClamp);
  const footerOpacity = interpolate(frame, [118, 148], [0, 1], softClamp);
  const titleY = interpolate(frame, [34, 74], [34, 0], {
    ...softClamp,
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const shimmer = interpolate(Math.sin(frame / 18), [-1, 1], [0.35, 0.9]);

  return (
    <AbsoluteFill
      style={{
        background:
          'radial-gradient(circle at 50% 34%, #FBF3DD 0%, #E8F1EA 30%, #DDEBF0 54%, #1B2722 100%)',
        overflow: 'hidden',
      }}
    >
      <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.22, 10.6], fov: 42 }}>
        <Scene />
      </ThreeCanvas>

      <AbsoluteFill
        style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '156px 92px 124px',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
          }}
        >
          <div
            style={{
              color: '#31473A',
              fontFamily: 'Avenir Next, Inter, Arial, sans-serif',
              fontSize: 31,
              fontWeight: 800,
              letterSpacing: 0,
              textTransform: 'uppercase',
            }}
          >
            Daily Focus
          </div>
          <div
            style={{
              background: `rgba(255,255,255,${shimmer})`,
              borderRadius: 999,
              height: 3,
              width: 126,
            }}
          />
        </div>

        <div
          style={{
            alignItems: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            marginTop: 820,
          }}
        >
          <div
            style={{
              color: '#17221B',
              fontFamily: 'Avenir Next, Inter, Arial, sans-serif',
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: 0,
              lineHeight: 1.02,
              maxWidth: 820,
              opacity: subtitleOpacity,
              textAlign: 'center',
            }}
          >
            Your daily focus, floating close.
          </div>
          <div
            style={{
              color: '#35453C',
              fontFamily: 'Avenir Next, Inter, Arial, sans-serif',
              fontSize: 35,
              fontWeight: 600,
              lineHeight: 1.35,
              maxWidth: 700,
              opacity: footerOpacity,
              textAlign: 'center',
            }}
          >
            Meditation, Bible verses, and quotes in one calm widget experience.
          </div>
        </div>

        <div
          style={{
            alignItems: 'center',
            background: 'rgba(255,255,255,0.22)',
            border: '1px solid rgba(255,255,255,0.28)',
            borderRadius: 32,
            color: '#F8F1E7',
            display: 'flex',
            fontFamily: 'Avenir Next, Inter, Arial, sans-serif',
            fontSize: 27,
            fontWeight: 800,
            gap: 14,
            justifyContent: 'center',
            opacity: footerOpacity,
            padding: '20px 30px',
          }}
        >
          <span>Tap the widget</span>
          <span style={{ opacity: 0.66 }}>/</span>
          <span>start listening</span>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
