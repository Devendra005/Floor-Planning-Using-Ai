import React from 'react';

interface ColumnRebarCageProps {
  width: number;
  depth: number;
  height: number;
  isSteelOnly?: boolean;
}

export const ColumnRebarCage3D: React.FC<ColumnRebarCageProps> = ({
  width,
  depth,
  height,
  isSteelOnly = false
}) => {
  const cover = 0.035; // 35mm clear cover
  const barRadius = isSteelOnly ? 0.012 : 0.009; // Main column rebar diameter
  const stirrupRadius = isSteelOnly ? 0.005 : 0.004; // Stirrup diameter

  const innerW = Math.max(0.04, width / 2 - cover);
  const innerD = Math.max(0.04, depth / 2 - cover);

  // Spacing for transverse stirrups along column height
  const numStirrups = Math.max(4, Math.floor(height / 0.3));
  const stirrupYPositions: number[] = [];
  const startY = -height / 2 + 0.12;
  const endY = height / 2 - 0.12;
  const stepY = (endY - startY) / (numStirrups - 1);

  for (let i = 0; i < numStirrups; i++) {
    stirrupYPositions.push(startY + i * stepY);
  }

  const mainColor = isSteelOnly ? '#ef4444' : '#dc2626';
  const mainEmissive = isSteelOnly ? '#f43f5e' : '#000000';
  const stirrupColor = isSteelOnly ? '#f97316' : '#ea580c';
  const stirrupEmissive = isSteelOnly ? '#fb923c' : '#000000';

  return (
    <group>
      {/* 4 Corner Longitudinal Main Rebar Rods */}
      {[-innerW, innerW].map((dx) =>
        [-innerD, innerD].map((dz) => (
          <mesh key={`col-bar-${dx}-${dz}`} position={[dx, 0, dz]} castShadow>
            <cylinderGeometry args={[barRadius, barRadius, height - 0.06, 12]} />
            <meshStandardMaterial
              color={mainColor}
              roughness={0.2}
              metalness={0.9}
              emissive={mainEmissive}
              emissiveIntensity={isSteelOnly ? 0.4 : 0}
            />
          </mesh>
        ))
      )}

      {/* Rectangular Transverse Stirrup / Tie Hoops along Column Height */}
      {stirrupYPositions.map((sy, sIdx) => (
        <group key={`stirrup-${sIdx}`} position={[0, sy, 0]}>
          {/* Top & Bottom Segments of Stirrup Ring */}
          <mesh position={[0, 0, -innerD]} castShadow>
            <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial
              color={stirrupColor}
              roughness={0.25}
              metalness={0.85}
              emissive={stirrupEmissive}
              emissiveIntensity={isSteelOnly ? 0.35 : 0}
            />
          </mesh>
          <mesh position={[0, 0, innerD]} castShadow>
            <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial
              color={stirrupColor}
              roughness={0.25}
              metalness={0.85}
              emissive={stirrupEmissive}
              emissiveIntensity={isSteelOnly ? 0.35 : 0}
            />
          </mesh>
          {/* Left & Right Segments of Stirrup Ring */}
          <mesh position={[-innerW, 0, 0]} castShadow>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerD * 2 + barRadius * 2]} />
            <meshStandardMaterial
              color={stirrupColor}
              roughness={0.25}
              metalness={0.85}
              emissive={stirrupEmissive}
              emissiveIntensity={isSteelOnly ? 0.35 : 0}
            />
          </mesh>
          <mesh position={[innerW, 0, 0]} castShadow>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerD * 2 + barRadius * 2]} />
            <meshStandardMaterial
              color={stirrupColor}
              roughness={0.25}
              metalness={0.85}
              emissive={stirrupEmissive}
              emissiveIntensity={isSteelOnly ? 0.35 : 0}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

interface BeamRebarCageProps {
  length: number;
  width: number;
  depth: number;
  isSteelOnly?: boolean;
  isHorizontalX?: boolean;
}

export const BeamRebarCage3D: React.FC<BeamRebarCageProps> = ({
  length,
  width,
  depth,
  isSteelOnly = false,
  isHorizontalX = true
}) => {
  const cover = 0.03; // 30mm clear cover
  const barRadius = isSteelOnly ? 0.012 : 0.009; // Main beam rebar
  const stirrupRadius = isSteelOnly ? 0.005 : 0.004; // Beam stirrup

  const innerW = Math.max(0.04, width / 2 - cover);
  const innerH = Math.max(0.04, depth / 2 - cover);
  const rebarLength = Math.max(0.2, length - 0.08);

  // Stirrups along beam length
  const numStirrups = Math.max(3, Math.floor(length / 0.28));
  const stirrupPositions: number[] = [];
  const startPos = -length / 2 + 0.08;
  const endPos = length / 2 - 0.08;
  const stepPos = (endPos - startPos) / (numStirrups - 1);

  for (let i = 0; i < numStirrups; i++) {
    stirrupPositions.push(startPos + i * stepPos);
  }

  const mainColor = isSteelOnly ? '#3b82f6' : '#2563eb';
  const mainEmissive = isSteelOnly ? '#60a5fa' : '#000000';
  const stirrupColor = isSteelOnly ? '#06b6d4' : '#0284c7';
  const stirrupEmissive = isSteelOnly ? '#22d3ee' : '#000000';

  return (
    <group>
      {isHorizontalX ? (
        <>
          {/* Top 2 Main Bars (along X) */}
          {[-innerW, innerW].map((dz) => (
            <mesh key={`top-bar-${dz}`} position={[0, innerH, dz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
              <meshStandardMaterial
                color={mainColor}
                roughness={0.2}
                metalness={0.9}
                emissive={mainEmissive}
                emissiveIntensity={isSteelOnly ? 0.4 : 0}
              />
            </mesh>
          ))}

          {/* Bottom 2 Main Bars (along X) */}
          {[-innerW, innerW].map((dz) => (
            <mesh key={`bot-bar-${dz}`} position={[0, -innerH, dz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
              <meshStandardMaterial
                color={mainColor}
                roughness={0.2}
                metalness={0.9}
                emissive={mainEmissive}
                emissiveIntensity={isSteelOnly ? 0.4 : 0}
              />
            </mesh>
          ))}

          {/* Beam Stirrup Rings along X length */}
          {stirrupPositions.map((px, idx) => (
            <group key={`b-stirrup-${idx}`} position={[px, 0, 0]}>
              <mesh position={[0, innerH, 0]}>
                <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerW * 2 + barRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[0, -innerH, 0]}>
                <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerW * 2 + barRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[0, 0, -innerW]}>
                <boxGeometry args={[stirrupRadius * 2, innerH * 2 + barRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[0, 0, innerW]}>
                <boxGeometry args={[stirrupRadius * 2, innerH * 2 + barRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
            </group>
          ))}
        </>
      ) : (
        <>
          {/* Top 2 Main Bars (along Z) */}
          {[-innerW, innerW].map((dx) => (
            <mesh key={`top-bar-z-${dx}`} position={[dx, innerH, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
              <meshStandardMaterial
                color={mainColor}
                roughness={0.2}
                metalness={0.9}
                emissive={mainEmissive}
                emissiveIntensity={isSteelOnly ? 0.4 : 0}
              />
            </mesh>
          ))}

          {/* Bottom 2 Main Bars (along Z) */}
          {[-innerW, innerW].map((dx) => (
            <mesh key={`bot-bar-z-${dx}`} position={[dx, -innerH, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
              <meshStandardMaterial
                color={mainColor}
                roughness={0.2}
                metalness={0.9}
                emissive={mainEmissive}
                emissiveIntensity={isSteelOnly ? 0.4 : 0}
              />
            </mesh>
          ))}

          {/* Beam Stirrup Rings along Z length */}
          {stirrupPositions.map((pz, idx) => (
            <group key={`b-stirrup-z-${idx}`} position={[0, 0, pz]}>
              <mesh position={[0, innerH, 0]}>
                <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[0, -innerH, 0]}>
                <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[-innerW, 0, 0]}>
                <boxGeometry args={[stirrupRadius * 2, innerH * 2 + barRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
              <mesh position={[innerW, 0, 0]}>
                <boxGeometry args={[stirrupRadius * 2, innerH * 2 + barRadius * 2, stirrupRadius * 2]} />
                <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
              </mesh>
            </group>
          ))}
        </>
      )}
    </group>
  );
};

interface FootingRebarMatProps {
  width: number;
  length: number;
  depth: number;
  isSteelOnly?: boolean;
}

export const FootingRebarMat3D: React.FC<FootingRebarMatProps> = ({
  width,
  length,
  depth,
  isSteelOnly = false
}) => {
  const barRadius = isSteelOnly ? 0.009 : 0.006; // Footing mat rebar
  const yPos = -depth / 2 + 0.08;

  const numX = Math.max(5, Math.floor(width / 0.16));
  const numZ = Math.max(5, Math.floor(length / 0.16));

  const matColor = isSteelOnly ? '#fbbf24' : '#d97706';
  const matEmissive = isSteelOnly ? '#f59e0b' : '#000000';

  return (
    <group position={[0, yPos, 0]}>
      {/* Bottom Layer: X-direction rebar grid rods */}
      {Array.from({ length: numZ }).map((_, i) => {
        const pz = -length / 2 + 0.1 + (i * (length - 0.2)) / (numZ - 1);
        return (
          <group key={`ft-x-${i}`} position={[0, 0, pz]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, width - 0.15, 10]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
            {/* L-Hook Bends at left and right ends */}
            <mesh position={[-width / 2 + 0.08, 0.1, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
            <mesh position={[width / 2 - 0.08, 0.1, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
          </group>
        );
      })}

      {/* Top Layer: Z-direction rebar grid rods */}
      {Array.from({ length: numX }).map((_, i) => {
        const px = -width / 2 + 0.1 + (i * (width - 0.2)) / (numX - 1);
        return (
          <group key={`ft-z-${i}`} position={[px, barRadius * 2, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, length - 0.15, 10]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
            {/* L-Hook Bends at front and back ends */}
            <mesh position={[0, 0.1, -length / 2 + 0.08]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
            <mesh position={[0, 0.1, length / 2 - 0.08]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

interface SlabRebarMeshProps {
  width: number;
  length: number;
  isSteelOnly?: boolean;
}

export const SlabRebarMesh3D: React.FC<SlabRebarMeshProps> = ({
  width,
  length,
  isSteelOnly = false
}) => {
  const barRadius = isSteelOnly ? 0.007 : 0.005; // Slab rebar
  const step = 0.35; // Slab mesh spacing

  const numX = Math.max(4, Math.floor(width / step));
  const numZ = Math.max(4, Math.floor(length / step));

  const meshColor = isSteelOnly ? '#10b981' : '#059669';
  const meshEmissive = isSteelOnly ? '#34d399' : '#000000';

  return (
    <group>
      {/* Main Bottom Reinforcement Grid (X-axis) */}
      {Array.from({ length: numZ }).map((_, i) => {
        const pz = -length / 2 + 0.15 + (i * (length - 0.3)) / Math.max(1, numZ - 1);
        return (
          <mesh key={`slab-x-${i}`} position={[0, 0, pz]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[barRadius, barRadius, width - 0.2, 8]} />
            <meshStandardMaterial color={meshColor} roughness={0.3} metalness={0.8} emissive={meshEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
          </mesh>
        );
      })}

      {/* Transverse Reinforcement Grid (Z-axis) */}
      {Array.from({ length: numX }).map((_, i) => {
        const px = -width / 2 + 0.15 + (i * (width - 0.3)) / Math.max(1, numX - 1);
        return (
          <mesh key={`slab-z-${i}`} position={[px, barRadius * 2, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[barRadius, barRadius, length - 0.2, 8]} />
            <meshStandardMaterial color={meshColor} roughness={0.3} metalness={0.8} emissive={meshEmissive} emissiveIntensity={isSteelOnly ? 0.35 : 0} />
          </mesh>
        );
      })}
    </group>
  );
};
