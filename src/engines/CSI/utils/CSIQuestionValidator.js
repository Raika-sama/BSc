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

    /**
     * Valida i dati di una domanda CSI
     * @param {Object} data - Dati da validare
     * @throws {Error} Se la validazione fallisce
     */
    static validate(data) {
        const errors = [];

        // Validazione campi obbligatori
        if (!this.validateRequired(data, errors)) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_INPUT,
                'Campi obbligatori mancanti',
                { details: errors }
            );
        }

        // Validazione categoria
        if (!this.validateCategory(data.categoria, errors)) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_CATEGORY,
                'Categoria non valida',
                { details: errors }
            );
        }

        // Validazione metadata
        if (!this.validateMetadata(data.metadata, errors)) {
            throw createError(
                ErrorTypes.VALIDATION.INVALID_METADATA,
                'Metadata non validi',
                { details: errors }
            );
        }

        return true;
    }

    /**
     * Valida i campi obbligatori
     * @private
     */
    static validateRequired(data, errors) {
        if (!data.testo || data.testo.trim().length === 0) {
            errors.push('Il testo è obbligatorio');
        }
        if (!data.categoria) {
            errors.push('La categoria è obbligatoria');
        }
        return errors.length === 0;
    }

    /**
     * Valida la categoria
     * @private
     */
    static validateCategory(category, errors) {
        if (!this.CATEGORIES.includes(category)) {
            errors.push(`Categoria deve essere una tra: ${this.CATEGORIES.join(', ')}`);
            return false;
        }
        return true;
    }

    /**
     * Valida i metadata
     * @private
     */
    static validateMetadata(metadata, errors) {
        if (!metadata) {
            errors.push('Metadata sono obbligatori');
            return false;
        }

        // Validazione polarità
        if (!metadata.polarity || !this.POLARITY_VALUES.includes(metadata.polarity)) {
            errors.push('Polarità deve essere + o -');
        }

        // Validazione peso
        if (metadata.weight !== undefined) {
            const weight = parseFloat(metadata.weight);
            if (isNaN(weight) || weight <= 0 || weight > 5) {
                errors.push('Il peso deve essere un numero tra 0 e 5');
            }
        }

        return errors.length === 0;
    }
}

// CSIQuestionService.js
class CSIQuestionService {
    // ... altri metodi ...

    /**
     * Crea una nuova domanda
     */
    async createQuestion(questionData) {
        try {
            // Valida i dati
            CSIQuestionValidator.validate(questionData);

            const formattedData = {
                ...questionData,
                metadata: {
                    polarity: questionData.metadata.polarity,
                    weight: questionData.metadata.weight || 1
                },
                active: questionData.active ?? true
            };

            return await this.repository.create(formattedData);
        } catch (error) {
            logger.error('Error creating question:', { error: error.message });
            throw error;
        }
    }

    /**
     * Aggiorna una domanda esistente
     */
    async updateQuestion(id, updateData) {
        try {
            // Valida i dati
            CSIQuestionValidator.validate(updateData);

            const formattedData = {
                testo: updateData.testo,
                categoria: updateData.categoria,
                metadata: {
                    polarity: updateData.metadata.polarity,
                    weight: updateData.metadata.weight
                },
                active: updateData.active
            };

            return await this.repository.update(id, formattedData);
        } catch (error) {
            logger.error('Error updating question:', { error: error.message });
            throw error;
        }
    }
}