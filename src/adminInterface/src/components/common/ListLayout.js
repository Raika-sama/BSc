// src/components/common/ListLayout.js
import React from 'react';
import PropTypes from 'prop-types';
import { Box, Paper, Collapse, Grid, alpha } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../school/schoolComponents/StatCard';
import { DataGrid } from '@mui/x-data-grid';

const ListLayout = ({
    statsCards,
    isFilterOpen,
    filterComponent,
    rows,
    columns,
    getRowId,
    pageSize,
    onPageSizeChange,
    tabsComponent,
    paginationMode = "client",
    rowCount,
    page,
    onPageChange,
    loading,
    sx
}) => {
    const standardDataGridStyle = {
        border: 'none',
        '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
            py: 1
        },
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: alpha('#1976d2', 0.02),
            borderBottom: 2,
            borderColor: 'divider'
        },
        '& .MuiDataGrid-row': {
            '&:hover': {
                backgroundColor: alpha('#1976d2', 0.04)
            }
        },
        '& .MuiDataGrid-footerContainer': {
            borderTop: 2,
            borderColor: 'divider'
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none'
        },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none'
        }
    };

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
                                borderColor: 'divider',
                                bgcolor: 'background.paper'
                            }}
                        >
                            {filterComponent}
                        </Paper>
                    </Collapse>
                )}
            </AnimatePresence>

            {/* Main Content con Tabs e DataGrid */}
            <Paper 
                elevation={0}
                sx={{
                    height: 650,
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.paper'
                }}
            >
                {/* Tabs Section */}
                {tabsComponent}

                {/* DataGrid Section */}
                <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: tabsComponent ? 'calc(100% - 48px)' : '100%'
                }}>
                    <DataGrid
                        rows={rows}
                        columns={columns}
                        getRowId={getRowId}
                        pageSize={pageSize}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        onPageSizeChange={onPageSizeChange}
                        paginationMode={paginationMode}
                        rowCount={rowCount}
                        page={page}
                        onPageChange={onPageChange}
                        loading={loading}
                        disableSelectionOnClick
                        sx={standardDataGridStyle}
                        density="comfortable"
                    />
                </Box>
            </Paper>
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
    rows: PropTypes.array.isRequired,
    columns: PropTypes.array.isRequired,
    getRowId: PropTypes.func.isRequired,
    pageSize: PropTypes.number,
    onPageSizeChange: PropTypes.func,
    tabsComponent: PropTypes.node,
    paginationMode: PropTypes.oneOf(['client', 'server']),
    rowCount: PropTypes.number,
    page: PropTypes.number,
    onPageChange: PropTypes.func,
    loading: PropTypes.bool,
    sx: PropTypes.object
};

export default ListLayout;