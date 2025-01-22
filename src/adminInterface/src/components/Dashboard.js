import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Alert,
    Fade,
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
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    Refresh as RefreshIcon
} from '@mui/icons-material';
import { Line } from 'react-chartjs-2';
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
import { useAuth } from '../context/AuthContext';

// Registrazione dei componenti necessari per Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

// Componente StatCard migliorato
const StatCard = ({ title, value, icon, color, trend, percentage }) => {
    const theme = useTheme();
    
    return (
        <Card sx={{ 
            height: '100%',
            transition: 'transform 0.3s',
            '&:hover': {
                transform: 'translateY(-5px)',
                boxShadow: theme.shadows[4]
            }
        }}>
            <CardHeader
                avatar={
                    <Box
                        sx={{
                            backgroundColor: `${color}.light`,
                            borderRadius: 2,
                            p: 1.5,
                            display: 'flex',
                        }}
                    >
                        {icon}
                    </Box>
                }
                action={
                    <IconButton size="small">
                        <RefreshIcon />
                    </IconButton>
                }
            />
            <CardContent>
                <Typography variant="h4" component="div" gutterBottom>
                    {value}
                </Typography>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                        {title}
                    </Typography>
                    {trend && (
                        <Box display="flex" alignItems="center" sx={{ color: trend === 'up' ? 'success.main' : 'error.main' }}>
                            {trend === 'up' ? <ArrowUpwardIcon fontSize="small" /> : <ArrowDownwardIcon fontSize="small" />}
                            <Typography variant="body2" component="span" sx={{ ml: 0.5 }}>
                                {percentage}%
                            </Typography>
                        </Box>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

// Componente ActivityItem
const ActivityItem = ({ icon, primary, secondary, color }) => (
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

    // Dati per il grafico
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

    // Attività recenti mockup
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
        <Box sx={{ flexGrow: 1 }}>
            {/* Header Welcome */}
            <Paper 
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.dark} 90%)`,
                    color: 'white'
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

            {/* Stats Grid */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={500}>
                        <Box>
                            <StatCard
                                title="Scuole"
                                value={stats.schools.value}
                                icon={<SchoolIcon color="primary" />}
                                color="primary"
                                trend={stats.schools.trend}
                                percentage={stats.schools.percentage}
                            />
                        </Box>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={700}>
                        <Box>
                            <StatCard
                                title="Utenti"
                                value={stats.users.value}
                                icon={<PersonIcon color="success" />}
                                color="success"
                                trend={stats.users.trend}
                                percentage={stats.users.percentage}
                            />
                        </Box>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={900}>
                        <Box>
                            <StatCard
                                title="Classi"
                                value={stats.classes.value}
                                icon={<ClassIcon color="warning" />}
                                color="warning"
                                trend={stats.classes.trend}
                                percentage={stats.classes.percentage}
                            />
                        </Box>
                    </Fade>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Fade in={true} timeout={1100}>
                        <Box>
                            <StatCard
                                title="Test"
                                value={stats.tests.value}
                                icon={<TestIcon color="error" />}
                                color="error"
                                trend={stats.tests.trend}
                                percentage={stats.tests.percentage}
                            />
                        </Box>
                    </Fade>
                </Grid>
            </Grid>

            {/* Main Content */}
            <Grid container spacing={3}>
                {/* Chart Section */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Typography variant="h6" gutterBottom>
                            Andamento Test
                        </Typography>
                        <Box sx={{ height: 'calc(100% - 40px)' }}>
                            <Line options={chartOptions} data={chartData} />
                        </Box>
                    </Paper>
                </Grid>

                {/* Activity Section */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '400px' }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="h6">
                                Attività Recenti
                            </Typography>
                            <Button size="small" startIcon={<RefreshIcon />}>
                                Aggiorna
                            </Button>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        <List>
                            {recentActivities.map((activity, index) => (
                                <ActivityItem key={index} {...activity} />
                            ))}
                        </List>
                    </Paper>
                </Grid>

                {/* System Status */}
                <Grid item xs={12}>
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
                </Grid>
            </Grid>
        </Box>
    );
};

export default Dashboard;