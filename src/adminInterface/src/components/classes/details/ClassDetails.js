import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Alert,
    CircularProgress, 
    Paper,
    Tab,
    Tabs,
    Button
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    People as PeopleIcon,
    GroupAdd as GroupAddIcon,
    Quiz as QuizIcon,
    School as SchoolIcon,
    Settings as SettingsIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { useClass } from '../../../context/ClassContext';

// Components
import HeaderSection from './detailscomponents/HeaderSection';
import InfoSection from './detailscomponents/InfoSection';
import StudentsList from './detailscomponents/StudentsList';
import ClassPopulate from './ClassPopulate';
import ClassTests from '../ClassTests';
import TeacherForm from './forms/TeacherForm';
import ClassSettings from './detailscomponents/ClassSettings';
import ContentLayout from '../../common/ContentLayout';


// TeacherManagement Component
const TeacherManagement = ({ classData, onUpdate }) => {
    const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);

    return (
        <Box sx={{ p: 3 }}>
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
                        Gestione Docenti
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => setIsTeacherFormOpen(true)}
                    >
                        Aggiungi Docente
                    </Button>
                </Box>

                {/* Lista docenti attuali */}
                <Box>
                    {/* Docente principale */}
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Docente Principale
                    </Typography>
                    {classData.mainTeacher ? (
                        <TeacherCard 
                            teacher={classData.mainTeacher}
                            isMain
                            onRemove={async () => {
                                // Implementa la rimozione
                                onUpdate();
                            }}
                        />
                    ) : (
                        <Alert severity="info">
                            Nessun docente principale assegnato
                        </Alert>
                    )}

                    {/* Altri docenti */}
                    <Typography variant="subtitle1" color="primary" sx={{ mt: 3, mb: 2 }}>
                        Altri Docenti
                    </Typography>
                    <Grid container spacing={2}>
                        {classData.teachers?.map(teacher => (
                            <Grid item xs={12} md={6} key={teacher._id}>
                                <TeacherCard 
                                    teacher={teacher}
                                    onRemove={async () => {
                                        // Implementa la rimozione
                                        onUpdate();
                                    }}
                                />
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </Paper>

            <TeacherForm 
                open={isTeacherFormOpen}
                onClose={(shouldRefresh) => {
                    setIsTeacherFormOpen(false);
                    if (shouldRefresh) onUpdate();
                }}
                classData={classData}
                isMainTeacher={!classData.mainTeacher}
            />
        </Box>
    );
};

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
    const { classId } = useParams();
    const navigate = useNavigate();
    const { getClassDetails } = useClass();
    
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

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
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
            title={`Classe ${classData.year}${classData.section}`}
            subtitle={`Anno Accademico: ${classData.academicYear}`}
            actions={
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/admin/classes')}
                    >
                        Indietro
                    </Button>
                </Box>
            }
        >
            <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: '100%',
                gap: 2
            }}>
                {/* Info Section */}
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 2, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        borderRadius: 2
                    }}
                >
                    <InfoSection 
                        expandedInfo={expandedInfo}
                        classData={classData}
                        onAddMainTeacher={() => setActiveTab(3)}
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
                        minHeight: 0 // Importante per il corretto scrolling
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
                            />
                        </TabPanel>

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