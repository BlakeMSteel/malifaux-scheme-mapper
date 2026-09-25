import { useEffect, useMemo, useState } from "react";
import { Box } from "@mui/material";
import Header, { TOOLBAR_HEIGHT } from "./components/Header";
import Legend from "./components/Legend";
import Diagram from "./components/Diagram";
import ReferenceIndex from "./components/ReferenceIndex";
import {
  computeHopsFromSource,
  computeHopsToTarget,
  computePathUnion,
  computeSourceTargetUnion,
} from "./lib/graph";
import { aimMode, type AimContext } from "./lib/badges";

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  const combined = targets.length >= 1 && sources.length >= 1;
  const mode = aimMode(selectedId, targets, sources);

  const hopsFromSources = useMemo(() => {
    return sources.map((s) => computeHopsFromSource(s));
  }, [sources]);

  const hopsToTargets = useMemo(() => {
    return targets.map((t) => computeHopsToTarget(t));
  }, [targets]);

  const hopsFromTargets = useMemo(() => {
    return targets.map((t) => computeHopsFromSource(t));
  }, [targets]);

  const pathUnion = useMemo(() => {
    if (combined) return computeSourceTargetUnion(sources, targets);
    if (targets.length >= 2) return computePathUnion(targets);
    return null;
  }, [combined, sources, targets]);

  const aim: AimContext = useMemo(
    () => ({
      mode,
      targets,
      sources,
      hopsFromSources,
      pathUnion,
      hopsToTargets,
      hopsFromTargets,
    }),
    [
      mode,
      targets,
      sources,
      hopsFromSources,
      pathUnion,
      hopsToTargets,
      hopsFromTargets,
    ],
  );

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
      <Header />

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          component="aside"
          sx={{
            width: { xs: "100%", md: 380 },
            flexShrink: 0,
            borderRight: { xs: 0, md: 1 },
            borderBottom: { xs: 1, md: 0 },
            borderColor: "divider",
            bgcolor: "grey.50",
            p: { xs: 1.5, sm: 2.5 },
            position: { xs: "static", md: "sticky" },
            top: TOOLBAR_HEIGHT,
            alignSelf: "flex-start",
            height: { xs: "auto", md: `calc(100dvh - ${TOOLBAR_HEIGHT}px)` },
            overflowY: { xs: "visible", md: "auto" },
          }}
        >
          <ReferenceIndex
            selectedId={selectedId}
            aim={aim}
            onSelect={selectNode}
            onToggleAim={toggleTarget}
            onToggleSource={toggleSource}
          />
        </Box>

        <Box
          component="main"
          sx={{ flex: 1, minWidth: 0, p: { xs: 1.5, sm: 3 } }}
        >
          <Box component="header" sx={{ mb: { xs: 1.5, sm: 3 } }}>
            <Legend />
          </Box>

          <Box
            component="section"
            aria-label="Scheme link diagram"
            sx={{ position: "relative", overflowX: "auto" }}
          >
            <Diagram
              selectedId={selectedId}
              onSelectNode={selectNode}
              onClearSelection={clearSelection}
              targets={targets}
              sources={sources}
              hopsFromSources={hopsFromSources}
              pathUnion={pathUnion}
              hopsToTargets={hopsToTargets}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
