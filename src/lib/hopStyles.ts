export interface HopStyle {
  nodeRadius: number;
  nodeOpacity: number;
  edgeOpacity: number;
  edgeWidth: number;
}

export const HOP_STYLES: HopStyle[] = [
  { nodeRadius: 11, nodeOpacity: 1, edgeOpacity: 0, edgeWidth: 0 },
  { nodeRadius: 9, nodeOpacity: 1, edgeOpacity: 1, edgeWidth: 2.6 },
  { nodeRadius: 8, nodeOpacity: 0.75, edgeOpacity: 0.7, edgeWidth: 2 },
  { nodeRadius: 7, nodeOpacity: 0.55, edgeOpacity: 0.45, edgeWidth: 1.5 },
];
