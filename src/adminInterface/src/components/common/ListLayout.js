import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Paper, 
    Collapse, 
    Grid, 
    alpha,
    Button,
    TextField,
    InputAdornment,
    Typography,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    Tooltip,
    CircularProgress,
    Fade
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import StatCard from '../school/schoolComponents/StatCard';
import { DataGrid } from '@mui/x-data-grid';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewColumnIcon from '@mui/icons-material/ViewColumn';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useTheme } from '@mui/material/styles';

const ListLayout = ({
    statsCards,
    isFilterOpen: propIsFilterOpen, // rinominiamo per chiarezza
    filterComponent,
    rows = [],
    columns,
    getRowId,
    pageSize = 10,
    onPageSizeChange,
    tabsComponent,
    paginationMode = "client",
    rowCount,
    page,
    onPageChange,
    loading,
    onRefresh,
    onExport,
    searchPlaceholder,
    onSearch,
    customActions,
    emptyStateMessage = "Nessun dato disponibile",
    sx,
    error,
    checkboxSelection,
    onSelectionModelChange,
    selectionModel
}) => {
    const theme = useTheme();
    const [searchValue, setSearchValue] = useState('');
    const [columnsMenu, setColumnsMenu] = useState(null);
    const [localIsFilterOpen, setLocalIsFilterOpen] = useState(false); // stato locale per i filtri
    const [visibleColumns, setVisibleColumns] = useState(
        columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
    );

     // Usiamo lo stato dei filtri da props se fornito, altrimenti usiamo lo stato locale
     const isFilterOpen = propIsFilterOpen !== undefined ? propIsFilterOpen : localIsFilterOpen;
     const setIsFilterOpen = (value) => {
         if (propIsFilterOpen !== undefined) {
             // Se il componente padre gestisce lo stato, propaghiamo il cambiamento
             if (typeof propIsFilterOpen === 'function') {
                 propIsFilterOpen(value);
             }
         } else {
             // Altrimenti usiamo lo stato locale
             setLocalIsFilterOpen(value);
         }
     };

    const handleColumnToggle = (field) => {
        setVisibleColumns(prev => ({
            ...prev,
            [field]: !prev[field]
        }));
    };


    const standardDataGridStyle = {
        border: 'none',
        '& .MuiDataGrid-cell': {
            fontSize: '0.875rem',
            py: 1,
            transition: 'all 0.2s ease'
        },
        '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme => theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.15)
                : alpha(theme.palette.primary.main, 0.08),
            backgroundImage: theme => `linear-gradient(135deg, 
                ${alpha(theme.palette.primary.main, 0.12)} 0%,
                ${alpha(theme.palette.primary.light, 0.08)} 50%,
                ${alpha(theme.palette.primary.main, 0.12)} 100%)`,
            borderBottom: 1,
            borderColor: 'divider'
        },
        '& .MuiDataGrid-row': {
            transition: 'all 0.2s ease',
            '&:nth-of-type(even)': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.05)
                    : alpha(theme.palette.primary.light, 0.05),
            },
            '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.12)
                    : alpha(theme.palette.primary.light, 0.12),
                transform: 'translateY(-1px)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }
        },
        // Qui aggiungiamo lo stile per le righe selezionate
        '& .MuiDataGrid-row.Mui-selected': {
            backgroundColor: theme => theme.palette.mode === 'dark'
                ? alpha(theme.palette.primary.main, 0.2)
                : alpha(theme.palette.primary.light, 0.2),
            '&:hover': {
                backgroundColor: theme => theme.palette.mode === 'dark'
                    ? alpha(theme.palette.primary.main, 0.25)
                    : alpha(theme.palette.primary.light, 0.25),
            }
        },
        '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none'
        },
        '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none'
        },
        ...sx
    };

    const loadingOverlay = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: alpha(theme.palette.background.paper, 0.7),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s ease'
    };

    const toolbarButton = {
        transition: 'all 0.2s ease',
        borderRadius: 2,
        '&:hover': {
            backgroundColor: theme => alpha(theme.palette.primary.main, 0.08),
            transform: 'translateY(-1px)',
        },
        '&:active': {
            transform: 'translateY(0)'
        }
    };
    

    return (
        <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 3, 
                height: '100%',
                minHeight: '100vh' // Questo assicura che il container occupi almeno tutta l'altezza della viewport
            }}>            
            {/* Stat Cards */}
            {statsCards?.length > 0 && (
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

            {/* Toolbar */}
            <Box sx={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: 2, 
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                    {onSearch && (
                        <TextField
                            size="small"
                            placeholder={searchPlaceholder || "Cerca..."}
                            value={searchValue}
                            onChange={(e) => {
                                setSearchValue(e.target.value);
                                onSearch(e.target.value);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                )
                            }}
                            sx={{ 
                                minWidth: 250,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2
                                }
                            }}
                        />
                    )}

                    {filterComponent && (
                        <Button
                            variant={isFilterOpen ? "contained" : "outlined"}
                            startIcon={<FilterListIcon />}
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            sx={{ 
                                borderRadius: 2,
                                textTransform: 'none'
                            }}
                        >
                            Filtri
                            {isFilterOpen && (
                                <Chip 
                                    label="Attivi" 
                                    size="small" 
                                    sx={{ ml: 1, height: 20 }}
                                />
                            )}
                        </Button>
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1 }}>
                    {customActions}

                    {onRefresh && (
                        <IconButton 
                            onClick={onRefresh}
                            disabled={loading}
                            sx={{
                                ...toolbarButton,
                                '& svg': {
                                    transition: 'transform 0.3s ease',
                                },
                                '&:hover svg': {
                                    transform: 'rotate(180deg)'
                                }
                            }}
                        >
                            <RefreshIcon />
                        </IconButton>
                    )}

                    <Tooltip title="Gestisci colonne">
                        <IconButton onClick={(e) => setColumnsMenu(e.currentTarget)}>
                            <ViewColumnIcon />
                        </IconButton>
                    </Tooltip>

                    {onExport && (
                        <Tooltip title="Esporta">
                            <IconButton onClick={onExport}>
                                <FileDownloadIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
            </Box>

            {/* Filters */}
            <AnimatePresence>
                {isFilterOpen && filterComponent && (
                    <Collapse 
                        in={isFilterOpen}
                        timeout={300}
                    >
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Paper 
                                elevation={0}
                                sx={{ 
                                    p: 2, 
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    background: theme => `linear-gradient(135deg, 
                                        ${alpha(theme.palette.background.paper, 0.95)} 0%,
                                        ${alpha(theme.palette.background.paper, 1)} 50%,
                                        ${alpha(theme.palette.background.paper, 0.95)} 100%)`,
                                    backdropFilter: 'blur(8px)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                                    }
                                }}
                            >
                                {filterComponent}
                            </Paper>
                        </motion.div>
                    </Collapse>
                )}
            </AnimatePresence>

            {/* Columns Menu */}
            <Menu
                anchorEl={columnsMenu}
                open={Boolean(columnsMenu)}
                onClose={() => setColumnsMenu(null)}
                TransitionComponent={Fade}
                PaperProps={{
                    sx: {
                        maxHeight: 300,
                        width: 250,
                        borderRadius: 2,
                        backdropFilter: 'blur(8px)',
                        backgroundColor: theme => alpha(theme.palette.background.paper, 0.95),
                        boxShadow: theme => theme.palette.mode === 'dark'
                            ? '0 4px 20px rgba(0,0,0,0.3)'
                            : '0 4px 20px rgba(100, 181, 246, 0.2)',
                        '& .MuiMenuItem-root': {
                            borderRadius: 1,
                            mx: 1,
                            my: 0.5,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                                backgroundColor: theme => alpha(theme.palette.primary.main, 0.08),
                                transform: 'translateX(4px)'
                            }
                        }
                    }
                }}
            >
                {columns.map((column) => (
                    <MenuItem 
                        key={column.field}
                        onClick={() => handleColumnToggle(column.field)}
                        sx={{ justifyContent: 'space-between' }}
                    >
                        <Typography variant="body2">
                            {column.headerName}
                        </Typography>
                        <Chip
                            size="small"
                            label={visibleColumns[column.field] ? "Visibile" : "Nascosto"}
                            color={visibleColumns[column.field] ? "primary" : "default"}
                            sx={{ ml: 2 }}
                        />
                    </MenuItem>
                ))}
            </Menu>

            
            {/* DataGrid */}
            <Paper 
                elevation={0}
                sx={{
                    flex: 1,
                    width: '100%',
                    '& .MuiDataGrid-root': {
                        border: 'none'
                    },
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider',
                    minHeight: 400, // Aggiungiamo un'altezza minima
                    height: '100%'  // Importante per il layout flex
                }}
            >
                {tabsComponent}
                
                <Box sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    height: tabsComponent ? 'calc(100% - 48px)' : '100%', // Aggiustiamo l'altezza in base alla presenza delle tabs
                    minHeight: 400 // Altezza minima anche qui
                }}>
                    <DataGrid
                        rows={rows}
                        columns={columns.filter(col => visibleColumns[col.field])}
                        getRowId={getRowId}
                        pageSize={pageSize}
                        rowsPerPageOptions={[10, 25, 50, 100]}
                        onPageSizeChange={onPageSizeChange}
                        paginationMode={paginationMode}
                        rowCount={rowCount}
                        page={page}
                        onPageChange={onPageChange}
                        loading={loading}
                        checkboxSelection={checkboxSelection}
                        onSelectionModelChange={onSelectionModelChange}
                        selectionModel={selectionModel}
                        disableSelectionOnClick
                        autoHeight={false} // Importante: non usiamo autoHeight
                        components={{
                            LoadingOverlay: () => (
                                <Box sx={loadingOverlay}>
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <CircularProgress
                                            size={40}
                                            sx={{
                                                color: 'primary.main',
                                                '& circle': {
                                                    strokeLinecap: 'round'
                                                }
                                            }}
                                        />
                                    </motion.div>
                                </Box>
                            ),
                            NoRowsOverlay: () => (
                                <Box 
                                    display="flex" 
                                    alignItems="center" 
                                    justifyContent="center" 
                                    height="100%"
                                >
                                    <Typography color="text.secondary">
                                        {loading ? (
                                            <CircularProgress size={20} sx={{ mr: 1 }} />
                                        ) : error ? (
                                            error
                                        ) : (
                                            emptyStateMessage
                                        )}
                                    </Typography>
                                </Box>
                            )
                        }}
                        sx={{
                            ...standardDataGridStyle,
                            height: '100%', // Importante: il DataGrid deve occupare tutto lo spazio disponibile
                            width: '100%',
                            '& .MuiDataGrid-main': { // Assicuriamoci che il contenuto si espanda correttamente
                                flex: '1 1 auto'
                            }
                        }}
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
    rows: PropTypes.array,
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
    onRefresh: PropTypes.func,
    onExport: PropTypes.func,
    searchPlaceholder: PropTypes.string,
    onSearch: PropTypes.func,
    customActions: PropTypes.node,
    emptyStateMessage: PropTypes.string,
    error: PropTypes.string,
    checkboxSelection: PropTypes.bool,
    onSelectionModelChange: PropTypes.func,
    selectionModel: PropTypes.array,
    sx: PropTypes.object
};

export default ListLayout;