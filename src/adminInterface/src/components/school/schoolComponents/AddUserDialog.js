// AddUserDialog.js
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    MenuItem
} from '@mui/material';

const AddUserDialog = ({ open, onClose, onConfirm }) => {
    const [userData, setUserData] = useState({
        email: '',
        role: 'teacher'
    });

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Aggiungi Utente</DialogTitle>
            <DialogContent>
                <TextField
                    fullWidth
                    label="Email"
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    sx={{ mb: 2, mt: 1 }}
                />
                <TextField
                    select
                    fullWidth
                    label="Ruolo"
                    value={userData.role}
                    onChange={(e) => setUserData({ ...userData, role: e.target.value })}
                >
                    <MenuItem value="teacher">Insegnante</MenuItem>
                    <MenuItem value="admin">Amministratore</MenuItem>
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annulla</Button>
                <Button 
                    onClick={() => onConfirm(userData)}
                    variant="contained"
                >
                    Aggiungi
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { AddUserDialog };