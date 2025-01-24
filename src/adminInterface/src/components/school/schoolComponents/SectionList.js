import React from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    Tooltip,
    Typography,
    Box
} from '@mui/material';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import GroupIcon from '@mui/icons-material/Group';

const SectionList = ({ 
    sections, 
    showInactive = false,
    onDeactivate,
    onReactivate 
}) => {
    console.log("SectionList props:", { 
        sections, 
        showInactive,
        sectionsLength: sections?.length 
    });

    // Modifichiamo il filtro per essere più esplicito
    const filteredSections = sections.filter(section => {
        console.log("Filtering section:", { 
            section,
            isActive: section.isActive,
            showInactive,
            willShow: showInactive ? true : section.isActive
        });
        return showInactive ? true : section.isActive;
    });

    console.log("Filtered sections:", {
        filteredSections,
        length: filteredSections.length
    });

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Sezione</TableCell>
                        <TableCell align="center">Stato</TableCell>
                        <TableCell align="center">Studenti</TableCell>
                        <TableCell align="center">Data Disattivazione</TableCell>
                        <TableCell align="right">Azioni</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                        {filteredSections.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} align="center">
                                <Typography color="textSecondary">
                                    {showInactive 
                                        ? 'Nessuna sezione presente'
                                        : 'Nessuna sezione attiva presente. Abilita "Mostra tutte le sezioni" per vedere le sezioni inattive.'}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        filteredSections.map((section) => (
                            <TableRow key={section.name}>
                                <TableCell>
                                    <Typography variant="body1" fontWeight="medium">
                                        {section.name}
                                    </Typography>
                                </TableCell>
                                <TableCell align="center">
                                    <Chip
                                        label={section.isActive ? 'Attiva' : 'Inattiva'}
                                        color={section.isActive ? 'success' : 'default'}
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
                                        <GroupIcon fontSize="small" color="action" />
                                        <Typography>
                                            {section.studentsCount || 0}
                                        </Typography>
                                    </Box>
                                </TableCell>
                                <TableCell align="center">
                                    {formatDate(section.deactivatedAt)}
                                </TableCell>
                                <TableCell align="right">
                                    {section.isActive ? (
                                        <Tooltip title="Disattiva sezione">
                                            <IconButton
                                                onClick={() => onDeactivate(section)}
                                                color="warning"
                                                disabled={section.studentsCount > 0}
                                            >
                                                <PowerSettingsNewIcon />
                                            </IconButton>
                                        </Tooltip>
                                    ) : (
                                        <Tooltip title="Riattiva sezione">
                                            <IconButton
                                                onClick={() => onReactivate(section)}
                                                color="success"
                                            >
                                                <PlayArrowIcon />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default SectionList;