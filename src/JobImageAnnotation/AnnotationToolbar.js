import React from "react";
import { Box, IconButton, Tooltip, Divider, Button } from "@mui/material";
import {
  PanTool, // Select
  CropSquare, // Rectangle
  RadioButtonUnchecked, // Ellipse
  PolylineOutlined, // Polygon / Freehand placeholder
  Edit, // Freehand pen
  HorizontalRule, // Line
  East, // Arrow
  TextFields, // Text
  Undo,
  Redo,
  DeleteOutline,
  Check,
  Close,
} from "@mui/icons-material";

const TOOLS = [
  { name: "select", Icon: PanTool, tooltip: "Select / Move" },
  { name: "rectangle", Icon: CropSquare, tooltip: "Rectangle" },
  { name: "ellipse", Icon: RadioButtonUnchecked, tooltip: "Ellipse / Circle" },
  {
    name: "polygon",
    Icon: PolylineOutlined,
    tooltip: "Polygon (click to add vertices, dbl-click to close)",
  },
  { name: "freehand", Icon: Edit, tooltip: "Freehand pen" },
  { name: "line", Icon: HorizontalRule, tooltip: "Line" },
  { name: "arrow", Icon: East, tooltip: "Arrow" },
  { name: "text", Icon: TextFields, tooltip: "Text label" },
];

/**
 * @param {Object} props
 * @param {string}   props.activeTool
 * @param {Function} props.onToolChange
 * @param {Function} props.onUndo
 * @param {Function} props.onRedo
 * @param {Function} props.onDelete          - delete selected
 * @param {boolean}  props.canUndo
 * @param {boolean}  props.canRedo
 * @param {boolean}  props.hasSelection
 * @param {Function} props.onAddToComment   - primary action
 * @param {Function} props.onCancel
 */
const AnnotationToolbar = ({
  activeTool,
  onToolChange,
  onUndo,
  onRedo,
  onDelete,
  canUndo,
  canRedo,
  hasSelection,
  onAddToComment,
  onExport,
  onCancel,
}) => {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        flexWrap: "wrap",
      }}
    >
      {/* Drawing tools */}
      {TOOLS.map(({ name, Icon, tooltip }) => (
        <Tooltip key={name} title={tooltip} placement="bottom">
          <IconButton
            size="small"
            onClick={() => onToolChange(name)}
            sx={{
              borderRadius: 1,
              p: 0.75,
              background: activeTool === name ? "#2680EB" : "transparent",
              color: activeTool === name ? "#fff" : "inherit",
              "&:hover": {
                background: activeTool === name ? "#1a6dd4" : "#f0f0f0",
              },
              transition: "background 0.15s",
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ))}

      <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

      {/* Undo / Redo */}
      <Tooltip title="Undo (Ctrl+Z)" placement="bottom">
        <span>
          <IconButton size="small" onClick={onUndo} disabled={!canUndo}>
            <Undo sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Redo (Ctrl+Y)" placement="bottom">
        <span>
          <IconButton size="small" onClick={onRedo} disabled={!canRedo}>
            <Redo sx={{ fontSize: 18 }} />
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title="Delete selected" placement="bottom">
        <span>
          <IconButton size="small" onClick={onDelete} disabled={!hasSelection}>
            <DeleteOutline
              sx={{ fontSize: 18, color: hasSelection ? "#f44336" : undefined }}
            />
          </IconButton>
        </span>
      </Tooltip>

      <Box sx={{ flex: 1 }} />

      {/* Cancel / Save */}
      <Tooltip title="Cancel annotation" placement="bottom">
        <IconButton size="small" onClick={onCancel} sx={{ borderRadius: 1 }}>
          <Close sx={{ fontSize: 18, color: "#666" }} />
        </IconButton>
      </Tooltip>

      <Button
        variant="outlined"
        size="small"
        onClick={onExport}
        sx={{
          color: "#2680EB",
          borderColor: "#2680EB",
          "&:hover": { bgcolor: "#f0f7ff", borderColor: "#1a6dd4" },
          textTransform: "none",
          fontSize: 13,
          px: 1.5,
          ml: 0.5,
        }}
      >
        Export
      </Button>

      <Button
        variant="contained"
        size="small"
        startIcon={<Check />}
        onClick={onAddToComment}
        sx={{
          textTransform: "none",
          fontSize: 13,
          px: 1.5,
          background: "#1E7D32",
          "&:hover": { background: "#166527" },
          ml: 0.5,
        }}
      >
        Add to Comment
      </Button>
    </Box>
  );
};

export default AnnotationToolbar;
