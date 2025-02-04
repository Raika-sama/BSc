// CSIQuestionsPanel.js
import React, { useEffect, useState } from 'react';
import { 
    IconButton,
    Chip,
    Button,
    Paper,
    Typography,
    Divider,
    Box,
    Alert
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Add as AddIcon 
} from '@mui/icons-material';
import { useCSITest } from '../../../context/TestContext/CSITestContext';
import CSIQuestionDialog from './CSIQuestionDialog';
import ListLayout from '../../common/ListLayout';

const QuestionsPanel = () => {
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { loading, error, getTestQuestions, updateTestQuestion, createTestQuestion } = useCSITest();

    useEffect(() => {
        fetchQuestions();
    }, []);

    const fetchQuestions = async () => {
        try {
            const data = await getTestQuestions();
            console.log('Questions received:', data);
            setQuestions(data || []); // Aggiunto fallback a array vuoto
        } catch (err) {
            console.error('Error fetching questions:', err);
        }
    };

    const handleEditClick = (question) => {
        setSelectedQuestion(question);
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setSelectedQuestion(null);
        setIsDialogOpen(false);
    };

    const handleSaveQuestion = async (questionData) => {
        try {
            if (questionData.id) {
                await updateTestQuestion(questionData);
            } else {
                await createTestQuestion(questionData);
            }
            await fetchQuestions();
            handleCloseDialog();
        } catch (err) {
            console.error('Error saving question:', err);
        }
    };

    const columns = [
        { 
            field: 'id', 
            headerName: 'ID', 
            width: 70 
        },
        { 
            field: 'testo', 
            headerName: 'Domanda', 
            flex: 1,
            minWidth: 300
        },
        {
            field: 'categoria',
            headerName: 'Categoria',
            width: 150,
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    size="small"
                    color="primary"
                    variant="outlined"
                />
            )
        },
        {
            field: 'metadata',
            headerName: 'Polarità',
            width: 120,
            valueGetter: (params) => params.row.metadata?.polarity,
            renderCell: (params) => (
                <Chip 
                    label={params.value === '+' ? 'Positiva' : 'Negativa'}
                    size="small"
                    color={params.value === '+' ? 'success' : 'error'}
                    variant="outlined"
                />
            )
        },
        {
            field: 'weight',
            headerName: 'Peso',
            width: 100,
            valueGetter: (params) => params.row.metadata?.weight || 1,
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    size="small"
                    color="info"
                    variant="outlined"
                />
            )
        },
        {
            field: 'difficultyLevel',
            headerName: 'Difficoltà',
            width: 120,
            valueGetter: (params) => params.row.metadata?.difficultyLevel || 'medio',
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    size="small"
                    color="default"
                />
            )
        },
        {
            field: 'active',
            headerName: 'Stato',
            width: 120,
            valueGetter: (params) => params.row.active ?? true,
            renderCell: (params) => (
                <Chip 
                    label={params.value ? 'Attiva' : 'Inattiva'}
                    size="small"
                    color={params.value ? 'success' : 'default'}
                />
            )
        },
        {
            field: 'actions',
            headerName: 'Azioni',
            width: 100,
            sortable: false,
            renderCell: (params) => (
                <IconButton 
                    size="small"
                    onClick={() => handleEditClick(params.row)}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
            )
        }
    ];

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                height: '100%'
            }}
        >
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
            </Box>
            
            {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {error.message}
                </Alert>
            )}
            
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ height: 'calc(100vh - 380px)' }}>
                <ListLayout
                    rows={questions}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading.questions} // Modificato qui per usare il corretto stato loading
                    onRefresh={fetchQuestions}
                    searchPlaceholder="Cerca domande..."
                    onSearch={() => {}}
                    emptyStateMessage="Nessuna domanda disponibile"
                    sx={{ 
                        '& .MuiDataGrid-root': {
                            border: 'none',
                            backgroundColor: 'background.paper'
                        }
                    }}
                />
            </Box>

            <CSIQuestionDialog 
                open={isDialogOpen}
                question={selectedQuestion}
                onClose={handleCloseDialog}
                onSave={handleSaveQuestion}
                error={loading.saving ? 'Salvataggio in corso...' : error?.message}
            />
        </Paper>
    );
};

export default QuestionsPanel;