import React, { useState } from "react";
import {
  Box,
  IconButton,
  Tooltip,
  Divider,
  Button,
  Popover,
  Slider,
  Typography,
} from "@mui/material";
import {
  PanTool,
  CropSquare,
  RadioButtonUnchecked,
  Edit,
  HorizontalRule,
  East,
  TextFields,
  Highlight,
  Undo,
  Redo,
  DeleteOutline,
  DeleteSweep,
  Close,
  FileDownload,
  Chat,
} from "@mui/icons-material";

const TOOLS = [
  { name: "select", Icon: PanTool, tooltip: "Select / Move [S]" },
  { name: "rectangle", Icon: CropSquare, tooltip: "Rectangle [R]" },
  {
    name: "ellipse",
    Icon: RadioButtonUnchecked,
    tooltip: "Ellipse / Circle [E]",
  },
  { name: "freehand", Icon: Edit, tooltip: "Freehand Pen [P]" },
  { name: "line", Icon: HorizontalRule, tooltip: "Line [L]" },
  { name: "arrow", Icon: East, tooltip: "Arrow [A]" },
  { name: "text", Icon: TextFields, tooltip: "Text [T]" },
  { name: "highlight", Icon: Highlight, tooltip: "Highlighter [H]" },
];

const PRESET_COLORS = [
  "#FF3B30",
  "#FF9500",
  "#FFD600",
  "#34C759",
  "#007AFF",
  "#5856D6",
  "#FF2D55",
  "#FFFFFF",
  "#000000",
  "#636366",
];

/**
 * @param {Object}   props
 * @param {string}   props.activeTool
 * @param {Function} props.onToolChange
 * @param {Function} props.onUndo
 * @param {Function} props.onRedo
 * @param {Function} props.onDelete
 * @param {Function} props.onClearAll
 * @param {boolean}  props.canUndo
 * @param {boolean}  props.canRedo
 * @param {boolean}  props.hasSelection
 * @param {Function} props.onExport
 * @param {Function} props.onAddToComment
 * @param {boolean}  props.canAddToComment
 * @param {Function} props.onCancel
 * @param {Object}   props.toolSettings       – { color, lineWidth, opacity }
 * @param {Function} props.onToolSettingsChange – (settings) => void
 */
const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  onClearAll,
  canUndo,
  canRedo,
  hasSelection,
  onExport,
  onAddToComment,
  canAddToComment,
  onCancel,
  toolSettings = {},
  onToolSettingsChange,
}) => {
  const [settingsAnchor, setSettingsAnchor] = useState(null);

  const color = toolSettings.color || "#FF3B30";
  const lineWidth = toolSettings.lineWidth || 3;
  const opacity = toolSettings.opacity != null ? toolSettings.opacity : 1;

  const updateSettings = (patch) => {
    onToolSettingsChange?.({ ...toolSettings, ...patch });
  };

  const toolBtnSx = (name) => ({
    borderRadius: 1,
    p: 0.75,
    minWidth: 0,
    background: activeTool === name ? "#2680EB" : "transparent",
    color: activeTool === name ? "#fff" : "inherit",
    "&:hover": {
      background: activeTool === name ? "#1a6dd4" : "#f0f0f0",
    },
    transition: "background 0.15s",
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.25,
        flexWrap: "nowrap",
        overflow: "hidden",
        maxWidth: "100%",
      }}
    >
      {/* Drawing tools */}
      {TOOLS.map(({ name, Icon, tooltip }) => (
        <Tooltip key={name} title={tooltip} placement="bottom">
          <IconButton
            size="small"
            onClick={() => onToolChange(name)}
            sx={toolBtnSx(name)}
          >
            <Icon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Tool settings (color + stroke) */}
      <Tooltip title="Tool settings" placement="bottom">
        <IconButton
          size="small"
          onClick={(e) => setSettingsAnchor(e.currentTarget)}
          sx={{
            borderRadius: 1,
            p: 0.75,
            border: `2px solid ${color}`,
            background: "transparent",
            "&:hover": { background: "#f0f0f0" },
          }}
        >
          <Box
            sx={{
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: color,
              border: "1px solid rgba(0,0,0,0.2)",
            }}
          />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Undo / Redo */}
      <Tooltip title="Undo (Ctrl+Z)" placement="bottom">
        <span>
          <IconButton
            size="small"
            onClick={onUndo}
            disabled={!canUndo}
            sx={{ borderRadius: 1 }}
          >
            <Undo sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Y)" placement="bottom">
        <span>
          <IconButton
            size="small"
            onClick={onRedo}
            disabled={!canRedo}
            sx={{ borderRadius: 1 }}
          >
            <Redo sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Delete / Clear */}
      <Tooltip title="Delete selected (Del)" placement="bottom">
        <span>
          <IconButton
            size="small"
            onClick={onDelete}
            disabled={!hasSelection}
            sx={{ borderRadius: 1 }}
          >
            <DeleteOutline
              sx={{ fontSize: 18, color: hasSelection ? "#f44336" : undefined }}
            />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Clear all annotations" placement="bottom">
        <IconButton size="small" onClick={onClearAll} sx={{ borderRadius: 1 }}>
          <DeleteSweep sx={{ fontSize: 18, color: "#f44336" }} />
        </IconButton>
      </Tooltip>

      <Divider orientation="vertical" flexItem sx={{ mx: 0.25 }} />

      {/* Export */}
      <Tooltip title="Export preview as PNG" placement="bottom">
        <Button
          variant="outlined"
          size="small"
          startIcon={<FileDownload sx={{ fontSize: 15 }} />}
          onClick={onExport}
          sx={{
            color: "#2680EB",
            borderColor: "#2680EB",
            "&:hover": { bgcolor: "#f0f7ff", borderColor: "#1a6dd4" },
            textTransform: "none",
            fontSize: 12,
            px: 1,
            py: 0.5,
            whiteSpace: "nowrap",
          }}
        >
          Export
        </Button>
      </Tooltip>

      {/* Add to Comment */}
      <Tooltip
        title={
          canAddToComment
            ? "Add annotated image to comment"
            : "Switch to Comments tab first"
        }
        placement="bottom"
      >
        <span>
          <Button
            variant="contained"
            size="small"
            startIcon={<Chat sx={{ fontSize: 15 }} />}
            onClick={canAddToComment ? onAddToComment : undefined}
            disabled={!canAddToComment}
            sx={{
              textTransform: "none",
              fontSize: 12,
              px: 1,
              py: 0.5,
              background: canAddToComment ? "#1E7D32" : undefined,
              "&:hover": {
                background: canAddToComment ? "#166527" : undefined,
              },
              whiteSpace: "nowrap",
            }}
          >
            Add to Comment
          </Button>
        </span>
      </Tooltip>

      {/* Close */}
      <Tooltip title="Exit annotation mode" placement="bottom">
        <IconButton
          size="small"
          onClick={onCancel}
          sx={{ borderRadius: 1, ml: 0.25 }}
        >
          <Close sx={{ fontSize: 18, color: "#666" }} />
        </IconButton>
      </Tooltip>

      {/* ── Settings Popover ─────────────────────────────────────────────── */}
      <Popover
        open={Boolean(settingsAnchor)}
        anchorEl={settingsAnchor}
        onClose={() => setSettingsAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        PaperProps={{ sx: { p: 2, minWidth: 220, mt: 0.5 } }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700 }}>
          Tool Settings
        </Typography>

        {/* Color presets */}
        <Typography
          variant="caption"
          sx={{ color: "text.secondary", mb: 0.5, display: "block" }}
        >
          Stroke Color
        </Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.5 }}>
          {PRESET_COLORS.map((c) => (
            <Box
              key={c}
              onClick={() => updateSettings({ color: c })}
              sx={{
                width: 22,
                height: 22,
                borderRadius: "50%",
                background: c,
                border:
                  color === c
                    ? "2px solid #2680EB"
                    : "1.5px solid rgba(0,0,0,0.2)",
                cursor: "pointer",
                "&:hover": { transform: "scale(1.15)" },
                transition: "transform 0.1s",
                boxSizing: "border-box",
              }}
            />
          ))}
        </Box>

        {/* Custom color picker */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            Custom:
          </Typography>
          <input
            type="color"
            value={color}
            onChange={(e) => updateSettings({ color: e.target.value })}
            style={{
              width: 32,
              height: 24,
              border: "none",
              borderRadius: 3,
              cursor: "pointer",
              padding: 0,
            }}
          />
        </Box>

        {/* Stroke width */}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Stroke Width: {lineWidth}px
        </Typography>
        <Slider
          size="small"
          min={1}
          max={20}
          step={1}
          value={lineWidth}
          onChange={(_, v) => updateSettings({ lineWidth: v })}
          sx={{ mb: 1.5 }}
        />

        {/* Opacity */}
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Opacity: {Math.round(opacity * 100)}%
        </Typography>
        <Slider
          size="small"
          min={0.1}
          max={1}
          step={0.05}
          value={opacity}
          onChange={(_, v) => updateSettings({ opacity: v })}
        />
      </Popover>
    </Box>
  );
};

export default AnnotationToolbar;
