import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Button,
    Alert,
    useTheme
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Assignment as TestIcon,
    Notifications as NotificationIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';
import AnimatedStatCard from './AnimatedStatCard';  // Il componente che abbiamo creato prima

// Configurazione Chart.js rimane invariata
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// Componente ActivityItem con animazioni
const ActivityItem = ({ icon, primary, secondary, color, index }) => (
    <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: index * 0.2, duration: 0.5 }}
    >
        <ListItem>
            <ListItemIcon>
                <Box
                    sx={{
                        backgroundColor: `${color}.light`,
                        borderRadius: 1,
                        p: 1,
                        display: 'flex',
                    }}
                >
                    {icon}
                </Box>
            </ListItemIcon>
            <ListItemText 
                primary={primary}
                secondary={secondary}
                primaryTypographyProps={{ fontWeight: 'medium' }}
            />
        </ListItem>
    </motion.div>
);

const Dashboard = () => {
    const { user } = useAuth();
    const theme = useTheme();
    const [stats, setStats] = useState({
        schools: { value: 5, trend: 'up', percentage: 12 },
        users: { value: 100, trend: 'up', percentage: 8 },
        classes: { value: 20, trend: 'down', percentage: 5 },
        tests: { value: 150, trend: 'up', percentage: 15 }
    });

    // Configurazione del grafico rimane invariata
    const chartData = {
        labels: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
        datasets: [
            {
                label: 'Test Completati',
                data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 200, 190],
                fill: true,
                backgroundColor: 'rgba(75,192,192,0.2)',
                borderColor: 'rgba(75,192,192,1)',
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Andamento Test nel Tempo'
            }
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };


    // Array delle statistiche per le card
    const statsCards = [
        {
            title: 'Scuole',
            value: stats.schools.value,
            icon: <SchoolIcon color="primary" />,
            color: 'primary',
            trend: stats.schools.trend,
            percentage: stats.schools.percentage
        },
        {
            title: 'Utenti',
            value: stats.users.value,
            icon: <PersonIcon color="success" />,
            color: 'success',
            trend: stats.users.trend,
            percentage: stats.users.percentage
        },
        {
            title: 'Classi',
            value: stats.classes.value,
            icon: <ClassIcon color="warning" />,
            color: 'warning',
            trend: stats.classes.trend,
            percentage: stats.classes.percentage
        },
        {
            title: 'Test',
            value: stats.tests.value,
            icon: <TestIcon color="error" />,
            color: 'error',
            trend: stats.tests.trend,
            percentage: stats.tests.percentage
        }
    ];

    // Attività recenti
    const recentActivities = [
        {
            icon: <CheckCircleIcon color="success" />,
            primary: 'Test completato con successo',
            secondary: 'Classe 3A - Liceo Scientifico',
            color: 'success'
        },
        {
            icon: <WarningIcon color="warning" />,
            primary: 'Nuova richiesta di accesso',
            secondary: 'In attesa di approvazione',
            color: 'warning'
        },
        {
            icon: <NotificationIcon color="info" />,
            primary: 'Aggiornamento sistema',
            secondary: 'Nuove funzionalità disponibili',
            color: 'info'
        }
    ];

    return (
        <Box sx={{ 
            width: '100%',
            height: '100%',
            bgcolor: 'white',   // Cambiato il background in bianco
            m: 0,              // Rimosso qualsiasi margine
            p: 0               // Rimosso qualsiasi padding
        }}>
            {/* Header Welcome */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <Paper 
                    elevation={0}  // Rimossa l'ombra
                    sx={{ 
                        p: 3, 
                        mb: 3, 
                        background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                        color: 'white',
                        borderRadius: 0  // Rimossi i bordi arrotondati
                    }}
                >
                    <Typography variant="h4" gutterBottom>
                        Benvenuto, {user?.firstName}!
                    </Typography>
                    <Typography variant="body1">
                        {new Date().toLocaleDateString('it-IT', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Typography>
                </Paper>
            </motion.div>

            {/* Stats Grid */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statsCards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={3} key={index}>
                        <AnimatedStatCard {...card} />
                    </Grid>
                ))}
            </Grid>

            {/* Main Content */}
            <Grid container spacing={2}>
                {/* Chart Section */}
                <Grid item xs={12} lg={8}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <Paper sx={{ p: 3, height: '400px', position: 'relative' }}>
                            <Typography variant="h6" gutterBottom>
                                Andamento Test
                            </Typography>
                            <Box sx={{ 
                                position: 'relative',
                                height: 'calc(100% - 40px)',
                                width: '100%'
                            }}>
                                <Line options={chartOptions} data={chartData} />
                            </Box>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* Activity Section */}
                <Grid item xs={12} lg={4}>
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <Paper sx={{ p: 3, height: '400px', overflow: 'hidden' }}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mb: 2
                            }}>
                                <Typography variant="h6">
                                    Attività Recenti
                                </Typography>
                                <Button
                                    size="small"
                                    startIcon={<RefreshIcon />}
                                    sx={{ minWidth: 'auto' }}
                                >
                                    Aggiorna
                                </Button>
                            </Box>
                            <Divider sx={{ mb: 2 }} />
                            <List sx={{ 
                                overflow: 'auto',
                                height: 'calc(100% - 60px)'
                            }}>
                                {recentActivities.map((activity, index) => (
                                    <ActivityItem key={index} {...activity} index={index} />
                                ))}
                            </List>
                        </Paper>
                    </motion.div>
                </Grid>

                {/* System Status */}
                <Grid item xs={12}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <Paper sx={{ p: 3 }}>
                            <Typography variant="h6" gutterBottom>
                                Stato del Sistema
                            </Typography>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Alert severity="success" sx={{ mb: 1 }}>
                                        Tutti i sistemi sono operativi
                                    </Alert>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1">
                                        <strong>Versione:</strong> 1.0.0
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Ultimo aggiornamento:</strong> {new Date().toLocaleDateString()}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Typography variant="body1">
                                        <strong>Stato Database:</strong> Connesso
                                    </Typography>
                                    <Typography variant="body1">
                                        <strong>Latenza:</strong> 45ms
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Paper>
                    </motion.div>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;