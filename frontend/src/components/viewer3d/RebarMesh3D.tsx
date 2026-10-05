import React from 'react';

export interface ColumnRebarCageProps {
  width: number;
  depth: number;
  height: number;
  isSteelOnly?: boolean;
  selectedBarMark?: string | null;
  columnBarMarks?: {
    mainMark?: string;
    tieMark?: string;
  };
  explodedOffset?: number;
  onSelectBarMark?: (mark: string) => void;
}

export const ColumnRebarCage3D: React.FC<ColumnRebarCageProps> = ({
  width,
  depth,
  height,
  isSteelOnly = false,
  selectedBarMark,
  columnBarMarks,
  explodedOffset = 0,
  onSelectBarMark
}) => {
  const cover = 0.035; // 35mm clear cover
  const barRadius = isSteelOnly ? 0.012 : 0.009;
  const stirrupRadius = isSteelOnly ? 0.005 : 0.004;

  const innerW = Math.max(0.04, width / 2 - cover) + explodedOffset * 0.1;
  const innerD = Math.max(0.04, depth / 2 - cover) + explodedOffset * 0.1;

  const numStirrups = Math.max(4, Math.floor(height / 0.3));
  const stirrupYPositions: number[] = [];
  const startY = -height / 2 + 0.12;
  const endY = height / 2 - 0.12;
  const stepY = (endY - startY) / (numStirrups - 1);

  for (let i = 0; i < numStirrups; i++) {
    stirrupYPositions.push(startY + i * stepY);
  }

  const isMainSelected = selectedBarMark && columnBarMarks?.mainMark && selectedBarMark === columnBarMarks.mainMark;
  const isTieSelected = selectedBarMark && columnBarMarks?.tieMark && selectedBarMark === columnBarMarks.tieMark;

  const mainColor = isMainSelected ? '#f59e0b' : isSteelOnly ? '#ef4444' : '#dc2626';
  const mainEmissive = isMainSelected ? '#f59e0b' : isSteelOnly ? '#f43f5e' : '#000000';
  const mainEmissiveIntensity = isMainSelected ? 0.9 : isSteelOnly ? 0.4 : 0;

  const tieColor = isTieSelected ? '#06b6d4' : isSteelOnly ? '#f97316' : '#ea580c';
  const tieEmissive = isTieSelected ? '#22d3ee' : isSteelOnly ? '#fb923c' : '#000000';
  const tieEmissiveIntensity = isTieSelected ? 0.9 : isSteelOnly ? 0.35 : 0;

  return (
    <group>
      {/* 4 Corner Longitudinal Main Rebar Rods */}
      {[-innerW, innerW].map((dx) =>
        [-innerD, innerD].map((dz) => (
          <mesh
            key={`col-bar-${dx}-${dz}`}
            position={[dx, 0, dz]}
            castShadow
            onClick={(e) => {
              if (columnBarMarks?.mainMark && onSelectBarMark) {
                e.stopPropagation();
                onSelectBarMark(columnBarMarks.mainMark);
              }
            }}
          >
            <cylinderGeometry args={[barRadius, barRadius, height - 0.06, 12]} />
            <meshStandardMaterial
              color={mainColor}
              roughness={0.2}
              metalness={0.9}
              emissive={mainEmissive}
              emissiveIntensity={mainEmissiveIntensity}
            />
          </mesh>
        ))
      )}

      {/* Rectangular Transverse Stirrup / Tie Hoops along Column Height */}
      {stirrupYPositions.map((sy, sIdx) => (
        <group
          key={`stirrup-${sIdx}`}
          position={[0, sy, 0]}
          onClick={(e) => {
            if (columnBarMarks?.tieMark && onSelectBarMark) {
              e.stopPropagation();
              onSelectBarMark(columnBarMarks.tieMark);
            }
          }}
        >
          {/* Top & Bottom Segments of Stirrup Ring */}
          <mesh position={[0, 0, -innerD]} castShadow>
            <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial
              color={tieColor}
              roughness={0.25}
              metalness={0.85}
              emissive={tieEmissive}
              emissiveIntensity={tieEmissiveIntensity}
            />
          </mesh>
          <mesh position={[0, 0, innerD]} castShadow>
            <boxGeometry args={[innerW * 2 + barRadius * 2, stirrupRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial
              color={tieColor}
              roughness={0.25}
              metalness={0.85}
              emissive={tieEmissive}
              emissiveIntensity={tieEmissiveIntensity}
            />
          </mesh>
          {/* Left & Right Segments of Stirrup Ring */}
          <mesh position={[-innerW, 0, 0]} castShadow>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerD * 2 + barRadius * 2]} />
            <meshStandardMaterial
              color={tieColor}
              roughness={0.25}
              metalness={0.85}
              emissive={tieEmissive}
              emissiveIntensity={tieEmissiveIntensity}
            />
          </mesh>
          <mesh position={[innerW, 0, 0]} castShadow>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerD * 2 + barRadius * 2]} />
            <meshStandardMaterial
              color={tieColor}
              roughness={0.25}
              metalness={0.85}
              emissive={tieEmissive}
              emissiveIntensity={tieEmissiveIntensity}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export interface BeamRebarCageProps {
  length: number;
  width: number;
  depth: number;
  topCount?: number;
  bottomCount?: number;
  topDia?: number;
  botDia?: number;
  stirrupDia?: number;
  stirrupSpacing?: number;
  isSteelOnly?: boolean;
  selectedBarMark?: string | null;
  beamBarMarks?: {
    topMark?: string;
    bottomMark?: string;
    stirrupMark?: string;
  };
  explodedOffset?: number;
  onSelectBarMark?: (mark: string) => void;
}

export const BeamRebarCage3D: React.FC<BeamRebarCageProps> = ({
  length,
  width,
  depth,
  topCount = 2,
  bottomCount = 3,
  isSteelOnly = false,
  selectedBarMark,
  beamBarMarks,
  explodedOffset = 0,
  onSelectBarMark
}) => {
  const cover = 0.03; // 30mm clear cover
  const barRadius = isSteelOnly ? 0.012 : 0.009;
  const stirrupRadius = isSteelOnly ? 0.005 : 0.004;

  const innerW = Math.max(0.04, width / 2 - cover);
  const innerH = Math.max(0.04, depth / 2 - cover);
  const rebarLength = Math.max(0.2, length - 0.08);

  const isTopSelected = selectedBarMark && beamBarMarks?.topMark && selectedBarMark === beamBarMarks.topMark;
  const isBotSelected = selectedBarMark && beamBarMarks?.bottomMark && selectedBarMark === beamBarMarks.bottomMark;
  const isStirrupSelected = selectedBarMark && beamBarMarks?.stirrupMark && selectedBarMark === beamBarMarks.stirrupMark;

  const topColor = isTopSelected ? '#38bdf8' : isSteelOnly ? '#3b82f6' : '#2563eb';
  const topEmissive = isTopSelected ? '#38bdf8' : isSteelOnly ? '#60a5fa' : '#000000';
  const topEmissiveIntensity = isTopSelected ? 0.9 : isSteelOnly ? 0.4 : 0;

  const botColor = isBotSelected ? '#f59e0b' : isSteelOnly ? '#3b82f6' : '#1d4ed8';
  const botEmissive = isBotSelected ? '#f59e0b' : isSteelOnly ? '#60a5fa' : '#000000';
  const botEmissiveIntensity = isBotSelected ? 0.9 : isSteelOnly ? 0.4 : 0;

  const stirrupColor = isStirrupSelected ? '#22d3ee' : isSteelOnly ? '#06b6d4' : '#0284c7';
  const stirrupEmissive = isStirrupSelected ? '#22d3ee' : isSteelOnly ? '#22d3ee' : '#000000';
  const stirrupEmissiveIntensity = isStirrupSelected ? 0.9 : isSteelOnly ? 0.35 : 0;

  // Stirrups along beam length (X axis)
  const numStirrups = Math.max(3, Math.floor(length / 0.25));
  const stirrupPositions: number[] = [];
  const startPos = -length / 2 + 0.08;
  const endPos = length / 2 - 0.08;
  const stepPos = (endPos - startPos) / Math.max(1, numStirrups - 1);

  for (let i = 0; i < numStirrups; i++) {
    stirrupPositions.push(startPos + i * stepPos);
  }

  // Calculate Z positions for top and bottom bars across width
  const getZPositions = (count: number) => {
    if (count <= 1) return [0];
    const stepZ = (innerW * 2) / (count - 1);
    return Array.from({ length: count }).map((_, i) => -innerW + i * stepZ);
  };

  const topZPositions = getZPositions(Math.max(2, topCount));
  const botZPositions = getZPositions(Math.max(2, bottomCount));

  // Y positions with exploded offset
  const topY = innerH + explodedOffset * 0.15;
  const botY = -innerH - explodedOffset * 0.15;

  return (
    <group>
      {/* Top Main Bars (along X length) */}
      {topZPositions.map((dz, idx) => (
        <mesh
          key={`top-bar-${idx}`}
          position={[0, topY, dz]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          onClick={(e) => {
            if (beamBarMarks?.topMark && onSelectBarMark) {
              e.stopPropagation();
              onSelectBarMark(beamBarMarks.topMark);
            }
          }}
        >
          <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
          <meshStandardMaterial
            color={topColor}
            roughness={0.2}
            metalness={0.9}
            emissive={topEmissive}
            emissiveIntensity={topEmissiveIntensity}
          />
        </mesh>
      ))}

      {/* Bottom Main Bars (along X length) */}
      {botZPositions.map((dz, idx) => (
        <mesh
          key={`bot-bar-${idx}`}
          position={[0, botY, dz]}
          rotation={[0, 0, Math.PI / 2]}
          castShadow
          onClick={(e) => {
            if (beamBarMarks?.bottomMark && onSelectBarMark) {
              e.stopPropagation();
              onSelectBarMark(beamBarMarks.bottomMark);
            }
          }}
        >
          <cylinderGeometry args={[barRadius, barRadius, rebarLength, 12]} />
          <meshStandardMaterial
            color={botColor}
            roughness={0.2}
            metalness={0.9}
            emissive={botEmissive}
            emissiveIntensity={botEmissiveIntensity}
          />
        </mesh>
      ))}

      {/* Beam Stirrup Rings along X length */}
      {stirrupPositions.map((px, idx) => (
        <group
          key={`b-stirrup-${idx}`}
          position={[px, 0, 0]}
          onClick={(e) => {
            if (beamBarMarks?.stirrupMark && onSelectBarMark) {
              e.stopPropagation();
              onSelectBarMark(beamBarMarks.stirrupMark);
            }
          }}
        >
          <mesh position={[0, topY, 0]}>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerW * 2 + barRadius * 2]} />
            <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={stirrupEmissiveIntensity} />
          </mesh>
          <mesh position={[0, botY, 0]}>
            <boxGeometry args={[stirrupRadius * 2, stirrupRadius * 2, innerW * 2 + barRadius * 2]} />
            <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={stirrupEmissiveIntensity} />
          </mesh>
          <mesh position={[0, (topY + botY) / 2, -innerW]}>
            <boxGeometry args={[stirrupRadius * 2, (topY - botY) + barRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={stirrupEmissiveIntensity} />
          </mesh>
          <mesh position={[0, (topY + botY) / 2, innerW]}>
            <boxGeometry args={[stirrupRadius * 2, (topY - botY) + barRadius * 2, stirrupRadius * 2]} />
            <meshStandardMaterial color={stirrupColor} roughness={0.25} metalness={0.85} emissive={stirrupEmissive} emissiveIntensity={stirrupEmissiveIntensity} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export interface FootingRebarMatProps {
  width: number;
  length: number;
  depth: number;
  isSteelOnly?: boolean;
  selectedBarMark?: string | null;
  barMark?: string;
  explodedOffset?: number;
  onSelectBarMark?: (mark: string) => void;
}

export const FootingRebarMat3D: React.FC<FootingRebarMatProps> = ({
  width,
  length,
  depth,
  isSteelOnly = false,
  selectedBarMark,
  barMark,
  explodedOffset = 0,
  onSelectBarMark
}) => {
  const barRadius = isSteelOnly ? 0.009 : 0.006;
  const yPos = -depth / 2 + 0.08 - explodedOffset * 0.1;

  const numX = Math.max(5, Math.floor(width / 0.16));
  const numZ = Math.max(5, Math.floor(length / 0.16));

  const isSelected = selectedBarMark && barMark && selectedBarMark === barMark;
  const matColor = isSelected ? '#f59e0b' : isSteelOnly ? '#fbbf24' : '#d97706';
  const matEmissive = isSelected ? '#f59e0b' : isSteelOnly ? '#f59e0b' : '#000000';
  const matEmissiveIntensity = isSelected ? 0.9 : isSteelOnly ? 0.35 : 0;

  return (
    <group
      position={[0, yPos, 0]}
      onClick={(e) => {
        if (barMark && onSelectBarMark) {
          e.stopPropagation();
          onSelectBarMark(barMark);
        }
      }}
    >
      {/* Bottom Layer: X-direction rebar grid rods */}
      {Array.from({ length: numZ }).map((_, i) => {
        const pz = -length / 2 + 0.1 + (i * (length - 0.2)) / (numZ - 1);
        return (
          <group key={`ft-x-${i}`} position={[0, 0, pz]}>
            <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, width - 0.15, 10]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
            </mesh>
            <mesh position={[-width / 2 + 0.08, 0.1, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
            </mesh>
            <mesh position={[width / 2 - 0.08, 0.1, 0]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
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
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
            </mesh>
            <mesh position={[0, 0.1, -length / 2 + 0.08]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
            </mesh>
            <mesh position={[0, 0.1, length / 2 - 0.08]} castShadow>
              <cylinderGeometry args={[barRadius, barRadius, 0.2, 8]} />
              <meshStandardMaterial color={matColor} roughness={0.25} metalness={0.85} emissive={matEmissive} emissiveIntensity={matEmissiveIntensity} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export interface SlabRebarMeshProps {
  width: number;
  length: number;
  isSteelOnly?: boolean;
  selectedBarMark?: string | null;
  mainMark?: string;
  distMark?: string;
  explodedOffset?: number;
  onSelectBarMark?: (mark: string) => void;
}

export const SlabRebarMesh3D: React.FC<SlabRebarMeshProps> = ({
  width,
  length,
  isSteelOnly = false,
  selectedBarMark,
  mainMark,
  distMark,
  explodedOffset = 0,
  onSelectBarMark
}) => {
  const barRadius = isSteelOnly ? 0.007 : 0.005;
  const step = 0.35;

  const numX = Math.max(4, Math.floor(width / step));
  const numZ = Math.max(4, Math.floor(length / step));

  const isMainSel = selectedBarMark && mainMark && selectedBarMark === mainMark;
  const isDistSel = selectedBarMark && distMark && selectedBarMark === distMark;

  const mainColor = isMainSel ? '#38bdf8' : isSteelOnly ? '#10b981' : '#059669';
  const mainEmissive = isMainSel ? '#38bdf8' : isSteelOnly ? '#34d399' : '#000000';
  const mainEmissiveIntensity = isMainSel ? 0.9 : isSteelOnly ? 0.35 : 0;

  const distColor = isDistSel ? '#f59e0b' : isSteelOnly ? '#10b981' : '#047857';
  const distEmissive = isDistSel ? '#f59e0b' : isSteelOnly ? '#34d399' : '#000000';
  const distEmissiveIntensity = isDistSel ? 0.9 : isSteelOnly ? 0.35 : 0;

  return (
    <group position={[0, explodedOffset * 0.1, 0]}>
      {/* Main Bottom Reinforcement Grid (X-axis) */}
      {Array.from({ length: numZ }).map((_, i) => {
        const pz = -length / 2 + 0.15 + (i * (length - 0.3)) / Math.max(1, numZ - 1);
        return (
          <mesh
            key={`slab-x-${i}`}
            position={[0, 0, pz]}
            rotation={[0, 0, Math.PI / 2]}
            onClick={(e) => {
              if (mainMark && onSelectBarMark) {
                e.stopPropagation();
                onSelectBarMark(mainMark);
              }
            }}
          >
            <cylinderGeometry args={[barRadius, barRadius, width - 0.2, 8]} />
            <meshStandardMaterial color={mainColor} roughness={0.3} metalness={0.8} emissive={mainEmissive} emissiveIntensity={mainEmissiveIntensity} />
          </mesh>
        );
      })}

      {/* Transverse Reinforcement Grid (Z-axis) */}
      {Array.from({ length: numX }).map((_, i) => {
        const px = -width / 2 + 0.15 + (i * (width - 0.3)) / Math.max(1, numX - 1);
        return (
          <mesh
            key={`slab-z-${i}`}
            position={[px, barRadius * 2, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            onClick={(e) => {
              if (distMark && onSelectBarMark) {
                e.stopPropagation();
                onSelectBarMark(distMark);
              }
            }}
          >
            <cylinderGeometry args={[barRadius, barRadius, length - 0.2, 8]} />
            <meshStandardMaterial color={distColor} roughness={0.3} metalness={0.8} emissive={distEmissive} emissiveIntensity={distEmissiveIntensity} />
          </mesh>
        );
      })}
    </group>
  );
};
