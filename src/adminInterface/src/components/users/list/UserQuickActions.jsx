// src/components/users/list/UserQuickActions.jsx
import React, { useState } from 'react';
import {
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Tooltip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Block as BlockIcon,
    Lock as LockIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';
import { useNavigate } from 'react-router-dom';

const UserQuickActions = ({ user, onActionComplete }) => {
    const navigate = useNavigate();
    const { deleteUser } = useUser();
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleEdit = () => {
        navigate(`/admin/users/${user._id}`);
        handleClose();
    };

    const handleDelete = async () => {
        try {
            await deleteUser(user._id);
            onActionComplete();
        } catch (error) {
            console.error('Error deleting user:', error);
        }
        handleClose();
    };

    return (
        <>
            <Tooltip title="Azioni">
                <IconButton onClick={handleClick} size="small">
                    <MoreVertIcon />
                </IconButton>
            </Tooltip>

            <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleEdit}>
                    <ListItemIcon>
                        <EditIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Modifica</ListItemText>
                </MenuItem>

                <MenuItem onClick={handleDelete}>
                    <ListItemIcon>
                        <DeleteIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }}>
                        Elimina
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {user.status === 'active' ? 'Disattiva' : 'Attiva'}
                    </ListItemText>
                </MenuItem>

                <MenuItem onClick={handleClose}>
                    <ListItemIcon>
                        <LockIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reset Password</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
};

export default UserQuickActions;