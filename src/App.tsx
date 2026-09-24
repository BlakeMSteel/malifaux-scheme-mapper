import { useEffect, useMemo, useState } from "react";
import { AppBar, Box, Container, Toolbar, Typography } from "@mui/material";
import Legend from "./components/Legend";
import Diagram from "./components/Diagram";
import AimBar from "./components/AimBar";
import ReferenceIndex from "./components/ReferenceIndex";
import { computeDistMap, computePathUnion } from "./lib/graph";
import type { AimMode } from "./lib/badges";

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

  function clearAim() {
    setTargets([]);
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
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar variant="dense">
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, letterSpacing: 0, color: "#5aa348" }}
          >
            Malifaux Scheme Mapper
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 3, flex: 1 }}>
        <Box component="header" sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", display: "block", mb: 0.5 }}
          >
            Malifaux Fourth Edition · Gaining Grounds 2025 · General Schemes
          </Typography>
          <Typography
            variant="body1"
            sx={{ maxWidth: "68ch", color: "text.secondary", mb: 2 }}
          >
            Each of the 21 general schemes lists three or four{" "}
            <Box component="strong" sx={{ color: "text.primary" }}>
              next available schemes
            </Box>{" "}
            — the only options you may select once that scheme is in play. All
            21 share one unbroken loop that touches every scheme exactly once;
            that loop forms the ring below, with every other link drawn as a
            curve off to the side.
          </Typography>
          <Legend />
        </Box>

        <Box
          component="section"
          aria-label="Scheme link diagram"
          sx={{
            position: "relative",
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            borderRadius: 2,
            boxShadow: 1,
            mb: 4,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 1.5,
              px: 2.5,
              pt: 2,
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              The Scheme Pool
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              drag to pan · use +/&minus; to zoom
            </Typography>
          </Box>
          <AimBar
            selectedId={selectedId}
            targets={targets}
            pathUnion={pathUnion}
            onRemove={toggleTarget}
            onClear={clearAim}
          />
          <Diagram
            selectedId={selectedId}
            onSelectNode={selectNode}
            onClearSelection={clearSelection}
            targets={targets}
            distMaps={distMaps}
            pathUnion={pathUnion}
          />
        </Box>

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
          sx={{ mt: 5, pt: 2, borderTop: 1, borderColor: "divider" }}
        >
          <Typography variant="caption" sx={{ color: "text.disabled" }}>
            21 schemes · 67 next-available links · Gaining Grounds 2025
            tournament pack
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
