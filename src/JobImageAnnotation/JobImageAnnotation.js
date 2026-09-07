/**
 * JobImageAnnotation.js
 *
 * Renders the current job image with a transparent SVG/Canvas overlay
 * for annotation drawing.  All annotation data is stored in DISPLAY
 * coordinates while drawing, then converted to NATURAL image coordinates
 * before being saved so the export utility can use them at full resolution.
 *
 * Supported tools:
 *   select, rectangle, ellipse, polygon, freehand, line, arrow, text
 */

import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from "react";
import { Box, Typography, Button } from "@mui/material";
import { Brush } from "@mui/icons-material";
import {
  useGlobalAnnotationMode,
  globalAnnotationData,
  annotationCommands,
} from "./AnnotationGlobals";

// ─── Constants ────────────────────────────────────────────────────────────────

const STROKE_COLOR = "#FF3B30";
const STROKE_WIDTH = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Generate a simple unique ID */
const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Convert display coords → natural image coords.
 * imgEl must have naturalWidth/Height and its displayed bounding rect.
 *
 * The image is rendered with `object-fit: contain`, so there may be
 * letterbox/pillarbox offsets within the container.  We must account for
 * the actual rendered image rect inside the container.
 *
 * @param {{ x: number, y: number }} pt  – in container px
 * @param {HTMLImageElement} imgEl
 * @param {DOMRect} containerRect
 * @returns {{ x: number, y: number }}  – in natural image px
 */
function displayToNatural(pt, imgEl, containerRect) {
  const { naturalWidth: nw, naturalHeight: nh } = imgEl;
  const containerW = containerRect.width;
  const containerH = containerRect.height;

  // Compute "contain" rendered size
  const containerAspect = containerW / containerH;
  const imgAspect = nw / nh;

  let renderedW, renderedH;
  if (imgAspect > containerAspect) {
    renderedW = containerW;
    renderedH = containerW / imgAspect;
  } else {
    renderedH = containerH;
    renderedW = containerH * imgAspect;
  }

  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  const relX = pt.x - offsetX;
  const relY = pt.y - offsetY;

  return {
    x: (relX / renderedW) * nw,
    y: (relY / renderedH) * nh,
  };
}

/** Inverse: natural → display */
function naturalToDisplay(pt, imgEl, containerRect) {
  const { naturalWidth: nw, naturalHeight: nh } = imgEl;
  const containerW = containerRect.width;
  const containerH = containerRect.height;

  const containerAspect = containerW / containerH;
  const imgAspect = nw / nh;

  let renderedW, renderedH;
  if (imgAspect > containerAspect) {
    renderedW = containerW;
    renderedH = containerW / imgAspect;
  } else {
    renderedH = containerH;
    renderedW = containerH * imgAspect;
  }

  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  return {
    x: (pt.x / nw) * renderedW + offsetX,
    y: (pt.y / nh) * renderedH + offsetY,
  };
}

/** Convert entire annotation from natural → display coords (for SVG rendering) */
function annNaturalToDisplay(ann, imgEl, containerRect) {
  const conv = (pt) => naturalToDisplay(pt, imgEl, containerRect);
  const d = ann.data;
  switch (ann.tool) {
    case "rectangle": {
      const tl = conv({ x: d.x, y: d.y });
      const br = conv({ x: d.x + d.width, y: d.y + d.height });
      return {
        ...ann,
        _display: { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y },
      };
    }
    case "ellipse": {
      const c = conv({ x: d.cx, y: d.cy });
      const rx = conv({ x: d.cx + Math.abs(d.rx), y: d.cy });
      const ry = conv({ x: d.cx, y: d.cy + Math.abs(d.ry) });
      return {
        ...ann,
        _display: { cx: c.x, cy: c.y, rx: rx.x - c.x, ry: ry.y - c.y },
      };
    }
    case "polygon":
    case "freehand":
      return { ...ann, _display: { points: d.points.map(conv) } };
    case "line":
    case "arrow": {
      const p1 = conv({ x: d.x1, y: d.y1 });
      const p2 = conv({ x: d.x2, y: d.y2 });
      return { ...ann, _display: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } };
    }
    case "text": {
      const p = conv({ x: d.x, y: d.y });
      return { ...ann, _display: { x: p.x, y: p.y, text: d.text } };
    }
    default:
      return ann;
  }
}

// ─── SVG Annotation renderers ─────────────────────────────────────────────────

const STROKE_COLOR_SELECTED = "#2680EB";

function AnnSvgItem({ ann, isSelected, onSelect }) {
  const d = ann._display || {};
  const color = ann.color || STROKE_COLOR;
  const lw = ann.lineWidth || STROKE_WIDTH;
  const sc = isSelected ? STROKE_COLOR_SELECTED : color;
  const commonProps = {
    stroke: sc,
    strokeWidth: lw,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { cursor: "pointer" },
    onClick: (e) => {
      e.stopPropagation();
      onSelect(ann.id);
    },
    onPointerDown: (e) => {
      e.stopPropagation();
      if (ann.onPointerDown) ann.onPointerDown(e, ann);
    },
  };

  switch (ann.tool) {
    case "rectangle":
      return (
        <rect
          x={d.x}
          y={d.y}
          width={d.width}
          height={d.height}
          {...commonProps}
        />
      );
    case "ellipse":
      return (
        <ellipse
          cx={d.cx}
          cy={d.cy}
          rx={Math.abs(d.rx)}
          ry={Math.abs(d.ry)}
          {...commonProps}
        />
      );
    case "polygon": {
      const pts = (d.points || []).map((p) => `${p.x},${p.y}`).join(" ");
      return <polygon points={pts} {...commonProps} />;
    }
    case "freehand": {
      const pts = d.points || [];
      if (pts.length < 2) return null;
      const path = pts
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");
      return <path d={path} {...commonProps} />;
    }
    case "line":
      return <line x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} {...commonProps} />;
    case "arrow": {
      const arrowId = `arrow-${ann.id}`;
      return (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ann.id);
          }}
        >
          <defs>
            <marker
              id={arrowId}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={sc} />
            </marker>
          </defs>
          <line
            x1={d.x1}
            y1={d.y1}
            x2={d.x2}
            y2={d.y2}
            stroke={sc}
            strokeWidth={lw}
            strokeLinecap="round"
            markerEnd={`url(#${arrowId})`}
          />
        </g>
      );
    }
    case "text": {
      return (
        <g
          style={{ cursor: "pointer" }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(ann.id);
          }}
        >
          <rect
            x={d.x - 4}
            y={d.y - 18}
            width={(d.text || "").length * 9 + 12}
            height={24}
            fill="rgba(0,0,0,0.55)"
            rx={3}
          />
          <text
            x={d.x}
            y={d.y}
            fill="#fff"
            fontSize="16"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {d.text}
          </text>
        </g>
      );
    }
    default:
      return null;
  }
}

// ─── In-progress drawing overlay ──────────────────────────────────────────────

function InProgressOverlay({ state, tool }) {
  if (!state) return null;
  const { startX, startY, currentX, currentY, points } = state;
  const color = STROKE_COLOR;
  const lw = STROKE_WIDTH;
  const common = {
    stroke: color,
    strokeWidth: lw,
    fill: "none",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch (tool) {
    case "rectangle": {
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      return (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          {...common}
          strokeDasharray="5,3"
        />
      );
    }
    case "ellipse": {
      const cx = (startX + currentX) / 2;
      const cy = (startY + currentY) / 2;
      const rx = Math.abs(currentX - startX) / 2;
      const ry = Math.abs(currentY - startY) / 2;
      return (
        <ellipse
          cx={cx}
          cy={cy}
          rx={rx}
          ry={ry}
          {...common}
          strokeDasharray="5,3"
        />
      );
    }
    case "polygon": {
      if (!points || points.length === 0) return null;
      const allPts = [...points, { x: currentX, y: currentY }];
      const pStr = allPts.map((p) => `${p.x},${p.y}`).join(" ");
      return <polyline points={pStr} {...common} strokeDasharray="5,3" />;
    }
    case "freehand": {
      if (!points || points.length < 2) return null;
      const path = points
        .map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`)
        .join(" ");
      return <path d={path} {...common} />;
    }
    case "line":
      return (
        <line
          x1={startX}
          y1={startY}
          x2={currentX}
          y2={currentY}
          {...common}
          strokeDasharray="5,3"
        />
      );
    case "arrow": {
      const arrowId = "ip-arrow";
      return (
        <g>
          <defs>
            <marker
              id={arrowId}
              markerWidth="6"
              markerHeight="6"
              refX="5"
              refY="3"
              orient="auto"
            >
              <path d="M0,0 L0,6 L6,3 z" fill={color} />
            </marker>
          </defs>
          <line
            x1={startX}
            y1={startY}
            x2={currentX}
            y2={currentY}
            stroke={color}
            strokeWidth={lw}
            strokeLinecap="round"
            markerEnd={`url(#${arrowId})`}
            strokeDasharray="5,3"
          />
        </g>
      );
    }
    default:
      return null;
  }
}

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
        zIndex: 200,
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

// ─── Main Component ───────────────────────────────────────────────────────────

/**
 * @param {Object} props
 * @param {string}   props.imageSrc          - URL of current job image
 * @param {string}   props.imageName         - Display name
 * @param {Function} props.onAddToComment    - (annotatedFile: File) => void
 * @param {string}   props.jobId
 */
const JobImageAnnotation = ({ imageSrc, imageName, jobId, imageId }) => {
  const { isAnnotating, activeTool, setActiveTool } = useGlobalAnnotationMode();

  // Annotations stored in NATURAL image coordinates
  const [annotations, setAnnotations] = useState([]); // committed
  const [undoStack, setUndoStack] = useState([]); // stack of annotation arrays for undo
  const [redoStack, setRedoStack] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [drawState, setDrawState] = useState(null); // in-progress drawing display coords
  const [textPending, setTextPending] = useState(null); // { displayX, displayY, naturalX, naturalY }
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    globalAnnotationData.set(imageId || imageName, {
      imageSrc,
      imageName,
      jobId,
      annotations,
      selectedId,
    });
    return () => {
      globalAnnotationData.delete(imageId || imageName);
    };
  }, [imageId, imageName, imageSrc, jobId, annotations, selectedId]);

  const containerRef = useRef(null); // the Box that holds the image
  const imgRef = useRef(null); // the <img> element
  const svgRef = useRef(null);

  // For move: track delta
  const dragRef = useRef(null);

  // ─── Image dimension helpers ──────────────────────────────────────────────

  const getImgEl = () => imgRef.current;
  const getContainerRect = () => containerRef.current?.getBoundingClientRect();

  // ─── Annotation history ───────────────────────────────────────────────────

  const pushHistory = useCallback(
    (newAnnotations) => {
      setUndoStack((prev) => [...prev, annotations]);
      setRedoStack([]);
      setAnnotations(newAnnotations);
    },
    [annotations]
  );

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [...s, annotations]);
    setAnnotations(prev);
    setUndoStack((s) => s.slice(0, -1));
    setSelectedId(null);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, annotations]);
    setAnnotations(next);
    setRedoStack((s) => s.slice(0, -1));
    setSelectedId(null);
  };

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    pushHistory(annotations.filter((a) => a.id !== selectedId));
    setSelectedId(null);
  }, [annotations, selectedId, pushHistory]);

  const handleCancel = useCallback(() => {
    setAnnotations([]);
    setUndoStack([]);
    setRedoStack([]);
    setSelectedId(null);
    setDrawState(null);
  }, []);

  useEffect(() => {
    const handleCmd = (e) => {
      if (e.type === "undo") handleUndo();
      if (e.type === "redo") handleRedo();
      if (e.type === "delete") handleDelete();
      if (e.type === "cancel") handleCancel();
    };
    annotationCommands.addEventListener("undo", handleCmd);
    annotationCommands.addEventListener("redo", handleCmd);
    annotationCommands.addEventListener("delete", handleCmd);
    annotationCommands.addEventListener("cancel", handleCmd);
    return () => {
      annotationCommands.removeEventListener("undo", handleCmd);
      annotationCommands.removeEventListener("redo", handleCmd);
      annotationCommands.removeEventListener("delete", handleCmd);
      annotationCommands.removeEventListener("cancel", handleCmd);
    };
  }, [handleUndo, handleRedo, handleDelete, handleCancel]);

  // ─── Keyboard shortcuts ───────────────────────────────────────────────────

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
  });

  // ─── Mouse event handlers ─────────────────────────────────────────────────

  const getSVGPos = (e) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  };

  const displayToNat = useCallback((displayPt) => {
    const imgEl = getImgEl();
    const containerRect = getContainerRect();
    if (!imgEl || !containerRect) return displayPt;
    return displayToNatural(displayPt, imgEl, containerRect);
  }, []);

  // commit a finished annotation (already in natural coords)
  const commitAnnotation = useCallback(
    (ann) => {
      const newList = [...annotations, ann];
      setUndoStack((prev) => [...prev, annotations]);
      setRedoStack([]);
      setAnnotations(newList);
      setSelectedId(ann.id);
    },
    [annotations]
  );

  const handleMouseDown = (e) => {
    if (activeTool === "select") {
      setSelectedId(null);
      return;
    }
    if (activeTool === "text") {
      const pos = getSVGPos(e);
      const nat = displayToNat(pos);
      setTextPending({
        displayX: pos.x,
        displayY: pos.y,
        naturalX: nat.x,
        naturalY: nat.y,
      });
      return;
    }

    e.preventDefault();
    const pos = getSVGPos(e);

    if (activeTool === "polygon") {
      setDrawState((prev) => {
        if (!prev) {
          return {
            startX: pos.x,
            startY: pos.y,
            currentX: pos.x,
            currentY: pos.y,
            points: [{ x: pos.x, y: pos.y }],
          };
        }
        return { ...prev, points: [...prev.points, { x: pos.x, y: pos.y }] };
      });
      return;
    }

    setDrawState({
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
      points: activeTool === "freehand" ? [{ x: pos.x, y: pos.y }] : undefined,
    });
  };

  const handleMouseMove = (e) => {
    if (activeTool === "select" && dragRef.current) {
      const pos = getSVGPos(e);
      const { id, startPos, startAnn } = dragRef.current;

      const natStart = displayToNat(startPos);
      const natCur = displayToNat(pos);
      const dx = natCur.x - natStart.x;
      const dy = natCur.y - natStart.y;

      dragRef.current.moved = true;

      setAnnotations((prev) =>
        prev.map((a) => {
          if (a.id !== id) return a;
          const newData = JSON.parse(JSON.stringify(startAnn.data)); // clone
          if (a.tool === "rectangle") {
            newData.x += dx;
            newData.y += dy;
          }
          if (a.tool === "ellipse") {
            newData.cx += dx;
            newData.cy += dy;
          }
          if (a.tool === "polygon" || a.tool === "freehand") {
            newData.points = newData.points.map((p) => ({
              x: p.x + dx,
              y: p.y + dy,
            }));
          }
          if (a.tool === "line" || a.tool === "arrow") {
            newData.x1 += dx;
            newData.y1 += dy;
            newData.x2 += dx;
            newData.y2 += dy;
          }
          if (a.tool === "text") {
            newData.x += dx;
            newData.y += dy;
          }
          return { ...a, data: newData };
        })
      );
      return;
    }

    if (!drawState) return;
    if (
      activeTool === "select" ||
      activeTool === "text" ||
      activeTool === "polygon"
    )
      return;

    const pos = getSVGPos(e);
    if (activeTool === "freehand") {
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

  const handleMouseUp = (e) => {
    if (activeTool === "select") {
      if (dragRef.current) {
        if (dragRef.current.moved) {
          const original = dragRef.current.originalArray;
          setUndoStack((prev) => [...prev, original]);
          setRedoStack([]);
        }
        dragRef.current = null;
      }
      return;
    }

    if (!drawState) return;
    if (activeTool === "polygon") return; // polygon finishes on dblclick
    if (activeTool === "select" || activeTool === "text") return;

    const pos = getSVGPos(e);
    const { startX, startY, points } = drawState;

    const conv = (pt) => displayToNat(pt);

    let newAnn = null;
    const id = uid();
    const base = {
      id,
      tool: activeTool,
      color: STROKE_COLOR,
      lineWidth: STROKE_WIDTH,
    };

    switch (activeTool) {
      case "rectangle": {
        const x = Math.min(startX, pos.x);
        const y = Math.min(startY, pos.y);
        const w = Math.abs(pos.x - startX);
        const h = Math.abs(pos.y - startY);
        if (w < 4 || h < 4) break;
        const tl = conv({ x, y });
        const br = conv({ x: x + w, y: y + h });
        newAnn = {
          ...base,
          data: { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y },
        };
        break;
      }
      case "ellipse": {
        const cx = (startX + pos.x) / 2;
        const cy = (startY + pos.y) / 2;
        const rx = Math.abs(pos.x - startX) / 2;
        const ry = Math.abs(pos.y - startY) / 2;
        if (rx < 4 || ry < 4) break;
        const natC = conv({ x: cx, y: cy });
        const natRx = conv({ x: cx + rx, y: cy });
        const natRy = conv({ x: cx, y: cy + ry });
        newAnn = {
          ...base,
          data: {
            cx: natC.x,
            cy: natC.y,
            rx: natRx.x - natC.x,
            ry: natRy.y - natC.y,
          },
        };
        break;
      }
      case "freehand": {
        if (!points || points.length < 2) break;
        newAnn = { ...base, data: { points: points.map(conv) } };
        break;
      }
      case "line": {
        if (Math.abs(pos.x - startX) < 4 && Math.abs(pos.y - startY) < 4) break;
        const p1 = conv({ x: startX, y: startY });
        const p2 = conv({ x: pos.x, y: pos.y });
        newAnn = { ...base, data: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } };
        break;
      }
      case "arrow": {
        if (Math.abs(pos.x - startX) < 4 && Math.abs(pos.y - startY) < 4) break;
        const p1 = conv({ x: startX, y: startY });
        const p2 = conv({ x: pos.x, y: pos.y });
        newAnn = { ...base, data: { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y } };
        break;
      }
      default:
        break;
    }

    if (newAnn) commitAnnotation(newAnn);
    setDrawState(null);
  };

  // Polygon double-click to close
  const handleDblClick = (e) => {
    if (activeTool !== "polygon" || !drawState) return;
    e.preventDefault();
    const { points } = drawState;
    if (!points || points.length < 3) {
      setDrawState(null);
      return;
    }
    const conv = (pt) => displayToNat(pt);
    const natPoints = points.map(conv);
    commitAnnotation({
      id: uid(),
      tool: "polygon",
      color: STROKE_COLOR,
      lineWidth: STROKE_WIDTH,
      data: { points: natPoints },
    });
    setDrawState(null);
  };

  // ─── Text confirm ─────────────────────────────────────────────────────────

  const handleTextConfirm = (text) => {
    if (!text || !textPending) {
      setTextPending(null);
      return;
    }
    commitAnnotation({
      id: uid(),
      tool: "text",
      color: STROKE_COLOR,
      lineWidth: STROKE_WIDTH,
      data: { x: textPending.naturalX, y: textPending.naturalY, text },
    });
    setTextPending(null);
    setActiveTool("select");
  };

  const handleItemPointerDown = (e, ann) => {
    if (activeTool !== "select") return;
    e.stopPropagation();
    setSelectedId(ann.id);
    const pos = getSVGPos(e);
    dragRef.current = {
      id: ann.id,
      startPos: pos,
      startAnn: JSON.parse(JSON.stringify(ann)),
      originalArray: annotations,
      moved: false,
    };
  };

  // ─── SVG dimensions (mirror container) ───────────────────────────────────

  const [svgSize, setSvgSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSvgSize({ width, height });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ─── Build display-space annotations ──────────────────────────────────────

  const [displayAnnotations, setDisplayAnnotations] = useState([]);

  useEffect(() => {
    const imgEl = getImgEl();
    const containerRect = getContainerRect();
    if (!imgEl || !containerRect || !imgEl.complete) return;
    setDisplayAnnotations(
      annotations.map((a) => annNaturalToDisplay(a, imgEl, containerRect))
    );
  }, [annotations, svgSize]);

  // ─── cursor ───────────────────────────────────────────────────────────────

  const cursorMap = {
    select: "default",
    rectangle: "crosshair",
    ellipse: "crosshair",
    polygon: "crosshair",
    freehand: "crosshair",
    line: "crosshair",
    arrow: "crosshair",
    text: "text",
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          position: "relative",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
          userSelect: "none",
          cursor: isAnnotating
            ? cursorMap[activeTool] || "crosshair"
            : "default",
        }}
        onMouseMove={isAnnotating ? handleMouseMove : undefined}
        onMouseUp={isAnnotating ? handleMouseUp : undefined}
      >
        {/* Original Image */}
        {imageSrc ? (
          <img
            ref={imgRef}
            src={imageSrc}
            alt={imageName || "Job image"}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              display: "block",
              pointerEvents: "none",
            }}
          />
        ) : (
          <Typography color="text.secondary">No image selected</Typography>
        )}

        {/* SVG overlay — only in annotation mode */}
        {isAnnotating && imageSrc && (
          <svg
            ref={svgRef}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: svgSize.width,
              height: svgSize.height,
              pointerEvents: "all",
              overflow: "visible",
            }}
            onMouseDown={handleMouseDown}
            onDoubleClick={handleDblClick}
          >
            {/* Committed annotations */}
            {displayAnnotations.map((ann) => (
              <AnnSvgItem
                key={ann.id}
                ann={{ ...ann, onPointerDown: handleItemPointerDown }}
                isSelected={ann.id === selectedId}
                onSelect={setSelectedId}
              />
            ))}

            {/* In-progress drawing */}
            {drawState && (
              <InProgressOverlay state={drawState} tool={activeTool} />
            )}
          </svg>
        )}

        {/* Text input popover */}
        {textPending && (
          <TextInputPopover
            pos={{ x: textPending.displayX, y: textPending.displayY - 30 }}
            onConfirm={handleTextConfirm}
            onCancel={() => setTextPending(null)}
          />
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
            }}
          >
            {imageName}
          </Box>
        )}

        {/* Exporting overlay */}
        {isExporting && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,255,255,0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 300,
            }}
          >
            <Typography fontWeight={600}>
              Generating annotated image…
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default JobImageAnnotation;
