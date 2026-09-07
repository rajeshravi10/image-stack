/**
 * CommentsSection.js
 *
 * A self-contained comments panel that supports:
 * - Text-only comments
 * - Comments with an image attachment (e.g. an annotated job image)
 *
 * Props:
 *   pendingAttachment: File | null  – set externally when "Add to Comment" fires
 *   onClearPendingAttachment: () => void
 */

import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Avatar,
} from "@mui/material";
import {
  SendOutlined,
  DeleteOutline,
  AttachFile,
  ImageOutlined,
} from "@mui/icons-material";
import ImageLightbox from "./ImageLightbox";

/**
 * @typedef {import('../JobImageAnnotation/types').JobComment} JobComment
 * @typedef {import('../JobImageAnnotation/types').CommentAttachment} CommentAttachment
 */

const uid = () => Math.random().toString(36).slice(2, 10);

// ─── Single comment display ───────────────────────────────────────────────────

function CommentCard({ comment, onImageClick }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.5,
        borderBottom: "1px solid #F0F0F0",
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

      {comment.text && (
        <Typography
          sx={{ fontSize: 13, color: "text.primary", mb: 0.5, pl: "34px" }}
        >
          {comment.text}
        </Typography>
      )}

      {comment.attachments?.map(
        (att) =>
          att.type === "image" && (
            <Box key={att.id} sx={{ pl: "34px", mt: 0.5 }}>
              <Box
                component="img"
                src={att.url}
                alt={att.name || "Annotated image"}
                sx={{
                  maxWidth: "100%",
                  maxHeight: 240,
                  objectFit: "contain",
                  borderRadius: 1,
                  border: "1px solid #E0E0E0",
                  display: "block",
                  cursor: "pointer",
                  transition: "opacity 0.2s, filter 0.2s",
                  "&:hover": {
                    opacity: 0.9,
                    filter: "brightness(0.9)",
                  },
                }}
                onClick={() => onImageClick({ src: att.url, alt: att.name })}
              />
              <Typography
                sx={{ fontSize: 11, color: "text.secondary", mt: 0.25 }}
              >
                {att.name}
              </Typography>
            </Box>
          )
      )}
    </Box>
  );
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function CommentComposer({
  pendingAttachment,
  onClearPendingAttachment,
  onSubmit,
  onImageClick,
}) {
  const [text, setText] = useState("");
  const [attachmentPreviewUrl, setAttachmentPreviewUrl] = useState(null);
  const [attachmentFile, setAttachmentFile] = useState(null);
  const fileInputRef = useRef(null);

  // When parent supplies a new attachment (annotated image), adopt it
  useEffect(() => {
    if (!pendingAttachment) return;

    // Clean up old blob URL
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);

    const url = URL.createObjectURL(pendingAttachment);
    setAttachmentPreviewUrl(url);
    setAttachmentFile(pendingAttachment);
    onClearPendingAttachment(); // tell parent we've consumed it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingAttachment]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeAttachment = () => {
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    setAttachmentPreviewUrl(null);
    setAttachmentFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
    const url = URL.createObjectURL(file);
    setAttachmentPreviewUrl(url);
    setAttachmentFile(file);
    e.target.value = "";
  };

  const handleSubmit = () => {
    if (!text.trim() && !attachmentFile) return;

    /** @type {CommentAttachment[]} */
    const attachments = attachmentFile
      ? [
          {
            id: uid(),
            type: "image",
            name: attachmentFile.name,
            url: attachmentPreviewUrl, // blob URL lives as long as this session
            file: attachmentFile,
          },
        ]
      : [];

    /** @type {JobComment} */
    const comment = {
      id: uid(),
      text: text.trim(),
      attachments,
      createdAt: new Date().toISOString(),
      author: "Rajesh",
    };

    onSubmit(comment);
    setText("");
    // NOTE: We intentionally keep the blob URL alive in the comment list
    // so the image keeps rendering.  We do NOT revoke it here.
    setAttachmentPreviewUrl(null);
    setAttachmentFile(null);
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
      {/* Attachment preview */}
      {attachmentPreviewUrl && (
        <Box
          sx={{
            position: "relative",
            border: "1px solid #D9DADB",
            borderRadius: 1,
            overflow: "hidden",
            background: "#fafafa",
          }}
        >
          <Box
            component="img"
            src={attachmentPreviewUrl}
            alt="Attachment preview"
            sx={{
              width: "100%",
              maxHeight: 160,
              objectFit: "contain",
              display: "block",
              cursor: "pointer",
              transition: "opacity 0.2s, filter 0.2s",
              "&:hover": {
                opacity: 0.9,
                filter: "brightness(0.9)",
              },
            }}
            onClick={() =>
              onImageClick({
                src: attachmentPreviewUrl,
                alt: attachmentFile?.name,
              })
            }
          />
          <Tooltip title="Remove attachment">
            <IconButton
              size="small"
              onClick={removeAttachment}
              sx={{
                position: "absolute",
                top: 4,
                right: 4,
                background: "rgba(0,0,0,0.5)",
                color: "#fff",
                "&:hover": { background: "rgba(0,0,0,0.7)" },
                p: 0.25,
              }}
            >
              <DeleteOutline sx={{ fontSize: 16 }} />
            </IconButton>
          </Tooltip>
          {attachmentFile && (
            <Typography
              sx={{
                fontSize: 10,
                color: "text.secondary",
                px: 1,
                pb: 0.5,
                background: "#fafafa",
              }}
            >
              {attachmentFile.name}
            </Typography>
          )}
        </Box>
      )}

      {/* Text input row */}
      <Box sx={{ display: "flex", alignItems: "flex-end", gap: 0.5 }}>
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

        {/* File attach button */}
        <Tooltip title="Attach image">
          <IconButton
            size="small"
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 0.25 }}
          >
            <AttachFile sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />

        {/* Send */}
        <Tooltip title="Add Comment (Enter)">
          <span>
            <IconButton
              size="small"
              onClick={handleSubmit}
              disabled={!text.trim() && !attachmentFile}
              sx={{
                mb: 0.25,
                background:
                  !text.trim() && !attachmentFile ? undefined : "#2680EB",
                color: !text.trim() && !attachmentFile ? undefined : "#fff",
                "&:hover": {
                  background:
                    !text.trim() && !attachmentFile ? undefined : "#1a6dd4",
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

/**
 * @param {Object} props
 * @param {File|null} props.pendingAttachment           - annotated image file from parent
 * @param {Function}  props.onClearPendingAttachment    - tell parent the file was consumed
 */
const CommentsSection = ({ pendingAttachment, onClearPendingAttachment }) => {
  const [comments, setComments] = useState([]);
  const listEndRef = useRef(null);

  // Lightbox state
  const [lightbox, setLightbox] = useState({ open: false, src: "", alt: "" });

  const handleImageClick = ({ src, alt }) => {
    setLightbox({ open: true, src, alt });
  };

  const closeLightbox = () => {
    setLightbox((prev) => ({ ...prev, open: false }));
  };

  const handleSubmit = (comment) => {
    setComments((prev) => [...prev, comment]);
  };

  // Auto-scroll to newest comment
  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

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
              Annotate the job image and add it as a comment.
            </Typography>
          </Box>
        )}

        {comments.map((c) => (
          <CommentCard key={c.id} comment={c} onImageClick={handleImageClick} />
        ))}
        <div ref={listEndRef} />
      </Box>

      {/* Composer */}
      <CommentComposer
        pendingAttachment={pendingAttachment}
        onClearPendingAttachment={onClearPendingAttachment}
        onSubmit={handleSubmit}
        onImageClick={handleImageClick}
      />

      {/* Lightbox */}
      <ImageLightbox
        open={lightbox.open}
        src={lightbox.src}
        alt={lightbox.alt}
        onClose={closeLightbox}
      />
    </Box>
  );
};

export default CommentsSection;
