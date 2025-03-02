// src/components/school/SchoolTypeChangeModal.js
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Divider,
    CircularProgress,
    Grid
} from '@mui/material';
import {
    School as SchoolIcon,
    Warning as WarningIcon,
    CheckCircle as CheckCircleIcon,
    Block as BlockIcon
} from '@mui/icons-material';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import { axiosInstance } from '../../../services/axiosConfig';

const SchoolTypeChangeModal = ({ open, onClose, school }) => {
    const { updateSchool, loading } = useSchool();
    const { showNotification } = useNotification();
    const [formData, setFormData] = useState({
        schoolType: school?.schoolType || 'middle_school',
        institutionType: school?.institutionType || 'none'
    });
    const [impactAnalysis, setImpactAnalysis] = useState(null);
    const [analyzeLoading, setAnalyzeLoading] = useState(false);
    const [analyzed, setAnalyzed] = useState(false);
    const [error, setError] = useState(null);

    // Reset form when school changes
    useEffect(() => {
        if (school) {
            setFormData({
                schoolType: school.schoolType,
                institutionType: school.institutionType
            });
            setAnalyzed(false);
            setImpactAnalysis(null);
        }
    }, [school, open]);

    // Funzione helper per ottenere il conteggio degli studenti
    const getAffectedStudentsCount = async (classIds) => {
        if (!classIds || classIds.length === 0) return 0;
        
        try {
            // Utilizziamo il nuovo endpoint
            const response = await axiosInstance.get('/students/count', {
                params: {
                    classIds: classIds.join(',')
                }
            });
            
            return response.data.count || 0;
        } catch (error) {
            console.error('Error fetching affected students count:', error);
            return 0; // Fallback sicuro
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        // Reset institution type if school type changes to middle_school
        if (name === 'schoolType' && value === 'middle_school') {
            setFormData({
                schoolType: value,
                institutionType: 'none'
            });
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
        
        // Reset analysis when form changes
        setAnalyzed(false);
        setImpactAnalysis(null);
    };

    const analyzeImpact = async () => {
        try {
            setAnalyzeLoading(true);
            setError(null);
            
            if (!school) return;
            
            // Fetch school classes
            const classesResponse = await axiosInstance.get(`/classes/school/${school._id}`);
            const classes = classesResponse.data.classes || [];
            
            // Analyze impact based on requested changes
            let impactResult = {
                affectedClasses: [],
                warnings: [],
                info: []
            };
            
            // Case 1: Middle School to High School
            if (school.schoolType === 'middle_school' && formData.schoolType === 'high_school') {
                impactResult.info.push('Le classi avranno la possibilità di estendersi fino al 5° anno');
                impactResult.info.push(`Il tipo di istituto sarà impostato su "${formData.institutionType}"`);
            }
            
            // Case 2: High School to Middle School
            if (school.schoolType === 'high_school' && formData.schoolType === 'middle_school') {
                // Check for classes in years 4-5
                const highYearClasses = classes.filter(c => c.year > 3);
                if (highYearClasses.length > 0) {
                    // Get affected students count
                    const affectedStudents = await getAffectedStudentsCount(
                        highYearClasses.map(c => c._id)
                    );
                    
                    impactResult.warnings.push(`${highYearClasses.length} classi di 4° e 5° anno verranno disattivate`);
                    
                    if (affectedStudents > 0) {
                        impactResult.warnings.push(`${affectedStudents} studenti verranno rimossi dalle classi e contrassegnati come "trasferiti"`);
                    }
                    
                    impactResult.affectedClasses = highYearClasses.map(c => ({
                        id: c._id,
                        name: `${c.year}${c.section}`,
                        status: 'will_deactivate',
                        year: c.year,
                        section: c.section
                    }));
                }
                impactResult.info.push('Il tipo di istituto sarà impostato su "Nessuno"');
            }
            
            // Case 3: Only Institution Type Change
            if (school.schoolType === formData.schoolType && 
                school.institutionType !== formData.institutionType) {
                impactResult.info.push(`Il tipo di istituto verrà modificato da "${
                    school.institutionType === 'none' ? 'Nessuno' : school.institutionType
                }" a "${
                    formData.institutionType === 'none' ? 'Nessuno' : formData.institutionType
                }"`);
            }
            
            // If no specific impacts, show a generic message
            if (impactResult.warnings.length === 0 && impactResult.info.length === 0) {
                impactResult.info.push('Nessun impatto significativo sul sistema');
            }
            
            setImpactAnalysis(impactResult);
            setAnalyzed(true);
            
        } catch (error) {
            console.error('Error analyzing impact:', error);
            setError('Errore nell\'analisi dell\'impatto: ' + (error.message || 'Errore sconosciuto'));
        } finally {
            setAnalyzeLoading(false);
        }
    };

    const handleSubmit = async () => {
        try {
            if (!school) return;
            
            // Usa l'endpoint specializzato
            const response = await axiosInstance.post(`schools/${school._id}/change-type`, {
                schoolType: formData.schoolType,
                institutionType: formData.institutionType
            });
            
            if (response.data.status === 'success') {
                // Aggiorna lo stato locale
                showNotification('Tipo scuola modificato con successo', 'success');
                onClose();
            }
        } catch (error) {
            console.error('Error updating school type:', error);
            setError('Errore nell\'aggiornamento del tipo scuola: ' + (error.message || 'Errore sconosciuto'));
        }
    };

    const renderImpactAnalysis = () => {
        if (analyzeLoading) {
            return (
                <Box display="flex" justifyContent="center" alignItems="center" p={3}>
                    <CircularProgress size={40} />
                    <Typography sx={{ ml: 2 }}>Analisi in corso...</Typography>
                </Box>
            );
        }
        
        if (!impactAnalysis) return null;
        
        return (
            <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Analisi dell'Impatto
                </Typography>
                
                {impactAnalysis.warnings.length > 0 && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Attenzione:
                        </Typography>
                        <List dense disablePadding>
                            {impactAnalysis.warnings.map((warning, idx) => (
                                <ListItem key={idx} disablePadding>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <WarningIcon color="warning" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={warning} />
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                )}
                
                {impactAnalysis.info.length > 0 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Informazioni:
                        </Typography>
                        <List dense disablePadding>
                            {impactAnalysis.info.map((info, idx) => (
                                <ListItem key={idx} disablePadding>
                                    <ListItemIcon sx={{ minWidth: 30 }}>
                                        <CheckCircleIcon color="info" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText primary={info} />
                                </ListItem>
                            ))}
                        </List>
                    </Alert>
                )}
                
                {impactAnalysis.affectedClasses.length > 0 && (
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                            Classi interessate:
                        </Typography>
                        <List dense>
                            {impactAnalysis.affectedClasses.map((cls) => (
                                <ListItem key={cls.id}>
                                    <ListItemIcon>
                                        <BlockIcon color="error" />
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={`Classe ${cls.year}${cls.section}`}
                                        secondary={cls.status === 'will_deactivate' ? 'Verrà disattivata' : 'Verrà modificata'}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}
            </Box>
        );
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Modifica Tipo Scuola
            </DialogTitle>
            <DialogContent dividers>
                {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}
                
                <Box sx={{ mb: 3 }}>
                    <Typography gutterBottom>
                        La modifica del tipo di scuola può avere impatti significativi sulle classi esistenti.
                        Si prega di analizzare attentamente le conseguenze prima di procedere.
                    </Typography>
                </Box>
                
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth>
                            <InputLabel id="school-type-label">Tipo Scuola</InputLabel>
                            <Select
                                labelId="school-type-label"
                                name="schoolType"
                                value={formData.schoolType}
                                onChange={handleChange}
                                label="Tipo Scuola"
                            >
                                <MenuItem value="middle_school">Scuola Media</MenuItem>
                                <MenuItem value="high_school">Scuola Superiore</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth disabled={formData.schoolType === 'middle_school'}>
                            <InputLabel id="institution-type-label">Tipo Istituto</InputLabel>
                            <Select
                                labelId="institution-type-label"
                                name="institutionType"
                                value={formData.schoolType === 'middle_school' ? 'none' : formData.institutionType}
                                onChange={handleChange}
                                label="Tipo Istituto"
                            >
                                <MenuItem value="none">Nessuno</MenuItem>
                                <MenuItem value="scientific">Scientifico</MenuItem>
                                <MenuItem value="classical">Classico</MenuItem>
                                <MenuItem value="artistic">Artistico</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                    <Button
                        variant="outlined"
                        startIcon={analyzeLoading ? <CircularProgress size={20} /> : null}
                        onClick={analyzeImpact}
                        disabled={analyzeLoading || 
                                 (formData.schoolType === school?.schoolType && 
                                  formData.institutionType === school?.institutionType)}
                    >
                        {analyzeLoading ? 'Analisi in corso...' : 'Analizza Impatto'}
                    </Button>
                </Box>
                
                {renderImpactAnalysis()}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={onClose}>
                    Annulla
                </Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={handleSubmit}
                    disabled={loading || !analyzed || 
                             (formData.schoolType === school?.schoolType && 
                              formData.institutionType === school?.institutionType)}
                    startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                    {loading ? 'Salvataggio...' : 'Conferma Modifica'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default SchoolTypeChangeModal;