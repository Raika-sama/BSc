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

const InfoSection = ({ expandedInfo, classData }) => {
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
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Docente Principale
                    </Typography>
                    {classData.mainTeacher && (
                        <Box>
                            <InfoField 
                                label="Nome" 
                                value={`${classData.mainTeacher.firstName} ${classData.mainTeacher.lastName}`} 
                            />
                            <InfoField label="Email" value={classData.mainTeacher.email} />
                            <InfoField label="ID" value={classData.mainTeacher._id} />
                        </Box>
                    )}
                </Grid>

                <Grid item xs={12} md={4}>
                    <Typography variant="subtitle1" color="primary" gutterBottom>
                        Altri Docenti
                    </Typography>
                    {classData.teachers && classData.teachers.length > 0 ? (
                        classData.teachers.map((teacher) => (
                            <Box key={teacher._id} sx={{ mb: 1 }}>
                                <Typography variant="body2">
                                    {`${teacher.firstName} ${teacher.lastName}`}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {teacher.email}
                                </Typography>
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Nessun docente aggiuntivo
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