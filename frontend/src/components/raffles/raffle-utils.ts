export function positionLabel(position: number): string {
  if (position === 1) return '1er lugar';
  if (position === 2) return '2do lugar';
  if (position === 3) return '3er lugar';
  return `${position}° lugar`;
}
