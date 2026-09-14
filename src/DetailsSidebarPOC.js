import React from "react";
import { Box } from "@mui/material";
import CommentsSection from "./CommentsSection/CommentsSection";

const DetailsSidebarPOC = ({ jobData }) => {
  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      {/* ── COMMENTS HEADER (Opposite to Job ID Header) ─────────────────── */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 2,
          py: 1,
          minHeight: 56,
          boxSizing: "border-box",
          borderBottom: "1px solid #D9DADB",
          bgcolor: "#fff",
        }}
      >
        <Box sx={{ fontWeight: 600, fontSize: 16 }}>Comments</Box>
      </Box>

      {/* ── COMMENTS SECTION ────────────────────────────────────────────── */}
      <Box
        sx={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <CommentsSection jobId={jobData?.pulse_job_id} />
      </Box>
    </Box>
  );
};

export default DetailsSidebarPOC;
