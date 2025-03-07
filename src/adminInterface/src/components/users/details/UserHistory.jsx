// src/components/users/details/UserHistory.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Alert,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField,
    Grid,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    Edit as EditIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    Login as LoginIcon,
    Logout as LogoutIcon,
    Refresh as RefreshIcon,
    FilterAlt as FilterIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

const UserHistory = ({ userData }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        action: '',
        startDate: '',
        endDate: ''
    });
    const [showFilters, setShowFilters] = useState(false);
    const { getUserHistory } = useUser();

    useEffect(() => {
        if (userData && userData._id) {
            loadHistory();
        }
    }, [userData?._id]);

    const loadHistory = async () => {
        if (!userData || !userData._id) {
            setError('ID utente non disponibile');
            return;
        }
        
        try {
            setLoading(true);
            setError(null);
            const data = await getUserHistory(userData._id);
            // Assicurati che data sia un array, altrimenti usa un array vuoto
            setHistory(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error loading user history:', error);
            setError('Impossibile caricare lo storico: ' + (error.message || 'errore sconosciuto'));
            setHistory([]); // Reset history con un array vuoto in caso di errore
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'updated':
                return <EditIcon color="primary" />;
            case 'password_changed':
                return <LockIcon color="warning" />;
            case 'role_changed':
                return <PersonIcon color="info" />;
            case 'login':
                return <LoginIcon color="success" />;
            case 'logout':
                return <LogoutIcon />;
            default:
                return <EditIcon />;
        }
    };

    const formatChanges = (changes) => {
        if (!changes) return null;
        
        return Object.entries(changes).map(([field, value]) => (
            <Box key={field} sx={{ mt: 1 }}>
                <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                    {getFieldDisplayName(field)}:
                </Typography>
                <Typography variant="body2">
                    {formatValue(field, value.old)} → {formatValue(field, value.new)}
                </Typography>
            </Box>
        ));
    };

    const getFieldDisplayName = (field) => {
        const fieldMap = {
            'firstName': 'Nome',
            'lastName': 'Cognome',
            'email': 'Email',
            'role': 'Ruolo',
            'status': 'Stato',
            'testAccessLevel': 'Livello accesso test',
            'hasAdminAccess': 'Accesso admin',
            'permissions': 'Permessi'
        };

        return fieldMap[field] || field;
    };

    const formatValue = (field, value) => {
        if (value === undefined || value === null) return '-';
        
        switch (field) {
            case 'role':
                return translateRole(value);
            case 'status':
                return translateStatus(value);
            case 'hasAdminAccess':
                return value ? 'Sì' : 'No';
            case 'testAccessLevel':
                return `Livello ${value}`;
            case 'permissions':
                return Array.isArray(value) ? `${value.length} permessi` : value;
            default:
                return value.toString();
        }
    };

    const translateRole = (role) => {
        const roleMap = {
            'admin': 'Amministratore',
            'teacher': 'Insegnante',
            'manager': 'Manager',
            'tutor': 'Tutor',
            'student': 'Studente',
            'researcher': 'Ricercatore',
            'health': 'Operatore Sanitario',
            'pcto': 'Referente PCTO'
        };
        return roleMap[role] || role;
    };

    const translateStatus = (status) => {
        const statusMap = {
            'active': 'Attivo',
            'inactive': 'Inattivo',
            'suspended': 'Sospeso'
        };
        return statusMap[status] || status;
    };

    const formatDateTime = (dateString) => {
        try {
            return format(new Date(dateString), "dd MMMM yyyy, HH:mm", { locale: it });
        } catch (e) {
            return dateString;
        }
    };

    const handleFilterChange = (event) => {
        const { name, value } = event.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const clearFilters = () => {
        setFilters({
            action: '',
            startDate: '',
            endDate: ''
        });
    };

    // Gestione sicura per evitare errori su history undefined
    const filteredHistory = (Array.isArray(history) ? history : []).filter(event => {
        if (!event) return false;
        
        // Filtra per tipo di azione
        if (filters.action && event.action !== filters.action) {
            return false;
        }
        
        // Filtra per date
        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            const eventDate = new Date(event.createdAt);
            if (eventDate < startDate) return false;
        }
        
        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59);
            const eventDate = new Date(event.createdAt);
            if (eventDate > endDate) return false;
        }
        
        return true;
    });

    // Determina le azioni uniche presenti nello storico in modo sicuro
    const uniqueActions = Array.isArray(history) ? 
        [...new Set(history.filter(event => event && event.action).map(event => event.action))] :
        [];

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
                <Typography variant="h6">
                    Storico Modifiche
                </Typography>
                <Box>
                    <Tooltip title="Filtra">
                        <IconButton onClick={() => setShowFilters(!showFilters)}>
                            <FilterIcon color={showFilters ? "primary" : "inherit"} />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Aggiorna">
                        <IconButton onClick={loadHistory} disabled={loading}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {showFilters && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel id="action-filter-label">Tipo di Evento</InputLabel>
                                <Select
                                    labelId="action-filter-label"
                                    name="action"
                                    value={filters.action}
                                    label="Tipo di Evento"
                                    onChange={handleFilterChange}
                                >
                                    <MenuItem value="">Tutti</MenuItem>
                                    {uniqueActions.map(action => (
                                        <MenuItem key={action} value={action}>
                                            {action.replace('_', ' ').toUpperCase()}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Da data"
                                name="startDate"
                                type="date"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="A data"
                                name="endDate"
                                type="date"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                size="small"
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <Button 
                                variant="outlined" 
                                startIcon={<ClearIcon />} 
                                onClick={clearFilters}
                                fullWidth
                            >
                                Azzera
                            </Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
                    <CircularProgress />
                </Box>
            ) : filteredHistory.length === 0 ? (
                <Alert severity="info">
                    {Array.isArray(history) && history.length === 0 
                        ? "Nessun evento trovato per questo utente." 
                        : "Nessun evento corrisponde ai filtri selezionati."}
                </Alert>
            ) : (
                <List>
                    {filteredHistory.map((event, index) => (
                        <React.Fragment key={event._id || index}>
                            <ListItem
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    py: 2
                                }}
                            >
                                <Paper 
                                    elevation={1} 
                                    sx={{ 
                                        p: 2, 
                                        width: '100%',
                                        bgcolor: 'background.paper',
                                        borderLeft: 4,
                                        borderColor: getEventColor(event.action)
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {getActionIcon(event.action)}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography variant="subtitle2">
                                                    {getEventName(event.action)}
                                                </Typography>
                                            }
                                            secondary={
                                                <Typography variant="caption" color="textSecondary">
                                                    {formatDateTime(event.createdAt)}
                                                </Typography>
                                            }
                                        />
                                    </Box>
                                    
                                    {formatChanges(event.changes)}
                                    
                                    {event.performedBy && (
                                        <Typography 
                                            variant="caption" 
                                            display="block" 
                                            sx={{ mt: 1, color: 'text.secondary', fontStyle: 'italic' }}
                                        >
                                            Eseguito da: {event.performedBy.firstName} {event.performedBy.lastName}
                                        </Typography>
                                    )}
                                </Paper>
                            </ListItem>
                            {index < filteredHistory.length - 1 && (
                                <Divider variant="inset" component="li" />
                            )}
                        </React.Fragment>
                    ))}
                </List>
            )}
        </Box>
    );
};

// Funzioni di supporto
const getEventColor = (action) => {
    switch (action) {
        case 'updated':
            return 'primary.main';
        case 'password_changed':
            return 'warning.main';
        case 'role_changed':
            return 'info.main';
        case 'login':
            return 'success.main';
        case 'logout':
            return 'grey.500';
        default:
            return 'primary.main';
    }
};

const getEventName = (action) => {
    const eventNames = {
        'updated': 'MODIFICA PROFILO',
        'password_changed': 'CAMBIO PASSWORD',
        'role_changed': 'CAMBIO RUOLO',
        'login': 'ACCESSO',
        'logout': 'DISCONNESSIONE'
    };
    
    return eventNames[action] || action.replace('_', ' ').toUpperCase();
};

export default UserHistory;