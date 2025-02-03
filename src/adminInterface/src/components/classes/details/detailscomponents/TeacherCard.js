// src/components/classes/details/detailscomponents/TeacherCard.js
import React from 'react';
import {
    Paper,
    Box,
    Typography,
    IconButton,
    Tooltip,
    Chip,
    Avatar
} from '@mui/material';
import {
    Delete as DeleteIcon,
    Edit as EditIcon,
    Star as StarIcon
} from '@mui/icons-material';

const TeacherCard = ({ teacher, isMain = false, onEdit, onRemove }) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 2,
                border: '1px solid',
                borderColor: theme => isMain ? theme.palette.primary.main : 'divider',
                borderRadius: 2,
                position: 'relative',
                '&:hover': {
                    borderColor: theme => isMain ? theme.palette.primary.main : theme.palette.primary.light,
                    bgcolor: 'background.paper',
                    boxShadow: 1
                }
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                    sx={{
                        bgcolor: theme => isMain ? theme.palette.primary.main : theme.palette.grey[300],
                        color: theme => isMain ? 'white' : 'text.primary'
                    }}
                >
                    {teacher.firstName[0]}{teacher.lastName[0]}
                </Avatar>

                <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {teacher.firstName} {teacher.lastName}
                        </Typography>
                        {isMain && (
                            <Tooltip title="Docente Principale">
                                <StarIcon sx={{ color: 'primary.main', fontSize: '1rem' }} />
                            </Tooltip>
                        )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                        {teacher.email}
                    </Typography>
                    <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                        <Chip
                            label={teacher.role || 'Docente'}
                            size="small"
                            color={isMain ? "primary" : "default"}
                            variant={isMain ? "filled" : "outlined"}
                        />
                        {teacher.subjects?.map((subject, index) => (
                            <Chip
                                key={index}
                                label={subject}
                                size="small"
                                variant="outlined"
                            />
                        ))}
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Modifica">
                        <IconButton
                            size="small"
                            onClick={() => onEdit?.(teacher)}
                            sx={{ color: 'action.active' }}
                        >
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={`Rimuovi ${isMain ? 'docente principale' : 'docente'}`}>
                        <IconButton
                            size="small"
                            onClick={() => onRemove?.(teacher)}
                            sx={{ 
                                color: 'error.main',
                                '&:hover': {
                                    bgcolor: 'error.lighter'
                                }
                            }}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>
        </Paper>
    );
};

export default TeacherCard;