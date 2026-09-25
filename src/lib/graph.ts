import { CYCLE, SCHEMES, type Scheme } from "../data/schemes";

export const byId: Record<string, Scheme> = {};
SCHEMES.forEach((s) => {
  byId[s.id] = s;
});

export const cycleIndex: Record<string, number> = {};
CYCLE.forEach((id, i) => {
  cycleIndex[id] = i;
});

const CYCLE_LENGTH = CYCLE.length;
const MAX_HOPS = 3;
const MAX_CHAIN_LENGTH = 4;
const MAX_SHORT_CHORD_STEPS = 5;

export const incoming: Record<string, string[]> = {};
SCHEMES.forEach((s) => {
  incoming[s.id] = [];
});
SCHEMES.forEach((s) => {
  s.next.forEach((n) => {
    incoming[n].push(s.id);
  });
});

export type EdgeKind = "ring" | "short" | "long";

export interface Edge {
  source: string;
  target: string;
  kind: EdgeKind;
  steps: number;
}

export function edgeKey(source: string, target: string): string {
  return `${source}>${target}`;
}

function shortestRingDistance(a: string, b: string): number {
  const d = Math.abs(cycleIndex[a] - cycleIndex[b]);
  return Math.min(d, CYCLE_LENGTH - d);
}

export const EDGES: Edge[] = [];
SCHEMES.forEach((s) => {
  s.next.forEach((n) => {
    const isRingEdge = cycleIndex[n] === (cycleIndex[s.id] + 1) % CYCLE_LENGTH;
    const steps = shortestRingDistance(s.id, n);
    const kind: EdgeKind = isRingEdge
      ? "ring"
      : steps <= MAX_SHORT_CHORD_STEPS
        ? "short"
        : "long";
    EDGES.push({ source: s.id, target: n, kind, steps });
  });
});

function enumerateAllSimpleChains(): string[][] {
  const chains: string[][] = [];
  function extendChain(path: string[]) {
    chains.push(path.slice());
    if (path.length === MAX_CHAIN_LENGTH) return;
    byId[path[path.length - 1]].next.forEach((next) => {
      if (!path.includes(next)) {
        path.push(next);
        extendChain(path);
        path.pop();
      }
    });
  }
  SCHEMES.forEach((s) => extendChain([s.id]));
  return chains;
}

export const ALL_CHAINS: string[][] = enumerateAllSimpleChains();

export function computeHopsToTarget(targetId: string): Record<string, number> {
  const dist: Record<string, number> = { [targetId]: 0 };
  const queue: string[] = [targetId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (dist[cur] >= MAX_HOPS) continue;
    incoming[cur].forEach((p) => {
      if (dist[p] === undefined) {
        dist[p] = dist[cur] + 1;
        queue.push(p);
      }
    });
  }
  return dist;
}

export function computeHopsFromSource(
  sourceId: string,
): Record<string, number> {
  const dist: Record<string, number> = { [sourceId]: 0 };
  const queue: string[] = [sourceId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (dist[cur] >= MAX_HOPS) continue;
    byId[cur].next.forEach((n) => {
      if (dist[n] === undefined) {
        dist[n] = dist[cur] + 1;
        queue.push(n);
      }
    });
  }
  return dist;
}

export interface PathUnion {
  matchCount: number;
  nodeSet: Set<string>;
  edgeSet: Set<string>;
  startSet: Set<string>;
}

function unionFromChains(chains: string[][]): PathUnion {
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();
  const startSet = new Set<string>();
  chains.forEach((chain) => {
    chain.forEach((id) => nodeSet.add(id));
    startSet.add(chain[0]);
    for (let i = 0; i < chain.length - 1; i++) {
      edgeSet.add(edgeKey(chain[i], chain[i + 1]));
    }
  });
  return { matchCount: chains.length, nodeSet, edgeSet, startSet };
}

export function computePathUnion(ids: string[]): PathUnion {
  const matching = ALL_CHAINS.filter((chain) =>
    ids.every((id) => chain.includes(id)),
  );
  return unionFromChains(matching);
}

export function computeSourceTargetUnion(
  sources: string[],
  targets: string[],
): PathUnion {
  const matching = ALL_CHAINS.filter((chain) => {
    if (!sources.includes(chain[0])) return false;
    return targets.every((t) => chain.includes(t));
  });
  return unionFromChains(matching);
}
