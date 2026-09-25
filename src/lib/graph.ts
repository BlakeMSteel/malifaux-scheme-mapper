import { CYCLE, SCHEMES, type Scheme } from "../data/schemes";

export const byId: Record<string, Scheme> = {};
SCHEMES.forEach((s) => {
  byId[s.id] = s;
});

export const cycleIndex: Record<string, number> = {};
CYCLE.forEach((id, i) => {
  cycleIndex[id] = i;
});

const N = CYCLE.length;

// Reverse lookup: which schemes list this scheme as a next-available option.
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

/** Circular distance between two cycle positions (ring hops apart, both directions). */
function ringSteps(a: string, b: string): number {
  const d = Math.abs(cycleIndex[a] - cycleIndex[b]);
  return Math.min(d, N - d);
}

// All 67 directed edges, classified per the spec:
//  - ring: consecutive in the Hamiltonian cycle (drawn as the ring itself)
//  - short: <=5 steps apart, not a ring edge (small arcs outside the ring)
//  - long: >=7 steps apart (chords through the interior)
export const EDGES: Edge[] = [];
SCHEMES.forEach((s) => {
  s.next.forEach((n) => {
    const isRingEdge = cycleIndex[n] === (cycleIndex[s.id] + 1) % N;
    const steps = ringSteps(s.id, n);
    EDGES.push({
      source: s.id,
      target: n,
      kind: isRingEdge ? "ring" : steps <= 5 ? "short" : "long",
      steps,
    });
  });
});

// Every simple directed chain of 1..4 schemes anywhere in the graph — small
// enough (~1000) to brute-force once and reuse for every "Aim For" query.
export const ALL_CHAINS: string[][] = (() => {
  const out: string[][] = [];
  function dfs(path: string[]) {
    out.push(path.slice());
    if (path.length === 4) return;
    byId[path[path.length - 1]].next.forEach((nxt) => {
      if (!path.includes(nxt)) {
        path.push(nxt);
        dfs(path);
        path.pop();
      }
    });
  }
  SCHEMES.forEach((s) => dfs([s.id]));
  return out;
})();

/** BFS backward along "next" links, capped at 3 hops, from a single target:
 * dist[x] = hops needed to REACH the target starting from x. */
export function computeDistMap(targetId: string): Record<string, number> {
  const dist: Record<string, number> = { [targetId]: 0 };
  const queue: string[] = [targetId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (dist[cur] >= 3) continue;
    incoming[cur].forEach((p) => {
      if (dist[p] === undefined) {
        dist[p] = dist[cur] + 1;
        queue.push(p);
      }
    });
  }
  return dist;
}

/** BFS forward along "next" links, capped at 3 hops, from a single source:
 * dist[x] = hops needed to REACH x starting from the source. Mirror of
 * computeDistMap for the "Aim From" direction. */
export function computeDistMapForward(
  sourceId: string,
): Record<string, number> {
  const dist: Record<string, number> = { [sourceId]: 0 };
  const queue: string[] = [sourceId];
  while (queue.length) {
    const cur = queue.shift()!;
    if (dist[cur] >= 3) continue;
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
}

function unionFromChains(chains: string[][]): PathUnion {
  const nodeSet = new Set<string>();
  const edgeSet = new Set<string>();
  chains.forEach((chain) => {
    chain.forEach((id) => nodeSet.add(id));
    for (let i = 0; i < chain.length - 1; i++) {
      edgeSet.add(chain[i] + ">" + chain[i + 1]);
    }
  });
  return { matchCount: chains.length, nodeSet, edgeSet };
}

/** Union of every simple chain (<=4 schemes) that contains ALL given ids. */
export function computePathUnion(ids: string[]): PathUnion {
  const matching = ALL_CHAINS.filter((chain) =>
    ids.every((id) => chain.includes(id)),
  );
  return unionFromChains(matching);
}

/** Union of every simple chain (<=4 schemes) where at least one of the given
 * sources leads to ALL of the given targets — i.e. some source appears
 * before every target in the chain, so the chain genuinely represents a
 * source reaching that full set of targets (order among the targets
 * themselves doesn't matter, same as computePathUnion). */
export function computeSourceTargetUnion(
  sources: string[],
  targets: string[],
): PathUnion {
  const matching = ALL_CHAINS.filter((chain) => {
    if (!targets.every((t) => chain.includes(t))) return false;
    const minTargetIdx = Math.min(...targets.map((t) => chain.indexOf(t)));
    return sources.some((s) => {
      const si = chain.indexOf(s);
      return si !== -1 && si < minTargetIdx;
    });
  });
  return unionFromChains(matching);
}
