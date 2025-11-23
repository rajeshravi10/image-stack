import React, { useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const DetailsSidebarPOC = ({ jobData }) => {
  const [basicOpen, setBasicOpen] = useState(true);
  const [instructionOpen, setInstructionOpen] = useState(true);
  const [checklistOpen, setChecklistOpen] = useState(true);

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
      {/* Tabs */}
      <Tabs value={0} sx={{ borderBottom: "1px solid #DDD" }}>
        <Tab label="Job Details" />
        <Tab label="Comments" disabled />
      </Tabs>

      {/* Scrollable region */}
      <Box sx={{ flex: 1, overflowY: "auto" }}>
        {/* Basic Information Accordion */}
        <Accordion
          expanded={basicOpen}
          onChange={() => setBasicOpen(!basicOpen)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>Basic Information</Typography>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 1 }}>
            {/* Row 1 */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  label="Customer Job ID"
                  size="small"
                  value="9999"
                />

                <TextField
                  fullWidth
                  label="File Name"
                  size="small"
                  value="PRD1-002_Filename_U_1.TIF"
                />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Row 2 */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priority</InputLabel>
                  <Select label="Priority" value="Rush">
                    <MenuItem value="Rush">Rush</MenuItem>
                    <MenuItem value="Normal">Normal</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Received Date"
                  type="datetime-local"
                  defaultValue="2025-11-07T10:00"
                  InputLabelProps={{ shrink: true }}
                />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Row 3 */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Category"
                  value="DR AP WS"
                />

                <TextField
                  fullWidth
                  size="small"
                  label="Delivery Date"
                  type="datetime-local"
                  defaultValue="2025-10-30T09:30"
                  InputLabelProps={{ shrink: true }}
                />
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Row 4 */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Delivered On"
                  type="datetime-local"
                  defaultValue="2025-11-15T20:32"
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Job Type</InputLabel>
                  <Select label="Job Type" value="Rework">
                    <MenuItem value="Rework">Rework</MenuItem>
                    <MenuItem value="New">New</MenuItem>
                  </Select>
                </FormControl>
            </Box>

            <Divider sx={{ my: 1 }} />

            {/* Row 5 */}
            <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Pulse Job ID"
                  value="306fbfb3-6d46-..."
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Invoice</InputLabel>
                  <Select label="Invoice" value="Non Billable">
                    <MenuItem value="Non Billable">Non Billable</MenuItem>
                    <MenuItem value="Billable">Billable</MenuItem>
                  </Select>
                </FormControl>
              </Box>


            {/* Full Width Fields */}
            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Job Instructions
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                placeholder="Enter Job Instructions..."
              />
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ mt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Reject Code</InputLabel>
                <Select label="Reject Code" value="FCO/Reference">
                  <MenuItem value="FCO/Reference">FCO/Reference</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Box sx={{ mt: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Rejection Reason
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value="Hello"
              />
            </Box>
          </AccordionDetails>
        </Accordion>

        {/* Instruction Accordion (also open by default) */}
        <Accordion
          expanded={instructionOpen}
          onChange={() => setInstructionOpen(!instructionOpen)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>Instruction</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Typography variant="body2" sx={{ textAlign: "justify" }}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat.
            </Typography>
          </AccordionDetails>
        </Accordion>

        {/* Checklists accordion (kept as an extra) */}
        <Accordion
          expanded={checklistOpen}
          onChange={() => setChecklistOpen(!checklistOpen)}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography sx={{ fontWeight: 600 }}>Checklists</Typography>
          </AccordionSummary>

          <AccordionDetails>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Overall look & Feel on White BG"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Hair Masking on White BG"
              />
              <FormControlLabel
                control={<Checkbox size="small" />}
                label="Color Consistency"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>

      {/* Fixed Bottom Button (stays visible) */}
      <Box
        sx={{
          borderTop: "1px solid #DDD",
          p: 1.5,
          bgcolor: "#fff",
        }}
      >
        <Button
          fullWidth
          variant="contained"
          sx={{
            backgroundColor: "#1E7D32",
            "&:hover": { backgroundColor: "#166527" },
          }}
        >
          Start Task
        </Button>
      </Box>
    </Box>
  );
};

export default DetailsSidebarPOC;
