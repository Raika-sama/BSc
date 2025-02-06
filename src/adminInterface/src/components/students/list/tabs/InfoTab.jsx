import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    Paper,
    Grid,
    Button,
    Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StudentEditForm from './StudentEditForm';

const InfoTab = ({ student, setStudent }) => {
    const [isEditing, setIsEditing] = useState(false);

    // Vista informativa
    const InfoView = () => (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
            }}>
                <Box>
                    <Typography variant="h6" gutterBottom>
                        Dati Personali
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Informazioni personali dello studente
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                    size="small"
                >
                    Modifica
                </Button>
            </Box>

            <Grid container spacing={3}>
                {/* Informazioni Personali */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Informazioni Personali
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Nome Completo
                                </Typography>
                                <Typography variant="body1">
                                    {`${student.firstName} ${student.lastName}`}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Codice Fiscale
                                </Typography>
                                <Typography variant="body1">
                                    {student.fiscalCode || 'Non specificato'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Data di Nascita
                                </Typography>
                                <Typography variant="body1">
                                    {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('it-IT') : 'Non specificata'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Genere
                                </Typography>
                                <Typography variant="body1">
                                    {student.gender === 'M' ? 'Maschio' : student.gender === 'F' ? 'Femmina' : 'Non specificato'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Contatti */}
                <Grid item xs={12} md={6}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Contatti
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Email
                                </Typography>
                                <Typography variant="body1">
                                    {student.email}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Email Genitore
                                </Typography>
                                <Typography variant="body1">
                                    {student.parentEmail || 'Non specificata'}
                                </Typography>
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>

                {/* Docenti */}
                <Grid item xs={12}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            p: 3,
                            borderRadius: 2,
                            border: '1px solid',
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                            Docenti Assegnati
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 2 }}>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Docente Principale
                                </Typography>
                                <Typography variant="body1">
                                    {student.mainTeacher ? 
                                        `${student.mainTeacher.firstName} ${student.mainTeacher.lastName}` : 
                                        'Non assegnato'}
                                </Typography>
                            </Box>
                            <Box>
                                <Typography variant="body2" color="text.secondary">
                                    Altri Docenti
                                </Typography>
                                {student.teachers && student.teachers.length > 0 ? (
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        {student.teachers.map(teacher => (
                                            <Typography key={teacher._id} variant="body1">
                                                {`${teacher.firstName} ${teacher.lastName}`}
                                            </Typography>
                                        ))}
                                    </Stack>
                                ) : (
                                    <Typography variant="body1">Nessun docente aggiuntivo assegnato</Typography>
                                )}
                            </Box>
                        </Stack>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );

    return isEditing ? (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Modifica Dati Personali
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Modifica le informazioni personali dello studente
                </Typography>
            </Box>
            <StudentEditForm 
                student={student} 
                setStudent={setStudent}
                onCancel={() => setIsEditing(false)}
            />
        </Box>
    ) : (
        <InfoView />
    );
};

InfoTab.propTypes = {
    student: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        fiscalCode: PropTypes.string,
        dateOfBirth: PropTypes.string,
        gender: PropTypes.string,
        parentEmail: PropTypes.string,
        mainTeacher: PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string,
        }),
        teachers: PropTypes.arrayOf(PropTypes.shape({
            _id: PropTypes.string,
            firstName: PropTypes.string,
            lastName: PropTypes.string,
        })),
    }).isRequired,
    setStudent: PropTypes.func.isRequired,
};

export default InfoTab;