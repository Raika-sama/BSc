// src/components/classes/classComponents/ClassColumns.js
import React from 'react';
import {
    Box,
    Typography,
    Chip,
    Tooltip
} from '@mui/material';
import { GridActionsCellItem } from '@mui/x-data-grid';
import {
    Delete as DeleteIcon,
    Visibility as VisibilityIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon
} from '@mui/icons-material';

export const createColumns = (handleViewDetails, handleTestManagement, handleDeleteClick) => [
    {
        field: 'schoolName',
        headerName: 'Scuola',
        flex: 1,
        minWidth: 180,
        renderCell: (params) => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SchoolIcon sx={{ fontSize: '1.1rem', color: 'primary.main' }} />
                <Typography variant="body2">{params.value}</Typography>
            </Box>
        )
    },
    {
        field: 'year',
        headerName: 'Anno',
        width: 80,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Chip
                label={`${params.value}°`}
                color="primary"
                size="small"
                sx={{
                    minWidth: '50px',
                    height: '24px',
                    backgroundColor: (theme) => theme.palette.primary.main,
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                        fontSize: '0.875rem',
                        px: 1
                    }
                }}
            />
        )
    },
    {
        field: 'section',
        headerName: 'Sezione',
        width: 90,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Chip
                label={params.value}
                color="secondary"
                size="small"
                sx={{
                    minWidth: '50px',
                    height: '24px',
                    backgroundColor: (theme) => theme.palette.secondary.main,
                    color: 'white',
                    fontWeight: 'bold',
                    '& .MuiChip-label': {
                        fontSize: '0.875rem',
                        px: 1
                    }
                }}
            />
        )
    },
    {
        field: 'academicYear',
        headerName: 'Anno Accademico',
        width: 130,
        align: 'center',
        headerAlign: 'center'
    },
    {
        field: 'status',
        headerName: 'Status',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            const status = params.value;
            const statusMap = {
                active: { color: 'success', label: 'Attiva' },
                planned: { color: 'info', label: 'Pianificata' },
                archived: { color: 'default', label: 'Archiviata' }
            };

            const { color, label } = statusMap[status] || { color: 'default', label: status };
            
            return (
                <Chip
                    label={label}
                    color={color}
                    size="small"
                    sx={{
                        minWidth: '90px',
                        height: '24px',
                        '& .MuiChip-label': {
                            fontSize: '0.75rem'
                        }
                    }}
                />
            );
        }
    },
    {
        field: 'isActive',
        headerName: 'Attiva',
        width: 120,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => (
            <Chip
                label={params.value ? 'Sì' : 'No'}
                color={params.value ? 'success' : 'error'}
                size="small"
                sx={{
                    minWidth: '60px',
                    height: '24px',
                    '& .MuiChip-label': {
                        fontSize: '0.75rem'
                    }
                }}
            />
        )
    },
    {
        field: 'studentCount',
        headerName: 'Studenti',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
            const count = params.row.students?.length || 0;
            const capacity = params.row.capacity || 0;
            const isFull = count >= capacity;
            const isEmpty = count === 0;

            return (
                <Tooltip title={`${count}/${capacity} studenti`}>
                    <Chip
                        icon={isEmpty ? 
                            <WarningIcon sx={{ fontSize: '1rem !important' }} /> :
                            isFull ? 
                            <CheckCircleIcon sx={{ fontSize: '1rem !important' }} /> :
                            <WarningIcon sx={{ fontSize: '1rem !important' }} />
                        }
                        label={isEmpty ? 'Vuota' : 
                               isFull ? 'Completa' : 
                               `${count}/${capacity}`}
                        color={isEmpty ? 'warning' : 
                               isFull ? 'success' : 
                               'primary'}
                        size="small"
                        sx={{
                            minWidth: '90px',
                            height: '24px',
                            '& .MuiChip-label': {
                                fontSize: '0.75rem',
                                px: 1
                            }
                        }}
                    />
                </Tooltip>
            );
        }
    },
    {
        field: 'actions',
        type: 'actions',
        headerName: 'Azioni',
        width: 150,
        getActions: (params) => [
            <GridActionsCellItem
                icon={
                    <Tooltip title="Visualizza dettagli">
                        <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                    </Tooltip>
                }
                label="Visualizza"
                onClick={() => handleViewDetails(params.row)}
            />,
            <GridActionsCellItem
                icon={
                    <Tooltip title="Gestione test">
                        <QuizIcon sx={{ fontSize: '1.1rem' }} />
                    </Tooltip>
                }
                label="Test"
                onClick={() => handleTestManagement(params.row)}
            />,
            <GridActionsCellItem
                icon={
                    <Tooltip title="Elimina classe">
                        <DeleteIcon sx={{ fontSize: '1.1rem', color: 'error.main' }} />
                    </Tooltip>
                }
                label="Elimina"
                onClick={() => handleDeleteClick(params.row)}
            />
        ]
    }
];

export default createColumns;