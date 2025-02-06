import React from 'react';
import { Box, Typography } from '@mui/material';
import StudentEditForm from './StudentEditForm';

const InfoTab = ({ student, setStudent }) => {
    return (
        <Box>
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Dati Personali
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Gestisci le informazioni personali dello studente
                </Typography>
            </Box>

            <StudentEditForm 
                student={student} 
                setStudent={setStudent}
            />
        </Box>
    );
};

export default InfoTab;