// utils/validators/CSIQuestionValidator.js
const { createError, ErrorTypes } = require('../../../utils/errors/errorTypes');

class CSIQuestionValidator {
    static CATEGORIES = [
        'Elaborazione',
        'Creatività',
        'Preferenza Visiva',
        'Decisione',
        'Autonomia'
    ];

    static POLARITY_VALUES = ['+', '-'];
    static DIFFICULTY_LEVELS = ['facile', 'medio', 'difficile'];

    /**
     * Valida i dati di una domanda CSI
     * @param {Object} data - Dati da validare
     * @returns {Object} - {isValid: boolean, errors: string[]}
     * @throws {Error} Se la validazione fallisce
     */
    static validate(data) {
        const errors = [];

        try {
            // Validazione campi obbligatori
            this.validateRequired(data, errors);

            // Validazione categoria
            this.validateCategory(data.categoria, errors);

            // Validazione metadata
            this.validateMetadata(data.metadata, errors);

            // Se ci sono errori, lancia l'eccezione
            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Validazione fallita',
                    { details: errors }
                );
            }

            return {
                isValid: true,
                errors: []
            };
        } catch (error) {
            if (error.type) {
                throw error; // Rilancia gli errori già formattati
            }
            return {
                isValid: false,
                errors
            };
        }
    }

    /**
     * Valida i dati per l'aggiornamento di una domanda (campi parziali)
     * @param {Object} data - Dati da validare
     * @returns {Object} - {isValid: boolean, errors: string[]}
     */
    static validateUpdate(data) {
        const errors = [];

        try {
            // Valida solo i campi presenti
            if (data.testo !== undefined) {
                if (!data.testo || data.testo.trim().length < 10) {
                    errors.push('Il testo deve essere di almeno 10 caratteri');
                }
            }

            if (data.categoria !== undefined) {
                this.validateCategory(data.categoria, errors);
            }

            if (data.metadata) {
                this.validateMetadata(data.metadata, errors, true);
            }

            if (errors.length > 0) {
                throw createError(
                    ErrorTypes.VALIDATION.INVALID_INPUT,
                    'Validazione aggiornamento fallita',
                    { details: errors }
                );
            }

            return {
                isValid: true,
                errors: []
            };
        } catch (error) {
            if (error.type) {
                throw error;
            }
            return {
                isValid: false,
                errors
            };
        }
    }

    /**
     * Valida i campi obbligatori
     * @private
     */
    static validateRequired(data, errors) {
        if (!data.testo || data.testo.trim().length < 10) {
            errors.push('Il testo deve essere di almeno 10 caratteri');
        }
        if (!data.categoria) {
            errors.push('La categoria è obbligatoria');
        }
        if (!data.metadata) {
            errors.push('I metadata sono obbligatori');
        }
        return errors.length === 0;
    }

    /**
     * Valida la categoria
     * @private
     */
    static validateCategory(category, errors) {
        if (!this.CATEGORIES.includes(category)) {
            errors.push(`La categoria deve essere una tra: ${this.CATEGORIES.join(', ')}`);
            return false;
        }
        return true;
    }

    /**
     * Valida i metadata
     * @private
     * @param {boolean} isPartial - Se true, valida solo i campi presenti
     */
    static validateMetadata(metadata, errors, isPartial = false) {
        if (!metadata && !isPartial) {
            errors.push('I metadata sono obbligatori');
            return false;
        }

        if (metadata) {
            // Validazione polarità
            if (metadata.polarity !== undefined && !this.POLARITY_VALUES.includes(metadata.polarity)) {
                errors.push('La polarità deve essere "+" o "-"');
            }

            // Validazione peso
            if (metadata.weight !== undefined) {
                const weight = parseFloat(metadata.weight);
                if (isNaN(weight) || weight < 0.1 || weight > 5) {
                    errors.push('Il peso deve essere un numero tra 0.1 e 5');
                }
            }

            // Validazione difficoltà
            if (metadata.difficultyLevel !== undefined && 
                !this.DIFFICULTY_LEVELS.includes(metadata.difficultyLevel)) {
                errors.push(`Il livello di difficoltà deve essere uno tra: ${this.DIFFICULTY_LEVELS.join(', ')}`);
            }

            // Validazione tags
            if (metadata.tags !== undefined && !Array.isArray(metadata.tags)) {
                errors.push('I tags devono essere un array');
            }
        }

        return errors.length === 0;
    }
}

module.exports = CSIQuestionValidator;