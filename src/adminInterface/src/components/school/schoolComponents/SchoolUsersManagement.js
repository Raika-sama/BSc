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
    CircularProgress,
    Tooltip
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import { useNavigate } from 'react-router-dom';
import UserSelectionModal from './UserSelectionModal';
import { axiosInstance } from '../../../services/axiosConfig';

const OPERATION_TYPES = {
    ADD_USER: 'ADD_USER',
    CHANGE_MANAGER: 'CHANGE_MANAGER',
    CREATE_USER: 'CREATE_USER'
};

const SchoolUsersManagement = ({
    schoolId,
    users = [],
    manager,
    onClose,
    isDialog = false
}) => {
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const { 
        removeManagerFromSchool, 
        addManagerToSchool, 
        addUserToSchool,
        addMultipleUsersToSchool,
        removeUserFromSchool 
    } = useSchool();
    
    const [loading, setLoading] = useState(false);
    const [availableManagers, setAvailableManagers] = useState([]);
    const [operationDialog, setOperationDialog] = useState({
        open: false,
        type: null
    });
    const [confirmDialog, setConfirmDialog] = useState({
        open: false,
        title: '',
        message: '',
        action: null,
        actionData: null
    });
    const [formData, setFormData] = useState({
        email: '',
        role: 'teacher',
        userId: ''
    });
    const [userSelectionModalOpen, setUserSelectionModalOpen] = useState(false);

    // Funzione per caricare i manager disponibili
    const fetchAvailableManagers = async () => {
        try {
            setLoading(true);
            console.log('Iniziando fetchAvailableManagers...');
            
            const response = await axiosInstance.get('/users/available-managers');
            console.log('Risposta manager:', response);
            
            // Gestisci la risposta in modo più robusto
            let managers = [];
            
            if (response.data && response.data.status === 'success') {
                // Cerca i dati dei manager in vari percorsi possibili
                if (response.data.data && response.data.data.users) {
                    managers = response.data.data.users;
                } else if (response.data.data && response.data.data.data && response.data.data.data.users) {
                    managers = response.data.data.data.users;
                } else if (Array.isArray(response.data.data)) {
                    managers = response.data.data;
                }
            }
            
            console.log('Manager disponibili trovati:', managers.length);
            setAvailableManagers(managers);
            
        } catch (error) {
            console.error('Errore nel caricamento dei manager:', error);
            showNotification('Errore nel caricamento dei manager disponibili', 'error');
            setAvailableManagers([]);
        } finally {
            setLoading(false);
        }
    };

    // Gestione dialoghi
    const handleOpenDialog = async (type) => {
        console.log('handleOpenDialog chiamato con type:', type);
        
        if (type === OPERATION_TYPES.ADD_USER) {
            // Apriamo direttamente il modale di selezione utenti
            setUserSelectionModalOpen(true);
        } else if (type === OPERATION_TYPES.CHANGE_MANAGER) {
            setOperationDialog({ open: true, type });
            console.log('Iniziando caricamento manager...');
            await fetchAvailableManagers();
        } else if (type === OPERATION_TYPES.CREATE_USER) {
            // Naviga alla creazione utente con parametro per tornare qui dopo
            navigate(`/admin/users/create?schoolId=${schoolId}&returnUrl=/admin/schools/${schoolId}`);
        }
    };

    const handleCloseDialog = () => {
        setOperationDialog({ open: false, type: null });
        setFormData({ email: '', role: 'teacher', userId: '' });
    };

    // Gestione form manager
    const handleSubmitManager = async () => {
        try {
            setLoading(true);
            
            if (!formData.userId) {
                throw new Error('Devi selezionare un manager');
            }
            
            await addManagerToSchool(schoolId, formData.userId);
            showNotification('Manager aggiunto con successo', 'success');
            
            handleCloseDialog();
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || error.message || 'Errore nell\'operazione',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    // Gestione selezione utenti multipli
    const handleUserSelection = async (selectedUsers) => {
        try {
            setLoading(true);
            
            if (selectedUsers.length === 0) {
                return;
            }
            
            const result = await addMultipleUsersToSchool(schoolId, selectedUsers);
            
            if (result.successCount > 0) {
                showNotification(
                    `${result.successCount} utenti aggiunti con successo${result.failCount > 0 ? `. ${result.failCount} non aggiunti.` : ''}`, 
                    'success'
                );
            } else {
                showNotification('Nessun utente aggiunto alla scuola', 'warning');
            }
        } catch (error) {
            showNotification(
                'Errore nell\'aggiunta degli utenti alla scuola',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    // Gestione rimozione manager
    const handleManagerRemove = () => {
        setConfirmDialog({
            open: true,
            title: 'Conferma Rimozione Manager',
            message: `Sei sicuro di voler rimuovere ${manager.firstName} ${manager.lastName} come manager della scuola? 
                     Questa azione potrebbe avere conseguenze sulle classi e gli studenti associati.`,
            action: 'removeManager',
            actionData: null
        });
    };

    // Gestione rimozione utente
    const handleUserRemove = (userId, userName) => {
        setConfirmDialog({
            open: true,
            title: 'Conferma Rimozione Utente',
            message: `Sei sicuro di voler rimuovere ${userName} dalla scuola?`,
            action: 'removeUser',
            actionData: userId
        });
    };

    // Gestione conferma azioni
    const handleConfirmAction = async () => {
        try {
            setLoading(true);
            
            if (confirmDialog.action === 'removeManager') {
                await removeManagerFromSchool(schoolId);
                showNotification('Manager rimosso con successo', 'success');
            } else if (confirmDialog.action === 'removeUser') {
                await removeUserFromSchool(schoolId, confirmDialog.actionData);
                showNotification('Utente rimosso dalla scuola con successo', 'success');
            }
        } catch (error) {
            showNotification(
                error.response?.data?.error?.message || 'Errore nell\'operazione',
                'error'
            );
        } finally {
            setLoading(false);
            setConfirmDialog({ open: false, title: '', message: '', action: null, actionData: null });
        }
    };

    // Rendering manager selection
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

    // Rendering confirm dialog
    const renderConfirmDialog = () => (
        <Dialog
            open={confirmDialog.open}
            onClose={() => setConfirmDialog({ open: false, title: '', message: '', action: null, actionData: null })}
        >
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogContent>
                <Typography>{confirmDialog.message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button 
                    onClick={() => setConfirmDialog({ open: false, title: '', message: '', action: null, actionData: null })}
                    disabled={loading}
                >
                    Annulla
                </Button>
                <Button 
                    onClick={handleConfirmAction}
                    color="error"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={20} /> : <DeleteIcon />}
                >
                    {loading ? 'Rimozione in corso...' : 'Rimuovi'}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Rendering users list
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
                            onClick={() => handleOpenDialog(OPERATION_TYPES.CHANGE_MANAGER)}
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
                <Box display="flex" gap={1}>
                    <Tooltip title="Crea nuovo utente e associalo alla scuola">
                        <Button
                            startIcon={<PersonAddIcon />}
                            onClick={() => handleOpenDialog(OPERATION_TYPES.CREATE_USER)}
                            disabled={loading}
                            color="secondary"
                            variant="outlined"
                        >
                            Crea Nuovo
                        </Button>
                    </Tooltip>
                    <Tooltip title="Associa utenti esistenti alla scuola">
                        <Button
                            startIcon={<SearchIcon />}
                            onClick={() => handleOpenDialog(OPERATION_TYPES.ADD_USER)}
                            disabled={loading}
                            color="primary"
                            variant="contained"
                        >
                            Cerca e Associa
                        </Button>
                    </Tooltip>
                </Box>
            </Box>

            {users && users.length > 0 ? (
                users.map((userAssignment) => {
                    const user = userAssignment.user || userAssignment;
                    return (
                        <ListItem
                            key={user._id}
                            secondaryAction={
                                <IconButton
                                    edge="end"
                                    onClick={() => handleUserRemove(user._id, `${user.firstName} ${user.lastName}`)}
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
                })
            ) : (
                <Typography color="text.secondary" sx={{ py: 2 }}>
                    Nessun utente associato alla scuola
                </Typography>
            )}
        </List>
    );

    // Rendering manager dialog
    const renderManagerDialog = () => (
        <Dialog open={operationDialog.open} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
            <DialogTitle>
                Aggiungi Manager
            </DialogTitle>
            <DialogContent>
                {renderManagerSelection()}
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseDialog} disabled={loading}>
                    Annulla
                </Button>
                <Button 
                    onClick={handleSubmitManager} 
                    variant="contained"
                    disabled={loading || !formData.userId}
                >
                    {loading ? (
                        <>
                            <CircularProgress size={24} sx={{ mr: 1 }} />
                            Elaborazione...
                        </>
                    ) : (
                        'Conferma'
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );

    // Componente principale
    const content = (
        <>
            {renderUsersList()}
            {renderManagerDialog()}
            {renderConfirmDialog()}
            
            {/* Modale per la selezione multipla degli utenti */}
            <UserSelectionModal
                open={userSelectionModalOpen}
                onClose={() => setUserSelectionModalOpen(false)}
                onSelectUsers={handleUserSelection}
                selectedSchoolId={schoolId}
            />
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