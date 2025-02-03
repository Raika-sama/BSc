import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

const ContentLayout = ({ title, subtitle, children, headerProps, contentProps }) => {
    const customTheme = useTheme();

    return (
        <Box
            sx={{
                flex: 1,
                p: 3,
                transition: 'all 0.3s ease',
                ...contentProps
            }}
        >
            {/* Header Section */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${customTheme.palette.primary.light}, ${customTheme.palette.primary.main})`,
                    color: 'white',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        background: `radial-gradient(circle at top right, ${alpha(customTheme.palette.primary.light, 0.1)}, transparent 70%)`,
                    },
                    ...headerProps
                }}
            >
                <Box 
                    sx={{
                        display: "flex",
                        justifyContent: "space-between", 
                        alignItems: "center",
                        position: "relative",
                        zIndex: 1
                    }}
                >
                    <Box>
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 600,
                                color: 'inherit'
                            }}
                        >
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="subtitle1" color="inherit" sx={{ mt: 1, opacity: 0.8 }}>
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                </Box>
            </Paper>
            
            {/* Content Section */}
            <Box sx={{ mt: 3 }}>
                {children}
            </Box>
        </Box>
    );
};

ContentLayout.propTypes = {
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    children: PropTypes.node,
    headerProps: PropTypes.object,
    contentProps: PropTypes.object
};

export default ContentLayout;