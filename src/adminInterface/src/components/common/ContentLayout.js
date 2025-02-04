import React from 'react';
import PropTypes from 'prop-types';
import { 
    alpha, 
    Box, 
    Typography, 
    Breadcrumbs,
    Link,
    Fade,
    Tooltip,
    IconButton
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';

const ContentLayout = ({ 
    title, 
    subtitle, 
    actions,
    children, 
    headerProps, 
    contentProps,
    breadcrumbs,
    helpText,
    onBack,
    loading,
    animation = true
}) => {
    const customTheme = useTheme();
    const isDarkMode = customTheme.palette.mode === 'dark';

    return (
        <Fade 
            in={!loading} 
            timeout={animation ? 800 : 0}
            sx={{
                '& > *': {
                    animation: loading ? 'none' : 'slideIn 0.5s ease-out'
                },
                '@keyframes slideIn': {
                    '0%': {
                        opacity: 0,
                        transform: 'translateY(20px)'
                    },
                    '100%': {
                        opacity: 1,
                        transform: 'translateY(0)'
                    }
                }
            }}
        >
            <Box
                sx={{
                    flex: 1,
                    p: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: theme => `linear-gradient(45deg, 
                            ${alpha(theme.palette.primary.main, 0)} 30%, 
                            ${alpha(theme.palette.primary.light, 0.03)} 50%,
                            ${alpha(theme.palette.primary.main, 0)} 70%)`,
                        animation: 'shimmerContent 3s infinite',
                        pointerEvents: 'none'
                    },
                    '@keyframes shimmerContent': {
                        '0%': { transform: 'translateX(-100%)' },
                        '100%': { transform: 'translateX(100%)' }
                    }
                }}
            >
                <Box
                    sx={{
                        borderRadius: 3,
                        overflow: 'hidden',
                        bgcolor: theme => theme.palette.mode === 'dark'
                            ? alpha(theme.palette.background.paper, 0.85)
                            : theme.palette.background.paper,
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(0,0,0,0.35)'
                            : '0 4px 20px rgba(100, 181, 246, 0.15)',
                        backgroundImage: theme => theme.palette.mode === 'dark'
                            ? `linear-gradient(135deg, 
                                ${alpha(theme.palette.background.paper, 0.98)} 0%,
                                ${alpha(theme.palette.background.paper, 0.95)} 50%,
                                ${alpha(theme.palette.background.paper, 0.92)} 100%)`
                            : `linear-gradient(135deg, 
                                ${alpha(theme.palette.background.paper, 1)} 0%,
                                ${alpha(theme.palette.background.paper, 0.98)} 50%,
                                ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        p: 3, // Aggiunto padding interno
                        '&:hover': {
                            boxShadow: theme => theme.palette.mode === 'dark'
                                ? '0 6px 25px rgba(0,0,0,0.45)'
                                : '0 6px 25px rgba(100, 181, 246, 0.25)',
                        }
                    }}
                >
                    {/* Header Section */}
                    <Box sx={{ mb: 4, ...headerProps }}>
                        {/* Breadcrumbs */}
                        {breadcrumbs && (
                            <Breadcrumbs 
                                sx={{ 
                                    mb: 2,
                                    '& .MuiLink-root': {
                                        color: 'text.secondary',
                                        fontSize: '0.875rem',
                                        transition: 'color 0.2s',
                                        '&:hover': {
                                            color: 'primary.main'
                                        }
                                    }
                                }}
                            >
                                {breadcrumbs.map((crumb, index) => (
                                    <Link
                                        key={index}
                                        color="inherit"
                                        href={crumb.path}
                                        sx={{ 
                                            cursor: 'pointer',
                                            textDecoration: 'none'
                                        }}
                                    >
                                        {crumb.text}
                                    </Link>
                                ))}
                                <Typography color="text.primary" fontSize="0.875rem">
                                    {title}
                                </Typography>
                            </Breadcrumbs>
                        )}

                        {/* Title Section */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'flex-start'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {onBack && (
                                    <IconButton 
                                        onClick={onBack}
                                        sx={{ 
                                            mr: 1,
                                            color: 'text.secondary',
                                            '&:hover': {
                                                color: 'primary.main',
                                                backgroundColor: alpha(customTheme.palette.primary.main, 0.08)
                                            }
                                        }}
                                    >
                                        <KeyboardBackspaceIcon />
                                    </IconButton>
                                )}
                                <Box>
                                    <Typography
                                        variant="h4"
                                        sx={{
                                            fontWeight: 600,
                                            background: theme => theme.palette.mode === 'dark'
                                                ? `linear-gradient(135deg, 
                                                    ${theme.palette.primary.main}, 
                                                    ${theme.palette.primary.light})`
                                                : `linear-gradient(135deg, 
                                                    ${theme.palette.primary.main}, 
                                                    ${theme.palette.primary.dark})`,
                                            backgroundClip: 'text',
                                            WebkitBackgroundClip: 'text',
                                            color: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1,
                                            transition: 'all 0.3s ease',
                                            '&:hover': {
                                                transform: 'scale(1.01)',
                                                background: theme => theme.palette.mode === 'dark'
                                                    ? `linear-gradient(135deg, 
                                                        ${theme.palette.primary.light}, 
                                                        ${theme.palette.primary.main})`
                                                    : `linear-gradient(135deg, 
                                                        ${theme.palette.primary.dark}, 
                                                        ${theme.palette.primary.main})`,
                                                backgroundClip: 'text',
                                                WebkitBackgroundClip: 'text',
                                            }
                                        }}
                                    >
                                        {title}
                                        {helpText && (
                                            <Tooltip title={helpText} arrow>
                                                <HelpOutlineIcon 
                                                    sx={{ 
                                                        fontSize: '1.2rem',
                                                        color: 'text.secondary',
                                                        cursor: 'help'
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </Typography>
                                    {subtitle && (
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={{ 
                                                color: 'text.secondary',
                                                opacity: 0.8,
                                                transition: 'color 0.3s ease'
                                            }}
                                        >
                                            {subtitle}
                                        </Typography>
                                    )}
                                </Box>
                            </Box>
                            
                            {/* Actions */}
                            {actions && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {actions}
                                </Box>
                            )}
                        </Box>
                    </Box>
                    
                    {/* Content Section */}
                    <Box 
                        sx={{ 
                            height: 'calc(100% - 80px)',
                            overflow: 'auto',
                            transition: 'opacity 0.3s ease',
                            opacity: loading ? 0.5 : 1,
                            ...contentProps
                        }}
                    >
                        {children}
                    </Box>
                </Box>
            </Box>
        </Fade>
    );
};

ContentLayout.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    actions: PropTypes.node,
    children: PropTypes.node,
    headerProps: PropTypes.object,
    contentProps: PropTypes.object,
    breadcrumbs: PropTypes.arrayOf(
        PropTypes.shape({
            text: PropTypes.string.isRequired,
            path: PropTypes.string.isRequired
        })
    ),
    helpText: PropTypes.string,
    onBack: PropTypes.func,
    loading: PropTypes.bool,
    animation: PropTypes.bool
};

export default ContentLayout;