// src/components/ClassManagement/FilterToolbar.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Box, TextField, MenuItem, Button } from '@mui/material';
import { FilterList, RestartAlt } from '@mui/icons-material';

export const FilterToolbar = ({
    schoolFilter,
    setSchoolFilter,
    yearFilter,
    setYearFilter,
    sectionFilter,
    setSectionFilter,
    statusFilter,
    setStatusFilter,
    studentsFilter,
    setStudentsFilter,
    handleApplyFilters,
    handleResetFilters
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <Box sx={{
                p: 2,
                display: 'flex',
                gap: 1.5,
                alignItems: 'center',
                flexWrap: 'wrap',
                borderBottom: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}>
                <TextField
                    label="Scuola"
                    size="small"
                    value={schoolFilter}
                    onChange={(e) => setSchoolFilter(e.target.value)}
                    sx={{ 
                        minWidth: 180,
                        '& .MuiInputBase-root': { 
                            fontSize: '0.875rem',
                            height: '40px'
                        }
                    }}
                />
                <TextField
                    label="Anno"
                    size="small"
                    select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    sx={{ 
                        width: 100,
                        '& .MuiInputBase-root': { 
                            height: '40px'
                        }
                    }}
                >
                    <MenuItem value="">Tutti</MenuItem>
                    {[1, 2, 3, 4, 5].map((year) => (
                        <MenuItem key={year} value={year}>
                            {year}° Anno
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    label="Sezione"
                    size="small"
                    value={sectionFilter}
                    onChange={(e) => setSectionFilter(e.target.value.toUpperCase())}
                    sx={{ 
                        width: 100,
                        '& .MuiInputBase-root': { 
                            height: '40px'
                        }
                    }}
                />
                <TextField
                    label="Status"
                    size="small"
                    select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    sx={{ 
                        minWidth: 150,
                        '& .MuiInputBase-root': { 
                            height: '40px'
                        }
                    }}
                >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="active">Attive</MenuItem>
                    <MenuItem value="planned">Pianificate</MenuItem>
                    <MenuItem value="archived">Archiviate</MenuItem>
                </TextField>
                <TextField
                    label="Studenti"
                    size="small"
                    select
                    value={studentsFilter}
                    onChange={(e) => setStudentsFilter(e.target.value)}
                    sx={{ 
                        minWidth: 150,
                        '& .MuiInputBase-root': { 
                            height: '40px'
                        }
                    }}
                >
                    <MenuItem value="">Tutti</MenuItem>
                    <MenuItem value="with_students">Con studenti</MenuItem>
                    <MenuItem value="without_students">Senza studenti</MenuItem>
                    <MenuItem value="pending">In attesa</MenuItem>
                </TextField>
                <Box sx={{ display: 'flex', gap: 1, ml: 'auto' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={handleResetFilters}
                        startIcon={<RestartAlt />}
                        sx={{ height: '40px' }}
                    >
                        Reset
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={handleApplyFilters}
                        startIcon={<FilterList />}
                        sx={{ height: '40px' }}
                    >
                        Applica
                    </Button>
                </Box>
            </Box>
        </motion.div>
    );
};

export default FilterToolbar;