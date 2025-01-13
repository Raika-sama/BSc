import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useClass } from '../../context/ClassContext';

const ClassManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const { mainTeacherClasses, coTeacherClasses, loading, error, getMyClasses } = useClass();

    useEffect(() => {
        getMyClasses();
    }, []);

    const columns = [
        { field: 'schoolName', headerName: 'Scuola', width: 200 },
        { field: 'year', headerName: 'Anno', width: 100 },
        { field: 'section', headerName: 'Sezione', width: 100 },
        { field: 'academicYear', headerName: 'Anno Accademico', width: 150 }
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={3}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Typography color="error" p={3}>
                {error}
            </Typography>
        );
    }

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Gestione Classi
            </Typography>

            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs
                    value={tabValue}
                    onChange={(e, newValue) => setTabValue(newValue)}
                >
                    <Tab label={`Le mie classi (${mainTeacherClasses.length})`} />
                    <Tab label={`Classi co-insegnate (${coTeacherClasses.length})`} />
                </Tabs>

                <Box sx={{ height: 400, width: '100%', p: 2 }}>
                    <DataGrid
                        rows={tabValue === 0 ? mainTeacherClasses : coTeacherClasses}
                        columns={columns}
                        getRowId={(row) => row.classId}
                        pageSize={5}
                        rowsPerPageOptions={[5]}
                    />
                </Box>
            </Paper>
        </Box>
    );
};

export default ClassManagement;