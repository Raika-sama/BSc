import React, { useState } from 'react';
import {
    Box,
    Stepper,
    Step,
    StepLabel,
    Button,
    Typography,
    Paper
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
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
    const [activeStep, setActiveStep] = useState(0);
    const [errors, setErrors] = useState({});
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
    const navigate = useNavigate();

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
            setActiveStep((prevStep) => prevStep + 1);
            setErrors({});
        }
    };

    const handleBack = () => {
        setActiveStep((prevStep) => prevStep - 1);
        setErrors({});
    };

    const handleCancel = () => {
        navigate('/admin/schools');
    };

    const updateFormData = (stepData) => {
        setFormData(prev => ({
            ...prev,
            ...stepData
        }));
        // Reset errors when data changes
        setErrors({});
    };

    const isNextButtonDisabled = () => {
        if (activeStep === steps.length - 1) return false; // Review step
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
                            disabled={isNextButtonDisabled()}
                        >
                            {activeStep === steps.length - 1 ? 'Completa' : 'Avanti'}
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Box>
    );
};

export default SchoolWizard;