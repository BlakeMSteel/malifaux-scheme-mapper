import {
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { CAT_LABEL, type Scheme } from "../data/schemes";
import { byId, incoming, type PathUnion } from "../lib/graph";
import { hopBadges, type AimMode } from "../lib/badges";

interface SchemeListItemProps {
  scheme: Scheme;
  isActive: boolean;
  expanded: boolean;
  targetIndex: number;
  targetsFull: boolean;
  mode: AimMode;
  targets: string[];
  distMaps: (Record<string, number> | null)[];
  pathUnion: PathUnion | null;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleAim: (id: string) => void;
}

function ChipRow({ label, ids }: { label: string; ids: string[] }) {
  if (!ids.length) return null;
  return (
    <Box sx={{ mt: 1 }}>
      <Typography
        variant="caption"
        sx={{
          color: "text.disabled",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          display: "block",
          mb: 0.5,
        }}
      >
        {label}
      </Typography>
      <Stack direction="row" useFlexGap sx={{ flexWrap: "wrap", gap: 0.5 }}>
        {ids.map((id) => (
          <Chip
            key={id}
            size="small"
            variant="outlined"
            label={byId[id].name}
          />
        ))}
      </Stack>
    </Box>
  );
}

export default function SchemeListItem({
  scheme,
  isActive,
  expanded,
  targetIndex,
  targetsFull,
  mode,
  targets,
  distMaps,
  pathUnion,
  onSelect,
  onToggleExpand,
  onToggleAim,
}: SchemeListItemProps) {
  const badges = hopBadges(scheme.id, mode, targets, distMaps, pathUnion);
  const catColor = `var(--cat-${scheme.cat})`;

  return (
    <Box
      sx={{
        borderLeft: 4,
        borderLeftColor: catColor,
        borderBottom: 1,
        borderBottomColor: "divider",
        bgcolor: isActive ? "action.selected" : undefined,
      }}
    >
      <Stack
        direction="row"
        role="button"
        tabIndex={0}
        onClick={() => onSelect(scheme.id)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onSelect(scheme.id);
          }
        }}
        sx={{
          alignItems: "center",
          gap: 0.5,
          pr: 1,
          cursor: "pointer",
          "&:hover": { bgcolor: "action.hover" },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2,
          },
        }}
      >
        <IconButton
          size="small"
          aria-label={
            expanded ? `Collapse ${scheme.name}` : `Expand ${scheme.name}`
          }
          onClick={(ev) => {
            ev.stopPropagation();
            onToggleExpand(scheme.id);
          }}
          sx={{
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>

        <Typography
          variant="body2"
          noWrap
          sx={{ flex: 1, fontWeight: isActive ? 700 : 600, py: 1 }}
        >
          {scheme.name}
        </Typography>

        <IconButton
          size="small"
          aria-label={`Aim for ${scheme.name}`}
          title={`Aim for ${scheme.name}`}
          disabled={targetIndex === -1 && targetsFull}
          onClick={(ev) => {
            ev.stopPropagation();
            onToggleAim(scheme.id);
          }}
          sx={
            targetIndex !== -1
              ? {
                  bgcolor: `var(--target-${targetIndex})`,
                  color: "#fff",
                  "&:hover": {
                    bgcolor: `var(--target-${targetIndex})`,
                    opacity: 0.85,
                  },
                }
              : undefined
          }
        >
          <GpsFixedIcon fontSize="small" />
        </IconButton>
      </Stack>

      {badges.length > 0 && (
        <Stack
          direction="row"
          useFlexGap
          sx={{ flexWrap: "wrap", gap: 0.5, pl: 5, pr: 1, pb: 1 }}
        >
          {badges.map((b) => (
            <Chip
              key={b.key}
              size="small"
              label={b.label}
              sx={{
                bgcolor: b.muted ? "grey.300" : (b.colorVar ?? "grey.700"),
                color: b.muted ? "text.secondary" : "#fff",
                fontWeight: 600,
              }}
            />
          ))}
        </Stack>
      )}

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 5, pr: 1.5, pb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              color: "text.disabled",
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            {CAT_LABEL[scheme.cat]}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: "text.secondary", mt: 0.75 }}
          >
            {scheme.reveal}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <Box component="strong" sx={{ color: "text.secondary" }}>
              Score
            </Box>{" "}
            {scheme.scoring}{" "}
            <Box component="strong" sx={{ color: "text.secondary" }}>
              Bonus
            </Box>{" "}
            {scheme.bonus}
          </Typography>
          <ChipRow label="Next available" ids={scheme.next} />
          <ChipRow label="Leads here from" ids={incoming[scheme.id]} />
        </Box>
      </Collapse>
    </Box>
  );
}
