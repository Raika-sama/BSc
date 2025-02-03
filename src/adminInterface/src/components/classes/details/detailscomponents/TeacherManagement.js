// src/adminInterface/src/components/classes/details/detailscomponents/TeacherManagement.js

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    IconButton,
    Alert
} from '@mui/material';
import {
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useClass } from '../../../../context/ClassContext';
import TeacherForm from '../forms/TeacherForm';

const TeacherManagement = ({ classData, onUpdate }) => {
    const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
    const [isMainTeacherForm, setIsMainTeacherForm] = useState(true);
    const { removeMainTeacher } = useClass();

    const handleRemoveMainTeacher = async () => {
        try {
            await removeMainTeacher(classData._id);
            onUpdate();
        } catch (error) {
            console.error('Errore nella rimozione del docente principale:', error);
        }
    };

    return (
        <Box sx={{ p: 3 }}>
            {/* Sezione Docente Principale */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 3
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3 
                }}>
                    <Typography variant="h6">
                        Docente Principale
                    </Typography>
                    {classData.mainTeacher ? (
                        <Button
                            variant="outlined"
                            color="error"
                            onClick={handleRemoveMainTeacher}
                        >
                            Rimuovi Docente
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            onClick={() => {
                                setIsMainTeacherForm(true);
                                setIsTeacherFormOpen(true);
                            }}
                        >
                            Aggiungi Docente Principale
                        </Button>
                    )}
                </Box>

                {classData.mainTeacher ? (
                    <Box sx={{ 
                        p: 2, 
                        bgcolor: 'background.default',
                        borderRadius: 1
                    }}>
                        <Typography variant="subtitle1">
                            {classData.mainTeacher.firstName} {classData.mainTeacher.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Email: {classData.mainTeacher.email}
                        </Typography>
                    </Box>
                ) : (
                    <Alert severity="info">
                        Nessun docente principale assegnato
                    </Alert>
                )}
            </Paper>

            {/* Sezione Altri Docenti */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2
                }}
            >
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 3 
                }}>
                    <Typography variant="h6">
                        Altri Docenti
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setIsMainTeacherForm(false);
                            setIsTeacherFormOpen(true);
                        }}
                    >
                        Aggiungi Docente
                    </Button>
                </Box>

                {classData.teachers && classData.teachers.length > 0 ? (
                    <Grid container spacing={2}>
                        {classData.teachers.map((teacher) => (
                            <Grid item xs={12} md={6} key={teacher._id}>
                                <Box sx={{ 
                                    p: 2, 
                                    bgcolor: 'background.default',
                                    borderRadius: 1,
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <Box>
                                        <Typography variant="subtitle1">
                                            {teacher.firstName} {teacher.lastName}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Email: {teacher.email}
                                        </Typography>
                                    </Box>
                                    <IconButton 
                                        color="error"
                                        // TODO: Implementare la rimozione del co-docente
                                        onClick={() => console.log('Rimuovi co-docente')}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                ) : (
                    <Alert severity="info">
                        Nessun docente aggiuntivo assegnato
                    </Alert>
                )}
            </Paper>

            <TeacherForm 
                open={isTeacherFormOpen}
                onClose={(shouldRefresh) => {
                    setIsTeacherFormOpen(false);
                    if (shouldRefresh) onUpdate();
                }}
                classData={classData}
                isMainTeacher={isMainTeacherForm}
            />
        </Box>
    );
};

export default TeacherManagement;