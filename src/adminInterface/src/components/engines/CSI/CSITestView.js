import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Settings as SettingsIcon,
    Assessment as AssessmentIcon,
    School as SchoolIcon,
    QuestionAnswer as QuestionIcon
} from '@mui/icons-material';
import CSIConfigurationPanel from './CSIConfigurationPanel';
import CSIQuestionsPanel from './CSIQuestionsPanel';

const TabPanel = ({ children, value, index, ...other }) => (
    <Box
        role="tabpanel"
        hidden={value !== index}
        {...other}
        sx={{ 
            height: 'calc(100vh - 180px)',
            display: 'flex',              // Aggiungiamo flex
            flexDirection: 'column',      // Organizziamo in colonna
            overflow: 'hidden'            // Cambiamo in hidden
        }}
    >
        {value === index && (
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                {children}
            </Box>
        )}
    </Box>
);

const CSITestView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [tabValue, setTabValue] = useState(
        location.pathname.includes('/questions') ? 1 : 0
    );

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
        switch(newValue) {
            case 0:
                navigate('/admin/engines/csi');
                break;
            case 1:
                navigate('/admin/engines/csi/questions');
                break;
            // Aggiungi altri casi per le altre tab quando necessario
            default:
                navigate('/admin/engines/csi');
        }
    };

    return (
        <Box 
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{ p: 3 }}
        >
            <Paper 
                elevation={0}
                sx={{ 
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange}
                        sx={{
                            '& .MuiTab-root': {
                                minHeight: 64,
                                textTransform: 'none'
                            }
                        }}
                    >
                        <Tab 
                            icon={<SettingsIcon />} 
                            label="Configurazione" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<QuestionIcon />} 
                            label="Domande" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<AssessmentIcon />} 
                            label="Risultati" 
                            iconPosition="start"
                        />
                        <Tab 
                            icon={<SchoolIcon />} 
                            label="Statistiche Scuole" 
                            iconPosition="start"
                        />
                    </Tabs>
                </Box>

                {/* Contenuto dei Tab Panel */}
                <TabPanel value={tabValue} index={0}>
                    <CSIConfigurationPanel />
                </TabPanel>
                
                <TabPanel value={tabValue} index={1}>
                    <CSIQuestionsPanel />
                </TabPanel>
                
                <TabPanel value={tabValue} index={2}>
                    {/* Componente Risultati - da implementare */}
                    <Box>Risultati - Coming Soon</Box>
                </TabPanel>
                
                <TabPanel value={tabValue} index={3}>
                    {/* Componente Statistiche Scuole - da implementare */}
                    <Box>Statistiche Scuole - Coming Soon</Box>
                </TabPanel>
            </Paper>
        </Box>
    );
};

export default CSITestView;