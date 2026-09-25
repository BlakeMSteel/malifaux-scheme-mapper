import { CYCLE, SCHEMES } from "../data/schemes";
import { cycleIndex } from "./graph";

export const N = CYCLE.length;
export const VIEWBOX = 1200;
export const CENTER = VIEWBOX / 2;
export const RING_RADIUS = 330;
export const SHORT_BAND_MIN = RING_RADIUS + 65;
export const SHORT_BAND_MAX = RING_RADIUS + 165;
export const LABEL_RADIUS = RING_RADIUS + 42;
export const NODE_RADIUS = 8;

const MAX_RING_STEPS_APART = Math.floor(N / 2);
const MIN_LONG_STEPS = 7;
const MAX_SHORT_STEPS = 5;
const EDGE_INSET = 14;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function stepToward(
  point: { x: number; y: number },
  target: { x: number; y: number },
  dist: number,
): { x: number; y: number } {
  const dx = target.x - point.x;
  const dy = target.y - point.y;
  const len = Math.hypot(dx, dy) || 1;
  return { x: point.x + (dx / len) * dist, y: point.y + (dy / len) * dist };
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function angleForIndex(i: number): number {
  return -90 + (i * 360) / N;
}

export function pointOnCircle(angleDeg: number, radius: number) {
  const rad = toRad(angleDeg);
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

export interface NodeLayout {
  id: string;
  angle: number;
  x: number;
  y: number;
  labelX: number;
  labelY: number;
  labelAnchor: "start" | "end";
  labelRotation: number;
}

export const NODE_LAYOUT: Record<string, NodeLayout> = {};
CYCLE.forEach((id, i) => {
  const angle = angleForIndex(i);
  const { x, y } = pointOnCircle(angle, RING_RADIUS);
  const label = pointOnCircle(angle, LABEL_RADIUS);
  const normalizedAngle = ((angle + 180) % 360) - 180;
  const flip = Math.abs(normalizedAngle) > 90;
  NODE_LAYOUT[id] = {
    id,
    angle,
    x,
    y,
    labelX: label.x,
    labelY: label.y,
    labelAnchor: flip ? "end" : "start",
    labelRotation: flip ? angle + 180 : angle,
  };
});

export const NODE_ORDER = SCHEMES.map((s) => s.id).sort(
  (a, b) => cycleIndex[a] - cycleIndex[b],
);

function shortArcMidIndex(a: string, b: string): number {
  const ia = cycleIndex[a];
  const ib = cycleIndex[b];
  const fwd = ((ib - ia) % N) + (ib < ia ? N : 0);
  const back = N - fwd;
  if (fwd <= back) return ia + fwd / 2;
  return ia - back / 2;
}

function inset(
  a: string,
  b: string,
  deg: number,
): { start: number; end: number } {
  const ia = cycleIndex[a];
  const ib = cycleIndex[b];
  const fwd = ((ib - ia) % N) + (ib < ia ? N : 0);
  const arcDirection = fwd <= N - fwd ? 1 : -1;
  return {
    start: angleForIndex(ia) + arcDirection * deg,
    end: angleForIndex(ib) - arcDirection * deg,
  };
}

export function ringPath(a: string, b: string): string {
  const { start, end } = inset(a, b, 2.5);
  const p1 = pointOnCircle(start, RING_RADIUS);
  const p2 = pointOnCircle(end, RING_RADIUS);
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

export function shortChordPath(a: string, b: string, steps: number): string {
  const mid = shortArcMidIndex(a, b);
  const t = clamp01((steps - 2) / (MAX_SHORT_STEPS - 2));
  const bulge = SHORT_BAND_MIN + t * (SHORT_BAND_MAX - SHORT_BAND_MIN);
  const control = pointOnCircle(angleForIndex(mid), bulge);
  const p1 = stepToward(NODE_LAYOUT[a], control, EDGE_INSET);
  const p2 = stepToward(NODE_LAYOUT[b], control, EDGE_INSET);
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

export function longChordPath(a: string, b: string, steps: number): string {
  const mid = shortArcMidIndex(a, b);
  const t = clamp01(
    (steps - MIN_LONG_STEPS) / (MAX_RING_STEPS_APART - MIN_LONG_STEPS),
  );
  const depth = RING_RADIUS * (0.6 - t * 0.52);
  const control = pointOnCircle(angleForIndex(mid), depth);
  const p1 = stepToward(NODE_LAYOUT[a], control, EDGE_INSET);
  const p2 = stepToward(NODE_LAYOUT[b], control, EDGE_INSET);
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}
