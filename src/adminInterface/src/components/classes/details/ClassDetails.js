import React, { useEffect, useState } from 'react';
import { Box, Alert, CircularProgress, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../../context/ClassContext';

// Components
import HeaderSection from './detailscomponents/HeaderSection';
import InfoSection from './detailscomponents/InfoSection';
import StudentsList from './detailscomponents/StudentsList';
import StudentDetailsDialog from './detailscomponents/StudentDetailsDialog';
import StudentForm from '../../students/StudentForm';
import StudentClassForm from './forms/StudentClassForm';
import TeacherForm from './forms/TeacherForm'; // Aggiungi questo import

const ClassDetails = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails, removeMainTeacher } = useClass(); // Aggiungi removeMainTeacher
    const [classData, setClassData] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [expandedInfo, setExpandedInfo] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [pageSize, setPageSize] = useState(25);
    const [studentFormOpen, setStudentFormOpen] = useState(false);
    const [teacherFormOpen, setTeacherFormOpen] = useState(false); // Nuovo stato per il form docente

     // Funzione per caricare i dati della classe
     const loadClassData = async () => {
        if (!classId) {
            setLocalError("ID classe non fornito");
            setLocalLoading(false);
            return;
        }
        
        try {
            setLocalLoading(true);
            const response = await getClassDetails(classId);
            setClassData(response);
            setLocalError(null);
        } catch (err) {
            setLocalError(err.message || 'Errore nel caricamento dei dati della classe');
            console.error('Errore nel caricamento:', err);
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const initializeData = async () => {
            if (isMounted) {
                await loadClassData();
            }
        };

        initializeData();

        return () => {
            isMounted = false;
        };
    }, [classId, getClassDetails]);

    const handleViewDetails = (student) => {
        setSelectedStudent(student);
        setDetailsDialogOpen(true);
    };

    const handleEdit = (student) => {
        setSelectedStudent(student);
        setFormOpen(true);
    };

    const handleNavigateToTests = (studentId) => {
        navigate(`/admin/students/${studentId}/tests`);
    };

   // Nuove funzioni per gestire il docente principale
   const handleAddMainTeacher = () => {
    setTeacherFormOpen(true);
    };

    const handleRemoveMainTeacher = async () => {
        try {
            const confirmed = window.confirm(
                'Sei sicuro di voler rimuovere il docente principale?'
            );

            if (confirmed) {
                await removeMainTeacher(classId);
                await loadClassData(); // Usa loadClassData invece di fetchData
            }
        } catch (error) {
            setLocalError('Errore durante la rimozione del docente principale');
            console.error('Error removing main teacher:', error);
        }
    };

    if (localLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress />
            </Box>
        );
    }

    if (localError) {
        return <Alert severity="error">{localError}</Alert>;
    }

    if (!classData) {
        return <Alert severity="info">Nessun dato disponibile per questa classe.</Alert>;
    }


    return (
        <Box p={3}>
            <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
                <HeaderSection
                    classData={classData}
                    expandedInfo={expandedInfo}
                    setExpandedInfo={setExpandedInfo}
                    onBack={() => navigate('/admin/classes')}
                    onPopulate={() => navigate(`/admin/classes/${classId}/populate`)}
                    onTests={() => navigate(`/admin/classes/${classId}/tests`)}
                    onSendTest={() => {}}
                />
                
                <InfoSection 
                    expandedInfo={expandedInfo}
                    classData={classData}
                    onAddMainTeacher={handleAddMainTeacher} // Aggiungi questa prop
                    onRemoveMainTeacher={handleRemoveMainTeacher} // Aggiungi questa prop
                />
            </Paper>

            <StudentsList
                classData={classData}
                pageSize={pageSize}
                setPageSize={setPageSize}
                onAddStudent={() => setStudentFormOpen(true)}
                onViewDetails={handleViewDetails}
                onEdit={handleEdit}
                onNavigateToTests={handleNavigateToTests}
                fetchData={loadClassData} // Passa la nuova funzione loadClassData invece di fetchData
            />

            <StudentDetailsDialog 
                open={detailsDialogOpen}
                onClose={() => {
                    setDetailsDialogOpen(false);
                    setSelectedStudent(null);
                }}
                student={selectedStudent}
            />

            <StudentForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setSelectedStudent(null);
                    loadClassData(); // Usa loadClassData qui
                }}
                student={selectedStudent}
            />

            <StudentClassForm 
                open={studentFormOpen}
                onClose={(shouldRefresh) => {
                    setStudentFormOpen(false);
                    if (shouldRefresh) {
                        loadClassData(); // Usa loadClassData qui
                    }
                }}
                classData={classData}
            />

            {/* Aggiungere il form per il docente principale */}
            <TeacherForm 
                open={teacherFormOpen}
                onClose={(shouldRefresh) => {
                    setTeacherFormOpen(false);
                    if (shouldRefresh) {
                        loadClassData(); // Usa loadClassData invece di fetchData
                    }
                }}
                classData={classData}
                isMainTeacher={true}
            />
        </Box>
    );

};

export default ClassDetails;