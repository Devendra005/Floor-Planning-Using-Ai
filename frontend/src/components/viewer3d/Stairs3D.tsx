import React from 'react';

interface Stairs3DProps {
  x: number;
  z: number;
  width: number;
  length: number;
  height?: number; // Floor-to-floor height (default 3.0m)
  isSteelOnly?: boolean;
}

export const Stairs3D: React.FC<Stairs3DProps> = ({
  x,
  z,
  width,
  length,
  height = 3.0,
  isSteelOnly = false
}) => {
  const numSteps = 12;
  const stepHeight = height / numSteps; // ~0.25m per riser
  const stepDepth = (length * 0.85) / numSteps; // Tread depth
  const stairW = width * 0.85;

  const startZ = -length / 2 + stepDepth / 2;

  // Rebar specs for stairs
  const barRadius = 0.006; // 12mm rebar
  const waistThickness = 0.15; // 150mm concrete waist slab

  return (
    <group position={[x, 0, z]}>
      {/* Concrete Stair Flight Steps & Treads */}
      {!isSteelOnly && (
        <group>
          {Array.from({ length: numSteps }).map((_, i) => {
            const stepY = i * stepHeight + stepHeight / 2;
            const stepZ = startZ + i * stepDepth;

            return (
              <group key={`step-${i}`} position={[0, stepY, stepZ]}>
                {/* Step Block (Tread + Riser) */}
                <mesh castShadow receiveShadow>
                  <boxGeometry args={[stairW, stepHeight, stepDepth]} />
                  <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
                </mesh>

                {/* Wood Tread Top Accent */}
                <mesh position={[0, stepHeight / 2 + 0.005, 0]} receiveShadow>
                  <boxGeometry args={[stairW + 0.02, 0.015, stepDepth + 0.02]} />
                  <meshStandardMaterial color="#78350f" roughness={0.4} />
                </mesh>
              </group>
            );
          })}

          {/* Inclined Concrete Waist Slab underneath */}
          <group position={[0, height / 2, 0]} rotation={[Math.atan2(height, length * 0.85), 0, 0]}>
            <mesh receiveShadow>
              <boxGeometry args={[stairW, waistThickness, Math.hypot(height, length * 0.85)]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.5} />
            </mesh>
          </group>

          {/* Stainless Steel Handrails & Balusters */}
          {[-stairW / 2 + 0.04, stairW / 2 - 0.04].map((railX, rIdx) => (
            <group key={`rail-${rIdx}`}>
              {/* Sloped Top Handrail */}
              <group position={[railX, height / 2 + 0.9, 0]} rotation={[Math.atan2(height, length * 0.85), 0, 0]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.025, 0.025, Math.hypot(height, length * 0.85) + 0.2, 12]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>

              {/* Vertical Baluster Posts */}
              {Array.from({ length: 5 }).map((_, bIdx) => {
                const frac = bIdx / 4;
                const postY = frac * height + 0.45;
                const postZ = startZ + frac * (length * 0.85);

                return (
                  <mesh key={`post-${rIdx}-${bIdx}`} position={[railX, postY, postZ]} castShadow>
                    <cylinderGeometry args={[0.012, 0.012, 0.9, 8]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* Top Landing Platform */}
          <mesh position={[0, height - 0.05, length / 2 - 0.2]} receiveShadow>
            <boxGeometry args={[stairW, 0.1, 0.4]} />
            <meshStandardMaterial color="#cbd5e1" roughness={0.3} />
          </mesh>
        </group>
      )}

      {/* 3D Inclined Waist Slab Rebar Cage in Steel-Only or Rebar Mode */}
      {isSteelOnly && (
        <group position={[0, height / 2, 0]} rotation={[Math.atan2(height, length * 0.85), 0, 0]}>
          {/* Main Longitudinal Reinforcement Rods along Waist Slab */}
          {Array.from({ length: 6 }).map((_, i) => {
            const rx = -stairW / 2 + 0.06 + (i * (stairW - 0.12)) / 5;
            return (
              <mesh key={`stair-bar-${i}`} position={[rx, 0, 0]} castShadow>
                <cylinderGeometry args={[barRadius, barRadius, Math.hypot(height, length * 0.85), 10]} />
                <meshStandardMaterial color="#ef4444" roughness={0.2} metalness={0.85} emissive="#7f1d1d" emissiveIntensity={0.3} />
              </mesh>
            );
          })}

          {/* Transverse Distribution Ties */}
          {Array.from({ length: 8 }).map((_, i) => {
            const len = Math.hypot(height, length * 0.85);
            const rz = -len / 2 + 0.1 + (i * (len - 0.2)) / 7;
            return (
              <mesh key={`stair-tie-${i}`} position={[0, barRadius * 2, rz]} rotation={[0, 0, Math.PI / 2]} castShadow>
                <cylinderGeometry args={[0.004, 0.004, stairW - 0.08, 8]} />
                <meshStandardMaterial color="#fb923c" roughness={0.3} metalness={0.8} />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
};
