import React, { useEffect, useState, useMemo } from 'react';
import { 
    Box, 
    Alert,
    CircularProgress, 
    Paper,
    Tab,
    Tabs,
    Button,
    Typography  // Aggiungi questa riga
} from '@mui/material';
import {
    Group as GroupIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Settings as SettingsIcon,
    ArrowBack as ArrowBackIcon,
    People as PeopleIcon,
    CheckCircle as CheckCircleIcon,
    Warning as WarningIcon,
    GroupAdd as GroupAddIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../../context/ClassContext';
import { alpha } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import TeacherManagement from './detailscomponents/TeacherManagement';

// Components
import HeaderSection from './detailscomponents/HeaderSection';
import InfoSection from './detailscomponents/InfoSection';
import StudentsList from './detailscomponents/StudentsList';
import ClassPopulate from './ClassPopulate';
import ClassTests from './detailscomponents/ClassTests';
import TeacherForm from './forms/TeacherForm';
import ClassSettings from './detailscomponents/ClassSettings';
import ContentLayout from '../../common/ContentLayout';
import StudentClassForm from './forms/StudentClassForm'; // Aggiungi questo import


// Custom Tab Panel
function TabPanel({ children, value, index, ...other }) {
    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`class-tabpanel-${index}`}
            aria-labelledby={`class-tab-${index}`}
            sx={{ 
                flex: 1,
                overflow: 'auto',
                display: value === index ? 'block' : 'none',
                height: '100%'
            }}
            {...other}
        >
            {value === index && children}
        </Box>
    );
}

const ClassDetails = () => {
    const theme = useTheme(); // Aggiungi questa riga

    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails, removeMainTeacher } = useClass();
    const [isStudentFormOpen, setIsStudentFormOpen] = useState(false);
    const [classData, setClassData] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [localLoading, setLocalLoading] = useState(true);
    const [expandedInfo, setExpandedInfo] = useState(false);
    const [activeTab, setActiveTab] = useState(0);
    const [pageSize, setPageSize] = useState(25);

     

    const fetchData = async () => {
        try {
            setLocalLoading(true);
            const response = await getClassDetails(classId);
            setClassData(response);
            setLocalError(null);
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

    const handleOpenStudentForm = () => {
        setIsStudentFormOpen(true);
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

     // Handlers per HeaderSection
     const handlePopulate = () => {
        setActiveTab(1); // Switch alla tab di popolamento
    };

    const handleTests = () => {
        setActiveTab(2); // Switch alla tab dei test
    };

    const handleSendTest = () => {
        // Implementazione futura
        console.log('Send test functionality not implemented yet');
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
    <ContentLayout
        title={classData ? `Classe ${classData.year}${classData.section || ''}` : 'Dettagli Classe'}
        subtitle={
            classData && classData.school 
                ? `${classData.school.name}${classData.schoolYear ? ` - Anno Scolastico ${classData.schoolYear}` : ''}`
                : ''
        }
        actions={
            <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/admin/classes')}
            >
                Indietro
            </Button>
        }
    >
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            height: '100%',
            gap: 2,
        }}>
            {/* Header and Info Combined Section */}
            <Paper 
                elevation={0} 
                sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ p: 2 }}>
                    <HeaderSection 
                        classData={classData}
                        expandedInfo={expandedInfo}
                        setExpandedInfo={setExpandedInfo}
                        onAddStudent={handleOpenStudentForm} // Passa il gestore
                        onBack={() => navigate('/admin/classes')}
                        onPopulate={handlePopulate}
                        onTests={handleTests}
                        onSendTest={handleSendTest}
                    />
                </Box>
                
                <InfoSection 
                    expandedInfo={expandedInfo}
                    classData={classData}
                />
            </Paper>

            {/* Tabs */}
            <Paper 
                elevation={0} 
                sx={{ 
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    minHeight: 0
                }}
            >
                <Tabs 
                    value={activeTab} 
                    onChange={handleTabChange}
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        minHeight: 48
                    }}
                >
                        <Tab 
                            icon={<PeopleIcon />} 
                            label="Studenti" 
                            sx={{ minHeight: 48 }}
                        />
                        <Tab 
                            icon={<GroupAddIcon />} 
                            label="Popolamento" 
                            sx={{ minHeight: 48 }}
                        />
                        <Tab 
                            icon={<QuizIcon />} 
                            label="Test" 
                            sx={{ minHeight: 48 }}
                        />
                        <Tab 
                            icon={<SchoolIcon />} 
                            label="Docenti" 
                            sx={{ minHeight: 48 }}
                        />
                        <Tab 
                            icon={<SettingsIcon />} 
                            label="Impostazioni" 
                            sx={{ minHeight: 48 }}
                        />
                    </Tabs>

                    <Box sx={{ 
                    flex: 1, 
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column'
                }}>
                    <TabPanel value={activeTab} index={0}>
                        <StudentsList
                            classData={classData}
                            pageSize={pageSize}
                            setPageSize={setPageSize}
                            fetchData={fetchData}
                            onAddStudent={handleOpenStudentForm} // Aggiungi questa prop
                            onViewDetails={(student) => {
                                // Implementa la visualizzazione dettagli
                                console.log('View details:', student);
                            }}
                            onEdit={(student) => {
                                // Implementa la modifica
                                console.log('Edit student:', student);
                            }}
                            onNavigateToTests={(studentId) => {
                                // Implementa la navigazione ai test
                                console.log('Navigate to tests:', studentId);
                            }}
                        />
                        <StudentClassForm 
                            open={isStudentFormOpen}
                            onClose={(needsRefresh) => {
                                setIsStudentFormOpen(false);
                                if (needsRefresh) {
                                    fetchData();
                                }
                            }}
                            classData={classData}
                        />
                    </TabPanel>

                    {/* Le altre TabPanel rimangono le stesse */}
                    <TabPanel value={activeTab} index={1}>
                        <ClassPopulate classData={classData} onUpdate={fetchData} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={2}>
                        <ClassTests classData={classData} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={3}>
                        <TeacherManagement classData={classData} onUpdate={fetchData} />
                    </TabPanel>

                    <TabPanel value={activeTab} index={4}>
                        <ClassSettings classData={classData} onUpdate={fetchData} />
                    </TabPanel>
                </Box>
            </Paper>
        </Box>
    </ContentLayout>
);
};

export default ClassDetails;