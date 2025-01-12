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
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSchool } from '../../../context/SchoolContext';
import { useNotification } from '../../../context/NotificationContext';
import Step1BasicInfo from './steps/Step1BasicInfo';
import Step2AcademicYear from './steps/Step2AcademicYear';
import Step3Sections from './steps/Step3Sections';
import Step4Review from './steps/Step4Review';
import { validateStep1, validateStep2, validateStep3, isStepValid } from './utils/validations';

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

    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    
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
    
            setIsSubmitting(true);
            
            // Log dei dati delle sezioni prima della trasformazione
            console.log('Sezioni originali:', formData.sections);
    
            const numberOfYears = formData.schoolType === 'middle_school' ? 3 : 5;
            
            // Assicuriamoci che le sezioni siano nel formato corretto
            const formattedSections = formData.sections.map(section => {
                console.log('Formattazione sezione:', section);
                return {
                    name: section.name.toUpperCase(), // Forziamo lettere maiuscole
                    isActive: true,
                    academicYears: [{
                        year: formData.academicYear,
                        status: 'active',
                        maxStudents: parseInt(section.maxStudents, 10)
                    }]
                };
            });
    
            console.log('Sezioni formattate:', formattedSections);
    
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
                sections: formattedSections
            };
    
            console.log('Dati completi della scuola da inviare:', schoolData);
    
            const result = await createSchool(schoolData);
            console.log('School creation response:', result);
    
            showNotification('Scuola creata con successo!', 'success');
            navigate('/admin/schools');
        } catch (error) {
            console.error('School creation error:', {
                error,
                sections: formData.sections,
                validationErrors: error.response?.data?.error?.errors
            });
            
            const errorMessage = error.response?.data?.error?.message || 
                               'Errore durante la creazione della scuola';
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
    
        // Validazione base
        if (!formData.name?.trim()) errors.name = 'Il nome della scuola è obbligatorio';
        if (!formData.schoolType) errors.schoolType = 'Il tipo di scuola è obbligatorio';
        if (!formData.region?.trim()) errors.region = 'La regione è obbligatoria';
        if (!formData.province?.trim()) errors.province = 'La provincia è obbligatoria';
        if (!formData.address?.trim()) errors.address = 'L\'indirizzo è obbligatorio';
    
        // Validazione sezioni
        if (!formData.sections || formData.sections.length === 0) {
            errors.sections = 'È necessario configurare almeno una sezione';
        } else {
            console.log('Validazione sezioni:', formData.sections);
            
            const invalidSections = formData.sections.filter(section => {
                const isValid = /^[A-Z]$/.test(section.name);
                console.log('Validazione sezione:', {
                    name: section.name,
                    isValid: isValid,
                    pattern: /^[A-Z]$/
                });
                return !isValid;
            });
    
            if (invalidSections.length > 0) {
                console.log('Sezioni non valide trovate:', invalidSections);
                errors.sections = 'Le sezioni devono essere lettere maiuscole';
            }
        }
    
        console.log('Risultato validazione:', errors);
        return Object.keys(errors).length === 0;
    
        // Validazione anno accademico
        if (!formData.academicYear) {
            errors.academicYear = 'L\'anno accademico è obbligatorio';
        }
    
        // Validazione numero anni in base al tipo di scuola
        const numberOfYears = formData.schoolType === 'middle_school' ? 3 : 5;
        if (numberOfYears !== (formData.schoolType === 'middle_school' ? 3 : 5)) {
            errors.numberOfYears = `La scuola ${formData.schoolType === 'middle_school' ? 'media' : 'superiore'} deve avere ${numberOfYears} anni`;
        }
    
        return Object.keys(errors).length === 0;
    };

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Creazione Nuova Scuola
                </Typography>
                <Stepper activeStep={activeStep} sx={{ py: 3 }}>
                    {steps.map((label) => (
                        <Step key={label}>
                            <StepLabel>{label}</StepLabel>
                        </Step>
                    ))}
                </Stepper>

                <Box sx={{ mt: 4 }}>
                    {renderStepContent(activeStep)}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
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
            <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
                <DialogTitle>Conferma Creazione Scuola</DialogTitle>
                <DialogContent>
                    Sei sicuro di voler creare la scuola con i dati inseriti?
                </DialogContent>
                <DialogActions>
                    <Button 
                        onClick={() => setOpenConfirmDialog(false)}
                        disabled={isSubmitting}
                    >
                        Annulla
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Creazione in corso...' : 'Conferma'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog di conferma annullamento */}
            <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                <DialogTitle>Conferma Annullamento</DialogTitle>
                <DialogContent>
                    Sei sicuro di voler annullare? Tutti i dati inseriti andranno persi.
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCancelDialog(false)}>
                        No
                    </Button>
                    <Button 
                        onClick={() => navigate('/admin/schools')}
                        color="error"
                    >
                        Sì, annulla
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default SchoolWizard;