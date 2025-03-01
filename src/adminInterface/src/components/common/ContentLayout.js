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
import { useTheme as useMuiTheme } from '@mui/material/styles';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import KeyboardBackspaceIcon from '@mui/icons-material/KeyboardBackspace';
import { useTheme as useAppTheme } from '../../context/ThemeContext/ThemeContextIndex'; // Aggiusta il percorso se necessario

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
    const muiTheme = useMuiTheme();
    const { isBicolorTheme, currentTheme } = useAppTheme();
    
    // Determina se il tema corrente è bicolore
    const isCurrentThemeBicolor = isBicolorTheme(currentTheme);
    const isDarkMode = muiTheme.palette.mode === 'dark';

    // Definizione degli stili in base al tema
    const styles = {
        wrapper: {
            background: isDarkMode
                ? alpha(muiTheme.palette.background.default, 0.6)
                : muiTheme.palette.background.default,
            borderRadius: 2,
            transition: 'all 0.3s ease',
        },
        contentBox: {
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: isDarkMode
                ? alpha(muiTheme.palette.background.paper, 0.85)
                : muiTheme.palette.background.paper,
            boxShadow: isDarkMode
                ? `0 4px 20px ${alpha(muiTheme.palette.common.black, 0.35)}`
                : `0 4px 20px ${alpha(muiTheme.palette.primary.main, 0.15)}`,
            backgroundImage: `linear-gradient(135deg, 
                ${alpha(muiTheme.palette.background.paper, isDarkMode ? 0.98 : 1)} 0%,
                ${alpha(muiTheme.palette.background.paper, isDarkMode ? 0.95 : 0.98)} 50%,
                ${alpha(muiTheme.palette.background.paper, isDarkMode ? 0.92 : 0.95)} 100%)`,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            p: 3,
            '&:hover': {
                boxShadow: isDarkMode
                    ? `0 6px 25px ${alpha(muiTheme.palette.common.black, 0.45)}`
                    : `0 6px 25px ${alpha(muiTheme.palette.primary.main, 0.25)}`,
            }
        },
        title: {
            fontWeight: 600,
            background: (() => {
                if (isCurrentThemeBicolor) {
                    // Se è un tema bicolore, usa un gradiente tra primario e secondario
                    return isDarkMode
                        ? `linear-gradient(135deg, 
                            ${muiTheme.palette.primary.main}, 
                            ${muiTheme.palette.secondary.main})`
                        : `linear-gradient(135deg, 
                            ${muiTheme.palette.primary.main}, 
                            ${muiTheme.palette.secondary.main})`;
                } else {
                    // Se è un tema monocolore, usa il gradiente con variazioni del colore primario
                    return isDarkMode
                        ? `linear-gradient(135deg, 
                            ${muiTheme.palette.primary.main}, 
                            ${muiTheme.palette.primary.light})`
                        : `linear-gradient(135deg, 
                            ${muiTheme.palette.primary.main}, 
                            ${muiTheme.palette.primary.dark})`;
                }
            })(),
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            transition: 'all 0.3s ease',
            '&:hover': {
                transform: 'scale(1.01)',
                background: (() => {
                    if (isCurrentThemeBicolor) {
                        // Inverti il gradiente all'hover per temi bicolore
                        return isDarkMode
                            ? `linear-gradient(135deg, 
                                ${muiTheme.palette.secondary.main}, 
                                ${muiTheme.palette.primary.main})`
                            : `linear-gradient(135deg, 
                                ${muiTheme.palette.secondary.main}, 
                                ${muiTheme.palette.primary.main})`;
                    } else {
                        // Inverti il gradiente all'hover per temi monocolore
                        return isDarkMode
                            ? `linear-gradient(135deg, 
                                ${muiTheme.palette.primary.light}, 
                                ${muiTheme.palette.primary.main})`
                            : `linear-gradient(135deg, 
                                ${muiTheme.palette.primary.dark}, 
                                ${muiTheme.palette.primary.main})`;
                    }
                })(),
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
            }
        },
        breadcrumbs: {
            '& .MuiLink-root': {
                color: muiTheme.palette.text.secondary,
                fontSize: '0.875rem',
                transition: 'color 0.2s',
                '&:hover': {
                    color: muiTheme.palette.primary.main
                }
            }
        },
        backButton: {
            color: muiTheme.palette.text.secondary,
            '&:hover': {
                color: muiTheme.palette.primary.main,
                backgroundColor: alpha(muiTheme.palette.primary.main, 0.08)
            }
        },
        helpIcon: {
            fontSize: '1.2rem',
            color: muiTheme.palette.text.secondary,
            cursor: 'help'
        },
        subtitle: {
            color: muiTheme.palette.text.secondary,
            opacity: 0.8,
            transition: 'color 0.3s ease'
        }
    };

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
                    ...styles.wrapper
                }}
            >
                <Box sx={styles.contentBox}>
                    {/* Header Section */}
                    <Box sx={{ mb: 4, ...headerProps }}>
                        {/* Breadcrumbs */}
                        {breadcrumbs && (
                            <Breadcrumbs sx={styles.breadcrumbs}>
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
                                        sx={styles.backButton}
                                    >
                                        <KeyboardBackspaceIcon />
                                    </IconButton>
                                )}
                                <Box>
                                    <Typography
                                        variant="h4"
                                        sx={styles.title}
                                    >
                                        {title}
                                        {helpText && (
                                            <Tooltip title={helpText} arrow>
                                                <HelpOutlineIcon sx={styles.helpIcon} />
                                            </Tooltip>
                                        )}
                                    </Typography>
                                    {subtitle && (
                                        <Typography 
                                            variant="subtitle1" 
                                            sx={styles.subtitle}
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

// PropTypes rimangono gli stessi
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