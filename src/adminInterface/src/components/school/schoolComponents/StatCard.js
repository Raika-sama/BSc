// src/components/school/components/StatCard.js
import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, icon, color }) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.2 }}
    >
        <Card 
            elevation={0}
            sx={{
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
            }}
        >
            <CardContent sx={{ 
                p: 2,
                '&:last-child': { pb: 2 }
            }}>
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2
                }}>
                    <Box sx={{ 
                        color: color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: `${color}15`,
                        borderRadius: 1,
                        p: 1
                    }}>
                        {icon}
                    </Box>
                    <Box>
                        <Typography 
                            variant="body2" 
                            color="textSecondary"
                            gutterBottom
                        >
                            {title}
                        </Typography>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                color: color,
                                fontWeight: 500
                            }}
                        >
                            {value}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    </motion.div>
);

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.node.isRequired,
    color: PropTypes.string.isRequired
};

export default StatCard;