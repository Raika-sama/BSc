// src/adminInterface/src/components/classes/details/detailscomponents/TeacherManagement.js

import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    Grid,
    IconButton,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Delete as DeleteIcon
} from '@mui/icons-material';
import { useClass } from '../../../../context/ClassContext';
import { useNotification } from '../../../../context/NotificationContext';
import TeacherForm from '../forms/TeacherForm';
import TeacherCard from './TeacherCard';

const TeacherManagement = ({ classData, onUpdate }) => {
    const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
    const [isMainTeacherForm, setIsMainTeacherForm] = useState(true);
    const { removeMainTeacher, removeTeacher } = useClass();
    const { showNotification } = useNotification();
    const [loading, setLoading] = useState(false);

    const handleRemoveMainTeacher = async () => {
        try {
            setLoading(true);
            await removeMainTeacher(classData._id);
            showNotification('Docente principale rimosso con successo', 'success');
            onUpdate();
        } catch (error) {
            console.error('Errore nella rimozione del docente principale:', error);
            showNotification('Errore nella rimozione del docente principale', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveTeacher = async (teacherId) => {
        try {
            setLoading(true);
            await removeTeacher(classData._id, teacherId);
            showNotification('Docente rimosso con successo', 'success');
            onUpdate();
        } catch (error) {
            console.error('Errore nella rimozione del docente:', error);
            showNotification('Errore nella rimozione del docente', 'error');
        } finally {
            setLoading(false);
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
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : undefined}
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
                            disabled={loading}
                        >
                            Aggiungi Docente Principale
                        </Button>
                    )}
                </Box>

                {classData.mainTeacher ? (
                    <TeacherCard 
                        teacher={classData.mainTeacher}
                        isMain={true}
                        onRemove={handleRemoveMainTeacher}
                    />
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
                        disabled={loading}
                    >
                        Aggiungi Docente
                    </Button>
                </Box>

                {classData.teachers && classData.teachers.length > 0 ? (
                    <Grid container spacing={2}>
                        {classData.teachers.map((teacher) => (
                            <Grid item xs={12} md={6} key={teacher._id}>
                                <TeacherCard 
                                    teacher={teacher}
                                    isMain={false}
                                    onRemove={() => handleRemoveTeacher(teacher._id)}
                                />
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