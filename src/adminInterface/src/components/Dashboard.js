// src/adminInterface/src/components/Dashboard.js
import React from 'react';
import {
    Box,
    Grid,
    Paper,
    Typography,
    Card,
    CardContent,
    CardHeader,
} from '@mui/material';
import {
    School as SchoolIcon,
    Person as PersonIcon,
    Class as ClassIcon,
    Assignment as TestIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ title, value, icon, color }) => (
    <Card sx={{ height: '100%' }}>
        <CardHeader
            avatar={
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
            }
        />
        <CardContent>
            <Typography variant="h5" component="div">
                {value}
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {title}
            </Typography>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const { user } = useAuth();

    // Questi saranno sostituiti con dati reali in futuro
    const stats = {
        schools: 0,
        users: 0,
        classes: 0,
        tests: 0,
    };

    return (
        <Box>
            {/* Welcome Section */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Benvenuto, {user?.firstName}!
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    {new Date().toLocaleDateString('it-IT', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                </Typography>
            </Paper>

            {/* Stats Grid */}
            <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Scuole"
                        value={stats.schools}
                        icon={<SchoolIcon color="primary" />}
                        color="primary"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Utenti"
                        value={stats.users}
                        icon={<PersonIcon color="success" />}
                        color="success"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Classi"
                        value={stats.classes}
                        icon={<ClassIcon color="warning" />}
                        color="warning"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Test"
                        value={stats.tests}
                        icon={<TestIcon color="error" />}
                        color="error"
                    />
                </Grid>
            </Grid>

            {/* Activity Section */}
            <Paper sx={{ p: 3, mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Informazioni Sistema
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1">
                            <strong>Ruolo:</strong> {user?.role}
                        </Typography>
                        <Typography variant="body1">
                            <strong>Email:</strong> {user?.email}
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Typography variant="body1">
                            <strong>Ultimo accesso:</strong>{' '}
                            {new Date().toLocaleString('it-IT')}
                        </Typography>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default Dashboard;