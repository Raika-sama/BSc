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
import { useTest } from '../../../context/TestContext';
import CSIQuestionDialog from './CSIQuestionDialog';
import ListLayout from '../../common/ListLayout';

const QuestionsPanel = () => {
    // Stati
    const [questions, setQuestions] = useState([]);
    const [selectedQuestion, setSelectedQuestion] = useState(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { loading, getTestQuestions, updateTestQuestion } = useTest();

    // Effetti
    useEffect(() => {
        fetchQuestions();
    }, []);

    // Handlers
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
            renderCell: (params) => (
                <Chip 
                    label={params.value || 1}
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
                height: '100%',           // Usiamo tutto lo spazio disponibile
                display: 'flex',          // Organizziamo in flex
                flexDirection: 'column',  // In colonna
                p: 3,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2
            }}
        >
            <Box sx={{ mb: 3 }}>
                <Typography variant="h6">
                    Gestione Domande CSI
                </Typography>
            </Box>
            
            <Divider sx={{ mb: 3 }} />

            <Box sx={{ 
                flex: 1,                  // Prende tutto lo spazio rimanente
                minHeight: 0,             // Importante per il flex!
                overflow: 'hidden'        // Gestiamo l'overflow qui
            }}>
                <ListLayout
                    rows={questions}
                    columns={columns}
                    getRowId={(row) => row.id}
                    loading={loading}
                    onRefresh={fetchQuestions}
                    searchPlaceholder="Cerca domande..."
                    onSearch={() => {}}
                    emptyStateMessage="Nessuna domanda disponibile"
                    sx={{ 
                        height: '100%',   // Usa tutto lo spazio del contenitore
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