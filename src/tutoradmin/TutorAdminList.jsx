// src/tutoradmin/TutorAdminList.jsx

import React, { useState } from "react";
import {
  Box,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Alert,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";

const TutorAdminList = ({ tutors, onUpdateTutor, onDeleteTutor, error, success }) => {
  const [editingId, setEditingId] = useState(null);
  const [currentEditName, setCurrentEditName] = useState("");
  const [currentEditEmail, setCurrentEditEmail] = useState("");

  const startEditing = (tutor) => {
    setEditingId(tutor.id);
    setCurrentEditName(tutor.name);
    setCurrentEditEmail(tutor.email);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setCurrentEditName("");
    setCurrentEditEmail("");
  };

  const handleUpdate = (id) => {
    onUpdateTutor(id, { name: currentEditName, email: currentEditEmail });
    cancelEditing();
  };

  const handleToggleChange = (id, newIsApprovedStatus) => {
    onUpdateTutor(id, { isApproved: newIsApprovedStatus });
  };

  return (
    <Paper elevation={3} sx={{ padding: 4, borderRadius: '16px', backgroundColor: '#fff3e0' }}>
      <Typography variant="h6" fontWeight="bold" color="#37474f" sx={{ mb: 2 }}>
        Registered Tutors
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#e3f2fd' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Is Approved</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tutors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic' }}>No tutors registered yet.</TableCell>
              </TableRow>
            ) : (
              tutors.map((tutor) => (
                <TableRow key={tutor.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {editingId === tutor.id ? (
                      <TextField
                        value={currentEditName}
                        onChange={(e) => setCurrentEditName(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      tutor.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === tutor.id ? (
                      <TextField
                        value={currentEditEmail}
                        onChange={(e) => setCurrentEditEmail(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      tutor.email
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!tutor.isApproved}
                          onChange={(e) => handleToggleChange(tutor.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={!!tutor.isApproved ? "Approved" : "Not Approved"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {editingId === tutor.id ? (
                      <Box>
                        <IconButton color="primary" onClick={() => handleUpdate(tutor.id)}><SaveIcon /></IconButton>
                        <IconButton color="error" onClick={cancelEditing}><CancelIcon /></IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <IconButton color="info" onClick={() => startEditing(tutor)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => onDeleteTutor(tutor.id)}><DeleteIcon /></IconButton>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default TutorAdminList;