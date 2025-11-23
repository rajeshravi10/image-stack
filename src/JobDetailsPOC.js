import React from "react";
import { Box, IconButton } from "@mui/material";
import { ArrowBack } from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import DragDropPOC from "./DragDropPOC";
import DetailsSidebarPOC from "./DetailsSidebarPOC";

const JobDetailsPOC = ({ onBack = () => window.history.back() }) => {
  const location = useLocation();
  const jobId = location.state?.jobId || "POC123"; // fallback

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
      pulse_job_id: "POC999",
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
      {/* Back Button */}
      <Box sx={{ p: 1 }}>
        <IconButton onClick={onBack}>
          <ArrowBack />
        </IconButton>
      </Box>

      {/* MAIN LAYOUT */}
      <Box sx={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* LEFT SIDE – 70% */}
        <Box
          sx={{
            flex: "0 0 70%",
            overflow: "hidden",
            minWidth: 0,
            background: "transparent",
          }}
        >
          <DragDropPOC jobData={jobData} />
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
          <DetailsSidebarPOC jobData={jobData} />
        </Box>
      </Box>
    </Box>
  );
};

export default JobDetailsPOC;
