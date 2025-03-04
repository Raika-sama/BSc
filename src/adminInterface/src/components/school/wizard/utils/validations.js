// src/adminInterface/src/components/school/wizard/utils/validations.js
export const validateStep1 = (formData) => {
    const errors = {};

    // Nome scuola
    if (!formData.name?.trim()) {
        errors.name = 'Il nome della scuola è obbligatorio';
    } else if (formData.name.length < 3) {
        errors.name = 'Il nome della scuola deve essere di almeno 3 caratteri';
    }

    // Tipo scuola
    if (!formData.schoolType) {
        errors.schoolType = 'Il tipo di scuola è obbligatorio';
    }

    // Tipo istituto
    if (!formData.institutionType) {
        errors.institutionType = 'Il tipo di istituto è obbligatorio';
    }

    // Regione
    if (!formData.region?.trim()) {
        errors.region = 'La regione è obbligatoria';
    }

    // Provincia
    if (!formData.province?.trim()) {
        errors.province = 'La provincia è obbligatoria';
    }

    // Indirizzo
    if (!formData.address?.trim()) {
        errors.address = 'L\'indirizzo è obbligatorio';
    }

    return errors;
};

export const validateStep2 = (formData) => {
    const errors = {};

    // Anno accademico
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

    // Date
    if (!formData.startDate) {
        errors.startDate = 'La data di inizio è obbligatoria';
    }

    if (!formData.endDate) {
        errors.endDate = 'La data di fine è obbligatoria';
    }

    if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        if (start >= end) {
            errors.endDate = 'La data di fine deve essere successiva alla data di inizio';
        }

        // Verifica che le date siano coerenti con l'anno accademico
        if (formData.academicYear) {
            const [startYear] = formData.academicYear.split('/').map(Number);
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);

            if (startDate.getFullYear() !== startYear) {
                errors.startDate = 'L\'anno della data di inizio deve coincidere con l\'anno accademico';
            }

            if (endDate.getFullYear() !== startYear + 1) {
                errors.endDate = 'L\'anno della data di fine deve essere l\'anno successivo';
            }
        }
    }

    return errors;
};

export const validateStep3 = (formData) => {
    const errors = {};
    
    // Validazione numero massimo studenti default
    const defaultMax = parseInt(formData.defaultMaxStudentsPerClass);
    if (isNaN(defaultMax) || defaultMax < 15 || defaultMax > (formData.schoolType === 'middle_school' ? 30 : 35)) {
        errors.defaultMaxStudentsPerClass = 'Il numero massimo di studenti per classe deve essere tra 15 e ' + 
            (formData.schoolType === 'middle_school' ? '30' : '35');
    }

    // Validazione sezioni
    if (!formData.sections || formData.sections.length === 0) {
        errors.sections = 'È necessario configurare almeno una sezione';
        return errors;
    }

    let sectionsErrors = [];
    const sectionNames = new Set();

    formData.sections.forEach((section, index) => {
        const sectionErrors = {};

        // Validazione nome sezione
        if (!section.name) {
            sectionErrors.name = 'Il nome della sezione è obbligatorio';
        } else if (!/^[A-Z]$/.test(section.name)) {
            sectionErrors.name = 'Il nome deve essere una singola lettera maiuscola (A-Z)';
        } else if (sectionNames.has(section.name)) {
            sectionErrors.name = 'Questa sezione esiste già';
        }
        sectionNames.add(section.name);

        // Validazione numero massimo studenti
        const maxStudents = parseInt(section.maxStudents);
        const maxLimit = formData.schoolType === 'middle_school' ? 30 : 35;

        if (isNaN(maxStudents) || maxStudents < 15 || maxStudents > maxLimit) {
            sectionErrors.maxStudents = `Il numero di studenti deve essere tra 15 e ${maxLimit}`;
        } else if (maxStudents < defaultMax * 0.5) {
            sectionErrors.maxStudents = 'Il numero non può essere inferiore al 50% del valore di default';
        } else if (maxStudents > defaultMax * 1.2) {
            sectionErrors.maxStudents = 'Il numero non può superare del 20% il valore di default';
        }

        if (Object.keys(sectionErrors).length > 0) {
            sectionsErrors[index] = sectionErrors;
        }
    });

    if (Object.keys(sectionsErrors).length > 0) {
        errors.sections = sectionsErrors;
    }

    return errors;
};

export const isStepValid = (step, formData) => {
    let validationErrors;
    switch (step) {
        case 0:
            validationErrors = validateStep1(formData);
            break;
        case 1:
            validationErrors = validateStep2(formData);
            break;
        case 2:
            validationErrors = validateStep3(formData);
            break;
        default:
            return true;
    }
    return Object.keys(validationErrors).length === 0;
};