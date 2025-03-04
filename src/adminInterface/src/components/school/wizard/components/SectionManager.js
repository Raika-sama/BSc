import React from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    IconButton,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Button,
    Alert
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon
} from '@mui/icons-material';

const SectionManager = ({ 
    sections, 
    onSectionsChange, 
    defaultMaxStudents, 
    schoolType, 
    errors 
}) => {
    const maxLimit = schoolType === 'middle_school' ? 30 : 35;
    
    const addSection = () => {
        // Trova la prossima lettera disponibile
        const usedLetters = new Set(sections.map(s => s.name));
        const nextLetter = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
            .find(letter => !usedLetters.has(letter));

        if (nextLetter) {
            onSectionsChange([
                ...sections,
                {
                    name: nextLetter,
                    maxStudents: defaultMaxStudents
                }
            ]);
        }
    };

    const removeSection = (index) => {
        const newSections = [...sections];
        newSections.splice(index, 1);
        onSectionsChange(newSections);
    };

    const updateSection = (index, field, value) => {
        const newSections = [...sections];
        newSections[index] = {
            ...newSections[index],
            [field]: field === 'name' ? value.toUpperCase() : parseInt(value)
        };
        onSectionsChange(newSections);
    };

    const getSectionError = (index, field) => {
        if (!errors?.sections) return null;
        if (typeof errors.sections === 'string') return null;
        return errors.sections[index]?.[field];
    };

    return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    Sezioni ({sections.length})
                </Typography>
                <Button
                    startIcon={<AddIcon />}
                    onClick={addSection}
                    disabled={sections.length >= 26}
                    variant="outlined"
                >
                    Aggiungi Sezione
                </Button>
            </Box>

            {typeof errors?.sections === 'string' && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    {errors.sections}
                </Alert>
            )}

            <Grid container spacing={2}>
                {sections.map((section, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card variant="outlined">
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Chip
                                        label={section.name || '?'}
                                        color="primary"
                                        variant="outlined"
                                        sx={{ mr: 1, fontWeight: 'bold' }}
                                    />
                                    <TextField
                                        size="small"
                                        label="Nome"
                                        value={section.name}
                                        onChange={(e) => updateSection(index, 'name', e.target.value)}
                                        error={!!getSectionError(index, 'name')}
                                        helperText={getSectionError(index, 'name')}
                                        sx={{ flex: 1 }}
                                        inputProps={{
                                            maxLength: 1,
                                            style: { textTransform: 'uppercase' }
                                        }}
                                    />
                                    <Tooltip title="Rimuovi sezione">
                                        <IconButton 
                                            color="error" 
                                            onClick={() => removeSection(index)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Box>

                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Numero massimo studenti"
                                    value={section.maxStudents}
                                    onChange={(e) => updateSection(index, 'maxStudents', e.target.value)}
                                    error={!!getSectionError(index, 'maxStudents')}
                                    helperText={getSectionError(index, 'maxStudents')}
                                    InputProps={{
                                        inputProps: { 
                                            min: Math.floor(defaultMaxStudents * 0.5),
                                            max: Math.ceil(defaultMaxStudents * 1.2)
                                        }
                                    }}
                                    size="small"
                                />

                                {section.maxStudents !== defaultMaxStudents && (
                                    <Box sx={{ mt: 1 }}>
                                        <Chip
                                            label={`${section.maxStudents > defaultMaxStudents ? '+' : ''}${section.maxStudents - defaultMaxStudents}`}
                                            color={section.maxStudents > defaultMaxStudents ? "warning" : "info"}
                                            size="small"
                                        />
                                    </Box>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {sections.length === 0 && (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Aggiungi almeno una sezione per continuare
                </Alert>
            )}

            {sections.length >= 26 && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                    Hai raggiunto il numero massimo di sezioni (A-Z)
                </Alert>
            )}
        </Box>
    );
};

export default SectionManager;