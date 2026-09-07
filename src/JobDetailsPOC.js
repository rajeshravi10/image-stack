import React, { useState, useCallback } from "react";
import { Box, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import DragDropPOC from "./DragDropPOC";
import DetailsSidebarPOC from "./DetailsSidebarPOC";

const JobDetailsPOC = ({ onBack = () => window.history.back() }) => {
  const location = useLocation();
  const jobId = location.state?.jobId;

  /**
   * pendingAttachment: File | null
   * When the user clicks "Add to Comment" in the annotation mode,
   * the generated PNG File is placed here.  The DetailsSidebarPOC picks
   * it up and pre-loads it into the comment composer.
   */
  const [pendingAttachment, setPendingAttachment] = useState(null);

  const handleAnnotatedImage = useCallback((file) => {
    setPendingAttachment(file);
    // Sidebar will auto-switch to Comments tab when it detects a new attachment
  }, []);

  const handleClearPendingAttachment = useCallback(() => {
    setPendingAttachment(null);
  }, []);

  const mockJobs = {
    POC123: {
      pulse_job_id: "POC123",
      workflow_code: "WF",
      external_job_id: "EXT001",
      customer_assignment_id: "CUST001",
      current_status: "New",
      current_assignee: "John Doe",
      priority_code: "High",
      created_at: "2025-01-01",
      source_file_name: "BQ41...A.TIF",
    },
    POC999: {
      pulse_job_id: "pocany",
      workflow_code: "WF",
      external_job_id: "EXT999",
      customer_assignment_id: "CUST999",
      current_status: "In Progress",
      current_assignee: "Jane Smith",
      priority_code: "Medium",
      created_at: "2025-01-02",
      source_file_name: "ABC99...B.TIF",
    },
  };

  const jobData = mockJobs[jobId];

  return (
    <Box
      sx={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#F9FBFC",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* MAIN LAYOUT */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDE – 70% */}
        <Box
          sx={{
            flex: "0 0 70%",
            minWidth: 0,
            background: "#F9FBFC",
            display: "flex",
            flexDirection: "column",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* HEADER (Fixed height so toolbar appearance causes NO layout shift) */}
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
            <IconButton onClick={onBack} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>

            <Box sx={{ fontWeight: 600, fontSize: 16 }}>Job {jobId}</Box>

            {/* Portal target for Annotation Toolbar */}
            <Box
              id="annotation-toolbar-portal-target"
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                overflowX: "auto",
              }}
            />
          </Box>
          <DragDropPOC
            jobData={jobData}
            onAnnotatedImage={handleAnnotatedImage}
          />
        </Box>

        {/* RIGHT SIDE – 30% */}
        <Box
          sx={{
            flex: "0 0 30%",
            background: "#fff",
            borderLeft: "1px solid #D9DADB",
            overflow: "auto",
          }}
        >
          <DetailsSidebarPOC
            jobData={jobData}
            pendingAttachment={pendingAttachment}
            onClearPendingAttachment={handleClearPendingAttachment}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default JobDetailsPOC;
