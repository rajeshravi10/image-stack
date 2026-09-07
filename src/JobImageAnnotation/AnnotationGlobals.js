import { useState, useEffect } from "react";

const listeners = new Set();

let _isAnnotating = false;
let _activeTool = "select";
let _canUndo = false;
let _canRedo = false;
let _hasSelection = false;
let _toolSettings = { color: "#FF3B30", lineWidth: 3, opacity: 1 };

// Map keyed by imageId: { annotations, imageSrc, imageName, jobId, selectedId }
export const globalAnnotationData = new Map();

// Map keyed by imageId: Konva Stage ref for export
export const globalStageRefs = new Map();

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

export const setGlobalHasSelection = (val) => {
  _hasSelection = val;
  notify();
};

export const setGlobalToolSettings = (settings) => {
  _toolSettings = { ..._toolSettings, ...settings };
  notify();
};

export const toggleGlobalIsAnnotating = () =>
  setGlobalIsAnnotating(!_isAnnotating);

export const useGlobalAnnotationMode = () => {
  const [stamp, setStamp] = useState(0);

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
    hasSelection: _hasSelection,
    toolSettings: _toolSettings,
    setToolSettings: setGlobalToolSettings,
  };
};

export const annotationCommands = new EventTarget();

export const dispatchGridCommand = (command, detail = null) => {
  annotationCommands.dispatchEvent(new CustomEvent(command, { detail }));
};
