// src/components/StudentList/StatCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import {
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    AccessibilityNew as AccessibilityIcon,
    HourglassEmpty as PendingIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
            <CardContent sx={{ p: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box
                        sx={{
                            bgcolor: `${color}15`,
                            borderRadius: '8px',
                            p: 0.75,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Icon sx={{ color, fontSize: '1.2rem' }} />
                    </Box>
                    <Typography 
                        color="textSecondary" 
                        variant="body2"
                        sx={{ ml: 1, fontWeight: 500, fontSize: '0.875rem' }}
                    >
                        {title}
                    </Typography>
                </Box>
                <Typography 
                    variant="h5" 
                    component="div" 
                    sx={{ 
                        color: 'text.primary', 
                        mb: 0.25,  // Ridotto da 0.5 a 0.25
                        fontSize: '1.5rem'  // Aggiunto fontSize più piccolo
                    }}
                >
                    {value}
                </Typography>
                {subtitle && (
                    <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}  // Ridotto il font size del sottotitolo
                    >
                        {subtitle}
                    </Typography>
                )}
            </CardContent>
        </Card>
    </motion.div>
);

export const StatCards = ({ students = [] }) => {
    const stats = {
        totalStudents: students.length,
        activeStudents: students.filter(s => s.status === 'active').length,
        pendingStudents: students.filter(s => s.status === 'pending').length,
        specialNeedsStudents: students.filter(s => s.specialNeeds).length,
        assignedStudents: students.filter(s => s.classId).length
    };

    const cards = [
        {
            title: 'Studenti Totali',
            value: stats.totalStudents,
            icon: PeopleIcon,
            color: '#1976d2',
            subtitle: 'Totale studenti registrati'
        },
        {
            title: 'Studenti Attivi',
            value: stats.activeStudents,
            icon: CheckCircleIcon,
            color: '#2e7d32',
            subtitle: `${((stats.activeStudents / stats.totalStudents) * 100).toFixed(1)}% del totale`
        },
        {
            title: 'In Attesa',
            value: stats.pendingStudents,
            icon: PendingIcon,
            color: '#ed6c02',
            subtitle: 'Studenti in fase di registrazione'
        },
        {
            title: 'Necessità Speciali',
            value: stats.specialNeedsStudents,
            icon: AccessibilityIcon,
            color: '#9c27b0',
            subtitle: 'Studenti con supporto dedicato'
        },
        {
            title: 'Assegnati',
            value: stats.assignedStudents,
            icon: SchoolIcon,
            color: '#0288d1',
            subtitle: `${((stats.assignedStudents / stats.totalStudents) * 100).toFixed(1)}% assegnati a classi`
        }
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 2 }}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={2.4} key={index}>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <StatCard {...card} />
                    </motion.div>
                </Grid>
            ))}
        </Grid>
    );
};


export default StatCards;