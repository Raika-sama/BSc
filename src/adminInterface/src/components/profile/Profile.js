// src/components/profile/Profile.js
import React from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Avatar,
    Divider,
    Card,
    CardContent,
    CardActions,
    Button,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { 
    Assignment as AssignmentIcon,
    Schedule as ScheduleIcon,
    Score as ScoreIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
// Importiamo il selettore dei temi
import ThemeSelectorIndex from './ThemeSelector/ThemeSelectorIndex';

const Profile = () => {
    const { user } = useAuth();

    const mockTests = [
        {
            id: 1,
            name: 'Test di Valutazione 1',
            date: '2025-01-20',
            score: '85/100'
        },
        {
            id: 2,
            name: 'Test di Valutazione 2',
            date: '2025-01-15',
            score: '92/100'
        }
    ];

    return (
        <Container maxWidth="lg">
            <Paper elevation={0} sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* Header Section - rimane invariata */}
                    <Grid item xs={12}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 3,
                            mb: 4 
                        }}>
                            <Avatar 
                                sx={{ 
                                    width: 100, 
                                    height: 100,
                                    bgcolor: 'primary.main',
                                    fontSize: '2.5rem'
                                }}
                            >
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </Avatar>
                            <Box>
                                <Typography variant="h4" gutterBottom>
                                    {user?.firstName} {user?.lastName}
                                </Typography>
                                <Typography variant="subtitle1" color="text.secondary">
                                    {user?.role === 'admin' ? 'Amministratore' : 'Insegnante'}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>

                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                    </Grid>

                    {/* Sezioni esistenti - Info Personali e Test */}
                    <Grid item xs={12} md={6}>
                        {/* ... Informazioni Personali ... */}
                        {/* Il contenuto esistente rimane invariato */}
                    </Grid>

                    <Grid item xs={12} md={6}>
                        {/* ... Test Personali ... */}
                        {/* Il contenuto esistente rimane invariato */}
                    </Grid>

                    {/* Nuova sezione per il Theme Selector */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 2 }} />
                    </Grid>

                    <Grid item xs={12}>
                        <Box sx={{ mb: 2 }}>
                            <Typography variant="h6" color="primary">
                                Personalizzazione Interfaccia
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Personalizza l'aspetto dell'applicazione secondo le tue preferenze
                            </Typography>
                        </Box>
                        <ThemeSelectorIndex />
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default Profile;