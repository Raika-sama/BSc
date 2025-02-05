// src/components/students/StatCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Grid } from '@mui/material';
import {
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    AccessibilityNew as AccessibilityIcon,
    HourglassEmpty as PendingIcon,
    School as SchoolIcon
} from '@mui/icons-material';

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
            icon: <PeopleIcon sx={{ color: '#1976d2' }} />,
            color: '#1976d2',
            subtitle: 'Totale studenti registrati'
        },
        {
            title: 'Studenti Attivi',
            value: stats.activeStudents,
            icon: <CheckCircleIcon sx={{ color: '#2e7d32' }} />,
            color: '#2e7d32',
            subtitle: `${((stats.activeStudents / stats.totalStudents) * 100).toFixed(1)}% del totale`
        },
        {
            title: 'In Attesa',
            value: stats.pendingStudents,
            icon: <PendingIcon sx={{ color: '#ed6c02' }} />,
            color: '#ed6c02',
            subtitle: 'Studenti in fase di registrazione'
        },
        {
            title: 'Necessità Speciali',
            value: stats.specialNeedsStudents,
            icon: <AccessibilityIcon sx={{ color: '#9c27b0' }} />,
            color: '#9c27b0',
            subtitle: 'Studenti con supporto dedicato'
        },
        {
            title: 'Assegnati',
            value: stats.assignedStudents,
            icon: <SchoolIcon sx={{ color: '#0288d1' }} />,
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
                        <StatsCardsLayout cards={[card]} spacing={0} maxColumns={1} />
                    </motion.div>
                </Grid>
            ))}
        </Grid>
    );
};

export default StatCards;