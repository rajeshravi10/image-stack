/**
 * JobImageAnnotation.js  – Konva-based annotation layer
 *
 * Renders the job image as a Konva layer and provides an interactive
 * annotation layer on top.
 *
 * Supported tools:
 *   select, rectangle, ellipse, freehand, line, arrow, highlight
 *
 * Annotations are first-class data objects linked to comments via
 * globalAnnotationRegistry and AnnotationGlobals state.
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
  Transformer,
} from "react-konva";
import {
  useGlobalAnnotationMode,
  globalAnnotationData,
  globalAnnotationRegistry,
  globalStageRefs,
  annotationCommands,
  setGlobalCanUndo,
  setGlobalCanRedo,
  hydrateSessionState,
  saveSessionState,
} from "./AnnotationGlobals";

// ─── Constants ────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Highlight ring for annotation selected via comment click ─────────────────

function HighlightRing({ ann, isHighlighted }) {
  if (!isHighlighted) return null;

  const pad = 6;

  if (ann.tool === "rectangle") {
    return (
      <Rect
        x={ann.data.x - pad}
        y={ann.data.y - pad}
        width={ann.data.width + pad * 2}
        height={ann.data.height + pad * 2}
        stroke="#2680EB"
        strokeWidth={2.5}
        dash={[6, 3]}
        cornerRadius={4}
        listening={false}
        opacity={0.85}
      />
    );
  }
  if (ann.tool === "ellipse") {
    return (
      <Ellipse
        x={ann.data.cx}
        y={ann.data.cy}
        radiusX={Math.abs(ann.data.rx) + pad}
        radiusY={Math.abs(ann.data.ry) + pad}
        stroke="#2680EB"
        strokeWidth={2.5}
        dash={[6, 3]}
        listening={false}
        opacity={0.85}
      />
    );
  }
  // For lines/arrows/freehand/highlight – just skip the ring (selection is enough)
  return null;
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
 */
const JobImageAnnotation = ({ imageSrc, imageName, jobId, imageId }) => {
  const {
    isAnnotating,
    activeTool,
    setActiveTool,
    toolSettings,
    selectedAnnotationId: globalSelectedAnnotationId,
    highlightedAnnotationId,
    setSelectedAnnotationId: setGlobalSelectedAnn,
    setHighlightedAnnotationId: setGlobalHighlightedAnn,
  } = useGlobalAnnotationMode();

  const color = toolSettings?.color || "#FF3B30";
  const lineWidth = toolSettings?.lineWidth || 3;
  const opacity = toolSettings?.opacity != null ? toolSettings.opacity : 1;

  // ─── Annotations state ──────────────────────────────────────────────────────
  const [annotations, setAnnotations] = useState(() => {
    hydrateSessionState(jobId);
    const key = imageId || imageName;
    return globalAnnotationRegistry.get(key) || [];
  });
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [drawState, setDrawState] = useState(null);

  // Konva refs
  const stageRef = useRef(null);
  const transformerRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 0, height: 0 });

  // Image element for Konva
  const [konvaImage, setKonvaImage] = useState(null);

  // ─── Sync selectedId ↔ global selectedAnnotationId ──────────────────────────
  // When local selection changes, broadcast to global state
  useEffect(() => {
    if (selectedId) {
      const ann = annotations.find((a) => a.id === selectedId);
      if (ann) {
        setGlobalSelectedAnn(selectedId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // When global selectedAnnotationId changes (e.g. from comment click or cancel),
  // select the annotation in this instance if it belongs here, otherwise clear it.
  useEffect(() => {
    if (!globalSelectedAnnotationId) {
      setSelectedId(null);
      return;
    }
    const ann = annotations.find((a) => a.id === globalSelectedAnnotationId);
    if (ann) {
      setSelectedId(globalSelectedAnnotationId);
    } else {
      setSelectedId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalSelectedAnnotationId, annotations]);

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

  // ─── Register stage ref ─────────────────────────────────────────────────────
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
    // Removed unmount cleanup to persist data across preview mode changes
  }, [imageId, imageName, imageSrc, jobId, annotations, selectedId]);

  // ─── Sync annotations to globalAnnotationRegistry ──────────────────────────
  // This allows CommentsSection to look up annotations across all images
  useEffect(() => {
    const key = imageId || imageName;
    // Store annotations with imageId embedded for cross-image lookups
    const annotationsWithImageId = annotations.map((a) => ({
      ...a,
      imageId: key,
    }));
    globalAnnotationRegistry.set(key, annotationsWithImageId);

    // Save to session storage whenever annotations change
    if (jobId) {
      saveSessionState(jobId);
    }
  }, [imageId, imageName, annotations, jobId]);

  // ─── Update global undo/redo/selection state ─────────────────────────────────
  useEffect(() => {
    setGlobalCanUndo(undoStack.length > 0);
    setGlobalCanRedo(redoStack.length > 0);
  }, [undoStack, redoStack]);

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

  // ─── Global command listener ─────────────────────────────────────────────────
  useEffect(() => {
    const handleCmd = (e) => {
      if (e.type === "undo") handleUndo();
      if (e.type === "redo") handleRedo();
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
    annotationCommands.addEventListener("cancel", handleCmd);
    return () => {
      annotationCommands.removeEventListener("undo", handleCmd);
      annotationCommands.removeEventListener("redo", handleCmd);
      annotationCommands.removeEventListener("cancel", handleCmd);
    };
  }, [handleUndo, handleRedo]);

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
      if (e.key === "Escape") setActiveTool("select");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isAnnotating, handleUndo, handleRedo, setActiveTool]);

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
      if (clickedOnStage) {
        setSelectedId(null);
        setGlobalSelectedAnn(null);
        setGlobalHighlightedAnn(null);
      }
      return;
    }

    e.evt.preventDefault();
    const pos = getStagePos(e);
    const isPath = activeTool === "freehand" || activeTool === "highlight";

    // When starting a new drawing, clear any previously viewed/highlighted annotation
    setSelectedId(null);
    setGlobalSelectedAnn(null);
    setGlobalHighlightedAnn(null);

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
    if (activeTool === "select") return;

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
    if (activeTool === "select") return;

    const { startX, startY, currentX, currentY, points } = drawState;
    const id = uid();
    const base = { id, imageId, tool: activeTool, color, lineWidth, opacity };
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
      setAnnotations((prev) => {
        setUndoStack((prevStack) => [...prevStack, prev]);
        setRedoStack([]);
        return [...prev, newAnn];
      });
      setSelectedId(newAnn.id);
      // Broadcast selection globally so comments composer can link to it
      setGlobalSelectedAnn(newAnn.id);
    }
    setDrawState(null);
  };

  // ─── Drag/Transform end handlers ─────────────────────────────────────────────

  const handleDragEnd = useCallback((id, e) => {
    const node = e.target;
    setAnnotations((prev) => {
      const updated = prev.map((a) => {
        if (a.id !== id) return a;
        const newData = { ...a.data };

        if (a.tool === "rectangle") {
          newData.x = node.x();
          newData.y = node.y();
        } else if (a.tool === "ellipse") {
          newData.cx = node.x();
          newData.cy = node.y();
        } else if (
          a.tool === "freehand" ||
          a.tool === "highlight" ||
          a.tool === "line" ||
          a.tool === "arrow"
        ) {
          const dx = node.x();
          const dy = node.y();
          if (a.tool === "freehand" || a.tool === "highlight") {
            newData.points = newData.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
          } else {
            newData.x1 += dx;
            newData.y1 += dy;
            newData.x2 += dx;
            newData.y2 += dy;
          }
          // Reset internal delta since we just baked it directly into the points.
          node.x(0);
          node.y(0);
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

  // ─── Cursor ──────────────────────────────────────────────────────────────────
  const cursorMap = {
    select: "default",
    rectangle: "crosshair",
    ellipse: "crosshair",
    freehand: "crosshair",
    highlight: "crosshair",
    line: "crosshair",
    arrow: "crosshair",
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
            {annotations
              .filter(
                (ann) =>
                  ann.id === selectedId || ann.id === highlightedAnnotationId
              )
              .map((ann) => (
                <React.Fragment key={ann.id}>
                  {/* Highlight ring for comment-linked selection */}
                  <HighlightRing
                    ann={ann}
                    isHighlighted={ann.id === highlightedAnnotationId}
                  />
                  <AnnotationShape
                    ann={ann}
                    isSelected={
                      ann.id === selectedId && activeTool === "select"
                    }
                    onSelect={(id) => {
                      if (activeTool !== "select") return;
                      setSelectedId(id);
                      setGlobalSelectedAnn(id);
                      // Clear comment highlight when user manually selects an annotation
                      setGlobalHighlightedAnn(null);
                    }}
                    onDragEnd={handleDragEnd}
                    onTransformEnd={handleTransformEnd}
                    isAnnotating={isAnnotating}
                    activeTool={activeTool}
                  />
                </React.Fragment>
              ))}

            {/* In-progress drawing preview */}
            {drawState && activeTool !== "select" && (
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
                enabledAnchors={[
                  "top-left",
                  "top-right",
                  "bottom-left",
                  "bottom-right",
                ]}
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
    </Box>
  );
};

export default JobImageAnnotation;
