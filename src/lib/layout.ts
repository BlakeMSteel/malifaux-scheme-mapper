import { CYCLE, SCHEMES } from "../data/schemes";
import { cycleIndex } from "./graph";

export const N = CYCLE.length;
export const VIEWBOX = 1200;
export const CENTER = VIEWBOX / 2;
export const RING_RADIUS = 330;
// Short-range bulges: the minimum is large enough that even a 2-step link's
// curve visibly peels away from the ring near its endpoints rather than
// riding alongside it, and the max gives a clearly-readable outer band.
// Labels sit close to the ring (independent of the bulge band) — nodes are
// drawn last, on top of the chords, so an arc passing near a label at its
// peak just runs behind the text, which reads fine in a diagram this dense.
export const SHORT_BAND_MIN = RING_RADIUS + 65;
export const SHORT_BAND_MAX = RING_RADIUS + 165;
export const LABEL_RADIUS = RING_RADIUS + 42;
export const NODE_RADIUS = 8;

const MAX_STEPS = Math.floor(N / 2); // farthest two nodes can sit apart on the ring
const MIN_LONG_STEPS = 7;
const MAX_SHORT_STEPS = 5;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

/** Angle (deg) for a continuous cycle position; i=0 is straight up, increasing clockwise. */
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
  const normalized = ((angle + 180) % 360) - 180; // (-180, 180]
  const flip = Math.abs(normalized) > 90;
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

/** Continuous cycle index of the midpoint along the shorter arc between two nodes. */
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
  // direction the ring/short arc travels from a to b, in index units
  const dir = fwd <= N - fwd ? 1 : -1;
  return {
    start: angleForIndex(ia) + dir * deg,
    end: angleForIndex(ib) - dir * deg,
  };
}

/** Ring edge: arc hugging the circle between two adjacent cycle nodes. */
export function ringPath(a: string, b: string): string {
  const { start, end } = inset(a, b, 2.5);
  const p1 = pointOnCircle(start, RING_RADIUS);
  const p2 = pointOnCircle(end, RING_RADIUS);
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} A ${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

/**
 * Short-range link (<=5 steps): a small arc bulging just outside the ring.
 * Bulge depth is banded by hop distance (2 steps hugs the ring, 5 steps
 * reaches the band's outer edge) so same-span links layer instead of
 * crossing at random, and the whole band stays clear of the label radius.
 */
export function shortChordPath(a: string, b: string, steps: number): string {
  const mid = shortArcMidIndex(a, b);
  const t = clamp01((steps - 2) / (MAX_SHORT_STEPS - 2));
  const bulge = SHORT_BAND_MIN + t * (SHORT_BAND_MAX - SHORT_BAND_MIN);
  const control = pointOnCircle(angleForIndex(mid), bulge);
  const p1 = NODE_LAYOUT[a];
  const p2 = NODE_LAYOUT[b];
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}

/**
 * Long-range link (>=7 steps): a chord curving through the interior.
 * Depth is banded by hop distance into concentric rings (7 steps bows only
 * to ~60% of the ring radius, the ~diametrically-opposite 10-step links bow
 * nearly to center) so long chords fan out by span instead of all
 * converging on a single point near the middle.
 */
export function longChordPath(a: string, b: string, steps: number): string {
  const mid = shortArcMidIndex(a, b);
  const t = clamp01((steps - MIN_LONG_STEPS) / (MAX_STEPS - MIN_LONG_STEPS));
  const depth = RING_RADIUS * (0.6 - t * 0.52);
  const control = pointOnCircle(angleForIndex(mid), depth);
  const p1 = NODE_LAYOUT[a];
  const p2 = NODE_LAYOUT[b];
  return `M ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} Q ${control.x.toFixed(1)} ${control.y.toFixed(1)} ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
}
