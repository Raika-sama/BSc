// InfoSection.js
import React from 'react';
import {
    Box,
    Typography,
    Grid,
    Divider,
    Collapse
} from '@mui/material';

const InfoField = ({ label, value, color = "textSecondary" }) => (
    <Box mb={1.5}>
        <Typography variant="subtitle2" color={color}>{label}</Typography>
        <Typography variant="body1">{value}</Typography>
    </Box>
);

const InfoSection = ({ 
    expandedInfo, 
    classData
}) => {
    return (
        <Collapse in={expandedInfo}>
            <Divider />
            <Box sx={{ p: 2 }}>
                <Grid container spacing={3}>
                    {/* Dettagli Classe */}
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

                    {/* Statistiche */}
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Statistiche
                            </Typography>
                            <InfoField 
                                label="Studenti Attivi" 
                                value={classData.students.filter(s => s.status === 'active').length} 
                            />
                            <InfoField 
                                label="Docenti Aggiuntivi" 
                                value={classData.teachers?.length || 0} 
                            />
                            <InfoField 
                                label="Stato" 
                                value={classData.status.toUpperCase()} 
                                color={classData.isActive ? "success" : "error"}
                            />
                        </Box>
                    </Grid>

                    {/* Date */}
                    <Grid item xs={12} md={4}>
                        <Box>
                            <Typography variant="subtitle1" color="primary" gutterBottom>
                                Date
                            </Typography>
                            <InfoField 
                                label="Data Creazione" 
                                value={new Date(classData.createdAt).toLocaleString()} 
                            />
                            <InfoField 
                                label="Ultima Modifica" 
                                value={new Date(classData.updatedAt).toLocaleString()} 
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Collapse>
    );
};

export default InfoSection;