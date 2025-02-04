import React from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Paper, 
    Typography, 
    Grid,
    Tooltip,
    IconButton,
    alpha,
    Skeleton 
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useTheme } from '@mui/material/styles';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip as ChartTooltip,
    Filler
} from 'chart.js';

// Registriamo i componenti necessari per Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ChartTooltip,
    Filler
);

const StatCard = ({ 
    title, 
    value, 
    icon: Icon, 
    color = 'primary',
    trend,
    trendData,
    description,
    loading,
    onClick 
}) => {
    const theme = useTheme();
    const isDark = theme.palette.mode === 'dark';

    // Configurazione per il mini grafico
    const chartData = {
        labels: trendData?.labels || [],
        datasets: [{
            data: trendData?.data || [],
            fill: true,
            borderColor: theme.palette[color].main,
            backgroundColor: alpha(theme.palette[color].main, 0.1),
            tension: 0.4,
            borderWidth: 2,
            pointRadius: 0
        }]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                enabled: false
            }
        },
        scales: {
            x: {
                display: false,
            },
            y: {
                display: false,
            }
        },
        interaction: {
            intersect: false,
        },
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            style={{ height: '100%' }}
        >
            <Paper
                elevation={0}
                onClick={onClick}
                sx={{
                    p: 3,
                    height: '100%',
                    cursor: onClick ? 'pointer' : 'default',
                    borderRadius: 2,
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    background: theme => `linear-gradient(135deg, 
                        ${alpha(theme.palette[color].main, isDark ? 0.15 : 0.05)} 0%,
                        ${alpha(theme.palette[color].main, isDark ? 0.05 : 0.02)} 100%)`,
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(135deg, 
                            ${alpha(theme.palette[color].main, 0.1)} 0%,
                            ${alpha(theme.palette[color].main, 0)} 50%,
                            ${alpha(theme.palette[color].main, 0.05)} 100%)`,
                        opacity: 0,
                        transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                        opacity: 1,
                    },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                        boxShadow: theme => `0 4px 20px ${alpha(theme.palette[color].main, 0.15)}`,
                        borderColor: theme => alpha(theme.palette[color].main, 0.3),
                    }
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2
                    }}>
                        <Box sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1 
                        }}>
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    color: 'text.secondary',
                                    fontWeight: 500
                                }}
                            >
                                {title}
                            </Typography>
                            {description && (
                                <Tooltip title={description} arrow placement="top">
                                    <IconButton size="small" sx={{ p: 0 }}>
                                        <InfoOutlinedIcon 
                                            sx={{ 
                                                fontSize: '1rem',
                                                color: 'text.secondary'
                                            }} 
                                        />
                                    </IconButton>
                                </Tooltip>
                            )}
                        </Box>
                        {Icon && (
                            <Box
                                sx={{
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: theme => alpha(theme.palette[color].main, isDark ? 0.2 : 0.1),
                                    color: `${color}.main`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Icon sx={{ fontSize: '1.5rem' }} />
                            </Box>
                        )}
                    </Box>

                    {/* Value and Trend */}
                    <Box sx={{ position: 'relative' }}>
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <Skeleton 
                                    variant="text" 
                                    width={120} 
                                    height={40} 
                                    sx={{ mb: 1 }}
                                />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 600,
                                            color: 'text.primary',
                                            mb: 1
                                        }}
                                    >
                                        {value}
                                    </Typography>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {trend && (
                            <Box sx={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1
                            }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        color: trend >= 0 ? 'success.main' : 'error.main',
                                        display: 'flex',
                                        alignItems: 'center',
                                        fontWeight: 500
                                    }}
                                >
                                    {trend >= 0 ? '+' : ''}{trend}%
                                </Typography>
                                <Typography
                                    variant="caption"
                                    sx={{ color: 'text.secondary' }}
                                >
                                    vs precedente
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Mini Chart */}
                    {trendData && (
                        <Box sx={{ 
                            height: 60,
                            mt: 2,
                            opacity: loading ? 0.5 : 1,
                            transition: 'opacity 0.3s ease'
                        }}>
                            <Line data={chartData} options={chartOptions} />
                        </Box>
                    )}
                </Box>
            </Paper>
        </motion.div>
    );
};

const StatCardsLayout = ({ 
    cards,
    loading = false,
    spacing = 3,
    minWidth = 270,
    maxColumns = 4
}) => {
    return (
        <Grid 
            container 
            spacing={spacing}
            sx={{
                minHeight: cards?.length ? 'auto' : 140, // Altezza minima se non ci sono cards
            }}
        >
            {(loading ? Array(4).fill({}) : cards).map((card, index) => (
                <Grid
                    item
                    key={index}
                    xs={12}
                    sm={6}
                    md={maxColumns === 4 ? 3 : maxColumns === 3 ? 4 : 6}
                    sx={{
                        minWidth: minWidth,
                    }}
                >
                    <StatCard {...card} loading={loading} />
                </Grid>
            ))}
        </Grid>
    );
};

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    icon: PropTypes.elementType,
    color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
    trend: PropTypes.number,
    trendData: PropTypes.shape({
        labels: PropTypes.arrayOf(PropTypes.string),
        data: PropTypes.arrayOf(PropTypes.number)
    }),
    description: PropTypes.string,
    loading: PropTypes.bool,
    onClick: PropTypes.func
};

StatCardsLayout.propTypes = {
    cards: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        icon: PropTypes.elementType,
        color: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info']),
        trend: PropTypes.number,
        trendData: PropTypes.shape({
            labels: PropTypes.arrayOf(PropTypes.string),
            data: PropTypes.arrayOf(PropTypes.number)
        }),
        description: PropTypes.string,
        onClick: PropTypes.func
    })),
    loading: PropTypes.bool,
    spacing: PropTypes.number,
    minWidth: PropTypes.number,
    maxColumns: PropTypes.oneOf([2, 3, 4])
};

export default StatCardsLayout;