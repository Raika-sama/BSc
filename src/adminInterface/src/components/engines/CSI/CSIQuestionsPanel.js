import React, { useEffect, useState } from 'react';
import { 
    IconButton,
    Chip,
    Button,
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

    // Custom actions per la toolbar
    const customActions = (
        <Button 
            startIcon={<AddIcon />}
            variant="contained" 
            onClick={() => handleEditClick(null)}
        >
            Nuova Domanda
        </Button>
    );

    return (
        <Box sx={{ height: '100%' }}>
            <ListLayout
                rows={questions}
                columns={columns}
                getRowId={(row) => row.id}
                loading={loading}
                onRefresh={fetchQuestions}
                searchPlaceholder="Cerca domande..."
                onSearch={() => {}}
                customActions={customActions}
                emptyStateMessage="Nessuna domanda disponibile"
                sx={{ 
                    minHeight: 'unset',
                    '& .MuiBox-root': {
                        minHeight: 'unset'
                    }
                }}
            />

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