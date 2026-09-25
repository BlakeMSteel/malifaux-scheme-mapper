import type { ReactNode } from "react";
import {
  Badge,
  Box,
  Chip,
  Collapse,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import CallSplitIcon from "@mui/icons-material/CallSplit";
import { CAT_LABEL, type Scheme } from "../data/schemes";
import { byId, incoming } from "../lib/graph";
import {
  hopBadges,
  reachingSourceIndices,
  schemeRowState,
  type AimContext,
} from "../lib/badges";

const MAX_TARGETS = 3;
const MAX_SOURCES = 3;

function splitBackground(colors: string[]): string {
  if (colors.length <= 1) return colors[0] ?? "var(--target-0)";
  const n = colors.length;
  const stops = colors.flatMap((c, i) => [
    `${c} ${(i / n) * 100}%`,
    `${c} ${((i + 1) / n) * 100}%`,
  ]);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

function badgeSx(color: string | undefined) {
  return {
    "& .MuiBadge-badge": {
      bgcolor: color ?? "var(--target-0)",
      color: "#fff",
      fontWeight: 700,
      fontSize: "0.62rem",
      minWidth: 16,
      height: 16,
    },
  };
}

interface AimToggleButtonProps {
  icon: ReactNode;
  label: string;
  isSelected: boolean;
  listIsFull: boolean;
  selectedBackground: string | undefined;
  badgeContent: number | undefined;
  badgeColor: string | undefined;
  onToggle: () => void;
}

function AimToggleButton({
  icon,
  label,
  isSelected,
  listIsFull,
  selectedBackground,
  badgeContent,
  badgeColor,
  onToggle,
}: AimToggleButtonProps) {
  return (
    <Badge badgeContent={badgeContent} sx={badgeSx(badgeColor)}>
      <IconButton
        size="small"
        aria-label={label}
        title={label}
        disabled={!isSelected && listIsFull}
        onClick={(event) => {
          event.stopPropagation();
          onToggle();
        }}
        sx={{
          p: { xs: 1, sm: 0.5 },
          ...(isSelected
            ? {
                background: selectedBackground,
                color: "#fff",
                "&:hover": { background: selectedBackground, opacity: 0.85 },
              }
            : undefined),
        }}
      >
        {icon}
      </IconButton>
    </Badge>
  );
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

interface SchemeListItemProps {
  scheme: Scheme;
  isActive: boolean;
  expanded: boolean;
  aim: AimContext;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleAim: (id: string) => void;
  onToggleSource: (id: string) => void;
}

export default function SchemeListItem({
  scheme,
  isActive,
  expanded,
  aim,
  onSelect,
  onToggleExpand,
  onToggleAim,
  onToggleSource,
}: SchemeListItemProps) {
  const targetIndex = aim.targets.indexOf(scheme.id);
  const sourceIndex = aim.sources.indexOf(scheme.id);
  const targetsFull = aim.targets.length >= MAX_TARGETS;
  const sourcesFull = aim.sources.length >= MAX_SOURCES;

  const rowState = schemeRowState(scheme.id, aim);
  const badges = hopBadges(scheme.id, aim);

  const targetReach =
    aim.mode === "combined"
      ? reachingSourceIndices(scheme.id, aim.hopsFromSources)
      : [];
  const targetButtonBackground =
    targetIndex === -1
      ? undefined
      : targetReach.length === 0
        ? `var(--target-${targetIndex})`
        : splitBackground(targetReach.map((si) => `var(--target-${si})`));

  const catColor = `var(--cat-${scheme.cat})`;

  return (
    <Box
      sx={{
        borderLeft: 4,
        borderLeftColor: catColor,
        borderBottom: 1,
        borderBottomColor: "divider",
        bgcolor: isActive ? "action.selected" : rowState.rowTint,
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
            p: { xs: 1, sm: 0.5 },
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.15s ease",
          }}
        >
          <ChevronRightIcon fontSize="small" />
        </IconButton>

        <Typography
          variant="body2"
          noWrap
          sx={{
            flex: 1,
            fontWeight: isActive ? 700 : 600,
            py: 1,
            opacity: rowState.isDimmed ? 0.45 : 1,
          }}
        >
          {scheme.name}
        </Typography>

        <Stack direction="row" spacing={0.25}>
          <AimToggleButton
            icon={<CallSplitIcon fontSize="small" />}
            label={`Use ${scheme.name} as a source`}
            isSelected={sourceIndex !== -1}
            listIsFull={sourcesFull}
            selectedBackground={
              sourceIndex !== -1 ? `var(--target-${sourceIndex})` : undefined
            }
            badgeContent={
              sourceIndex === -1 && sourcesFull
                ? undefined
                : rowState.sourceButtonHopCount
            }
            badgeColor={rowState.sourceButtonColor}
            onToggle={() => onToggleSource(scheme.id)}
          />

          <AimToggleButton
            icon={<GpsFixedIcon fontSize="small" />}
            label={`Aim for ${scheme.name}`}
            isSelected={targetIndex !== -1}
            listIsFull={targetsFull}
            selectedBackground={targetButtonBackground}
            badgeContent={rowState.targetButtonHopCount}
            badgeColor={rowState.targetButtonColor}
            onToggle={() => onToggleAim(scheme.id)}
          />
        </Stack>
      </Stack>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ pl: 5, pr: 1.5, pb: 1.5 }}>
          {badges.length > 0 && (
            <Stack
              direction="row"
              useFlexGap
              sx={{ flexWrap: "wrap", gap: 0.5, mb: 1 }}
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
