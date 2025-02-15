import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Avatar,
    Chip,
    IconButton,
    TextField,
    MenuItem,
    Divider,
    CircularProgress
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import { axiosInstance } from '../../../services/axiosConfig';

const OPERATION_TYPES = {
    ADD_USER: 'ADD_USER',
    CHANGE_MANAGER: 'CHANGE_MANAGER'
};

const SchoolUsersManagement = ({
    schoolId,
    users = [],
    manager,
    onAddUser,
    onRemoveUser,
    onClose,
    isDialog = false
}) => {
    const { showNotification } = useNotification();
    const { removeManagerFromSchool, addManagerToSchool } = useSchool();
    const [loading, setLoading] = useState(false);
    const [availableManagers, setAvailableManagers] = useState([]);
    const [operationDialog, setOperationDialog] = useState({
        open: false,
        type: null
    });
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: ''
    });
    const [formData, setFormData] = useState({
        email: '',
        role: 'teacher',
        userId: ''
    });

    // Aggiungi questa funzione per caricare i manager disponibili
    const fetchAvailableManagers = async () => {
        try {
            setLoading(true);
            console.log('Iniziando fetchAvailableManagers...');
            
            const response = await axiosInstance.get('/users/available-managers');
            console.log('Risposta completa:', response);
            
            // Accediamo correttamente all'array degli utenti attraverso data.data
            if (response.data.status === 'success' && response.data.data && response.data.data.data && response.data.data.data.users) {
                const managers = response.data.data.data.users;
                console.log('Manager disponibili:', managers);
                setAvailableManagers(managers);
            } else {
                console.log('Struttura risposta:', response.data);
                console.log('Tentativo di accesso diretto:', response.data?.data?.users);
                // Proviamo a recuperare i dati in modo diverso
                const users = response.data?.data?.users || [];
                setAvailableManagers(users);
            }
        } catch (error) {
            console.error('Errore dettagliato:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            showNotification('Errore nel caricamento dei manager disponibili', 'error');
            setAvailableManagers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log('availableManagers aggiornato:', {
            isArray: Array.isArray(availableManagers),
            length: availableManagers?.length,
            value: availableManagers
        });
    }, [availableManagers]);
    

    // Modifica handleOpenDialog per usare fetchAvailableManagers
    const handleOpenDialog = async (type) => {
        console.log('handleOpenDialog chiamato con type:', type);
        setOperationDialog({ open: true, type });
        if (type === OPERATION_TYPES.CHANGE_MANAGER) {
            console.log('Iniziando caricamento manager...');
            await fetchAvailableManagers();
        }
    };

    const handleCloseDialog = () => {
        setOperationDialog({ open: false, type: null });
        setFormData({ email: '', role: 'teacher', userId: '' });
    };

    const handleSubmit = async () => {
        try {
            if (operationDialog.type === OPERATION_TYPES.ADD_USER) {
                await onAddUser(formData);
                showNotification('Utente aggiunto con successo', 'success');
            } else if (operationDialog.type === OPERATION_TYPES.CHANGE_MANAGER) {
                await addManagerToSchool(schoolId, formData.userId);
                showNotification('Manager aggiunto con successo', 'success');
            }
            handleCloseDialog();
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'operazione',
                'error'
            );
        }
    };

    const handleManagerRemove = () => {
        setConfirmDialog({
            open: true,
            title: 'Conferma Rimozione Manager',
            message: `Sei sicuro di voler rimuovere ${manager.firstName} ${manager.lastName} come manager della scuola? 
                     Questa azione potrebbe avere conseguenze sulle classi e gli studenti associati.`
        });
    };

    const handleConfirmManagerRemove = async () => {
        try {
            setLoading(true);
            await removeManagerFromSchool(schoolId);
            showNotification('Manager rimosso con successo', 'success');
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nella rimozione del manager',
                'error'
            );
        } finally {
            setLoading(false);
            setConfirmDialog({ open: false, title: '', message: '' });
        }
    };

    const renderManagerSelection = () => {
        console.log('renderManagerSelection - stato corrente:', {
            loading,
            availableManagers,
            isArray: Array.isArray(availableManagers),
            length: availableManagers?.length,
            formData
        });
    
        if (loading) {
            return (
                <Box display="flex" justifyContent="center" my={3}>
                    <CircularProgress />
                </Box>
            );
        }
    
        // Verifica esplicita che availableManagers sia un array e abbia elementi
        const managers = Array.isArray(availableManagers) ? availableManagers : [];
        
        if (managers.length === 0) {
            return (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                    Nessun utente disponibile come manager
                </Typography>
            );
        }
    
        console.log('Rendering select con managers:', managers);
        return (
            <TextField
                select
                fullWidth
                label="Seleziona nuovo manager"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                sx={{ mt: 2 }}
            >
                {managers.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                        {`${user.firstName} ${user.lastName} (${user.email})`}
                    </MenuItem>
                ))}
            </TextField>
        );
    };

    const renderConfirmDialog = () => (
        <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ open: false, title: '', message: '' })}
        >
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent>
                <Typography>{confirmDialog.message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={() => setConfirmDialog({ open: false, title: '', message: '' })}
                    disabled={loading}
                >
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirmManagerRemove}
                    color="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
                >
                    {loading ? 'Rimozione in corso...' : 'Rimuovi Manager'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    const renderUsersList = () => (
        <List>
            {/* Manager Section */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(25, 118, 210, 0.08)', borderRadius: 1 }}>
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 1
                }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                        Manager della Scuola
                    </Typography>
                    {manager ? (
                        <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={handleManagerRemove}
                            disabled={loading}
                        >
                            Rimuovi Manager
                        </Button>
                    ) : (
                        <Button
                            size="small"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog(OPERATION_TYPES.CHANGE_MANAGER)} // <-- Qui è il cambio
                            disabled={loading}
                        >
                            Aggiungi Manager
                        </Button>
                    )}
                </Box>
                
                {manager ? (
                    <ListItem disablePadding>
                        <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                <StarIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={`${manager.firstName} ${manager.lastName}`}
                            secondary={manager.email}
                        />
                    </ListItem>
                ) : (
                    <Typography color="text.secondary" variant="body2" sx={{ mt: 1 }}>
                        Nessun manager assegnato
                    </Typography>
                )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Users List */}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold">
                    Altri Utenti
                </Typography>
                <Button
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog(OPERATION_TYPES.ADD_USER)}
                    disabled={loading}
                >
                    Aggiungi Utente
                </Button>
            </Box>

            {users.map((userAssignment) => {
                const user = userAssignment.user || userAssignment;
                return (
                    <ListItem
                        key={user._id}
                        secondaryAction={
                            <IconButton
                                edge="end"
                                onClick={() => onRemoveUser(user._id)}
                                size="small"
                                color="error"
                                disabled={loading}
                            >
                                <DeleteIcon />
                            </IconButton>
                        }
                    >
                        <ListItemAvatar>
                            <Avatar>
                                <PersonIcon />
                            </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                            primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Typography component="span">{`${user.firstName} ${user.lastName}`}</Typography>
                                    <Box>
                                        <Chip
                                            label={userAssignment.role === 'admin' ? 'Admin' : 'Insegnante'}
                                            size="small"
                                            color={userAssignment.role === 'admin' ? 'primary' : 'default'}
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            }
                            secondary={user.email}
                        />
                    </ListItem>
                );
            })}
        </List>
    );

    const renderOperationDialog = () => (
        <Dialog open={operationDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
                {operationDialog.type === OPERATION_TYPES.ADD_USER ? 'Aggiungi Utente' : 'Aggiungi Manager'}
            </DialogTitle>
            <DialogContent>
                {operationDialog.type === OPERATION_TYPES.ADD_USER ? (
                    <>
                        <TextField
                            fullWidth
                            label="Email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            sx={{ mt: 2, mb: 2 }}
                        />
                        <TextField
                            select
                            fullWidth
                            label="Ruolo"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <MenuItem value="teacher">Insegnante</MenuItem>
                            <MenuItem value="admin">Amministratore</MenuItem>
                        </TextField>
                    </>
                ) : (
                    renderManagerSelection()
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} disabled={loading}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    variant="contained"
                    disabled={loading || (operationDialog.type === OPERATION_TYPES.CHANGE_MANAGER && !formData.userId)}
                >
                    Conferma
                </Button>
            </DialogActions>
        </Dialog>
    );


    const content = (
        <>
            {renderUsersList()}
            {renderOperationDialog()}
            {renderConfirmDialog()}
        </>
    );

    if (isDialog) {
        return (
            <Dialog open onClose={onClose} maxWidth="md" fullWidth>
                <DialogTitle>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography variant="h6">Gestione Utenti</Typography>
                        <IconButton onClick={onClose} size="small" disabled={loading}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers>
                    {content}
                </DialogContent>
            </Dialog>
        );
    }

    return content;
};

export default SchoolUsersManagement;