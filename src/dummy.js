{/* ======================================================
    HEADER — ALWAYS HERE BELOW PREVIEW
======================================================= */}
<Box
  sx={{
    position: "relative",
    marginTop: "60vh",    // ⭐ Push down below fixed preview
    zIndex: 300,
  }}
>
  {/* ===== HEADER ===== */}
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
      zIndex: 300,
      position: "sticky",
      top: "60vh",         // ⭐ Sticks exactly under preview
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
              background: !isStackView ? "#2680EB" : "#f5f5f5",
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
              background: isStackView ? "#2680EB" : "#f5f5f5",
            },
          }}
        >
          <img src={LayersLogo} style={{ width: "100%" }} />
        </IconButton>
      </Tooltip>
    </Box>

  {/* ======================================================
      STACK PANEL BELOW HEADER
  ======================================================= */}

  {isStackView && (
    <Box
      sx={{
        height: collapseStack ? 120 : "60%",
        overflowY: "auto",
        background: "#fff",
        boxShadow: "0px -6px 18px rgba(0,0,0,0.12)",
        zIndex: 200,
        px: 1,
        py: 1,
        transition: "height 0.25s ease-out",
        position: "relative",
      }}
    >
      {/* accordion unchanged */}
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
            "&:before": { display: "none" },
          }}
        >
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

          <AccordionDetails sx={{ px: 1, py: 1 }}>
            <Grid container spacing={1}>
              {items.map((t) => (
                <Grid item xs={3} sm={2} md={2} key={t.id}>
                  {/* unchanged */}
                </Grid>
              ))}
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  )}

  {!isStackView && (
    <Box
      ref={thumbStripRef}
      onWheel={handleWheel}
      sx={{
        position: "relative",
        px: 3,
        py: 1,
        height: 120,
        background: "#F9FBFC",
        userSelect: "none",
        overflowX: "auto",
        overflowY: "hidden",
        scrollbarWidth: "none",
        "&::-webkit-scrollbar": { display: "none" },
        zIndex: 200,
      }}
    >
      <Box sx={{ display: "flex", gap: 3 }}>
        {/* thumbs unchanged */}
      </Box>
    </Box>
  )}
</Box>
</Box>
