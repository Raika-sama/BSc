import React from 'react';
import {
    Box,
    Typography,
    Button,
    Chip,
    Tooltip,
    IconButton
} from '@mui/material';
import {
    ArrowBack as ArrowBackIcon,
    GroupAdd as GroupAddIcon,
    Quiz as QuizIcon,
    Send as SendIcon,
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    AccessTime as AccessTimeIcon,
    School as SchoolIcon
} from '@mui/icons-material';

const HeaderSection = ({ 
    classData, 
    expandedInfo, 
    setExpandedInfo, 
    onBack,
    onPopulate,
    onTests,
    onSendTest 
}) => {
    const canPopulateClass = (classData) => {
        return classData.isActive && 
            (classData.status === 'active' || classData.status === 'planned');
    };

    return (
        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={4}>
                <Box>
                    <Typography variant="h5" color="primary" gutterBottom={false}>
                        Classe {classData.year}{classData.section}
                    </Typography>
                    <Typography variant="subtitle2" color="text.secondary">
                        Anno Accademico: {classData.academicYear}
                    </Typography>
                </Box>
                <Box display="flex" gap={3}>
                    <Chip
                        icon={<AccessTimeIcon />}
                        label={classData.status.toUpperCase()}
                        color={classData.isActive ? "success" : "default"}
                        size="small"
                    />
                    <Chip
                        icon={<SchoolIcon />}
                        label={classData.schoolId.name}
                        color="primary"
                        size="small"
                    />
                </Box>
            </Box>

            <Box display="flex" alignItems="center">
                <Button
                    variant="outlined"
                    startIcon={<ArrowBackIcon />}
                    onClick={onBack}
                    sx={{ mr: 1 }}
                    size="small"
                >
                    Indietro
                </Button>
                <Tooltip title={
                    !canPopulateClass(classData)
                        ? "La classe deve essere attiva per poter essere popolata"
                        : "Aggiungi studenti alla classe"
                }>
                    <span>
                        <Button
                            variant="contained"
                            startIcon={<GroupAddIcon />}
                            onClick={onPopulate}
                            disabled={!canPopulateClass(classData)}
                            sx={{ mr: 1 }}
                            size="small"
                        >
                            Popola
                        </Button>
                    </span>
                </Tooltip>
                <Button
                    variant="contained"
                    startIcon={<QuizIcon />}
                    onClick={onTests}
                    sx={{ mr: 2 }}
                    size="small"
                    disabled
                >
                    Test
                </Button>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<SendIcon />}
                    onClick={onSendTest}
                    sx={{ mr: 2 }}
                    size="small"
                    disabled
                >
                    Invia Test
                </Button>
                <IconButton 
                    onClick={() => setExpandedInfo(!expandedInfo)}
                    size="small"
                >
                    {expandedInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
            </Box>
        </Box>
    );
};

export default HeaderSection;