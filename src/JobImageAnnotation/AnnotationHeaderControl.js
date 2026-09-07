import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Button, Box } from "@mui/material";
import { Brush } from "@mui/icons-material";
import AnnotationToolbar from "./AnnotationToolbar";
import {
  useGlobalAnnotationMode,
  dispatchGridCommand,
  setGlobalToolSettings,
} from "./AnnotationGlobals";

/**
 * Renders into the portal target in the left header.
 *
 * @param {Object}   props
 * @param {Function} props.onCapturePreview   – (type:'export'|'comment') => void
 * @param {boolean}  props.isCommentsTabActive
 */
export default function AnnotationHeaderControl({
  onCapturePreview,
  isCommentsTabActive = false,
}) {
  const {
    isAnnotating,
    setIsAnnotating,
    activeTool,
    setActiveTool,
    canUndo,
    canRedo,
    hasSelection,
    toolSettings,
  } = useGlobalAnnotationMode();

  const setToolSettings = (settings) => setGlobalToolSettings(settings);

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Commands ──────────────────────────────────────────────────────────────
  const handleUndo = () => dispatchGridCommand("undo");
  const handleRedo = () => dispatchGridCommand("redo");
  const handleDelete = () => dispatchGridCommand("delete");

  const handleClearAll = () => {
    setShowClearConfirm(true);
  };

  const confirmClearAll = () => {
    dispatchGridCommand("clearAll");
    setShowClearConfirm(false);
  };

  // ── Export using DragDropPOC's globalStageRefs approach ────────────────────
  const handleExport = () => {
    if (onCapturePreview) onCapturePreview("export");
  };

  const handleAddToComment = () => {
    if (!isCommentsTabActive) return;
    if (onCapturePreview) {
      onCapturePreview("comment");
      // NOTE: Do NOT clear annotation mode here — user may want to keep annotating
      // and the requirement says annotations must persist
    }
  };

  const handleCancel = () => {
    dispatchGridCommand("cancel");
    setIsAnnotating(false);
  };

  // ── Portal ────────────────────────────────────────────────────────────────
  const portalTarget = document.getElementById(
    "annotation-toolbar-portal-target"
  );
  if (!portalTarget) return null;

  return createPortal(
    <>
      {isAnnotating ? (
        <AnnotationToolbar
          activeTool={activeTool}
          onToolChange={(t) => setActiveTool(t)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onDelete={handleDelete}
          onClearAll={handleClearAll}
          canUndo={canUndo}
          canRedo={canRedo}
          hasSelection={hasSelection}
          onExport={handleExport}
          onAddToComment={handleAddToComment}
          canAddToComment={isCommentsTabActive}
          onCancel={handleCancel}
          toolSettings={toolSettings}
          onToolSettingsChange={setToolSettings}
        />
      ) : (
        <Button
          variant="contained"
          startIcon={<Brush />}
          onClick={() => setIsAnnotating(true)}
          sx={{
            bgcolor: "#2680EB",
            "&:hover": { bgcolor: "#1a6dd4" },
            textTransform: "none",
            borderRadius: 1,
            padding: "6px 16px",
            fontWeight: 600,
            boxShadow: "none",
          }}
        >
          Annotate
        </Button>
      )}

      {/* Clear All confirmation dialog */}
      {showClearConfirm && (
        <Box
          sx={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowClearConfirm(false)}
        >
          <Box
            onClick={(e) => e.stopPropagation()}
            sx={{
              background: "#fff",
              borderRadius: 2,
              p: 3,
              minWidth: 300,
              boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
            }}
          >
            <Box sx={{ fontWeight: 700, fontSize: 15, mb: 1 }}>
              Clear all annotations?
            </Box>
            <Box sx={{ color: "#666", fontSize: 13, mb: 2.5 }}>
              This will remove all annotations from the preview. This action can
              be undone.
            </Box>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowClearConfirm(false)}
                sx={{ textTransform: "none" }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                color="error"
                onClick={confirmClearAll}
                sx={{ textTransform: "none" }}
              >
                Clear
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </>,
    portalTarget
  );
}
