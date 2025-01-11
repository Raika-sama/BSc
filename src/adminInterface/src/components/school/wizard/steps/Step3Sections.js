import React from 'react';
import {
    Grid,
    Typography,
    Autocomplete,
    TextField,
    Box,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const AVAILABLE_SECTIONS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ').map(letter => ({
    label: letter,
    value: letter
}));

const Step3Sections = ({ formData, onChange, errors = {} }) => {
    const handleAddSection = (event, newValue) => {
        const sections = newValue.map(item => ({
            name: item.value,
            maxStudents: formData.defaultMaxStudentsPerClass || 25
        }));
        
        onChange({
            ...formData,
            sections: sections
        });
    };

    const handleUpdateSectionMaxStudents = (sectionName, newValue) => {
        const maxAllowed = formData.schoolType === 'middle_school' ? 30 : 35;
        const value = Math.min(Math.max(15, Number(newValue)), maxAllowed);

        const updatedSections = formData.sections.map(section => 
            section.name === sectionName 
                ? { ...section, maxStudents: value }
                : section
        );

        onChange({
            ...formData,
            sections: updatedSections
        });
    };

    const handleRemoveSection = (sectionName) => {
        const updatedSections = formData.sections.filter(
            section => section.name !== sectionName
        );
        onChange({
            ...formData,
            sections: updatedSections
        });
    };

    const selectedSections = formData.sections?.map(section => ({
        label: section.name,
        value: section.name
    })) || [];

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                    Configurazione Sezioni
                </Typography>
            </Grid>

            <Grid item xs={12}>
                <Autocomplete
                    multiple
                    options={AVAILABLE_SECTIONS}
                    value={selectedSections}
                    onChange={handleAddSection}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Seleziona Sezioni"
                            error={!!errors.sections}
                            helperText={errors.sections}
                        />
                    )}
                    renderTags={(tagValue, getTagProps) =>
                        tagValue.map((option, index) => {
                            const { key, ...otherProps } = getTagProps({ index });
                            return (
                                <Chip
                                    key={key}
                                    label={option.label}
                                    {...otherProps}
                                    size="small"
                                />
                            );
                        })
                    }
                />
            </Grid>

            {formData.sections?.length > 0 && (
                <Grid item xs={12}>
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Sezione</TableCell>
                                    <TableCell align="center">Numero Massimo Studenti</TableCell>
                                    <TableCell align="right">Azioni</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {formData.sections.map((section) => (
                                    <TableRow key={section.name}>
                                        <TableCell>
                                            <Typography variant="body1">
                                                Sezione {section.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="center">
                                            <TextField
                                                type="number"
                                                value={section.maxStudents}
                                                onChange={(e) => handleUpdateSectionMaxStudents(
                                                    section.name,
                                                    e.target.value
                                                )}
                                                InputProps={{
                                                    inputProps: {
                                                        min: 15,
                                                        max: formData.schoolType === 'middle_school' ? 30 : 35,
                                                        style: { textAlign: 'center' }
                                                    }
                                                }}
                                                size="small"
                                                sx={{ width: '100px' }}
                                            />
                                        </TableCell>
                                        <TableCell align="right">
                                            <Tooltip title="Rimuovi sezione">
                                                <IconButton
                                                    onClick={() => handleRemoveSection(section.name)}
                                                    size="small"
                                                    color="error"
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            )}

            {formData.sections?.length > 0 && (
                <Grid item xs={12}>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                            * Il numero massimo di studenti per classe è limitato a:
                            {formData.schoolType === 'middle_school' 
                                ? ' 30 studenti per le scuole medie'
                                : ' 35 studenti per le scuole superiori'}
                        </Typography>
                    </Box>
                </Grid>
            )}
        </Grid>
    );
};

export default Step3Sections;