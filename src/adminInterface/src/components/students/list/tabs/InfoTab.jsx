import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { 
    Box, 
    Typography, 
    Paper,
    Grid,
    Button,
    Divider
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import StudentEditForm from './StudentEditForm';

const InfoTab = ({ student, setStudent }) => {
    const [isEditing, setIsEditing] = useState(false);

    const handleEditClick = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
    };

    // Vista delle informazioni
    const InfoView = () => (
        <Box>
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 3 
            }}>
                <Typography variant="h6">
                    Dati Personali
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={handleEditClick}
                    size="small"
                >
                    Modifica
                </Button>
            </Box>

            <Grid container spacing={3}>
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
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Nome Completo
                                    </Typography>
                                    <Typography variant="body1">
                                        {`${student.firstName} ${student.lastName}`}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Email
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.email}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Codice Fiscale
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.fiscalCode || 'Non specificato'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>

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
                            Contatti e Indirizzo
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Telefono
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.phone || 'Non specificato'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Indirizzo
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.address || 'Non specificato'}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="body2" color="text.secondary">
                                        Città
                                    </Typography>
                                    <Typography variant="body1">
                                        {student.city || 'Non specificata'}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );

    return (
        <Box>
            {isEditing ? (
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
                        onCancel={handleCancelEdit}
                    />
                </Box>
            ) : (
                <InfoView />
            )}
        </Box>
    );
};

InfoTab.propTypes = {
    student: PropTypes.shape({
        firstName: PropTypes.string.isRequired,
        lastName: PropTypes.string.isRequired,
        email: PropTypes.string.isRequired,
        fiscalCode: PropTypes.string,
        phone: PropTypes.string,
        address: PropTypes.string,
        city: PropTypes.string,
    }).isRequired,
    setStudent: PropTypes.func.isRequired,
};

export default InfoTab;