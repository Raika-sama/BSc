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
    alpha,
} from '@mui/material';
import {
    School as SchoolIcon,
    Class as ClassIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';

const EventTypeIcons = {
    school: SchoolIcon,
    class: ClassIcon,
    edit: EditIcon,
    test: AssignmentIcon,
    status: PersonIcon,
};

const EventColors = {
    school: 'primary',
    class: 'info',
    edit: 'secondary',
    test: 'success',
    status: 'warning',
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const HistoryTab = ({ student }) => {
    const [filter, setFilter] = useState('all');

    // Organizziamo tutti gli eventi in ordine cronologico
    const events = useMemo(() => {
        const allEvents = [];

        // Aggiungi evento creazione
        allEvents.push({
            type: 'status',
            date: student.createdAt,
            title: 'Studente Creato',
            description: 'Registrazione iniziale nel sistema',
            icon: PersonIcon,
            color: EventColors.status
        });

        // Aggiungi cambi classe
        if (student.classChangeHistory) {
            student.classChangeHistory.forEach(change => {
                allEvents.push({
                    type: 'class',
                    date: change.date,
                    title: 'Cambio Classe',
                    description: change.fromClass ? 
                        `Trasferito da ${change.fromYear}${change.fromSection} a ${change.toYear}${change.toSection}` :
                        `Assegnato alla classe ${change.toYear}${change.toSection}`,
                    details: {
                        reason: change.reason,
                        academicYear: change.academicYear
                    },
                    icon: ClassIcon,
                    color: EventColors.class
                });
            });
        }

        // Aggiungi eventi test
        if (student.tests) {
            student.tests.forEach(test => {
                allEvents.push({
                    type: 'test',
                    date: test.dataCompletamento,
                    title: 'Test Completato',
                    description: `Test ${test.tipo} completato`,
                    icon: AssignmentIcon,
                    color: EventColors.test
                });
            });
        }

        // Ordina per data decrescente
        return allEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [student]);

    const filteredEvents = useMemo(() => {
        if (filter === 'all') return events;
        return events.filter(event => event.type === filter);
    }, [events, filter]);

    const handleFilterChange = (event, newFilter) => {
        if (newFilter !== null) {
            setFilter(newFilter);
        }
    };

    return (
        <Box>
            {/* Header e Filtri */}
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
                    onChange={handleFilterChange}
                    aria-label="text alignment"
                    size="small"
                >
                    <ToggleButton value="all" aria-label="all">
                        Tutti
                    </ToggleButton>
                    <ToggleButton value="class" aria-label="class changes">
                        Cambi Classe
                    </ToggleButton>
                    <ToggleButton value="test" aria-label="tests">
                        Test
                    </ToggleButton>
                    <ToggleButton value="status" aria-label="status">
                        Stato
                    </ToggleButton>
                </ToggleButtonGroup>
            </Paper>

            {/* Timeline modificata */}
            <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {filteredEvents.map((event, index) => {
                        const Icon = event.icon;
                        return (
                            <Box
                                key={index}
                                sx={{
                                    display: 'flex',
                                    gap: 2,
                                    position: 'relative',
                                }}
                            >
                                {/* Data */}
                                <Box sx={{ width: '150px', textAlign: 'right' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        {formatDate(event.date)}
                                    </Typography>
                                </Box>

                                {/* Linea verticale con icona */}
                                <Box
                                    sx={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        position: 'relative',
                                    }}
                                >
                                    <Box
                                        sx={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: '50%',
                                            backgroundColor: theme => theme.palette[event.color].main,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            zIndex: 1,
                                        }}
                                    >
                                        <Icon />
                                    </Box>
                                    {index < filteredEvents.length - 1 && (
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

                                {/* Contenuto */}
                                <Box sx={{ flex: 1 }}>
                                    <Paper
                                        elevation={0}
                                        sx={{
                                            p: 2,
                                            bgcolor: alpha(theme => 
                                                theme.palette[event.color].main, 0.05
                                            ),
                                            border: 1,
                                            borderColor: alpha(theme => 
                                                theme.palette[event.color].main, 0.1
                                            ),
                                            borderRadius: 1
                                        }}
                                    >
                                        <Stack spacing={1}>
                                            <Typography variant="subtitle2">
                                                {event.title}
                                            </Typography>
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
                                                                color={event.color}
                                                                variant="outlined"
                                                            />
                                                        )}
                                                        {event.details.reason && (
                                                            <Typography 
                                                                variant="caption" 
                                                                color="text.secondary"
                                                            >
                                                                {event.details.reason}
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </Box>
                                            )}
                                        </Stack>
                                    </Paper>
                                </Box>
                            </Box>
                        );
                    })}
                </Stack>

                {filteredEvents.length === 0 && (
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