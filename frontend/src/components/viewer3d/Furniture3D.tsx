import React from 'react';
import { Stairs3D } from './Stairs3D';

interface FurnitureProps {
  x: number;
  z: number;
  width: number;
  length: number;
  roomType: string;
}

export const Furniture3D: React.FC<FurnitureProps> = ({ x, z, width, length, roomType }) => {
  const type = roomType.toLowerCase();

  if (type.includes('stair')) {
    return <Stairs3D x={x} z={z} width={width} length={length} />;
  }

  if (roomType === 'master_bedroom' || roomType === 'bedroom') {
    // 3D Bed with frame, mattress, pillows and headboard
    const bedW = Math.min(width * 0.55, 1.8);
    const bedL = Math.min(length * 0.65, 2.0);

    return (
      <group position={[x, 0.05, z]}>
        {/* Wooden Bed Frame */}
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[bedW, 0.3, bedL]} />
          <meshStandardMaterial color="#78350f" roughness={0.6} />
        </mesh>

        {/* Headboard */}
        <mesh position={[0, 0.6, -bedL / 2 + 0.05]} castShadow>
          <boxGeometry args={[bedW + 0.1, 0.9, 0.1]} />
          <meshStandardMaterial color="#451a03" roughness={0.5} />
        </mesh>

        {/* White Mattress */}
        <mesh position={[0, 0.4, 0.05]} castShadow>
          <boxGeometry args={[bedW - 0.1, 0.2, bedL - 0.2]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>

        {/* Twin Pillows */}
        <mesh position={[-bedW * 0.23, 0.53, -bedL * 0.3]} castShadow>
          <boxGeometry args={[bedW * 0.38, 0.08, 0.4]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.4} />
        </mesh>

        <mesh position={[bedW * 0.23, 0.53, -bedL * 0.3]} castShadow>
          <boxGeometry args={[bedW * 0.38, 0.08, 0.4]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.4} />
        </mesh>

        {/* Side Nightstand */}
        <mesh position={[bedW / 2 + 0.25, 0.25, -bedL * 0.3]} castShadow>
          <boxGeometry args={[0.4, 0.4, 0.4]} />
          <meshStandardMaterial color="#78350f" />
        </mesh>
      </group>
    );
  }

  if (roomType === 'living') {
    // 3D Sofa set and Coffee Table
    const sofaW = Math.min(width * 0.6, 2.2);
    const sofaD = 0.8;

    return (
      <group position={[x, 0.05, z]}>
        {/* Main Sofa Seat */}
        <mesh position={[0, 0.25, -sofaD / 2]} castShadow>
          <boxGeometry args={[sofaW, 0.3, sofaD]} />
          <meshStandardMaterial color="#1e3a8a" roughness={0.5} />
        </mesh>

        {/* Sofa Backrest */}
        <mesh position={[0, 0.55, -sofaD + 0.1]} castShadow>
          <boxGeometry args={[sofaW, 0.5, 0.2]} />
          <meshStandardMaterial color="#1e40af" roughness={0.5} />
        </mesh>

        {/* Sofa Armrests */}
        <mesh position={[-sofaW / 2 + 0.1, 0.4, -sofaD / 2]} castShadow>
          <boxGeometry args={[0.2, 0.4, sofaD]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>
        <mesh position={[sofaW / 2 - 0.1, 0.4, -sofaD / 2]} castShadow>
          <boxGeometry args={[0.2, 0.4, sofaD]} />
          <meshStandardMaterial color="#1d4ed8" />
        </mesh>

        {/* Coffee Table */}
        <mesh position={[0, 0.2, sofaD / 2 + 0.2]} castShadow>
          <boxGeometry args={[sofaW * 0.6, 0.25, 0.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.3} />
        </mesh>
      </group>
    );
  }

  if (roomType === 'dining') {
    // 3D Dining Table & Chairs
    return (
      <group position={[x, 0.05, z]}>
        {/* Table Top */}
        <mesh position={[0, 0.7, 0]} castShadow>
          <boxGeometry args={[1.4, 0.08, 0.9]} />
          <meshStandardMaterial color="#78350f" roughness={0.3} />
        </mesh>
        {/* Table Legs */}
        {[-0.6, 0.6].map((lx) =>
          [-0.35, 0.35].map((lz) => (
            <mesh key={`leg-${lx}-${lz}`} position={[lx, 0.35, lz]} castShadow>
              <cylinderGeometry args={[0.04, 0.03, 0.7, 8]} />
              <meshStandardMaterial color="#451a03" />
            </mesh>
          ))
        )}

        {/* 4 Chairs */}
        {[-0.8, 0.8].map((cx) => (
          <group key={`chair-${cx}`} position={[cx, 0.2, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.38, 0.4, 0.38]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
            <mesh position={[cx > 0 ? 0.15 : -0.15, 0.4, 0]} castShadow>
              <boxGeometry args={[0.06, 0.45, 0.38]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (roomType === 'kitchen') {
    // 3D Kitchen L-Countertop & Sink
    const counterW = Math.min(width * 0.8, 2.4);

    return (
      <group position={[x, 0.05, z]}>
        {/* Main Counter Base */}
        <mesh position={[0, 0.45, -length * 0.25]} castShadow>
          <boxGeometry args={[counterW, 0.85, 0.6]} />
          <meshStandardMaterial color="#334155" roughness={0.4} />
        </mesh>
        {/* Granite Countertop Top */}
        <mesh position={[0, 0.9, -length * 0.25]} castShadow>
          <boxGeometry args={[counterW + 0.05, 0.06, 0.65]} />
          <meshStandardMaterial color="#0f172a" roughness={0.2} metalness={0.2} />
        </mesh>
        {/* Stainless Steel Sink Basin */}
        <mesh position={[-counterW * 0.25, 0.92, -length * 0.25]} castShadow>
          <boxGeometry args={[0.5, 0.02, 0.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  if (roomType === 'toilet' || roomType === 'bathroom') {
    // 3D Bathtub & Toilet
    return (
      <group position={[x, 0.05, z]}>
        {/* Bathtub */}
        <mesh position={[-width * 0.2, 0.3, 0]} castShadow>
          <boxGeometry args={[0.7, 0.55, 1.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} />
        </mesh>

        {/* Toilet Bowl */}
        <mesh position={[width * 0.25, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.22, 0.18, 0.45, 16]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
        <mesh position={[width * 0.25, 0.5, -0.2]} castShadow>
          <boxGeometry args={[0.38, 0.45, 0.22]} />
          <meshStandardMaterial color="#ffffff" roughness={0.1} />
        </mesh>
      </group>
    );
  }

  return null;
};
