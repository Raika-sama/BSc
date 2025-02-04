import React, { useEffect, useState } from 'react';
import { 
    IconButton,
    Chip,
    Button,
    Paper,
    Typography,
    Divider,
    Box
} from '@mui/material';
import { 
    Edit as EditIcon, 
    Add as AddIcon 
} from '@mui/icons-material';
import { useCSITest } from '../../../context/TestContext/CSITestContext';
import CSIQuestionDialog from './CSIQuestionDialog';
import ListLayout from '../../common/ListLayout';

const QuestionsPanel = () => {
    // Stati
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { loading, getTestQuestions, updateTestQuestion } = useCSITest(); // Changed from useTest to useCSITest

    // Effetti
    useEffect(() => {
        fetchQuestions();
    }, []);

    // Handlers
    const fetchQuestions = async () => {
        const data = await getTestQuestions();
        console.log('Questions received:', data); // Aggiungiamo questo log
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
        console.log('Saving question with data:', updatedQuestion); // Log per debug
        await updateTestQuestion(updatedQuestion);
        await fetchQuestions();
        handleCloseDialog();
    };
    // Definizione colonne
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
            field: 'polarity',
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
            valueGetter: (params) => {
                // Accediamo al weight attraverso metadata
                return params.row.metadata?.weight || 1;
            },
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
            field: 'version',
            headerName: 'Versione',
            width: 120,
            // Aggiungiamo log per vedere cosa riceviamo
            valueGetter: (params) => {
                return params.row.version || '1.0.0';
            },
            renderCell: (params) => (
                <Chip 
                    label={params.value}
                    size="small"
                    color="info"
                />
            )
        },
        {
            field: 'active',
            headerName: 'Stato',
            width: 120,
            // Aggiungiamo log per vedere cosa riceviamo
            valueGetter: (params) => {
                return params.row.active ?? true;
            },
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

    // Action button per la toolbar
    const AddQuestionButton = () => (
        <Button 
            startIcon={<AddIcon />}
            variant="contained" 
            onClick={() => handleEditClick(null)}
            sx={{ ml: 2 }}
        >
            Nuova Domanda
        </Button>
    );

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
                <AddQuestionButton />
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ height: 'calc(100vh - 380px)' }}>
                <ListLayout
                    rows={questions}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    onRefresh={fetchQuestions}
                    searchPlaceholder="Cerca domande..."
                    onSearch={() => {}} // Implementare se necessario
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
            />
        </Paper>
    );
};

export default QuestionsPanel;