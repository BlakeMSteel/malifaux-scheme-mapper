import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { byId, type PathUnion } from "../lib/graph";

interface AimBarProps {
  selectedId: string | null;
  targets: string[];
  pathUnion: PathUnion | null;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export default function AimBar({
  selectedId,
  targets,
  pathUnion,
  onRemove,
  onClear,
}: AimBarProps) {
  let hint: string;
  if (selectedId) {
    hint =
      "tracing " +
      byId[selectedId].name +
      " — solid = leads to · dashed = led here from · click again or press Escape to clear";
  } else if (targets.length === 0) {
    hint =
      "tap a scheme to trace it, or mark up to 3 targets below to aim for them";
  } else if (targets.length === 1) {
    hint =
      "colored by hops to your target · brighter = closer · dim = out of reach within 3";
  } else if (pathUnion && pathUnion.matchCount > 0) {
    hint =
      pathUnion.matchCount +
      (pathUnion.matchCount === 1 ? " chain of " : " chains of ") +
      "≤4 schemes include all " +
      targets.length +
      " targets together · highlighted = on one of them";
  } else {
    hint =
      "no chain of ≤4 schemes includes all " +
      targets.length +
      " targets together — try removing one";
  }

  const warn =
    targets.length >= 2 && (!pathUnion || pathUnion.matchCount === 0);

  return (
    <>
      <Typography
        variant="body2"
        sx={{
          mx: 2.5,
          mt: 1,
          color: warn ? "error.main" : "text.secondary",
          fontWeight: warn ? 600 : 400,
        }}
      >
        {hint}
      </Typography>
      <Stack
        direction="row"
        useFlexGap
        sx={{
          flexWrap: "wrap",
          alignItems: "center",
          gap: 1,
          mx: 2.5,
          mt: 1,
          p: 1.25,
          borderRadius: 1.5,
          bgcolor: "grey.50",
          border: 1,
          borderStyle: "dashed",
          borderColor: "divider",
        }}
      >
        <Typography variant="caption" sx={{ color: "text.disabled", mr: 0.5 }}>
          AIMING FOR
        </Typography>
        {targets.map((id, ti) => (
          <Chip
            key={id}
            size="small"
            label={byId[id].name}
            onDelete={() => onRemove(id)}
            sx={{
              bgcolor: `var(--target-${ti})`,
              color: "#fff",
              fontWeight: 600,
              "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.75)" },
              "& .MuiChip-deleteIcon:hover": { color: "#fff" },
            }}
          />
        ))}
        {targets.length === 0 && (
          <Typography variant="body2" sx={{ color: "text.disabled" }}>
            mark up to 3 schemes below with the target button
          </Typography>
        )}
        {targets.length > 0 && (
          <Box sx={{ ml: "auto" }}>
            <Button size="small" variant="outlined" onClick={onClear}>
              Clear
            </Button>
          </Box>
        )}
      </Stack>
    </>
  );
}
