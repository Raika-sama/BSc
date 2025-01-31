import React, { useEffect, useState } from 'react';
import { Box, Alert, CircularProgress, Paper } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../../context/ClassContext';

// Components
import HeaderSection from './components/HeaderSection';
import InfoSection from './components/InfoSection';
import StudentsList from './components/StudentsList';
import StudentDetailsDialog from './components/StudentDetailsDialog';
import StudentForm from '../../students/StudentForm';
import StudentClassForm from './forms/StudentClassForm';

const ClassDetails = () => {
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails } = useClass();
    
    const [classData, setClassData] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [expandedInfo, setExpandedInfo] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [formOpen, setFormOpen] = useState(false);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [pageSize, setPageSize] = useState(25);
    const [studentFormOpen, setStudentFormOpen] = useState(false);

    const fetchData = async () => {
        try {
            const response = await getClassDetails(classId);
            setClassData(response);
        } catch (err) {
            setLocalError(err.message);
        } finally {
            setLocalLoading(false);
        }
    };

    useEffect(() => {
        if (classId) {
            fetchData();
        }
    }, [classId]);

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
                    fetchData();
                }}
                student={selectedStudent}
            />

            <StudentClassForm 
                open={studentFormOpen}
                onClose={(shouldRefresh) => {
                    setStudentFormOpen(false);
                    if (shouldRefresh) {
                        fetchData();
                    }
                }}
                classData={classData}
            />
        </Box>
    );
};

export default ClassDetails;