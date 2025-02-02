// InfoSection.js
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Divider,
    Collapse,
    Button,
    IconButton,
    Tooltip
} from '@mui/material';
import {
    PersonAdd as PersonAddIcon,
    PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';

const InfoField = ({ label, value, color = "textSecondary" }) => (
    <Box mb={1.5}>
        <Typography variant="subtitle2" color={color}>{label}</Typography>
        <Typography variant="body1">{value}</Typography>
    </Box>
);

const InfoSection = ({ 
    expandedInfo, 
    classData,
    onAddMainTeacher,  // Nuova prop
    onRemoveMainTeacher // Nuova prop
}) => {
    return (
        <Collapse in={expandedInfo}>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Box>
                        <Typography variant="subtitle1" color="primary" gutterBottom>
                            Dettagli Classe
                        </Typography>
                        <InfoField label="ID Classe" value={classData._id} />
                        <InfoField label="ID Scuola" value={classData.schoolId._id} />
                        <InfoField label="Scuola" value={classData.schoolId.name} />
                        <InfoField label="Capacità" value={`${classData.students.length}/${classData.capacity}`} />
                    </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="subtitle1" color="primary">
                            Docente Principale
                        </Typography>
                        {classData.mainTeacher ? (
                            <Tooltip title="Rimuovi docente principale">
                                <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={onRemoveMainTeacher}
                                >
                                    <PersonRemoveIcon />
                                </IconButton>
                            </Tooltip>
                        ) : (
                            <Tooltip title="Aggiungi docente principale">
                                <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<PersonAddIcon />}
                                    onClick={onAddMainTeacher}
                                >
                                    Aggiungi
                                </Button>
                            </Tooltip>
                        )}
                    </Box>
                    {classData.mainTeacher ? (
                        <Box>
                            <InfoField 
                                label="Nome" 
                                value={`${classData.mainTeacher.firstName} ${classData.mainTeacher.lastName}`} 
                            />
                            <InfoField label="Email" value={classData.mainTeacher.email} />
                            <InfoField label="ID" value={classData.mainTeacher._id} />
                        </Box>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Nessun docente principale assegnato
                        </Typography>
                    )}
                </Grid>

                <Grid item xs={12}>
                    <Typography variant="caption" color="text.secondary">
                        Ultima modifica: {new Date(classData.updatedAt).toLocaleString()}
                    </Typography>
                </Grid>
            </Grid>
        </Collapse>
    );
};

export default InfoSection;