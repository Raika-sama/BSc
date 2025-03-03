// src/components/users/list/InactiveUsersToggle.jsx
import React from 'react';
import { 
    Box, 
    FormControlLabel, 
    Switch, 
    Typography,
    Tooltip,
    alpha,
    Chip
} from '@mui/material';
import { 
    VisibilityOff as HideIcon, 
    Visibility as ShowIcon,
    CheckCircle as ActiveIcon,
    Block as InactiveIcon
} from '@mui/icons-material';

const InactiveUsersToggle = ({ showInactive, onChange }) => {
    console.log("Rendering toggle with showInactive:", showInactive);
    
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                alignItems: 'center',
                bgcolor: theme => alpha(theme.palette.background.paper, 0.6),
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                px: 2,
                py: 0.5,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: theme => showInactive 
                        ? theme.palette.primary.main 
                        : theme.palette.success.main,
                    transition: 'all 0.3s ease'
                }
            }}
        >
            <Tooltip title={showInactive ? "Nascondi utenti inattivi" : "Mostra anche utenti inattivi"}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={showInactive}
                                onChange={(e) => {
                                    console.log("Toggle cambiato:", e.target.checked);
                                    onChange(e.target.checked);
                                }}
                                color="primary"
                                size="small"
                            />
                            
                        }
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {showInactive ? (
                                    <ShowIcon fontSize="small" color="primary" />
                                ) : (
                                    <HideIcon fontSize="small" color="success" />
                                )}
                                <Typography variant="body2" fontWeight="medium">
                                    {showInactive ? "Tutti gli utenti" : "Solo utenti attivi"}
                                </Typography>
                            </Box>
                        }
                        
                    />
                    
                    
                </Box>
            </Tooltip>
        </Box>
    );
};

export default InactiveUsersToggle;