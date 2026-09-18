import { UnitType } from '../types';

// 1 meter = 3.28084 feet
// 1 meter = 39.3701 inches
// 1 meter = 100 centimeters
// 1 meter = 1000 millimeters

export function convertFromMeters(meters: number, unit: UnitType, precision: number = 2): number {
  let val = meters;
  switch (unit) {
    case 'feet':
      val = meters * 3.28084;
      break;
    case 'inch':
      val = meters * 39.3701;
      break;
    case 'centimeter':
      val = meters * 100;
      break;
    case 'millimeter':
      val = meters * 1000;
      break;
    case 'meter':
    default:
      val = meters;
      break;
  }
  return Number(val.toFixed(precision));
}

export function convertToMeters(val: number, unit: UnitType): number {
  switch (unit) {
    case 'feet':
      return val / 3.28084;
    case 'inch':
      return val / 39.3701;
    case 'centimeter':
      return val / 100;
    case 'millimeter':
      return val / 1000;
    case 'meter':
    default:
      return val;
  }
}

export function formatDimension(meters: number, unit: UnitType): string {
  const converted = convertFromMeters(meters, unit, unit === 'millimeter' ? 0 : 1);
  const symbol = unit === 'feet' ? 'ft' : unit === 'meter' ? 'm' : unit === 'inch' ? 'in' : unit === 'centimeter' ? 'cm' : 'mm';
  return `${converted} ${symbol}`;
}

export function formatArea(squareMeters: number, unit: UnitType): string {
  if (unit === 'feet') {
    const sqFt = Math.round(squareMeters * 10.7639);
    return `${sqFt} sq.ft`;
  }
  return `${squareMeters.toFixed(1)} sq.m`;
}
