import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Toolbar, Typography } from "@mui/material";
import Legend from "./components/Legend";
import Diagram from "./components/Diagram";
import ReferenceIndex from "./components/ReferenceIndex";
import { computeDistMap, computePathUnion } from "./lib/graph";
import type { AimMode } from "./lib/badges";

const TOOLBAR_HEIGHT = 48;

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [targets, setTargets] = useState<string[]>([]);

  const mode: AimMode = selectedId
    ? "trace"
    : targets.length === 1
      ? "gradient"
      : targets.length >= 2
        ? "intersect"
        : "none";

  const distMaps = useMemo(() => {
    if (targets.length !== 1) return [];
    return [computeDistMap(targets[0])];
  }, [targets]);

  const pathUnion = useMemo(() => {
    if (targets.length < 2) return null;
    return computePathUnion(targets);
  }, [targets]);

  function selectNode(id: string) {
    setTargets([]);
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

  useEffect(() => {
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") {
        setSelectedId(null);
        setTargets([]);
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
            mode={mode}
            distMaps={distMaps}
            pathUnion={pathUnion}
            onSelect={selectNode}
            onToggleAim={toggleTarget}
          />

          <Box
            component="footer"
            sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: "divider" }}
          >
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              21 schemes · 67 next-available links · Gaining Grounds 2025
              tournament pack
            </Typography>
          </Box>
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
              distMaps={distMaps}
              pathUnion={pathUnion}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
