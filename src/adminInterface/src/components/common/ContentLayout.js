// src/components/common/ContentLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { alpha, Box, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const ContentLayout = ({ 
    title, 
    subtitle, 
    actions,
    children, 
    headerProps, 
    contentProps 
}) => {
    const customTheme = useTheme();
    const isDarkMode = customTheme.palette.mode === 'dark';

    return (
        <Box
            sx={{
                flex: 1,
                p: 3,
                transition: 'all 0.3s ease',
                ...contentProps
            }}
        >
            {/* Header Section - Versione semplificata */}
            <Box
                sx={{
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    ...headerProps
                }}
            >
                <Box>
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 600,
                            color: isDarkMode 
                                ? customTheme.palette.primary.light 
                                : customTheme.palette.primary.main,
                            mb: subtitle ? 1 : 0,
                            transition: 'color 0.3s ease'
                        }}
                    >
                        {title}
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
                
                {/* Area Azioni */}
                {actions && (
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            gap: 2,
                            '& .MuiButton-outlined': {
                                borderColor: isDarkMode 
                                    ? alpha(customTheme.palette.primary.main, 0.5)
                                    : customTheme.palette.primary.main,
                                color: isDarkMode
                                    ? customTheme.palette.primary.light
                                    : customTheme.palette.primary.main,
                                '&:hover': {
                                    borderColor: customTheme.palette.primary.main,
                                    backgroundColor: isDarkMode
                                        ? alpha(customTheme.palette.primary.main, 0.1)
                                        : alpha(customTheme.palette.primary.main, 0.05)
                                }
                            },
                            '& .MuiIconButton-root': {
                                color: isDarkMode
                                    ? customTheme.palette.primary.light
                                    : customTheme.palette.primary.main
                            }
                        }}
                    >
                        {actions}
                    </Box>
                )}
            </Box>
            
            {/* Content Section */}
            <Box 
                sx={{ 
                    height: 'calc(100% - 80px)',  // sottrai l'altezza dell'header
                    overflow: 'auto'
                }}
            >
                {children}
            </Box>
        </Box>
    );
};

ContentLayout.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    actions: PropTypes.node,
    children: PropTypes.node,
    headerProps: PropTypes.object,
    contentProps: PropTypes.object
};

export default ContentLayout;