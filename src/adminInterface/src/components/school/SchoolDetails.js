import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Container,
    Typography,
    Grid,
    Box,
    Chip,
    Button,
    IconButton,
    Card,
    CardContent,
    ListItemAvatar,
    Avatar,
    List,
    ListItem,
    ListItemText,
    CircularProgress,
    Alert,
    Tabs,
    Tab,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import SchoolIcon from '@mui/icons-material/School';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ClassIcon from '@mui/icons-material/Class';
import SchoolUsersManagement from './schoolComponents/SchoolUsersManagement';

import SchoolEditForm from './SchoolEditForm';
import SectionManagement from './schoolComponents/SectionManagement';
import { useSchool } from '../../context/SchoolContext';

// Animazioni per le cards
const cardVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.15 } },
    hover: { y: -5, transition: { duration: 0.1 } }
};

const handleAddUser = async (userData) => {
    try {
        await updateSchoolUser(id, userData.email, {
            action: 'add',
            role: userData.role
        });
        await getSchoolById(id);
    } catch (error) {
        console.error('Error adding user:', error);
    }
};

const handleRemoveUser = async (userId) => {
    try {
        await updateSchoolUser(id, userId, {
            action: 'remove'
        });
        await getSchoolById(id);
    } catch (error) {
        console.error('Error removing user:', error);
    }
};

const handleChangeManager = async (newManagerId) => {
    try {
        await updateSchool(id, { manager: newManagerId });
        await getSchoolById(id);
    } catch (error) {
        console.error('Error changing manager:', error);
    }
};

// Componente TabPanel migliorato con animazioni
const TabPanel = ({ children, value, index }) => (
    <AnimatePresence mode="wait">
        {value === index && (
            <motion.div
                key={index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15, ease: "easeInOut" }} // DURATA TRANSIZIONE DEI TABS
                style={{ width: '100%' }}
            >
                {children}
            </motion.div>
        )}
    </AnimatePresence>
);

// Card Component riutilizzabile
const InfoCard = ({ icon, title, children, gridProps }) => (
    <Grid item {...gridProps}>
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover="hover"
        >
            <Card elevation={1}>
                <CardContent sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        {icon}
                        <Typography variant="h6" sx={{ fontSize: '1rem', ml: 1 }}>
                            {title}
                        </Typography>
                    </Box>
                    {children}
                </CardContent>
            </Card>
        </motion.div>
    </Grid>
);

const SchoolDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [isEditMode, setIsEditMode] = useState(false);

    const { 
        selectedSchool,
        loading,
        error,
        getSchoolById,
        updateSchool
    } = useSchool();

    useEffect(() => {
        getSchoolById(id);
    }, [id]);

    const handleUpdateSchool = async (updatedData) => {
        try {
            await updateSchool(id, updatedData);
            await getSchoolById(id);
            setIsEditMode(false);
        } catch (error) {
            console.error('Error updating school:', error);
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <CircularProgress size={10} />
                </motion.div>
            </Box>
        );
    }

    if (error || !selectedSchool) {
        return <Alert severity="error" sx={{ m: 2 }}>{error || 'Scuola non trovata'}</Alert>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 2 }}>
            {/* Header con animazione */}
            <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
            >
                <Box display="flex" alignItems="center" mb={2}>
                    <motion.div 
                        whileHover={{ scale: 1.03 }} 
                        whileTap={{ scale: 0.97 }} 
                        transition={{ duration: 0.1 }} 
                    >
                        <IconButton onClick={() => navigate('/admin/schools')} size="small">
                            <ArrowBackIcon />
                        </IconButton>
                    </motion.div>
                    <Typography variant="h5" sx={{ ml: 2, flex: 1 }}>
                        {selectedSchool.name}
                    </Typography>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button
                            variant="contained"
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => setIsEditMode(true)}
                        >
                            Modifica
                        </Button>
                    </motion.div>
                </Box>
            </motion.div>

            {/* Tabs con animazione */}
            <Box sx={{ 
                borderBottom: 1, 
                borderColor: 'divider', 
                mb: 2,
                position: 'relative'
            }}>
                <Tabs 
                    value={activeTab} 
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        '& .MuiTab-root': {
                            minHeight: '48px',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.04)',
                            }
                        },
                        '& .Mui-selected': {
                            fontWeight: 'bold',
                        }
                    }}
                >
                    <Tab label="Informazioni" />
                    <Tab label="Sezioni" />
                    <Tab label="Utenti" />
                </Tabs>
                {/* Indicatore animato */}
                <motion.div
                    style={{
                        position: 'absolute',
                        bottom: 0,
                        height: 2,
                        background: '#1976d2',
                        width: '33.33%'
                    }}
                    animate={{
                        x: `${activeTab * 100}%`
                    }}
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 40,
                        duration: 0.2
                    }}
                />
            </Box>

            {/* Tab Panels */}
            <TabPanel value={activeTab} index={0}>
                <Grid container spacing={2}>
                    <InfoCard 
                        icon={<SchoolIcon color="primary" />}
                        title="Informazioni Generali"
                        gridProps={{ xs: 12, md: 6 }}
                    >
                        <List dense>
                            <ListItem>
                                <ListItemText 
                                    primary="Tipo Scuola"
                                    secondary={selectedSchool.schoolType === 'middle_school' ? 
                                        'Scuola Media' : 'Scuola Superiore'}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                />
                            </ListItem>
                            {selectedSchool.schoolType === 'high_school' && (
                                <ListItem>
                                    <ListItemText 
                                        primary="Tipo Istituto"
                                        secondary={selectedSchool.institutionType}
                                        primaryTypographyProps={{ fontSize: '0.875rem' }}
                                        secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                    />
                                </ListItem>
                            )}
                        </List>
                    </InfoCard>

                    <InfoCard 
                        icon={<LocationOnIcon color="primary" />}
                        title="Ubicazione"
                        gridProps={{ xs: 12, md: 6 }}
                    >
                        <List dense>
                            <ListItem>
                                <ListItemText 
                                    primary="Indirizzo"
                                    secondary={selectedSchool.address}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                    secondaryTypographyProps={{ fontSize: '0.875rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText 
                                    primary={`${selectedSchool.region} - ${selectedSchool.province}`}
                                    primaryTypographyProps={{ fontSize: '0.875rem' }}
                                />
                            </ListItem>
                        </List>
                    </InfoCard>

                    <InfoCard 
                        icon={<ClassIcon color="primary" />}
                        title="Anno Accademico Corrente"
                        gridProps={{ xs: 12 }}
                    >
                        {selectedSchool.academicYears?.[0] ? (
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Chip 
                                        label={`Anno: ${selectedSchool.academicYears[0].year}`}
                                        size="small"
                                    />
                                </motion.div>
                                <motion.div whileHover={{ scale: 1.05 }}>
                                    <Chip 
                                        label={selectedSchool.academicYears[0].status === 'active' ? 'Attivo' : 'Non attivo'}
                                        color={selectedSchool.academicYears[0].status === 'active' ? 'success' : 'default'}
                                        size="small"
                                    />
                                </motion.div>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                Nessun anno accademico configurato
                            </Typography>
                        )}
                    </InfoCard>
                </Grid>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <SectionManagement />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                >
                    <Card elevation={1}>
                        <CardContent>
                            <SchoolUsersManagement
                                users={selectedSchool.users}
                                manager={selectedSchool.manager}
                                onAddUser={handleAddUser}
                                onRemoveUser={handleRemoveUser}
                                onChangeManager={handleChangeManager}
                                isDialog={false}
                            />
                        </CardContent>
                    </Card>
                </motion.div>
            </TabPanel>

            <SchoolEditForm
                open={isEditMode}
                onClose={() => setIsEditMode(false)}
                onSave={handleUpdateSchool}
                school={selectedSchool}
            />
        </Container>
    );
};


export default SchoolDetails;