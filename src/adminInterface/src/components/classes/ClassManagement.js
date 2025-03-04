// src/components/ClassManagement/ClassManagement.jsx
// src/components/classes/ClassManagement.js
import React, { useEffect, useState, useMemo } from 'react';
import {
    Box,
    Typography,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Alert,
    Tooltip,
    IconButton,
    Tabs,
    Tab
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ContentLayout } from '../common/commonIndex';
import ListLayout from '../common/ListLayout';
import { DataGrid } from '@mui/x-data-grid';
import { useClass } from '../../context/ClassContext';
import { useAuth } from '../../context/AuthContext';
import { 
    Add as AddIcon,
    FilterList as FilterListIcon,
    School as SchoolIcon,
    Class as ClassIcon,
    Group as GroupIcon,
    Assessment as AssessmentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { FilterToolbar } from './classcomponents/FilterToolbar';
import createColumns from './classcomponents/ClassColumns';


const ClassManagement = () => {
    const [tabValue, setTabValue] = useState(0);
    const { mainTeacherClasses = [], coTeacherClasses = [], loading, error, getMyClasses, deleteClass } = useClass();
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [deleteError, setDeleteError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const [pageSize, setPageSize] = useState(25);

    // Stati per i filtri
    const [isFilterOpen, setIsFilterOpen] = useState(false); // Aggiunto qui
    const [schoolFilter, setSchoolFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [sectionFilter, setSectionFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [studentsFilter, setStudentsFilter] = useState('');

    useEffect(() => {
        console.log('ClassManagement: Inizializzazione');
        getMyClasses().catch(error => {
            console.error('ClassManagement: Errore nel caricamento classi:', error);
        });
    }, []);

    const handleApplyFilters = () => {
        // La logica dei filtri rimane la stessa
        const filtered = filterClasses(isAdmin ? mainTeacherClasses : 
            tabValue === 0 ? mainTeacherClasses : coTeacherClasses);
        return filtered;
    };

    const handleResetFilters = () => {
        setSchoolFilter('');
        setYearFilter('');
        setSectionFilter('');
        setStatusFilter('');
        setStudentsFilter('');
    };

    const filterClasses = (classes) => {
        return classes.filter(classItem => {
            const matchesSchool = !schoolFilter || 
                classItem.schoolName.toLowerCase().includes(schoolFilter.toLowerCase());
            const matchesYear = !yearFilter || classItem.year === parseInt(yearFilter);
            const matchesSection = !sectionFilter || 
                classItem.section === sectionFilter.toUpperCase();
            const matchesStatus = !statusFilter || classItem.status === statusFilter;

            let matchesStudentFilter = true;
            if (studentsFilter) {
                const studentCount = classItem.students?.length || 0;
                const capacity = classItem.capacity || 0;

                switch (studentsFilter) {
                    case 'with_students':
                        matchesStudentFilter = studentCount > 0;
                        break;
                    case 'without_students':
                        matchesStudentFilter = studentCount === 0;
                        break;
                    case 'pending':
                        matchesStudentFilter = studentCount < capacity;
                        break;
                }
            }

            return matchesSchool && matchesYear && matchesSection && 
                   matchesStatus && matchesStudentFilter;
        });
    };


    const handleDeleteClick = (classData) => {
        setSelectedClass(classData);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            await deleteClass(selectedClass.classId);
            setOpenDeleteDialog(false);
            setSelectedClass(null);
            getMyClasses();
        } catch (err) {
            setDeleteError('Errore durante l\'eliminazione della classe');
        }
    };

    const handleViewDetails = (classData) => {
        navigate(`/admin/classes/${classData.classId}`);
    };

    const handleTestManagement = (classData) => {
        navigate(`/admin/classes/${classData.classId}/tests`);
    };

    // Usa useMemo per le colonne
    const columns = useMemo(() => createColumns(
        handleViewDetails,
        handleTestManagement,
        handleDeleteClick
    ), []);

    const filteredMainTeacherClasses = filterClasses(mainTeacherClasses);
    const filteredCoTeacherClasses = filterClasses(coTeacherClasses);
    const currentClasses = isAdmin ? filteredMainTeacherClasses : 
        (tabValue === 0 ? filteredMainTeacherClasses : filteredCoTeacherClasses);

        const statsCards = [
            { 
                title: 'Totale Classi', 
                value: mainTeacherClasses.length + coTeacherClasses.length,
                icon: SchoolIcon,
                color: 'primary' 
            },
            { 
                title: 'Classi Insegnate', 
                value: mainTeacherClasses.length,
                icon: ClassIcon,
                color: 'secondary' 
            },
            { 
                title: 'Classi Co-Insegnate', 
                value: coTeacherClasses.length,
                icon: GroupIcon,
                color: 'success' 
            },
            { 
                title: 'Test Attivi', 
                value: currentClasses.reduce((acc, curr) => acc + (curr.activeTests || 0), 0),
                icon: AssessmentIcon,
                color: 'info' 
            }
        ];

    if (loading) {
        return (
            <ContentLayout
                title={isAdmin ? 'Gestione Classi (Admin)' : 'Gestione Classi'}
                subtitle="Caricamento in corso..."
            >
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout
            title={isAdmin ? 'Gestione Classi (Admin)' : 'Gestione Classi'}
            subtitle="Gestisci le classi e monitora gli studenti"
            actions={
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Tooltip title="Filtri">
                        <IconButton 
                            onClick={() => setIsFilterOpen(!isFilterOpen)}
                            color="primary"
                        >
                            <FilterListIcon />
                        </IconButton>
                    </Tooltip>
                    
                </Box>
            }
        >
            <Box sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: 3
            }}>
                <ListLayout
                    statsCards={statsCards}
                    isFilterOpen={isFilterOpen}
                    filterComponent={
                        <FilterToolbar
                            schoolFilter={schoolFilter}
                            setSchoolFilter={setSchoolFilter}
                            yearFilter={yearFilter}
                            setYearFilter={setYearFilter}
                            sectionFilter={sectionFilter}
                            setSectionFilter={setSectionFilter}
                            statusFilter={statusFilter}
                            setStatusFilter={setStatusFilter}
                            studentsFilter={studentsFilter}
                            setStudentsFilter={setStudentsFilter}
                            handleApplyFilters={handleApplyFilters}
                            handleResetFilters={handleResetFilters}
                        />
                    }
                    tabsComponent={!isAdmin && (
                        <Tabs
                            value={tabValue}
                            onChange={(e, newValue) => setTabValue(newValue)}
                            sx={{
                                minHeight: '48px',
                                borderBottom: 1,
                                borderColor: 'divider',
                                bgcolor: 'background.paper',
                                '& .MuiTab-root': {
                                    minHeight: '48px',
                                    fontSize: '0.875rem',
                                    textTransform: 'none',
                                    fontWeight: 500
                                }
                            }}
                        >
                            <Tab label={`Le mie classi (${filteredMainTeacherClasses.length})`} />
                            <Tab label={`Classi co-insegnate (${filteredCoTeacherClasses.length})`} />
                        </Tabs>
                    )}
                    rows={currentClasses}
                    columns={columns}
                    getRowId={(row) => row.classId}
                    pageSize={pageSize}
                    onPageSizeChange={setPageSize}
                />

                {/* Delete Dialog */}
                <AnimatePresence>
                    {openDeleteDialog && (
                        <Dialog
                            open={openDeleteDialog}
                            onClose={() => setOpenDeleteDialog(false)}
                            PaperComponent={motion.div}
                            PaperProps={{
                                initial: { opacity: 0, y: 20 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: 20 },
                                transition: { duration: 0.2 }
                            }}
                        >
                            <DialogTitle>Conferma eliminazione</DialogTitle>
                            <DialogContent>
                                {deleteError && (
                                    <Alert severity="error" sx={{ mb: 2 }}>
                                        {deleteError}
                                    </Alert>
                                )}
                                <Typography>
                                    Sei sicuro di voler eliminare questa classe?
                                    {selectedClass && (
                                        <Typography color="textSecondary" sx={{ mt: 1 }}>
                                            {`${selectedClass.year}${selectedClass.section} - ${selectedClass.schoolName}`}
                                        </Typography>
                                    )}
                                </Typography>
                            </DialogContent>
                            <DialogActions>
                                <Button onClick={() => setOpenDeleteDialog(false)}>
                                    Annulla
                                </Button>
                                <Button 
                                    onClick={handleDeleteConfirm}
                                    color="error"
                                    variant="contained"
                                >
                                    Elimina
                                </Button>
                            </DialogActions>
                        </Dialog>
                    )}
                </AnimatePresence>
            </Box>
        </ContentLayout>
    );
};

export default ClassManagement;