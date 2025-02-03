import React, { useState } from 'react';
import { Box, Paper, Tabs, Tab, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
    Settings as SettingsIcon,
    Assessment as AssessmentIcon,
    School as SchoolIcon,
    QuestionAnswer as QuestionIcon,
    ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import { ContentLayout } from '../../common/commonIndex';
import CSIConfigurationPanel from './CSIConfigurationPanel';
import CSIQuestionsPanel from './CSIQuestionsPanel';

const TabPanel = ({ children, value, index, ...other }) => {
    if (value !== index) return null;
    
    return (
        <Box
            role="tabpanel"
            aria-hidden={value !== index}
            {...other}
            className="h-full w-full overflow-auto"
            sx={{
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    backgroundColor: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#888',
                    borderRadius: '4px',
                },
            }}
        >
            <Box className="p-4 min-h-full">
                {children}
            </Box>
        </Box>
    );
};

const CSITestView = () => {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleBack = () => {
        navigate(-1);
    };

    const tabs = [
        { icon: <SettingsIcon />, label: "Configurazione", component: <CSIConfigurationPanel /> },
        { icon: <QuestionIcon />, label: "Domande", component: <CSIQuestionsPanel /> },
        { icon: <AssessmentIcon />, label: "Risultati", component: <Box>Risultati - Coming Soon</Box> },
        { icon: <SchoolIcon />, label: "Statistiche Scuole", component: <Box>Statistiche Scuole - Coming Soon</Box> }
    ];

    return (
        <ContentLayout
            title="Test CSI"
            subtitle="Gestione del test Cognitive Style Inventory"
            actions={
                <IconButton
                    onClick={handleBack}
                    component={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                >
                    <ArrowBackIcon />
                </IconButton>
            }
        >
            <Paper 
                elevation={0}
                className="h-full flex flex-col overflow-hidden"
                sx={{ 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                }}
            >
                {/* Tabs Header */}
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
                        {tabs.map((tab, index) => (
                            <Tab 
                                key={index}
                                icon={tab.icon} 
                                label={tab.label} 
                                iconPosition="start"
                            />
                        ))}
                    </Tabs>
                </Box>

                {/* Tabs Content */}
                <Box className="flex-1 overflow-hidden">
                    {tabs.map((tab, index) => (
                        <TabPanel 
                            key={index} 
                            value={tabValue} 
                            index={index}
                        >
                            {tab.component}
                        </TabPanel>
                    ))}
                </Box>
            </Paper>
        </ContentLayout>
    );
};

export default CSITestView;