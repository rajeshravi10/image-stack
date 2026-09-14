/**
 * @typedef {'select'|'rectangle'|'ellipse'|'polygon'|'freehand'|'line'|'arrow'|'highlight'} AnnotationTool
 */

/**
 * @typedef {Object} CustomAnnotation
 * @property {string} id          - Unique identifier (stable across session)
 * @property {AnnotationTool} tool - Tool used to create this annotation
 * @property {string} imageId     - ID of the image this annotation belongs to
 * @property {Object} data        - Tool-specific drawing data (see below)
 * @property {string} color       - Stroke colour (hex)
 * @property {number} lineWidth   - Stroke width in display pixels
 * @property {number} [opacity]   - Opacity (0–1)
 * @property {string} [versionId] - Optional version ID for future version overlay support
 * @property {'open'|'resolved'} [status] - Optional annotation resolution status
 */

/**
 * Custom annotation data shapes (stored in stage/pixel coordinates):
 *
 * rectangle : { x, y, width, height }
 * ellipse   : { cx, cy, rx, ry }
 * polygon   : { points: [{x,y}] }
 * freehand  : { points: [{x,y}] }
 * highlight : { points: [{x,y}] }
 * line      : { x1, y1, x2, y2 }
 * arrow     : { x1, y1, x2, y2 }
 */

/**
 * @typedef {Object} JobComment
 * @property {string}  id            - Unique id
 * @property {string}  text          - Comment body
 * @property {string}  [annotationId] - Link to an annotation (annotation.id)
 * @property {string}  [imageId]     - Image the linked annotation belongs to
 * @property {string}  [versionId]   - Optional version ID for future version support
 * @property {string}  createdAt     - ISO timestamp
 * @property {string}  author        - Display name
 * @property {'open'|'resolved'} [status] - Optional resolution status
 */

const types = {};
export default types;
