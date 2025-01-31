// src/components/ClassManagement/StatCards.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Grid, Card, CardContent, Typography, Box } from '@mui/material';
import { School, Group, PendingActions, Class } from '@mui/icons-material';

const StatCard = ({ title, value, icon: Icon, color }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
    >
        <Card>
            <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Icon sx={{ color, mr: 1, fontSize: '1.5rem' }} />
                    <Typography color="textSecondary" variant="body2">
                        {title}
                    </Typography>
                </Box>
                <Typography variant="h5" component="div" sx={{ color }}>
                    {value}
                </Typography>
            </CardContent>
        </Card>
    </motion.div>
);

export const StatCards = ({ classes = [] }) => {
    const stats = {
        totalClasses: classes.length,
        completeClasses: classes.filter(c => (c.students?.length || 0) >= (c.capacity || 0)).length,
        pendingClasses: classes.filter(c => {
            const studentCount = c.students?.length || 0;
            return studentCount > 0 && studentCount < (c.capacity || 0);
        }).length,
        totalStudents: classes.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)
    };

    const cards = [
        { title: 'Classi Totali', value: stats.totalClasses, icon: Class, color: 'primary.main' },
        { title: 'Classi Complete', value: stats.completeClasses, icon: School, color: 'success.main' },
        { title: 'Classi in Attesa', value: stats.pendingClasses, icon: PendingActions, color: 'warning.main' },
        { title: 'Studenti Totali', value: stats.totalStudents, icon: Group, color: 'info.main' }
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {cards.map((card, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
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