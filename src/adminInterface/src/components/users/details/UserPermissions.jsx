// src/components/users/details/UserPermissions.jsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    FormControlLabel,
    Checkbox,
    Typography,
    Button,
    Alert,
    Divider,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Tab,
    Tabs,
    Chip,
    Card,
    CardContent,
    CardHeader
} from '@mui/material';
import { 
    People as UsersIcon, 
    School as SchoolIcon,
    Class as ClassIcon,
    Person as StudentIcon,
    Assessment as TestIcon,
    Api as ApiIcon,
    AttachMoney as FinanceIcon,
    Dashboard as ServicesIcon,
    BarChart as AnalyticsIcon,
    Book as MaterialsIcon
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';

// Definizione dei gruppi di permessi con le loro risorse e azioni
const PERMISSION_GROUPS = {
    users: {
        label: 'Gestione Utenti',
        icon: UsersIcon,
        color: 'primary',
        resources: ['users'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    schools: {
        label: 'Gestione Scuole',
        icon: SchoolIcon,
        color: 'secondary',
        resources: ['schools'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    classes: {
        label: 'Gestione Classi',
        icon: ClassIcon,
        color: 'success',
        resources: ['classes'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    students: {
        label: 'Gestione Studenti',
        icon: StudentIcon,
        color: 'info',
        resources: ['students'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    tests: {
        label: 'Gestione Test',
        icon: TestIcon,
        color: 'warning',
        resources: ['tests'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    api: {
        label: 'Gestione API',
        icon: ApiIcon,
        color: 'error',
        resources: ['api'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    finance: {
        label: 'Gestione Finanza',
        icon: FinanceIcon,
        color: 'success',
        resources: ['finance'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    services: {
        label: 'Stato Servizi',
        icon: ServicesIcon,
        color: 'info',
        resources: ['services'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    analytics: {
        label: 'Analytics',
        icon: AnalyticsIcon,
        color: 'secondary',
        resources: ['analytics'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    },
    materials: {
        label: 'Materiale Didattico',
        icon: MaterialsIcon,
        color: 'primary',
        resources: ['materials'],
        actions: ['read', 'create', 'update', 'delete', 'manage']
    }
};

// Definizione dei livelli di accesso ai test
const TEST_ACCESS_LEVELS = [
    { value: 0, label: 'Admin - Visione Completa', description: 'Accesso a tutti i test nel sistema' },
    { value: 1, label: 'Developer - Visione Completa', description: 'Accesso a tutti i test nel sistema' },
    { value: 2, label: 'Manager - Scuola Assegnata', description: 'Accesso ai test della scuola assegnata' },
    { value: 3, label: 'PCTO - Scuola Assegnata', description: 'Accesso ai test della scuola assegnata' },
    { value: 4, label: 'Teacher - Classi Assegnate', description: 'Accesso ai test delle classi assegnate' },
    { value: 5, label: 'Tutor - Studenti Assegnati', description: 'Accesso ai test degli studenti assegnati' },
    { value: 6, label: 'Researcher - Analytics', description: 'Accesso alle analytics dei test' },
    { value: 7, label: 'Health - Test Specializzati', description: 'Accesso ai test sanitari' },
    { value: 8, label: 'Student - Test Assegnati', description: 'Accesso solo ai test assegnati' }
];

// Definizione degli scope di permesso disponibili
const PERMISSION_SCOPES = [
    { value: 'all', label: 'Tutte le risorse', description: 'Accesso a tutte le risorse di questo tipo' },
    { value: 'school', label: 'Scuola assegnata', description: 'Solo risorse della scuola assegnata' },
    { value: 'class', label: 'Classi assegnate', description: 'Solo risorse delle classi assegnate' },
    { value: 'assigned', label: 'Risorse assegnate', description: 'Solo risorse specificamente assegnate all\'utente' },
    { value: 'own', label: 'Risorse proprie', description: 'Solo risorse create/possedute dall\'utente' }
];

const UserPermissions = ({ userData, onUpdate }) => {
    const { updateUser } = useUser();
    const [tabValue, setTabValue] = useState(0);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Stato per i permessi in formato strutturato
    const [permissions, setPermissions] = useState([]);
    // Stato per il livello di accesso ai test
    const [testAccessLevel, setTestAccessLevel] = useState(userData.testAccessLevel || 8);
    // Stato per l'accesso al frontend admin
    const [hasAdminAccess, setHasAdminAccess] = useState(false);
    // Nuovo: stato per tenere traccia dello scope selezionato per ogni risorsa
    const [selectedScopes, setSelectedScopes] = useState({});

    // Inizializza lo stato dai dati utente
    useEffect(() => {
        if (userData) {
            // Inizializza i permessi
            setPermissions(userData.permissions || []);
            // Inizializza il livello di accesso ai test
            setTestAccessLevel(userData.testAccessLevel !== undefined ? userData.testAccessLevel : getDefaultTestAccessLevel(userData.role));
            // Inizializza l'accesso admin
            setHasAdminAccess(userData.hasAdminAccess || ['admin', 'developer'].includes(userData.role));
            
            // Inizializza gli scope selezionati in base ai permessi esistenti
            const scopes = {};
            if (userData.permissions) {
                userData.permissions.forEach(perm => {
                    scopes[perm.resource] = perm.scope || 'all';
                });
            }
            
            // Imposta valori di default per le risorse senza scope specificato
            Object.keys(PERMISSION_GROUPS).forEach(group => {
                const resource = PERMISSION_GROUPS[group].resources[0];
                if (!scopes[resource]) {
                    scopes[resource] = getDefaultScope(userData.role, resource);
                }
            });
            
            setSelectedScopes(scopes);
        }
    }, [userData]); // Dipende solo da userData
    
    // Funzione per ottenere lo scope predefinito in base al ruolo e alla risorsa
    const getDefaultScope = (role, resource) => {
        // Mapping di default per scope in base al ruolo
        const roleScopeMap = {
            admin: 'all',
            developer: 'all',
            manager: 'school',
            pcto: 'school',
            teacher: resource === 'classes' || resource === 'students' ? 'class' : 'school',
            tutor: resource === 'students' ? 'assigned' : 'school',
            researcher: 'all',
            health: resource === 'tests' ? 'own' : 'all',
            student: 'own'
        };
        
        return roleScopeMap[role] || 'own';
    };

    // Funzione per ottenere il livello di accesso ai test predefinito in base al ruolo
    const getDefaultTestAccessLevel = (role) => {
        const defaultLevels = {
            admin: 0,
            developer: 1,
            manager: 2,
            pcto: 3,
            teacher: 4,
            tutor: 5,
            researcher: 6,
            health: 7,
            student: 8
        };
        return defaultLevels[role] || 8;
    };

    // Gestisci il cambio di scope per una risorsa
    const handleScopeChange = (resource, newScope) => {
        // Aggiorna lo stato degli scope selezionati
        setSelectedScopes(prev => ({
            ...prev,
            [resource]: newScope
        }));
        
        // Aggiorna i permessi esistenti per questa risorsa con il nuovo scope
        setPermissions(prev => {
            // Trova tutti i permessi per questa risorsa
            const resourcePermissions = prev.filter(p => p.resource === resource);
            
            // Se non ci sono permessi per questa risorsa, non fare nulla
            if (resourcePermissions.length === 0) return prev;
            
            // Raccogli tutte le azioni dai permessi esistenti per questa risorsa
            const allActions = resourcePermissions.flatMap(p => p.actions);
            
            // Rimuovi i permessi vecchi per questa risorsa
            const otherPermissions = prev.filter(p => p.resource !== resource);
            
            // Aggiungi un nuovo permesso con tutte le azioni raccolte e il nuovo scope
            return [
                ...otherPermissions,
                {
                    resource,
                    actions: [...new Set(allActions)], // Rimuovi azioni duplicate
                    scope: newScope
                }
            ];
        });
    };

    // Gestisci il cambio di permesso
    const handlePermissionChange = (resource, action, scope, checked) => {
        setPermissions(prev => {
            if (checked) {
                // Aggiungi il permesso se non esiste già
                const permissionExists = prev.some(p => 
                    p.resource === resource && 
                    p.actions.includes(action) && 
                    p.scope === scope
                );
                
                if (permissionExists) return prev;
                
                // Cerca se esiste già un permesso per questa risorsa e scope
                const existingPermIndex = prev.findIndex(p => 
                    p.resource === resource && 
                    p.scope === scope
                );
                
                if (existingPermIndex >= 0) {
                    // Aggiorna le azioni per il permesso esistente
                    const updatedPerms = [...prev];
                    if (!updatedPerms[existingPermIndex].actions.includes(action)) {
                        updatedPerms[existingPermIndex].actions.push(action);
                    }
                    return updatedPerms;
                } else {
                    // Crea un nuovo permesso
                    return [...prev, {
                        resource,
                        actions: [action],
                        scope
                    }];
                }
            } else {
                // Rimuovi l'azione dal permesso
                return prev.map(p => {
                    if (p.resource === resource && p.scope === scope) {
                        return {
                            ...p,
                            actions: p.actions.filter(a => a !== action)
                        };
                    }
                    return p;
                }).filter(p => p.actions.length > 0); // Rimuovi i permessi senza azioni
            }
        });
    };

    // Verifica se un permesso è attivo
    const isPermissionEnabled = (resource, action, scope) => {
        // Se non è specificato uno scope, usa quello selezionato per la risorsa
        const effectiveScope = scope || selectedScopes[resource] || 'all';
        
        return permissions.some(p => 
            p.resource === resource && 
            p.actions.includes(action) && 
            p.scope === effectiveScope
        );
    };

    // Gestisci il salvataggio dei permessi

// Assicuriamoci che l'oggetto updateData sia costruito correttamente
const handleSave = async () => {
    try {
        setLoading(true);
        setError(null);
        
        // Controlla che testAccessLevel sia definito prima di convertirlo
        let numericTestAccessLevel;
        if (testAccessLevel !== undefined && testAccessLevel !== null) {
            numericTestAccessLevel = parseInt(testAccessLevel, 10);
            
            // Verifica che sia un numero valido
            if (isNaN(numericTestAccessLevel) || numericTestAccessLevel < 0 || numericTestAccessLevel > 8) {
                setError(`Livello di accesso ai test non valido. Deve essere un numero tra 0 e 8, valore attuale: ${testAccessLevel}`);
                setLoading(false);
                return;
            }
        }
        
        // Costruisci oggetto updateData solo con campi definiti
        const updateData = {};
        
        // Aggiungi solo i campi definiti
        if (permissions !== undefined) {
            updateData.permissions = permissions;
        }
        
        if (numericTestAccessLevel !== undefined) {
            updateData.testAccessLevel = numericTestAccessLevel;
        }
        
        if (hasAdminAccess !== undefined) {
            updateData.hasAdminAccess = hasAdminAccess;
        }
        
        console.log('Salvataggio livello accesso ai test:', updateData);
        
        // Controlla che updateData non sia vuoto
        if (Object.keys(updateData).length === 0) {
            setError('Nessun dato da aggiornare');
            setLoading(false);
            return;
        }
        
        // Controlla che userData._id sia definito
        if (!userData || !userData._id) {
            setError('ID utente mancante');
            setLoading(false);
            return;
        }
        
        try {
            await updateUser(userData._id, updateData);
            // Usa setError al posto di showNotification
            setError(null); // Pulisci gli errori precedenti
            
            // Importante: chiamare onUpdate per aggiornare i dati nel componente padre
            if (typeof onUpdate === 'function') {
                onUpdate();
            }
        } catch (updateError) {
            // Se l'errore è solo che non abbiamo ricevuto l'utente aggiornato, ma
            // sappiamo che l'update è stato fatto nel DB, consideriamo l'operazione un successo
            if (updateError.message === 'Dati utente mancanti nella risposta del server') {
                console.log('Aggiornamento DB riuscito ma dati non ricevuti, ricarico i dati');
                // Usa setError invece di showNotification
                setError('Permessi aggiornati, ricaricamento dati...');
                
                // Ricarica i dati
                if (typeof onUpdate === 'function') {
                    onUpdate();
                }
            } else {
                // Per altri errori, li mostriamo normalmente
                throw updateError;
            }
        }
    } catch (err) {
        console.error('Errore durante il salvataggio dei permessi:', err);
        setError(err.message || 'Errore durante il salvataggio dei permessi');
    } finally {
        setLoading(false);
    }
};

    // Converti i permessi in formato leggibile
    const formatPermissions = (permissions) => {
        if (!permissions || permissions.length === 0) {
            return 'Nessun permesso configurato';
        }

        return permissions.map(perm => (
            <Chip 
                key={`${perm.resource}-${perm.scope}`}
                label={`${perm.resource} (${perm.scope}): ${perm.actions.join(', ')}`}
                size="small"
                sx={{ m: 0.5 }}
            />
        ));
    };

    return (
        <Box>
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <Typography variant="h6" sx={{ mb: 3 }}>
                Gestione Permessi e Accessi
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs 
                    value={tabValue} 
                    onChange={(e, newValue) => setTabValue(newValue)}
                >
                    <Tab label="Permessi Dettagliati" />
                    <Tab label="Accesso Test" />
                    <Tab label="Accesso Admin" />
                </Tabs>
            </Box>

            {/* Tab Permessi Dettagliati */}
            {tabValue === 0 && (
                <Grid container spacing={3}>
                    {Object.entries(PERMISSION_GROUPS).map(([key, group]) => {
                        const Icon = group.icon;
                        const resource = group.resources[0];
                        const currentScope = selectedScopes[resource] || 'all';
                        
                        return (
                            <Grid item xs={12} md={6} key={key}>
                                <Card>
                                    <CardHeader
                                        avatar={<Icon color={group.color} />}
                                        title={group.label}
                                    />
                                    <Divider />
                                    <CardContent>
                                        <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                                            <InputLabel id={`scope-select-${resource}`}>Ambito</InputLabel>
                                            <Select
                                                labelId={`scope-select-${resource}`}
                                                value={currentScope}
                                                label="Ambito"
                                                onChange={(e) => handleScopeChange(resource, e.target.value)}
                                                size="small"
                                            >
                                                {PERMISSION_SCOPES.map(scope => (
                                                    <MenuItem 
                                                        key={scope.value} 
                                                        value={scope.value}
                                                        title={scope.description}
                                                    >
                                                        {scope.label}
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        
                                        <Typography variant="subtitle2" gutterBottom>
                                            Azioni:
                                        </Typography>
                                        <Grid container spacing={1}>
                                            {group.actions.map(action => (
                                                <Grid item xs={6} key={action}>
                                                    <FormControlLabel
                                                        control={
                                                            <Checkbox
                                                                size="small"
                                                                checked={isPermissionEnabled(resource, action, currentScope)}
                                                                onChange={(e) => handlePermissionChange(
                                                                    resource, 
                                                                    action, 
                                                                    currentScope, 
                                                                    e.target.checked
                                                                )}
                                                            />
                                                        }
                                                        label={action.charAt(0).toUpperCase() + action.slice(1)}
                                                    />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Tab Accesso Test */}
            {tabValue === 1 && (
                <Box>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                        <InputLabel>Livello di Accesso ai Test</InputLabel>
                        <Select
                            value={testAccessLevel}
                            onChange={(e) => setTestAccessLevel(e.target.value)}
                            label="Livello di Accesso ai Test"
                        >
                            {TEST_ACCESS_LEVELS.map(level => (
                                <MenuItem value={level.value} key={level.value}>
                                    {level.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {testAccessLevel !== null && (
                        <Paper sx={{ p: 2, mb: 3 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Descrizione del livello di accesso:
                            </Typography>
                            <Typography variant="body2">
                                {TEST_ACCESS_LEVELS.find(l => l.value === parseInt(testAccessLevel))?.description || 
                                'Descrizione non disponibile'}
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}

            {/* Tab Accesso Admin */}
            {tabValue === 2 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 3 }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={hasAdminAccess}
                                    onChange={(e) => setHasAdminAccess(e.target.checked)}
                                />
                            }
                            label="Accesso al pannello amministrativo"
                        />
                        
                        <Typography variant="body2" sx={{ mt: 2 }}>
                            Se abilitato, l'utente potrà accedere al pannello amministrativo.
                            Di default, gli utenti con ruolo Admin e Developer hanno sempre accesso.
                        </Typography>
                    </Paper>
                </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button
                    variant="outlined"
                    onClick={() => {
                        // Reimposta gli scope predefiniti per ogni risorsa
                        const defaultScopes = {};
                        Object.keys(PERMISSION_GROUPS).forEach(group => {
                            const resource = PERMISSION_GROUPS[group].resources[0];
                            defaultScopes[resource] = getDefaultScope(userData.role, resource);
                        });
                        setSelectedScopes(defaultScopes);
                        
                        // Reimposta gli altri valori
                        setTestAccessLevel(getDefaultTestAccessLevel(userData.role));
                        setHasAdminAccess(['admin', 'developer'].includes(userData.role));
                        setPermissions([]);
                    }}
                >
                    Reimposta
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={loading}
                >
                    Salva Permessi
                </Button>
            </Box>
        </Box>
    );
};

export default UserPermissions;