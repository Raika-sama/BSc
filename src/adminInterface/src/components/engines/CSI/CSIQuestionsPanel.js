// CSIQuestionsPanel.js
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
    Chip,
    Dialog,
    Button,
    Stack
} from '@mui/material';
import { Edit as EditIcon, Add as AddIcon } from '@mui/icons-material';
import { useTest } from '../../../context/TestContext';
import CSIQuestionDialog from './CSIQuestionDialog'; // Nuovo componente

const QuestionsPanel = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { loading, getTestQuestions, updateTestQuestion } = useTest();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        const data = await getTestQuestions('CSI');
        setQuestions(data);
    };

    const handleEditClick = (question) => {
        setSelectedQuestion(question);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedQuestion(null);
        setIsDialogOpen(false);
    };

    const handleSaveQuestion = async (updatedQuestion) => {
        await updateTestQuestion(updatedQuestion);
        await fetchQuestions();
        handleCloseDialog();
    };

    return (
        <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                    Gestione Domande CSI
                </Typography>
                <Button 
                    startIcon={<AddIcon />}
                    variant="contained" 
                    onClick={() => handleEditClick(null)}
                >
                    Nuova Domanda
                </Button>
            </Stack>
            
            <TableContainer component={Paper} elevation={0}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>ID</TableCell>
                            <TableCell>Domanda</TableCell>
                            <TableCell>Categoria</TableCell>
                            <TableCell>Polarità</TableCell>
                            <TableCell>Versione</TableCell>
                            <TableCell>Stato</TableCell>
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
                                    <Chip 
                                        label={question.version}
                                        size="small"
                                        color="info"
                                    />
                                </TableCell>
                                <TableCell>
                                    <Chip 
                                        label={question.active ? 'Attiva' : 'Inattiva'}
                                        size="small"
                                        color={question.active ? 'success' : 'default'}
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton 
                                        size="small"
                                        onClick={() => handleEditClick(question)}
                                    >
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <CSIQuestionDialog 
                open={isDialogOpen}
                question={selectedQuestion}
                onClose={handleCloseDialog}
                onSave={handleSaveQuestion}
            />
        </Box>
    );
};

export default QuestionsPanel;