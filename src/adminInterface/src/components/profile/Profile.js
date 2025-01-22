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

const Profile = () => {
    const { user } = useAuth();

    // Dati mock per i test
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
                    {/* Header Section - invariato */}
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

                    {/* User Details Section */}
                    <Grid item xs={12} md={6}>
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="h6" gutterBottom color="primary">
                                Informazioni Personali
                            </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {user?.email}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Nome
                                </Typography>
                                <Typography variant="body1">
                                    {user?.firstName}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Cognome
                                </Typography>
                                <Typography variant="body1">
                                    {user?.lastName}
                                </Typography>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                    Ruolo
                                </Typography>
                                <Typography variant="body1">
                                    {user?.role === 'admin' ? 'Amministratore' : 'Insegnante'}
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                    {/* Test Personali Section */}
                    <Grid item xs={12} md={6}>
                        <Card 
                            sx={{ 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: 'background.default'
                            }}
                        >
                            <CardContent>
                                <Box sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    mb: 3
                                }}>
                                    <AssignmentIcon color="primary" />
                                    <Typography variant="h6" color="primary">
                                        Test Personali
                                    </Typography>
                                </Box>

                                <List>
                                    {mockTests.map((test) => (
                                        <ListItem 
                                            key={test.id}
                                            sx={{ 
                                                bgcolor: 'background.paper',
                                                mb: 1,
                                                borderRadius: 1,
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                                            }}
                                        >
                                            <ListItemIcon>
                                                <AssignmentIcon color="action" />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={test.name}
                                                secondary={
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <ScheduleIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {test.date}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <ScoreIcon fontSize="small" color="action" />
                                                            <Typography variant="body2" color="text.secondary">
                                                                {test.score}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                            <CardActions sx={{ mt: 'auto', p: 2 }}>
                                <Button 
                                    variant="contained" 
                                    startIcon={<AddIcon />}
                                    fullWidth
                                >
                                    Nuovo Test
                                </Button>
                            </CardActions>
                        </Card>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default Profile;