// src/components/users/details/UserRoleInfo.jsx
import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Divider,
    Grid,
    Chip,
    Card,
    CardContent,
    CardHeader,
    List,
    ListItem,
    ListItemIcon,
    ListItemText
} from '@mui/material';
import {
    Person as PersonIcon, 
    School as SchoolIcon,
    Class as ClassIcon,
    Assessment as TestIcon,
    Api as ApiIcon,
    AttachMoney as FinanceIcon,
    AdminPanelSettings as AdminIcon,
    SupervisorAccount as ManagerIcon,
    Work as PCTOIcon,
    School as TeacherIcon,
    SupportAgent as TutorIcon,
    Science as ResearcherIcon,
    HealthAndSafety as HealthIcon,
    AccountCircle as StudentIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';

// Definizione delle informazioni per ogni ruolo
const ROLE_INFO = {
    admin: {
        label: 'Amministratore',
        icon: AdminIcon,
        color: 'error',
        description: 'Accesso completo a tutte le funzionalità del sistema, inclusi finanza e gestione servizi.',
        capabilities: [
            'Gestione completa di tutti gli utenti',
            'Creazione e gestione scuole',
            'Gestione di tutte le classi',
            'Gestione di tutti gli studenti',
            'Accesso completo ai test',
            'Gestione API',
            'Gestione Finanza',
            'Gestione Stato Servizi',
            'Accesso a tutte le Analytics'
        ],
        testAccess: 0
    },
    developer: {
        label: 'Sviluppatore',
        icon: AdminIcon,
        color: 'primary',
        description: 'Accesso completo a tutte le funzionalità tranne finanza.',
        capabilities: [
            'Gestione completa di tutti gli utenti',
            'Creazione e gestione scuole',
            'Gestione di tutte le classi',
            'Gestione di tutti gli studenti',
            'Accesso completo ai test',
            'Gestione API',
            'Gestione Stato Servizi',
            'Accesso a tutte le Analytics'
        ],
        testAccess: 1
    },
    manager: {
        label: 'Referente Scolastico',
        icon: ManagerIcon,
        color: 'secondary',
        description: 'Gestisce una scuola assegnata, inclusi classi, studenti e test (pacchetti).',
        capabilities: [
            'Gestione utenti nella propria scuola',
            'Lettura/Scrittura per classi della propria scuola',
            'Lettura/Scrittura per studenti della propria scuola',
            'Gestione test per la propria scuola'
        ],
        testAccess: 2
    },
    pcto: {
        label: 'Responsabile PCTO',
        icon: PCTOIcon,
        color: 'info',
        description: 'Accesso in sola lettura a classi/studenti, scrittura/lettura per test.',
        capabilities: [
            'Sola lettura per classi della propria scuola',
            'Sola lettura per studenti della propria scuola',
            'Scrittura/Lettura per test'
        ],
        testAccess: 3
    },
    teacher: {
        label: 'Insegnante',
        icon: TeacherIcon,
        color: 'success',
        description: 'Accesso in sola lettura alle proprie classi/studenti, scrittura/lettura per test.',
        capabilities: [
            'Sola lettura per classi assegnate',
            'Sola lettura per studenti nelle classi assegnate',
            'Scrittura/Lettura per test delle proprie classi'
        ],
        testAccess: 4
    },
    tutor: {
        label: 'Tutor',
        icon: TutorIcon,
        color: 'warning',
        description: 'Accesso in sola lettura agli studenti assegnati, scrittura/lettura per test.',
        capabilities: [
            'Sola lettura per studenti assegnati',
            'Scrittura/Lettura per test degli studenti assegnati'
        ],
        testAccess: 5
    },
    researcher: {
        label: 'Ricercatore',
        icon: ResearcherIcon,
        color: 'info',
        description: 'Accesso in sola lettura alle analytics.',
        capabilities: [
            'Sola lettura per analytics',
            'Accesso a dati aggregati'
        ],
        testAccess: 6
    },
    health: {
        label: 'Professionista Sanitario',
        icon: HealthIcon,
        color: 'success',
        description: 'Accesso in lettura ai test esistenti, scrittura per propri test.',
        capabilities: [
            'Lettura engines esistenti',
            'Scrittura per engines propri'
        ],
        testAccess: 7
    },
    student: {
        label: 'Studente',
        icon: StudentIcon,
        color: 'primary',
        description: 'Accesso in lettura alla propria scuola e ai test assegnati.',
        capabilities: [
            'Lettura per propria scuola',
            'Lettura per test assegnati'
        ],
        testAccess: 8
    }
};

const UserRoleInfo = ({ role }) => {
    // Se il ruolo non esiste nei dati predefiniti, usa un valore di default
    const roleData = ROLE_INFO[role] || {
        label: role.charAt(0).toUpperCase() + role.slice(1),
        icon: PersonIcon,
        color: 'default',
        description: 'Informazioni non disponibili per questo ruolo.',
        capabilities: [],
        testAccess: 8
    };

    const Icon = roleData.icon;

    return (
        <Box>
            <Card>
                <CardHeader
                    avatar={<Icon color={roleData.color} fontSize="large" />}
                    title={
                        <Typography variant="h6">{roleData.label}</Typography>
                    }
                    action={
                        <Chip 
                            label={`Test Access: ${roleData.testAccess}`}
                            color={roleData.color}
                            size="small"
                        />
                    }
                />
                <Divider />
                <CardContent>
                    <Typography variant="body1" gutterBottom>
                        {roleData.description}
                    </Typography>

                    <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                        Capacità:
                    </Typography>
                    <List dense>
                        {roleData.capabilities.map((capability, index) => (
                            <ListItem key={index}>
                                <ListItemIcon sx={{ minWidth: 30 }}>
                                    <CheckIcon color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText primary={capability} />
                            </ListItem>
                        ))}
                    </List>
                </CardContent>
            </Card>
        </Box>
    );
};

export default UserRoleInfo;