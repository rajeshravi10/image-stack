import { useState, useEffect } from "react";

const listeners = new Set();

let _isAnnotating = true;
let _activeTool = "select";
let _canUndo = false;
let _canRedo = false;
let _toolSettings = { color: "#FF3B30", lineWidth: 20, opacity: 1 };

// ── NEW: Cross-component annotation↔comment linking state ──────────────────

// Selected annotation ID (set from either annotation layer or comments panel)
let _selectedAnnotationId = null;

// Selected comment ID (set when a comment card is clicked)
let _selectedCommentId = null;

// Highlighted annotation IDs (restored from comment click)
let _highlightedAnnotationIds = [];

// Draft annotations (created but not yet submitted in a comment)
let _draftAnnotationIds = [];

// Global registry: imageId → annotation[] (each JobImageAnnotation instance syncs here)
// This allows the comments panel to look up annotations across all images
export const globalAnnotationRegistry = new Map();

// Map keyed by imageId: { annotations, imageSrc, imageName, jobId, selectedId }
export const globalAnnotationData = new Map();

// Map keyed by imageId: Konva Stage ref for export
export const globalStageRefs = new Map();

// ── IN-MEMORY PERSISTENCE ONLY ──────────────────────────────────────────────
// This preserves annotations/comments across tab switches during the same session,
// but naturally wipes clean upon page refresh as requested.

let globalComments = [];

export const hydrateSessionState = () => {
  return globalComments;
};

export const saveSessionState = (jobId, commentsOverride = null) => {
  if (commentsOverride !== null) {
    globalComments = commentsOverride;
  }
};

const notify = () => listeners.forEach((fn) => fn());

export const setGlobalIsAnnotating = (val) => {
  _isAnnotating = val;
  notify();
};

export const setGlobalActiveTool = (val) => {
  _activeTool = val;
  notify();
};

export const setGlobalCanUndo = (val) => {
  _canUndo = val;
  notify();
};

export const setGlobalCanRedo = (val) => {
  _canRedo = val;
  notify();
};

export const setGlobalToolSettings = (settings) => {
  _toolSettings = { ..._toolSettings, ...settings };
  notify();
};

export const setGlobalSelectedAnnotationId = (id) => {
  _selectedAnnotationId = id;
  notify();
};

export const setGlobalSelectedCommentId = (id) => {
  _selectedCommentId = id;
  notify();
};

export const setGlobalHighlightedAnnotationIds = (ids) => {
  _highlightedAnnotationIds = ids || [];
  notify();
};

export const setGlobalDraftAnnotationIds = (ids) => {
  _draftAnnotationIds = ids || [];
  notify();
};

export const toggleGlobalIsAnnotating = () =>
  setGlobalIsAnnotating(!_isAnnotating);

export const useGlobalAnnotationMode = () => {
  const [, setStamp] = useState(0);

  useEffect(() => {
    const listener = () => setStamp((s) => s + 1);
    listeners.add(listener);
    return () => listeners.delete(listener);
  }, []);

  return {
    isAnnotating: _isAnnotating,
    setIsAnnotating: setGlobalIsAnnotating,
    activeTool: _activeTool,
    setActiveTool: setGlobalActiveTool,
    canUndo: _canUndo,
    canRedo: _canRedo,
    toolSettings: _toolSettings,
    setToolSettings: setGlobalToolSettings,
    selectedAnnotationId: _selectedAnnotationId,
    setSelectedAnnotationId: setGlobalSelectedAnnotationId,
    selectedCommentId: _selectedCommentId,
    setSelectedCommentId: setGlobalSelectedCommentId,
    highlightedAnnotationIds: _highlightedAnnotationIds,
    setHighlightedAnnotationIds: setGlobalHighlightedAnnotationIds,
    draftAnnotationIds: _draftAnnotationIds,
    setDraftAnnotationIds: setGlobalDraftAnnotationIds,
  };
};

export const annotationCommands = new EventTarget();

export const dispatchGridCommand = (command, detail = null) => {
  annotationCommands.dispatchEvent(new CustomEvent(command, { detail }));
};
