import React from 'react';
import {
    Box,
    Typography,
    Chip,
    IconButton,
} from '@mui/material';
import {
    ExpandLess as ExpandLessIcon,
    ExpandMore as ExpandMoreIcon,
    AccessTime as AccessTimeIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Email as EmailIcon  // Era usata direttamente Email invece di EmailIcon
} from '@mui/icons-material';

const HeaderSection = ({ 
    classData, 
    expandedInfo, 
    setExpandedInfo
}) => {
    return (
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box display="flex" alignItems="flex-start" gap={4}>
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
                {classData.mainTeacher && (
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon color="action" fontSize="small" />
                            <Typography variant="body2">
                                {classData.mainTeacher.firstName} {classData.mainTeacher.lastName}
                            </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon color="action" fontSize="small" /> {/* Corretto qui */}
                            <Typography variant="body2" color="text.secondary">
                                {classData.mainTeacher.email}
                            </Typography>
                        </Box>
                    </Box>
                )}
            </Box>

            <IconButton 
                onClick={() => setExpandedInfo(!expandedInfo)}
                size="small"
            >
                {expandedInfo ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
        </Box>
    );
};

export default HeaderSection;