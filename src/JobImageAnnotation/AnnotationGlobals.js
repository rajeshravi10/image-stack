import { useState, useEffect } from "react";

const listeners = new Set();
let _isAnnotating = false;
let _activeTool = "select";

// Store data for export / add to comment
// Map keyed by imageId: { annotations, imageSrc, imageName, getCanvasBlob }
export const globalAnnotationData = new Map();

export const setGlobalIsAnnotating = (val) => {
  _isAnnotating = val;
  listeners.forEach((fn) => fn());
};

export const setGlobalActiveTool = (val) => {
  _activeTool = val;
  listeners.forEach((fn) => fn());
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
  };
};

export const annotationCommands = new EventTarget();

export const dispatchGridCommand = (command, detail = null) => {
  annotationCommands.dispatchEvent(new CustomEvent(command, { detail }));
};
