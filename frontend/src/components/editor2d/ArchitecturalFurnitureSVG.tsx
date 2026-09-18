import React from 'react';

interface FurnitureProps {
  roomType: string;
  width: number;  // SVG pixels
  height: number; // SVG pixels
}

export const ArchitecturalFurnitureSVG: React.FC<FurnitureProps> = ({ roomType, width, height }) => {
  const type = roomType.toLowerCase();

  // Living Room Furniture (Sofa set, Coffee Table, Armchairs)
  if (type.includes('living')) {
    const minDim = Math.min(width, height);
    if (minDim < 60) return null;
    return (
      <g opacity="0.8" stroke="#475569" strokeWidth="1.2" fill="none">
        {/* Main 3-Seater Sofa at top */}
        <rect x={width * 0.25} y={height * 0.1} width={width * 0.5} height={height * 0.22} rx="4" fill="#334155" />
        <rect x={width * 0.27} y={height * 0.12} width={width * 0.46} height={height * 0.15} rx="2" fill="#1e293b" />

        {/* Coffee Table */}
        <rect x={width * 0.35} y={height * 0.4} width={width * 0.3} height={height * 0.2} rx="3" fill="#0f172a" stroke="#64748b" />
        <circle cx={width * 0.5} cy={height * 0.5} r={Math.min(width, height) * 0.05} fill="#475569" />

        {/* Left Armchair */}
        <rect x={width * 0.08} y={height * 0.35} width={width * 0.2} height={height * 0.25} rx="3" fill="#334155" />
        {/* Right Armchair */}
        <rect x={width * 0.72} y={height * 0.35} width={width * 0.2} height={height * 0.25} rx="3" fill="#334155" />
      </g>
    );
  }

  // Master Bedroom / Bedroom Furniture (Bed, Pillows, Nightstands, Wardrobe)
  if (type.includes('bedroom') || type.includes('master') || type.includes('bed')) {
    if (width < 50 || height < 50) return null;
    return (
      <g opacity="0.85" stroke="#475569" strokeWidth="1.2" fill="none">
        {/* Double Bed Frame */}
        <rect x={width * 0.2} y={height * 0.15} width={width * 0.6} height={height * 0.65} rx="4" fill="#1e293b" stroke="#64748b" />
        {/* Headboard */}
        <rect x={width * 0.2} y={height * 0.15} width={width * 0.6} height={height * 0.1} fill="#475569" />
        {/* Pillows */}
        <rect x={width * 0.25} y={height * 0.28} width={width * 0.22} height={height * 0.12} rx="2" fill="#334155" />
        <rect x={width * 0.53} y={height * 0.28} width={width * 0.22} height={height * 0.12} rx="2" fill="#334155" />
        {/* Blanket Fold Line */}
        <line x1={width * 0.2} y1={height * 0.45} x2={width * 0.8} y2={height * 0.45} stroke="#64748b" strokeWidth="1.5" strokeDasharray="3 2" />

        {/* Nightstands */}
        <rect x={width * 0.05} y={height * 0.15} width={width * 0.12} height={height * 0.15} rx="2" fill="#334155" />
        <circle cx={width * 0.11} cy={height * 0.225} r="3" fill="#94a3b8" />
        <rect x={width * 0.83} y={height * 0.15} width={width * 0.12} height={height * 0.15} rx="2" fill="#334155" />
        <circle cx={width * 0.89} cy={height * 0.225} r="3" fill="#94a3b8" />
      </g>
    );
  }

  // Kitchen Furniture (L-Counter, Cooktop 4-burner, Sink, Refrigerator)
  if (type.includes('kitchen')) {
    return (
      <g opacity="0.85" stroke="#475569" strokeWidth="1.2" fill="none">
        {/* L-Shaped Kitchen Counter */}
        <path d={`M ${width * 0.08} ${height * 0.08} L ${width * 0.92} ${height * 0.08} L ${width * 0.92} ${height * 0.45} L ${width * 0.68} ${height * 0.45} L ${width * 0.68} ${height * 0.3} L ${width * 0.08} ${height * 0.3} Z`} fill="#1e293b" stroke="#64748b" />

        {/* 4-Burner Stove Cooktop */}
        <rect x={width * 0.15} y={height * 0.12} width={width * 0.25} height={height * 0.15} rx="2" fill="#0f172a" stroke="#64748b" />
        <circle cx={width * 0.2} cy={height * 0.16} r="4" fill="#475569" />
        <circle cx={width * 0.35} cy={height * 0.16} r="4" fill="#475569" />
        <circle cx={width * 0.2} cy={height * 0.23} r="4" fill="#475569" />
        <circle cx={width * 0.35} cy={height * 0.23} r="4" fill="#475569" />

        {/* Kitchen Sink with Faucet */}
        <rect x={width * 0.72} y={height * 0.15} width={width * 0.16} height={height * 0.2} rx="2" fill="#0f172a" stroke="#64748b" />
        <circle cx={width * 0.8} cy={height * 0.18} r="3" fill="#94a3b8" />

        {/* Refrigerator Box */}
        <rect x={width * 0.08} y={height * 0.55} width={width * 0.25} height={height * 0.35} rx="3" fill="#334155" stroke="#64748b" />
        <line x1={width * 0.08} y1={height * 0.62} x2={width * 0.33} y2={height * 0.62} stroke="#64748b" />
      </g>
    );
  }

  // Bathroom / Toilet (Bathtub, Toilet Commode, Vanity Sink)
  if (type.includes('toilet') || type.includes('bath')) {
    return (
      <g opacity="0.85" stroke="#475569" strokeWidth="1.2" fill="none">
        {/* Bathtub */}
        <rect x={width * 0.1} y={height * 0.1} width={width * 0.8} height={height * 0.35} rx="8" fill="#1e293b" stroke="#64748b" />
        <ellipse cx={width * 0.5} cy={height * 0.275} rx={width * 0.32} ry={height * 0.12} fill="#0f172a" />

        {/* Toilet Commode Tank + Bowl */}
        <rect x={width * 0.12} y={height * 0.6} width={width * 0.25} height={height * 0.12} rx="2" fill="#334155" stroke="#64748b" />
        <ellipse cx={width * 0.245} cy={height * 0.82} rx={width * 0.1} ry={height * 0.12} fill="#1e293b" stroke="#64748b" />

        {/* Vanity Sink */}
        <rect x={width * 0.6} y={height * 0.55} width={width * 0.3} height={height * 0.35} rx="3" fill="#1e293b" stroke="#64748b" />
        <ellipse cx={width * 0.75} cy={height * 0.72} rx={width * 0.1} ry={height * 0.08} fill="#0f172a" />
      </g>
    );
  }

  // Dining Room (Dining Table + 4 Chairs)
  if (type.includes('dining')) {
    return (
      <g opacity="0.85" stroke="#475569" strokeWidth="1.2" fill="none">
        <rect x={width * 0.25} y={height * 0.25} width={width * 0.5} height={height * 0.5} rx="6" fill="#1e293b" stroke="#64748b" />
        {/* 4 Chairs */}
        <rect x={width * 0.35} y={height * 0.12} width={width * 0.3} height={height * 0.1} rx="2" fill="#334155" />
        <rect x={width * 0.35} y={height * 0.78} width={width * 0.3} height={height * 0.1} rx="2" fill="#334155" />
        <rect x={width * 0.1} y={height * 0.35} width={width * 0.1} height={height * 0.3} rx="2" fill="#334155" />
        <rect x={width * 0.8} y={height * 0.35} width={width * 0.1} height={height * 0.3} rx="2" fill="#334155" />
      </g>
    );
  }

  // Puja Room / Altar Shrine
  if (type.includes('puja')) {
    return (
      <g opacity="0.9" stroke="#f59e0b" strokeWidth="1.2" fill="none">
        <rect x={width * 0.2} y={height * 0.2} width={width * 0.6} height={height * 0.6} rx="4" fill="rgba(245,158,11,0.1)" stroke="#f59e0b" />
        <circle cx={width * 0.5} cy={height * 0.5} r={Math.min(width, height) * 0.18} fill="none" stroke="#f59e0b" strokeWidth="1.5" />
        <polygon points={`${width*0.5},${height*0.35} ${width*0.42},${height*0.55} ${width*0.58},${height*0.55}`} fill="#f59e0b" opacity="0.6" />
      </g>
    );
  }

  // Parking / Car Outline
  if (type.includes('parking') || type.includes('garage') || type.includes('porch')) {
    return (
      <g opacity="0.75" stroke="#38bdf8" strokeWidth="1.2" fill="none">
        <rect x={width * 0.2} y={height * 0.1} width={width * 0.6} height={height * 0.8} rx="12" fill="rgba(56,189,248,0.05)" stroke="#38bdf8" strokeDasharray="4 2" />
        <rect x={width * 0.28} y={height * 0.28} width={width * 0.44} height={height * 0.44} rx="6" fill="#1e293b" />
      </g>
    );
  }

  // Staircase (2D Step Treads, Handrails, Flight Divider & UP Direction Arrow)
  if (type.includes('stair')) {
    const numSteps = 10;
    const stepH = (height * 0.8) / numSteps;
    const startY = height * 0.1;
    const midX = width * 0.5;

    return (
      <g opacity="0.9">
        {/* Stair Outer Outline */}
        <rect x={width * 0.1} y={startY} width={width * 0.8} height={height * 0.8} fill="rgba(51, 65, 85, 0.2)" stroke="#3b82f6" strokeWidth="1.5" rx="3" />

        {/* Central Flight Divider Line */}
        <line x1={midX} y1={startY} x2={midX} y2={startY + height * 0.8} stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="4 2" />

        {/* Parallel Step Tread Lines */}
        {Array.from({ length: numSteps }).map((_, i) => (
          <line
            key={`stair-step-${i}`}
            x1={width * 0.1}
            y1={startY + i * stepH}
            x2={width * 0.9}
            y2={startY + i * stepH}
            stroke="#64748b"
            strokeWidth="1.2"
          />
        ))}

        {/* Direction Arrow line "UP" */}
        <line x1={width * 0.3} y1={startY + height * 0.75} x2={width * 0.3} y2={startY + height * 0.15} stroke="#10b981" strokeWidth="2" />
        <polygon points={`${width*0.3},${startY+height*0.1} ${width*0.25},${startY+height*0.18} ${width*0.35},${startY+height*0.18}`} fill="#10b981" />
        <text x={width * 0.3} y={startY + height * 0.82} fill="#10b981" fontSize="9" fontWeight="800" textAnchor="middle">UP</text>
      </g>
    );
  }

  return null;
};

