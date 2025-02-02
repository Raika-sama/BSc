// src/components/users/details/UserPermissions.jsx
import React, { useState } from 'react';
import {
    Box,
    Paper,
    FormControlLabel,
    Checkbox,
    Typography,
    Button,
    Alert,
    Divider,
    Grid
} from '@mui/material';
import { useUser } from '../../../context/UserContext';

const PERMISSION_GROUPS = {
    users: ['users:read', 'users:write'],
    schools: ['schools:read', 'schools:write'],
    classes: ['classes:read', 'classes:write'],
    tests: ['tests:read', 'tests:write'],
    results: ['results:read', 'results:write']
};

const UserPermissions = ({ userData, onUpdate }) => {
    const { updateUser } = useUser();
    const [permissions, setPermissions] = useState(userData.permissions || []);
    const [error, setError] = useState(null);

    const handlePermissionChange = (permission) => {
        setPermissions(prev => {
            if (prev.includes(permission)) {
                return prev.filter(p => p !== permission);
            }
            return [...prev, permission];
        });
    };

    const handleGroupChange = (group, checked) => {
        const groupPermissions = PERMISSION_GROUPS[group];
        setPermissions(prev => {
            if (checked) {
                return [...new Set([...prev, ...groupPermissions])];
            }
            return prev.filter(p => !groupPermissions.includes(p));
        });
    };

    const isGroupChecked = (group) => {
        const groupPermissions = PERMISSION_GROUPS[group];
        return groupPermissions.every(p => permissions.includes(p));
    };

    const isGroupIndeterminate = (group) => {
        const groupPermissions = PERMISSION_GROUPS[group];
        const checkedCount = groupPermissions.filter(p => permissions.includes(p)).length;
        return checkedCount > 0 && checkedCount < groupPermissions.length;
    };

    const handleSave = async () => {
        try {
            await updateUser(userData._id, { permissions });
            onUpdate();
            setError(null);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 3 }}>
                Gestione Permessi
            </Typography>

            <Grid container spacing={3}>
                {Object.entries(PERMISSION_GROUPS).map(([group, groupPermissions]) => (
                    <Grid item xs={12} md={6} key={group}>
                        <Paper sx={{ p: 2 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={isGroupChecked(group)}
                                        indeterminate={isGroupIndeterminate(group)}
                                        onChange={(e) => handleGroupChange(group, e.target.checked)}
                                    />
                                }
                                label={group.charAt(0).toUpperCase() + group.slice(1)}
                            />
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ pl: 2 }}>
                                {groupPermissions.map(permission => (
                                    <FormControlLabel
                                        key={permission}
                                        control={
                                            <Checkbox
                                                size="small"
                                                checked={permissions.includes(permission)}
                                                onChange={() => handlePermissionChange(permission)}
                                            />
                                        }
                                        label={
                                            <Typography variant="body2">
                                                {permission.split(':')[1] === 'read' ? 'Lettura' : 'Scrittura'}
                                            </Typography>
                                        }
                                    />
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                ))}
            </Grid>

            <Box sx={{ mt: 3 }}>
                <Button
                    variant="contained"
                    onClick={handleSave}
                >
                    Salva Permessi
                </Button>
            </Box>
        </Box>
    );
};

export default UserPermissions;