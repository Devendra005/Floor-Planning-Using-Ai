import React from 'react';
import { FloorPlanCandidate } from '../../types';

interface Plumbing3DProps {
  plan: FloorPlanCandidate;
}

export const Plumbing3D: React.FC<Plumbing3DProps> = ({ plan }) => {
  if (!plan.plumbing) return null;

  const { shafts, pipe_routes, fixtures } = plan.plumbing;

  return (
    <group name="plumbing-3d-group">
      {/* 1. Vertical Plumbing Shaft VP-01 Box in 3D */}
      {shafts.map((shaft) => {
        const fl = shaft.floor_level || 0;
        const shHeight = 3.0;
        const cy = fl * 3.0 + shHeight / 2.0;

        return (
          <mesh
            key={`3d-shaft-${shaft.id}`}
            position={[shaft.x + shaft.width / 2.0, cy, shaft.y + shaft.length / 2.0]}
          >
            <boxGeometry args={[shaft.width, shHeight, shaft.length]} />
            <meshStandardMaterial
              color="#0284c7"
              transparent
              opacity={0.35}
              wireframe={false}
            />
          </mesh>
        );
      })}

      {/* 2. 3D Piping Routes (Cylinders) */}
      {pipe_routes.map((pipe) => {
        if (!pipe.path_points || pipe.path_points.length < 2) return null;

        const color =
          pipe.system_type === 'WATER_SUPPLY'
            ? '#06b6d4'
            : pipe.system_type === 'WASTEWATER'
            ? '#10b981'
            : pipe.system_type === 'SOIL_DRAIN'
            ? '#d97706'
            : '#8b5cf6';

        const radius = pipe.diameter_mm / 2000.0 || 0.03; // convert mm to meters radius

        return (
          <group key={`3d-pipe-${pipe.id}`}>
            {pipe.path_points.map((pt, idx) => {
              if (idx === 0) return null;
              const prev = pipe.path_points[idx - 1];
              const p1 = [prev[0], prev[2] || 0.5, prev[1]];
              const p2 = [pt[0], pt[2] || 0.5, pt[1]];

              const mid = [
                (p1[0] + p2[0]) / 2.0,
                (p1[1] + p2[1]) / 2.0,
                (p1[2] + p2[2]) / 2.0
              ];

              const dx = p2[0] - p1[0];
              const dy = p2[1] - p1[1];
              const dz = p2[2] - p1[2];
              const len = Math.sqrt(dx * dx + dy * dy + dz * dz);

              if (len < 0.01) return null;

              return (
                <mesh key={`seg-${idx}`} position={[mid[0], mid[1], mid[2]]}>
                  <cylinderGeometry args={[radius, radius, len, 8]} />
                  <meshStandardMaterial color={color} roughness={0.3} metalness={0.6} />
                </mesh>
              );
            })}
          </group>
        );
      })}

      {/* 3. 3D Fixtures */}
      {fixtures.map((fix) => {
        const fixColor =
          fix.connection_type === 'WATER_INLET'
            ? '#06b6d4'
            : fix.connection_type === 'SOIL_DRAIN'
            ? '#d97706'
            : '#10b981';

        const fz = fix.z || 0.5;

        return (
          <mesh key={`3d-fix-${fix.fixture_id}`} position={[fix.x, fz, fix.y]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial color={fixColor} roughness={0.2} metalness={0.7} />
          </mesh>
        );
      })}
    </group>
  );
};
