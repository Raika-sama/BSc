// SectionStats.js
import React from 'react';
import { Grid, Card, CardContent, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import ClassIcon from '@mui/icons-material/Class';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


const StatsCard = ({ icon, title, value, color, index }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
    >
        <Card elevation={1}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    {icon}
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {title}
                        </Typography>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 + 0.3 }}
                        >
                            <Typography variant="h6" sx={{ fontSize: '1.25rem', color: `${color}.main` }}>
                                {value}
                            </Typography>
                        </motion.div>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    </motion.div>
);

const SectionStats = ({ sections }) => {
    const stats = [
        {
            icon: <ClassIcon color="primary" sx={{ fontSize: '1.5rem' }} />,
            title: 'Sezioni Totali',
            value: sections.length,
            color: 'primary'
        },
        {
            icon: <CheckCircleIcon color="success" sx={{ fontSize: '1.5rem' }} />,
            title: 'Sezioni Attive',
            value: sections.filter(s => s.isActive).length,
            color: 'success'
        },
        {
            icon: <GroupIcon color="info" sx={{ fontSize: '1.5rem' }} />,
            title: 'Studenti Totali',
            value: sections.reduce((acc, s) => acc + (s.studentsCount || 0), 0),
            color: 'info'
        }
    ];

    return (
        <Grid container spacing={2} sx={{ mb: 3 }}>
            {stats.map((stat, index) => (
                <Grid item xs={12} sm={4} key={index}>
                    <StatsCard {...stat} />
                </Grid>
            ))}
        </Grid>
    );
};

export default SectionStats;