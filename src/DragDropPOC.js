import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Typography,
  Checkbox,
  IconButton,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckBoxOutlineBlankIcon from "@mui/icons-material/CheckBoxOutlineBlank";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Switch from "@mui/material/Switch";

import ViewLogo from "./assets/logos/view-logo.png";
import LayersLogo from "./assets/logos/layers-logo.png";
import PsLogo from "./assets/logos/Ps-logo.png";
import BrLogo from "./assets/logos/Br-logo.png";

import { jobImageMapping } from "./jobImageMapping";

const DragDropPOC = ({ jobData }) => {
  const jobId = jobData?.pulse_job_id || "POC123";
  const mapping = jobImageMapping[jobId];

  // Build the initial thumbs list from mapping file
  const buildThumbs = () => {
    if (!mapping) return [];

    return [
      {
        ...mapping.jobFile,
        isSource: true,
      },
      ...mapping.references.map((r) => ({ ...r, isSource: false })),
      ...mapping.deliverables.map((d) => ({ ...d, isSource: false })),
    ];
  };

  // MAIN STATE
  const [allThumbs] = useState(buildThumbs);
  const [thumbs, setThumbs] = useState(buildThumbs);

  const [checked, setChecked] = useState([]);
  const [sideBySideRef, setSideBySideRef] = useState(null);

  const viewRef = useRef(null);
  const dragItemRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const thumbStripRef = useRef(null);

  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All files");

  const [isStackView, setIsStackView] = useState(false);
  const [collapseStack, setCollapseStack] = useState(false);

  const fileFilters = [
    "All files",
    "Job Files",
    "References",
    "Deliverables",
    "Extras",
  ];

  // preview tracking (default to job file)
  const initialPreview = allThumbs.find((t) => t.isSource)?.id ?? null;
  const [previewId, setPreviewId] = useState(initialPreview);

  // For stack view accordions: controlled open state per type
  const [accordionsOpen, setAccordionsOpen] = useState({
    job: true,
    reference: true,
    deliverable: true,
  });

  // Keep previewThumb lookup function after previewId defined
  const getThumbById = (id) => allThumbs.find((t) => t.id === id);
  const previewThumb = getThumbById(previewId);

  // keep drag/drop logic identical to before
  const toggleCheck = (id) =>
    setChecked((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : [...p, id]
    );

  const isAllChecked = () =>
    thumbs.length > 0 && thumbs.every((t) => checked.includes(t.id));

  const handleSelectAll = () => {
    if (isAllChecked()) setChecked([]);
    else setChecked(thumbs.map((t) => t.id));
  };

  const onDragStart = (e, thumb) => {
    dragItemRef.current = thumb;
    e.dataTransfer.setData("text/plain", thumb.id);
  };

  const onDragEnd = () => {
    dragItemRef.current = null;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = (e) => {
    if (viewRef.current && !viewRef.current.contains(e.relatedTarget)) {
      setIsDragOver(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const dragged = dragItemRef.current;
    if (!dragged) return;

    const rect = viewRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const isRight = x > rect.width / 2;

    // SIDE-BY-SIDE logic retained
    if (sideBySideRef) {
      if (isRight) {
        // drop on right → replace right
        setSideBySideRef(dragged.id);
      } else {
        // drop on left → replace preview
        setPreviewId(dragged.id);
      }
      // setClickedFull(null);
      dragItemRef.current = null;
      return;
    }

    // No side-by-side: open side-by-side with dragged and preview
    if (isRight) {
      setSideBySideRef(dragged.id);
    } else {
      setSideBySideRef(previewId);
      setPreviewId(dragged.id);
    }

    // setClickedFull(null);
    dragItemRef.current = null;
  };

  const onThumbClick = (thumb) => {
    setSideBySideRef(null);
    setPreviewId(thumb.id);
  };

  // horizontal wheel -> scroll thumbnails (only used in carousel)
  const handleWheel = (e) => {
    if (!thumbStripRef.current) return;
    e.preventDefault();
    thumbStripRef.current.scrollLeft += e.deltaY;
  };

  // Filter apply logic — when filter changes, update thumbs and accordion open state
  const applyFilter = (filter) => {
    setSelectedFilter(filter);

    // Stack View always shows ALL
    if (isStackView) {
      setThumbs(allThumbs);
      setAccordionsOpen({
        job: true,
        reference: true,
        deliverable: true,
        extra: true, // 👈 add this also
      });
      return;
    }

    // Filmstrip filtering
    if (filter === "All files") {
      setThumbs(allThumbs);
      return;
    }

    if (filter === "Job Files") {
      setThumbs(allThumbs.filter((x) => x.type === "job"));
      return;
    }

    if (filter === "References") {
      setThumbs(allThumbs.filter((x) => x.type === "reference"));
      return;
    }

    if (filter === "Deliverables") {
      setThumbs(allThumbs.filter((x) => x.type === "deliverable"));
      return;
    }

    if (filter === "Extras") {
      setThumbs(allThumbs.filter((x) => x.type === "extra"));
      return;
    }
  };

  // When switching to Stack View → open ALL accordions
  useEffect(() => {
    if (isStackView) {
      setAccordionsOpen({
        job: true,
        reference: true,
        deliverable: true,
        extra: true,
      });
    }
  }, [isStackView]);

  // When user clicks an accordion header: in stack view we want single-open behavior except when filter = All files
  const handleAccordionToggle = (key) => (event, isExpanded) => {
    if (selectedFilter === "All files") {
      // Allow independent toggles when "All files"
      setAccordionsOpen((prev) => ({ ...prev, [key]: isExpanded }));
    } else {
      // Single-open behavior
      if (isExpanded) {
        setAccordionsOpen({
          job: key === "job",
          reference: key === "reference",
          deliverable: key === "deliverable",
          extra: key === "extra", // ✅ added
        });
      } else {
        // collapse all
        setAccordionsOpen({
          job: false,
          reference: false,
          deliverable: false,
          extra: false, // ✅ added
        });
      }
    }
  };

  // small checkbox style without outer white square
  const renderSmallCheckbox = (id) => (
    <Checkbox
      checked={checked.includes(id)}
      onClick={(e) => {
        e.stopPropagation();
        toggleCheck(id);
      }}
      icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 14 }} />}
      checkedIcon={<CheckBoxIcon sx={{ fontSize: 14, color: "#2680EB" }} />}
      sx={{
        position: "absolute",
        top: 4,
        right: 4,
        p: 0,
        minWidth: 0,
        width: 18,
        height: 18,
        zIndex: 20,
      }}
    />
  );

  // helper to split thumbnails by type for stack view
  const thumbsByType = {
    job: allThumbs.filter((t) => t.type === "job"),
    reference: allThumbs.filter((t) => t.type === "reference"),
    deliverable: allThumbs.filter((t) => t.type === "deliverable"),
    extra: allThumbs.filter((t) => t.type === "extra"), // 👈 add this
  };

  // ------------------------------
  // ACCORDION SELECT / UNSELECT ALL
  // ------------------------------
  const isAccordionChecked = (type) => {
    return thumbsByType[type].every((t) => checked.includes(t.id));
  };

  const toggleAccordionCheck = (type) => {
    const list = thumbsByType[type].map((t) => t.id);

    if (isAccordionChecked(type)) {
      // uncheck all
      setChecked((prev) => prev.filter((id) => !list.includes(id)));
    } else {
      // check all inside accordion
      setChecked((prev) => [...new Set([...prev, ...list])]);
    }
  };

  // Build dynamic accordion config
  const accordionConfig = Object.entries({
    job: "Job Files",
    reference: "References",
    deliverable: "Deliverables",
    extra: "Extra Files", // ⭐ now SAFE
  }).map(([key, label]) => ({
    key,
    label,
    items: thumbsByType[key], // always exists
  }));

  const getFilteredCount = () => {
    if (selectedFilter === "All files") return allThumbs.length;
    if (selectedFilter === "Job Files")
      return allThumbs.filter((t) => t.type === "job").length;
    if (selectedFilter === "References")
      return allThumbs.filter((t) => t.type === "reference").length;
    if (selectedFilter === "Deliverables")
      return allThumbs.filter((t) => t.type === "deliverable").length;
    if (selectedFilter === "Extras")
      return allThumbs.filter((t) => t.type === "extra").length;
    return 0;
  };

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative", // <--- important: holds absolute bottom panel
        overflow: "hidden",
      }}
    >
      {/* ======================================================
        PREVIEW AREA (unchanged full-height section)
    ======================================================= */}
      <Box
        ref={viewRef}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        sx={{
          flex: 1,
          display: "flex",
          p: 2,
          background: "#F9FBFC",
          position: "absolute",
          bottom: "160px",
          top: 0,
          right: 0,
          left: 0,
          overflow: "hidden",
          border: isDragOver ? "2px dashed #5465FF" : "2px dashed transparent",
          backgroundColor: isDragOver ? "#5465FF10" : "#F9FBFC",
          transition: "0.15s",
          justifyContent: "center", // ✅ FIX
          gap: 2, // 👍 Optional: adds spacing between the two images
        }}
      >
        {/* dashed preview drop divider */}
        {isDragOver && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 0,
              borderLeft: "2px dashed #5465FF",
              zIndex: 10,
            }}
          />
        )}

        {/* SIDE-BY-SIDE VIEW */}
        {sideBySideRef && (
          <>
            {/* LEFT */}
            {/* LEFT IMAGE */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={previewThumb?.src}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />

                {/* LABEL ALWAYS INSIDE IMAGE */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    background: "#ffffffdd",
                    padding: "4px 10px",
                    borderRadius: "10px",
                    color: "#1a73e8",
                    fontWeight: 600,
                  }}
                >
                  {previewThumb?.name}
                </Box>
              </Box>
            </Box>

            {/* RIGHT IMAGE */}
            <Box
              sx={{
                flex: 1,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                p: 2,
              }}
            >
              <Box
                sx={{
                  position: "relative",
                  maxWidth: "100%",
                  maxHeight: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={getThumbById(sideBySideRef)?.src}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "100%",
                    objectFit: "contain",
                    display: "block",
                  }}
                />

                {/* LABEL ALWAYS INSIDE IMAGE */}
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    background: "#ffffffdd",
                    padding: "4px 10px",
                    borderRadius: "10px",
                    color: "#1a73e8",
                    fontWeight: 600,
                  }}
                >
                  {getThumbById(sideBySideRef)?.name}
                </Box>
              </Box>
            </Box>
          </>
        )}

        {/* SINGLE VIEW */}
        {!sideBySideRef && previewThumb && (
          <Box
            sx={{
              position: "relative",
              maxWidth: "100%",
              maxHeight: "100%",
              width: "auto",
              height: "auto",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={previewThumb.src}
              alt={previewThumb.name}
              style={{
                maxWidth: "100%",
                maxHeight: "100%",
                objectFit: "contain",
                display: "block",
              }}
            />

            {/* LABEL INSIDE IMAGE */}
            <Box
              sx={{
                position: "absolute",
                bottom: 12,
                left: 12,
                background: "#ffffffdd",
                padding: "4px 10px",
                borderRadius: "10px",
                fontSize: 14,
                color: "#1a73e8",
                fontWeight: 600,
                backdropFilter: "blur(4px)",
                zIndex: 5,
                pointerEvents: "none",
              }}
            >
              {previewThumb.name}
            </Box>
          </Box>
        )}
      </Box>

      {/* ======================================================
        HEADER — ALWAYS HERE BELOW PREVIEW
    ======================================================= */}
      <Box
        sx={{
          height: 48,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid #D9DADB",
          borderBottom: "1px solid #D9DADB",
          px: 3,
          background: "#fff",

          position: "absolute",
          left: 0,
          right: 0,

          // ⭐ THIS IS THE MAGIC:
          bottom: isStackView ? (collapseStack ? 120 : "60%") : 120,

          zIndex: 999,
        }}
      >
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          {isStackView
            ? `All Related Files (${getFilteredCount()})`
            : `${selectedFilter} (${getFilteredCount()})`}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Checkbox
            checked={isAllChecked()}
            onChange={handleSelectAll}
            icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 16 }} />}
            checkedIcon={
              <CheckBoxIcon sx={{ fontSize: 16, color: "#2680EB" }} />
            }
          />

          <Typography sx={{ fontSize: 12 }}>Select All</Typography>

          <IconButton sx={{ width: 22, height: 22, p: 0 }}>
            <img src={PsLogo} style={{ width: "100%" }} />
          </IconButton>

          <IconButton sx={{ width: 22, height: 22, p: 0 }}>
            <img src={BrLogo} style={{ width: "100%" }} />
          </IconButton>

          {!isStackView ? (
            <Box>
              <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                  border: "1px solid #ccc",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  fontSize: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  minWidth: 130,
                  cursor: "pointer",
                }}
              >
                {selectedFilter}
                <span style={{ fontSize: 10 }}>▼</span>
              </Box>

              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}
              >
                {fileFilters.map((item) => (
                  <MenuItem
                    key={item}
                    onClick={() => {
                      applyFilter(item);
                      setAnchorEl(null);
                    }}
                  >
                    {item}
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          ) : (
            // WHEN IN STACK VIEW → SHOW COLLAPSE STACK TOGGLE
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Switch
                size="small"
                checked={collapseStack}
                onChange={(e) => setCollapseStack(e.target.checked)}
              />

              <Typography sx={{ fontSize: 12 }}>Collapse</Typography>
            </Box>
          )}

          <Tooltip title="Filmstrip view">
            <IconButton
              onClick={() => setIsStackView(false)}
              sx={{
                width: 28,
                height: 28,
                p: 0,
                background: !isStackView ? "#2680EB" : "transparent",
                border: "1px solid #ccc",
                borderRadius: "6px",
                "&:hover": {
                  background: !isStackView ? "#2680EB" : "#f5f5f5", // KEEP BLUE WHEN ACTIVE
                },
              }}
            >
              <img src={ViewLogo} style={{ width: "100%" }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Stack view">
            <IconButton
              onClick={() => setIsStackView(true)}
              sx={{
                width: 28,
                height: 28,
                p: 0,
                background: isStackView ? "#2680EB" : "transparent",
                border: "1px solid #ccc",
                borderRadius: "6px",
                "&:hover": {
                  background: isStackView ? "#2680EB" : "#f5f5f5", // KEEP BLUE WHEN ACTIVE
                },
              }}
            >
              <img src={LayersLogo} style={{ width: "100%" }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* ======================================================
        STACK PANEL BELOW HEADER
    ======================================================= */}
      {/* ======================================================
      STACK VIEW — COMPACT LAYOUT (NO ACCORDION)
======================================================= */}
      {isStackView && (
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: collapseStack ? 120 : "60%",
            background: "#fff",
            overflowY: "auto",

            transition: "height 0.25s ease-out, bottom 0.25s ease-out", // ⭐ Sync speed

            zIndex: 20,
            boxShadow: "0px -2px 10px rgba(0,0,0,0.1)",
          }}
        >
          {accordionConfig.map(({ key, label, items }) => (
            <Accordion
              key={key}
              expanded={!!accordionsOpen[key]}
              onChange={handleAccordionToggle(key)}
              disableGutters
              elevation={0}
              square
              sx={{
                mb: 1,
                "&:before": { display: "none" }, // remove MUI divider line
              }}
            >
              {/* ====== MINIMAL HEADER ====== */}
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: 18 }} />}
                sx={{
                  minHeight: "unset !important",
                  px: 1,
                  py: 0.5,
                  "& .MuiAccordionSummary-content": {
                    margin: 0,
                    alignItems: "center",
                    gap: 1,
                  },
                  borderBottom: "1px solid #E0E0E0",
                }}
              >
                <Checkbox
                  checked={
                    items.length > 0 &&
                    items.every((t) => checked.includes(t.id))
                  }
                  disabled={items.length === 0}
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordionCheck(key);
                  }}
                  sx={{
                    p: 0,
                    "& .MuiSvgIcon-root": { fontSize: 18 },
                  }}
                />

                <Typography sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                  {label} ({items.length})
                </Typography>
              </AccordionSummary>

              {/* ====== MINIMAL CONTENT ====== */}
              <AccordionDetails sx={{ px: 1, py: 1 }}>
                <Grid container spacing={1}>
                  {items.map((t) => (
                    <Grid item xs={3} sm={2} md={2} key={t.id}>
                      <Box
                        draggable
                        onDragStart={(e) => onDragStart(e, t)}
                        onDragEnd={onDragEnd}
                        onClick={() => onThumbClick(t)}
                        sx={{
                          width: 100, // 🔥 UPDATED
                          borderRadius: 1,
                          overflow: "hidden",
                          position: "relative",
                          cursor: "grab",
                          border: checked.includes(t.id)
                            ? "2px solid #5465FF"
                            : "1px solid #ccc",
                          background: "#fff",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {/* IMAGE */}
                        <Box
                          sx={{
                            width: "100%",
                            height: 100, // 🔥 UPDATED
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          <img
                            src={t.src}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              display: "block",
                            }}
                          />

                          {renderSmallCheckbox(t.id)}
                        </Box>

                        {/* LABEL (UNCHANGED — stays below image) */}
                        <Box
                          sx={{
                            width: "100%",
                            background: "#f9f9faff",
                            padding: "4px 6px",
                            textAlign: "left",
                            fontSize: 11,
                            color: "#000",
                            fontWeight: 500,
                            borderTop: "1px solid #ccc",
                          }}
                        >
                          {t.name}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}

      {/* ======================================================
        CAROUSEL WHEN STACK VIEW IS OFF
    ======================================================= */}
      {!isStackView && (
        <Box
          ref={thumbStripRef}
          onWheel={handleWheel}
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 120,
            background: "#F9FBFC",
            userSelect: "none",
            overflowX: "auto",
            overflowY: "hidden",
            px: 3,
            py: 1,
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: "none" },
            zIndex: 20, // lower than header so header remains visible
          }}
        >
          <Box sx={{ display: "flex", gap: 3, p: 2 }}>
            {thumbs.map((thumb) => (
              <Box key={thumb.id} sx={{ minWidth: 90 }}>
                <Box
                  draggable
                  onDragStart={(e) => onDragStart(e, thumb)}
                  onDragEnd={onDragEnd}
                  onClick={() => onThumbClick(thumb)}
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 1,
                    overflow: "hidden",
                    position: "relative",
                    cursor: "grab",
                    border: checked.includes(thumb.id)
                      ? "2px solid #5465FF"
                      : "2px solid transparent",
                    background: "#fff",
                  }}
                >
                  <img
                    src={thumb.src}
                    alt={thumb.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />

                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 4,
                      left: 4,
                      background: "#ffffffcc",
                      px: 1,
                      py: "1px",
                      borderRadius: "8px",
                      fontSize: 10,
                      color: "#1a73e8",
                      fontWeight: 500,
                    }}
                  >
                    {thumb.name}
                  </Box>

                  <Checkbox
                    checked={checked.includes(thumb.id)}
                    onClick={(e) => {
                      e.stopPropagation(); // stops parent click
                      toggleCheck(thumb.id);
                    }}
                    icon={<CheckBoxOutlineBlankIcon sx={{ fontSize: 14 }} />}
                    checkedIcon={
                      <CheckBoxIcon sx={{ fontSize: 14, color: "#2680EB" }} />
                    }
                    sx={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      p: 0,
                      minWidth: 0,
                      width: 18,
                      height: 18,
                      zIndex: 20,
                    }}
                  />
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default DragDropPOC;
