// src/components/engines/CSI/components/QuestionsPanel.js
import React, { useEffect, useState } from 'react';
import { 
    Box, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Typography,
    IconButton,
    Chip
} from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { useTest } from '../../../context/TestContext';

const QuestionsPanel = () => {
    const [questions, setQuestions] = useState([]);
    const { loading, getTestQuestions } = useTest();

    useEffect(() => {
        const fetchQuestions = async () => {
            const data = await getTestQuestions('CSI');
            setQuestions(data);
        };
        fetchQuestions();
    }, [getTestQuestions]);

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Gestione Domande CSI
            </Typography>
            
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Domanda</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Polarità</TableCell>
                            <TableCell>Azioni</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {questions.map((question) => (
                            <TableRow key={question.id}>
                                <TableCell>{question.id}</TableCell>
                                <TableCell>{question.testo}</TableCell>
                                <TableCell>
                                    <Chip 
                                        label={question.categoria}
                                        size="small"
                                        color="primary"
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={question.metadata.polarity === '+' ? 'Positiva' : 'Negativa'}
                                        size="small"
                                        color={question.metadata.polarity === '+' ? 'success' : 'error'}
                                        variant="outlined"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton size="small">
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default QuestionsPanel;