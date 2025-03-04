import React from 'react';
import { motion } from 'framer-motion';
import {
    Box,
    Card,
    CardContent,
    Typography,
    IconButton,
    alpha,
    useTheme
} from '@mui/material';
import {
    TrendingUp,
    TrendingDown,
} from '@mui/icons-material';

const AnimatedStatCard = ({ title, value, icon, color, trend, percentage, index = 0 }) => {
    const theme = useTheme();
    const isUp = trend === 'up';
    const trendColor = isUp ? 'success.main' : 'error.main';
    const TrendIcon = isUp ? TrendingUp : TrendingDown;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
        >
            <Card 
                elevation={0}
                sx={{
                    height: '100%',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[4]
                    },
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                {/* Background decoration */}
                <Box 
                    sx={{
                        position: 'absolute',
                        top: -10,
                        right: -10,
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        backgroundColor: alpha(theme.palette[color].main, 0.1),
                        zIndex: 0
                    }}
                />
                <CardContent sx={{ position: 'relative', zIndex: 1 }}>
                    <Box 
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2
                        }}
                    >
                        <Typography variant="h6" color="textSecondary">
                            {title}
                        </Typography>
                        <Box 
                            sx={{ 
                                backgroundColor: alpha(theme.palette[color].main, 0.1), 
                                borderRadius: '50%',
                                p: 1,
                                color: `${color}.main`
                            }}
                        >
                            {icon}
                        </Box>
                    </Box>

                    <Typography 
                        variant="h4" 
                        sx={{ 
                            fontWeight: 700, 
                            mb: 1.5,
                            color: theme.palette.mode === 'light' ? 'text.primary' : 'text.primary'
                        }}
                    >
                        {value.toLocaleString()}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TrendIcon sx={{ color: trendColor, fontSize: '1rem', mr: 0.5 }} />
                        <Typography 
                            variant="body2" 
                            component="span" 
                            sx={{ color: trendColor, fontWeight: 500 }}
                        >
                            {percentage}%
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ ml: 1 }}>
                            rispetto al mese scorso
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default AnimatedStatCard;