import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Stack,
    ToggleButtonGroup,
    ToggleButton,
    Divider,
} from '@mui/material';
import {
    School as SchoolIcon,
    Class as ClassIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';

// Costanti
const EVENT_TYPES = {
    ALL: 'all',
    CLASS: 'class',
    TEST: 'test',
    STATUS: 'status'
};

const EVENT_CONFIG = {
    [EVENT_TYPES.STATUS]: {
        icon: PersonIcon,
        color: 'warning',
    },
    [EVENT_TYPES.CLASS]: {
        icon: ClassIcon,
        color: 'info',
    },
    [EVENT_TYPES.TEST]: {
        icon: AssignmentIcon,
        color: 'success',
    },
};

// Componenti
const EventIcon = ({ type, size = 40 }) => {
    const config = EVENT_CONFIG[type];
    const Icon = config?.icon || PersonIcon;

    return (
        <Box
            sx={{
                width: size,
                height: size,
                borderRadius: '50%',
                backgroundColor: theme => theme.palette[config?.color || 'grey'].main,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                zIndex: 1,
            }}
        >
            <Icon />
        </Box>
    );
};

const FilterSection = ({ filter, onFilterChange }) => (
    <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
            Storico Eventi
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Cronologia di tutte le modifiche e gli eventi relativi allo studente
        </Typography>

        <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={onFilterChange}
            aria-label="filtro eventi"
            size="small"
        >
            <ToggleButton value={EVENT_TYPES.ALL}>Tutti</ToggleButton>
            <ToggleButton value={EVENT_TYPES.CLASS}>Cambi Classe</ToggleButton>
            <ToggleButton value={EVENT_TYPES.TEST}>Test</ToggleButton>
            <ToggleButton value={EVENT_TYPES.STATUS}>Stato</ToggleButton>
        </ToggleButtonGroup>
    </Paper>
);

const EventDetails = ({ event }) => (
    <Stack spacing={1}>
        <Typography variant="subtitle2">{event.title}</Typography>
        <Typography variant="body2" color="text.secondary">
            {event.description}
        </Typography>
        {event.details && (
            <Box>
                <Divider sx={{ my: 1 }} />
                <Stack direction="row" spacing={1}>
                    {event.details.academicYear && (
                        <Chip 
                            label={`A.S. ${event.details.academicYear}`}
                            size="small"
                            color={EVENT_CONFIG[event.type]?.color || 'default'}
                            variant="outlined"
                        />
                    )}
                    {event.details.reason && (
                        <Typography variant="caption" color="text.secondary">
                            {event.details.reason}
                        </Typography>
                    )}
                </Stack>
            </Box>
        )}
    </Stack>
);

const TimelineEvent = ({ event, isLast }) => {
    const formattedDate = new Date(event.date).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <Box sx={{ display: 'flex', gap: 2, position: 'relative' }}>
            <Box sx={{ width: '150px', textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">
                    {formattedDate}
                </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                <EventIcon type={event.type} />
                {!isLast && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 40,
                            width: 2,
                            height: 'calc(100% + 24px)',
                            bgcolor: 'divider',
                        }}
                    />
                )}
            </Box>

            <Box sx={{ flex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 2,
                        bgcolor: theme => `${theme.palette[EVENT_CONFIG[event.type]?.color || 'grey'].main}10`,
                        border: 1,
                        borderColor: theme => `${theme.palette[EVENT_CONFIG[event.type]?.color || 'grey'].main}20`,
                        borderRadius: 1
                    }}
                >
                    <EventDetails event={event} />
                </Paper>
            </Box>
        </Box>
    );
};

const HistoryTab = ({ student }) => {
    const [filter, setFilter] = useState(EVENT_TYPES.ALL);

    const events = useMemo(() => {
        const allEvents = [];

        // Evento creazione
        allEvents.push({
            type: EVENT_TYPES.STATUS,
            date: student.createdAt,
            title: 'Studente Creato',
            description: 'Registrazione iniziale nel sistema'
        });

        // Eventi cambio classe
        if (student.classChangeHistory) {
            student.classChangeHistory.forEach(change => {
                allEvents.push({
                    type: EVENT_TYPES.CLASS,
                    date: change.date,
                    title: 'Cambio Classe',
                    description: change.fromClass ? 
                        `Trasferito da ${change.fromYear}${change.fromSection} a ${change.toYear}${change.toSection}` :
                        `Assegnato alla classe ${change.toYear}${change.toSection}`,
                    details: {
                        reason: change.reason,
                        academicYear: change.academicYear
                    }
                });
            });
        }

        // Eventi test
        if (student.tests) {
            student.tests.forEach(test => {
                allEvents.push({
                    type: EVENT_TYPES.TEST,
                    date: test.dataCompletamento,
                    title: 'Test Completato',
                    description: `Test ${test.tipo} completato`
                });
            });
        }

        return allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [student]);

    const filteredEvents = useMemo(() => {
        return filter === EVENT_TYPES.ALL
            ? events
            : events.filter(event => event.type === filter);
    }, [events, filter]);

    const handleFilterChange = (_, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
        }
    };

    return (
        <Box>
            <FilterSection filter={filter} onFilterChange={handleFilterChange} />
            
            <Paper sx={{ p: 3 }}>
                {filteredEvents.length > 0 ? (
                    <Stack spacing={3}>
                        {filteredEvents.map((event, index) => (
                            <TimelineEvent 
                                key={`${event.type}-${event.date}-${index}`}
                                event={event}
                                isLast={index === filteredEvents.length - 1}
                            />
                        ))}
                    </Stack>
                ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                        <Typography color="text.secondary">
                            Nessun evento trovato per i filtri selezionati
                        </Typography>
                    </Box>
                )}
            </Paper>
        </Box>
    );
};

export default HistoryTab;