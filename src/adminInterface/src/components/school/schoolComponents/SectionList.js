import React, { useMemo } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { motion } from 'framer-motion';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GroupIcon from '@mui/icons-material/Group';
import { IconButton, Chip, Tooltip } from '@mui/material';

const SectionList = ({ sections = [], showInactive = false, onDeactivate, onReactivate }) => {
    const columns = [
        {
            field: 'name',
            headerName: 'Sezione',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Box sx={{ fontWeight: 500 }}>
                    {params.value}
                </Box>
            ),
        },
        {
            field: 'isActive',
            headerName: 'Stato',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Chip
                    label={params.value ? 'Attiva' : 'Inattiva'}
                    color={params.value ? 'success' : 'default'}
                    size="small"
                />
            ),
        },
        {
            field: 'studentsCount',
            headerName: 'Studenti',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => (
                <Box display="flex" alignItems="center" gap={1}>
                    <GroupIcon fontSize="small" color="action" />
                    {params.value || 0}
                </Box>
            ),
        },
        {
            field: 'deactivatedAt',
            headerName: 'Data Disattivazione',
            flex: 1,
            minWidth: 150,
            valueFormatter: (params) => {
                if (!params.value) return '-';
                return new Date(params.value).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            },
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            flex: 1,
            minWidth: 100,
            sortable: false,
            renderCell: (params) => (
                params.row.isActive ? (
                    <Tooltip title="Disattiva sezione">
                        <IconButton
                            onClick={() => onDeactivate(params.row)}
                            color="warning"
                            size="small"
                        >
                            <PowerSettingsNewIcon />
                        </IconButton>
                    </Tooltip>
                ) : (
                    <Tooltip title="Riattiva sezione">
                        <IconButton
                            onClick={() => onReactivate(params.row)}
                            color="success"
                            size="small"
                        >
                            <PlayArrowIcon />
                        </IconButton>
                    </Tooltip>
                )
            ),
        },
    ];

    const filteredSections = useMemo(() => {
        return sections.filter(section => showInactive ? true : section.isActive)
            .map(section => ({
                id: section.name, // Necessario per DataGrid
                ...section
            }));
    }, [sections, showInactive]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{ width: '100%', height: 400 }}
        >
            <DataGrid
                rows={filteredSections}
                columns={columns}
                pageSize={5}
                rowsPerPageOptions={[5, 10, 25]}
                disableSelectionOnClick
                density="comfortable"
                autoHeight
                sx={{
                    '& .MuiDataGrid-cell': {
                        fontSize: '0.875rem',
                        py: 1
                    },
                    '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        fontSize: '0.875rem'
                    },
                    '& .MuiDataGrid-row': {
                        '&:nth-of-type(odd)': {
                            backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        }
                    }
                }}
            />
        </motion.div>
    );
};

export default React.memo(SectionList);