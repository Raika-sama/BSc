// src/components/common/ListLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Collapse, Grid } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../school/schoolComponents/StatCard';

const ListLayout = ({
    statsCards,
    isFilterOpen,
    filterComponent,
    listComponent,
    paginationComponent,
    sx
}) => {
    return (
        <Box 
            sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                height: '100%',
                gap: 3,
                ...sx
            }}
        >
            {/* Stats Cards */}
            {statsCards && statsCards.length > 0 && (
                <Grid container spacing={2}>
                    {statsCards.map((cardProps, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <StatCard {...cardProps} />
                            </motion.div>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Filtri Collassabili */}
            <AnimatePresence>
                {isFilterOpen && filterComponent && (
                    <Collapse in={isFilterOpen}>
                        <Paper 
                            elevation={0}
                            sx={{ 
                                p: 2, 
                                borderRadius: 2,
                                border: '1px solid',
                                borderColor: 'divider'
                            }}
                        >
                            {filterComponent}
                        </Paper>
                    </Collapse>
                )}
            </AnimatePresence>

            {/* Lista Component */}
            <Paper 
                elevation={0}
                sx={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: 400
                }}
            >
                {listComponent}
            </Paper>

            {/* Paginazione */}
            {paginationComponent}
        </Box>
    );
};

ListLayout.propTypes = {
    statsCards: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string.isRequired,
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        icon: PropTypes.node.isRequired,
        color: PropTypes.string.isRequired
    })),
    isFilterOpen: PropTypes.bool,
    filterComponent: PropTypes.node,
    listComponent: PropTypes.node.isRequired,
    paginationComponent: PropTypes.node,
    sx: PropTypes.object
};

export default ListLayout;