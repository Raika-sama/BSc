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
    breadcrumbs,    // Nuovo: array di oggetti { text, path }
    helpText,       // Nuovo: testo di aiuto per la pagina
    onBack,         // Nuovo: callback per navigazione indietro
    loading,        // Nuovo: stato di caricamento
    animation = true // Nuovo: abilita/disabilita animazioni
}) => {
    const customTheme = useTheme();
    const isDarkMode = customTheme.palette.mode === 'dark';

    return (
        <Fade in={!loading} timeout={animation ? 500 : 0}>
            <Box
                sx={{
                    flex: 1,
                    p: 3,
                    transition: 'all 0.3s ease',
                    ...contentProps
                }}
            >
                {/* Header Section */}
                <Box
                    sx={{
                        mb: 4,
                        ...headerProps
                    }}
                >
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
                                        color: isDarkMode 
                                            ? customTheme.palette.primary.light 
                                            : customTheme.palette.primary.main,
                                        mb: subtitle ? 1 : 0,
                                        transition: 'color 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1
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
                        opacity: loading ? 0.5 : 1
                    }}
                >
                    {children}
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