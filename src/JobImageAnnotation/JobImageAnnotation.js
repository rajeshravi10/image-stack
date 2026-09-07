/**
 * JobImageAnnotation.js  – Konva-based annotation layer
 *
 * Renders the job image as a Konva layer and provides an interactive
 * annotation layer on top.
 *
 * Supported tools:
 *   select, rectangle, ellipse, freehand, line, arrow, text, highlight
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { Box, Typography } from "@mui/material";

import {
  Stage,
  Layer,
  Image as KonvaImage,
  Rect,
  Ellipse,
  Line,
  Arrow,
  Text,
  Transformer,
} from "react-konva";
import {
  useGlobalAnnotationMode,
  globalAnnotationData,
  globalStageRefs,
  annotationCommands,
  setGlobalCanUndo,
  setGlobalCanRedo,
  setGlobalHasSelection,
} from "./AnnotationGlobals";

// ─── Constants ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Text Edit Popover ────────────────────────────────────────────────────────

function TextInputPopover({ pos, onConfirm, onCancel }) {
  const [val, setVal] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKey = (e) => {
    if (e.key === "Enter") onConfirm(val);
    if (e.key === "Escape") onCancel();
  };

  return (
    <div
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        zIndex: 1000,
        background: "#fff",
        border: "1px solid #D9DADB",
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
        padding: "8px 10px",
        display: "flex",
        gap: 6,
        alignItems: "center",
      }}
    >
      <input
        ref={inputRef}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Enter text…"
        style={{
          border: "1px solid #ccc",
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: 14,
          outline: "none",
          minWidth: 180,
        }}
      />
      <button
        onClick={() => onConfirm(val)}
        style={{
          background: "#2680EB",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          padding: "4px 10px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        OK
      </button>
      <button
        onClick={onCancel}
        style={{
          background: "#f0f0f0",
          color: "#333",
          border: "none",
          borderRadius: 4,
          padding: "4px 8px",
          cursor: "pointer",
          fontSize: 13,
        }}
      >
        ✕
      </button>
    </div>
  );
}

// ─── Render a single annotation shape ────────────────────────────────────────

function AnnotationShape({
  ann,
  isSelected,
  onSelect,
  onDragEnd,
  onTransformEnd,
  isAnnotating,
  activeTool,
}) {
  const shapeRef = useRef(null);

  const commonProps = {
    id: ann.id,
    draggable: isAnnotating && activeTool === "select",
    onClick: () => isAnnotating && onSelect(ann.id),
    onTap: () => isAnnotating && onSelect(ann.id),
    onDragEnd: (e) => onDragEnd(ann.id, e),
    onTransformEnd: (e) => onTransformEnd(ann.id, e),
  };

  const strokeColor = ann.color || "#FF3B30";
  const strokeWidth = ann.lineWidth || 3;
  const opacity = ann.opacity != null ? ann.opacity : 1;

  switch (ann.tool) {
    case "rectangle":
      return (
        <Rect
          ref={shapeRef}
          {...commonProps}
          x={ann.data.x}
          y={ann.data.y}
          width={ann.data.width}
          height={ann.data.height}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={ann.data.fill || "transparent"}
          opacity={opacity}
        />
      );

    case "ellipse":
      return (
        <Ellipse
          ref={shapeRef}
          {...commonProps}
          x={ann.data.cx}
          y={ann.data.cy}
          radiusX={Math.abs(ann.data.rx)}
          radiusY={Math.abs(ann.data.ry)}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          opacity={opacity}
        />
      );

    case "freehand":
    case "highlight": {
      const pts = (ann.data.points || []).flatMap((p) => [p.x, p.y]);
      if (pts.length < 4) return null;
      return (
        <Line
          ref={shapeRef}
          {...commonProps}
          points={pts}
          stroke={
            ann.tool === "highlight" ? ann.color || "#FFD600" : strokeColor
          }
          strokeWidth={
            ann.tool === "highlight" ? ann.lineWidth || 16 : strokeWidth
          }
          opacity={
            ann.tool === "highlight"
              ? ann.opacity != null
                ? ann.opacity
                : 0.38
              : opacity
          }
          lineCap="round"
          lineJoin="round"
          tension={0.4}
          globalCompositeOperation={
            ann.tool === "highlight" ? "multiply" : "source-over"
          }
        />
      );
    }

    case "line": {
      const pts = [ann.data.x1, ann.data.y1, ann.data.x2, ann.data.y2];
      return (
        <Line
          ref={shapeRef}
          {...commonProps}
          points={pts}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          lineCap="round"
          opacity={opacity}
        />
      );
    }

    case "arrow": {
      const pts = [ann.data.x1, ann.data.y1, ann.data.x2, ann.data.y2];
      return (
        <Arrow
          ref={shapeRef}
          {...commonProps}
          points={pts}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={strokeColor}
          pointerLength={12}
          pointerWidth={10}
          lineCap="round"
          opacity={opacity}
        />
      );
    }

    case "text":
      return (
        <Text
          ref={shapeRef}
          {...commonProps}
          x={ann.data.x}
          y={ann.data.y}
          text={ann.data.text || ""}
          fontSize={ann.data.fontSize || 18}
          fill={strokeColor}
          fontFamily="sans-serif"
          fontStyle="bold"
          opacity={opacity}
        />
      );

    default:
      return null;
  }
}

// ─── In-progress shape overlay ────────────────────────────────────────────────

function InProgressShape({ state, tool, color, lineWidth }) {
  if (!state) return null;
  const { startX, startY, currentX, currentY, points } = state;
  const strokeColor = color || "#FF3B30";
  const strokeWidth = lineWidth || 3;

  switch (tool) {
    case "rectangle": {
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      return (
        <Rect
          x={x}
          y={y}
          width={w}
          height={h}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          dash={[5, 3]}
        />
      );
    }
    case "ellipse": {
      const cx = (startX + currentX) / 2;
      const cy = (startY + currentY) / 2;
      const rx = Math.abs(currentX - startX) / 2;
      const ry = Math.abs(currentY - startY) / 2;
      return (
        <Ellipse
          x={cx}
          y={cy}
          radiusX={rx}
          radiusY={ry}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          dash={[5, 3]}
        />
      );
    }
    case "freehand":
    case "highlight": {
      const pts = (points || []).flatMap((p) => [p.x, p.y]);
      if (pts.length < 4) return null;
      return (
        <Line
          points={pts}
          stroke={tool === "highlight" ? color || "#FFD600" : strokeColor}
          strokeWidth={tool === "highlight" ? lineWidth || 16 : strokeWidth}
          opacity={tool === "highlight" ? 0.38 : 1}
          lineCap="round"
          lineJoin="round"
          tension={0.4}
        />
      );
    }
    case "line":
      return (
        <Line
          points={[startX, startY, currentX, currentY]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          dash={[5, 3]}
          lineCap="round"
        />
      );
    case "arrow":
      return (
        <Arrow
          points={[startX, startY, currentX, currentY]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={strokeColor}
          pointerLength={12}
          pointerWidth={10}
          lineCap="round"
          dash={[5, 3]}
        />
      );
    default:
      return null;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string}  props.imageSrc
 * @param {string}  props.imageName
 * @param {string}  props.jobId
 * @param {string}  props.imageId
 * @param {Object}  props.toolSettings  – { color, lineWidth, opacity }
 */
const JobImageAnnotation = ({ imageSrc, imageName, jobId, imageId }) => {
  const { isAnnotating, activeTool, setActiveTool, toolSettings } =
    useGlobalAnnotationMode();

  const color = toolSettings?.color || "#FF3B30";
  const lineWidth = toolSettings?.lineWidth || 3;
  const opacity = toolSettings?.opacity != null ? toolSettings.opacity : 1;

  // ─── Annotations state ──────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState([]);
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawState, setDrawState] = useState(null);
  const [textPending, setTextPending] = useState(null);

  // Konva refs
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Image element for Konva
  const [konvaImage, setKonvaImage] = useState(null);

  // ─── Container resize observer ───────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setStageSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Load image for Konva ────────────────────────────────────────────────────
  useEffect(() => {
    if (!imageSrc) {
      setKonvaImage(null);
      return;
    }
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setKonvaImage(img);
    img.onerror = () => setKonvaImage(null);
    img.src = imageSrc;
  }, [imageSrc]);

  // ─── Register stage ref for export ──────────────────────────────────────────
  useEffect(() => {
    const key = imageId || imageName;
    if (stageRef.current) globalStageRefs.set(key, stageRef);
    return () => {
      globalStageRefs.delete(key);
    };
  }, [imageId, imageName, stageSize]);

  // ─── Sync to globalAnnotationData ───────────────────────────────────────────
  useEffect(() => {
    const key = imageId || imageName;
    globalAnnotationData.set(key, {
      imageSrc,
      imageName,
      jobId,
      annotations,
      selectedId,
    });
    return () => {
      globalAnnotationData.delete(key);
    };
  }, [imageId, imageName, imageSrc, jobId, annotations, selectedId]);

  // ─── Update global undo/redo/selection state ─────────────────────────────────
  useEffect(() => {
    setGlobalCanUndo(undoStack.length > 0);
    setGlobalCanRedo(redoStack.length > 0);
  }, [undoStack, redoStack]);

  useEffect(() => {
    setGlobalHasSelection(!!selectedId);
  }, [selectedId]);

  // ─── Transformer attachment ──────────────────────────────────────────────────
  useEffect(() => {
    if (!transformerRef.current || !stageRef.current) return;
    if (selectedId && activeTool === "select") {
      const node = stageRef.current.findOne(`#${selectedId}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer()?.batchDraw();
        return;
      }
    }
    transformerRef.current.nodes([]);
    transformerRef.current.getLayer()?.batchDraw();
  }, [selectedId, activeTool, annotations]);

  // ─── Annotation history helpers ──────────────────────────────────────────────
  const pushHistory = useCallback(
    (newAnnotations) => {
      setUndoStack((prev) => [...prev, annotations]);
      setRedoStack([]);
      setAnnotations(newAnnotations);
    },
    [annotations]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [...s, annotations]);
    setAnnotations(prev);
    setUndoStack((s) => s.slice(0, -1));
    setSelectedId(null);
  }, [undoStack, annotations]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, annotations]);
    setAnnotations(next);
    setRedoStack((s) => s.slice(0, -1));
    setSelectedId(null);
  }, [redoStack, annotations]);

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    pushHistory(annotations.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }, [annotations, selectedId, pushHistory]);

  const handleClearAll = useCallback(() => {
    pushHistory([]);
    setSelectedId(null);
  }, [pushHistory]);

  // ─── Global command listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handleCmd = (e) => {
      if (e.type === "undo") handleUndo();
      if (e.type === "redo") handleRedo();
      if (e.type === "delete") handleDelete();
      if (e.type === "clearAll") handleClearAll();
      if (e.type === "cancel") {
        setAnnotations([]);
        setUndoStack([]);
        setRedoStack([]);
        setSelectedId(null);
        setDrawState(null);
      }
    };
    annotationCommands.addEventListener("undo", handleCmd);
    annotationCommands.addEventListener("redo", handleCmd);
    annotationCommands.addEventListener("delete", handleCmd);
    annotationCommands.addEventListener("clearAll", handleCmd);
    annotationCommands.addEventListener("cancel", handleCmd);
    return () => {
      annotationCommands.removeEventListener("undo", handleCmd);
      annotationCommands.removeEventListener("redo", handleCmd);
      annotationCommands.removeEventListener("delete", handleCmd);
      annotationCommands.removeEventListener("clearAll", handleCmd);
      annotationCommands.removeEventListener("cancel", handleCmd);
    };
  }, [handleUndo, handleRedo, handleDelete, handleClearAll]);

  // ─── Keyboard shortcuts ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAnnotating) return;
    const onKey = (e) => {
      if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      }
      if (e.key === "y" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === "Delete" || e.key === "Backspace") handleDelete();
      if (e.key === "Escape") setActiveTool("select");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAnnotating, handleUndo, handleRedo, handleDelete, setActiveTool]);

  // ─── Image fitting ───────────────────────────────────────────────────────────
  const getImageLayout = () => {
    if (!konvaImage || !stageSize.width || !stageSize.height) {
      return { x: 0, y: 0, width: stageSize.width, height: stageSize.height };
    }
    const { naturalWidth: nw, naturalHeight: nh } = konvaImage;
    const containerAspect = stageSize.width / stageSize.height;
    const imgAspect = nw / nh;
    let w, h;
    if (imgAspect > containerAspect) {
      w = stageSize.width;
      h = stageSize.width / imgAspect;
    } else {
      h = stageSize.height;
      w = stageSize.height * imgAspect;
    }
    return {
      x: (stageSize.width - w) / 2,
      y: (stageSize.height - h) / 2,
      width: w,
      height: h,
    };
  };

  const imageLayout = getImageLayout();

  // ─── Stage pointer event handlers ────────────────────────────────────────────

  const getStagePos = (e) => {
    const stage = stageRef.current;
    const pos = stage.getPointerPosition();
    return { x: pos?.x ?? 0, y: pos?.y ?? 0 };
  };

  const handleStageMouseDown = (e) => {
    if (!isAnnotating) return;

    // If clicking on a shape while in select mode – let shape's onClick handle it
    if (activeTool === "select") {
      const clickedOnStage = e.target === e.target.getStage();
      if (clickedOnStage) setSelectedId(null);
      return;
    }

    if (activeTool === "text") {
      const pos = getStagePos(e);
      setTextPending({ x: pos.x, y: pos.y });
      return;
    }

    e.evt.preventDefault();
    const pos = getStagePos(e);
    const isPath = activeTool === "freehand" || activeTool === "highlight";

    setDrawState({
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      points: isPath ? [{ x: pos.x, y: pos.y }] : undefined,
    });
  };

  const handleStageMouseMove = (e) => {
    if (!isAnnotating || !drawState) return;
    if (activeTool === "select" || activeTool === "text") return;

    const pos = getStagePos(e);
    const isPath = activeTool === "freehand" || activeTool === "highlight";

    if (isPath) {
      setDrawState((prev) => ({
        ...prev,
        currentX: pos.x,
        currentY: pos.y,
        points: [...(prev.points || []), { x: pos.x, y: pos.y }],
      }));
    } else {
      setDrawState((prev) => ({ ...prev, currentX: pos.x, currentY: pos.y }));
    }
  };

  const handleStageMouseUp = () => {
    if (!isAnnotating || !drawState) return;
    if (activeTool === "select" || activeTool === "text") return;

    const { startX, startY, currentX, currentY, points } = drawState;
    const id = uid();
    const base = { id, tool: activeTool, color, lineWidth, opacity };
    let newAnn = null;

    switch (activeTool) {
      case "rectangle": {
        const x = Math.min(startX, currentX);
        const y = Math.min(startY, currentY);
        const w = Math.abs(currentX - startX);
        const h = Math.abs(currentY - startY);
        if (w < 4 || h < 4) break;
        newAnn = { ...base, data: { x, y, width: w, height: h } };
        break;
      }
      case "ellipse": {
        const cx = (startX + currentX) / 2;
        const cy = (startY + currentY) / 2;
        const rx = Math.abs(currentX - startX) / 2;
        const ry = Math.abs(currentY - startY) / 2;
        if (rx < 4 || ry < 4) break;
        newAnn = { ...base, data: { cx, cy, rx, ry } };
        break;
      }
      case "freehand":
      case "highlight": {
        if (!points || points.length < 2) break;
        newAnn = { ...base, data: { points } };
        break;
      }
      case "line": {
        if (Math.abs(currentX - startX) < 4 && Math.abs(currentY - startY) < 4)
          break;
        newAnn = {
          ...base,
          data: { x1: startX, y1: startY, x2: currentX, y2: currentY },
        };
        break;
      }
      case "arrow": {
        if (Math.abs(currentX - startX) < 4 && Math.abs(currentY - startY) < 4)
          break;
        newAnn = {
          ...base,
          data: { x1: startX, y1: startY, x2: currentX, y2: currentY },
        };
        break;
      }
      default:
        break;
    }

    if (newAnn) {
      const newList = [...annotations, newAnn];
      setUndoStack((prev) => [...prev, annotations]);
      setRedoStack([]);
      setAnnotations(newList);
      setSelectedId(newAnn.id);
    }
    setDrawState(null);
  };

  // ─── Drag/Transform end handlers ─────────────────────────────────────────────

  const handleDragEnd = useCallback((id, e) => {
    const node = e.target;
    setAnnotations((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const dx = node.x();
        const dy = node.y();
        node.x(0);
        node.y(0);
        const newData = { ...a.data };

        if (a.tool === "rectangle") {
          newData.x += dx;
          newData.y += dy;
        } else if (a.tool === "ellipse") {
          newData.cx += dx;
          newData.cy += dy;
        } else if (a.tool === "freehand" || a.tool === "highlight") {
          newData.points = newData.points.map((p) => ({
            x: p.x + dx,
            y: p.y + dy,
          }));
        } else if (a.tool === "line" || a.tool === "arrow") {
          newData.x1 += dx;
          newData.y1 += dy;
          newData.x2 += dx;
          newData.y2 += dy;
        } else if (a.tool === "text") {
          newData.x += dx;
          newData.y += dy;
        }
        return { ...a, data: newData };
      });
      setUndoStack((prev2) => [...prev2, prev]);
      setRedoStack([]);
      return updated;
    });
  }, []);

  const handleTransformEnd = useCallback((id, e) => {
    const node = e.target;
    setAnnotations((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const newData = { ...a.data };
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);

        if (a.tool === "rectangle") {
          newData.x = node.x();
          newData.y = node.y();
          newData.width = Math.max(4, node.width() * scaleX);
          newData.height = Math.max(4, node.height() * scaleY);
          node.width(newData.width);
          node.height(newData.height);
        } else if (a.tool === "ellipse") {
          newData.cx = node.x();
          newData.cy = node.y();
          newData.rx = Math.max(4, Math.abs(node.radiusX() * scaleX));
          newData.ry = Math.max(4, Math.abs(node.radiusY() * scaleY));
          node.radiusX(newData.rx);
          node.radiusY(newData.ry);
        } else if (a.tool === "text") {
          newData.x = node.x();
          newData.y = node.y();
          newData.fontSize = Math.max(
            8,
            Math.round((a.data.fontSize || 18) * scaleY)
          );
        }
        node.x(newData.x || newData.cx || 0);
        node.y(newData.y || newData.cy || 0);
        return { ...a, data: newData };
      });
      setUndoStack((prev2) => [...prev2, prev]);
      setRedoStack([]);
      return updated;
    });
  }, []);

  // ─── Text confirm ─────────────────────────────────────────────────────────────

  const handleTextConfirm = (text) => {
    if (!text || !textPending) {
      setTextPending(null);
      return;
    }
    const newAnn = {
      id: uid(),
      tool: "text",
      color,
      lineWidth,
      opacity,
      data: { x: textPending.x, y: textPending.y, text, fontSize: 18 },
    };
    const newList = [...annotations, newAnn];
    setUndoStack((prev) => [...prev, annotations]);
    setRedoStack([]);
    setAnnotations(newList);
    setSelectedId(newAnn.id);
    setTextPending(null);
    setActiveTool("select");
  };

  // ─── Cursor ──────────────────────────────────────────────────────────────────
  const cursorMap = {
    select: "default",
    rectangle: "crosshair",
    ellipse: "crosshair",
    freehand: "crosshair",
    highlight: "crosshair",
    line: "crosshair",
    arrow: "crosshair",
    text: "text",
  };

  const imgCursor = isAnnotating
    ? cursorMap[activeTool] || "crosshair"
    : "default";

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <Box
      ref={containerRef}
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        userSelect: "none",
        cursor: imgCursor,
        overflow: "hidden",
      }}
    >
      {stageSize.width > 0 && stageSize.height > 0 && (
        <Stage
          ref={stageRef}
          width={stageSize.width}
          height={stageSize.height}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Image Layer */}
          <Layer listening={false}>
            {konvaImage ? (
              <KonvaImage
                image={konvaImage}
                x={imageLayout.x}
                y={imageLayout.y}
                width={imageLayout.width}
                height={imageLayout.height}
              />
            ) : null}
          </Layer>

          {/* Annotation Layer */}
          <Layer>
            {annotations.map((ann) => (
              <AnnotationShape
                key={ann.id}
                ann={ann}
                isSelected={ann.id === selectedId && activeTool === "select"}
                onSelect={(id) => {
                  if (activeTool !== "select") return;
                  setSelectedId(id);
                }}
                onDragEnd={handleDragEnd}
                onTransformEnd={handleTransformEnd}
                isAnnotating={isAnnotating}
                activeTool={activeTool}
              />
            ))}

            {/* In-progress drawing preview */}
            {drawState && activeTool !== "select" && activeTool !== "text" && (
              <InProgressShape
                state={drawState}
                tool={activeTool}
                color={color}
                lineWidth={lineWidth}
              />
            )}

            {/* Transformer for selected shape */}
            {isAnnotating && activeTool === "select" && (
              <Transformer
                ref={transformerRef}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 5 || newBox.height < 5) return oldBox;
                  return newBox;
                }}
                rotateEnabled={false}
              />
            )}
          </Layer>
        </Stage>
      )}

      {/* Fallback label when no image */}
      {!imageSrc && (
        <Typography color="text.secondary" sx={{ position: "absolute" }}>
          No image selected
        </Typography>
      )}

      {/* File label */}
      {imageSrc && !isAnnotating && (
        <Box
          sx={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "#ffffffdd",
            padding: "4px 10px",
            borderRadius: "10px",
            fontSize: 14,
            color: "#1a73e8",
            fontWeight: 600,
            backdropFilter: "blur(4px)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          {imageName}
        </Box>
      )}

      {/* Text input popup */}
      {textPending && (
        <TextInputPopover
          pos={{ x: textPending.x, y: Math.max(0, textPending.y - 40) }}
          onConfirm={handleTextConfirm}
          onCancel={() => setTextPending(null)}
        />
      )}
    </Box>
  );
};

export default JobImageAnnotation;
