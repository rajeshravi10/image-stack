/**
 * annotationExport.js
 *
 * Loads the original image onto an HTML Canvas, draws every annotation
 * on top (in natural-image coordinates), and returns a PNG File blob.
 *
 * All annotation coordinates stored in `annotations` must already be
 * in NATURAL image pixels (not display pixels).  The drawing code here
 * simply scales them back to the canvas size (which matches the natural
 * image size), so the output is always full-resolution.
 */

const ARROW_HEAD_LENGTH = 18;
const ARROW_HEAD_ANGLE = Math.PI / 6; // 30°
const DEFAULT_COLOR = "#FF3B30";
const DEFAULT_LINE_WIDTH = 3;
const FONT_SIZE = 20;
const FONT_FACE = "sans-serif";
const TEXT_PADDING = 6;
const TEXT_BG_ALPHA = 0.7;

/**
 * Load an image URL into an HTMLImageElement, resolving CORS issues
 * for same-origin data URIs / blob URLs.
 *
 * @param {string} src
 * @returns {Promise<HTMLImageElement>}
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * Draw a single arrowhead at (x2, y2) pointing FROM (x1, y1).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1
 * @param {number} y1
 * @param {number} x2
 * @param {number} y2
 */
function drawArrowhead(ctx, x1, y1, x2, y2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - ARROW_HEAD_LENGTH * Math.cos(angle - ARROW_HEAD_ANGLE),
    y2 - ARROW_HEAD_LENGTH * Math.sin(angle - ARROW_HEAD_ANGLE)
  );
  ctx.moveTo(x2, y2);
  ctx.lineTo(
    x2 - ARROW_HEAD_LENGTH * Math.cos(angle + ARROW_HEAD_ANGLE),
    y2 - ARROW_HEAD_LENGTH * Math.sin(angle + ARROW_HEAD_ANGLE)
  );
  ctx.stroke();
}

/**
 * Render one annotation onto the canvas context.
 * Coordinates are assumed to already be scaled to the canvas space.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {import('./types').CustomAnnotation} ann
 */
function renderAnnotation(ctx, ann) {
  const color = ann.color || DEFAULT_COLOR;
  const lw = ann.lineWidth || DEFAULT_LINE_WIDTH;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lw;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const { tool, data } = ann;

  switch (tool) {
    case "rectangle": {
      ctx.beginPath();
      ctx.strokeRect(data.x, data.y, data.width, data.height);
      break;
    }

    case "ellipse": {
      ctx.beginPath();
      ctx.ellipse(
        data.cx,
        data.cy,
        Math.abs(data.rx),
        Math.abs(data.ry),
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();
      break;
    }

    case "polygon": {
      if (!data.points || data.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(data.points[0].x, data.points[0].y);
      for (let i = 1; i < data.points.length; i++) {
        ctx.lineTo(data.points[i].x, data.points[i].y);
      }
      ctx.closePath();
      ctx.stroke();
      break;
    }

    case "freehand": {
      if (!data.points || data.points.length < 2) break;
      ctx.beginPath();
      ctx.moveTo(data.points[0].x, data.points[0].y);
      for (let i = 1; i < data.points.length; i++) {
        ctx.lineTo(data.points[i].x, data.points[i].y);
      }
      ctx.stroke();
      break;
    }

    case "line": {
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.stroke();
      break;
    }

    case "arrow": {
      ctx.beginPath();
      ctx.moveTo(data.x1, data.y1);
      ctx.lineTo(data.x2, data.y2);
      ctx.stroke();
      drawArrowhead(ctx, data.x1, data.y1, data.x2, data.y2);
      break;
    }

    case "text": {
      const text = data.text || "";
      if (!text) break;
      ctx.font = `bold ${FONT_SIZE}px ${FONT_FACE}`;
      const metrics = ctx.measureText(text);
      const textW = metrics.width;
      const textH = FONT_SIZE;

      // background pill
      ctx.globalAlpha = TEXT_BG_ALPHA;
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.roundRect(
        data.x - TEXT_PADDING,
        data.y - textH - TEXT_PADDING,
        textW + TEXT_PADDING * 2,
        textH + TEXT_PADDING * 2,
        4
      );
      ctx.fill();

      // text
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillText(text, data.x, data.y);
      break;
    }

    default:
      break;
  }

  ctx.restore();
}

/**
 * Export the original image with all annotations baked in as a PNG File.
 *
 * @param {Object} options
 * @param {string} options.imageUrl        - src URL of the original image
 * @param {import('./types').CustomAnnotation[]} options.annotations - annotations in NATURAL px
 * @param {string} [options.fileName]      - desired output file name
 * @returns {Promise<File>}
 */
export async function exportAnnotatedImage({
  imageUrl,
  annotations,
  fileName = "annotated.png",
}) {
  const img = await loadImage(imageUrl);

  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext("2d");
  // Draw original image
  ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

  // Draw each annotation (already in natural px)
  for (const ann of annotations) {
    renderAnnotation(ctx, ann);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Canvas toBlob returned null"));
        return;
      }
      const file = new File([blob], fileName, { type: "image/png" });
      resolve(file);
    }, "image/png");
  });
}

/**
 * Convert display-space coordinate to natural-image coordinate.
 *
 * @param {number} displayVal  - e.g. x or y in displayed pixels
 * @param {number} displayDim  - total display width or height
 * @param {number} naturalDim  - natural image width or height
 * @returns {number}
 */
export function toNatural(displayVal, displayDim, naturalDim) {
  if (displayDim === 0) return 0;
  return (displayVal / displayDim) * naturalDim;
}
