import React from 'react';
import {
    Box,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Chip,
    Divider,
    Stack
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as StudentIcon,
    Assessment as TestIcon,
    Lock as LockIcon
} from '@mui/icons-material';

const PermissionItem = ({ icon: Icon, title, description, scope }) => (
    <ListItem>
        <ListItemIcon>
            <Icon color="primary" />
        </ListItemIcon>
        <ListItemText
            primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {title}
                    <Chip 
                        label={scope}
                        size="small"
                        color="default"
                        variant="outlined"
                    />
                </Box>
            }
            secondary={description}
        />
    </ListItem>
);

const PermissionsTab = ({ student }) => {
    return (
        <Box>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Permessi Studente
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Visualizza i permessi e le autorizzazioni dello studente nel sistema
                </Typography>
            </Box>

            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                }}
            >
                <Stack spacing={3}>
                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Stato Autorizzazioni
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <Chip
                                icon={<LockIcon />}
                                label={student.hasCredentials ? "Credenziali Generate" : "Credenziali Non Generate"}
                                color={student.hasCredentials ? "success" : "warning"}
                                variant="outlined"
                            />
                            <Chip
                                label={student.isActive ? "Account Attivo" : "Account Inattivo"}
                                color={student.isActive ? "success" : "error"}
                                variant="outlined"
                            />
                        </Stack>
                    </Box>

                    <Divider />

                    <Box>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Permessi di Sistema
                        </Typography>
                        <List>
                            <PermissionItem
                                icon={SchoolIcon}
                                title="Accesso Scuola"
                                description="Visualizzazione informazioni della propria scuola"
                                scope="Lettura"
                            />
                            <Divider variant="inset" component="li" />
                            <PermissionItem
                                icon={StudentIcon}
                                title="Dati Personali"
                                description="Accesso ai propri dati e informazioni personali"
                                scope="Lettura"
                            />
                            <Divider variant="inset" component="li" />
                            <PermissionItem
                                icon={TestIcon}
                                title="Test"
                                description="Accesso ai test assegnati"
                                scope="Lettura"
                            />
                        </List>
                    </Box>
                </Stack>
            </Paper>
        </Box>
    );
};

export default PermissionsTab;