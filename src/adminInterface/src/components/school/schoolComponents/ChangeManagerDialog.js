// ChangeManagerDialog.js
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

const ChangeManagerDialog = ({ open, onClose, onConfirm, currentUsers }) => {
    const [selectedUserId, setSelectedUserId] = useState('');

    return (
        <Dialog open={open} onClose={onClose}>
            <DialogTitle>Cambia Manager</DialogTitle>
            <DialogContent>
                <TextField
                    select
                    fullWidth
                    label="Seleziona nuovo manager"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    {currentUsers.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName}
                        </MenuItem>
                    ))}
                </TextField>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Annulla</Button>
                <Button 
                    onClick={() => onConfirm(selectedUserId)}
                    variant="contained"
                >
                    Conferma
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export { ChangeManagerDialog };