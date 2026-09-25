import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import Legend from "./components/Legend";
import Diagram from "./components/Diagram";
import ReferenceIndex from "./components/ReferenceIndex";
import {
  computeDistMap,
  computeDistMapForward,
  computePathUnion,
  computeSourceTargetUnion,
} from "./lib/graph";
import type { AimMode } from "./lib/badges";

const TOOLBAR_HEIGHT = 48;

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  // Sources and targets coexist: picking both shows which sources can reach
  // the targets, plus where the targets lead onward. Trace-select remains
  // exclusive with both.
  const combined = targets.length >= 1 && sources.length >= 1;

  const mode: AimMode = selectedId
    ? "trace"
    : combined
      ? "combined"
      : targets.length === 1
        ? "toGradient"
        : targets.length >= 2
          ? "toIntersect"
          : sources.length >= 1
            ? "fromGradient"
            : "none";

  // Hops FROM each active source TO x (forward) — used for the "Aim From"
  // gradient.
  const distMaps = useMemo(() => {
    return sources.map((s) => computeDistMapForward(s));
  }, [sources]);

  // Hops FROM x TO each active target (backward) — "if I start here, how
  // far to the target" — drives the source-button badge whenever a target
  // is active.
  const targetBackwardDistMaps = useMemo(() => {
    return targets.map((t) => computeDistMap(t));
  }, [targets]);

  // Hops FROM each active target TO x (forward) — "if I aim here, how far
  // is it from the target I already have" — drives the target-button
  // badge and the "beyond the target" reachability.
  const targetForwardDistMaps = useMemo(() => {
    return targets.map((t) => computeDistMapForward(t));
  }, [targets]);

  const pathUnion = useMemo(() => {
    if (combined) return computeSourceTargetUnion(sources, targets);
    if (targets.length >= 2) return computePathUnion(targets);
    return null;
  }, [combined, sources, targets]);

  function selectNode(id: string) {
    setTargets([]);
    setSources([]);
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function clearSelection() {
    setSelectedId(null);
  }

  function toggleTarget(id: string) {
    setSelectedId(null);
    setTargets((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  function toggleSource(id: string) {
    setSelectedId(null);
    setSources((prev) => {
      if (prev.includes(id)) return prev.filter((t) => t !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  }

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setSelectedId(null);
        setTargets([]);
        setSources([]);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <AppBar position="sticky" color="default" elevation={1}>
        <Toolbar variant="dense" sx={{ minHeight: TOOLBAR_HEIGHT }}>
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, letterSpacing: 0, color: "#5aa348" }}
          >
            Malifaux Scheme Mapper
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: "flex", flex: 1, minHeight: 0 }}>
        <Box
          component="aside"
          sx={{
            width: 380,
            flexShrink: 0,
            borderRight: 1,
            borderColor: "divider",
            bgcolor: "grey.50",
            p: 2.5,
            position: "sticky",
            top: TOOLBAR_HEIGHT,
            alignSelf: "flex-start",
            height: `calc(100dvh - ${TOOLBAR_HEIGHT}px)`,
            overflowY: "auto",
          }}
        >
          <ReferenceIndex
            selectedId={selectedId}
            targets={targets}
            sources={sources}
            mode={mode}
            distMaps={distMaps}
            pathUnion={pathUnion}
            targetBackwardDistMaps={targetBackwardDistMaps}
            targetForwardDistMaps={targetForwardDistMaps}
            onSelect={selectNode}
            onToggleAim={toggleTarget}
            onToggleSource={toggleSource}
          />
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, p: 3 }}>
          <Box component="header" sx={{ mb: 3 }}>
            <Legend />
          </Box>

          <Box
            component="section"
            aria-label="Scheme link diagram"
            sx={{ position: "relative" }}
          >
            <Diagram
              selectedId={selectedId}
              onSelectNode={selectNode}
              onClearSelection={clearSelection}
              targets={targets}
              sources={sources}
              distMaps={distMaps}
              pathUnion={pathUnion}
              targetBackwardDistMaps={targetBackwardDistMaps}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
