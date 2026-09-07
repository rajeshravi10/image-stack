import React, { useEffect } from "react";
import { Box, IconButton } from "@mui/material";
import { Close } from "@mui/icons-material";
import { createPortal } from "react-dom";

/**
 * A full-screen lightbox for displaying images.
 *
 * @param {Object} props
 * @param {boolean} props.open - Whether the lightbox is open.
 * @param {string} props.src - The image source URL.
 * @param {string} props.alt - Evaluation text/filename.
 * @param {Function} props.onClose - Callback to close the lightbox.
 */
const ImageLightbox = ({ open, src, alt, onClose }) => {
  useEffect(() => {
    if (open) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !src) return null;

  return createPortal(
    <Box
      onClick={onClose}
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        backdropFilter: "blur(4px)",
      }}
    >
      <IconButton
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          position: "absolute",
          top: 16,
          right: 16,
          color: "#fff",
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          "&:hover": {
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          },
        }}
      >
        <Close />
      </IconButton>

      <Box
        component="img"
        src={src}
        alt={alt || "Lightbox image preview"}
        onClick={(e) => e.stopPropagation()} // Prevent click from bubbling up to the backdrop
        sx={{
          maxWidth: "90%",
          maxHeight: "90%",
          objectFit: "contain",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
          borderRadius: 1,
        }}
      />
    </Box>,
    document.body
  );
};

export default ImageLightbox;
