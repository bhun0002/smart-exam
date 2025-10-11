import React from "react";
import { Box, Button, Typography } from "@mui/material";

export default function PaginationBar({ page, totalPages, onPrev, onNext }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
      <Button variant="outlined" disabled={page === 1} onClick={onPrev} sx={{ borderRadius: "12px" }}>
        Previous
      </Button>
      <Typography>Page {page} of {totalPages || 1}</Typography>
      <Button
        variant="outlined"
        disabled={page === totalPages || totalPages === 0}
        onClick={onNext}
        sx={{ borderRadius: "12px" }}
      >
        Next
      </Button>
    </Box>
  );
}
