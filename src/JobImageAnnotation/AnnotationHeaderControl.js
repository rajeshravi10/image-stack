import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Button, Box } from "@mui/material";
import { Brush } from "@mui/icons-material";
import AnnotationToolbar from "./AnnotationToolbar";
import {
  useGlobalAnnotationMode,
  globalAnnotationData,
  dispatchGridCommand,
} from "./AnnotationGlobals";
import { exportAnnotatedImage } from "./annotationExport";

export default function AnnotationHeaderControl({
  onAddToComment,
  onCapturePreview,
}) {
  const { isAnnotating, setIsAnnotating, activeTool, setActiveTool } =
    useGlobalAnnotationMode();

  const handleUndo = () => dispatchGridCommand("undo");
  const handleRedo = () => dispatchGridCommand("redo");
  const handleDelete = () => dispatchGridCommand("delete");
  const handleCancel = () => dispatchGridCommand("cancel");

  // Listen to any globally registered selection
  const [hasSelection, setHasSelection] = useState(false);
  useEffect(() => {
    const checkSel = () => {
      let isSel = false;
      globalAnnotationData.forEach((data) => {
        if (data.selectedId) isSel = true;
      });
      setHasSelection(isSel);
    };
    const id = setInterval(checkSel, 100);
    return () => clearInterval(id);
  }, []);

  const handleExport = async () => {
    if (onCapturePreview) {
      // Pass "export" so DragDropPOC knows to download it
      onCapturePreview("export");
    }
  };

  const handleAddToComment = async () => {
    if (onCapturePreview) {
      // Pass "comment" so DragDropPOC knows to attach it
      onCapturePreview("comment");

      // Clear annotation mode
      dispatchGridCommand("cancel");
      setIsAnnotating(false);
    }
  };

  const portalTarget = document.getElementById(
    "annotation-toolbar-portal-target"
  );
  if (!portalTarget) return null;

  return createPortal(
    isAnnotating ? (
      <AnnotationToolbar
        activeTool={activeTool}
        onToolChange={(t) => setActiveTool(t)}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onDelete={handleDelete}
        canUndo={true} // Simplified
        canRedo={true} // Simplified
        hasSelection={hasSelection}
        onAddToComment={handleAddToComment}
        onExport={handleExport}
        onCancel={() => {
          handleCancel();
          setIsAnnotating(false);
        }}
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
    ),
    portalTarget
  );
}
