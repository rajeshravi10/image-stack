/**
 * CommentsSection.js
 *
 * A comments panel that supports:
 * - Text-only comments (unlinked)
 * - Comments linked to annotations via annotationId
 *
 * When an annotation is selected (globally), submitting a comment links
 * that comment to the annotation. Clicking a comment highlights its
 * linked annotation on the correct image.
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
} from "@mui/material";
import { SendOutlined, ImageOutlined, CropSquare } from "@mui/icons-material";
import {
  useGlobalAnnotationMode,
  globalAnnotationRegistry,
  setGlobalSelectedAnnotationId,
  setGlobalSelectedCommentId,
  setGlobalHighlightedAnnotationId,
  setGlobalToolSettings,
  dispatchGridCommand,
  hydrateSessionState,
  saveSessionState,
} from "../JobImageAnnotation/AnnotationGlobals";
import AnnotationToolbar from "../JobImageAnnotation/AnnotationToolbar";

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Helper: find annotation across all images ────────────────────────────────

function findAnnotationById(annotationId) {
  for (const [imageId, annotations] of globalAnnotationRegistry.entries()) {
    const ann = annotations.find((a) => a.id === annotationId);
    if (ann) return { ...ann, imageId };
  }
  return null;
}

// ─── Single comment display ───────────────────────────────────────────────────

function CommentCard({ comment, isSelected, onClick, commentRef }) {
  const linkedAnnotation =
    comment.annotationId && comment.imageId
      ? (globalAnnotationRegistry.get(comment.imageId) || []).find(
          (a) => a.id === comment.annotationId
        )
      : undefined;
  const hasAnnotation = !!linkedAnnotation;

  return (
    <Box
      ref={commentRef}
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid #F0F0F0",
        cursor: "pointer",
        background: isSelected ? "#E8F0FE" : "transparent",
        borderLeft: isSelected ? "3px solid #2680EB" : "3px solid transparent",
        transition: "background 0.2s, border-left 0.2s",
        "&:hover": {
          background: isSelected ? "#E8F0FE" : "#F5F8FF",
        },
        "&:last-child": { borderBottom: "none" },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
        <Avatar
          sx={{ width: 26, height: 26, fontSize: 12, bgcolor: "#2680EB" }}
        >
          {comment.author?.[0] || "U"}
        </Avatar>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
          {comment.author || "User"}
        </Typography>
        <Typography sx={{ fontSize: 11, color: "text.secondary", ml: "auto" }}>
          {new Date(comment.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Typography>
      </Box>

      {/* Annotation indicator */}
      {hasAnnotation && (
        <Box sx={{ pl: "34px", mb: 0.5 }}>
          <Tooltip title="Annotation attached" arrow placement="top">
            <Chip
              icon={<CropSquare sx={{ fontSize: 14 }} />}
              label="Annotation"
              size="small"
              variant="outlined"
              sx={{
                height: 22,
                fontSize: 11,
                fontWeight: 500,
                color: "#2680EB",
                borderColor: "#2680EB40",
                bgcolor: "#2680EB08",
                "& .MuiChip-icon": { color: "#2680EB", ml: 0.5 },
                cursor: "inherit",
              }}
            />
          </Tooltip>
        </Box>
      )}

      {comment.text && (
        <Typography
          sx={{ fontSize: 13, color: "text.primary", mb: 0.5, pl: "34px" }}
        >
          {comment.text}
        </Typography>
      )}
    </Box>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function CommentComposer({ selectedAnnotationId, onSubmit }) {
  const [text, setText] = useState("");

  const handleSubmit = () => {
    if (!text.trim()) return;

    // Look up the annotation to get the imageId
    let imageId = null;
    if (selectedAnnotationId) {
      const ann = findAnnotationById(selectedAnnotationId);
      if (ann) {
        imageId = ann.imageId;
      }
    }

    const comment = {
      id: uid(),
      text: text.trim(),
      annotationId: selectedAnnotationId || null,
      imageId: imageId,
      versionId: null, // prepared for future version support
      createdAt: new Date().toISOString(),
      author: "Rajesh",
      status: "open",
    };

    onSubmit(comment);
    setText("");
  };

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.5,
        borderTop: "1px solid #D9DADB",
        background: "#fff",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {/* Text input row */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
        {selectedAnnotationId && (
          <Tooltip title="Attached to annotation" arrow placement="top">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 32,
                height: 32,
                borderRadius: 1,
                bgcolor: "#E8F0FE",
                color: "#2680EB",
                mb: 0.25,
                border: "1px solid #2680EB40",
              }}
            >
              <CropSquare sx={{ fontSize: 20 }} />
            </Box>
          </Tooltip>
        )}
        <TextField
          multiline
          maxRows={4}
          fullWidth
          size="small"
          placeholder="Add a comment…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              fontSize: 13,
            },
          }}
        />

        {/* Send */}
        <Tooltip title="Add Comment (Enter)">
          <span>
            <IconButton
              size="small"
              onClick={handleSubmit}
              disabled={!text.trim()}
              sx={{
                mb: 0.25,
                background: !text.trim() ? undefined : "#2680EB",
                color: !text.trim() ? undefined : "#fff",
                "&:hover": {
                  background: !text.trim() ? undefined : "#1a6dd4",
                },
                borderRadius: 1,
              }}
            >
              <SendOutlined sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      </Box>
    </Box>
  );
}

// ─── Main CommentsSection ─────────────────────────────────────────────────────

const CommentsSection = ({ jobId }) => {
  const [comments, setComments] = useState(() => hydrateSessionState(jobId));
  const [selectedCommentId, setLocalSelectedCommentId] = useState(null);
  const listEndRef = useRef(null);
  const commentRefs = useRef({});

  // Track whether the last selectedAnnotationId change came from a comment click
  // so we can distinguish it from "user just drew a new annotation"
  const commentClickedRef = useRef(false);

  const {
    selectedAnnotationId,
    activeTool,
    setActiveTool,
    canUndo,
    canRedo,
    toolSettings,
  } = useGlobalAnnotationMode();

  const handleUndo = () => dispatchGridCommand("undo");
  const handleRedo = () => dispatchGridCommand("redo");
  const setToolSettings = (settings) => setGlobalToolSettings(settings);

  // ── Handle comment submission ─────────────────────────────────────────────
  const handleSubmit = useCallback(
    (comment) => {
      setComments((prev) => {
        const next = [...prev, comment];
        if (jobId) saveSessionState(jobId, next);
        return next;
      });

      // After submitting a comment linked to an annotation, reset the
      // active annotation selection so the next comment doesn't accidentally
      // link to the same annotation.  The annotation itself stays rendered.
      if (comment.annotationId) {
        setGlobalSelectedAnnotationId(null);
        setGlobalHighlightedAnnotationId(null);
        setGlobalSelectedCommentId(null);
        setLocalSelectedCommentId(null);
      }
    },
    [jobId]
  );

  // ── Auto-scroll to newest comment ─────────────────────────────────────────
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  // ── Click comment → highlight annotation ──────────────────────────────────
  const handleCommentClick = useCallback((comment) => {
    // Mark that this selection change was triggered by a comment click
    commentClickedRef.current = true;

    setLocalSelectedCommentId(comment.id);
    setGlobalSelectedCommentId(comment.id);

    // Normal comment
    if (!comment.annotationId || !comment.imageId) {
      setGlobalSelectedAnnotationId(null);
      setGlobalHighlightedAnnotationId(null);
      return;
    }

    // ALWAYS navigate using the comment's imageId explicitly as requested
    window.dispatchEvent(
      new CustomEvent("switch-image", { detail: comment.imageId })
    );

    // Delay checking and highlighting the annotation to allow preview to mount/change
    setTimeout(() => {
      // Clear editing box immediately
      setGlobalSelectedAnnotationId(null);

      // Find the exact annotation using comment.annotationId
      const ann = findAnnotationById(comment.annotationId);
      if (!ann) {
        setGlobalHighlightedAnnotationId(null);
        return;
      }

      // Verify the found annotation's actual image matches the comment's declared image
      if (ann.imageId !== comment.imageId) {
        setGlobalHighlightedAnnotationId(null);
        return;
      }

      // If securely matched, display the annotation visually
      setGlobalHighlightedAnnotationId(ann.id);
    }, 50);
  }, []);

  // ── Click annotation → scroll to linked comment ──────────────────────────
  // Watch for changes in selectedAnnotationId (from annotation layer clicks)
  useEffect(() => {
    if (!selectedAnnotationId) {
      // When selection is cleared (e.g. after comment submit), deselect comment too
      setLocalSelectedCommentId(null);
      return;
    }

    // If this change was caused by a comment click, skip the reverse-lookup
    // (the comment is already selected)
    if (commentClickedRef.current) {
      commentClickedRef.current = false;
      return;
    }

    // Find a comment linked to this annotation
    const linkedComment = comments.find(
      (c) => c.annotationId === selectedAnnotationId
    );

    if (linkedComment) {
      setLocalSelectedCommentId(linkedComment.id);
      setGlobalSelectedCommentId(linkedComment.id);

      // Scroll to the comment
      const ref = commentRefs.current[linkedComment.id];
      if (ref) {
        ref.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    } else {
      // No linked comment → clear comment selection (annotation is newly drawn)
      setLocalSelectedCommentId(null);
      setGlobalSelectedCommentId(null);
    }
  }, [selectedAnnotationId, comments]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Comment list */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {comments.length === 0 && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              py: 4,
              color: "text.secondary",
              gap: 1,
            }}
          >
            <ImageOutlined sx={{ fontSize: 36, opacity: 0.3 }} />
            <Typography sx={{ fontSize: 13, opacity: 0.6 }}>
              No comments yet
            </Typography>
            <Typography
              sx={{ fontSize: 12, opacity: 0.5, textAlign: "center", px: 2 }}
            >
              Draw an annotation and add a comment to link them.
            </Typography>
          </Box>
        )}

        {comments.map((c) => (
          <CommentCard
            key={c.id}
            comment={c}
            isSelected={c.id === selectedCommentId}
            onClick={() => handleCommentClick(c)}
            commentRef={(el) => {
              commentRefs.current[c.id] = el;
            }}
          />
        ))}
        <div ref={listEndRef} />
      </Box>

      {/* Composer */}
      <CommentComposer
        selectedAnnotationId={selectedAnnotationId}
        onSubmit={handleSubmit}
      />

      {/* Annotation Tools */}
      <Box sx={{ borderTop: "1px solid #D9DADB", background: "#F9FBFC", p: 1 }}>
        <AnnotationToolbar
          activeTool={activeTool}
          onToolChange={(t) => setActiveTool(t)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onCancel={() => {}} // No close needed
          toolSettings={toolSettings}
          onToolSettingsChange={setToolSettings}
        />
      </Box>
    </Box>
  );
};

export default CommentsSection;
