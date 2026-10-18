export function positionLabel(position: number): string {
  if (position === 1) return '1er lugar';
  if (position === 2) return '2do lugar';
  if (position === 3) return '3er lugar';
  return `${position}° lugar`;
}

/**
 * Números de ticket legibles: las rachas de tres o más se acortan ("#1 al #4") y el resto va
 * suelto ("#10 y #11"). Ordena y descarta repetidos.
 */
export function formatTicketRanges(numbers: number[]): string {
  const sorted = [...new Set(numbers)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    if (j - i >= 2) {
      parts.push(`#${sorted[i]} al #${sorted[j]}`);
    } else {
      for (let k = i; k <= j; k++) parts.push(`#${sorted[k]}`);
    }
    i = j + 1;
  }
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts[parts.length - 1]}`;
}
