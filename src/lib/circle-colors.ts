export const CIRCLE_COLORS = [
  '#E07060', // coral
  '#6B9B7A', // sage
  '#5B9EC9', // sky
  '#C4883A', // amber
  '#8B7BB5', // lavender
  '#C4607E', // rose
] as const;

export function getCircleColor(index: number): string {
  return CIRCLE_COLORS[index % CIRCLE_COLORS.length];
}
