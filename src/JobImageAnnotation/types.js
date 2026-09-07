/**
 * @typedef {'select'|'rectangle'|'ellipse'|'polygon'|'freehand'|'line'|'arrow'|'text'} AnnotationTool
 */

/**
 * @typedef {Object} CustomAnnotation
 * @property {string} id          - Unique identifier
 * @property {AnnotationTool} tool - Tool used to create this annotation
 * @property {Object} data        - Tool-specific drawing data (see below)
 * @property {string} [text]      - Optional label / text content
 * @property {string} color       - Stroke colour (hex)
 * @property {number} lineWidth   - Stroke width in display pixels
 */

/**
 * Custom annotation data shapes:
 *
 * rectangle : { x, y, width, height }   – coords in IMAGE-NATURAL px
 * ellipse   : { cx, cy, rx, ry }        – coords in IMAGE-NATURAL px
 * polygon   : { points: [{x,y}] }       – coords in IMAGE-NATURAL px
 * freehand  : { points: [{x,y}] }       – coords in IMAGE-NATURAL px
 * line      : { x1, y1, x2, y2 }        – coords in IMAGE-NATURAL px
 * arrow     : { x1, y1, x2, y2 }        – coords in IMAGE-NATURAL px
 * text      : { x, y, text }            – coords in IMAGE-NATURAL px
 */

/**
 * @typedef {Object} CommentAttachment
 * @property {string}  id    - Unique id
 * @property {'image'} type  - Always 'image' for this POC
 * @property {string}  name  - File name
 * @property {string}  url   - blob: URL for preview
 * @property {File}    [file] - Underlying File object (for future API calls)
 */

/**
 * @typedef {Object} JobComment
 * @property {string}             id            - Unique id
 * @property {string}             text          - Comment body
 * @property {CommentAttachment[]} attachments  - Image attachments
 * @property {string}             [annotationId] - Link to the annotation session
 * @property {string}             createdAt      - ISO timestamp
 * @property {string}             author         - Display name
 */

const types = {};
export default types;
