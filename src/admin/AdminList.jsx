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
import { useAuth } from '../AuthContext'; 

const AdminList = ({ admins, onUpdateAdmin, onDeleteAdmin, error, success }) => {
  const [editingId, setEditingId] = useState(null);
  const [currentEditName, setCurrentEditName] = useState("");
  const [currentEditEmail, setCurrentEditEmail] = useState("");

  const startEditing = (admin) => {
    setEditingId(admin.id);
    setCurrentEditName(admin.name);
    setCurrentEditEmail(admin.email);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setCurrentEditName("");
    setCurrentEditEmail("");
  };

  const handleUpdate = (id) => {
    onUpdateAdmin(id, { name: currentEditName, email: currentEditEmail });
    cancelEditing();
  };

  const handleToggleChange = (id, newIsApprovedStatus) => {
    onUpdateAdmin(id, { isApproved: newIsApprovedStatus });
  };

  return (
    <Paper elevation={3} sx={{ padding: 4, borderRadius: '16px', backgroundColor: '#fff3e0' }}>
      <Typography variant="h6" fontWeight="bold" color="#37474f" sx={{ mb: 2 }}>
        Registered Admins
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      <TableContainer>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ backgroundColor: '#f0f4c3' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Is Approved</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ fontStyle: 'italic' }}>No admins registered yet.</TableCell>
              </TableRow>
            ) : (
              admins.map((admin) => (
                <TableRow key={admin.id} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell component="th" scope="row">
                    {editingId === admin.id ? (
                      <TextField
                        value={currentEditName}
                        onChange={(e) => setCurrentEditName(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      admin.name
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === admin.id ? (
                      <TextField
                        value={currentEditEmail}
                        onChange={(e) => setCurrentEditEmail(e.target.value)}
                        variant="outlined"
                        size="small"
                      />
                    ) : (
                      admin.email
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={!!admin.isApproved}
                          onChange={(e) => handleToggleChange(admin.id, e.target.checked)}
                          color="primary"
                        />
                      }
                      label={!!admin.isApproved ? "Approved" : "Not Approved"}
                    />
                  </TableCell>
                  <TableCell align="center">
                    {editingId === admin.id ? (
                      <Box>
                        <IconButton color="primary" onClick={() => handleUpdate(admin.id)}><SaveIcon /></IconButton>
                        <IconButton color="error" onClick={cancelEditing}><CancelIcon /></IconButton>
                      </Box>
                    ) : (
                      <Box>
                        <IconButton color="info" onClick={() => startEditing(admin)}><EditIcon /></IconButton>
                        <IconButton color="error" onClick={() => onDeleteAdmin(admin.id)}><DeleteIcon /></IconButton>
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

export default AdminList;