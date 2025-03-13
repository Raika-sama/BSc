import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Paper,
    Tabs,
    Tab,
    Typography,
    Button,
    CircularProgress,
    Alert,
    Chip,
    Stack,
    Breadcrumbs,
    Link
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    Person as PersonIcon,
    Assessment as AssessmentIcon,
    School as SchoolIcon,
    History as HistoryIcon,
    VpnKey as VpnKeyIcon,
    People as PeopleIcon
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { useStudent } from '../../../../context/StudentContext';
import { useNotification } from '../../../../context/NotificationContext';

// Importa i componenti delle tab
import InfoTab from '../tabs/InfoTab';
import TestsTab from '../tabs/TestsTab';
import SchoolTab from '../tabs/SchoolTab';
import HistoryTab from '../tabs/HistoryTab';
import PermissionsTab from '../tabs/PermissionsTab';
import TeachersTab from '../tabs/TeachersTab';

// Componente TabPanel per gestire il contenuto delle tab
const TabPanel = ({ children, value, index, ...other }) => (
    <div
        role="tabpanel"
        hidden={value !== index}
        id={`student-tabpanel-${index}`}
        aria-labelledby={`student-tab-${index}`}
        {...other}
        style={{ height: '100%' }}
    >
        {value === index && (
            <Box sx={{ height: '100%', p: 3 }}>
                {children}
            </Box>
        )}
    </div>
);

const getStatusConfig = (status) => {
    const configs = {
        active: { label: 'Attivo', color: 'success' },
        pending: { label: 'In Attesa', color: 'warning' },
        inactive: { label: 'Inattivo', color: 'error' },
        transferred: { label: 'Trasferito', color: 'info' },
        graduated: { label: 'Diplomato', color: 'primary' }
    };
    return configs[status] || configs.pending;
};

const StudentIndex = ({ initialTab = 'info' }) => {
    const { id } = useParams();
    console.log('StudentIndex received ID:', id); // Debug log
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { getStudentById, loading, error } = useStudent();

    const [student, setStudent] = useState(null);
    const [activeTab, setActiveTab] = useState(() => {
        const tabMapping = {
            'info': 0,
            'tests': 1,
            'school': 2,
            'teachers': 3,
            'history': 4,
            'permissions': 5
        };
        return tabMapping[initialTab] || 0;
    });
    const [loadingStudent, setLoadingStudent] = useState(true);

// Aggiungiamo una funzione per aggiornare lo studente che forza il re-render
const handleStudentUpdate = (updatedData) => {
    setStudent(prevStudent => {
        const newStudent = {
            ...prevStudent,
            ...updatedData,
            // Assicuriamoci che questi campi vengano mantenuti
            schoolId: prevStudent.schoolId,
            classId: prevStudent.classId,
            mainTeacher: prevStudent.mainTeacher,
            teachers: prevStudent.teachers,
            // Aggiungiamo un timestamp per forzare il re-render
            _lastUpdate: new Date().getTime()
        };
        return newStudent;
    });
};
    useEffect(() => {
        const loadStudent = async () => {
            try {
                console.log('Loading student with ID:', id); // Debug log

                setLoadingStudent(true);
                const data = await getStudentById(id);
                console.log('Loaded student data:', data); // Debug log

                if (data) {
                    setStudent(data);
                } else {
                    showNotification('Studente non trovato', 'error');
                    navigate('/admin/students');
                }
            } catch (error) {
                console.error('Error loading student:', error);
                showNotification('Errore nel caricamento dello studente', 'error');
                navigate('/admin/students');
            } finally {
                setLoadingStudent(false);
            }
        };

        if (id) {
            loadStudent();
        }
    }, [id]);

    if (loadingStudent) {
        return (
            <Box 
                sx={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    height: '100vh' 
                }}
            >
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!student) return null;

    const statusConfig = getStatusConfig(student.status);

    return (
        <Box sx={{ p: 3 }}>
            {/* Header Card */}
            <Paper 
                elevation={0}
                sx={{ 
                    p: 3, 
                    mb: 3, 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                {/* Breadcrumbs e Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
                    <Box>
                        
                        
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Typography 
                                variant="h4" 
                                sx={{ 
                                    fontWeight: 600,
                                    color: 'primary.main'
                                }}
                            >
                                {`${student.firstName} ${student.lastName}`}
                            </Typography>
                            <Chip 
                                label={statusConfig.label}
                                color={statusConfig.color}
                                size="small"
                                sx={{ 
                                    height: 24,
                                    '& .MuiChip-label': { px: 2 }
                                }}
                            />
                        </Stack>
                    </Box>

                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/students')}
                        size="small"
                    >
                        Torna alla lista
                    </Button>
                </Stack>

                {/* Info Cards Grid */}
                <Box 
                    sx={{ 
                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr',
                            sm: '1fr 1fr',
                            md: 'repeat(4, 1fr)'
                        },
                        gap: 3,
                        mt: 3
                    }}
                >
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Email
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                            {student.email}
                        </Typography>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Scuola
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                            {student.schoolId?.name || 'Non assegnata'}
                        </Typography>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Classe
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                            {student.classId ? 
                                `${student.classId.year}${student.classId.section}` : 
                                'Non assegnata'
                            }
                        </Typography>
                    </Paper>

                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'background.default',
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Test Completati
                        </Typography>
                        <Typography variant="body1" fontWeight="500">
                            {student.testCount || 0}
                        </Typography>
                    </Paper>
                </Box>
            </Paper>

            {/* Tabs Container */}
            <Paper 
                elevation={0}
                sx={{ 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    overflow: 'hidden'
                }}
            >
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        px: 2,
                        bgcolor: alpha('#1976d2', 0.03)
                    }}
                    variant="scrollable"
                    scrollButtons="auto"
                >
                    <Tab 
                        icon={<PersonIcon />} 
                        label="Informazioni" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<AssessmentIcon />} 
                        label="Test" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<SchoolIcon />} 
                        label="Scuola e Classe" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<PeopleIcon />} 
                        label="Docenti" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<HistoryIcon />} 
                        label="Storico" 
                        iconPosition="start"
                    />
                    <Tab 
                        icon={<VpnKeyIcon />} 
                        label="Permessi" 
                        iconPosition="start"
                    />
                </Tabs>

                {/* Tab Panels */}
                <Box sx={{ bgcolor: 'background.paper' }}>
                    <TabPanel value={activeTab} index={0}>
                        <InfoTab 
                            student={student} 
                            setStudent={handleStudentUpdate}  // Usiamo la nuova funzione
                        />
                    </TabPanel>
                    <TabPanel value={activeTab} index={1}>
                        <TestsTab student={student} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={2}>
                        <SchoolTab student={student} setStudent={setStudent} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={3}>
                        <TeachersTab student={student} setStudent={setStudent} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={4}>
                        <HistoryTab student={student} />
                    </TabPanel>
                    <TabPanel value={activeTab} index={5}>
                        <PermissionsTab student={student} />
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    );
};

export default StudentIndex;