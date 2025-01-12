// src/components/school/SchoolList.js
import React, { useState } from 'react';
import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    IconButton,
    Typography,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Box,
    CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PersonIcon from '@mui/icons-material/Person';
import { useNavigate } from 'react-router-dom';

const SchoolList = ({ 
    schools, 
    loading, 
    onDelete,
    totalSchools // Non serve più il TablePagination locale perché la paginazione è gestita dal parent
}) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [schoolToDelete, setSchoolToDelete] = useState(null);
    const navigate = useNavigate();

    const handleDeleteClick = (school) => {
        setSchoolToDelete(school);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (schoolToDelete) {
            try {
                await onDelete(schoolToDelete._id);
                setDeleteDialogOpen(false);
                setSchoolToDelete(null);
            } catch (error) {
                console.error('Error deleting school:', error);
            }
        }
    };

    const getSchoolTypeLabel = (type) => ({
        'middle_school': 'Scuola Media',
        'high_school': 'Scuola Superiore'
    }[type] || type);

    const getInstitutionTypeLabel = (type) => ({
        'none': 'Nessuno',
        'scientific': 'Scientifico',
        'classical': 'Classico',
        'artistic': 'Artistico'
    }[type] || type);

    const handleViewDetails = (schoolId) => {
        navigate(`/admin/schools/${schoolId}`);
    };

    return (
        <>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Nome</TableCell>
                            <TableCell>Tipo</TableCell>
                            <TableCell>Indirizzo</TableCell>
                            <TableCell>Regione</TableCell>
                            <TableCell>Provincia</TableCell>
                            <TableCell>Sezioni</TableCell>
                            <TableCell>Manager</TableCell>
                            <TableCell align="center">Stato</TableCell>
                            <TableCell align="right">Azioni</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                        <CircularProgress />
                                    </Box>
                                </TableCell>
                            </TableRow>
                        ) : schools.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={9} align="center">
                                    <Typography>Nessuna scuola trovata</Typography>
                                </TableCell>
                            </TableRow>
                        ) : (
                            schools.map((school) => (
                                <TableRow key={school._id}>
                                    <TableCell>
                                        <Typography variant="body1">
                                            {school.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box>
                                            <Typography variant="body2">
                                                {getSchoolTypeLabel(school.schoolType)}
                                            </Typography>
                                            {school.schoolType === 'high_school' && (
                                                <Typography variant="caption" color="textSecondary">
                                                    {getInstitutionTypeLabel(school.institutionType)}
                                                </Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell>{school.address}</TableCell>
                                    <TableCell>{school.region}</TableCell>
                                    <TableCell>{school.province}</TableCell>
                                    <TableCell>
                                        <Box display="flex" gap={0.5} flexWrap="wrap">
                                            {school.sections.map((section) => (
                                                <Chip
                                                    key={section.name}
                                                    label={section.name}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            ))}
                                        </Box>
                                    </TableCell>
                                    <TableCell>
                                        {school.manager ? (
                                            <Tooltip title={`Manager: ${school.manager.firstName} ${school.manager.lastName}`}>
                                                <Chip
                                                    icon={<PersonIcon />}
                                                    label={`${school.manager.firstName} ${school.manager.lastName}`}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Tooltip>
                                        ) : (
                                            <Chip
                                                label="Nessun manager"
                                                size="small"
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell align="center">
                                        <Chip
                                            label={school.isActive ? 'Attiva' : 'Inattiva'}
                                            color={school.isActive ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="right">
                                        <Tooltip title="Visualizza dettagli">
                                            <IconButton
                                                onClick={() => handleViewDetails(school._id)}
                                                size="small"
                                            >
                                                <VisibilityIcon />
                                            </IconButton>
                                        </Tooltip>
                                        
                                        <Tooltip title="Elimina">
                                            <IconButton
                                                onClick={() => handleDeleteClick(school)}
                                                size="small"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
    
            <Dialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Conferma eliminazione</DialogTitle>
                <DialogContent>
                    <Typography>
                        Sei sicuro di voler eliminare la scuola "{schoolToDelete?.name}"?
                    </Typography>
                    <Typography 
                        variant="body2" 
                        color="error" 
                        sx={{ mt: 2 }}
                    >
                        Questa azione è irreversibile e comporterà:
                        <ul>
                            <li>Rimozione di tutte le associazioni con gli utenti</li>
                            <li>Rimozione dei dati della scuola</li>
                        </ul>
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setDeleteDialogOpen(false)}
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleDeleteConfirm}
                        color="error"
                        variant="contained"
                        autoFocus
                    >
                        Elimina
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default SchoolList;