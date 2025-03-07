import React, { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2AcademicYear from './steps/Step2AcademicYear';
import Step3Sections from './steps/Step3Sections';
import Step4Review from './steps/Step4Review';
import { validateStep1, validateStep2, validateStep3, isStepValid } from './utils/validations';
import { useAuth } from '../../../context/AuthContext';
import { useClass } from '../../../context/ClassContext';
import { wizardStyles } from './styles/wizardStyles';

const getSchoolTypeLabel = (type) => {
    const types = {
        'middle_school': 'Scuola Media',
        'high_school': 'Scuola Superiore'
    };
    return types[type] || type;
};

const getInstitutionTypeLabel = (type) => {
    const types = {
        'scientific': 'Scientifico',
        'classical': 'Classico',
        'artistic': 'Artistico',
        'none': 'Nessuno'
    };
    return types[type] || type;
};

const steps = [
    'Informazioni Base',
    'Anno Accademico',
    'Sezioni',
    'Riepilogo'
];

const SchoolWizard = () => {
    const { createSchool } = useSchool();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const { createInitialClasses } = useClass();  // Aggiungi questo
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const { user } = useAuth();
    console.log('Current user data:', user);  // Aggiungi questo
    const [formData, setFormData] = useState({
        // Step 1: Basic Info
        name: '',
        schoolType: 'middle_school',
        institutionType: 'none',
        region: '',
        province: '',
        address: '',
        
        // Step 2: Academic Year
        academicYear: '',
        startDate: null,
        endDate: null,
        
        // Step 3: Sections
        sections: [],
        defaultMaxStudentsPerClass: 25
    });

    const validateCurrentStep = () => {
        let stepErrors = {};
        switch (activeStep) {
            case 0:
                stepErrors = validateStep1(formData);
                break;
            case 1:
                stepErrors = validateStep2(formData);
                break;
            case 2:
                stepErrors = validateStep3(formData);
                break;
            default:
                stepErrors = {};
        }
        setErrors(stepErrors);
        return Object.keys(stepErrors).length === 0;
    };

   

    const handleNext = () => {
        if (validateCurrentStep()) {
            if (activeStep === steps.length - 1) {
                setOpenConfirmDialog(true);
            } else {
                setActiveStep((prevStep) => prevStep + 1);
                setErrors({});
            }
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setErrors({});
    };

    const handleCancel = () => {
        if (Object.values(formData).some(value => 
            value && (typeof value === 'string' ? value.trim() !== '' : true)
        )) {
            setOpenCancelDialog(true);
        } else {
            navigate('/admin/schools');
        }
    };

    const handleSubmit = async () => {
        try {
            if (!validateFinalData()) {
                showNotification('Verifica i dati inseriti prima di procedere', 'error');
                return;
            }
            if (!user || !user._id) {
                showNotification('Errore: utente non autenticato', 'error');
                return;
            }
            setIsSubmitting(true);
            
            // Log dei dati delle sezioni prima della trasformazione
            console.log('Sezioni originali:', formData.sections);
    
            const numberOfYears = formData.schoolType === 'middle_school' ? 3 : 5;
            
            // Formattazione sezioni per la scuola
            const formattedSections = formData.sections.map(section => {
                console.log('Formattazione sezione:', section);
                return {
                    name: section.name.toUpperCase(),
                    isActive: true,
                    academicYears: [{
                        year: formData.academicYear,
                        status: 'active',
                        maxStudents: parseInt(section.maxStudents, 10)
                    }]
                };
            });
    
            console.log('Sezioni formattate:', formattedSections);
    
            // Preparazione dati scuola
            const schoolData = {
                name: formData.name,
                schoolType: formData.schoolType,
                institutionType: formData.institutionType,
                region: formData.region,
                province: formData.province,
                address: formData.address,
                numberOfYears: numberOfYears,
                academicYears: [{
                    year: formData.academicYear,
                    status: 'active',
                    startDate: formData.startDate,
                    endDate: formData.endDate
                }],
                sections: formattedSections,
                manager: user._id
            };
    
            console.log('Dati completi della scuola da inviare:', schoolData);
    
            // 1. Creazione scuola
            const schoolResult = await createSchool(schoolData);
            console.log('School creation response:', schoolResult);
    
            // 2. Preparazione dati per la creazione delle classi
            const classesSetupData = {
                schoolId: schoolResult._id,
                academicYear: formData.academicYear,
                mainTeacher: user._id,  // Aggiungiamo il mainTeacher
                sections: formData.sections.map(section => ({
                    name: section.name.toUpperCase(),
                    maxStudents: parseInt(section.maxStudents, 10),
                    mainTeacherId: user._id  // Aggiungiamo il mainTeacher anche qui

                }))
            };
    
            console.log('Dati per setup classi:', classesSetupData);
    
            // 3. Creazione classi
           // Creazione classi usando il context
           const classesResult = await createInitialClasses(classesSetupData);
           console.log('Classes creation response:', classesResult);

           showNotification('Scuola e classi create con successo!', 'success');
           navigate('/admin/schools');
    
        } catch (error) {
            console.error('Setup error:', {
                error,
                sections: formData.sections,
                validationErrors: error.response?.data?.error?.errors
            });
            
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore durante la configurazione della scuola';
            showNotification(errorMessage, 'error');
            
            if (error.response?.data?.error?.errors) {
                console.log('Validation errors:', error.response.data.error.errors);
                setErrors(error.response.data.error.errors);
            }
        } finally {
            setIsSubmitting(false);
            setOpenConfirmDialog(false);
        }
    };

    const updateFormData = (stepData) => {
        setFormData(prev => ({
            ...prev,
            ...stepData
        }));
        setErrors({});
    };

    const isNextButtonDisabled = () => {
        if (activeStep === steps.length - 1) return false;
        return !isStepValid(activeStep, formData);
    };

    const renderStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <Step1BasicInfo
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 1:
                return (
                    <Step2AcademicYear
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 2:
                return (
                    <Step3Sections
                        formData={formData}
                        onChange={updateFormData}
                        errors={errors}
                    />
                );
            case 3:
                return (
                    <Step4Review
                        formData={formData}
                    />
                );
            default:
                return null;
        }
    };

    const validateFinalData = () => {
        const errors = {};
    
        // Validazione informazioni base
        if (!formData.name?.trim()) {
            errors.name = 'Il nome della scuola è obbligatorio';
        } else if (formData.name.length < 3) {
            errors.name = 'Il nome della scuola deve essere di almeno 3 caratteri';
        }

        if (!formData.schoolType) {
            errors.schoolType = 'Il tipo di scuola è obbligatorio';
        }

        if (!formData.institutionType) {
            errors.institutionType = 'Il tipo di istituto è obbligatorio';
        }

        if (!formData.region?.trim()) {
            errors.region = 'La regione è obbligatoria';
        }

        if (!formData.province?.trim()) {
            errors.province = 'La provincia è obbligatoria';
        }

        if (!formData.address?.trim()) {
            errors.address = 'L\'indirizzo è obbligatorio';
        }

        // Validazione anno accademico
        if (!formData.academicYear) {
            errors.academicYear = 'L\'anno accademico è obbligatorio';
        } else if (!/^\d{4}\/\d{4}$/.test(formData.academicYear)) {
            errors.academicYear = 'L\'anno accademico deve essere nel formato YYYY/YYYY';
        } else {
            const [startYear, endYear] = formData.academicYear.split('/').map(Number);
            if (endYear !== startYear + 1) {
                errors.academicYear = 'L\'anno finale deve essere l\'anno successivo a quello iniziale';
            }
        }

        if (!formData.startDate) {
            errors.startDate = 'La data di inizio è obbligatoria';
        }

        if (!formData.endDate) {
            errors.endDate = 'La data di fine è obbligatoria';
        }

        // Validazione date
        if (formData.startDate && formData.endDate) {
            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);
            if (start >= end) {
                errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
            }
        }
    
        // Validazione sezioni
        if (!formData.sections || formData.sections.length === 0) {
            errors.sections = 'È necessario configurare almeno una sezione';
        } else {
            const invalidSections = formData.sections.filter(section => {
                return !section.name || !/^[A-Z]$/.test(section.name);
            });

            if (invalidSections.length > 0) {
                errors.sections = 'Tutte le sezioni devono avere un nome valido (lettera maiuscola A-Z)';
            }

            // Verifica duplicati
            const sectionNames = formData.sections.map(s => s.name);
            const uniqueNames = new Set(sectionNames);
            if (sectionNames.length !== uniqueNames.size) {
                errors.sections = 'Non possono esistere sezioni duplicate';
            }

            // Verifica limiti studenti
            const invalidStudentLimits = formData.sections.filter(section => {
                const max = parseInt(section.maxStudents);
                const defaultMax = parseInt(formData.defaultMaxStudentsPerClass);
                return isNaN(max) || max < 15 || max > (formData.schoolType === 'middle_school' ? 30 : 35) || max < defaultMax * 0.5 || max > defaultMax * 1.2;
            });

            if (invalidStudentLimits.length > 0) {
                errors.sections = 'I limiti di studenti per sezione non sono validi';
            }
        }

        // Validazione numero massimo studenti default
        const defaultMax = parseInt(formData.defaultMaxStudentsPerClass);
        if (isNaN(defaultMax) || defaultMax < 15 || defaultMax > (formData.schoolType === 'middle_school' ? 30 : 35)) {
            errors.defaultMaxStudentsPerClass = 'Il numero massimo di studenti per classe deve essere tra 15 e ' + 
                (formData.schoolType === 'middle_school' ? '30' : '35');
        }
    
        console.log('Risultato validazione:', errors);
        return Object.keys(errors).length === 0;
    };

    return (
        <Box sx={wizardStyles.wizardContainer}>
            <Paper sx={wizardStyles.paperWrapper}>
                <Typography variant="h4" gutterBottom>
                    Creazione Nuova Scuola
                </Typography>
                <Stepper 
                    activeStep={activeStep} 
                    sx={{ py: 3 }}
                    alternativeLabel
                >
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={wizardStyles.stepContent}>
                    {renderStepContent(activeStep)}
                    
                    <Box sx={wizardStyles.navigationButtons}>
                        <Button onClick={handleCancel}>
                            Annulla
                        </Button>
                        <Button
                            disabled={activeStep === 0}
                            onClick={handleBack}
                        >
                            Indietro
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleNext}
                            disabled={isSubmitting || isNextButtonDisabled()}
                        >
                            {isSubmitting ? (
                                <CircularProgress size={24} color="inherit" />
                            ) : (
                                activeStep === steps.length - 1 ? 'Completa' : 'Avanti'
                            )}
                        </Button>
                    </Box>
                </Box>
            </Paper>

            {/* Dialog di conferma creazione */}
            <Dialog 
                open={openConfirmDialog} 
                onClose={() => !isSubmitting && setOpenConfirmDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>
                    {isSubmitting ? 'Creazione in corso...' : 'Conferma Creazione Scuola'}
                </DialogTitle>
                <DialogContent>
                    {isSubmitting ? (
                        <Box sx={{ p: 3, textAlign: 'center' }}>
                            <CircularProgress sx={{ mb: 2 }} />
                            <Typography>
                                Creazione della scuola in corso...
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            <Alert 
                                severity="warning" 
                                sx={wizardStyles.alertWrapper}
                            >
                                Stai per creare una nuova scuola con le seguenti caratteristiche:
                            </Alert>
                            <Box sx={{ mb: 2, mt: 2 }}>
                                <Typography variant="subtitle2" gutterBottom>
                                    • {formData.name} ({getSchoolTypeLabel(formData.schoolType)})
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>
                                    • Anno accademico {formData.academicYear}
                                </Typography>
                                <Typography variant="subtitle2" gutterBottom>
                                    • {formData.sections.length} sezioni configurate
                                </Typography>
                            </Box>
                            <Typography 
                                color="text.secondary" 
                                variant="body2"
                                sx={wizardStyles.alertWrapper}
                            >
                                Controlla che tutti i dati siano corretti prima di procedere.
                                Una volta creata la scuola, alcuni dati non potranno essere modificati.
                            </Typography>
                            {Object.keys(errors).length > 0 && (
                                <Alert 
                                    severity="error" 
                                    sx={wizardStyles.alertWrapper}
                                >
                                    Ci sono ancora degli errori da correggere prima di poter procedere.
                                </Alert>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button 
                        onClick={() => setOpenConfirmDialog(false)}
                        disabled={isSubmitting}
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting || Object.keys(errors).length > 0}
                        color="primary"
                        startIcon={isSubmitting && <CircularProgress size={20} color="inherit" />}
                    >
                        {isSubmitting ? 'Creazione in corso...' : 'Conferma Creazione'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di conferma annullamento */}
            <Dialog 
                open={openCancelDialog} 
                onClose={() => setOpenCancelDialog(false)}
            >
                <DialogTitle>Conferma Annullamento</DialogTitle>
                <DialogContent>
                    <Alert severity="warning" sx={{ mt: 1 }}>
                        Sei sicuro di voler annullare? Tutti i dati inseriti andranno persi.
                    </Alert>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCancelDialog(false)}>
                        No
                    </Button>
                    <Button 
                        onClick={() => navigate('/admin/schools')}
                        color="error"
                        variant="contained"
                    >
                        Sì, annulla
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolWizard;