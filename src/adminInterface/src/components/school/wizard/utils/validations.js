// src/adminInterface/src/components/school/wizard/utils/validations.js
export const validateStep1 = (formData) => {
    const errors = {};

    // Nome Scuola
    if (!formData.name) {
        errors.name = 'Il nome della scuola è obbligatorio';
    } else if (formData.name.length < 3) {
        errors.name = 'Il nome deve essere di almeno 3 caratteri';
    }

    // Tipo Scuola
    if (!formData.schoolType) {
        errors.schoolType = 'Il tipo di scuola è obbligatorio';
    }

    // Tipo Istituto
    if (formData.schoolType === 'high_school' && !formData.institutionType) {
        errors.institutionType = 'Il tipo di istituto è obbligatorio per le scuole superiori';
    }

    // Regione
    if (!formData.region) {
        errors.region = 'La regione è obbligatoria';
    }

    // Provincia
    if (!formData.province) {
        errors.province = 'La provincia è obbligatoria';
    }

    // Indirizzo
    if (!formData.address) {
        errors.address = 'L\'indirizzo è obbligatorio';
    }

    return errors;
};

export const validateStep2 = (formData) => {
    const errors = {};

    // Anno Accademico
    if (!formData.academicYear) {
        errors.academicYear = 'L\'anno accademico è obbligatorio';
    }

    // Data Inizio
    if (!formData.startDate) {
        errors.startDate = 'La data di inizio è obbligatoria';
    }

    // Data Fine
    if (!formData.endDate) {
        errors.endDate = 'La data di fine è obbligatoria';
    } else if (formData.startDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
    }

    // Numero massimo studenti
    if (!formData.defaultMaxStudentsPerClass) {
        errors.defaultMaxStudentsPerClass = 'Il numero massimo di studenti è obbligatorio';
    } else {
        const maxAllowed = formData.schoolType === 'middle_school' ? 30 : 35;
        if (formData.defaultMaxStudentsPerClass < 15 || formData.defaultMaxStudentsPerClass > maxAllowed) {
            errors.defaultMaxStudentsPerClass = `Il numero deve essere compreso tra 15 e ${maxAllowed}`;
        }
    }

    return errors;
};

export const validateStep3 = (formData) => {
    const errors = {};

    // Sezioni
    if (!formData.sections || formData.sections.length === 0) {
        errors.sections = 'È necessario configurare almeno una sezione';
    } else {
        // Validazione formato nome sezione
        const invalidSectionNames = formData.sections.filter(
            section => !/^[A-Z]$/.test(section.name)
        );
        if (invalidSectionNames.length > 0) {
            errors.sections = 'Le sezioni devono essere singole lettere maiuscole';
            return errors;
        }

        // Validazione numero studenti
        const maxAllowed = formData.schoolType === 'middle_school' ? 30 : 35;
        const invalidSections = formData.sections.filter(
            section => section.maxStudents < 15 || section.maxStudents > maxAllowed
        );

        if (invalidSections.length > 0) {
            errors.sections = `Tutte le sezioni devono avere un numero di studenti compreso tra 15 e ${maxAllowed}`;
        }
    }

    return errors;
};

export const isStepValid = (step, formData) => {
    switch (step) {
        case 0:
            return Object.keys(validateStep1(formData)).length === 0;
        case 1:
            return Object.keys(validateStep2(formData)).length === 0;
        case 2:
            return Object.keys(validateStep3(formData)).length === 0;
        case 3: // Step di riepilogo
            return true;
        default:
            return false;
    }
};